/**
 * PlaySphere Real-Time Multiplayer System with Custom Player Names
 * Supports Shareable Game Links & 6-Character Game Codes.
 * Real-time synchronization via WebRTC (PeerJS) with BroadcastChannel & LocalStorage fallback.
 */

class MultiplayerManager {
  constructor() {
    this.isHost = false;
    this.roomCode = null;
    this.gameType = null; // 'ludo' | 'tictactoe' | 'chess'
    this.hostName = 'Player 1';
    this.guestName = 'Player 2';
    this.peer = null;
    this.conn = null;
    this.channel = null;
    this.connected = false;
    this.localPlayerSlot = 1; // 1 = Host, 2 = Guest
    this.onActionReceived = null;
    this.onPlayerJoined = null;
    this.onStatusChange = null;

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
      console.warn('BroadcastChannel not supported, falling back to localStorage events', e);
    }

    // Fallback cross-tab localStorage event listener
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
    const game = params.get('game');
    const host = params.get('host') || 'Friend';
    if (room && game) {
      setTimeout(() => {
        if (window.app) {
          window.app.openJoinGameWithNameModal(room.toUpperCase(), game, host);
        }
      }, 500);
    }
  }

  createRoom(gameType, hostName) {
    this.isHost = true;
    this.localPlayerSlot = 1;
    this.gameType = gameType;
    this.roomCode = this.generateRoomCode();
    this.hostName = hostName || window.gameStorage.getProfile().name || 'Host';
    this.guestName = 'Player 2';
    this.connected = false;

    this.initPeerConnection(`playsphere-${this.roomCode}-host`);

    const shareLink = this.getShareableLink(this.roomCode, this.gameType, this.hostName);

    if (this.onStatusChange) {
      this.onStatusChange({
        status: 'waiting',
        roomCode: this.roomCode,
        gameType: this.gameType,
        hostName: this.hostName,
        isHost: true,
        shareLink
      });
    }

    return {
      roomCode: this.roomCode,
      shareLink,
      hostName: this.hostName
    };
  }

  joinRoom(roomCode, gameType, guestName, hostName = 'Host') {
    this.isHost = false;
    this.localPlayerSlot = 2;
    this.gameType = gameType;
    this.roomCode = roomCode.toUpperCase().trim();
    this.guestName = guestName || window.gameStorage.getProfile().name || 'Guest';
    this.hostName = hostName;
    this.connected = false;

    this.initPeerConnection(`playsphere-${this.roomCode}-guest-${Date.now().toString(36)}`);
    this.connectToHost();

    // Broadcast join event
    this.broadcast({
      type: 'PLAYER_JOINED',
      roomCode: this.roomCode,
      gameType: this.gameType,
      guestName: this.guestName,
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

  initPeerConnection(peerId) {
    if (typeof Peer === 'undefined') {
      console.log('PeerJS CDN not loaded, using local cross-tab BroadcastChannel sync');
      return;
    }

    try {
      if (this.peer) this.peer.destroy();
      this.peer = new Peer(peerId, { debug: 1 });

      this.peer.on('connection', (conn) => {
        this.conn = conn;
        this.setupConnectionHandlers();
        this.connected = true;
        if (this.isHost && this.onPlayerJoined) {
          this.onPlayerJoined(this.guestName);
        }
      });
    } catch (e) {
      console.warn('PeerJS init failed:', e);
    }
  }

  connectToHost() {
    if (!this.peer) return;
    try {
      const hostId = `playsphere-${this.roomCode}-host`;
      this.conn = this.peer.connect(hostId, { reliable: true });
      this.setupConnectionHandlers();
    } catch (e) {
      console.warn('Could not connect to host peer:', e);
    }
  }

  setupConnectionHandlers() {
    if (!this.conn) return;

    this.conn.on('open', () => {
      this.connected = true;
      if (this.onStatusChange) {
        this.onStatusChange({ status: 'connected', roomCode: this.roomCode });
      }
      if (this.onPlayerJoined) {
        this.onPlayerJoined(this.isHost ? this.guestName : this.hostName);
      }
    });

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data);
    });

    this.conn.on('close', () => {
      this.connected = false;
      if (this.onStatusChange) {
        this.onStatusChange({ status: 'disconnected', roomCode: this.roomCode });
      }
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
      this.conn.send(message);
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

    if (data.type === 'PLAYER_JOINED') {
      this.connected = true;
      if (data.guestName) this.guestName = data.guestName;
      if (this.isHost) {
        this.sendAction('HOST_ACK', {
          gameType: this.gameType,
          hostName: this.hostName,
          guestName: this.guestName
        });
        if (this.onPlayerJoined) this.onPlayerJoined(this.guestName);
      }
      return;
    }

    if (data.action === 'HOST_ACK') {
      this.connected = true;
      if (data.payload.hostName) this.hostName = data.payload.hostName;
      if (data.payload.guestName) this.guestName = data.payload.guestName;
      if (this.onPlayerJoined) this.onPlayerJoined(this.hostName);
      return;
    }

    if (this.onActionReceived) {
      this.onActionReceived(data.action, data.payload);
    }
  }

  leaveRoom() {
    this.roomCode = null;
    this.connected = false;
    if (this.conn) {
      this.conn.close();
      this.conn = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

window.multiplayerManager = new MultiplayerManager();
