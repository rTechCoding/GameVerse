/**
 * PlaySphere Real-Time Multiplayer System with Custom Player Names
 * Supports Shareable Game Links & 6-Character Game Codes.
 * Real-time cross-device synchronization via WebRTC (PeerJS with Google STUN)
 * with BroadcastChannel & LocalStorage fallback.
 */

class MultiplayerManager {
  constructor() {
    this.isHost = false;
    this.roomCode = null;
    this.gameType = null; // 'ludo' | 'tictactoe' | 'chess'
    this.hostName = 'Player 1';
    this.hostAvatar = '🥷';
    this.guestName = 'Player 2';
    this.guestAvatar = '🦊';
    this.peer = null;
    this.conn = null;
    this.channel = null;
    this.connected = false;
    this.localPlayerSlot = 1; // 1 = Host, 2 = Guest
    this.onActionReceived = null;
    this.onPlayerJoined = null;
    this.onHostAcknowledged = null;
    this.onMatchStarted = null;
    this.onStatusChange = null;
    this.heartbeatInterval = null;
    this.retryCount = 0;
    this.maxRetries = 10;

    this.initBroadcastChannel();
    this.checkUrlForRoom();
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getCleanCode(code) {
    return (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
  }

  getShareableLink(roomCode, gameType, hostName) {
    const url = new URL(window.location.href);
    url.searchParams.set('game', gameType || this.gameType || 'ludo');
    url.searchParams.set('room', roomCode || this.roomCode);
    if (hostName || this.hostName) {
      url.searchParams.set('host', hostName || this.hostName);
    }
    return url.toString();
  }

  initBroadcastChannel() {
    try {
      this.channel = new BroadcastChannel('playsphere_sync_channel');
      this.channel.onmessage = (event) => {
        this.handleIncomingMessage(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported, using storage fallback', e);
    }

    // Fallback cross-tab localStorage event listener (for same-browser testing)
    window.addEventListener('storage', (e) => {
      if (e.key === 'playsphere_remote_action' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          this.handleIncomingMessage(data);
        } catch (err) {}
      }
    });
  }

  checkUrlForRoom() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const game = params.get('game') || 'ludo';
    const host = params.get('host') || 'Friend';
    if (room) {
      const tryOpen = (retries = 0) => {
        if (window.app && typeof window.app.openJoinGameWithNameModal === 'function') {
          window.app.openJoinGameWithNameModal(this.getCleanCode(room), game, host);
        } else if (retries < 15) {
          setTimeout(() => tryOpen(retries + 1), 150);
        }
      };
      setTimeout(() => tryOpen(0), 200);
    }
  }

  createRoom(gameType, hostName, hostAvatar) {
    this.leaveRoom();

    this.isHost = true;
    this.localPlayerSlot = 1;
    this.gameType = gameType;
    this.roomCode = this.generateRoomCode();
    this.hostName = hostName || window.gameStorage?.getProfile()?.name || 'Host';
    this.hostAvatar = hostAvatar || window.gameStorage?.getProfile()?.avatar || '🥷';
    this.guestName = 'Player 2';
    this.guestAvatar = '🦊';
    this.connected = false;

    const hostPeerId = `playsphere-${this.roomCode}-host`;
    this.initPeerConnection(hostPeerId, (assignedId) => {
      console.log(`[Multiplayer] Host room created with Peer ID: ${assignedId}`);
      if (this.onStatusChange) {
        this.onStatusChange({
          status: 'waiting',
          roomCode: this.roomCode,
          gameType: this.gameType,
          hostName: this.hostName,
          isHost: true,
          shareLink: this.getShareableLink(this.roomCode, this.gameType, this.hostName)
        });
      }
    });

    const shareLink = this.getShareableLink(this.roomCode, this.gameType, this.hostName);

    return {
      roomCode: this.roomCode,
      shareLink,
      hostName: this.hostName,
      hostAvatar: this.hostAvatar
    };
  }

  joinRoom(roomCode, gameType, guestName, hostName = 'Host', guestAvatar = '🦊') {
    this.leaveRoom();

    this.isHost = false;
    this.localPlayerSlot = 2;
    this.gameType = gameType;
    this.roomCode = this.getCleanCode(roomCode);
    this.guestName = guestName || window.gameStorage?.getProfile()?.name || 'Guest';
    this.guestAvatar = guestAvatar || window.gameStorage?.getProfile()?.avatar || '🦊';
    this.hostName = hostName;
    this.connected = false;
    this.retryCount = 0;

    const guestPeerId = `playsphere-${this.roomCode}-guest-${Date.now().toString(36)}`;

    // Wait for the guest's peer to register with the signaling server before attempting to connect to host!
    this.initPeerConnection(guestPeerId, (assignedId) => {
      if (assignedId) {
        console.log(`[Multiplayer] Guest peer ready (${assignedId}), connecting to host...`);
        this.connectToHost();
      }
    });

    // Also broadcast to local channel (for same-device multi-tab testing)
    this.broadcast({
      type: 'PLAYER_JOINED',
      roomCode: this.roomCode,
      gameType: this.gameType,
      guestName: this.guestName,
      guestAvatar: this.guestAvatar,
      hostName: this.hostName
    });

    if (this.onStatusChange) {
      this.onStatusChange({
        status: 'joining',
        roomCode: this.roomCode,
        gameType: this.gameType,
        guestName: this.guestName,
        isHost: false
      });
    }
  }

  initPeerConnection(peerId, onOpenCallback) {
    if (typeof Peer === 'undefined') {
      console.warn('[Multiplayer] PeerJS library not loaded, using local cross-tab fallback');
      if (onOpenCallback) onOpenCallback(null);
      return;
    }

    try {
      if (this.peer && !this.peer.destroyed) {
        try { this.peer.destroy(); } catch (e) {}
      }

      this.peer = new Peer(peerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        console.log(`[Multiplayer] Peer connected to signaling server with ID: ${id}`);
        if (onOpenCallback) onOpenCallback(id);
      });

      this.peer.on('connection', (conn) => {
        console.log(`[Multiplayer] Host received connection from peer: ${conn.peer}`);
        this.conn = conn;
        this.setupConnectionHandlers();
      });

      this.peer.on('error', (err) => {
        console.warn('[Multiplayer] Peer error:', err.type, err.message);
        if (err.type === 'peer-unavailable') {
          // Host not ready or temporary signaling lag: auto retry connecting
          if (!this.isHost && this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`[Multiplayer] Host not yet available. Retrying connection (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.connectToHost(), 1500);
          }
        }
      });
    } catch (e) {
      console.warn('[Multiplayer] PeerJS initialization error:', e);
      if (onOpenCallback) onOpenCallback(null);
    }
  }

  connectToHost() {
    if (!this.peer || this.peer.destroyed) return;
    try {
      const hostId = `playsphere-${this.roomCode}-host`;
      console.log(`[Multiplayer] Connecting to host peer ${hostId}...`);
      this.conn = this.peer.connect(hostId, { reliable: true });
      this.setupConnectionHandlers();
    } catch (e) {
      console.warn('[Multiplayer] connectToHost failed:', e);
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.connectToHost(), 1500);
      }
    }
  }

  setupConnectionHandlers() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      console.log('[Multiplayer] WebRTC DataChannel successfully OPENED between devices!');
      this.connected = true;
      this.startHeartbeat();

      if (this.onStatusChange) {
        this.onStatusChange({ status: 'connected', roomCode: this.roomCode });
      }

      if (!this.isHost) {
        // Send handshake from guest to host
        this.sendAction('PLAYER_JOINED', {
          roomCode: this.roomCode,
          guestName: this.guestName,
          guestAvatar: this.guestAvatar,
          hostName: this.hostName
        });
      } else {
        if (this.onPlayerJoined) {
          this.onPlayerJoined(this.guestName, this.guestAvatar);
        }
      }
    });

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data);
    });

    this.conn.on('close', () => {
      console.log('[Multiplayer] WebRTC connection closed');
      this.connected = false;
      this.stopHeartbeat();
      if (this.onStatusChange) {
        this.onStatusChange({ status: 'disconnected', roomCode: this.roomCode });
      }
    });

    this.conn.on('error', (err) => {
      console.warn('[Multiplayer] Connection error:', err);
    });
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.conn && this.conn.open) {
        try {
          this.conn.send({ action: 'PING', roomCode: this.roomCode, timestamp: Date.now() });
        } catch (e) {}
      }
    }, 8000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendStartMatch() {
    this.sendAction('START_ONLINE_MATCH', {
      gameType: this.gameType,
      hostName: this.hostName,
      hostAvatar: this.hostAvatar,
      guestName: this.guestName,
      guestAvatar: this.guestAvatar,
      roomCode: this.roomCode
    });
  }

  sendAction(action, payload = {}) {
    const message = {
      roomCode: this.roomCode,
      senderSlot: this.localPlayerSlot,
      action,
      payload,
      timestamp: Date.now()
    };

    if (this.conn && this.conn.open) {
      try {
        this.conn.send(message);
      } catch (e) {
        console.warn('[Multiplayer] Failed to send over WebRTC:', e);
      }
    }

    this.broadcast(message);
  }

  broadcast(message) {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {}
    }
    try {
      localStorage.setItem('playsphere_remote_action', JSON.stringify(message));
    } catch (e) {}
  }

  handleIncomingMessage(data) {
    if (!data || !this.roomCode) return;
    if (data.roomCode !== this.roomCode) return;
    if (data.senderSlot === this.localPlayerSlot) return;

    if (data.action === 'PING') return;

    if (data.type === 'PLAYER_JOINED' || data.action === 'PLAYER_JOINED') {
      const payload = data.payload || data;
      this.connected = true;
      if (payload.guestName) this.guestName = payload.guestName;
      if (payload.guestAvatar) this.guestAvatar = payload.guestAvatar;
      if (this.isHost) {
        this.sendAction('HOST_ACK', {
          gameType: this.gameType,
          hostName: this.hostName,
          hostAvatar: this.hostAvatar,
          guestName: this.guestName,
          guestAvatar: this.guestAvatar
        });
        if (this.onPlayerJoined) this.onPlayerJoined(this.guestName, this.guestAvatar);
      }
      return;
    }

    if (data.action === 'HOST_ACK') {
      this.connected = true;
      if (data.payload?.hostName) this.hostName = data.payload.hostName;
      if (data.payload?.hostAvatar) this.hostAvatar = data.payload.hostAvatar;
      if (data.payload?.guestName) this.guestName = data.payload.guestName;
      if (this.onHostAcknowledged) this.onHostAcknowledged(this.hostName, this.hostAvatar);
      return;
    }

    if (data.action === 'START_ONLINE_MATCH') {
      console.log('[Multiplayer] Host launched the online match!', data.payload);
      if (this.onMatchStarted) {
        this.onMatchStarted(data.payload);
      }
      return;
    }

    if (this.onActionReceived) {
      this.onActionReceived(data.action, data.payload);
    }
  }

  leaveRoom() {
    this.stopHeartbeat();
    this.roomCode = null;
    this.connected = false;
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }
}

window.multiplayerManager = new MultiplayerManager();
