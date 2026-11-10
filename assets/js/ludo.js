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

// Only the 4 golden STAR cells are safe from being killed!
// Starting cells are NOT safe (an opponent can be captured on starting cells!)
const LUDO_SAFE_CELLS = [8, 21, 34, 47];

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
  }

  setup(options = {}) {
    this.isTeamMode = options.mode === 'team';
    this.difficulty = options.difficulty || 'medium';
    this.isOnlineRoom = !!options.isOnlineRoom;
    const count = parseInt(options.playerCount || 4, 10);
    const twoPlayerFormat = options.twoPlayerFormat || 'single';
    this.twoPlayerFormat = twoPlayerFormat;

    let activeColors = [];
    if (count === 2) {
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
    } else {
      activeColors = ['red', 'green', 'yellow', 'blue'];
    }

    this.players = activeColors.map((color, idx) => {
      const config = (options.playersConfig && (options.playersConfig[color] || options.playersConfig[idx])) || {};
      // Team 1: Red & Yellow. Team 2: Green & Blue.
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

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  isCurrentPlayerLocal() {
    const p = this.getCurrentPlayer();
    if (!p) return false;
    if (p.isAI) return false;
    if (this.isOnlineRoom) {
      const isHost = window.multiplayerManager ? window.multiplayerManager.isHost : true;
      if (this.twoPlayerFormat === 'double') {
        // Host controls Team 1 (Red & Yellow), Guest controls Team 2 (Green & Blue)
        return isHost ? (p.color === 'red' || p.color === 'yellow') : (p.color === 'green' || p.color === 'blue');
      } else {
        const mySlot = window.multiplayerManager ? window.multiplayerManager.localPlayerSlot : 1;
        const playerSlot = this.players.indexOf(p) + 1;
        return mySlot === playerSlot;
      }
    }
    return true;
  }

  rollDice(isRemoteAction = false, remoteValue = null) {
    if (!this.gameActive) return;
    if (!isRemoteAction && (!this.canRoll || this.hasRolled || this.isRolling)) return;
    
    if (!isRemoteAction && this.isOnlineRoom) {
      if (!window.multiplayerManager || !window.multiplayerManager.connected || !window.multiplayerManager.isMatchStarted) {
        if (window.app) window.app.showToast('🔒 Waiting for friend to join! You cannot play alone in an online room.', 'warning');
        return;
      }
      if (!this.isCurrentPlayerLocal()) {
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
        if (window.app) {
          window.app.showPopup({
            title: 'Turn Forfeited! 🚫',
            message: 'Three consecutive 6s rolled! According to official championship rules, the turn is immediately forfeited.',
            type: 'warning',
            icon: '🎲',
            confirmText: 'Pass Turn ➔'
          });
        }
        setTimeout(() => this.passTurn(), 900);
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
      if (this.isOnlineRoom && window.multiplayerManager && this.isCurrentPlayerLocal()) {
        window.multiplayerManager.sendAction('LUDO_PASS_TURN', {
          nextTurnIndex: (this.currentTurnIndex + 1) % this.players.length
        });
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
    if (!isRemoteAction && !this.hasRolled) return;
    const player = this.getCurrentPlayer();
    if (player.color !== color) return;

    if (!isRemoteAction && this.isOnlineRoom) {
      if (!window.multiplayerManager || !window.multiplayerManager.connected || !window.multiplayerManager.isMatchStarted) {
        if (window.app) window.app.showToast('🔒 Waiting for friend to join! You cannot play alone in an online room.', 'warning');
        return;
      }
      if (!this.isCurrentPlayerLocal()) return;
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

    if (token.step === -1) {
      // Release from yard with parabolic leap animation
      this.animateYardExit(color, token, () => {
        this.checkCellEvents(color, token);
      });
    } else {
      const targetStep = token.step + this.diceValue;
      this.animateStepMovement(color, token, targetStep, () => {
        this.checkCellEvents(color, token);
      });
    }
  }

  animateYardExit(color, token, callback) {
    const flyingLayer = document.getElementById('ludo-flying-layer');
    if (!flyingLayer) {
      token.step = 0;
      this.renderPawns();
      callback();
      return;
    }

    this.animatingTokenKey = `${color}_${token.id}`;
    this.renderPawns();

    flyingLayer.innerHTML = '';
    const flyingG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    flyingG.setAttribute('class', 'ludo-flying-goti');
    flyingG.innerHTML = this.getPawnSvgMarkup(color, false, false);
    flyingLayer.appendChild(flyingG);

    const fromPt = this.getTokenSvgCoords(color, -1, token.id);
    const toPt = this.getTokenSvgCoords(color, 0, token.id);

    const shadowEl = flyingG.querySelector('.pawn-ground-shadow');
    const baseRingEl = flyingG.querySelector('.pawn-base-ring');
    const bodyEl = flyingG.querySelector('.pawn-body-group');

    window.soundEngine.playYardExit();

    const duration = 280;
    const startTime = performance.now();
    const arcHeight = 35; // high release leap arc

    const stepFrame = (now) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);

      const arc = 4 * p * (1 - p);
      const curArcY = -arcHeight * arc;

      const curX = fromPt.x + (toPt.x - fromPt.x) * p;
      const curY = fromPt.y + (toPt.y - fromPt.y) * p + curArcY;

      flyingG.setAttribute('transform', `translate(${curX}, ${curY})`);

      if (bodyEl) {
        const tilt = 12 * Math.sin(p * Math.PI);
        bodyEl.setAttribute('transform', `rotate(${tilt})`);
      }

      if (shadowEl) {
        const shadowScale = 1 - 0.5 * arc;
        shadowEl.setAttribute('transform', `translate(0, ${-curArcY}) scale(${shadowScale})`);
      }

      if (baseRingEl) {
        baseRingEl.setAttribute('transform', `translate(0, ${-curArcY})`);
      }

      if (p < 1) {
        requestAnimationFrame(stepFrame);
      } else {
        window.soundEngine.playHop();
        token.step = 0;
        flyingLayer.innerHTML = '';
        this.animatingTokenKey = null;
        this.renderPawns();
        callback();
      }
    };

    requestAnimationFrame(stepFrame);
  }

  animateStepMovement(color, token, targetStep, callback) {
    const flyingLayer = document.getElementById('ludo-flying-layer');
    if (!flyingLayer) {
      token.step = targetStep;
      this.renderPawns();
      callback();
      return;
    }

    this.animatingTokenKey = `${color}_${token.id}`;
    this.renderPawns();

    flyingLayer.innerHTML = '';
    const flyingG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    flyingG.setAttribute('class', 'ludo-flying-goti');
    flyingG.innerHTML = this.getPawnSvgMarkup(color, false, false);
    flyingLayer.appendChild(flyingG);

    const shadowEl = flyingG.querySelector('.pawn-ground-shadow');
    const baseRingEl = flyingG.querySelector('.pawn-base-ring');
    const bodyEl = flyingG.querySelector('.pawn-body-group');

    const totalSteps = targetStep - token.step;
    let currentStepIdx = 0;

    const performNextHop = () => {
      if (currentStepIdx >= totalSteps) {
        flyingLayer.innerHTML = '';
        this.animatingTokenKey = null;
        token.step = targetStep;
        this.renderPawns();
        callback();
        return;
      }

      const fromStep = token.step;
      const toStep = fromStep + 1;
      const fromPt = this.getTokenSvgCoords(color, fromStep, token.id);
      const toPt = this.getTokenSvgCoords(color, toStep, token.id);

      const hopDuration = 150;
      const hopStartTime = performance.now();
      const arcHeight = 22;

      const dx = toPt.x - fromPt.x;
      const dy = toPt.y - fromPt.y;
      const tiltAngle = dx > 0 ? 10 : (dx < 0 ? -10 : (dy > 0 ? 6 : -6));

      const stepFrame = (now) => {
        const elapsed = now - hopStartTime;
        const p = Math.min(1, elapsed / hopDuration);

        const arc = 4 * p * (1 - p);
        const curArcY = -arcHeight * arc;

        const curX = fromPt.x + (toPt.x - fromPt.x) * p;
        const curY = fromPt.y + (toPt.y - fromPt.y) * p + curArcY;

        flyingG.setAttribute('transform', `translate(${curX}, ${curY})`);

        if (bodyEl) {
          const curTilt = tiltAngle * Math.sin(p * Math.PI);
          bodyEl.setAttribute('transform', `rotate(${curTilt})`);
        }

        if (shadowEl) {
          const shadowScale = 1 - 0.45 * arc;
          const shadowOpacity = 0.45 - 0.25 * arc;
          shadowEl.setAttribute('transform', `translate(0, ${-curArcY}) scale(${shadowScale})`);
          shadowEl.setAttribute('fill', `rgba(15, 23, 42, ${shadowOpacity})`);
        }

        if (baseRingEl) {
          baseRingEl.setAttribute('transform', `translate(0, ${-curArcY})`);
        }

        if (p < 1) {
          requestAnimationFrame(stepFrame);
        } else {
          token.step = toStep;
          currentStepIdx++;

          window.soundEngine.playHop();

          if (bodyEl) {
            bodyEl.setAttribute('transform', 'scale(1.15, 0.86)');
            setTimeout(() => {
              if (bodyEl) bodyEl.setAttribute('transform', 'scale(1, 1)');
            }, 30);
          }

          setTimeout(() => {
            performNextHop();
          }, 35);
        }
      };

      requestAnimationFrame(stepFrame);
    };

    performNextHop();
  }

  checkCellEvents(color, token) {
    let earnedExtraTurn = false;

    // Home finish
    if (token.step === 56) {
      window.soundEngine.playWin();
      earnedExtraTurn = true;
      if (window.app) window.app.showToast(`🎉 ${this.getCurrentPlayer().name} finished a pawn!`, 'success');

      if (this.hasPlayerWon(color)) {
        this.handlePlayerWin(color);
        return;
      }
    } else if (token.step >= 0 && token.step <= 50) {
      // Outer track loop: Check for opponent capture / kill!
      const globalPos = (LUDO_OFFSETS[color] + token.step) % 52;
      const isSafe = LUDO_SAFE_CELLS.includes(globalPos);

      if (!isSafe) {
        const currPlayer = this.getCurrentPlayer();
        
        Object.keys(this.tokens).forEach(oppColor => {
          if (oppColor === color) return;
          const oppPlayer = this.players.find(p => p.color === oppColor);
          if (this.isTeamMode && oppPlayer && oppPlayer.team === currPlayer.team) return;

          this.tokens[oppColor].forEach(oppTok => {
            // If opponent is also on outer track
            if (oppTok.step >= 0 && oppTok.step <= 50) {
              const oppGlobal = (LUDO_OFFSETS[oppColor] + oppTok.step) % 52;
              if (oppGlobal === globalPos) {
                // KILLED! Send back to yard
                oppTok.step = -1;
                window.soundEngine.playCapture();
                earnedExtraTurn = true;
                this.renderPawns(); // Immediate visual update

                if (window.app) {
                  window.app.showToast(`${currPlayer.name} KILLED ${oppPlayer.name}'s pawn!`, 'warning', '⚔️');
                }

                // Broadcast kill to multiplayer
                if (this.isOnlineRoom && window.multiplayerManager) {
                  window.multiplayerManager.sendAction('LUDO_TOKEN_KILLED', {
                    killedColor: oppColor,
                    killedTokenId: oppTok.id
                  });
                }
              }
            }
          });
        });
      }
    }

    if (this.diceValue === 6 || earnedExtraTurn) {
      this.canRoll = true;
      this.hasRolled = false;
      this.render();
      if (this.getCurrentPlayer().isAI) {
        setTimeout(() => this.executeAITurn(), 700);
      }
    } else {
      this.passTurn();
    }
  }

  hasPlayerWon(color) {
    return this.tokens[color].every(t => t.step === 56);
  }

  handlePlayerWin(winnerColor) {
    const winnerPlayer = this.players.find(p => p.color === winnerColor);
    if (!this.winners.includes(winnerColor)) {
      this.winners.push(winnerColor);
    }

    window.soundEngine.playWin();
    window.confettiCannon.fire();

    this.gameActive = false;
    const isUserWinner = !winnerPlayer.isAI;
    window.gameStorage.recordMatch('ludo', isUserWinner ? 'win' : 'loss', `${this.isTeamMode ? 'Team' : 'Classic'} Ludo`);

    let winTitle = `🏆 ${winnerPlayer.name} Wins!`;
    let winDesc = 'All 4 tokens conquered the center home diamond!';
    if (this.isTeamMode) {
      const teamName = winnerPlayer.team === 1 ? 'Team 1 (Red & Yellow)' : 'Team 2 (Blue & Green)';
      winTitle = `🏆 ${teamName} Victory!`;
      winDesc = `${winnerPlayer.name} guided their tokens home to claim victory!`;
    }

    setTimeout(() => {
      if (window.app) {
        window.app.showGameOverModal({
          title: winTitle,
          message: winDesc,
          gameType: 'ludo',
          onPlayAgain: () => {
            if (this.isOnlineRoom && window.multiplayerManager) {
              window.multiplayerManager.sendAction('LUDO_RESTART', {});
            }
            this.setup({
              playerCount: this.twoPlayerFormat === 'double' ? 2 : this.players.length,
              twoPlayerFormat: this.twoPlayerFormat,
              mode: this.isTeamMode ? 'team' : 'individual',
              difficulty: this.difficulty,
              isOnlineRoom: this.isOnlineRoom
            });
          },
          onRestart: () => {
            if (this.isOnlineRoom && window.multiplayerManager) {
              window.multiplayerManager.sendAction('LUDO_RESTART', {});
            }
            this.setup({
              playerCount: this.twoPlayerFormat === 'double' ? 2 : this.players.length,
              twoPlayerFormat: this.twoPlayerFormat,
              mode: this.isTeamMode ? 'team' : 'individual',
              difficulty: this.difficulty,
              isOnlineRoom: this.isOnlineRoom
            });
          }
        });
      }
    }, 700);
  }

  passTurn() {
    this.consecutiveSixes = 0;
    this.hasRolled = false;
    this.canRoll = true;

    let count = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      count++;
    } while (this.hasPlayerWon(this.getCurrentPlayer().color) && count < this.players.length);

    this.render();

    if (this.getCurrentPlayer().isAI && this.gameActive) {
      setTimeout(() => this.executeAITurn(), 700);
    }
  }

  executeAITurn() {
    if (!this.gameActive) return;
    this.rollDice();
  }

  makeAIMove(legalTokens) {
    if (!this.gameActive || legalTokens.length === 0) return;
    const player = this.getCurrentPlayer();
    const color = player.color;

    // AI Strategy: Prioritize capturing/killing opponent tokens!
    const capturingToken = legalTokens.find(tok => {
      const targetStep = tok.step === -1 ? 0 : tok.step + this.diceValue;
      if (targetStep > 50) return false;
      const targetGlobal = (LUDO_OFFSETS[color] + targetStep) % 52;
      if (LUDO_SAFE_CELLS.includes(targetGlobal)) return false;

      return Object.keys(this.tokens).some(oppColor => {
        if (oppColor === color) return false;
        if (this.isTeamMode) {
          const oppPlayer = this.players.find(p => p.color === oppColor);
          if (oppPlayer && oppPlayer.team === player.team) return false;
        }
        return this.tokens[oppColor].some(oppTok => {
          if (oppTok.step >= 0 && oppTok.step <= 50) {
            return (LUDO_OFFSETS[oppColor] + oppTok.step) % 52 === targetGlobal;
          }
          return false;
        });
      });
    });

    const finishToken = legalTokens.find(tok => tok.step + this.diceValue === 56);
    const baseToken = legalTokens.find(tok => tok.step === -1);
    const safeToken = legalTokens.find(tok => {
      const next = tok.step + this.diceValue;
      return next >= 51 || LUDO_SAFE_CELLS.includes((LUDO_OFFSETS[color] + next) % 52);
    });

    // 1. Capture/Kill if possible!
    // 2. Finish home
    // 3. Exit base on 6
    // 4. Safe spot
    // 5. Normal advance
    let chosenToken = capturingToken || finishToken || (baseToken && this.diceValue === 6 ? baseToken : safeToken) || legalTokens[0];
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
      if (tok) {
        tok.step = -1;
        window.soundEngine.playCapture();
        this.renderPawns();
      }
    } else if (action === 'LUDO_PASS_TURN') {
      if (payload.nextTurnIndex !== undefined) {
        this.currentTurnIndex = payload.nextTurnIndex;
      }
      this.hasRolled = false;
      this.canRoll = true;
      this.isRolling = false;
      this.render();
    } else if (action === 'LUDO_RESTART') {
      this.setup({
        playerCount: this.twoPlayerFormat === 'double' ? 2 : this.players.length,
        twoPlayerFormat: this.twoPlayerFormat,
        mode: this.isTeamMode ? 'team' : 'individual',
        difficulty: this.difficulty,
        isOnlineRoom: true
      });
      if (window.app) window.app.showToast('Match restarted!', 'info', '🔄');
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
    const teamLabel = this.isTeamMode 
      ? (currPlayer.team === 1 ? 'Team 1 (Red & Yellow)' : 'Team 2 (Blue & Green)') 
      : '';

    let statusText = '';
    let actionPrompt = '';

    if (this.canRoll && !this.hasRolled) {
      statusText = isLocal ? '🎲 YOUR TURN — ROLL DICE' : `⏳ ${currPlayer.name}'s turn...`;
      actionPrompt = isLocal ? 'Tap "Roll Dice" button or tap the 3D die!' : 'Thinking...';
    } else if (this.isRolling) {
      statusText = '🎲 Rolling dice...';
      actionPrompt = 'Shaking the cup!';
    } else if (this.hasRolled) {
      const legalTokens = this.getLegalMoves(currPlayer.color, this.diceValue);
      if (this.diceValue === 6) {
        statusText = '🎉 ROLLED A 6! EXTRA TURN!';
      } else {
        statusText = `🎲 Rolled a ${this.diceValue}`;
      }

      if (legalTokens.length > 0) {
        actionPrompt = isLocal 
          ? '👉 TAP ANY BLINKING GOTI OR TARGET SQUARE TO MOVE' 
          : `${currPlayer.name} is making a move...`;
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
              ${isLocal ? '<span class="live-badge-you">YOU</span>' : (currPlayer.isAI ? '<span class="live-badge-bot">BOT</span>' : '<span class="live-badge-opp">OPPONENT</span>')}
              ${teamLabel ? `<span class="live-badge-team">${teamLabel}</span>` : ''}
            </div>
            <div class="live-player-sub">${actionPrompt}</div>
          </div>
        </div>
        <div class="live-turn-right">
          <div class="live-turn-status-pill">${statusText}</div>
        </div>
      </div>
    `;
  }

  renderYardHighlights() {
    const currPlayer = this.getCurrentPlayer();
    ['red', 'green', 'yellow', 'blue'].forEach(col => {
      const bg = document.getElementById(`ludo-yard-bg-${col}`);
      if (bg) {
        if (currPlayer && currPlayer.color === col) {
          bg.classList.add('yard-active-turn');
        } else {
          bg.classList.remove('yard-active-turn');
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
      const homeTokens = this.tokens[p.color].filter(t => t.step === 56).length;
      return `
        <div class="player-pod pod-${p.color} ${isTurn ? 'active-turn' : ''}">
          <div class="pod-avatar-ring">
            <span class="pod-avatar">${p.avatar}</span>
            ${isTurn ? '<div class="turn-pulse-ring"></div>' : ''}
          </div>
          <div class="pod-info">
            <span class="pod-name">${p.name}</span>
            <span class="pod-score">Home: ${homeTokens}/4</span>
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
    const legalTokens = this.hasRolled ? this.getLegalMoves(curr.color, this.diceValue) : [];

    // 1. Update Roll Button State & Label
    if (rollBtn) {
      rollBtn.disabled = !this.canRoll || this.hasRolled || !isLocal;

      let btnLabel = '';
      if (this.hasRolled) {
        if (this.diceValue === 6) {
          btnLabel = '🎉 Rolled: 6! (Extra Roll)';
          rollBtn.classList.add('celebrate-six');
        } else {
          btnLabel = `Rolled: ${this.diceValue}`;
          rollBtn.classList.remove('celebrate-six');
        }
      } else {
        rollBtn.classList.remove('celebrate-six');
        btnLabel = isLocal ? 'Roll Dice 🎲' : `${curr.name}'s Turn...`;
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

    if (hudName) hudName.textContent = curr.name;
    if (hudDot) hudDot.className = `hud-player-dot ${curr.color}`;
    if (hudTeam) {
      if (this.isTeamMode) {
        hudTeam.textContent = curr.team === 1 ? 'Team 1 (Red & Yellow)' : 'Team 2 (Blue & Green)';
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
