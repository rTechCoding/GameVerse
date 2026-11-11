/**
 * Real Authentic Ludo Board Game Engine
 * Features:
 * - Authentic Vector Ludo Board (Inner white yards, 4 circular sockets, 4 center colored triangles, arrows & stars)
 * - 3D Realistic Pawns (Sphere head, collar, bell body, shadow, and glossy highlight)
 * - Working Token Capture & Kill: landing on any opponent sends them back to their yard & grants extra turn!
 * - 4 Corner Player Pods with custom names & active glowing turn rings
 * - Complete International Rules: Roll 6 to exit, extra turns on 6/capture/goal, star safe zones, team mode
 * - Computer AI (Easy/Medium/Hard) with aggressive capture prioritization
 * - Real-time Share Link & Game Code Multiplayer Synchronization with Custom Player Names
 */

const LUDO_OFFSETS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// [PlaySphere Enhancement]: Authentic Ludo Safe Cells (4 Starting Cells + 4 Star Cells)
// Tokens on ANY of these 8 cells (0, 8, 13, 21, 26, 34, 39, 47) CANNOT be killed!
const LUDO_SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

// Coordinates on 15x15 grid (row, col) for outer 52 circuit steps
const LUDO_TRACK_COORDS = [
  { r: 6, c: 1 },  { r: 6, c: 2 },  { r: 6, c: 3 },  { r: 6, c: 4 },  { r: 6, c: 5 },  // 0-4 (Red start at 0)
  { r: 5, c: 6 },  { r: 4, c: 6 },  { r: 3, c: 6 },  { r: 2, c: 6 },  { r: 1, c: 6 },  { r: 0, c: 6 }, // 5-10 (Star at 8)
  { r: 0, c: 7 },  { r: 0, c: 8 }, // 11-12
  { r: 1, c: 8 },  { r: 2, c: 8 },  { r: 3, c: 8 },  { r: 4, c: 8 },  { r: 5, c: 8 }, // 13-17 (Green start at 13)
  { r: 6, c: 9 },  { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // 18-23 (Star at 21)
  { r: 7, c: 14 }, { r: 8, c: 14 }, // 24-25
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // 26-30 (Yellow start at 26)
  { r: 9, c: 8 },  { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // 31-36 (Star at 34)
  { r: 14, c: 7 }, { r: 14, c: 6 }, // 37-38
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // 39-43 (Blue start at 39)
  { r: 8, c: 5 },  { r: 8, c: 4 },  { r: 8, c: 3 },  { r: 8, c: 2 },  { r: 8, c: 1 },  { r: 8, c: 0 }, // 44-49 (Star at 47)
  { r: 7, c: 0 },  { r: 6, c: 0 }  // 50-51
];

// Coordinates on 15x15 grid for home stretches (5 steps) + center finish (step 56)
const LUDO_HOME_LANES = {
  red: [
    { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }
  ],
  green: [
    { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }
  ],
  yellow: [
    { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }
  ],
  blue: [
    { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }
  ]
};

// Exact SVG pixel coordinates (0-600 viewBox) for the 4 yard pockets
const LUDO_YARD_SOCKETS_SVG = {
  red: [
    { x: 80, y: 80 }, { x: 160, y: 80 },
    { x: 80, y: 160 }, { x: 160, y: 160 }
  ],
  green: [
    { x: 440, y: 80 }, { x: 520, y: 80 },
    { x: 440, y: 160 }, { x: 520, y: 160 }
  ],
  yellow: [
    { x: 440, y: 440 }, { x: 520, y: 440 },
    { x: 440, y: 520 }, { x: 520, y: 520 }
  ],
  blue: [
    { x: 80, y: 440 }, { x: 160, y: 440 },
    { x: 80, y: 520 }, { x: 160, y: 520 }
  ]
};

// Center finish coordinates per triangle
const LUDO_GOAL_COORDS_SVG = {
  red: { x: 265, y: 300 },
  green: { x: 300, y: 265 },
  yellow: { x: 335, y: 300 },
  blue: { x: 300, y: 335 }
};

class RealLudoGame {
  constructor() {
    this.players = [];
    this.tokens = {}; // color -> [ { id: 0..3, step: -1..56 } ]
    this.currentTurnIndex = 0;
    this.diceValue = 6;
    this.canRoll = true;
    this.hasRolled = false;
    this.consecutiveSixes = 0;
    this.isRolling = false;
    this.gameActive = false;
    this.isTeamMode = false;
    this.difficulty = 'medium';
    this.isOnlineRoom = false;
    this.winners = [];
    this.isMovingPawn = false;
    this.activeStepInterval = null;
    this.activeReturnInterval = null;
  }

  setup(options = {}) {
    try {
      this.lastOptions = JSON.parse(JSON.stringify(options));
    } catch (e) {
      this.lastOptions = Object.assign({}, options);
    }
    if (this.activeStepInterval) {
      clearInterval(this.activeStepInterval);
      this.activeStepInterval = null;
    }
    if (this.activeReturnInterval) {
      clearInterval(this.activeReturnInterval);
      this.activeReturnInterval = null;
    }
    this.isMovingPawn = false;
    this.isTeamMode = options.mode === 'team';
    this.difficulty = options.difficulty || 'medium';
    this.isOnlineRoom = !!options.isOnlineRoom;
    this.isTeamMode = options.mode === 'team';
    const twoPlayerFormat = options.twoPlayerFormat || 'single';
    this.twoPlayerFormat = twoPlayerFormat;
    const count = this.isTeamMode ? 4 : parseInt(options.playerCount || 4, 10);

    let activeColors = [];
    if (this.isTeamMode) {
      // 2 vs 2 Team Mode: TEAM A (Red + Yellow) vs TEAM B (Green + Blue)
      activeColors = ['red', 'green', 'yellow', 'blue'];
    } else if (count === 2) {
      if (twoPlayerFormat === 'double') {
        // 2-Player Double: Player 1 (Red & Yellow) vs Player 2 / AI (Blue & Green)
        activeColors = ['red', 'green', 'yellow', 'blue'];
        this.isTeamMode = true;
      } else {
        // 2-Player Single: Red vs Yellow
        activeColors = ['red', 'yellow'];
        this.isTeamMode = false;
      }
    } else if (count === 3) {
      activeColors = ['red', 'green', 'yellow'];
      this.isTeamMode = false;
    } else {
      activeColors = ['red', 'green', 'yellow', 'blue'];
      this.isTeamMode = false;
    }

    this.players = activeColors.map((color, idx) => {
      const config = (options.playersConfig && (options.playersConfig[color] || options.playersConfig[idx])) || {};
      // TEAM A: Red & Yellow (Team 1). TEAM B: Green & Blue (Team 2).
      const team = (color === 'red' || color === 'yellow') ? 1 : 2;
      return {
        color,
        name: config.name || (config.isAI ? `Bot ${color.toUpperCase()}` : `Player ${color.toUpperCase()}`),
        avatar: config.avatar || (color === 'red' ? '🥷' : color === 'green' ? '🦊' : color === 'yellow' ? '👑' : '🤖'),
        isAI: !!config.isAI,
        isRemote: !!config.isRemote,
        team: this.isTeamMode ? team : idx + 1,
        active: true
      };
    });

    this.tokens = {};
    activeColors.forEach(color => {
      this.tokens[color] = [
        { id: 0, step: -1 },
        { id: 1, step: -1 },
        { id: 2, step: -1 },
        { id: 3, step: -1 }
      ];
    });

    this.currentTurnIndex = 0;
    this.diceValue = 6;
    this.canRoll = true;
    this.hasRolled = false;
    this.consecutiveSixes = 0;
    this.isRolling = false;
    this.gameActive = true;
    this.winners = [];

    this.buildBoard();
    this.render();

    // Setup multiplayer action hook
    if (this.isOnlineRoom && window.multiplayerManager) {
      window.multiplayerManager.onActionReceived = (action, payload) => {
        this.handleRemoteAction(action, payload);
      };
    }

    // Trigger AI if first player is bot
    if (this.getCurrentPlayer().isAI) {
      setTimeout(() => this.executeAITurn(), 900);
    }
  }

  restart() {
    if (this.activeStepInterval) {
      clearInterval(this.activeStepInterval);
      this.activeStepInterval = null;
    }
    if (this.activeReturnInterval) {
      clearInterval(this.activeReturnInterval);
      this.activeReturnInterval = null;
    }
    this.isMovingPawn = false;
    this.isRolling = false;
    this.hasRolled = false;
    this.canRoll = true;
    this.diceValue = 6;
    this.consecutiveSixes = 0;
    this.winners = [];
    this.gameActive = true;

    if (this.lastOptions) {
      this.setup(this.lastOptions);
    } else {
      this.setup({
        playerCount: this.twoPlayerFormat === 'double' ? 2 : (this.players ? this.players.length : 4),
        twoPlayerFormat: this.twoPlayerFormat || 'single',
        mode: this.isTeamMode ? 'team' : 'individual',
        difficulty: this.difficulty || 'medium',
        isOnlineRoom: this.isOnlineRoom,
        playersConfig: this.players ? this.players.reduce((acc, p) => {
          acc[p.color] = { name: p.name, avatar: p.avatar, isAI: p.isAI, isRemote: p.isRemote };
          return acc;
        }, {}) : undefined
      });
    }
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  isPlayerLocal(p) {
    if (!p) return false;
    if (p.isAI) return false;
    if (this.isOnlineRoom) {
      const isHost = window.multiplayerManager ? window.multiplayerManager.isHost : true;
      if (this.isTeamMode || this.twoPlayerFormat === 'double') {
        // Host controls TEAM A (Red & Yellow), Guest controls TEAM B (Green & Blue)
        return isHost ? (p.color === 'red' || p.color === 'yellow') : (p.color === 'green' || p.color === 'blue');
      } else {
        const mySlot = window.multiplayerManager ? window.multiplayerManager.localPlayerSlot : 1;
        const playerSlot = this.players.indexOf(p) + 1;
        return mySlot === playerSlot;
      }
    }
    return !p.isAI;
  }

  /* Rule 3: Do NOT Capture Teammates */
  canCapture(currentPlayer, targetPlayer) {
    if (this.isTeamMode && currentPlayer && targetPlayer) {
      // Same team = cannot capture
      if (currentPlayer.team === targetPlayer.team) {
        return false;
      }
    }
    // Different team or individual mode = capture allowed
    return true;
  }

  isCurrentPlayerLocal() {
    return this.isPlayerLocal(this.getCurrentPlayer());
  }

  rollDice(isRemoteAction = false, remoteValue = null) {
    if (!this.gameActive) return;
    if (this.isMovingPawn) return;
    if (!isRemoteAction && (!this.canRoll || this.hasRolled || this.isRolling)) return;
    
    if (!isRemoteAction && this.isOnlineRoom) {
      if (!window.multiplayerManager || !window.multiplayerManager.connected) {
        if (window.app) window.app.showToast('🔒 Waiting for friend to join! You cannot play alone in an online room.', 'warning');
        return;
      }
      if (!this.isCurrentPlayerLocal()) {
        const curr = this.getCurrentPlayer();
        if (window.app && curr) window.app.showToast(`⏳ Waiting for ${curr.name}'s turn (${curr.color.toUpperCase()})...`, 'info');
        return;
      }
    }

    this.isRolling = true;
    this.canRoll = false;

    window.soundEngine.playDiceRoll();

    const diceCube = document.getElementById('ludo-dice-cube');
    if (diceCube) {
      diceCube.classList.add('rolling');
    }

    setTimeout(() => {
      if (isRemoteAction && remoteValue !== null) {
        this.diceValue = remoteValue;
      } else if (!isRemoteAction) {
        this.diceValue = Math.floor(Math.random() * 6) + 1;
      }
      this.isRolling = false;
      this.hasRolled = true;

      if (diceCube) {
        diceCube.classList.remove('rolling');
        this.updateDiceFace(this.diceValue);
      }

      if (this.diceValue === 6) {
        this.consecutiveSixes++;
      } else {
        this.consecutiveSixes = 0;
      }

      if (!isRemoteAction && this.isOnlineRoom && window.multiplayerManager) {
        window.multiplayerManager.sendAction('LUDO_DICE_ROLLED', {
          diceValue: this.diceValue,
          turnIndex: this.currentTurnIndex
        });
      }

      if (this.consecutiveSixes === 3) {
        this.consecutiveSixes = 0;
        this.hasRolled = false;
        this.canRoll = false;

        if (window.soundEngine?.playAlert) {
          window.soundEngine.playAlert();
        }

        const currPlayer = this.getCurrentPlayer();
        const isLocal = this.isCurrentPlayerLocal();
        const forfeitNotice = isLocal 
          ? '🚫 3 Consecutive 6s Rolled! 3rd six cancelled & turn forfeited.' 
          : `🚫 3 Consecutive 6s by ${currPlayer.name}! Turn forfeited.`;

        if (window.app) {
          window.app.showToast(forfeitNotice, 'warning', '🎲');
        }

        // Broadcast turn pass to multiplayer opponent
        if (!isRemoteAction && this.isOnlineRoom && window.multiplayerManager) {
          window.multiplayerManager.sendAction('LUDO_PASS_TURN', {
            nextTurnIndex: (this.currentTurnIndex + 1) % this.players.length,
            reason: 'three_sixes_forfeit'
          });
        }

        // Render turn bar with forfeit notice
        const turnBar = document.getElementById('ludo-live-turn-bar');
        if (turnBar) {
          const pill = turnBar.querySelector('.live-turn-status-pill');
          if (pill) {
            pill.className = 'live-turn-status-pill pill-is-opp';
            pill.textContent = '🚫 3x SIXES! TURN FORFEITED';
          }
          const prompt = turnBar.querySelector('.live-player-sub');
          if (prompt) {
            prompt.textContent = 'Three consecutive 6s rolled. 3rd six cancelled per official Ludo rules.';
          }
        }

        setTimeout(() => this.passTurn(), 950);
        return;
      }

      this.evaluateTurnMoves();
    }, 650);
  }

  updateDiceFace(val) {
    const diceCube = document.getElementById('ludo-dice-cube');
    if (diceCube) diceCube.setAttribute('data-face', val);
  }

  evaluateTurnMoves() {
    const player = this.getCurrentPlayer();
    const legalTokens = this.getLegalMoves(player.color, this.diceValue);

    this.render();

    if (legalTokens.length === 0) {
      if (this.isOnlineRoom && window.multiplayerManager) {
        if (this.isCurrentPlayerLocal()) {
          setTimeout(() => {
            this.passTurn();
            window.multiplayerManager.sendAction('LUDO_PASS_TURN', {
              nextTurnIndex: this.currentTurnIndex
            });
          }, 750);
        }
        // Remote device waits for authoritative LUDO_PASS_TURN action from active player
        return;
      }
      setTimeout(() => this.passTurn(), 750);
      return;
    }

    if (player.isAI) {
      setTimeout(() => this.makeAIMove(legalTokens), 600);
    } else if (this.isCurrentPlayerLocal()) {
      // 1) Auto move if only 1 single goti can legally move anywhere!
      if (legalTokens.length === 1) {
        setTimeout(() => {
          if (this.gameActive && this.hasRolled && this.isCurrentPlayerLocal()) {
            this.moveToken(player.color, legalTokens[0].id);
          }
        }, 400);
      } 
      // 2) If all legal tokens are currently in the yard (e.g. rolled a 6 with multiple tokens in base and none on track):
      // All yard tokens are identical, so auto-release the first yard token!
      else if (legalTokens.every(tok => tok.step === -1)) {
        setTimeout(() => {
          if (this.gameActive && this.hasRolled && this.isCurrentPlayerLocal()) {
            this.moveToken(player.color, legalTokens[0].id);
          }
        }, 400);
      }
    }
  }

  getLegalMoves(color, dice) {
    const tokens = this.tokens[color];
    const legal = [];
    tokens.forEach(tok => {
      if (tok.step === -1) {
        if (dice === 6) legal.push(tok);
      } else if (tok.step < 56) {
        if (tok.step + dice <= 56) {
          legal.push(tok);
        }
      }
    });
    return legal;
  }

  moveToken(color, tokenId, isRemoteAction = false) {
    if (!this.gameActive) return;
    if (this.isMovingPawn) return;
    if (!isRemoteAction && !this.hasRolled) return;
    const player = this.getCurrentPlayer();
    if (player.color !== color) return;

    if (!isRemoteAction && this.isOnlineRoom) {
      if (!window.multiplayerManager || !window.multiplayerManager.connected) {
        if (window.app) window.app.showToast('🔒 Waiting for friend to join! You cannot play alone in an online room.', 'warning');
        return;
      }
      if (!this.isCurrentPlayerLocal()) {
        const curr = this.getCurrentPlayer();
        if (window.app && curr) window.app.showToast(`⏳ Waiting for ${curr.name}'s turn...`, 'info');
        return;
      }
    }

    const token = this.tokens[color].find(t => t.id === tokenId);
    if (!token) return;

    const legalTokens = this.getLegalMoves(color, this.diceValue);
    if (!isRemoteAction && !legalTokens.some(t => t.id === tokenId)) return;

    this.hasRolled = false;
    this.canRoll = false;

    if (!isRemoteAction && this.isOnlineRoom && window.multiplayerManager) {
      window.multiplayerManager.sendAction('LUDO_TOKEN_MOVED', {
        color,
        tokenId,
        diceValue: this.diceValue
      });
    }

    /* [PlaySphere Enhancement]: Step-by-step goti transit with smooth slow pacing and authentic audio */
    this.isMovingPawn = true;

    if (token.step === -1) {
      this.animateYardExit(color, token, () => {
        this.isMovingPawn = false;
        this.checkCellEvents(color, token, isRemoteAction);
      });
    } else {
      const fromStep = token.step;
      const targetStep = token.step + this.diceValue;
      this.animateStepMovement(color, token, fromStep, targetStep, () => {
        this.isMovingPawn = false;
        this.checkCellEvents(color, token, isRemoteAction);
      });
    }
  }

  /* [PlaySphere Enhancement]: Yard release with audio and gentle transition */
  animateYardExit(color, token, callback) {
    token.step = 0;
    if (window.soundEngine && window.soundEngine.playYardExit) {
      window.soundEngine.playYardExit();
    }
    this.renderPawns();
    const pawnEl = document.getElementById(`pawn-svg-${color}-${token.id}`);
    if (pawnEl) {
      pawnEl.classList.remove('pawn-step-hop');
      void pawnEl.offsetWidth;
      pawnEl.classList.add('pawn-step-hop');
    }
    setTimeout(() => {
      if (callback) callback();
    }, 280);
  }

  /* [PlaySphere Enhancement]: Step-by-step goti transit (1 square at a time) with ascending pitch count & tactile hop */
  animateStepMovement(color, token, fromStep, targetStep, callback) {
    if (this.activeStepInterval) {
      clearInterval(this.activeStepInterval);
      this.activeStepInterval = null;
    }

    const totalSteps = targetStep - fromStep;
    if (totalSteps <= 0) {
      if (callback) callback();
      return;
    }

    let current = fromStep;
    let stepIndex = 0;
    const STEP_DELAY = 210; // ~210ms per step gives smooth, clear, slow visibility matching classic Ludo

    this.activeStepInterval = setInterval(() => {
      if (!this.gameActive) {
        clearInterval(this.activeStepInterval);
        this.activeStepInterval = null;
        if (callback) callback();
        return;
      }

      stepIndex++;
      current++;
      token.step = current;

      // Play authentic tactile wooden/acrylic step audio with pitch count progression
      if (window.soundEngine && window.soundEngine.playGotiStep) {
        window.soundEngine.playGotiStep(stepIndex, totalSteps);
      } else if (window.soundEngine && window.soundEngine.playHop) {
        window.soundEngine.playHop();
      }

      this.renderPawns();

      // Trigger tactile hop animation on the moving goti
      const pawnEl = document.getElementById(`pawn-svg-${color}-${token.id}`);
      if (pawnEl) {
        pawnEl.classList.remove('pawn-step-hop');
        void pawnEl.offsetWidth;
        pawnEl.classList.add('pawn-step-hop');
      }

      if (current >= targetStep) {
        clearInterval(this.activeStepInterval);
        this.activeStepInterval = null;

        // Satisfying landing audio effect upon reaching destination square
        if (window.soundEngine && window.soundEngine.playGotiLand) {
          window.soundEngine.playGotiLand();
        }

        // Brief natural settle delay before resolving captures / home finishes
        setTimeout(() => {
          if (callback) callback();
        }, 120);
      }
    }, STEP_DELAY);
  }

  /* [PlaySphere Enhancement]: Step-by-step reverse return to yard on kill (matching Ludo King) */
  animateCapturedTokenReturn(color, token, fromStep, callback) {
    if (this.activeReturnInterval) {
      clearInterval(this.activeReturnInterval);
      this.activeReturnInterval = null;
    }

    if (window.soundEngine && window.soundEngine.playCapture) {
      window.soundEngine.playCapture();
    }

    // If already in yard or start, drop to yard and finish
    if (fromStep <= 0) {
      token.step = -1;
      this.renderPawns();
      if (callback) callback();
      return;
    }

    let current = fromStep;
    // Step pacing: ~42ms - 58ms per step backwards gives a brisk, smooth, visible run back
    const RETURN_DELAY = Math.max(38, Math.min(58, Math.floor(950 / Math.max(1, fromStep))));

    this.activeReturnInterval = setInterval(() => {
      if (!this.gameActive) {
        clearInterval(this.activeReturnInterval);
        this.activeReturnInterval = null;
        token.step = -1;
        if (callback) callback();
        return;
      }

      current--;
      token.step = current;

      if (window.soundEngine && window.soundEngine.playGotiReturnStep) {
        window.soundEngine.playGotiReturnStep(current);
      }

      this.renderPawns();

      const pawnEl = document.getElementById(`pawn-svg-${color}-${token.id}`);
      if (pawnEl) {
        pawnEl.classList.remove('pawn-return-hop');
        void pawnEl.offsetWidth;
        pawnEl.classList.add('pawn-return-hop');
      }

      // Reached starting square 0 -> now enter yard socket (-1)
      if (current <= 0) {
        clearInterval(this.activeReturnInterval);
        this.activeReturnInterval = null;

        setTimeout(() => {
          token.step = -1;
          if (window.soundEngine && window.soundEngine.playGotiLand) {
            window.soundEngine.playGotiLand();
          }
          this.renderPawns();
          setTimeout(() => {
            if (callback) callback();
          }, 150);
        }, RETURN_DELAY + 40);
      }
    }, RETURN_DELAY);
  }

  checkCellEvents(color, token, isRemoteAction = false) {
    let earnedExtraTurn = false;
    const currPlayer = this.getCurrentPlayer();

    // Home finish
    if (token.step === 56) {
      window.soundEngine.playWin();
      earnedExtraTurn = true;

      const playerJustFinished = this.hasPlayerFinished(color);

      // Rule 5: Team Winning Logic 🏆
      // In Team Mode, one player finishing all tokens should NOT immediately win the game.
      // The team wins when all required tokens of BOTH teammates have reached HOME.
      if (this.isTeamMode) {
        const teamWinner = this.checkTeamWinner();
        if (teamWinner) {
          this.handleTeamWin(teamWinner);
          return;
        }

        // Rule 6: Team members can help each other
        // When one teammate finishes, they are finished and the teammate continues playing!
        if (playerJustFinished) {
          const teammate = this.players.find(p => p.team === currPlayer.team && p.color !== color);
          const teammateName = teammate ? teammate.name : 'Teammate';
          if (window.app) {
            window.app.showToast(`🎉 ${currPlayer.name} finished all 4 tokens! Waiting for ${teammateName} to bring Team home! 🛡️`, 'success', '🏆');
          }
          // Finished player has no more movable tokens, pass turn to next player!
          setTimeout(() => this.passTurn(), 850);
          return;
        } else {
          if (window.app) {
            window.app.showToast(`🎉 ${currPlayer.name} finished a pawn! Extra roll! 🚀`, 'success');
          }
        }
      } else {
        if (window.app) window.app.showToast(`🎉 ${currPlayer.name} finished a pawn!`, 'success');
        if (this.hasPlayerWon(color)) {
          this.handlePlayerWin(color);
          return;
        }
      }
    } else if (token.step >= 0 && token.step <= 50) {
      // Outer track loop: Check for opponent capture / kill!
      const globalPos = (LUDO_OFFSETS[color] + token.step) % 52;
      const isSafe = LUDO_SAFE_CELLS.includes(globalPos);

      if (!isSafe) {
        for (let oppColor of Object.keys(this.tokens)) {
          if (oppColor === color) continue;
          const oppPlayer = this.players.find(p => p.color === oppColor);
          // Rule 3: Do NOT Capture Teammates
          if (!this.canCapture(currPlayer, oppPlayer)) continue;

          for (let oppTok of this.tokens[oppColor]) {
            // If opponent is also on outer track
            if (oppTok.step >= 0 && oppTok.step <= 50) {
              const oppGlobal = (LUDO_OFFSETS[oppColor] + oppTok.step) % 52;
              // Opponent on any of the 8 safe squares (starts or stars) CANNOT be killed!
              if (LUDO_SAFE_CELLS.includes(oppGlobal) || isSafe) continue;

              if (oppGlobal === globalPos) {
                // KILLED!
                const startStep = oppTok.step;
                earnedExtraTurn = true;
                this.isMovingPawn = true;

                if (window.app) {
                  window.app.showToast(`⚔️ ${currPlayer.name} KILLED ${oppPlayer.name}'s goti! Returning home...`, 'warning', '⚔️');
                }

                // Broadcast kill to multiplayer only from the player making the active move!
                if (!isRemoteAction && this.isOnlineRoom && window.multiplayerManager) {
                  window.multiplayerManager.sendAction('LUDO_TOKEN_KILLED', {
                    killedColor: oppColor,
                    killedTokenId: oppTok.id,
                    fromStep: startStep
                  });
                }

                // Smoothly animate opponent goti returning step-by-step backwards to base
                this.animateCapturedTokenReturn(oppColor, oppTok, startStep, () => {
                  this.isMovingPawn = false;
                  // Extra roll for the killer!
                  this.canRoll = true;
                  this.hasRolled = false;
                  this.render();
                  if (this.getCurrentPlayer().isAI) {
                    setTimeout(() => this.executeAITurn(), 700);
                  }
                });
                return; // Let reverse return animation handle turn resolution
              }
            }
          }
        }
      }
    }

    if (this.diceValue === 6 || earnedExtraTurn) {
      if (!isRemoteAction) {
        this.canRoll = true;
        this.hasRolled = false;
      }
      this.render();
      if (this.getCurrentPlayer().isAI) {
        setTimeout(() => this.executeAITurn(), 700);
      }
    } else {
      if (this.isOnlineRoom && window.multiplayerManager) {
        if (!isRemoteAction) {
          this.passTurn();
          window.multiplayerManager.sendAction('LUDO_PASS_TURN', {
            nextTurnIndex: this.currentTurnIndex
          });
        } else {
          // Remote move completed: check if LUDO_PASS_TURN was buffered while hopping
          if (this.pendingPassTurnIndex !== undefined && this.pendingPassTurnIndex !== null) {
            this.currentTurnIndex = this.pendingPassTurnIndex;
            this.pendingPassTurnIndex = null;
          }
          this.hasRolled = false;
          this.canRoll = true;
          this.isRolling = false;
          this.render();
        }
      } else {
        this.passTurn();
      }
    }
  }

  hasPlayerFinished(color) {
    if (!this.tokens || !this.tokens[color]) return false;
    return this.tokens[color].every(t => t.step === 56);
  }

  hasPlayerWon(color) {
    return this.hasPlayerFinished(color);
  }

  /* Rule 5: Check if both teammates on a team have finished all 8 tokens */
  checkTeamWinner() {
    if (!this.isTeamMode) return null;
    const teams = [1, 2];
    for (const teamId of teams) {
      const teamPlayers = this.players.filter(p => p.team === teamId);
      if (teamPlayers.length > 0 && teamPlayers.every(p => this.hasPlayerFinished(p.color))) {
        return teamId;
      }
    }
    return null;
  }

  handleTeamWin(winningTeam) {
    const winnerPlayers = this.players.filter(p => p.team === winningTeam);
    const teamColors = winnerPlayers.map(p => p.color);
    teamColors.forEach(c => {
      if (!this.winners.includes(c)) this.winners.push(c);
    });

    window.soundEngine.playWin();
    window.confettiCannon.fire();

    this.gameActive = false;
    const isUserWinner = this.isOnlineRoom 
      ? winnerPlayers.some(p => this.isPlayerLocal(p)) 
      : winnerPlayers.some(p => !p.isAI);

    window.gameStorage.recordMatch('ludo', isUserWinner ? 'win' : 'loss', 'Team Ludo (2 vs 2)');

    const teamTitle = winningTeam === 1 ? 'TEAM A (Red & Yellow)' : 'TEAM B (Green & Blue)';
    const teamNames = winnerPlayers.map(p => p.name).join(' & ');
    const winTitle = `🏆 ${teamTitle} Victory!`;
    const winDesc = `Legendary teamwork! ${teamNames} successfully guided all 8 tokens Home!`;

    setTimeout(() => {
      if (window.app) {
        window.app.showGameOverModal({
          title: winTitle,
          message: winDesc,
          gameType: 'ludo',
          onPlayAgain: () => {
            if (window.app) {
              window.app.restartCurrentGame('ludo');
            }
          },
          onRestart: () => {
            if (window.app) {
              window.app.restartCurrentGame('ludo');
            }
          }
        });
      }
    }, 700);
  }

  handlePlayerWin(winnerColor) {
    const winnerPlayer = this.players.find(p => p.color === winnerColor);
    if (!this.winners.includes(winnerColor)) {
      this.winners.push(winnerColor);
    }

    window.soundEngine.playWin();
    window.confettiCannon.fire();

    this.gameActive = false;
    const isUserWinner = this.isOnlineRoom ? this.isPlayerLocal(winnerPlayer) : !winnerPlayer.isAI;
    window.gameStorage.recordMatch('ludo', isUserWinner ? 'win' : 'loss', 'Classic Ludo');

    let winTitle = `🏆 ${winnerPlayer.name} Wins!`;
    let winDesc = 'All 4 tokens conquered the center home diamond!';

    setTimeout(() => {
      if (window.app) {
        window.app.showGameOverModal({
          title: winTitle,
          message: winDesc,
          gameType: 'ludo',
          onPlayAgain: () => {
            if (window.app) {
              window.app.restartCurrentGame('ludo');
            }
          },
          onRestart: () => {
            if (window.app) {
              window.app.restartCurrentGame('ludo');
            }
          }
        });
      }
    }, 700);
  }

  passTurn() {
    this.consecutiveSixes = 0;
    this.hasRolled = false;
    this.canRoll = true;

    // Rule 6: Skip finished players automatically!
    let count = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      count++;
    } while (this.hasPlayerFinished(this.getCurrentPlayer().color) && count < this.players.length);

    this.render();

    if (this.getCurrentPlayer().isAI && this.gameActive) {
      setTimeout(() => this.executeAITurn(), 700);
    }
  }

  executeAITurn() {
    if (!this.gameActive) return;
    this.rollDice();
  }

  /* Rule 7: Computer AI Team Logic 🤖 */
  makeAIMove(legalTokens) {
    if (!this.gameActive || legalTokens.length === 0) return;
    const player = this.getCurrentPlayer();
    const color = player.color;

    const scoredMoves = legalTokens.map(tok => {
      let score = 0;
      const currentStep = tok.step;
      const targetStep = currentStep === -1 ? 0 : currentStep + this.diceValue;

      // 1️⃣ Finish token if possible (+1000)
      if (targetStep === 56) {
        score += 1000;
      }

      // 2️⃣ Capture an enemy (+600, NEVER teammate!)
      if (targetStep >= 0 && targetStep <= 50) {
        const targetGlobal = (LUDO_OFFSETS[color] + targetStep) % 52;
        if (!LUDO_SAFE_CELLS.includes(targetGlobal)) {
          let hasEnemy = false;
          let hasTeammate = false;

          for (const oppColor of Object.keys(this.tokens)) {
            if (oppColor === color) continue;
            const oppPlayer = this.players.find(p => p.color === oppColor);
            const isTeammate = this.isTeamMode && oppPlayer && oppPlayer.team === player.team;

            for (const oppTok of this.tokens[oppColor]) {
              if (oppTok.step >= 0 && oppTok.step <= 50) {
                const oppGlobal = (LUDO_OFFSETS[oppColor] + oppTok.step) % 52;
                if (oppGlobal === targetGlobal && !LUDO_SAFE_CELLS.includes(oppGlobal)) {
                  if (isTeammate) {
                    hasTeammate = true;
                  } else {
                    hasEnemy = true;
                  }
                }
              }
            }
          }

          if (hasEnemy) {
            score += 600;
          } else if (hasTeammate) {
            score += 40; // Friendly companion / safe team sharing
          }
        }
      }

      // 3️⃣ Reaching safe spot or Home stretch
      if (targetStep > 50) {
        score += 250;
      } else if (targetStep >= 0) {
        const targetGlobal = (LUDO_OFFSETS[color] + targetStep) % 52;
        if (LUDO_SAFE_CELLS.includes(targetGlobal)) {
          score += 180;
        }
      }

      // 4️⃣ Avoid enemy danger / escape danger
      if (currentStep >= 0 && currentStep <= 50) {
        const currGlobal = (LUDO_OFFSETS[color] + currentStep) % 52;
        if (!LUDO_SAFE_CELLS.includes(currGlobal)) {
          let inDanger = false;
          for (const oppColor of Object.keys(this.tokens)) {
            if (oppColor === color) continue;
            const oppPlayer = this.players.find(p => p.color === oppColor);
            if (this.isTeamMode && oppPlayer && oppPlayer.team === player.team) continue;

            for (const oppTok of this.tokens[oppColor]) {
              if (oppTok.step >= 0 && oppTok.step <= 50) {
                const oppGlobal = (LUDO_OFFSETS[oppColor] + oppTok.step) % 52;
                const dist = (currGlobal - oppGlobal + 52) % 52;
                if (dist >= 1 && dist <= 6) {
                  inDanger = true;
                  break;
                }
              }
            }
            if (inDanger) break;
          }
          if (inDanger) {
            score += 220; // Flee from danger!
          }
        }
      }

      // 5️⃣ Exit yard on 6
      if (currentStep === -1 && this.diceValue === 6) {
        score += 300;
      }

      // 6️⃣ Move toward HOME (+progress)
      score += targetStep * 2;

      return { tok, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    const chosenToken = scoredMoves[0].tok;
    this.moveToken(color, chosenToken.id);
  }

  handleRemoteAction(action, payload) {
    if (action === 'LUDO_DICE_ROLLED') {
      this.currentTurnIndex = payload.turnIndex;
      this.diceValue = payload.diceValue;
      this.canRoll = false;
      this.isRolling = true;

      const diceCube = document.getElementById('ludo-dice-cube');
      if (diceCube) {
        diceCube.classList.add('rolling');
      }
      window.soundEngine.playDiceRoll();

      setTimeout(() => {
        this.isRolling = false;
        this.hasRolled = true;
        if (diceCube) {
          diceCube.classList.remove('rolling');
          this.updateDiceFace(this.diceValue);
        }

        if (this.diceValue === 6) {
          this.consecutiveSixes++;
        } else {
          this.consecutiveSixes = 0;
        }

        if (this.consecutiveSixes === 3) {
          this.consecutiveSixes = 0;
          this.hasRolled = false;
          this.canRoll = false;
          if (window.soundEngine?.playAlert) window.soundEngine.playAlert();
          const curr = this.getCurrentPlayer();
          if (window.app) {
            window.app.showToast(`🚫 3 Consecutive 6s by ${curr.name}! Turn forfeited.`, 'warning', '🎲');
          }
          this.render();
          return;
        }

        this.render();
        this.evaluateTurnMoves();
      }, 350);
    } else if (action === 'LUDO_TOKEN_MOVED') {
      const diceCube = document.getElementById('ludo-dice-cube');
      if (diceCube) {
        diceCube.classList.remove('rolling');
        this.updateDiceFace(payload.diceValue);
      }
      this.diceValue = payload.diceValue;
      this.isRolling = false;
      this.hasRolled = true;
      this.canRoll = false;
      this.moveToken(payload.color, payload.tokenId, true);
    } else if (action === 'LUDO_TOKEN_KILLED') {
      const tok = this.tokens[payload.killedColor]?.find(t => t.id === payload.killedTokenId);
      // Only trigger if token hasn't already returned to base!
      if (tok && tok.step >= 0) {
        const fromStep = payload.fromStep !== undefined ? payload.fromStep : tok.step;
        this.animateCapturedTokenReturn(payload.killedColor, tok, fromStep, () => {
          this.render();
        });
      }
    } else if (action === 'LUDO_PASS_TURN') {
      if (this.isMovingPawn) {
        // Buffer turn index so ongoing pawn hop finishes smoothly before turn advances
        this.pendingPassTurnIndex = payload.nextTurnIndex;
      } else {
        if (payload.nextTurnIndex !== undefined && payload.nextTurnIndex < this.players.length) {
          this.currentTurnIndex = payload.nextTurnIndex;
        }
        this.hasRolled = false;
        this.canRoll = true;
        this.isRolling = false;
        this.render();
      }
    } else if (action === 'LUDO_RESTART') {
      document.getElementById('modal-game-over')?.classList.remove('open');
      if (window.app) {
        window.app.restartCurrentGame('ludo');
      }
    }
  }

  // =========================================================================
  // Authentic Board Rendering
  // =========================================================================
  buildBoard() {
    const boardWrapper = document.getElementById('ludo-board-container');
    if (!boardWrapper) return;

    boardWrapper.innerHTML = `
      <svg id="real-ludo-svg" viewBox="0 0 600 600" class="real-ludo-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Chrome / Metallic Pin Shell Gradients (Matching User Reference Image) -->
          <linearGradient id="pinShellGrad" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="25%" stop-color="#f8fafc"/>
            <stop offset="65%" stop-color="#e2e8f0"/>
            <stop offset="100%" stop-color="#94a3b8"/>
          </linearGradient>

          <!-- Vibrant Gem Centers for Red, Green, Yellow, Blue -->
          <radialGradient id="gemRed" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fca5a5"/>
            <stop offset="30%" stop-color="#ef4444"/>
            <stop offset="75%" stop-color="#b91c1c"/>
            <stop offset="100%" stop-color="#7f1d1d"/>
          </radialGradient>

          <radialGradient id="gemGreen" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#86efac"/>
            <stop offset="30%" stop-color="#22c55e"/>
            <stop offset="75%" stop-color="#15803d"/>
            <stop offset="100%" stop-color="#14532d"/>
          </radialGradient>

          <radialGradient id="gemYellow" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="30%" stop-color="#eab308"/>
            <stop offset="75%" stop-color="#ca8a04"/>
            <stop offset="100%" stop-color="#854d0e"/>
          </radialGradient>

          <radialGradient id="gemBlue" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#7dd3fc"/>
            <stop offset="30%" stop-color="#0ea5e9"/>
            <stop offset="75%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </radialGradient>

          <!-- Legacy Gradients for Board Elements -->
          <radialGradient id="pawnHeadRed" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fda4af"/>
            <stop offset="35%" stop-color="#f43f5e"/>
            <stop offset="100%" stop-color="#881337"/>
          </radialGradient>
          <linearGradient id="pawnBodyRed" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fda4af"/>
            <stop offset="50%" stop-color="#f43f5e"/>
            <stop offset="100%" stop-color="#881337"/>
          </linearGradient>

          <radialGradient id="pawnHeadGreen" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#86efac"/>
            <stop offset="35%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </radialGradient>
          <linearGradient id="pawnBodyGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#86efac"/>
            <stop offset="50%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#064e3b"/>
          </linearGradient>

          <radialGradient id="pawnHeadYellow" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="35%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#78350f"/>
          </radialGradient>
          <linearGradient id="pawnBodyYellow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>

          <radialGradient id="pawnHeadBlue" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="35%" stop-color="#0ea5e9"/>
            <stop offset="100%" stop-color="#0c4a6e"/>
          </radialGradient>
          <linearGradient id="pawnBodyBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="50%" stop-color="#0ea5e9"/>
            <stop offset="100%" stop-color="#0c4a6e"/>
          </linearGradient>

          <g id="star-icon">
            <polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3" fill="#fbbf24" stroke="#d97706" stroke-width="1.2"/>
          </g>
        </defs>

        <rect x="0" y="0" width="600" height="600" rx="24" fill="#ffffff" stroke="#334155" stroke-width="4"/>

        <!-- 4 Corner Yards with white inner boxes and 4 circular pawn sockets -->
        <!-- Red Yard -->
        <rect id="ludo-yard-bg-red" x="0" y="0" width="240" height="240" rx="20" fill="#f43f5e"/>
        <rect x="36" y="36" width="168" height="168" rx="22" fill="#ffffff" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"/>
        <circle cx="80" cy="80" r="22" fill="#ffe4e6" stroke="#f43f5e" stroke-width="2.5"/>
        <circle cx="160" cy="80" r="22" fill="#ffe4e6" stroke="#f43f5e" stroke-width="2.5"/>
        <circle cx="80" cy="160" r="22" fill="#ffe4e6" stroke="#f43f5e" stroke-width="2.5"/>
        <circle cx="160" cy="160" r="22" fill="#ffe4e6" stroke="#f43f5e" stroke-width="2.5"/>

        <!-- Green Yard -->
        <rect id="ludo-yard-bg-green" x="360" y="0" width="240" height="240" rx="20" fill="#10b981"/>
        <rect x="396" y="36" width="168" height="168" rx="22" fill="#ffffff" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"/>
        <circle cx="440" cy="80" r="22" fill="#d1fae5" stroke="#10b981" stroke-width="2.5"/>
        <circle cx="520" cy="80" r="22" fill="#d1fae5" stroke="#10b981" stroke-width="2.5"/>
        <circle cx="440" cy="160" r="22" fill="#d1fae5" stroke="#10b981" stroke-width="2.5"/>
        <circle cx="520" cy="160" r="22" fill="#d1fae5" stroke="#10b981" stroke-width="2.5"/>

        <!-- Yellow Yard -->
        <rect id="ludo-yard-bg-yellow" x="360" y="360" width="240" height="240" rx="20" fill="#f59e0b"/>
        <rect x="396" y="396" width="168" height="168" rx="22" fill="#ffffff" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"/>
        <circle cx="440" cy="440" r="22" fill="#fef3c7" stroke="#f59e0b" stroke-width="2.5"/>
        <circle cx="520" cy="440" r="22" fill="#fef3c7" stroke="#f59e0b" stroke-width="2.5"/>
        <circle cx="440" cy="520" r="22" fill="#fef3c7" stroke="#f59e0b" stroke-width="2.5"/>
        <circle cx="520" cy="520" r="22" fill="#fef3c7" stroke="#f59e0b" stroke-width="2.5"/>

        <!-- Blue Yard -->
        <rect id="ludo-yard-bg-blue" x="0" y="360" width="240" height="240" rx="20" fill="#0ea5e9"/>
        <rect x="36" y="396" width="168" height="168" rx="22" fill="#ffffff" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.15))"/>
        <circle cx="80" cy="440" r="22" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2.5"/>
        <circle cx="160" cy="440" r="22" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2.5"/>
        <circle cx="80" cy="520" r="22" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2.5"/>
        <circle cx="160" cy="520" r="22" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2.5"/>

        <!-- Track Grid (15x15) -->
        <g id="ludo-grid-cells">
          ${this.generateSvgGridCells()}
        </g>

        <!-- Center Home Diamond (4 Triangles) -->
        <g id="ludo-center-diamond">
          <polygon points="240,240 240,360 300,300" fill="#f43f5e" stroke="#334155" stroke-width="2"/>
          <polygon points="240,240 360,240 300,300" fill="#10b981" stroke="#334155" stroke-width="2"/>
          <polygon points="360,240 360,360 300,300" fill="#f59e0b" stroke="#334155" stroke-width="2"/>
          <polygon points="240,360 360,360 300,300" fill="#0ea5e9" stroke="#334155" stroke-width="2"/>
          <circle cx="300" cy="300" r="24" fill="#1e293b" stroke="#fbbf24" stroke-width="3"/>
          <text x="300" y="306" font-size="16" text-anchor="middle" fill="#fbbf24">🏆</text>
        </g>

        <!-- Pulsating Target Landing Squares Layer -->
        <g id="ludo-targets-layer"></g>

        <!-- Dynamic Pawns Layer -->
        <g id="ludo-pawns-layer"></g>

        <!-- Top-level Flying / Hopping Pawn Layer -->
        <g id="ludo-flying-layer" pointer-events="none"></g>
      </svg>
    `;
  }

  generateSvgGridCells() {
    let out = '';
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const inYard = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c > 8) || (r > 8 && c < 6);
        const inCenter = (r >= 6 && r <= 8 && c >= 6 && c <= 8);
        if (inYard || inCenter) continue;

        const x = c * 40;
        const y = r * 40;
        let fill = '#ffffff';
        let isStar = false;

        // Colored Home Stretches
        if (r === 7 && c >= 1 && c <= 5) fill = '#f43f5e';
        else if (c === 7 && r >= 1 && r <= 5) fill = '#10b981';
        else if (r === 7 && c >= 9 && c <= 13) fill = '#f59e0b';
        else if (c === 7 && r >= 9 && r <= 13) fill = '#0ea5e9';

        // Colored Starting Squares
        else if (r === 6 && c === 1) fill = '#f43f5e';
        else if (r === 1 && c === 8) fill = '#10b981';
        else if (r === 8 && c === 13) fill = '#f59e0b';
        else if (r === 13 && c === 6) fill = '#0ea5e9';

        // Star Safe Cells on track
        if ((r === 2 && c === 6) || (r === 6 && c === 12) || (r === 12 && c === 8) || (r === 8 && c === 2)) {
          isStar = true;
        }

        out += `<rect x="${x}" y="${y}" width="40" height="40" fill="${fill}" stroke="#94a3b8" stroke-width="1.2"/>`;

        if (isStar) {
          out += `<use href="#star-icon" x="${x + 20}" y="${y + 20}"/>`;
        }
      }
    }
    return out;
  }

  render() {
    this.renderTurnBar();
    this.renderYardHighlights();
    this.renderTargetHighlights();
    this.renderPawns();
    this.renderPlayerCornerPods();
    this.renderControls();
  }

  renderTurnBar() {
    const bar = document.getElementById('ludo-live-turn-bar');
    if (!bar) return;

    const currPlayer = this.getCurrentPlayer();
    if (!currPlayer) {
      bar.innerHTML = '';
      return;
    }

    const isLocal = this.isCurrentPlayerLocal();
    const colorEmoji = currPlayer.color === 'red' ? '🔴' : (currPlayer.color === 'green' ? '🟢' : (currPlayer.color === 'yellow' ? '🟡' : '🔵'));
    const colorUpper = currPlayer.color.toUpperCase();
    const teamLabel = this.isTeamMode 
      ? (currPlayer.team === 1 ? 'TEAM A (Red & Yellow)' : 'TEAM B (Green & Blue)') 
      : '';

    let statusText = '';
    let actionPrompt = '';

    if (this.canRoll && !this.hasRolled) {
      if (isLocal) {
        statusText = `🎲 YOUR TURN (${colorUpper}) — ROLL DICE`;
        actionPrompt = `👉 Tap the "Roll Dice" button or tap the 3D die!`;
      } else {
        statusText = `⏳ ${currPlayer.name}'s Turn (${colorUpper})`;
        actionPrompt = `Waiting for ${currPlayer.name} to roll dice...`;
      }
    } else if (this.isRolling) {
      statusText = `🎲 Rolling dice (${colorUpper})...`;
      actionPrompt = isLocal ? 'Shaking the dice cup!' : `${currPlayer.name} is shaking the dice...`;
    } else if (this.hasRolled) {
      const legalTokens = this.getLegalMoves(currPlayer.color, this.diceValue);
      if (this.diceValue === 6) {
        statusText = `🎉 ${isLocal ? 'YOU' : currPlayer.name} ROLLED A 6! (${colorUpper})`;
      } else {
        statusText = `🎲 ${isLocal ? 'YOU' : currPlayer.name} ROLLED ${this.diceValue} (${colorUpper})`;
      }

      if (legalTokens.length > 0) {
        actionPrompt = isLocal 
          ? `👉 TAP YOUR BLINKING ${colorUpper} GOTI TO MOVE` 
          : `${currPlayer.name} is selecting a ${colorUpper} goti to move...`;
      } else {
        actionPrompt = `No moves available for ${this.diceValue}. Passing turn...`;
      }
    }

    bar.innerHTML = `
      <div class="live-turn-card active-${currPlayer.color}">
        <div class="live-turn-left">
          <span class="live-color-dot ${currPlayer.color}"></span>
          <div class="live-player-info">
            <div class="live-player-title">
              <span class="live-player-avatar">${currPlayer.avatar}</span>
              <strong class="live-player-name">${currPlayer.name}</strong>
              <span class="badge-color-tag badge-color-${currPlayer.color}">${colorEmoji} ${colorUpper}</span>
              ${isLocal ? '<span class="live-badge-you">YOU</span>' : (currPlayer.isAI ? '<span class="live-badge-bot">BOT</span>' : '<span class="live-badge-opp">OPPONENT</span>')}
              ${teamLabel ? `<span class="live-badge-team">${teamLabel}</span>` : ''}
            </div>
            <div class="live-player-sub">${actionPrompt}</div>
          </div>
        </div>
        <div class="live-turn-right">
          <div class="live-turn-status-pill pill-${currPlayer.color} ${isLocal ? 'pill-is-you' : 'pill-is-opp'}">${statusText}</div>
        </div>
      </div>
    `;
  }

  renderYardHighlights() {
    const currPlayer = this.getCurrentPlayer();
    const isTwoPlayerDuel = this.players.length === 2;
    ['red', 'green', 'yellow', 'blue'].forEach(col => {
      const bg = document.getElementById(`ludo-yard-bg-${col}`);
      if (bg) {
        if (isTwoPlayerDuel && (col === 'green' || col === 'blue')) {
          bg.style.opacity = '0.35';
          bg.classList.remove('yard-active-turn');
        } else {
          bg.style.opacity = '1';
          if (currPlayer && currPlayer.color === col) {
            bg.classList.add('yard-active-turn');
          } else {
            bg.classList.remove('yard-active-turn');
          }
        }
      }
    });
  }

  renderTargetHighlights() {
    const layer = document.getElementById('ludo-targets-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const currPlayer = this.getCurrentPlayer();
    if (!currPlayer || !this.hasRolled || !this.isCurrentPlayerLocal()) return;

    const legalTokens = this.getLegalMoves(currPlayer.color, this.diceValue);
    if (!legalTokens.length) return;

    legalTokens.forEach(tok => {
      let cellX = 0, cellY = 0;
      let isKill = false;

      if (tok.step === -1) {
        // Exiting to player's starting cell
        const startGlobal = LUDO_OFFSETS[currPlayer.color];
        const grid = LUDO_TRACK_COORDS[startGlobal];
        cellX = grid.c * 40;
        cellY = grid.r * 40;

        if (!LUDO_SAFE_CELLS.includes(startGlobal)) {
          Object.keys(this.tokens).forEach(oppColor => {
            if (oppColor === currPlayer.color) return;
            if (this.isTeamMode) {
              const oppP = this.players.find(p => p.color === oppColor);
              if (oppP && oppP.team === currPlayer.team) return;
            }
            if (this.tokens[oppColor].some(t => t.step >= 0 && t.step <= 50 && (LUDO_OFFSETS[oppColor] + t.step) % 52 === startGlobal)) {
              isKill = true;
            }
          });
        }
      } else if (tok.step + this.diceValue <= 50) {
        const targetGlobal = (LUDO_OFFSETS[currPlayer.color] + tok.step + this.diceValue) % 52;
        const grid = LUDO_TRACK_COORDS[targetGlobal];
        cellX = grid.c * 40;
        cellY = grid.r * 40;

        if (!LUDO_SAFE_CELLS.includes(targetGlobal)) {
          Object.keys(this.tokens).forEach(oppColor => {
            if (oppColor === currPlayer.color) return;
            if (this.isTeamMode) {
              const oppP = this.players.find(p => p.color === oppColor);
              if (oppP && oppP.team === currPlayer.team) return;
            }
            if (this.tokens[oppColor].some(t => t.step >= 0 && t.step <= 50 && (LUDO_OFFSETS[oppColor] + t.step) % 52 === targetGlobal)) {
              isKill = true;
            }
          });
        }
      } else if (tok.step + this.diceValue < 56) {
        const laneIdx = (tok.step + this.diceValue) - 51;
        const grid = LUDO_HOME_LANES[currPlayer.color][laneIdx];
        cellX = grid.c * 40;
        cellY = grid.r * 40;
      } else if (tok.step + this.diceValue === 56) {
        const goal = LUDO_GOAL_COORDS_SVG[currPlayer.color];
        cellX = goal.x - 20;
        cellY = goal.y - 20;
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'target-cell-group');
      g.style.cursor = 'pointer';

      if (isKill) {
        g.innerHTML = `
          <rect x="${cellX + 2}" y="${cellY + 2}" width="36" height="36" rx="8" class="target-highlight-box box-kill"/>
          <text x="${cellX + 20}" y="${cellY + 24}" font-size="14" text-anchor="middle" font-weight="900" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">⚔️</text>
        `;
      } else {
        g.innerHTML = `
          <rect x="${cellX + 2}" y="${cellY + 2}" width="36" height="36" rx="8" class="target-highlight-box box-normal"/>
          <circle cx="${cellX + 20}" cy="${cellY + 20}" r="4.5" fill="#f59e0b"/>
        `;
      }

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveToken(currPlayer.color, tok.id);
      });

      layer.appendChild(g);
    });
  }

  getTokenSvgCoords(color, step, tokenId = 0) {
    if (step === -1) {
      const yardList = LUDO_YARD_SOCKETS_SVG[color];
      return yardList ? (yardList[tokenId] || yardList[0]) : { x: 80, y: 80 };
    } else if (step <= 50) {
      const globalIdx = (LUDO_OFFSETS[color] + step) % 52;
      const grid = LUDO_TRACK_COORDS[globalIdx];
      return { x: grid.c * 40 + 20, y: grid.r * 40 + 20 };
    } else if (step < 56) {
      const laneIdx = step - 51;
      const grid = LUDO_HOME_LANES[color][laneIdx];
      return { x: grid.c * 40 + 20, y: grid.r * 40 + 20 };
    } else {
      return LUDO_GOAL_COORDS_SVG[color] || { x: 300, y: 300 };
    }
  }

  getPawnSvgMarkup(color, isMovable = false, isBlinking = false) {
    const colorCap = color.charAt(0).toUpperCase() + color.slice(1);
    const gemId = `gem${colorCap}`;

    return `
      <!-- Ground Drop Shadow directly under base ring -->
      <ellipse class="pawn-ground-shadow" cx="0" cy="1" rx="11" ry="3.8" fill="rgba(15, 23, 42, 0.4)"/>

      <!-- Dark Maroon Socket Ring (Centered exactly at 0, 0 matching reference image) -->
      <circle class="pawn-base-ring" cx="0" cy="0" r="11" fill="none" stroke="#701a24" stroke-width="2.6"/>

      <!-- Pulsing Turn Ring around Base Circle on Player's Turn -->
      ${isMovable ? '<circle cx="0" cy="0" r="13.5" class="pawn-turn-ring" fill="none" stroke="#f59e0b" stroke-width="2.5"/>' : ''}

      <!-- 3D Metallic Pin Pointer Body (Just popups normal on same place without jumping) -->
      <g class="pawn-body-group ${isMovable ? 'pawn-popup-turn' : ''}">
        <!-- Outer Metallic Teardrop / Map-Marker Pin Shell Pointing Downwards into Circle -->
        <path d="M 0,2.5 L -5.2,-0.8 A 9.5,9.5 0 1,1 5.2,-0.8 Z" 
              fill="url(#pinShellGrad)" 
              stroke="#334155" 
              stroke-width="1.1" 
              filter="drop-shadow(1px 2px 3px rgba(0,0,0,0.45))"/>

        <!-- Inner Bevel Highlight Rim -->
        <path d="M 0,1.2 L -4.2,-1.2 A 8,8 0 1 1 4.2,-1.2 Z" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.8)" 
              stroke-width="0.75"/>

        <!-- Colored Circular Lens / Gem inside the Pin Head -->
        <circle cx="0" cy="-8.5" r="6.2" 
                fill="url(#${gemId})" 
                stroke="#1e293b" 
                stroke-width="0.8"/>

        <!-- Specular Reflection Highlight Arc on Gem -->
        <ellipse cx="-2" cy="-10.5" rx="2" ry="1.2" 
                 fill="rgba(255, 255, 255, 0.85)"/>
        <circle cx="-0.8" cy="-11.2" r="0.75" 
                 fill="#ffffff"/>
      </g>
    `;
  }

  renderPawns() {
    const layer = document.getElementById('ludo-pawns-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const currPlayer = this.getCurrentPlayer();
    const legalTokens = this.hasRolled ? this.getLegalMoves(currPlayer.color, this.diceValue) : [];
    const isLocalTurn = this.isCurrentPlayerLocal();

    const posMap = {};

    this.players.forEach(p => {
      this.tokens[p.color].forEach(tok => {
        // If this token is currently hopping in flying-layer, don't render it statically
        if (this.animatingTokenKey === `${p.color}_${tok.id}`) return;

        const pt = this.getTokenSvgCoords(p.color, tok.step, tok.id);
        const key = `${Math.round(pt.x)}_${Math.round(pt.y)}`;
        if (!posMap[key]) posMap[key] = [];
        posMap[key].push({ color: p.color, tok, pt });
      });
    });

    Object.keys(posMap).forEach(k => {
      const list = posMap[k];
      const count = list.length;

      list.forEach((item, index) => {
        const { color, tok, pt } = item;
        let offsetX = 0, offsetY = 0;

        if (count === 2) {
          offsetX = index === 0 ? -6 : 6;
        } else if (count === 3) {
          offsetX = index === 0 ? 0 : (index === 1 ? -7 : 7);
          offsetY = index === 0 ? -6 : 5;
        } else if (count >= 4) {
          offsetX = (index % 2 === 0 ? -7 : 7);
          offsetY = (index < 2 ? -7 : 7);
        }

        const x = pt.x + offsetX;
        const y = pt.y + offsetY;

        const isCurrentTurn = currPlayer.color === color;
        const isMovable = isCurrentTurn && this.hasRolled && legalTokens.some(lt => lt.id === tok.id);
        const canClick = isMovable && isLocalTurn;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', `ludo-pawn-svg ${isMovable ? 'movable-pawn' : ''}`);
        g.setAttribute('transform', `translate(${x}, ${y})`);
        g.setAttribute('id', `pawn-svg-${color}-${tok.id}`);

        g.innerHTML = this.getPawnSvgMarkup(color, isMovable, isMovable);

        if (canClick) {
          g.style.cursor = 'pointer';
          g.addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveToken(color, tok.id);
          });
        }

        layer.appendChild(g);
      });
    });
  }

  renderPlayerCornerPods() {
    const podsContainer = document.getElementById('ludo-players-pods');
    if (!podsContainer) return;

    const curr = this.getCurrentPlayer();

    podsContainer.innerHTML = this.players.map(p => {
      const isTurn = curr.color === p.color;
      const isLocal = this.isPlayerLocal(p);
      const homeTokens = this.tokens[p.color].filter(t => t.step === 56).length;
      const isFinished = homeTokens === 4;
      const colorEmoji = p.color === 'red' ? '🔴' : (p.color === 'green' ? '🟢' : (p.color === 'yellow' ? '🟡' : '🔵'));
      const colorUpper = p.color.toUpperCase();

      const badgeHtml = this.isOnlineRoom 
        ? (isLocal ? '<span class="live-badge-you">YOU</span>' : '<span class="live-badge-opp">OPPONENT</span>')
        : (p.isAI ? '<span class="live-badge-bot">BOT</span>' : '');

      const teamTag = this.isTeamMode
        ? `<span class="badge-team-tag ${p.team === 1 ? 'team-tag-a' : 'team-tag-b'}">${p.team === 1 ? 'TEAM A' : 'TEAM B'}</span>`
        : '';

      return `
        <div class="player-pod pod-${p.color} ${isTurn ? 'active-turn' : ''} ${isLocal ? 'pod-is-local' : 'pod-is-opp'} ${isFinished ? 'pod-is-finished' : ''}">
          <div class="pod-avatar-ring">
            <span class="pod-avatar">${p.avatar}</span>
            ${isTurn ? '<div class="turn-pulse-ring"></div>' : ''}
          </div>
          <div class="pod-info">
            <div class="pod-name-row">
              <span class="pod-name">${p.name}</span>
              ${badgeHtml}
            </div>
            <div class="pod-meta-row">
              <span class="badge-color-tag badge-color-${p.color}">${colorEmoji} ${colorUpper}</span>
              ${teamTag}
              <span class="pod-score ${isFinished ? 'score-all-home' : ''}">${isFinished ? '✅ 4/4 HOME' : `Home: ${homeTokens}/4`}</span>
            </div>
            ${isTurn ? `<div class="pod-turn-status-banner ${isLocal ? 'banner-your-turn' : 'banner-opp-turn'}">${isLocal ? '🎲 YOUR TURN' : '⏳ OPPONENT TURN'}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  renderControls() {
    const rollBtn = document.getElementById('ludo-roll-btn');
    const rollBtnText = document.getElementById('ludo-roll-btn-text');
    const curr = this.getCurrentPlayer();
    if (!curr) return;

    const isLocal = this.isCurrentPlayerLocal();
    const colorEmoji = curr.color === 'red' ? '🔴' : (curr.color === 'green' ? '🟢' : (curr.color === 'yellow' ? '🟡' : '🔵'));
    const colorUpper = curr.color.toUpperCase();
    const legalTokens = this.hasRolled ? this.getLegalMoves(curr.color, this.diceValue) : [];

    // 1. Update Roll Button State & Label with explicit color name
    if (rollBtn) {
      rollBtn.disabled = !this.canRoll || this.hasRolled || !isLocal;

      let btnLabel = '';
      if (this.hasRolled) {
        if (this.diceValue === 6) {
          btnLabel = `🎉 Rolled 6! (${colorUpper}) Move Goti`;
          rollBtn.classList.add('celebrate-six');
        } else {
          btnLabel = `Rolled ${this.diceValue} (${colorUpper}) Move Goti`;
          rollBtn.classList.remove('celebrate-six');
        }
      } else {
        rollBtn.classList.remove('celebrate-six');
        btnLabel = isLocal ? `Roll Dice 🎲 (${colorUpper})` : `⏳ Waiting for ${curr.name} (${colorUpper})...`;
      }

      if (rollBtnText) {
        rollBtnText.textContent = btnLabel;
      } else {
        rollBtn.textContent = btnLabel;
      }
    }

    // 2. Update HUD Turn Badge (Player Name & Color Dot)
    const hudName = document.getElementById('ludo-hud-name');
    const hudDot = document.getElementById('ludo-hud-dot');
    const hudTeam = document.getElementById('ludo-hud-team');

    if (hudName) {
      hudName.innerHTML = `${curr.name} <span class="badge-color-tag badge-color-${curr.color}">${colorEmoji} ${colorUpper}</span> ${isLocal ? '<span class="live-badge-you">YOU</span>' : '<span class="live-badge-opp">OPP</span>'}`;
    }
    if (hudDot) hudDot.className = `hud-player-dot ${curr.color}`;
    if (hudTeam) {
      if (this.isTeamMode) {
        hudTeam.textContent = curr.team === 1 ? 'TEAM A (Red & Yellow)' : 'TEAM B (Green & Blue)';
        hudTeam.style.display = 'inline-block';
      } else {
        hudTeam.style.display = 'none';
      }
    }

    // 3. Update Tactical Commentary Pill
    const tacticalText = document.getElementById('ludo-hud-tactical-text');
    if (tacticalText) {
      if (this.canRoll && !this.hasRolled) {
        tacticalText.textContent = isLocal ? 'Tap "Roll Dice" or 3D die!' : 'Thinking...';
      } else if (this.isRolling) {
        tacticalText.textContent = '🎲 Shaking 3D dice cup...';
      } else if (this.hasRolled) {
        if (legalTokens.length === 0) {
          tacticalText.textContent = `No moves for ${this.diceValue}. Passing turn...`;
        } else {
          // Check for available kill
          const canKill = legalTokens.some(tok => {
            if (tok.step === -1) return false;
            const targetGlobal = (LUDO_OFFSETS[curr.color] + tok.step + this.diceValue) % 52;
            if (LUDO_SAFE_CELLS.includes(targetGlobal)) return false;
            return Object.keys(this.tokens).some(oppColor => {
              if (oppColor === curr.color) return false;
              if (this.isTeamMode) {
                const oppP = this.players.find(p => p.color === oppColor);
                if (oppP && oppP.team === curr.team) return false;
              }
              return this.tokens[oppColor].some(t => t.step >= 0 && t.step <= 50 && (LUDO_OFFSETS[oppColor] + t.step) % 52 === targetGlobal);
            });
          });

          if (canKill) {
            tacticalText.textContent = '⚔️ KILL AVAILABLE! Tap blinking goti!';
          } else if (this.diceValue === 6) {
            tacticalText.textContent = '🎉 6 Rolled! Tap goti to deploy or move!';
          } else {
            tacticalText.textContent = `👉 Tap blinking goti to move ${this.diceValue} steps`;
          }
        }
      }
    }

    // 4. Update 3D Rolling Tray Player Glow
    const tray = document.getElementById('ludo-dice-tray');
    if (tray) {
      tray.className = `dice-rolling-tray tray-glow-${curr.color}`;
    }

    // 5. Update Dice Cube Face
    this.updateDiceFace(this.diceValue);
  }
}

window.ludoGame = new RealLudoGame();
