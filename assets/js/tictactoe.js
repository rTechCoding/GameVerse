/**
 * Tic-Tac-Toe Game Engine with Real-Time Room Code & Share Link Support
 */
class TicTacToeGame {
  constructor() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameActive = false;
    this.mode = 'ai'; // 'ai', 'pvp', 'online'
    this.difficulty = 'medium';
    this.playerXName = 'Player X';
    this.playerOName = 'AI Bot';
    this.humanPlayer = 'X';
    this.scores = { X: 0, O: 0, draw: 0 };
    this.winningCombo = null;

    this.winConditions = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
  }

  setup(options) {
    this.mode = options.mode || 'ai';
    this.difficulty = options.difficulty || 'medium';
    this.humanPlayer = options.humanSymbol || 'X';
    this.playerXName = options.playerXName || (this.mode === 'ai' ? (this.humanPlayer === 'X' ? 'You' : 'AI Bot') : 'Player X');
    this.playerOName = options.playerOName || (this.mode === 'ai' ? (this.humanPlayer === 'O' ? 'You' : 'AI Bot') : 'Player O');
    
    if (this.mode === 'online' && window.multiplayerManager) {
      window.multiplayerManager.onActionReceived = (action, payload) => {
        if (action === 'TTT_MOVE') {
          this.makeMove(payload.index, payload.player, true);
        } else if (action === 'TTT_RESTART') {
          this.restartRound(true);
        } else if (action === 'TTT_NEW_GAME') {
          this.newGame(true);
        }
      };
    }

    this.restartRound(true);
  }

  restartRound(isRemote = false) {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.gameActive = true;
    this.winningCombo = null;
    this.render();

    if (!isRemote && this.mode === 'online' && window.multiplayerManager) {
      window.multiplayerManager.sendAction('TTT_RESTART', {});
    }

    if (this.mode === 'ai' && this.currentPlayer !== this.humanPlayer) {
      setTimeout(() => this.makeAIMove(), 500);
    }
  }

  newGame(isRemote = false) {
    this.scores = { X: 0, O: 0, draw: 0 };
    if (!isRemote && this.mode === 'online' && window.multiplayerManager) {
      window.multiplayerManager.sendAction('TTT_NEW_GAME', {});
    }
    this.restartRound(isRemote);
  }

  handleCellClick(index) {
    if (!this.gameActive || this.board[index] !== null) return;
    if (this.mode === 'ai' && this.currentPlayer !== this.humanPlayer) return;
    if (this.mode === 'online') {
      const isMyTurn = (this.currentPlayer === 'X' && window.multiplayerManager.isHost) || 
                       (this.currentPlayer === 'O' && !window.multiplayerManager.isHost);
      if (!isMyTurn) return;
    }

    this.makeMove(index, this.currentPlayer);

    if (this.mode === 'online' && window.multiplayerManager) {
      window.multiplayerManager.sendAction('TTT_MOVE', {
        index,
        player: this.board[index]
      });
    }

    if (this.gameActive && this.mode === 'ai' && this.currentPlayer !== this.humanPlayer) {
      setTimeout(() => this.makeAIMove(), 450);
    }
  }

  makeMove(index, player, isRemote = false) {
    this.board[index] = player;
    window.soundEngine.playClick();
    this.render();

    const winner = this.checkWin(this.board);
    if (winner) {
      this.gameActive = false;
      this.winningCombo = winner.combo;
      this.scores[winner.player]++;
      this.render();
      this.handleGameOver(winner.player);
      return;
    }

    if (this.isBoardFull(this.board)) {
      this.gameActive = false;
      this.scores.draw++;
      this.render();
      this.handleGameOver('draw');
      return;
    }

    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    this.render();
  }

  makeAIMove() {
    if (!this.gameActive) return;
    let chosenIndex;
    const aiSymbol = this.humanPlayer === 'X' ? 'O' : 'X';

    if (this.difficulty === 'easy') {
      chosenIndex = this.getRandomMove();
    } else if (this.difficulty === 'medium') {
      chosenIndex = (Math.random() < 0.65) ? this.getBestMoveMinimax(aiSymbol) : (this.findImmediateWinningOrBlockingMove(aiSymbol) ?? this.getRandomMove());
    } else {
      chosenIndex = this.getBestMoveMinimax(aiSymbol);
    }

    if (chosenIndex !== undefined && chosenIndex !== null) {
      this.makeMove(chosenIndex, aiSymbol);
    }
  }

  getRandomMove() {
    const emptyIndices = this.board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return null;
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  }

  findImmediateWinningOrBlockingMove(aiSymbol) {
    const opponent = aiSymbol === 'X' ? 'O' : 'X';
    for (let combo of this.winConditions) {
      const [a, b, c] = combo;
      const vals = [this.board[a], this.board[b], this.board[c]];
      if (vals.filter(v => v === aiSymbol).length === 2 && vals.includes(null)) {
        return combo[vals.indexOf(null)];
      }
    }
    for (let combo of this.winConditions) {
      const [a, b, c] = combo;
      const vals = [this.board[a], this.board[b], this.board[c]];
      if (vals.filter(v => v === opponent).length === 2 && vals.includes(null)) {
        return combo[vals.indexOf(null)];
      }
    }
    if (this.board[4] === null) return 4;
    return null;
  }

  getBestMoveMinimax(aiSymbol) {
    const opponent = aiSymbol === 'X' ? 'O' : 'X';
    const minimax = (tempBoard, depth, isMaximizing) => {
      const win = this.checkWin(tempBoard);
      if (win) return win.player === aiSymbol ? 10 - depth : depth - 10;
      if (this.isBoardFull(tempBoard)) return 0;

      if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (tempBoard[i] === null) {
            tempBoard[i] = aiSymbol;
            best = Math.max(best, minimax(tempBoard, depth + 1, false));
            tempBoard[i] = null;
          }
        }
        return best;
      } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
          if (tempBoard[i] === null) {
            tempBoard[i] = opponent;
            best = Math.min(best, minimax(tempBoard, depth + 1, true));
            tempBoard[i] = null;
          }
        }
        return best;
      }
    };

    let bestScore = -Infinity;
    let move = null;
    for (let i = 0; i < 9; i++) {
      if (this.board[i] === null) {
        this.board[i] = aiSymbol;
        let score = minimax(this.board, 0, false);
        this.board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move !== null ? move : this.getRandomMove();
  }

  checkWin(b) {
    for (let combo of this.winConditions) {
      const [a, bIdx, c] = combo;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { player: b[a], combo };
      }
    }
    return null;
  }

  isBoardFull(b) {
    return b.every(cell => cell !== null);
  }

  handleGameOver(result) {
    let title = '';
    let message = '';
    let matchResult = 'loss';

    if (result === 'draw') {
      title = '🤝 Match Drawn!';
      message = 'Both tacticians held their ground firmly.';
      matchResult = 'draw';
      window.soundEngine.playLoss();
    } else {
      const winnerName = result === 'X' ? this.playerXName : this.playerOName;
      const isWinner = (result === this.humanPlayer);
      if (isWinner) {
        title = '🎉 You Won!';
        message = `Decisive victory! You lined up the winning trio!`;
        matchResult = 'win';
        window.soundEngine.playWin();
        window.confettiCannon.fire();
      } else {
        title = `🏆 ${winnerName} Wins!`;
        message = `${winnerName} completed the winning line.`;
        matchResult = 'loss';
        window.soundEngine.playLoss();
      }
    }

    window.gameStorage.recordMatch('tictactoe', matchResult, this.mode === 'online' ? 'Online Duel' : `vs AI (${this.difficulty})`);

    setTimeout(() => {
      if (window.app) {
        window.app.showGameOverModal({
          title,
          message,
          gameType: 'tictactoe',
          onPlayAgain: () => this.restartRound(),
          onRestart: () => this.newGame()
        });
      }
    }, 600);
  }

  render() {
    const boardEl = document.getElementById('ttt-board');
    const statusEl = document.getElementById('ttt-turn-indicator');
    const scoreXEl = document.getElementById('ttt-score-x');
    const scoreOEl = document.getElementById('ttt-score-o');
    const scoreDrawEl = document.getElementById('ttt-score-draw');
    const nameXEl = document.getElementById('ttt-name-x');
    const nameOEl = document.getElementById('ttt-name-o');

    if (scoreXEl) scoreXEl.textContent = this.scores.X;
    if (scoreOEl) scoreOEl.textContent = this.scores.O;
    if (scoreDrawEl) scoreDrawEl.textContent = this.scores.draw;
    if (nameXEl) nameXEl.textContent = this.playerXName;
    if (nameOEl) nameOEl.textContent = this.playerOName;

    if (statusEl) {
      if (!this.gameActive && this.winningCombo) {
        const winner = this.board[this.winningCombo[0]];
        statusEl.innerHTML = `<span class="badge victory">Winner: ${winner === 'X' ? this.playerXName : this.playerOName}</span>`;
      } else if (!this.gameActive) {
        statusEl.innerHTML = `<span class="badge draw">Draw Match</span>`;
      } else {
        const currentName = this.currentPlayer === 'X' ? this.playerXName : this.playerOName;
        const colorClass = this.currentPlayer === 'X' ? 'symbol-x' : 'symbol-o';
        statusEl.innerHTML = `Turn: <strong class="${colorClass}">${currentName} (${this.currentPlayer})</strong>`;
      }
    }

    if (!boardEl) return;
    boardEl.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      cell.dataset.index = i;

      if (this.winningCombo && this.winningCombo.includes(i)) {
        cell.classList.add('winning-cell');
      }

      if (this.board[i] === 'X') {
        cell.innerHTML = `
          <svg class="ttt-symbol x-icon" viewBox="0 0 100 100">
            <line x1="22" y1="22" x2="78" y2="78" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
            <line x1="78" y1="22" x2="22" y2="78" stroke="currentColor" stroke-width="14" stroke-linecap="round"/>
          </svg>
        `;
      } else if (this.board[i] === 'O') {
        cell.innerHTML = `
          <svg class="ttt-symbol o-icon" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" stroke="currentColor" stroke-width="14" fill="none" stroke-linecap="round"/>
          </svg>
        `;
      }

      cell.addEventListener('click', () => this.handleCellClick(i));
      boardEl.appendChild(cell);
    }
  }
}

window.ticTacToeGame = new TicTacToeGame();
