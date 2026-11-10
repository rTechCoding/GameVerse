/**
 * Complete Chess Game Engine with Tournament UI & Real-Time Multiplayer Room Sync
 */

const PIECE_SVGS = {
  P: `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  N: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,28 9,28 9,15 c 0,-3.5 3,-5.5 5.5,-5.5 3.5,0 5.5,2.5 5.5,5.5" fill="#ffffff"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="#ffffff"/><circle cx="9.5" cy="25.5" r="0.8" fill="#1e293b"/><path d="M 15 15.5 A 0.5 1.5 0 1 1 14 15.5 A 0.5 1.5 0 1 1 15 15.5 Z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#1e293b"/></g></svg>`,
  B: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#ffffff" stroke-linecap="butt"><path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.49 -10.11,-0.96 -13.5,1 -3.39,-1.96 -10.11,-1.49 -13.5,-1 -1.35,0.49 -2.32,0.47 -3,-0.5 1.35,-1.46 3,-2 3,-2 z"/><path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z"/><circle cx="22.5" cy="8" r="2.5"/></g><path d="m 17.5,26 h 10 M 15,30 h 15 M 22.5,15.5 v 5 M 20,18 h 5" stroke-linejoin="miter"/></g></svg>`,
  R: `<svg viewBox="0 0 45 45"><g fill="#ffffff" fill-rule="evenodd" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,39 h 27 v -3 H 9 v 3 z m 3,-3 v -4.5 h 21 V 36 H 12 z m 2,-4.5 1.5,-14.5 h 14 L 31,31.5 H 14 z M 11,14 h 23 v -3 h -3 v 2 h -4 v -2 h -5 v 2 h -4 v -2 h -4 v 2 h -3 v -2 z" stroke-linecap="butt"/><path d="m 12,35.5 h 21 M 13,31.5 h 19 M 14,29.5 h 17 M 14,16.5 h 17 M 11,14 h 23" fill="none" stroke-linejoin="miter"/></g></svg>`,
  Q: `<svg viewBox="0 0 45 45"><g fill="#ffffff" fill-rule="evenodd" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 8,26 C 17.5,34 27.5,34 37,26 L 38.5,14.5 L 31,25 L 22.5,10 L 14,25 L 6.5,14.5 Z"/><path d="M 8,26 C 8,26 16,36 22.5,36 C 29,36 37,26 37,26 L 38.5,39.5 L 6.5,39.5 Z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="6" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/><path d="m 11,38.5 a 35,35 1 0 0 23,0" fill="none" stroke="#1e293b" stroke-linecap="butt"/><path d="m 11,29 a 35,35 1 0 1 23,0" fill="none" stroke="#1e293b" stroke-linecap="butt"/></g></svg>`,
  K: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 22.5,11.63 v 6 M 20,13 h 5" stroke-linejoin="miter"/><path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 0,0 -1,-2.5 -3,-2.5 -2,0 -3,2.5 -3,2.5 -1.5,3 3,10.5 3,10.5" fill="#ffffff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-1 -6,2 -6,2 0,0 -2.5,-3 -5.5,-3 -3,0 -5.5,3 -5.5,3 0,0 -2,-3 -5.5,-3 -3,0 -5.5,3 -5.5,3 0,0 -2,-3 -6,-2 -3,6 6,10.5 6,10.5 v 7 z" fill="#ffffff"/><path d="m 11.5,30 c 5.5,-3 15.5,-3 21,0 M 11.5,33.5 c 5.5,-3 15.5,-3 21,0 M 11.5,37 c 5.5,-3 15.5,-3 21,0"/></g></svg>`,

  p: `<svg viewBox="0 0 45 45"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 1.47,-1.19 2.41,-3 2.41,-5.03 0,-2.41 -1.33,-4.5 -3.28,-5.62 c 0.49,-0.67 0.78,-1.49 0.78,-2.38 0,-2.21 -1.79,-4 -4,-4 z" fill="#0f172a" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/><path d="m 22.5,10 c -1.65,0 -3,1.35 -3,3 0,0.67 0.22,1.28 0.59,1.78 C 18.63,15.63 17.5,17.2 17.5,19 c 0,1.52 0.71,2.88 1.81,3.77 C 17.06,23.57 13.5,27.18 13.5,33.5 l 18,0 c 0,-6.32 -3.56,-9.93 -5.81,-10.73 1.1,-0.89 1.81,-2.25 1.81,-3.77 0,-1.8 -1.13,-3.37 -2.59,-4.22 C 25.28,14.28 25.5,13.67 25.5,13 c 0,-1.65 -1.35,-3 -3,-3 z" fill="#1e293b" stroke="#64748b" stroke-width="0.75"/></svg>`,
  n: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,28 9,28 9,15 c 0,-3.5 3,-5.5 5.5,-5.5 3.5,0 5.5,2.5 5.5,5.5" fill="#0f172a"/><path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" fill="#0f172a"/><circle cx="9.5" cy="25.5" r="0.8" fill="#f8fafc"/><path d="M 15 15.5 A 0.5 1.5 0 1 1 14 15.5 A 0.5 1.5 0 1 1 15 15.5 Z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#f8fafc"/></g></svg>`,
  b: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#0f172a" stroke-linecap="butt"><path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.49 -10.11,-0.96 -13.5,1 -3.39,-1.96 -10.11,-1.49 -13.5,-1 -1.35,0.49 -2.32,0.47 -3,-0.5 1.35,-1.46 3,-2 3,-2 z"/><path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z"/><circle cx="22.5" cy="8" r="2.5"/></g><path d="m 17.5,26 h 10 M 15,30 h 15 M 22.5,15.5 v 5 M 20,18 h 5" stroke="#94a3b8" stroke-width="1.2" stroke-linejoin="miter"/></g></svg>`,
  r: `<svg viewBox="0 0 45 45"><g fill="#0f172a" fill-rule="evenodd" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 9,39 h 27 v -3 H 9 v 3 z m 3,-3 v -4.5 h 21 V 36 H 12 z m 2,-4.5 1.5,-14.5 h 14 L 31,31.5 H 14 z M 11,14 h 23 v -3 h -3 v 2 h -4 v -2 h -5 v 2 h -4 v -2 h -4 v 2 h -3 v -2 z" stroke-linecap="butt"/><path d="m 12,35.5 h 21 M 13,31.5 h 19 M 14,29.5 h 17 M 14,16.5 h 17 M 11,14 h 23" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-linejoin="miter"/></g></svg>`,
  q: `<svg viewBox="0 0 45 45"><g fill="#0f172a" fill-rule="evenodd" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 8,26 C 17.5,34 27.5,34 37,26 L 38.5,14.5 L 31,25 L 22.5,10 L 14,25 L 6.5,14.5 Z"/><path d="M 8,26 C 8,26 16,36 22.5,36 C 29,36 37,26 37,26 L 38.5,39.5 L 6.5,39.5 Z"/><circle cx="6" cy="12" r="2" fill="#cbd5e1"/><circle cx="14" cy="9" r="2" fill="#cbd5e1"/><circle cx="22.5" cy="6" r="2" fill="#cbd5e1"/><circle cx="31" cy="9" r="2" fill="#cbd5e1"/><circle cx="39" cy="12" r="2" fill="#cbd5e1"/><path d="m 11,38.5 a 35,35 1 0 0 23,0" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="butt"/><path d="m 11,29 a 35,35 1 0 1 23,0" fill="none" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="butt"/></g></svg>`,
  k: `<svg viewBox="0 0 45 45"><g fill="none" fill-rule="evenodd" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m 22.5,11.63 v 6 M 20,13 h 5" stroke="#f8fafc" stroke-linejoin="miter"/><path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 0,0 -1,-2.5 -3,-2.5 -2,0 -3,2.5 -3,2.5 -1.5,3 3,10.5 3,10.5" fill="#0f172a" stroke-linecap="butt" stroke-linejoin="miter"/><path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-1 -6,2 -6,2 0,0 -2.5,-3 -5.5,-3 -3,0 -5.5,3 -5.5,3 0,0 -2,-3 -5.5,-3 -3,0 -5.5,3 -5.5,3 0,0 -2,-3 -6,-2 -3,6 6,10.5 6,10.5 v 7 z" fill="#0f172a"/><path d="m 11.5,30 c 5.5,-3 15.5,-3 21,0 M 11.5,33.5 c 5.5,-3 15.5,-3 21,0 M 11.5,37 c 5.5,-3 15.5,-3 21,0" stroke="#94a3b8" stroke-width="1.2"/></g></svg>`
};
window.PIECE_SVGS = PIECE_SVGS;

const PIECE_VALUES = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000
};

class TournamentChessGame {
  constructor() {
    this.board = [];
    this.turn = 'w';
    this.castling = { K: true, Q: true, k: true, q: true };
    this.enPassant = null;
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.moveHistory = [];
    this.historyStack = [];
    this.capturedPieces = { w: [], b: [] };
    this.gameActive = false;
    this.mode = 'ai'; // 'ai', 'pvp', 'online'
    this.difficulty = 'medium';
    this.playerColor = 'w';
    this.clocks = { w: 600, b: 600, active: false, max: 600 };
    this.timerInterval = null;
    this.inCheck = false;
    this.lastMove = null;
  }

  setup(options = {}) {
    this.mode = options.mode || 'ai';
    this.difficulty = options.difficulty || 'medium';
    this.playerColor = options.playerColor || 'w';
    this.whiteName = options.whiteName || (options.playerColor === 'w' ? 'White' : (this.mode === 'ai' ? 'Stockfish AI' : 'White'));
    this.blackName = options.blackName || (options.playerColor === 'b' ? 'Black' : (this.mode === 'ai' ? 'Stockfish AI' : 'Black'));
    const timerMinutes = parseInt(options.timerMinutes || 10, 10);
    this.clocks.max = timerMinutes > 0 ? timerMinutes * 60 : 0;
    this.clocks.w = this.clocks.max;
    this.clocks.b = this.clocks.max;
    this.clocks.active = this.clocks.max > 0;

    if (this.mode === 'online' && window.multiplayerManager) {
      window.multiplayerManager.onActionReceived = (action, payload) => {
        if (action === 'CHESS_MOVE') {
          if (payload.clocks) {
            this.clocks.w = payload.clocks.w;
            this.clocks.b = payload.clocks.b;
          }
          this.executeMove(payload.move, true);
        } else if (action === 'CHESS_RESIGN') {
          this.resign(true);
        } else if (action === 'CHESS_RESTART') {
          this.setup({
            mode: 'online',
            difficulty: this.difficulty,
            playerColor: this.playerColor,
            timerMinutes: this.clocks.max > 0 ? this.clocks.max / 60 : 0,
            whiteName: this.whiteName,
            blackName: this.blackName
          });
          if (window.app) window.app.showToast('Chess match restarted!', 'info', '🔄');
        }
      };
    }

    this.resetBoard();
    this.startTimer();
    this.render();

    if (this.mode === 'ai' && this.turn !== this.playerColor) {
      setTimeout(() => this.makeAIMove(), 600);
    }
  }

  resetBoard() {
    this.board = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    this.turn = 'w';
    this.castling = { K: true, Q: true, k: true, q: true };
    this.enPassant = null;
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.moveHistory = [];
    this.historyStack = [];
    this.capturedPieces = { w: [], b: [] };
    this.gameActive = true;
    this.inCheck = false;
    this.lastMove = null;
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (!this.clocks.active) return;

    this.timerInterval = setInterval(() => {
      if (!this.gameActive) return;
      if (this.turn === 'w') {
        this.clocks.w--;
        if (this.clocks.w <= 0) {
          this.clocks.w = 0;
          this.handleTimeOut('w');
        }
      } else {
        this.clocks.b--;
        if (this.clocks.b <= 0) {
          this.clocks.b = 0;
          this.handleTimeOut('b');
        }
      }
      this.updateClocksUI();
    }, 1000);
  }

  handleTimeOut(timedOutColor) {
    this.gameActive = false;
    clearInterval(this.timerInterval);
    const winner = timedOutColor === 'w' ? 'Black' : 'White';
    window.soundEngine.playLoss();
    const result = this.mode === 'ai' ? (timedOutColor === this.playerColor ? 'loss' : 'win') : 'win';
    window.gameStorage.recordMatch('chess', result, 'Flag Fall');

    if (window.app) {
      window.app.showGameOverModal({
        title: 'Time Expired!',
        message: `${timedOutColor === 'w' ? 'White' : 'Black'} ran out of time. ${winner} claims the win!`,
        gameType: 'chess',
        onPlayAgain: () => this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor, timerMinutes: this.clocks.max / 60 }),
        onRestart: () => this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor, timerMinutes: this.clocks.max / 60 })
      });
    }
  }

  onSquareClick(r, c) {
    if (!this.gameActive) return;
    if (this.mode === 'ai' && this.turn !== this.playerColor) return;
    if (this.mode === 'online') {
      if (!window.multiplayerManager || !window.multiplayerManager.connected) {
        if (window.app) window.app.showToast('🔒 Waiting for friend to join! You cannot play alone in an online room.', 'warning');
        return;
      }
      const isMyTurn = (this.turn === 'w' && window.multiplayerManager.isHost) || 
                       (this.turn === 'b' && !window.multiplayerManager.isHost);
      if (!isMyTurn) {
        if (window.app) window.app.showToast(`⏳ Waiting for opponent's turn (${this.turn === 'w' ? this.whiteName : this.blackName})...`, 'info');
        return;
      }
    }

    const piece = this.board[r][c];
    const isFriendly = piece && this.getPieceColor(piece) === this.turn;

    if (this.selectedSquare) {
      const matchMove = this.legalMovesForSelected.find(m => m.toR === r && m.toC === c);
      if (matchMove) {
        this.executeMove(matchMove);
        if (this.mode === 'online' && window.multiplayerManager) {
          window.multiplayerManager.sendAction('CHESS_MOVE', {
            move: matchMove,
            clocks: { w: this.clocks.w, b: this.clocks.b }
          });
        }
        this.selectedSquare = null;
        this.legalMovesForSelected = [];
        return;
      }
    }

    if (isFriendly) {
      this.selectedSquare = { r, c };
      this.legalMovesForSelected = this.getLegalMovesForSquare(r, c);
      window.soundEngine.playClick();
      this.render();
    } else {
      this.selectedSquare = null;
      this.legalMovesForSelected = [];
      this.render();
    }
  }

  getPieceColor(piece) {
    if (!piece) return null;
    return piece === piece.toUpperCase() ? 'w' : 'b';
  }

  getLegalMovesForSquare(r, c) {
    const allLegal = this.getAllLegalMoves(this.turn);
    return allLegal.filter(m => m.fromR === r && m.fromC === c);
  }

  executeMove(move, isRemote = false) {
    this.historyStack.push({
      board: this.board.map(row => [...row]),
      turn: this.turn,
      castling: { ...this.castling },
      enPassant: this.enPassant ? { ...this.enPassant } : null,
      capturedPieces: { w: [...this.capturedPieces.w], b: [...this.capturedPieces.b] },
      lastMove: this.lastMove
    });

    const piece = this.board[move.fromR][move.fromC];
    const target = this.board[move.toR][move.toC];
    const movingColor = this.getPieceColor(piece);
    let captured = target;

    // En passant
    if (piece.toLowerCase() === 'p' && move.toC !== move.fromC && !target) {
      const epRow = movingColor === 'w' ? move.toR + 1 : move.toR - 1;
      captured = this.board[epRow][move.toC];
      this.board[epRow][move.toC] = null;
    }

    if (captured) {
      this.capturedPieces[movingColor].push(captured);
      this.lastCaptureSquare = { r: move.toR, c: move.toC };
      window.soundEngine.playCapture();
    } else {
      this.lastCaptureSquare = null;
      window.soundEngine.playChessMove();
    }

    this.board[move.toR][move.toC] = piece;
    this.board[move.fromR][move.fromC] = null;

    // Castling
    if (piece.toLowerCase() === 'k' && Math.abs(move.toC - move.fromC) === 2) {
      if (move.toC === 6) {
        this.board[move.toR][5] = this.board[move.toR][7];
        this.board[move.toR][7] = null;
      } else if (move.toC === 2) {
        this.board[move.toR][3] = this.board[move.toR][0];
        this.board[move.toR][0] = null;
      }
    }

    // Pawn Promotion
    if (piece.toLowerCase() === 'p' && (move.toR === 0 || move.toR === 7)) {
      this.board[move.toR][move.toC] = movingColor === 'w' ? 'Q' : 'q';
    }

    // Castling rights
    if (piece === 'K') { this.castling.K = false; this.castling.Q = false; }
    if (piece === 'k') { this.castling.k = false; this.castling.q = false; }
    if (move.fromR === 7 && move.fromC === 0) this.castling.Q = false;
    if (move.fromR === 7 && move.fromC === 7) this.castling.K = false;
    if (move.fromR === 0 && move.fromC === 0) this.castling.q = false;
    if (move.fromR === 0 && move.fromC === 7) this.castling.k = false;

    // En passant update
    if (piece.toLowerCase() === 'p' && Math.abs(move.toR - move.fromR) === 2) {
      this.enPassant = { r: (move.fromR + move.toR) / 2, c: move.fromC };
    } else {
      this.enPassant = null;
    }

    this.lastMove = { fromR: move.fromR, fromC: move.fromC, toR: move.toR, toC: move.toC };

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const notation = `${piece.toUpperCase() !== 'P' ? piece.toUpperCase() : ''}${files[move.fromC]}${8 - move.fromR}→${files[move.toC]}${8 - move.toR}`;
    this.moveHistory.push(notation);

    this.turn = this.turn === 'w' ? 'b' : 'w';
    this.inCheck = this.isKingInCheck(this.turn, this.board);

    if (this.inCheck) {
      window.soundEngine.playCheck();
    }

    const opponentLegalMoves = this.getAllLegalMoves(this.turn);
    if (opponentLegalMoves.length === 0) {
      this.gameActive = false;
      const winner = this.turn === 'w' ? 'Black' : 'White';
      if (this.inCheck) {
        const isUserWinner = this.mode === 'ai' ? (winner === (this.playerColor === 'w' ? 'White' : 'Black')) : true;
        if (isUserWinner) {
          window.soundEngine.playWin();
          window.confettiCannon.fire();
        } else {
          window.soundEngine.playLoss();
        }

        window.gameStorage.recordMatch('chess', isUserWinner ? 'win' : 'loss', `Checkmate`);
        setTimeout(() => {
          if (window.app) {
            window.app.showGameOverModal({
              title: `👑 Checkmate! ${winner} Wins!`,
              message: `The enemy king was cornered beyond defense!`,
              gameType: 'chess',
              onPlayAgain: () => {
                if (this.mode === 'online' && window.multiplayerManager) {
                  window.multiplayerManager.sendAction('CHESS_RESTART', {});
                }
                this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor, whiteName: this.whiteName, blackName: this.blackName });
              },
              onRestart: () => {
                if (this.mode === 'online' && window.multiplayerManager) {
                  window.multiplayerManager.sendAction('CHESS_RESTART', {});
                }
                this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor, whiteName: this.whiteName, blackName: this.blackName });
              }
            });
          }
        }, 500);
      } else {
        window.soundEngine.playLoss();
        window.gameStorage.recordMatch('chess', 'draw', 'Stalemate');
        setTimeout(() => {
          if (window.app) {
            window.app.showGameOverModal({
              title: `Draw by Stalemate!`,
              message: `No legal moves remaining and king is safe. Honor is shared!`,
              gameType: 'chess',
              onPlayAgain: () => {
                if (this.mode === 'online' && window.multiplayerManager) {
                  window.multiplayerManager.sendAction('CHESS_RESTART', {});
                }
                this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor, whiteName: this.whiteName, blackName: this.blackName });
              },
              onRestart: () => {
                if (this.mode === 'online' && window.multiplayerManager) {
                  window.multiplayerManager.sendAction('CHESS_RESTART', {});
                }
                this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor, whiteName: this.whiteName, blackName: this.blackName });
              }
            });
          }
        }, 500);
      }
    }

    this.render();

    if (this.gameActive && this.mode === 'ai' && this.turn !== this.playerColor) {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  undoMove() {
    if (this.historyStack.length === 0 || !this.gameActive || this.mode === 'online') return;
    let steps = (this.mode === 'ai' && this.historyStack.length >= 2) ? 2 : 1;
    while (steps > 0 && this.historyStack.length > 0) {
      const prev = this.historyStack.pop();
      this.board = prev.board;
      this.turn = prev.turn;
      this.castling = prev.castling;
      this.enPassant = prev.enPassant;
      this.capturedPieces = prev.capturedPieces;
      this.lastMove = prev.lastMove;
      this.moveHistory.pop();
      steps--;
    }
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.inCheck = this.isKingInCheck(this.turn, this.board);
    window.soundEngine.playClick();
    this.render();
  }

  resign(isRemote = false) {
    if (!this.gameActive) return;
    this.gameActive = false;
    window.soundEngine.playLoss();
    const winner = this.turn === 'w' ? 'Black' : 'White';

    if (!isRemote && this.mode === 'online' && window.multiplayerManager) {
      window.multiplayerManager.sendAction('CHESS_RESIGN', {});
    }

    window.gameStorage.recordMatch('chess', 'loss', 'Resigned');

    if (window.app) {
      window.app.showGameOverModal({
        title: '🏳️ Game Resigned',
        message: `${this.turn === 'w' ? 'White' : 'Black'} surrendered. ${winner} claims victory.`,
        gameType: 'chess',
        onPlayAgain: () => this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor }),
        onRestart: () => this.setup({ mode: this.mode, difficulty: this.difficulty, playerColor: this.playerColor })
      });
    }
  }

  getAllPseudoLegalMoves(color, b = this.board) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c];
        if (piece && this.getPieceColor(piece) === color) {
          moves.push(...this.getPseudoMovesForPiece(r, c, piece, color, b));
        }
      }
    }
    return moves;
  }

  getPseudoMovesForPiece(r, c, piece, color, b) {
    const type = piece.toLowerCase();
    const moves = [];
    const dir = color === 'w' ? -1 : 1;

    if (type === 'p') {
      const f1 = r + dir;
      if (f1 >= 0 && f1 < 8 && !b[f1][c]) {
        moves.push({ fromR: r, fromC: c, toR: f1, toC: c });
        const startRow = color === 'w' ? 6 : 1;
        const f2 = r + 2 * dir;
        if (r === startRow && !b[f2][c]) {
          moves.push({ fromR: r, fromC: c, toR: f2, toC: c });
        }
      }
      [-1, 1].forEach(dc => {
        const tc = c + dc;
        if (tc >= 0 && tc < 8 && f1 >= 0 && f1 < 8) {
          const target = b[f1][tc];
          if (target && this.getPieceColor(target) !== color) {
            moves.push({ fromR: r, fromC: c, toR: f1, toC: tc });
          } else if (this.enPassant && this.enPassant.r === f1 && this.enPassant.c === tc) {
            moves.push({ fromR: r, fromC: c, toR: f1, toC: tc });
          }
        }
      });
    } else if (type === 'n') {
      const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
      offsets.forEach(([dr, dc]) => {
        const tr = r + dr;
        const tc = c + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const target = b[tr][tc];
          if (!target || this.getPieceColor(target) !== color) {
            moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
          }
        }
      });
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const dirs = [];
      if (type === 'b' || type === 'q') dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      if (type === 'r' || type === 'q') dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);

      dirs.forEach(([dr, dc]) => {
        let tr = r + dr;
        let tc = c + dc;
        while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const target = b[tr][tc];
          if (!target) {
            moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
          } else {
            if (this.getPieceColor(target) !== color) {
              moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
            }
            break;
          }
          tr += dr;
          tc += dc;
        }
      });
    } else if (type === 'k') {
      const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      offsets.forEach(([dr, dc]) => {
        const tr = r + dr;
        const tc = c + dc;
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          const target = b[tr][tc];
          if (!target || this.getPieceColor(target) !== color) {
            moves.push({ fromR: r, fromC: c, toR: tr, toC: tc });
          }
        }
      });

      // Castling
      if (color === 'w' && r === 7 && c === 4) {
        if (this.castling.K && !b[7][5] && !b[7][6] && !this.isSquareAttacked(7, 4, 'b', b) && !this.isSquareAttacked(7, 5, 'b', b) && !this.isSquareAttacked(7, 6, 'b', b)) {
          moves.push({ fromR: 7, fromC: 4, toR: 7, toC: 6 });
        }
        if (this.castling.Q && !b[7][3] && !b[7][2] && !b[7][1] && !this.isSquareAttacked(7, 4, 'b', b) && !this.isSquareAttacked(7, 3, 'b', b) && !this.isSquareAttacked(7, 2, 'b', b)) {
          moves.push({ fromR: 7, fromC: 4, toR: 7, toC: 2 });
        }
      } else if (color === 'b' && r === 0 && c === 4) {
        if (this.castling.k && !b[0][5] && !b[0][6] && !this.isSquareAttacked(0, 4, 'w', b) && !this.isSquareAttacked(0, 5, 'w', b) && !this.isSquareAttacked(0, 6, 'w', b)) {
          moves.push({ fromR: 0, fromC: 4, toR: 0, toC: 6 });
        }
        if (this.castling.q && !b[0][3] && !b[0][2] && !b[0][1] && !this.isSquareAttacked(0, 4, 'w', b) && !this.isSquareAttacked(0, 3, 'w', b) && !this.isSquareAttacked(0, 2, 'w', b)) {
          moves.push({ fromR: 0, fromC: 4, toR: 0, toC: 2 });
        }
      }
    }
    return moves;
  }

  isSquareAttacked(r, c, attackerColor, b = this.board) {
    const oppMoves = this.getAllPseudoLegalMoves(attackerColor, b);
    return oppMoves.some(m => m.toR === r && m.toC === c);
  }

  isKingInCheck(color, b = this.board) {
    const kingPiece = color === 'w' ? 'K' : 'k';
    let kr = -1, kc = -1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c] === kingPiece) { kr = r; kc = c; break; }
      }
      if (kr !== -1) break;
    }
    if (kr === -1) return false;
    return this.isSquareAttacked(kr, kc, color === 'w' ? 'b' : 'w', b);
  }

  getAllLegalMoves(color) {
    const pseudo = this.getAllPseudoLegalMoves(color, this.board);
    return pseudo.filter(move => {
      const tempBoard = this.board.map(row => [...row]);
      tempBoard[move.toR][move.toC] = tempBoard[move.fromR][move.fromC];
      tempBoard[move.fromR][move.fromC] = null;
      return !this.isKingInCheck(color, tempBoard);
    });
  }

  makeAIMove() {
    if (!this.gameActive) return;
    const moves = this.getAllLegalMoves(this.turn);
    if (moves.length === 0) return;

    let chosen = moves[0];
    if (this.difficulty === 'easy') {
      const captures = moves.filter(m => this.board[m.toR][m.toC] !== null);
      chosen = (captures.length > 0 && Math.random() < 0.6) ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
    } else {
      let best = -Infinity;
      moves.forEach(m => {
        const target = this.board[m.toR][m.toC];
        let val = target ? PIECE_VALUES[target] : 0;
        if (val > best) { best = val; chosen = m; }
      });
    }

    if (chosen) this.executeMove(chosen);
  }

  updateClocksUI() {
    const wClockEl = document.getElementById('chess-clock-w');
    const bClockEl = document.getElementById('chess-clock-b');
    if (wClockEl) {
      const m = Math.floor(this.clocks.w / 60);
      const s = this.clocks.w % 60;
      wClockEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }
    if (bClockEl) {
      const m = Math.floor(this.clocks.b / 60);
      const s = this.clocks.b % 60;
      bClockEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  }

  render() {
    const boardEl = document.getElementById('chess-board');
    const statusEl = document.getElementById('chess-turn-indicator');
    const capturedWEl = document.getElementById('chess-captured-w');
    const capturedBEl = document.getElementById('chess-captured-b');
    const movesHistoryEl = document.getElementById('chess-history-list');
    const nameWEl = document.getElementById('chess-name-w');
    const nameBEl = document.getElementById('chess-name-b');

    if (nameWEl) nameWEl.textContent = this.whiteName;
    if (nameBEl) nameBEl.textContent = this.blackName;

    this.updateClocksUI();

    if (statusEl) {
      const colorName = this.turn === 'w' ? 'White' : 'Black';
      const checkText = this.inCheck ? ' <span class="badge danger check-badge">CHECK!</span>' : '';
      const turnClass = this.turn === 'w' ? 'chess-turn-white' : 'chess-turn-black';
      statusEl.innerHTML = `Turn: <strong class="${turnClass}">${colorName}</strong>${checkText}`;
    }

    if (capturedWEl) capturedWEl.innerHTML = this.capturedPieces.w.map(p => `<span class="captured-piece">${PIECE_SVGS[p] || ''}</span>`).join('');
    if (capturedBEl) capturedBEl.innerHTML = this.capturedPieces.b.map(p => `<span class="captured-piece">${PIECE_SVGS[p] || ''}</span>`).join('');

    if (movesHistoryEl) {
      movesHistoryEl.innerHTML = this.moveHistory.map((m, i) => `
        <span class="history-item ${i % 2 === 0 ? 'white-move' : 'black-move'}">
          ${i % 2 === 0 ? `<small>${Math.floor(i / 2) + 1}.</small> ` : ''}${m}
        </span>
      `).join(' ');
      movesHistoryEl.scrollTop = movesHistoryEl.scrollHeight;
    }

    if (!boardEl) return;
    boardEl.innerHTML = '';

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const sq = document.createElement('div');
        const isDark = (r + c) % 2 === 1;
        sq.className = `chess-square ${isDark ? 'dark-sq' : 'light-sq'}`;
        sq.dataset.row = r;
        sq.dataset.col = c;

        // Rank and File Coordinate Labels on edges
        if (c === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'sq-coord coord-rank';
          rankLabel.textContent = 8 - r;
          sq.appendChild(rankLabel);
        }
        if (r === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'sq-coord coord-file';
          fileLabel.textContent = files[c];
          sq.appendChild(fileLabel);
        }

        if (this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c) {
          sq.classList.add('selected-sq');
        }

        const isLegal = this.legalMovesForSelected.some(m => m.toR === r && m.toC === c);
        if (isLegal) {
          const isCapture = this.board[r][c] !== null || (this.enPassant && this.enPassant.r === r && this.enPassant.c === c);
          sq.classList.add(isCapture ? 'legal-capture' : 'legal-move');
        }

        if (this.lastMove && ((this.lastMove.fromR === r && this.lastMove.fromC === c) || (this.lastMove.toR === r && this.lastMove.toC === c))) {
          sq.classList.add('last-move');
        }

        if (this.lastCaptureSquare && this.lastCaptureSquare.r === r && this.lastCaptureSquare.c === c) {
          sq.classList.add('square-capture-burst');
        }

        if (this.inCheck && this.board[r][c] === (this.turn === 'w' ? 'K' : 'k')) {
          sq.classList.add('king-in-check');
        }

        const piece = this.board[r][c];
        if (piece) {
          const pieceDiv = document.createElement('div');
          const isSelected = this.selectedSquare && this.selectedSquare.r === r && this.selectedSquare.c === c;
          pieceDiv.className = `chess-piece ${piece === piece.toUpperCase() ? 'piece-white' : 'piece-black'} ${isSelected ? 'piece-selected-lift' : ''}`;
          pieceDiv.innerHTML = PIECE_SVGS[piece] || piece;
          sq.appendChild(pieceDiv);
        }

        sq.addEventListener('click', () => this.onSquareClick(r, c));
        boardEl.appendChild(sq);
      }
    }
  }
}

window.chessGame = new TournamentChessGame();
