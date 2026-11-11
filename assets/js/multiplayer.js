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
    this.isMatchStarted = false;
    this.localPlayerSlot = 1; // 1 = Host, 2 = Guest
    this.onActionReceived = null;
    this.onPlayerJoined = null;
    this.onHostAcknowledged = null;
    this.onMatchStarted = null;
    this.onPlayerLeft = null;
    this.onRematchRequested = null;
    this.onRematchAccepted = null;
    this.onStatusChange = null;
    this.heartbeatInterval = null;
    this.handshakeInterval = null;
    this.roomWatcherInterval = null;
    this.cloudEventSource = null;
    this.cloudPollInterval = null;
    this.isPollingCloud = false;
    this.cloudPollAbort = null;
    this.processedCloudMsgIds = new Set();
    this.hasGuestJoined = false;
    this._lastSeenAction = null;
    this.hostAckReceived = false;
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

    // Notify peer on browser/tab close
    window.addEventListener('beforeunload', () => {
      if (this.roomCode) {
        const sender = this.isHost ? 'host' : 'guest';
        const name = this.isHost ? this.hostName : this.guestName;
        this.sendAction('PLAYER_LEFT', { sender, name, reason: 'window_closed' });
      }
    });
  }

  // =========================================================================
  // Real-Time Online Cloud Relay (Works globally across different phones/devices)
  // Non-blocking SSE + non-starving atomic polling fallback (guarantees zero blocked sockets)
  // =========================================================================
  initCloudRelay() {
    this.closeCloudRelay();
    if (!this.roomCode) return;
    const clean = this.getCleanCode(this.roomCode).toLowerCase();
    const topic = `playsphere_room_${clean}`;
    const sseUrl = `https://ntfy.sh/${topic}/sse`;

    // 1. Instant real-time SSE stream
    try {
      if (typeof EventSource !== 'undefined') {
        this.cloudEventSource = new EventSource(sseUrl);
        this.cloudEventSource.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed && parsed.message) {
              try {
                const inner = JSON.parse(parsed.message);
                this.handleIncomingMessage(inner);
              } catch (e) {
                this.handleIncomingMessage(parsed);
              }
            } else if (parsed && parsed.action) {
              this.handleIncomingMessage(parsed);
            }
          } catch (e) {
            try {
              const rawData = JSON.parse(event.data);
              this.handleIncomingMessage(rawData);
            } catch (err) {}
          }
        };
        this.cloudEventSource.onerror = () => {
          // SSE reconnecting silently
        };
        console.log(`[Multiplayer] Cloud real-time relay connected on topic: ${topic}`);
      }
    } catch (e) {
      console.warn('[Multiplayer] Cloud relay init error:', e);
    }

    // 2. High-reliability, non-starving polling fallback
    // Uses AbortController with 2000ms timeout and single-flight lock so browser never blocks POSTs!
    this.cloudPollInterval = setInterval(() => {
      if (!this.roomCode || this.isPollingCloud) return;
      this.isPollingCloud = true;
      try {
        if (typeof fetch !== 'undefined') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          fetch(`https://ntfy.sh/${topic}/json?poll=1&since=20s`, { signal: controller.signal })
            .then(res => res.text())
            .then(text => {
              clearTimeout(timeoutId);
              this.isPollingCloud = false;
              if (!text) return;
              const lines = text.trim().split('\n');
              lines.forEach(line => {
                if (!line.trim()) return;
                try {
                  const item = JSON.parse(line);
                  if (item && item.id) {
                    if (this.processedCloudMsgIds.has(item.id)) return;
                    this.processedCloudMsgIds.add(item.id);
                    if (this.processedCloudMsgIds.size > 200) {
                      const first = this.processedCloudMsgIds.values().next().value;
                      this.processedCloudMsgIds.delete(first);
                    }
                  }
                  if (item.event === 'message' && item.message) {
                    try {
                      const inner = JSON.parse(item.message);
                      this.handleIncomingMessage(inner);
                    } catch (err) {
                      if (item.action) this.handleIncomingMessage(item);
                    }
                  } else if (item.action) {
                    this.handleIncomingMessage(item);
                  }
                } catch (e) {}
              });
            })
            .catch(() => {
              clearTimeout(timeoutId);
              this.isPollingCloud = false;
            });
        } else {
          this.isPollingCloud = false;
        }
      } catch (e) {
        this.isPollingCloud = false;
      }
    }, 1500);
  }

  closeCloudRelay() {
    if (this.cloudEventSource) {
      try { this.cloudEventSource.close(); } catch (e) {}
      this.cloudEventSource = null;
    }
    if (this.cloudPollInterval) {
      clearInterval(this.cloudPollInterval);
      this.cloudPollInterval = null;
    }
    this.isPollingCloud = false;
  }

  sendCloudRelay(message) {
    if (!this.roomCode) return;
    const clean = this.getCleanCode(this.roomCode).toLowerCase();
    const topic = `playsphere_room_${clean}`;
    const url = `https://ntfy.sh/${topic}`;
    const rawBody = JSON.stringify(message);

    try {
      if (typeof fetch !== 'undefined') {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            'Title': 'PlaySphere',
            'Priority': 'urgent'
          },
          body: rawBody
        }).catch(err => {
          console.warn('[Multiplayer] Cloud relay post error:', err);
        });
      }
    } catch (e) {}
  }

  checkUrlForRoom() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const game = params.get('game') || 'ludo';
    const host = params.get('host') || 'Friend';
    if (room) {
      const clean = this.getCleanCode(room);
      const tryOpen = (retries = 0) => {
        if (window.app && typeof window.app.openJoinGameWithNameModal === 'function') {
          window.app.openJoinGameWithNameModal(clean, game, host);
        } else if (retries < 30) {
          setTimeout(() => tryOpen(retries + 1), 60);
        }
      };
      tryOpen(0);
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
    this.hasGuestJoined = false;
    this.isMatchStarted = false;

    // Synchronize room state for instant cross-tab / local detection
    this.updateRoomState({
      roomCode: this.roomCode,
      gameType: this.gameType,
      hostName: this.hostName,
      hostAvatar: this.hostAvatar,
      guestJoined: false,
      status: 'waiting',
      timestamp: Date.now()
    });
    this.startRoomStateWatcher();
    this.initCloudRelay();

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
    this.stopHeartbeat();
    this.stopRoomStateWatcher();
    this.stopGuestHandshake();
    this.closeCloudRelay();

    this.isHost = false;
    this.localPlayerSlot = 2;
    this.gameType = gameType;
    this.roomCode = this.getCleanCode(roomCode);
    this.guestName = (guestName && guestName.trim()) ? guestName.trim() : (window.gameStorage?.getProfile()?.name || 'Guest');
    this.guestAvatar = guestAvatar || window.gameStorage?.getProfile()?.avatar || '🦊';
    this.hostName = hostName || 'Host';
    this.connected = false;
    this.isMatchStarted = false;
    this.hostAckReceived = false;
    this.retryCount = 0;

    // Immediately update room state in shared storage so host detects guest instantly!
    this.updateRoomState({
      roomCode: this.roomCode,
      gameType: this.gameType,
      hostName: this.hostName,
      guestJoined: true,
      guestName: this.guestName,
      guestAvatar: this.guestAvatar,
      status: 'connected',
      timestamp: Date.now()
    });

    try {
      localStorage.setItem('playsphere_latest_join', JSON.stringify({
        roomCode: this.roomCode,
        guestName: this.guestName,
        guestAvatar: this.guestAvatar,
        timestamp: Date.now()
      }));
    } catch (e) {}

    this.startRoomStateWatcher();

    // Connect to Cloud Relay so devices on different phones/networks connect instantly!
    this.initCloudRelay();
    const joinPayload = {
      action: 'PLAYER_JOINED',
      type: 'PLAYER_JOINED',
      roomCode: this.roomCode,
      senderSlot: 2,
      gameType: this.gameType,
      guestName: this.guestName,
      guestAvatar: this.guestAvatar,
      hostName: this.hostName,
      timestamp: Date.now()
    };
    this.sendCloudRelay(joinPayload);

    const guestPeerId = `playsphere-${this.roomCode}-guest-${Date.now().toString(36)}`;

    // Wait for the guest's peer to register with the signaling server before attempting to connect to host!
    this.initPeerConnection(guestPeerId, (assignedId) => {
      if (assignedId) {
        console.log(`[Multiplayer] Guest peer ready (${assignedId}), connecting to host...`);
        this.connectToHost();
      }
    });

    // Also broadcast to local channel (for same-device multi-tab testing)
    this.broadcast(joinPayload);

    // Start repeating handshake until match starts
    this.startGuestHandshake();

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
            { urls: 'stun:stun.relay.metered.ca:80' },
            { urls: 'turn:standard.relay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:standard.relay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
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

    const onChannelOpen = () => {
      console.log('[Multiplayer] WebRTC DataChannel successfully OPENED between devices!');
      this.connected = true;
      this.startHeartbeat();

      if (this.onStatusChange) {
        this.onStatusChange({ status: 'connected', roomCode: this.roomCode });
      }

      if (!this.isHost) {
        // Send handshake from guest to host
        this.startGuestHandshake();
      } else {
        if (this.onPlayerJoined) {
          this.onPlayerJoined(this.guestName, this.guestAvatar);
        }
      }
    };

    if (this.conn.open) {
      onChannelOpen();
    } else {
      this.conn.on('open', onChannelOpen);
    }

    this.conn.on('data', (data) => {
      this.handleIncomingMessage(data);
    });

    this.conn.on('close', () => {
      console.log('[Multiplayer] WebRTC connection closed');
      const wasConnected = this.connected;
      this.connected = false;
      this.stopHeartbeat();
      if (this.onStatusChange) {
        this.onStatusChange({ status: 'disconnected', roomCode: this.roomCode });
      }
      if (wasConnected && this.onPlayerLeft) {
        const sender = this.isHost ? 'guest' : 'host';
        const name = this.isHost ? this.guestName : this.hostName;
        this.onPlayerLeft({ sender, name, reason: 'connection_closed' });
      }
    });

    this.conn.on('error', (err) => {
      console.warn('[Multiplayer] Connection error:', err);
    });
  }

  startGuestHandshake() {
    this.stopGuestHandshake();
    const send = () => {
      if (this.isMatchStarted) {
        this.stopGuestHandshake();
        return;
      }
      const msg = {
        action: 'PLAYER_JOINED',
        type: 'PLAYER_JOINED',
        roomCode: this.roomCode,
        senderSlot: 2,
        gameType: this.gameType,
        guestName: this.guestName,
        guestAvatar: this.guestAvatar,
        hostName: this.hostName,
        timestamp: Date.now()
      };
      this.sendCloudRelay(msg);
      this.broadcast(msg);
      if (this.conn && this.conn.open) {
        try { this.conn.send(msg); } catch (e) {}
      }
    };
    send();
    // Repeat every 450ms until match starts
    this.handshakeInterval = setInterval(send, 450);
  }

  stopGuestHandshake() {
    if (this.handshakeInterval) {
      clearInterval(this.handshakeInterval);
      this.handshakeInterval = null;
    }
  }

  startRoomStateWatcher() {
    this.stopRoomStateWatcher();
    this.roomWatcherInterval = setInterval(() => {
      if (!this.roomCode) return;
      try {
        const raw = localStorage.getItem(`playsphere_room_${this.roomCode}`);
        if (raw) {
          const data = JSON.parse(raw);
          if (this.isHost) {
            if (data.guestJoined && !this.hasGuestJoined) {
              console.log('[Multiplayer] Guest joined detected via room state watcher:', data.guestName);
              this.hasGuestJoined = true;
              this.connected = true;
              if (data.guestName) this.guestName = data.guestName;
              if (data.guestAvatar) this.guestAvatar = data.guestAvatar;
              if (this.onPlayerJoined) {
                this.onPlayerJoined(this.guestName, this.guestAvatar);
              }
            }
          } else {
            // Guest watching for match start
            if (data.matchStarted && !this.isMatchStarted) {
              console.log('[Multiplayer] Match start detected via room state watcher');
              this.connected = true;
              this.isMatchStarted = true;
              if (this.onMatchStarted) {
                this.onMatchStarted(data);
              }
            }
          }
        }

        // Also check latest global join
        if (this.isHost && !this.hasGuestJoined) {
          const latestRaw = localStorage.getItem('playsphere_latest_join');
          if (latestRaw) {
            const latest = JSON.parse(latestRaw);
            if (this.getCleanCode(latest.roomCode) === this.getCleanCode(this.roomCode)) {
              this.hasGuestJoined = true;
              this.connected = true;
              if (latest.guestName) this.guestName = latest.guestName;
              if (latest.guestAvatar) this.guestAvatar = latest.guestAvatar;
              if (this.onPlayerJoined) {
                this.onPlayerJoined(this.guestName, this.guestAvatar);
              }
            }
          }
        }

        // Cross-tab direct action sync on file:/// and local browsers
        const rawAction = localStorage.getItem('playsphere_remote_action');
        if (rawAction && rawAction !== this._lastSeenAction) {
          this._lastSeenAction = rawAction;
          try {
            const actionData = JSON.parse(rawAction);
            this.handleIncomingMessage(actionData);
          } catch (e) {}
        }
      } catch (e) {}
    }, 150);
  }

  checkConnectionStatus() {
    if (!this.roomCode) return;
    try {
      const raw = localStorage.getItem(`playsphere_room_${this.roomCode}`);
      if (raw) {
        const data = JSON.parse(raw);
        if (this.isHost && data.guestJoined) {
          this.hasGuestJoined = true;
          this.connected = true;
          if (data.guestName) this.guestName = data.guestName;
          if (data.guestAvatar) this.guestAvatar = data.guestAvatar;
          if (this.onPlayerJoined) this.onPlayerJoined(this.guestName, this.guestAvatar);
          return;
        }
      }
      const latestRaw = localStorage.getItem('playsphere_latest_join');
      if (latestRaw) {
        const latest = JSON.parse(latestRaw);
        if (this.isHost && this.getCleanCode(latest.roomCode) === this.getCleanCode(this.roomCode)) {
          this.hasGuestJoined = true;
          this.connected = true;
          if (latest.guestName) this.guestName = latest.guestName;
          if (latest.guestAvatar) this.guestAvatar = latest.guestAvatar;
          if (this.onPlayerJoined) this.onPlayerJoined(this.guestName, this.guestAvatar);
          return;
        }
      }
    } catch (e) {}

    // Rapid Cloud Relay query for messages
    const clean = this.getCleanCode(this.roomCode).toLowerCase();
    const topic = `playsphere_room_${clean}`;
    if (typeof fetch !== 'undefined') {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      fetch(`https://ntfy.sh/${topic}/json?poll=1&since=1m`, { signal: controller.signal })
        .then(res => res.text())
        .then(text => {
          clearTimeout(timeout);
          if (!text) return;
          const lines = text.trim().split('\n');
          lines.forEach(line => {
            try {
              const item = JSON.parse(line);
              if (item.event === 'message' && item.message) {
                const inner = JSON.parse(item.message);
                this.handleIncomingMessage(inner);
              } else if (item.action) {
                this.handleIncomingMessage(item);
              }
            } catch (e) {}
          });
        })
        .catch(() => { clearTimeout(timeout); });
    }
  }

  stopRoomStateWatcher() {
    if (this.roomWatcherInterval) {
      clearInterval(this.roomWatcherInterval);
      this.roomWatcherInterval = null;
    }
  }

  updateRoomState(updates = {}) {
    if (!this.roomCode) return;
    try {
      const key = `playsphere_room_${this.roomCode}`;
      const existing = JSON.parse(localStorage.getItem(key) || '{}');
      const merged = Object.assign(existing, updates, { updatedAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (e) {}
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
    this.isMatchStarted = true;
    this.updateRoomState({
      matchStarted: true,
      gameType: this.gameType,
      hostName: this.hostName,
      hostAvatar: this.hostAvatar,
      guestName: this.guestName,
      guestAvatar: this.guestAvatar
    });
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

    // 1. Post to Cloud Relay (works globally on mobile 4G/5G and GitHub Pages)
    this.sendCloudRelay(message);

    // 2. Send via WebRTC DataChannel (P2P direct)
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(message);
      } catch (e) {
        console.warn('[Multiplayer] Failed to send over WebRTC:', e);
      }
    }

    // 3. Local cross-tab broadcast
    this.broadcast(message);
  }

  broadcast(message) {
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {}
    }
    try {
      const envelope = Object.assign({}, message, { _ts: Date.now(), _rand: Math.random() });
      localStorage.setItem('playsphere_remote_action', JSON.stringify(envelope));
    } catch (e) {}
  }

  handleIncomingMessage(data) {
    if (!data || !this.roomCode) return;
    const incomingCode = this.getCleanCode(data.roomCode || data.code);
    if (incomingCode !== this.getCleanCode(this.roomCode)) return;
    if (data.senderSlot && data.senderSlot === this.localPlayerSlot) return;

    if (data.action === 'PING') return;

    if (data.type === 'PLAYER_JOINED' || data.action === 'PLAYER_JOINED') {
      const payload = data.payload || data;
      this.connected = true;
      if (payload.guestName) this.guestName = payload.guestName;
      if (payload.guestAvatar) this.guestAvatar = payload.guestAvatar;
      if (this.isHost) {
        this.hasGuestJoined = true;
        this.updateRoomState({
          guestJoined: true,
          guestName: this.guestName,
          guestAvatar: this.guestAvatar,
          status: 'ready'
        });
        this.sendAction('HOST_ACK', {
          gameType: this.gameType,
          hostName: this.hostName,
          hostAvatar: this.hostAvatar,
          guestName: this.guestName,
          guestAvatar: this.guestAvatar,
          roomCode: this.roomCode
        });
        if (this.onPlayerJoined) this.onPlayerJoined(this.guestName, this.guestAvatar);
      }
      return;
    }

    if (data.action === 'HOST_ACK') {
      this.hostAckReceived = true;
      this.stopGuestHandshake();
      this.connected = true;
      if (data.payload?.hostName) this.hostName = data.payload.hostName;
      if (data.payload?.hostAvatar) this.hostAvatar = data.payload.hostAvatar;
      if (data.payload?.guestName) this.guestName = data.payload.guestName;
      if (this.onHostAcknowledged) this.onHostAcknowledged(this.hostName, this.hostAvatar);
      return;
    }

    if (data.action === 'START_ONLINE_MATCH') {
      console.log('[Multiplayer] Host launched the online match!', data.payload);
      this.isMatchStarted = true;
      if (this.onMatchStarted) {
        this.onMatchStarted(data.payload);
      }
      return;
    }

    if (data.action === 'PLAYER_LEFT') {
      console.log('[Multiplayer] Player left notification:', data.payload);
      if (this.onPlayerLeft) {
        this.onPlayerLeft(data.payload || {});
      }
      return;
    }

    if (data.action === 'START_REMATCH' || data.action === 'REMATCH_REQUEST') {
      console.log('[Multiplayer] Rematch triggered:', data.payload);
      this.isMatchStarted = true;
      if (this.onRematchRequested) {
        this.onRematchRequested(data.payload || {});
      }
      return;
    }

    if (data.action === 'REMATCH_ACCEPTED') {
      console.log('[Multiplayer] Rematch accepted:', data.payload);
      this.isMatchStarted = true;
      if (this.onRematchAccepted) {
        this.onRematchAccepted(data.payload || {});
      }
      return;
    }

    if (this.onActionReceived) {
      this.onActionReceived(data.action, data.payload);
    }
  }

  leaveRoom(notifyPeer = false) {
    this.stopHeartbeat();
    this.stopRoomStateWatcher();
    this.stopGuestHandshake();
    this.closeCloudRelay();
    // Only clean up the room storage entry if WE were the host leaving!
    if (this.isHost && this.roomCode) {
      try {
        localStorage.removeItem(`playsphere_room_${this.roomCode}`);
      } catch (e) {}
    }
    if (notifyPeer && this.roomCode) {
      const sender = this.isHost ? 'host' : 'guest';
      const name = this.isHost ? this.hostName : this.guestName;
      this.sendAction('PLAYER_LEFT', { sender, name, reason: 'left_room' });
    }
    this.roomCode = null;
    this.connected = false;
    this.hasGuestJoined = false;
    this.isMatchStarted = false;
    if (this.conn) {
      try { this.conn.close(); } catch (e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
  }

  get isConnected() {
    return Boolean(this.connected && this.roomCode);
  }
}

window.multiplayerManager = new MultiplayerManager();
