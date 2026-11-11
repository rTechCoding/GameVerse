/**
 * Interactive Piece & Rules Guide Engine (गोटियों व मोहरों के नियम एवं चालें)
 * Dedicated game-specific guides for Ludo, Chess, and Tic-Tac-Toe with live board simulations.
 */

class PieceGuideEngine {
  constructor() {
    this.activeGame = 'ludo';
    this.activePieceKey = 'YARD_6';
    this.animationTimer = null;
    this.demoPiecePos = { r: 2, c: 2 };
    this.initDatabase();
  }

  initDatabase() {
    this.gameGuides = {
      ludo: {
        badge: '🎲 LUDO CHAMPIONSHIP',
        heading: '🎲 Ludo Goti Rules & Strategy Guide',
        defaultKey: 'YARD_6',
        topics: {
          YARD_6: {
            key: 'YARD_6',
            name: 'Yard Exit on 6 (6 पर गोटी निकलना)',
            role: 'Deployment Rule',
            points: 'Roll 6 Required',
            color: '#f43f5e',
            icon: '6️⃣',
            desc: 'Pawns start safely locked inside their colored corner yard sockets. Rolling a 6 unlocks and deploys your goti onto your starting track cell!',
            moveRule: '1. Roll a 6 on the 3D dice to release a pawn from your yard to the start cell.\n2. Rolling a 6 immediately awards you an EXTRA FREE ROLL!',
            captureRule: 'Pawns inside the yard are completely protected and cannot be captured.',
            specialPower: '🌟 Bonus Roll: Every 6 rolled gives you another turn!\n🚫 Three 6s Penalty: Rolling three 6s consecutively forfeits the turn.',
            proTip: 'Whenever you roll a 6, prioritize deploying a new goti from your yard so you have multiple tactical options on the board.',
            startR: 4, startC: 0,
            validTargets: [
              { r: 3, c: 1, type: 'step', desc: 'Starting Cell' }
            ],
            animPath: [{ r: 4, c: 0 }, { r: 3, c: 1 }, { r: 4, c: 0 }]
          },
          TRACK_MOVE: {
            key: 'TRACK_MOVE',
            name: 'Track Advance (चाल व कदम)',
            role: 'Clockwise Circuit',
            points: '1 to 6 Steps',
            color: '#38bdf8',
            icon: '🚶',
            desc: 'Every active goti journeys clockwise around the 52 outer track cells toward its colored home column.',
            moveRule: 'Advances forward strictly clockwise according to the exact number on the dice.',
            captureRule: 'Landing on an opponent pawn outside safe zones captures and banishes them back to their yard.',
            specialPower: '🌟 Interactive Pulsing Hints: Blinking goties and pulsing target squares show exactly where you can move.\n🌟 Safe Lanes: Home stretch is accessible only by your color.',
            proTip: 'Do not cluster all goties on one square unless it is a safe star square.',
            startR: 3, startC: 1,
            validTargets: [
              { r: 2, c: 1, type: 'step', desc: 'Step 1' },
              { r: 1, c: 1, type: 'step', desc: 'Step 2' },
              { r: 0, c: 1, type: 'step', desc: 'Step 3' }
            ],
            animPath: [{ r: 3, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 1 }, { r: 0, c: 1 }, { r: 3, c: 1 }]
          },
          KILL_CAPTURE: {
            key: 'KILL_CAPTURE',
            name: 'Kill & Extra Turn (गोटी काटना व बोनस)',
            role: 'Aggressive Strike',
            points: 'Bonus Roll + Kill',
            color: '#ef4444',
            icon: '⚔️',
            desc: 'Landing on any opponent goti on an unsafe track cell KILLS IT! The killed goti is reset to its yard socket, and you receive an immediate FREE EXTRA ROLL!',
            moveRule: 'Pulse indicator displays a red ⚔️ KILL target cell showing instant capture availability.',
            captureRule: '⚔️ Banishment: Opponent goti is knocked off the circuit back to step -1 (yard).',
            specialPower: '🌟 Chain Bonus: You immediately get to roll again after making a kill, allowing devastating attack chains!',
            proTip: 'Always capture opponent goties when given the chance! It delays their progress and grants you extra turns.',
            startR: 3, startC: 1,
            validTargets: [
              { r: 1, c: 3, type: 'capture', desc: '⚔️ KILL Opponent Goti!' }
            ],
            animPath: [{ r: 3, c: 1 }, { r: 1, c: 3 }, { r: 3, c: 1 }]
          },
          SAFE_STARS: {
            key: 'SAFE_STARS',
            name: 'Safe Star Cells (सुरक्षित स्टार)',
            role: 'Protected Bastion',
            points: 'Safe Haven',
            color: '#fbbf24',
            icon: '⭐',
            desc: 'The 8 Star squares on the circuit are SAFE ZONES. No goti can ever be killed or captured on a Star square!',
            moveRule: 'Move onto a star square when your dice count matches.',
            captureRule: '🛡️ Immune: Goties on star cells cannot be killed. Multiple players can peacefully share a star square.',
            specialPower: '🌟 Sanctuary: Rest safely while opponent pawns pass by harmlessly.',
            proTip: 'Park your pawns on star squares while waiting for high rolls to jump straight into your colored home stretch.',
            startR: 3, startC: 1,
            validTargets: [
              { r: 2, c: 2, type: 'step', desc: '⭐ Safe Star Square' }
            ],
            animPath: [{ r: 3, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 1 }]
          },
          TEAM_MODE: {
            key: 'TEAM_MODE',
            name: 'Team 2v2 Mode (टीम नियम)',
            role: 'Allied Coordination',
            points: 'Red+Yellow vs Blue+Green',
            color: '#10b981',
            icon: '👥',
            desc: 'In 2-Player Double / Team Mode, Red & Yellow form Team 1, and Blue & Green form Team 2! Teammates work together to win.',
            moveRule: 'Turn rotation cycles: Red ➔ Green ➔ Yellow ➔ Blue.',
            captureRule: '🛡️ Teammate Protection: Red and Yellow NEVER kill each other! Blue and Green NEVER kill each other.',
            specialPower: '🌟 Allied Blockade: Teammates can stand on the same square safely and block opponents.',
            proTip: 'One teammate can act as the hunter attacking opponent pawns, while the other rushes pawns toward the home diamond.',
            startR: 3, startC: 1,
            validTargets: [
              { r: 2, c: 2, type: 'step', desc: 'Allied Safe Coexistence' }
            ],
            animPath: [{ r: 3, c: 1 }, { r: 2, c: 2 }, { r: 3, c: 1 }]
          },
          HOME_VICTORY: {
            key: 'HOME_VICTORY',
            name: 'Home Diamond Run (घर जीतना)',
            role: 'Final Conquest',
            points: 'Victory Condition',
            color: '#f59e0b',
            icon: '🏆',
            desc: 'After completing the full track, enter your colored home stretch. Enter all 4 goties into the center trophy diamond to win!',
            moveRule: 'Requires an EXACT dice roll to enter the center winner diamond (step 56). Over-rolls must wait.',
            captureRule: 'Home stretches are 100% private: no opponent can ever enter your colored home stretch.',
            specialPower: '🌟 Home Bonus: Entering a pawn into the home center diamond awards a FREE extra roll!',
            proTip: 'Once a pawn enters your colored home stretch, it is safe forever. Guide all 4 pawns home for championship victory!',
            startR: 2, startC: 1,
            validTargets: [
              { r: 2, c: 2, type: 'step', desc: 'Home Stretch' },
              { r: 2, c: 3, type: 'step', desc: 'Trophy Diamond 🏆' }
            ],
            animPath: [{ r: 2, c: 1 }, { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 1 }]
          }
        }
      },

      chess: {
        badge: '♟️ TOURNAMENT CHESS',
        heading: '♟️ Chess Pieces & Tactical Rules Guide',
        defaultKey: 'N',
        topics: {
          P: {
            key: 'P',
            name: 'Pawn (प्यादा / सिपाही)',
            role: 'The Brave Infantry',
            points: '1 Point',
            color: '#10b981',
            icon: '♟️',
            desc: 'Pawns are the soul of chess. They march forward courageously and guard the kingdom.',
            moveRule: 'Moves forward 1 square. On its very FIRST move from rank 2, it has the superpower to advance 2 squares forward!',
            captureRule: 'Captures 1 square DIAGONALLY forward (never straight). Cannot move backward.',
            specialPower: '🌟 Promotion (वज़ीर बनना): Reaching the opposite end transforms it into a Queen, Rook, Bishop, or Knight!\n🌟 En Passant: Captures an opponent pawn that double-stepped past it.',
            proTip: 'Keep your pawn structure solid. Connected pawns defend each other diagonally!',
            startR: 3, startC: 2,
            validTargets: [
              { r: 2, c: 2, type: 'step', desc: '1-Step Forward' },
              { r: 1, c: 2, type: 'double', desc: '2-Step First Move' },
              { r: 2, c: 1, type: 'capture', desc: 'Diagonal Capture Left' },
              { r: 2, c: 3, type: 'capture', desc: 'Diagonal Capture Right' }
            ],
            animPath: [{ r: 3, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 1 }, { r: 3, c: 2 }]
          },
          N: {
            key: 'N',
            name: 'Knight (घोड़ा / अश्व)',
            role: 'The Tactical Jumper',
            points: '3 Points',
            color: '#38bdf8',
            icon: '♞',
            desc: 'The only piece on the entire chessboard that can JUMP OVER any other piece (friend or foe)!',
            moveRule: 'Moves in an iconic "L-shape": 2 squares in one direction + 1 square sideways.',
            captureRule: 'Captures by landing directly on the destination square of its L-shape jump.',
            specialPower: '🌟 Jump Ability: Can leap out on move 1 over friendly pawns.\n🌟 Fork Specialist: Can attack King and Queen at the same time!',
            proTip: 'Knights are strongest in the center of the board where they control up to 8 squares at once.',
            startR: 2, startC: 2,
            validTargets: [
              { r: 0, c: 1, type: 'step', desc: 'L-Jump' }, { r: 0, c: 3, type: 'step', desc: 'L-Jump' },
              { r: 1, c: 0, type: 'step', desc: 'L-Jump' }, { r: 1, c: 4, type: 'step', desc: 'L-Jump' },
              { r: 3, c: 0, type: 'step', desc: 'L-Jump' }, { r: 3, c: 4, type: 'step', desc: 'L-Jump' },
              { r: 4, c: 1, type: 'step', desc: 'L-Jump' }, { r: 4, c: 3, type: 'step', desc: 'L-Jump' }
            ],
            animPath: [{ r: 2, c: 2 }, { r: 0, c: 3 }, { r: 1, c: 1 }, { r: 3, c: 0 }, { r: 2, c: 2 }]
          },
          B: {
            key: 'B',
            name: 'Bishop (ऊंट / गज)',
            role: 'The Diagonal Sniper',
            points: '3 Points',
            color: '#f59e0b',
            icon: '♝',
            desc: 'Speedy long-range sniper that cuts across the entire board diagonally.',
            moveRule: 'Slides any number of squares diagonally as long as no other piece blocks its path.',
            captureRule: 'Captures by landing on an enemy piece standing in its diagonal trajectory.',
            specialPower: '🌟 Color Bound: Stays on its starting color (Light or Dark squares) for the whole match.\n🌟 The Bishop Pair: Having both bishops controls the entire board!',
            proTip: 'Place your pawns on the opposite color of your bishop so its diagonal lanes stay open.',
            startR: 2, startC: 2,
            validTargets: [
              { r: 0, c: 0, type: 'step', desc: 'Top-Left Diagonal' }, { r: 1, c: 1, type: 'step', desc: 'Top-Left' },
              { r: 0, c: 4, type: 'step', desc: 'Top-Right Diagonal' }, { r: 1, c: 3, type: 'step', desc: 'Top-Right' },
              { r: 3, c: 1, type: 'step', desc: 'Bottom-Left' }, { r: 4, c: 0, type: 'step', desc: 'Bottom-Left Diagonal' },
              { r: 3, c: 3, type: 'step', desc: 'Bottom-Right' }, { r: 4, c: 4, type: 'step', desc: 'Bottom-Right Diagonal' }
            ],
            animPath: [{ r: 2, c: 2 }, { r: 0, c: 0 }, { r: 4, c: 4 }, { r: 2, c: 2 }]
          },
          R: {
            key: 'R',
            name: 'Rook (हाथी / रथ)',
            role: 'The Fortress Tower',
            points: '5 Points',
            color: '#ec4899',
            icon: '♜',
            desc: 'A heavy powerhouse piece that dominates straight ranks and files.',
            moveRule: 'Moves any number of squares horizontally or vertically in straight lines.',
            captureRule: 'Captures any enemy piece along its straight rank or file.',
            specialPower: '🌟 Castling (किलेबंदी): Swaps places with the King to safeguard him in one move!\n🌟 7th-Rank Invasion: Rooks on the 7th rank dominate.',
            proTip: 'Connect your two rooks together on open files to control the board.',
            startR: 2, startC: 2,
            validTargets: [
              { r: 0, c: 2, type: 'step', desc: 'North' }, { r: 4, c: 2, type: 'step', desc: 'South' },
              { r: 2, c: 0, type: 'step', desc: 'West' }, { r: 2, c: 4, type: 'step', desc: 'East' }
            ],
            animPath: [{ r: 2, c: 2 }, { r: 0, c: 2 }, { r: 4, c: 2 }, { r: 2, c: 0 }, { r: 2, c: 2 }]
          },
          Q: {
            key: 'Q',
            name: 'Queen (रानी / वज़ीर)',
            role: 'The Supreme Commander',
            points: '9 Points (Highest)',
            color: '#a855f7',
            icon: '♛',
            desc: 'The most lethal and versatile piece in chess, combining Rook and Bishop powers!',
            moveRule: 'Slides any number of squares in ANY direction: straight or diagonal.',
            captureRule: 'Captures any enemy piece along any of its 8 movement vectors.',
            specialPower: '🌟 Unrivaled Range: Controls up to 27 squares from the board center.\n🌟 Queen & King Checkmate Battery.',
            proTip: 'Do not bring your Queen out too early in the opening, or opponent pawns will chase her!',
            startR: 2, startC: 2,
            validTargets: [
              { r: 0, c: 2, type: 'step', desc: 'Vertical' }, { r: 4, c: 2, type: 'step', desc: 'Vertical' },
              { r: 2, c: 0, type: 'step', desc: 'Horizontal' }, { r: 2, c: 4, type: 'step', desc: 'Horizontal' },
              { r: 0, c: 0, type: 'step', desc: 'Diagonal' }, { r: 4, c: 4, type: 'step', desc: 'Diagonal' }
            ],
            animPath: [{ r: 2, c: 2 }, { r: 0, c: 0 }, { r: 4, c: 4 }, { r: 2, c: 2 }]
          },
          K: {
            key: 'K',
            name: 'King (राजा / बादशाह)',
            role: 'The Sovereign Leader',
            points: 'Infinite (Game Decider)',
            color: '#fbbf24',
            icon: '♚',
            desc: 'The most precious piece. If the King is trapped in Checkmate, the game is over!',
            moveRule: 'Can step exactly 1 square in any direction (horizontal, vertical, or diagonal).',
            captureRule: 'Captures any unprotected enemy piece 1 square away.',
            specialPower: '🌟 Castling (किलेबंदी): Swaps with Rook 2 squares toward safety.\n🌟 King Safety Rule: Must never walk into a square attacked by enemy pieces.',
            proTip: 'Keep your King shielded behind pawns in the opening, but bring him out to fight in the endgame!',
            startR: 2, startC: 2,
            validTargets: [
              { r: 1, c: 1, type: 'step', desc: '1-Step' }, { r: 1, c: 2, type: 'step', desc: '1-Step' }, { r: 1, c: 3, type: 'step', desc: '1-Step' },
              { r: 2, c: 1, type: 'step', desc: '1-Step' }, { r: 2, c: 3, type: 'step', desc: '1-Step' },
              { r: 3, c: 1, type: 'step', desc: '1-Step' }, { r: 3, c: 2, type: 'step', desc: '1-Step' }, { r: 3, c: 3, type: 'step', desc: '1-Step' }
            ],
            animPath: [{ r: 2, c: 2 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 2, c: 2 }]
          },
          SPECIAL: {
            key: 'SPECIAL',
            name: 'Castling & Special Rules (विशेष नियम)',
            role: 'Grandmaster Tactics',
            points: 'Rule Powers',
            color: '#6366f1',
            icon: '🏰',
            desc: 'Special maneuvers that elevate your chess game: Castling shelters your King, while En Passant catches sneaking pawns!',
            moveRule: 'Castling: King moves 2 squares toward Rook, and Rook jumps over King to the adjacent square.',
            captureRule: 'En Passant: Captures an opponent pawn that advanced 2 squares past your pawn on rank 5.',
            specialPower: '🌟 Promotion: Reaching the 8th rank transforms pawn into Queen!\n🌟 Checkmate: When King has no legal escape from check, match ends in victory!',
            proTip: 'Castle early (within first 10 moves) to keep your King safe and activate your Rook.',
            startR: 4, startC: 2,
            validTargets: [
              { r: 4, c: 0, type: 'step', desc: 'Queenside Castle' },
              { r: 4, c: 4, type: 'step', desc: 'Kingside Castle' }
            ],
            animPath: [{ r: 4, c: 2 }, { r: 4, c: 4 }, { r: 4, c: 2 }]
          }
        }
      },

      tictactoe: {
        badge: '❌⭕ TIC-TAC-TOE ARENA',
        heading: '❌⭕ Tic-Tac-Toe Rules & Strategy Guide',
        defaultKey: 'BASIC',
        topics: {
          BASIC: {
            key: 'BASIC',
            name: 'Grid & Turns (मूल नियम)',
            role: '3x3 Board Play',
            points: 'Player X vs Player O',
            color: '#0ea5e9',
            icon: '🎯',
            desc: 'Tic-Tac-Toe is played on a 3x3 grid. Players alternate turns placing their symbol (X or O) into an empty square.',
            moveRule: 'Tap any unoccupied square on your turn to mark it with your symbol (X or O).',
            captureRule: 'Squares cannot be overwritten once marked.',
            specialPower: '🌟 First Move Advantage: Player X starts first and controls opening tempo.',
            proTip: 'Starting in the center gives you 4 possible winning lines, while starting in a corner gives you 3.',
            startR: 1, startC: 1,
            validTargets: [
              { r: 0, c: 0, type: 'step', desc: 'Corner' },
              { r: 1, c: 1, type: 'step', desc: 'Center' },
              { r: 2, c: 2, type: 'step', desc: 'Corner' }
            ],
            animPath: [{ r: 1, c: 1 }, { r: 0, c: 0 }, { r: 2, c: 2 }, { r: 1, c: 1 }]
          },
          WINNING: {
            key: 'WINNING',
            name: '3-in-a-Row (जीतने के तरीके)',
            role: 'Victory Condition',
            points: 'Match Decider',
            color: '#10b981',
            icon: '🏆',
            desc: 'The first player to align 3 of their marks horizontally, vertically, or diagonally wins the match instantly!',
            moveRule: '8 possible winning lines: 3 rows, 3 columns, and 2 diagonals.',
            captureRule: 'Completing 3-in-a-row triggers celebratory victory line animations and confetti!',
            specialPower: '🌟 Double Fork: Creating two simultaneous winning threats guarantees victory on your next move!',
            proTip: 'Always watch for your opponent reaching 2-in-a-row and block them immediately!',
            startR: 0, startC: 0,
            validTargets: [
              { r: 0, c: 1, type: 'step', desc: 'Row 1' },
              { r: 0, c: 2, type: 'step', desc: 'Win 🏆' }
            ],
            animPath: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 0 }]
          },
          DRAW: {
            key: 'DRAW',
            name: 'Draw Game (ड्रॉ नियम)',
            role: 'Stalemate',
            points: 'Tied Match',
            color: '#f59e0b',
            icon: '🤝',
            desc: 'If all 9 squares of the board are filled and neither player has achieved 3-in-a-row, the match is declared a DRAW.',
            moveRule: 'Play proceeds until either a player wins or all 9 squares are filled.',
            captureRule: 'No marks can be made once all 9 cells are filled.',
            specialPower: '🌟 Scoreboard Tracking: Draws are tracked separately in match statistics.',
            proTip: 'When playing against Minimax Hard AI, perfect play from both sides always results in a draw.',
            startR: 1, startC: 1,
            validTargets: [
              { r: 0, c: 0, type: 'step', desc: 'X' },
              { r: 0, c: 1, type: 'step', desc: 'O' }
            ],
            animPath: [{ r: 1, c: 1 }, { r: 0, c: 0 }, { r: 1, c: 1 }]
          },
          MINIMAX: {
            key: 'MINIMAX',
            name: 'Minimax AI Tactics (मास्टर ट्रिक्स)',
            role: 'AI & Master Play',
            points: 'Unbeatable Defense',
            color: '#a855f7',
            icon: '🤖',
            desc: 'Our Hard AI uses the famous Minimax algorithm, looking ahead at every future branch to play flawlessly.',
            moveRule: '1. Win: If you have 2 in a row, take the 3rd.\n2. Block: If opponent has 2 in a row, block them immediately.',
            captureRule: '3. Fork: Create opportunity for 2 winning moves simultaneously.',
            specialPower: '🌟 Center Control: Take the center square whenever available.\n🌟 Opposite Corner: If opponent takes a corner, take opposite corner.',
            proTip: 'Never play an edge square on move 1; choose center or corner for the highest winning percentage!',
            startR: 1, startC: 1,
            validTargets: [
              { r: 1, c: 1, type: 'step', desc: 'Optimal Center' }
            ],
            animPath: [{ r: 1, c: 1 }, { r: 0, c: 0 }, { r: 2, c: 2 }, { r: 1, c: 1 }]
          }
        }
      }
    };
  }

  open(gameType = 'ludo', topicKey = null) {
    const norm = (gameType || 'ludo').toLowerCase();
    if (norm === 'chess' || ['p', 'n', 'b', 'r', 'q', 'k', 'special'].includes(norm)) {
      this.activeGame = 'chess';
      this.activePieceKey = topicKey || (['p', 'n', 'b', 'r', 'q', 'k', 'special'].includes(norm) ? norm.toUpperCase() : 'N');
    } else if (norm === 'tictactoe' || norm === 'ttt') {
      this.activeGame = 'tictactoe';
      this.activePieceKey = topicKey || 'BASIC';
    } else {
      // Default to Ludo
      this.activeGame = 'ludo';
      this.activePieceKey = topicKey || 'YARD_6';
    }

    const modal = document.getElementById('modal-piece-guide');
    if (!modal) return;

    const guide = this.gameGuides[this.activeGame];
    const badgeEl = document.getElementById('guide-modal-badge');
    const headingEl = document.getElementById('guide-modal-heading');
    if (badgeEl) badgeEl.textContent = guide.badge;
    if (headingEl) headingEl.textContent = guide.heading;

    this.renderSelector();
    this.renderPieceDetails(this.activePieceKey);
    modal.classList.add('open');
    if (window.soundEngine) window.soundEngine.playClick();
  }

  close() {
    if (this.animationTimer) clearInterval(this.animationTimer);
    const modal = document.getElementById('modal-piece-guide');
    if (modal) modal.classList.remove('open');
  }

  renderSelector() {
    const list = document.getElementById('piece-guide-selector');
    if (!list) return;

    const guide = this.gameGuides[this.activeGame];
    const topics = guide.topics;

    list.innerHTML = Object.keys(topics).map(key => {
      const p = topics[key];
      const isSel = key === this.activePieceKey;
      return `
        <button class="piece-selector-chip ${isSel ? 'active' : ''}" data-piece="${key}">
          <span class="chip-icon">${p.icon}</span>
          <span class="chip-name">${p.name.split(' ')[0]}</span>
        </button>
      `;
    }).join('');

    list.querySelectorAll('.piece-selector-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.piece;
        this.activePieceKey = key;
        this.renderSelector();
        this.renderPieceDetails(key);
        if (window.soundEngine) window.soundEngine.playClick();
      });
    });
  }

  renderPieceDetails(key) {
    const guide = this.gameGuides[this.activeGame];
    const p = guide.topics[key] || guide.topics[guide.defaultKey];
    if (!p) return;

    const titleEl = document.getElementById('guide-piece-title');
    const badgeEl = document.getElementById('guide-piece-points');
    const descEl = document.getElementById('guide-piece-desc');
    const moveRuleEl = document.getElementById('guide-move-rule');
    const captureRuleEl = document.getElementById('guide-capture-rule');
    const specialRuleEl = document.getElementById('guide-special-rule');
    const proTipEl = document.getElementById('guide-pro-tip');

    if (titleEl) titleEl.innerHTML = `${p.icon} ${p.name} <span class="guide-role-sub">${p.role}</span>`;
    if (badgeEl) {
      badgeEl.textContent = p.points;
      badgeEl.style.backgroundColor = `${p.color}22`;
      badgeEl.style.borderColor = p.color;
      badgeEl.style.color = p.color;
    }
    if (descEl) descEl.textContent = p.desc;
    if (moveRuleEl) moveRuleEl.textContent = p.moveRule;
    if (captureRuleEl) captureRuleEl.textContent = p.captureRule;
    if (specialRuleEl) specialRuleEl.textContent = p.specialPower;
    if (proTipEl) proTipEl.textContent = p.proTip;

    this.setupDemoBoard(p);
  }

  setupDemoBoard(p) {
    if (this.animationTimer) clearInterval(this.animationTimer);
    const boardEl = document.getElementById('guide-demo-board');
    if (!boardEl) return;

    this.demoPiecePos = { r: p.startR, c: p.startC };
    this.renderDemoBoardGrid(p, this.demoPiecePos);

    const btnAnimate = document.getElementById('btn-play-guide-anim');
    if (btnAnimate) {
      btnAnimate.onclick = () => this.runPieceAnimation(p);
    }
  }

  renderDemoBoardGrid(p, currentPos) {
    const boardEl = document.getElementById('guide-demo-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    const isLudo = this.activeGame === 'ludo';
    const isTTT = this.activeGame === 'tictactoe';

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const sq = document.createElement('div');
        const isDark = (r + c) % 2 === 1;
        sq.className = `demo-sq ${isDark ? 'demo-dark' : 'demo-light'}`;
        sq.dataset.r = r;
        sq.dataset.c = c;

        // Custom Ludo board styling for demo grid
        if (isLudo) {
          if (r === 2 && c === 2) {
            sq.style.backgroundColor = 'rgba(251, 191, 36, 0.35)';
            sq.innerHTML = '<span style="font-size: 1.1rem;">⭐</span>';
          } else if (r === 4 && c === 0) {
            sq.style.backgroundColor = 'rgba(244, 63, 94, 0.3)';
            sq.title = 'Red Yard';
          } else if (r === 2 && c === 4) {
            sq.style.backgroundColor = 'rgba(245, 158, 11, 0.4)';
            sq.innerHTML = '<span style="font-size: 1.1rem;">🏆</span>';
          }
        }

        // Is this where the piece / goti is right now?
        if (r === currentPos.r && c === currentPos.c) {
          sq.classList.add('demo-sq-occupied');
          const pieceDiv = document.createElement('div');
          pieceDiv.className = 'demo-piece-svg piece-selected-lift';
          if (isLudo) {
            pieceDiv.innerHTML = `
              <svg viewBox="0 0 40 40" class="ludo-demo-pawn" style="width: 32px; height: 32px;">
                <circle cx="20" cy="12" r="9" fill="#f43f5e" stroke="#fff" stroke-width="2"/>
                <path d="M12,32 C12,24 16,19 20,19 C24,19 28,24 28,32 Z" fill="#f43f5e" stroke="#fff" stroke-width="2"/>
                <ellipse cx="20" cy="32" rx="10" ry="3.5" fill="#be123c"/>
              </svg>
            `;
          } else if (isTTT) {
            pieceDiv.innerHTML = '<span style="font-size: 1.6rem; font-weight: 900; color: #f43f5e;">❌</span>';
          } else {
            pieceDiv.innerHTML = window.PIECE_SVGS ? (window.PIECE_SVGS[p.key] || p.icon) : p.icon;
          }
          sq.appendChild(pieceDiv);
        } else {
          // Check if valid target
          const target = (p.validTargets || []).find(t => t.r === r && t.c === c);
          if (target) {
            sq.classList.add(target.type === 'capture' ? 'demo-target-capture' : 'demo-target-move');
            const dot = document.createElement('div');
            dot.className = target.type === 'capture' ? 'demo-capture-ring' : 'demo-move-dot';
            dot.title = target.desc;
            sq.appendChild(dot);
          }
        }

        // Allow clicking any square to move piece there
        sq.addEventListener('click', () => {
          this.demoPiecePos = { r, c };
          if (window.soundEngine) window.soundEngine.playMove();
          this.renderDemoBoardGrid(p, this.demoPiecePos);
        });

        boardEl.appendChild(sq);
      }
    }
  }

  runPieceAnimation(p) {
    if (this.animationTimer) clearInterval(this.animationTimer);
    const path = p.animPath || [{ r: p.startR, c: p.startC }];
    let stepIndex = 0;

    const btnAnimate = document.getElementById('btn-play-guide-anim');
    if (btnAnimate) btnAnimate.textContent = 'Animating... 🎬';

    this.animationTimer = setInterval(() => {
      stepIndex = (stepIndex + 1) % path.length;
      this.demoPiecePos = path[stepIndex];
      if (window.soundEngine) window.soundEngine.playMove();
      this.renderDemoBoardGrid(p, this.demoPiecePos);

      if (stepIndex === path.length - 1) {
        clearInterval(this.animationTimer);
        if (btnAnimate) btnAnimate.textContent = '▶️ Play Move Animation';
      }
    }, 600);
  }
}

window.pieceGuideEngine = new PieceGuideEngine();
