/**
 * Main Application Coordinator
 * Handles Navigation, Modals, Theme Switching, Screen Routing,
 * Leaderboard & Stats Rendering, Profile Management, and Online Room Sharing with Player Names.
 */

class App {
  constructor() {
    this.currentScreen = 'home';
    this.pendingGameType = null;
    this.onlineActionType = 'create'; // 'create' | 'join'
    this.pendingJoinData = null; // { roomCode, gameType, hostName }
    this.init();
  }

  init() {
    // Setup Confetti
    const confettiCanvas = document.getElementById('confetti-canvas');
    if (confettiCanvas && window.confettiCannon) {
      window.confettiCannon.init(confettiCanvas);
    }

    // Apply saved settings
    const settings = window.gameStorage.getSettings();
    this.applyTheme(settings.theme || 'light');
    this.applyFrameMode(settings.frameMode || 'mobile');
    window.soundEngine.setSoundEnabled(settings.sound !== false);
    window.soundEngine.setMusicEnabled(settings.music === true);

    // Setup event listeners
    this.setupNavigation();
    this.setupThemeToggle();
    this.setupSettingsEvents();
    this.setupProfileEvents();
    this.setupGameSetupModal();
    this.setupRoomLobbyModal();
    this.setupJoinWithNameModal();
    this.setupAppFrameToggle();

    // Render initial data
    this.updateHomeScreen();
    this.updateProfileScreen();
    this.updateStatsScreen();
    this.updateLeaderboardScreen();

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && window.soundEngine) {
        window.soundEngine.stopAmbientMusic();
      } else if (!document.hidden && window.soundEngine && window.gameStorage.getSettings().music) {
        window.soundEngine.startAmbientMusic();
      }
    });
  }

  navigate(screenId) {
    if (this.currentScreen === screenId) return;

    window.soundEngine.playClick();
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }

    const isGame = ['ludo', 'chess', 'tictactoe'].includes(screenId);
    document.body.classList.toggle('in-game-screen', isGame);

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.screen === screenId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (screenId === 'home') this.updateHomeScreen();
    if (screenId === 'stats') this.updateStatsScreen();
    if (screenId === 'leaderboard') this.updateLeaderboardScreen();
    if (screenId === 'profile') this.updateProfileScreen();
    if (screenId === 'settings') this.syncSettingsUI();

    if (target) target.scrollTop = 0;
  }

  setupNavigation() {
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const screen = el.getAttribute('data-navigate');
        this.navigate(screen);
      });
    });

    document.querySelectorAll('[data-launch-game]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const game = el.getAttribute('data-launch-game');
        this.openGameSetup(game);
      });
    });
  }

  setupThemeToggle() {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next, true);
        window.soundEngine.playClick();
      });
    });
  }

  applyTheme(theme, isUserAction = false) {
    if (isUserAction) {
      localStorage.setItem('playsphere_theme_customized', 'true');
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('light-theme', theme === 'light');
    window.gameStorage.updateSettings({ theme });
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
    const themeSelect = document.getElementById('setting-theme-select');
    if (themeSelect) themeSelect.value = theme;
  }

  setupAppFrameToggle() {
    const frameBtn = document.getElementById('btn-toggle-frame');
    if (frameBtn) {
      frameBtn.addEventListener('click', () => {
        const isMobile = document.body.classList.contains('mobile-bezel-mode');
        this.applyFrameMode(isMobile ? 'desktop' : 'mobile');
        window.soundEngine.playClick();
      });
    }
  }

  applyFrameMode(mode) {
    if (mode === 'mobile') {
      document.body.classList.add('mobile-bezel-mode');
    } else {
      document.body.classList.remove('mobile-bezel-mode');
    }
    window.gameStorage.updateSettings({ frameMode: mode });
    const frameBtn = document.getElementById('btn-toggle-frame');
    if (frameBtn) {
      frameBtn.innerHTML = mode === 'mobile' ? '📱 Mobile View' : '💻 Expanded View';
    }
  }

  updateHomeScreen() {
    const profile = window.gameStorage.getProfile();
    const stats = window.gameStorage.getTotalStats();

    const nameEl = document.getElementById('home-user-name');
    const avatarEl = document.getElementById('home-user-avatar');
    const levelEl = document.getElementById('home-user-level');
    const xpEl = document.getElementById('home-user-xp');
    const coinsEl = document.getElementById('home-user-coins');

    if (nameEl) nameEl.textContent = profile.name;
    if (avatarEl) avatarEl.textContent = profile.avatar;
    if (levelEl) levelEl.textContent = `${profile.level}`;
    if (xpEl) xpEl.textContent = `${profile.xp} XP`;
    if (coinsEl) coinsEl.textContent = profile.coins || 850;

    const winRateEl = document.getElementById('home-stat-winrate');
    const totalWinsEl = document.getElementById('home-stat-wins');
    const streakEl = document.getElementById('home-stat-streak');
    if (winRateEl) winRateEl.textContent = `${stats.winRate}%`;
    if (totalWinsEl) totalWinsEl.textContent = stats.totalWins;
    if (streakEl) streakEl.textContent = `${profile.streak || 0} 🔥`;

    const recentContainer = document.getElementById('home-recent-list');
    if (recentContainer) {
      const recent = window.gameStorage.data.recentMatches || [];
      if (recent.length === 0) {
        recentContainer.innerHTML = '<div class="empty-state">No recent matches played yet. Launch a game below!</div>';
      } else {
        recentContainer.innerHTML = recent.slice(0, 4).map(m => `
          <div class="recent-match-card">
            <div class="match-icon ${m.game.toLowerCase()}">${m.game === 'Ludo' ? '🎲' : m.game === 'Chess' ? '♟️' : '❌'}</div>
            <div class="match-info">
              <h4>${m.game}</h4>
              <p>${m.mode} • ${m.date}</p>
            </div>
            <div class="match-result-badge ${m.result.toLowerCase()}">${m.result}</div>
            <div class="match-xp">${m.score}</div>
          </div>
        `).join('');
      }
    }
  }

  updateProfileScreen() {
    const profile = window.gameStorage.getProfile();
    const stats = window.gameStorage.getTotalStats();

    const nameEl = document.getElementById('profile-name');
    const avatarEl = document.getElementById('profile-avatar');
    const bioEl = document.getElementById('profile-bio');
    const levelEl = document.getElementById('profile-level');
    const xpBar = document.getElementById('profile-xp-bar');
    const xpText = document.getElementById('profile-xp-text');

    if (nameEl) nameEl.textContent = profile.name;
    if (avatarEl) avatarEl.textContent = profile.avatar;
    if (bioEl) bioEl.textContent = profile.bio;
    if (levelEl) levelEl.textContent = `Level ${profile.level}`;

    const currentLevelBaseXP = (profile.level - 1) * 400;
    const nextLevelXP = profile.level * 400;
    const progress = Math.min(100, Math.max(0, ((profile.xp - currentLevelBaseXP) / 400) * 100));
    if (xpBar) xpBar.style.width = `${progress}%`;
    if (xpText) xpText.textContent = `${profile.xp} / ${nextLevelXP} XP`;

    const pPlayed = document.getElementById('profile-stat-played');
    const pWins = document.getElementById('profile-stat-wins');
    const pLosses = document.getElementById('profile-stat-losses');
    const pRate = document.getElementById('profile-stat-rate');
    const pFav = document.getElementById('profile-stat-fav');

    if (pPlayed) pPlayed.textContent = stats.totalPlayed;
    if (pWins) pWins.textContent = stats.totalWins;
    if (pLosses) pLosses.textContent = stats.totalLosses;
    if (pRate) pRate.textContent = `${stats.winRate}%`;
    if (pFav) pFav.textContent = stats.favorite;

    const achList = document.getElementById('profile-achievements-list');
    if (achList) {
      achList.innerHTML = window.gameStorage.data.achievements.map(a => `
        <div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
          <div class="ach-icon">${a.icon}</div>
          <div class="ach-details">
            <h5>${a.name}</h5>
            <p>${a.desc}</p>
          </div>
          <div class="ach-status">${a.unlocked ? '✅ Unlocked' : '🔒 Locked'}</div>
        </div>
      `).join('');
    }
  }

  updateStatsScreen() {
    const s = window.gameStorage.getStats();
    const totals = window.gameStorage.getTotalStats();

    const lPlayed = document.getElementById('stat-ludo-played');
    const lWon = document.getElementById('stat-ludo-won');
    const lLost = document.getElementById('stat-ludo-lost');
    const lRate = document.getElementById('stat-ludo-rate');
    if (lPlayed) lPlayed.textContent = s.ludo.played;
    if (lWon) lWon.textContent = s.ludo.won;
    if (lLost) lLost.textContent = s.ludo.lost;
    if (lRate) lRate.textContent = s.ludo.played > 0 ? `${Math.round((s.ludo.won / s.ludo.played) * 100)}%` : '0%';

    const tPlayed = document.getElementById('stat-ttt-played');
    const tWon = document.getElementById('stat-ttt-won');
    const tLost = document.getElementById('stat-ttt-lost');
    const tDraw = document.getElementById('stat-ttt-draw');
    if (tPlayed) tPlayed.textContent = s.tictactoe.played;
    if (tWon) tWon.textContent = s.tictactoe.won;
    if (tLost) tLost.textContent = s.tictactoe.lost;
    if (tDraw) tDraw.textContent = s.tictactoe.draw || 0;

    const cPlayed = document.getElementById('stat-chess-played');
    const cWon = document.getElementById('stat-chess-won');
    const cLost = document.getElementById('stat-chess-lost');
    const cDraw = document.getElementById('stat-chess-draw');
    if (cPlayed) cPlayed.textContent = s.chess.played;
    if (cWon) cWon.textContent = s.chess.won;
    if (cLost) cLost.textContent = s.chess.lost;
    if (cDraw) cDraw.textContent = s.chess.draw || 0;

    const lBar = document.getElementById('chart-ludo-bar');
    const tBar = document.getElementById('chart-ttt-bar');
    const cBar = document.getElementById('chart-chess-bar');
    if (lBar && totals.totalPlayed > 0) lBar.style.width = `${(s.ludo.played / totals.totalPlayed) * 100}%`;
    if (tBar && totals.totalPlayed > 0) tBar.style.width = `${(s.tictactoe.played / totals.totalPlayed) * 100}%`;
    if (cBar && totals.totalPlayed > 0) cBar.style.width = `${(s.chess.played / totals.totalPlayed) * 100}%`;
  }

  updateLeaderboardScreen(activeTab = 'allTime') {
    const data = window.gameStorage.data.leaderboards[activeTab] || [];
    const podiumEl = document.getElementById('leaderboard-podium');
    const listEl = document.getElementById('leaderboard-list');

    document.querySelectorAll('.lb-tab-btn').forEach(btn => {
      if (btn.dataset.tab === activeTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      btn.onclick = () => {
        window.soundEngine.playClick();
        this.updateLeaderboardScreen(btn.dataset.tab);
      };
    });

    if (podiumEl && data.length >= 3) {
      const p1 = data[0];
      const p2 = data[1];
      const p3 = data[2];

      podiumEl.innerHTML = `
        <div class="podium-item rank-2">
          <div class="podium-avatar">${p2.avatar}</div>
          <div class="podium-name">${p2.name}</div>
          <div class="podium-pts">${p2.points} pts</div>
          <div class="podium-step step-2">🥈 2</div>
        </div>
        <div class="podium-item rank-1">
          <div class="podium-crown">👑</div>
          <div class="podium-avatar">${p1.avatar}</div>
          <div class="podium-name">${p1.name}</div>
          <div class="podium-pts">${p1.points} pts</div>
          <div class="podium-step step-1">🥇 1</div>
        </div>
        <div class="podium-item rank-3">
          <div class="podium-avatar">${p3.avatar}</div>
          <div class="podium-name">${p3.name}</div>
          <div class="podium-pts">${p3.points} pts</div>
          <div class="podium-step step-3">🥉 3</div>
        </div>
      `;
    }

    if (listEl) {
      listEl.innerHTML = data.map((item, idx) => `
        <div class="leaderboard-row ${item.isUser ? 'user-highlight' : ''}">
          <div class="lb-rank">#${item.rank}</div>
          <div class="lb-avatar">${item.avatar}</div>
          <div class="lb-details">
            <span class="lb-name">${item.name} ${item.isUser ? '<span class="you-badge">(You)</span>' : ''}</span>
            <span class="lb-badge">${item.badge}</span>
          </div>
          <div class="lb-wins">🏆 ${item.wins} Wins</div>
          <div class="lb-points">${item.points} pts</div>
        </div>
      `).join('');
    }
  }

  // =========================================================================
  // Game Setup & Room Creation Modal
  // =========================================================================
  openGameSetup(gameType) {
    this.pendingGameType = gameType;
    window.soundEngine.playClick();

    const modal = document.getElementById('modal-game-setup');
    const titleEl = document.getElementById('setup-modal-title');
    const descEl = document.getElementById('setup-modal-desc');

    const ludoOptions = document.getElementById('setup-options-ludo');
    const tttOptions = document.getElementById('setup-options-ttt');
    const chessOptions = document.getElementById('setup-options-chess');

    if (ludoOptions) ludoOptions.style.display = 'none';
    if (tttOptions) tttOptions.style.display = 'none';
    if (chessOptions) chessOptions.style.display = 'none';

    if (gameType === 'ludo') {
      titleEl.innerHTML = '🎲 Ludo Championship Setup';
      descEl.textContent = 'Configure board rules, player names, or create a room link for friends.';
      if (ludoOptions) ludoOptions.style.display = 'block';
    } else if (gameType === 'tictactoe') {
      titleEl.innerHTML = '❌⭕ Tic-Tac-Toe Arena Setup';
      descEl.textContent = 'Challenge a friend with player names or test the Minimax AI.';
      if (tttOptions) tttOptions.style.display = 'block';
    } else if (gameType === 'chess') {
      titleEl.innerHTML = '♟️ Tournament Chess Setup';
      descEl.textContent = 'Set clocks, customize player names, or share a duel room link.';
      if (chessOptions) chessOptions.style.display = 'block';
    }

    // Pre-fill Player Names
    const p1Input = document.getElementById('setup-player1-name');
    const p2Input = document.getElementById('setup-player2-name');
    if (p1Input) p1Input.value = window.gameStorage.getProfile().name || 'Player 1';
    if (p2Input) p2Input.value = 'Player 2';

    const count = parseInt(document.getElementById('ludo-player-count')?.value || 4, 10);
    const p3NameWrap = document.getElementById('setup-player3-wrap');
    const p4NameWrap = document.getElementById('setup-player4-wrap');
    if (p3NameWrap) p3NameWrap.style.display = (gameType === 'ludo' && count >= 3) ? 'flex' : 'none';
    if (p4NameWrap) p4NameWrap.style.display = (gameType === 'ludo' && count >= 4) ? 'flex' : 'none';

    const twoPlayerGroup = document.getElementById('ludo-two-player-format-group');
    if (twoPlayerGroup) {
      twoPlayerGroup.style.display = (gameType === 'ludo' && count === 2) ? 'block' : 'none';
    }

    const modeRadios = document.querySelectorAll('input[name="global-play-mode"]');
    modeRadios.forEach(r => { if (r.value === 'ai') r.checked = true; });
    this.handlePlayModeChange('ai');

    if (modal) modal.classList.add('open');
  }

  closeGameSetup() {
    const modal = document.getElementById('modal-game-setup');
    if (modal) modal.classList.remove('open');
  }

  setupGameSetupModal() {
    const closeBtn = document.getElementById('btn-close-setup');
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeGameSetup());

    document.querySelectorAll('input[name="global-play-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.handlePlayModeChange(e.target.value);
      });
    });

    const btnCreate = document.getElementById('btn-create-new-room');
    const btnShowJoin = document.getElementById('btn-show-join-box');
    const joinSubBox = document.getElementById('sub-box-join');
    const onlineHint = document.getElementById('online-room-hint');

    if (btnCreate) {
      btnCreate.addEventListener('click', (e) => {
        e.preventDefault();
        btnCreate.classList.add('active');
        btnShowJoin?.classList.remove('active');
        if (joinSubBox) joinSubBox.style.display = 'none';
        if (onlineHint) onlineHint.style.display = 'block';
        this.onlineActionType = 'create';
      });
    }

    if (btnShowJoin) {
      btnShowJoin.addEventListener('click', (e) => {
        e.preventDefault();
        btnShowJoin.classList.add('active');
        btnCreate?.classList.remove('active');
        if (joinSubBox) joinSubBox.style.display = 'flex';
        if (onlineHint) onlineHint.style.display = 'none';
        this.onlineActionType = 'join';
        const codeInput = document.getElementById('input-join-room-code');
        if (codeInput) {
          codeInput.focus();
        }
      });
    }

    const codeInput = document.getElementById('input-join-room-code');
    if (codeInput) {
      codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          window.soundEngine.playClick();
          this.executeDirectJoin(codeInput.value);
        }
      });
    }

    const btnConfirmJoin = document.getElementById('btn-confirm-join-code');
    if (btnConfirmJoin) {
      btnConfirmJoin.addEventListener('click', (e) => {
        e.preventDefault();
        window.soundEngine.playClick();
        const codeInput = document.getElementById('input-join-room-code');
        const code = codeInput ? codeInput.value : '';
        this.executeDirectJoin(code);
      });
    }

    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        this.launchConfiguredGame();
      });
    }

    const ludoCountSelect = document.getElementById('ludo-player-count');
    if (ludoCountSelect) {
      ludoCountSelect.addEventListener('change', () => {
        const count = parseInt(ludoCountSelect.value, 10);
        const p3Row = document.getElementById('ludo-p3-config');
        const p4Row = document.getElementById('ludo-p4-config');
        if (p3Row) p3Row.style.display = count >= 3 ? 'flex' : 'none';
        if (p4Row) p4Row.style.display = count >= 4 ? 'flex' : 'none';

        const p3NameWrap = document.getElementById('setup-player3-wrap');
        const p4NameWrap = document.getElementById('setup-player4-wrap');
        if (p3NameWrap) p3NameWrap.style.display = (this.pendingGameType === 'ludo' && count >= 3) ? 'flex' : 'none';
        if (p4NameWrap) p4NameWrap.style.display = (this.pendingGameType === 'ludo' && count >= 4) ? 'flex' : 'none';

        const twoPlayerGroup = document.getElementById('ludo-two-player-format-group');
        if (twoPlayerGroup) {
          twoPlayerGroup.style.display = (this.pendingGameType === 'ludo' && count === 2) ? 'block' : 'none';
        }
      });
    }
  }

  handlePlayModeChange(mode) {
    const onlineBox = document.getElementById('setup-online-room-box');
    const ludoDiff = document.getElementById('ludo-difficulty-group');
    const ludoRoster = document.getElementById('ludo-roster-group');
    const tttDiff = document.getElementById('ttt-difficulty-group');
    const chessDiff = document.getElementById('chess-difficulty-group');
    const p2Wrap = document.getElementById('setup-player2-wrap');
    const p2Badge = document.getElementById('setup-p2-badge');
    const p2Input = document.getElementById('setup-player2-name');

    if (mode === 'online') {
      if (onlineBox) onlineBox.style.display = 'block';
      if (ludoDiff) ludoDiff.style.display = 'none';
      if (ludoRoster) ludoRoster.style.display = 'none';
      if (tttDiff) tttDiff.style.display = 'none';
      if (chessDiff) chessDiff.style.display = 'none';
      if (p2Wrap) p2Wrap.style.display = 'none';
    } else if (mode === 'pvp') {
      if (onlineBox) onlineBox.style.display = 'none';
      if (ludoDiff) ludoDiff.style.display = 'none';
      if (ludoRoster) ludoRoster.style.display = 'block';
      if (tttDiff) tttDiff.style.display = 'none';
      if (chessDiff) chessDiff.style.display = 'none';
      if (p2Wrap) p2Wrap.style.display = 'block';
      if (p2Badge) p2Badge.textContent = 'Player 2 (Friend)';
      if (p2Input && p2Input.value === 'AI Bot') p2Input.value = 'Friend';
    } else {
      // AI
      if (onlineBox) onlineBox.style.display = 'none';
      if (ludoDiff) ludoDiff.style.display = 'block';
      if (ludoRoster) ludoRoster.style.display = 'block';
      if (tttDiff) tttDiff.style.display = 'block';
      if (chessDiff) chessDiff.style.display = 'block';
      if (p2Wrap) p2Wrap.style.display = 'block';
      if (p2Badge) p2Badge.textContent = 'Player 2 (AI Bot)';
      if (p2Input && p2Input.value === 'Friend') p2Input.value = 'AI Bot';
    }
  }

  executeDirectJoin(code) {
    const cleanCode = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    if (!cleanCode || cleanCode.length < 4) {
      this.showPopup({
        title: 'Invalid Room Code ⚠️',
        message: 'Please enter a valid 6-character room code to connect with your friend.',
        type: 'warning',
        icon: '⚠️',
        confirmText: 'Try Again'
      });
      return;
    }

    const type = this.pendingGameType || 'ludo';
    const profile = window.gameStorage.getProfile();
    const inputName = document.getElementById('setup-player1-name')?.value.trim();
    const guestName = inputName || profile.name;

    // If player does not have a custom name filled, open the profile popup to require name!
    if (!guestName || guestName === 'Player 1' || guestName === 'Guest Player') {
      this.closeGameSetup();
      this.openJoinGameWithNameModal(cleanCode, type, 'Host');
      return;
    }

    this.closeGameSetup();
    document.getElementById('modal-join-game-with-name')?.classList.remove('open');

    const avatar = profile.avatar || '🦊';
    this.showToast(`⚡ Connecting to room ${cleanCode}...`, 'info');
    window.multiplayerManager.joinRoom(cleanCode, type, guestName, 'Host', avatar);
    this.openGuestLobbyModal(cleanCode, type, 'Host', guestName, avatar);
  }

  launchConfiguredGame() {
    const mode = document.querySelector('input[name="global-play-mode"]:checked')?.value || 'ai';
    const type = this.pendingGameType;

    if (mode === 'online') {
      const codeInput = document.getElementById('input-join-room-code');
      const code = codeInput ? codeInput.value.trim() : '';

      // If join tab is selected or user typed a code into the box, join immediately!
      if (this.onlineActionType === 'join' || (code && code.length >= 4)) {
        this.executeDirectJoin(code);
        return;
      }

      this.closeGameSetup();
      this.openRoomLobby(type);
      return;
    }

    this.closeGameSetup();
    this.startGameWithMode(type, mode);
  }

  openRoomLobby(gameType) {
    const hostNameInput = document.getElementById('setup-player1-name')?.value.trim();
    const profile = window.gameStorage.getProfile();
    const hostName = hostNameInput || profile.name || 'Host';
    const hostAvatar = profile.avatar || '🥷';
    
    const room = window.multiplayerManager.createRoom(gameType, hostName, hostAvatar);
    const modal = document.getElementById('modal-room-lobby');
    const titleEl = document.getElementById('lobby-modal-title');
    const codeEl = document.getElementById('lobby-room-code');
    const linkInput = document.getElementById('lobby-share-link-input');

    if (titleEl) titleEl.textContent = 'Game Room Ready! 🌐';
    if (codeEl) codeEl.textContent = room.roomCode;
    if (linkInput) linkInput.value = room.shareLink;

    // SHOW HOST CONTROLS & START BUTTON (Room Owner)
    const hostView = document.getElementById('lobby-host-view');
    const hostFooter = document.getElementById('lobby-host-footer');
    const guestView = document.getElementById('lobby-guest-view');
    const friendCard = document.getElementById('lobby-friend-card');
    const waitingText = document.getElementById('lobby-waiting-text');
    const statusDot = document.getElementById('lobby-status-dot');
    const startBtn = document.getElementById('btn-start-room-now');
    const startBtnText = document.getElementById('btn-start-room-text');

    if (hostView) hostView.style.display = 'block';
    if (hostFooter) hostFooter.style.display = 'flex';
    if (guestView) guestView.style.display = 'none';

    // Reset waiting status
    if (friendCard) friendCard.style.display = 'none';
    if (waitingText) waitingText.textContent = 'Waiting for friend to connect...';
    if (statusDot) {
      statusDot.style.background = '#f59e0b';
      statusDot.style.boxShadow = '0 0 10px #f59e0b';
    }

    if (startBtn) {
      startBtn.classList.remove('friend-ready');
      if (startBtnText) startBtnText.textContent = 'Start Game Anyway (or Play with Bot) ➔';
      startBtn.onclick = () => {
        modal.classList.remove('open');
        this.startGameWithMode(gameType, 'online', hostName, 'Bot');
      };
    }

    this.updateActiveRoomHeader(gameType, room.roomCode);
    if (modal) modal.classList.add('open');

    // When opponent connects:
    // 1) Change waiting status to show friend with avatar & ready indicator
    // 2) Upgrade Start button to prominent green "START MATCH WITH [FRIEND] 🚀"
    // 3) Only room owner (Host) can click to start!
    window.multiplayerManager.onPlayerJoined = (guestName, guestAvatar) => {
      this.showToast(`🎉 ${guestName || 'Friend'} joined your room!`, 'success');
      window.soundEngine?.playCelebration();

      // Update status strip
      if (waitingText) waitingText.innerHTML = `<strong>${guestName}</strong> is ready to play!`;
      if (statusDot) {
        statusDot.style.background = '#10b981';
        statusDot.style.boxShadow = '0 0 12px #10b981';
      }

      // Show friend card
      if (friendCard) {
        friendCard.style.display = 'flex';
        const nameEl = document.getElementById('lobby-friend-name');
        const avatarEl = document.getElementById('lobby-friend-avatar');
        if (nameEl) nameEl.textContent = guestName;
        if (avatarEl) avatarEl.textContent = guestAvatar || '🦊';
      }

      // Update start button
      if (startBtn) {
        startBtn.classList.add('friend-ready');
        if (startBtnText) {
          startBtnText.textContent = `START MATCH WITH ${guestName.toUpperCase()} 🚀`;
        }
        startBtn.onclick = () => {
          window.soundEngine?.playClick();
          // Broadcast match start to guest
          window.multiplayerManager.sendStartMatch();
          modal.classList.remove('open');
          this.startGameWithMode(gameType, 'online', hostName, guestName);
        };
      }
    };
  }

  openGuestLobbyModal(roomCode, gameType, hostName, guestName, avatar) {
    this.pendingGameType = gameType;
    const modal = document.getElementById('modal-room-lobby');
    if (!modal) return;

    // Set modal title
    const titleEl = document.getElementById('lobby-modal-title');
    if (titleEl) titleEl.textContent = 'Connected to Room! 🌐';

    // HIDE ALL HOST CONTROLS & FOOTER (Play button and share links hidden from joiner)
    const hostView = document.getElementById('lobby-host-view');
    const hostFooter = document.getElementById('lobby-host-footer');
    const guestView = document.getElementById('lobby-guest-view');

    if (hostView) hostView.style.display = 'none';
    if (hostFooter) hostFooter.style.display = 'none';
    if (guestView) guestView.style.display = 'block';

    // Update guest view elements
    const codeEl = document.getElementById('lobby-guest-code-display');
    const hostNameEl = document.getElementById('lobby-guest-host-name');
    const hostHighlightEl = document.getElementById('guest-host-name-highlight');
    const hostAvatarEl = document.getElementById('lobby-guest-host-avatar');

    if (codeEl) codeEl.textContent = roomCode;
    if (hostNameEl) hostNameEl.textContent = hostName || 'Host';
    if (hostHighlightEl) hostHighlightEl.textContent = hostName || 'the room creator';
    if (hostAvatarEl) hostAvatarEl.textContent = window.multiplayerManager.hostAvatar || '👑';

    this.updateActiveRoomHeader(gameType, roomCode);
    modal.classList.add('open');

    // When Host acknowledges handshake, update host info
    window.multiplayerManager.onHostAcknowledged = (hName, hAvatar) => {
      if (hostNameEl) hostNameEl.textContent = hName;
      if (hostHighlightEl) hostHighlightEl.textContent = hName;
      if (hostAvatarEl) hostAvatarEl.textContent = hAvatar || '👑';
    };

    // When Host launches the match, auto-close lobby and start!
    window.multiplayerManager.onMatchStarted = (payload) => {
      console.log('[App] Match started by host!', payload);
      this.showToast(`🚀 Match started by ${payload.hostName || hostName}! Let's Play!`, 'success');
      modal.classList.remove('open');
      this.startGameWithMode(payload.gameType || gameType, 'online', payload.hostName || hostName, guestName);
    };
  }

  setupRoomLobbyModal() {
    const copyCodeBtn = document.getElementById('btn-copy-code-action');
    const copyLinkBtn = document.getElementById('btn-copy-link-action');
    const whatsappBtn = document.getElementById('btn-share-whatsapp');
    const nativeShareBtn = document.getElementById('btn-native-share');
    const startNowBtn = document.getElementById('btn-start-room-now');

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        const code = document.getElementById('lobby-room-code')?.textContent;
        if (code) {
          navigator.clipboard.writeText(code).then(() => {
            this.showToast(`📋 Room Code ${code} copied!`, 'success');
            window.soundEngine.playClick();
          });
        }
      });
    }

    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
        const link = document.getElementById('lobby-share-link-input')?.value;
        if (link) {
          navigator.clipboard.writeText(link).then(() => {
            this.showToast(`🔗 Share Link copied to clipboard!`, 'success');
            window.soundEngine.playClick();
          });
        }
      });
    }

    if (whatsappBtn) {
      whatsappBtn.addEventListener('click', () => {
        const code = document.getElementById('lobby-room-code')?.textContent || '';
        const link = document.getElementById('lobby-share-link-input')?.value || window.location.href;
        const hostName = window.multiplayerManager?.hostName || 'Player';
        const gameType = (this.pendingGameType || 'Ludo').toUpperCase();

        const inviteText = `🎮 Hey! Join my ${gameType} match on PlaySphere!\n\n` +
          `👑 Host: ${hostName}\n` +
          `🔑 Game Room Code: ${code}\n` +
          `👉 Direct Join Link: ${link}`;

        // Immediately copy the link to clipboard as a reliable backup
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).catch(() => {});
        }

        // Open WhatsApp Web / App directly
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
        window.open(waUrl, '_blank');

        this.showToast('💬 WhatsApp opened & invite link copied!', 'success');
        window.soundEngine.playClick();
      });
    }

    if (nativeShareBtn) {
      nativeShareBtn.addEventListener('click', () => {
        const code = document.getElementById('lobby-room-code')?.textContent || '';
        const link = document.getElementById('lobby-share-link-input')?.value || window.location.href;
        const hostName = window.multiplayerManager?.hostName || 'Player';
        const gameType = (this.pendingGameType || 'Ludo').toUpperCase();

        const sharePayload = {
          title: `Play ${gameType} with ${hostName}!`,
          text: `Join ${hostName}'s ${gameType} match on PlaySphere! Room Code: ${code}`,
          url: link
        };

        if (navigator.share) {
          navigator.share(sharePayload).then(() => {
            this.showToast('📤 Invite shared successfully!', 'success');
          }).catch(() => {
            // If native share was canceled or unavailable, copy to clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(`${sharePayload.text}\n${sharePayload.url}`).then(() => {
                this.showToast('📋 Match link copied to clipboard!', 'info');
              });
            }
          });
        } else {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(`${sharePayload.text}\n${sharePayload.url}`).then(() => {
              this.showToast('📋 Match link copied to clipboard!', 'info');
              window.soundEngine.playClick();
            });
          }
        }
      });
    }

    if (startNowBtn) {
      startNowBtn.addEventListener('click', () => {
        if (window.multiplayerManager.isHost) {
          window.multiplayerManager.sendStartMatch();
        }
        document.getElementById('modal-room-lobby')?.classList.remove('open');
        this.startGameWithMode(this.pendingGameType, 'online', window.multiplayerManager.hostName, window.multiplayerManager.guestName);
      });
    }

    ['ludo', 'ttt', 'chess'].forEach(g => {
      const btn = document.getElementById(`btn-copy-${g}-room`);
      if (btn) {
        btn.addEventListener('click', () => {
          const code = window.multiplayerManager.roomCode;
          if (code) {
            const link = window.multiplayerManager.getShareableLink(code, g, window.multiplayerManager.hostName);
            navigator.clipboard.writeText(link).then(() => {
              this.showToast(`🔗 Room link copied!`, 'info');
            });
          }
        });
      }
    });
  }

  // =========================================================================
  // Join Game With Custom Player Name Modal
  // =========================================================================
  openJoinGameWithNameModal(roomCode, gameType, hostName = 'Friend') {
    this.pendingGameType = gameType;
    this.pendingJoinData = { roomCode, gameType, hostName };

    const modal = document.getElementById('modal-join-game-with-name');
    const titleEl = document.getElementById('join-modal-title');
    const inviteText = document.getElementById('join-invite-text');
    const badgeEl = document.getElementById('join-invite-game-badge');
    const codeEl = document.getElementById('join-modal-room-code');
    const nameInput = document.getElementById('input-join-player-name');
    const errorHint = document.getElementById('join-name-error');

    const gameNames = { ludo: 'Ludo Championship', tictactoe: 'Tic-Tac-Toe Arena', chess: 'Tournament Chess' };

    if (titleEl) titleEl.textContent = `Join ${gameNames[gameType] || 'Match'}! 🎮`;
    if (inviteText) inviteText.innerHTML = `<strong>${hostName}</strong> invited you to play!`;
    if (badgeEl) badgeEl.textContent = gameNames[gameType] || gameType.toUpperCase();
    if (codeEl) codeEl.textContent = roomCode;

    if (nameInput) {
      nameInput.value = '';
      nameInput.classList.remove('input-error');
      nameInput.placeholder = 'Your Name is Required';
    }
    if (errorHint) errorHint.style.display = 'none';

    if (modal) modal.classList.add('open');
    setTimeout(() => { nameInput?.focus(); }, 200);
  }

  setupJoinWithNameModal() {
    const confirmBtn = document.getElementById('btn-confirm-join-with-name');
    const nameInput = document.getElementById('input-join-player-name');
    const errorHint = document.getElementById('join-name-error');

    if (nameInput) {
      nameInput.addEventListener('input', () => {
        if (nameInput.value.trim()) {
          nameInput.classList.remove('input-error');
          if (errorHint) errorHint.style.display = 'none';
        }
      });
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmBtn?.click();
        }
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!this.pendingJoinData) return;
        const guestName = nameInput ? nameInput.value.trim() : '';

        if (!guestName) {
          if (nameInput) {
            nameInput.classList.add('input-error');
            nameInput.focus();
          }
          if (errorHint) errorHint.style.display = 'block';
          this.showToast('⚠️ Please enter your name to join the match!', 'warning');
          return;
        }

        const avatar = document.querySelector('.join-avatar-item.selected')?.dataset.avatar || '🦊';
        window.gameStorage.updateProfile({ name: guestName, avatar });

        const { roomCode, gameType, hostName } = this.pendingJoinData;
        document.getElementById('modal-join-game-with-name')?.classList.remove('open');

        this.showToast(`⚡ Connecting to ${hostName}'s room...`, 'info');
        window.multiplayerManager.joinRoom(roomCode, gameType, guestName, hostName, avatar);
        this.openGuestLobbyModal(roomCode, gameType, hostName, guestName, avatar);
      });
    }

    document.querySelectorAll('.join-avatar-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.join-avatar-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        window.soundEngine.playClick();
      });
    });
  }

  updateActiveRoomHeader(gameType, code) {
    const badge = document.getElementById(`${gameType === 'tictactoe' ? 'ttt' : gameType}-online-indicator`);
    const codeSpan = document.getElementById(`${gameType === 'tictactoe' ? 'ttt' : gameType}-active-room-code`);
    if (badge) badge.style.display = code ? 'inline-flex' : 'none';
    if (codeSpan) codeSpan.textContent = code || '';
  }

  startGameWithMode(type, mode, customHostName, customGuestName) {
    const isOnline = (mode === 'online');

    // Resolve player names
    const host = customHostName || window.multiplayerManager.hostName || document.getElementById('setup-player1-name')?.value.trim() || 'Player 1';
    const guest = customGuestName || window.multiplayerManager.guestName || document.getElementById('setup-player2-name')?.value.trim() || (mode === 'ai' ? 'Bot' : 'Player 2');

    if (type === 'ludo') {
      let battleMode = document.querySelector('input[name="ludo-mode"]:checked')?.value || 'individual';
      const count = isOnline ? 2 : parseInt(document.getElementById('ludo-player-count')?.value || 4, 10);
      const difficulty = document.getElementById('ludo-difficulty')?.value || 'medium';
      const twoPlayerFormat = (count === 2)
        ? (document.querySelector('input[name="ludo-two-player-format"]:checked')?.value || 'single')
        : 'standard';

      let playersConfig;
      if (count === 2 && twoPlayerFormat === 'double') {
        battleMode = 'team'; // Team mode for 2-player double: Red & Yellow (Team 1) vs Blue & Green (Team 2)
        const p1AI = !isOnline && (document.getElementById('ludo-p1-ai')?.checked || false);
        const p2AI = !isOnline && (mode === 'ai' ? true : (document.getElementById('ludo-p2-ai')?.checked || false));

        playersConfig = {
          red: { isAI: p1AI, name: `${host} (Red)` },
          yellow: { isAI: p1AI, name: `${host} (Yellow)` },
          green: { isAI: p2AI, name: p2AI ? 'Bot Green' : `${guest} (Green)` },
          blue: { isAI: p2AI, name: p2AI ? 'Bot Blue' : `${guest} (Blue)` }
        };
      } else {
        const p1AI = !isOnline && (document.getElementById('ludo-p1-ai')?.checked || false);
        const p2AI = !isOnline && (mode === 'ai' ? true : (document.getElementById('ludo-p2-ai')?.checked || false));
        const p3AI = !isOnline && (document.getElementById('ludo-p3-ai')?.checked ?? true);
        const p4AI = !isOnline && (document.getElementById('ludo-p4-ai')?.checked ?? true);

        const p3Name = document.getElementById('setup-player3-name')?.value.trim() || 'Green';
        const p4Name = document.getElementById('setup-player4-name')?.value.trim() || 'Blue';

        playersConfig = {
          red: { isAI: p1AI, name: `${host}` },
          yellow: { isAI: p2AI, name: `${guest}` },
          green: { isAI: p3AI, name: p3AI ? 'Bot Green' : `${p3Name}` },
          blue: { isAI: p4AI, name: p4AI ? 'Bot Blue' : `${p4Name}` }
        };
      }

      this.navigate('ludo');
      window.ludoGame.setup({
        playerCount: count,
        twoPlayerFormat,
        mode: battleMode,
        difficulty,
        isOnlineRoom: isOnline,
        playersConfig
      });
    } else if (type === 'tictactoe') {
      const difficulty = document.getElementById('ttt-difficulty')?.value || 'medium';
      const symbol = document.querySelector('input[name="ttt-symbol"]:checked')?.value || 'X';

      const playerX = isOnline ? (window.multiplayerManager.isHost ? host : guest) : host;
      const playerO = isOnline ? (window.multiplayerManager.isHost ? guest : host) : guest;

      this.navigate('tictactoe');
      window.ticTacToeGame.setup({
        mode: isOnline ? 'online' : mode,
        difficulty,
        humanSymbol: isOnline ? (window.multiplayerManager.isHost ? 'X' : 'O') : symbol,
        playerXName: playerX,
        playerOName: playerO
      });
    } else if (type === 'chess') {
      const difficulty = document.getElementById('chess-difficulty')?.value || 'medium';
      const color = isOnline ? (window.multiplayerManager.isHost ? 'w' : 'b') : (document.querySelector('input[name="chess-color"]:checked')?.value || 'w');
      const timer = document.getElementById('chess-timer-select')?.value || '10';

      const whitePlayer = isOnline ? (window.multiplayerManager.isHost ? host : guest) : host;
      const blackPlayer = isOnline ? (window.multiplayerManager.isHost ? guest : host) : guest;

      this.navigate('chess');
      window.chessGame.setup({
        mode: isOnline ? 'online' : mode,
        difficulty,
        playerColor: color,
        timerMinutes: timer,
        whiteName: whitePlayer,
        blackName: blackPlayer
      });
    }
  }

  // Game Over Modal
  showGameOverModal({ title, message, gameType, onPlayAgain, onRestart }) {
    const modal = document.getElementById('modal-game-over');
    if (!modal) return;

    document.getElementById('game-over-title').textContent = title;
    document.getElementById('game-over-message').textContent = message;

    const playAgainBtn = document.getElementById('btn-game-over-again');
    const restartBtn = document.getElementById('btn-game-over-restart');
    const homeBtn = document.getElementById('btn-game-over-home');

    playAgainBtn.onclick = () => {
      modal.classList.remove('open');
      if (onPlayAgain) onPlayAgain();
    };

    restartBtn.onclick = () => {
      modal.classList.remove('open');
      if (onRestart) onRestart();
    };

    homeBtn.onclick = () => {
      modal.classList.remove('open');
      this.navigate('home');
    };

    modal.classList.add('open');
  }

  // Profile Edit
  setupProfileEvents() {
    const editBtn = document.getElementById('btn-edit-profile');
    const modal = document.getElementById('modal-edit-profile');
    const saveBtn = document.getElementById('btn-save-profile');
    const cancelBtn = document.getElementById('btn-cancel-profile');

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.soundEngine.playClick();
        const p = window.gameStorage.getProfile();
        document.getElementById('edit-profile-name').value = p.name;
        document.getElementById('edit-profile-bio').value = p.bio || '';
        modal.classList.add('open');
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const name = document.getElementById('edit-profile-name').value.trim();
        const bio = document.getElementById('edit-profile-bio').value.trim();
        const avatar = document.querySelector('.avatar-picker-item.selected')?.dataset.avatar || '🥷';

        if (name) {
          window.gameStorage.updateProfile(name, avatar, bio);
          this.updateHomeScreen();
          this.updateProfileScreen();
          this.showToast('Profile updated successfully!', 'success');
          modal.classList.remove('open');
          window.soundEngine.playClick();
        }
      });
    }

    document.querySelectorAll('.avatar-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.avatar-picker-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        window.soundEngine.playClick();
      });
    });
  }

  // Settings Events
  setupSettingsEvents() {
    const soundToggle = document.getElementById('setting-sound');
    const musicToggle = document.getElementById('setting-music');
    const themeSelect = document.getElementById('setting-theme-select');
    const resetBtn = document.getElementById('btn-reset-stats');

    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        window.gameStorage.updateSettings({ sound: e.target.checked });
        window.soundEngine.setSoundEnabled(e.target.checked);
      });
    }

    if (musicToggle) {
      musicToggle.addEventListener('change', (e) => {
        window.gameStorage.updateSettings({ music: e.target.checked });
        window.soundEngine.setMusicEnabled(e.target.checked);
      });
    }

    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        this.applyTheme(e.target.value, true);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.showConfirm(
          'Are you sure you want to reset all game statistics, match logs, and XP? This action is permanent and cannot be undone.',
          'Reset Game Records? 🗑️',
          () => {
            window.gameStorage.resetAllStats();
            this.updateHomeScreen();
            this.updateStatsScreen();
            this.updateProfileScreen();
            this.updateLeaderboardScreen();
            this.showToast('All statistics have been reset to zero.', 'info', '🗑️');
          },
          { type: 'danger', icon: '🗑️', confirmText: 'Yes, Reset All' }
        );
      });
    }
  }

  syncSettingsUI() {
    const s = window.gameStorage.getSettings();
    const soundToggle = document.getElementById('setting-sound');
    const musicToggle = document.getElementById('setting-music');
    const themeSelect = document.getElementById('setting-theme-select');

    if (soundToggle) soundToggle.checked = s.sound !== false;
    if (musicToggle) musicToggle.checked = s.music === true;
    if (themeSelect) themeSelect.value = s.theme || 'light';
  }

  // =========================================================================
  // Multi-Color Popup Dialog System
  // =========================================================================
  showPopup({
    title = 'Notification',
    message = '',
    type = 'info', // 'success', 'warning', 'danger', 'info', 'purple'
    icon = '🔔',
    confirmText = 'Got It! 👍',
    cancelText = null,
    onConfirm = null,
    onCancel = null
  }) {
    const modal = document.getElementById('modal-alert-popup');
    const dialog = document.getElementById('alert-popup-dialog');
    const iconEl = document.getElementById('alert-popup-icon');
    const titleEl = document.getElementById('alert-popup-title');
    const msgEl = document.getElementById('alert-popup-message');
    const confirmBtn = document.getElementById('btn-alert-confirm');
    const cancelBtn = document.getElementById('btn-alert-cancel');
    const backdrop = document.getElementById('alert-popup-backdrop');

    if (!modal) return;

    dialog.className = `modal-dialog alert-popup-dialog alert-theme-${type}`;
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      confirmBtn.onclick = () => {
        modal.classList.remove('open');
        window.soundEngine.playClick();
        if (onConfirm) onConfirm();
      };
    }

    if (cancelBtn) {
      if (cancelText) {
        cancelBtn.style.display = 'flex';
        cancelBtn.textContent = cancelText;
        cancelBtn.onclick = () => {
          modal.classList.remove('open');
          window.soundEngine.playClick();
          if (onCancel) onCancel();
        };
      } else {
        cancelBtn.style.display = 'none';
      }
    }

    if (backdrop) {
      backdrop.onclick = () => {
        modal.classList.remove('open');
        if (onCancel) onCancel();
      };
    }

    modal.classList.add('open');
    if (type === 'success' || type === 'purple') {
      window.soundEngine.playWin();
    } else if (type === 'danger') {
      window.soundEngine.playLoss();
    } else {
      window.soundEngine.playClick();
    }
  }

  showAlert(message, title = 'Notice', type = 'info', icon = 'ℹ️') {
    this.showPopup({ title, message, type, icon, confirmText: 'Got It! 👍' });
  }

  showConfirm(message, title = 'Confirm Action', onConfirm, { type = 'warning', icon = '⚠️', confirmText = 'Yes, Proceed', cancelText = 'Cancel' } = {}) {
    this.showPopup({
      title,
      message,
      type,
      icon,
      confirmText,
      cancelText,
      onConfirm
    });
  }

  // =========================================================================
  // Multi-Color Toast Notifications
  // =========================================================================
  showToast(message, type = 'info', customIcon = null) {
    const icons = {
      success: '🎉',
      warning: '⚠️',
      danger: '🛑',
      info: 'ℹ️',
      purple: '🏆'
    };
    const icon = customIcon || icons[type] || '✨';

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;
    toast.innerHTML = `<span class="toast-badge-icon">${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 20);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }
}

// Global button binds
function bindInGameControls() {
  const ludoCube = document.getElementById('ludo-dice-cube');
  const ludoDice = document.getElementById('ludo-dice-container');
  const ludoTray = document.getElementById('ludo-dice-tray');
  const ludoRollBtn = document.getElementById('ludo-roll-btn');
  if (ludoCube) ludoCube.addEventListener('click', () => window.ludoGame.rollDice());
  if (ludoDice) ludoDice.addEventListener('click', () => window.ludoGame.rollDice());
  if (ludoTray) ludoTray.addEventListener('click', () => window.ludoGame.rollDice());
  if (ludoRollBtn) ludoRollBtn.addEventListener('click', () => window.ludoGame.rollDice());

  const restartLudoHandler = () => {
    window.app.showConfirm(
      'Do you want to abandon the current match and restart Ludo with fresh boards?',
      'Restart Ludo Match? 🎲',
      () => {
        if (window.ludoGame.isOnlineRoom && window.multiplayerManager) {
          window.multiplayerManager.sendAction('LUDO_RESTART', {});
        }
        window.ludoGame.setup({
          playerCount: window.ludoGame.twoPlayerFormat === 'double' ? 2 : window.ludoGame.players.length,
          twoPlayerFormat: window.ludoGame.twoPlayerFormat,
          mode: window.ludoGame.isTeamMode ? 'team' : 'individual',
          difficulty: window.ludoGame.difficulty,
          isOnlineRoom: window.ludoGame.isOnlineRoom
        });
        window.app.showToast('Ludo match restarted!', 'success', '🎲');
      },
      { type: 'warning', icon: '🔄', confirmText: 'Restart Match' }
    );
  };

  document.getElementById('btn-ludo-restart')?.addEventListener('click', restartLudoHandler);

  const toggleSoundHandler = () => {
    const settings = window.gameStorage.getSettings();
    settings.sound = !settings.sound;
    window.gameStorage.saveSettings(settings);
    window.soundEngine.setSoundEnabled(settings.sound);

    const icon = settings.sound ? '🔊' : '🔇';
    ['btn-ludo-sound', 'btn-ttt-sound', 'btn-chess-sound'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.textContent = icon;
    });

    window.app.showToast(settings.sound ? '🔊 Sound: ON' : '🔇 Sound: MUTED', 'info');
    if (settings.sound) window.soundEngine.playClick();
  };

  // Sync sound icons initially
  const initialSoundSetting = window.gameStorage.getSettings()?.sound ?? true;
  ['btn-ludo-sound', 'btn-ttt-sound', 'btn-chess-sound'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.textContent = initialSoundSetting ? '🔊' : '🔇';
  });

  ['btn-ludo-sound', 'btn-ttt-sound', 'btn-chess-sound'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', toggleSoundHandler);
  });

  document.getElementById('btn-ttt-restart')?.addEventListener('click', () => {
    window.ticTacToeGame.restartRound();
  });
  document.getElementById('btn-ttt-new')?.addEventListener('click', () => {
    window.ticTacToeGame.newGame();
  });

  document.getElementById('btn-chess-undo')?.addEventListener('click', () => {
    window.chessGame.undoMove();
  });
  document.getElementById('btn-chess-resign')?.addEventListener('click', () => {
    window.app.showConfirm(
      'Are you sure you want to surrender and resign this match to your opponent?',
      'Resign Chess Game? 🏳️',
      () => {
        window.chessGame.resign();
      },
      { type: 'danger', icon: '🏳️', confirmText: 'Yes, Resign' }
    );
  });
  document.getElementById('btn-chess-guide')?.addEventListener('click', () => {
    if (window.pieceGuideEngine) window.pieceGuideEngine.open('chess');
  });

  document.getElementById('btn-ludo-guide')?.addEventListener('click', () => {
    if (window.pieceGuideEngine) window.pieceGuideEngine.open('ludo');
  });

  document.getElementById('btn-ttt-guide')?.addEventListener('click', () => {
    if (window.pieceGuideEngine) window.pieceGuideEngine.open('tictactoe');
  });

  document.getElementById('btn-chess-restart')?.addEventListener('click', () => {
    window.app.showConfirm(
      'Reset the chessboard and restart the tournament timer clocks?',
      'Restart Chess Match? ♟️',
      () => {
        if (window.chessGame.mode === 'online' && window.multiplayerManager) {
          window.multiplayerManager.sendAction('CHESS_RESTART', {});
        }
        window.chessGame.setup({
          mode: window.chessGame.mode,
          difficulty: window.chessGame.difficulty,
          playerColor: window.chessGame.playerColor,
          whiteName: window.chessGame.whiteName,
          blackName: window.chessGame.blackName
        });
        window.app.showToast('Chess match restarted!', 'success', '♟️');
      },
      { type: 'warning', icon: '🔄', confirmText: 'Restart Match' }
    );
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  bindInGameControls();
});
