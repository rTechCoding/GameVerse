/**
 * Storage & Game Data Manager
 * Handles persistent profile, achievements, stats, leaderboard, and settings.
 */
class GameStorage {
  constructor() {
    this.STORAGE_KEY = 'aura_game_hub_data_v1';
    this.data = this.load();
  }

  getDefaultData() {
    return {
      profile: {
        name: 'Rahat Gamer',
        avatar: '🥷', // Cyber Ninja
        bio: 'Pro strategist & board game conqueror 🎮',
        level: 4,
        xp: 1450,
        streak: 2,
        maxStreak: 5,
        coins: 850
      },
      stats: {
        ludo: { played: 14, won: 10, lost: 4 },
        tictactoe: { played: 22, won: 17, lost: 3, draw: 2 },
        chess: { played: 9, won: 6, lost: 3, draw: 0 }
      },
      recentMatches: [
        { id: 1, game: 'Chess', mode: 'vs AI (Hard)', result: 'Victory', date: 'Just now', score: '+120 XP' },
        { id: 2, game: 'Ludo', mode: '4-Player Team', result: 'Victory', date: '2 hours ago', score: '+150 XP' },
        { id: 3, game: 'Tic-Tac-Toe', mode: 'vs AI (Hard)', result: 'Draw', date: 'Yesterday', score: '+25 XP' },
        { id: 4, game: 'Ludo', mode: '2 Players', result: 'Defeat', date: '2 days ago', score: '+20 XP' }
      ],
      settings: {
        theme: 'dark',
        sound: true,
        music: false,
        animationSpeed: 'smooth',
        frameMode: 'mobile' // 'mobile' or 'desktop'
      },
      achievements: [
        { id: 'first_win', name: 'First Glory', desc: 'Win your first game', icon: '🏆', unlocked: true },
        { id: 'ludo_champ', name: 'Ludo Master', desc: 'Win 3 Ludo matches', icon: '🎲', unlocked: true },
        { id: 'ttt_master', name: 'Grid Prodigy', desc: 'Win 5 Tic-Tac-Toe games', icon: '❌', unlocked: true },
        { id: 'chess_grandmaster', name: 'Grandmaster', desc: 'Win a Chess match', icon: '♟️', unlocked: true },
        { id: 'triple_threat', name: 'Triple Threat', desc: 'Play all 3 games', icon: '⚡', unlocked: true },
        { id: 'streak_master', name: 'On Fire', desc: 'Achieve a 5-win streak', icon: '🔥', unlocked: false }
      ],
      leaderboards: {
        allTime: [
          { rank: 1, name: 'Alex Vance', avatar: '👑', wins: 142, points: 8940, badge: 'Grand Champion' },
          { rank: 2, name: 'Rahat Gamer', avatar: '🥷', wins: 33, points: 2470, badge: 'Master', isUser: true },
          { rank: 3, name: 'Elena Rostova', avatar: '🦊', wins: 29, points: 2180, badge: 'Elite' },
          { rank: 4, name: 'ShadowByte', avatar: '🤖', wins: 25, points: 1950, badge: 'Pro' },
          { rank: 5, name: 'Kira Knight', avatar: '🦄', wins: 21, points: 1680, badge: 'Veteran' },
          { rank: 6, name: 'Nova Phoenix', avatar: '⚡', wins: 18, points: 1420, badge: 'Rising Star' }
        ],
        monthly: [
          { rank: 1, name: 'Rahat Gamer', avatar: '🥷', wins: 19, points: 1540, badge: 'Monthly Leader', isUser: true },
          { rank: 2, name: 'Elena Rostova', avatar: '🦊', wins: 16, points: 1290, badge: 'Challenger' },
          { rank: 3, name: 'ShadowByte', avatar: '🤖', wins: 14, points: 1120, badge: 'Contender' },
          { rank: 4, name: 'Alex Vance', avatar: '👑', wins: 11, points: 940, badge: 'Pro' }
        ],
        weekly: [
          { rank: 1, name: 'Rahat Gamer', avatar: '🥷', wins: 8, points: 680, badge: 'Weekly Ace', isUser: true },
          { rank: 2, name: 'Nova Phoenix', avatar: '⚡', wins: 6, points: 490, badge: 'Runner-up' },
          { rank: 3, name: 'Kira Knight', avatar: '🦄', wins: 5, points: 410, badge: 'Podium' },
          { rank: 4, name: 'Elena Rostova', avatar: '🦊', wins: 3, points: 260, badge: 'Contender' }
        ]
      }
    };
  }

  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return Object.assign(this.getDefaultData(), parsed);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using defaults', e);
    }
    return this.getDefaultData();
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }

  getProfile() {
    return this.data.profile;
  }

  updateProfile(name, avatar, bio) {
    if (name) this.data.profile.name = name;
    if (avatar) this.data.profile.avatar = avatar;
    if (bio !== undefined) this.data.profile.bio = bio;
    this.updateUserInLeaderboard();
    this.save();
  }

  getStats() {
    return this.data.stats;
  }

  getTotalStats() {
    const s = this.data.stats;
    const totalPlayed = s.ludo.played + s.tictactoe.played + s.chess.played;
    const totalWins = s.ludo.won + s.tictactoe.won + s.chess.won;
    const totalLosses = s.ludo.lost + s.tictactoe.lost + s.chess.lost;
    const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
    
    // Find favorite game
    let fav = 'Ludo';
    let maxP = s.ludo.played;
    if (s.tictactoe.played > maxP) {
      fav = 'Tic-Tac-Toe';
      maxP = s.tictactoe.played;
    }
    if (s.chess.played > maxP) {
      fav = 'Chess';
    }

    return { totalPlayed, totalWins, totalLosses, winRate, favorite: fav };
  }

  recordMatch(gameKey, result, details = '') {
    // gameKey: 'ludo' | 'tictactoe' | 'chess'
    // result: 'win' | 'loss' | 'draw'
    const gameNames = { ludo: 'Ludo', tictactoe: 'Tic-Tac-Toe', chess: 'Chess' };
    const stats = this.data.stats[gameKey];
    if (stats) {
      stats.played++;
      if (result === 'win') stats.won++;
      else if (result === 'loss') stats.lost++;
      else if (result === 'draw') stats.draw = (stats.draw || 0) + 1;
    }

    let xpGained = result === 'win' ? 100 : result === 'draw' ? 30 : 15;
    this.data.profile.xp += xpGained;
    this.data.profile.coins += result === 'win' ? 50 : 10;

    if (result === 'win') {
      this.data.profile.streak = (this.data.profile.streak || 0) + 1;
      if (this.data.profile.streak > (this.data.profile.maxStreak || 0)) {
        this.data.profile.maxStreak = this.data.profile.streak;
      }
    } else if (result === 'loss') {
      this.data.profile.streak = 0;
    }

    // Check level up (every 500 XP)
    this.data.profile.level = Math.floor(this.data.profile.xp / 400) + 1;

    // Record recent match
    this.data.recentMatches.unshift({
      id: Date.now(),
      game: gameNames[gameKey] || gameKey,
      mode: details || 'Match',
      result: result === 'win' ? 'Victory' : result === 'draw' ? 'Draw' : 'Defeat',
      date: 'Just now',
      score: `+${xpGained} XP`
    });
    if (this.data.recentMatches.length > 10) {
      this.data.recentMatches.pop();
    }

    // Check achievements
    this.checkAchievements();
    this.updateUserInLeaderboard();
    this.save();
  }

  checkAchievements() {
    const s = this.data.stats;
    const totals = this.getTotalStats();

    this.unlockAchievement('triple_threat', s.ludo.played > 0 && s.tictactoe.played > 0 && s.chess.played > 0);
    this.unlockAchievement('first_win', totals.totalWins >= 1);
    this.unlockAchievement('ludo_champ', s.ludo.won >= 3);
    this.unlockAchievement('ttt_master', s.tictactoe.won >= 5);
    this.unlockAchievement('chess_grandmaster', s.chess.won >= 1);
    this.unlockAchievement('streak_master', (this.data.profile.maxStreak || 0) >= 5);
  }

  unlockAchievement(id, condition) {
    if (!condition) return;
    const item = this.data.achievements.find(a => a.id === id);
    if (item && !item.unlocked) {
      item.unlocked = true;
      if (window.app) {
        window.app.showToast(`🏆 Achievement Unlocked: ${item.name}!`, 'success');
      }
    }
  }

  updateUserInLeaderboard() {
    const totals = this.getTotalStats();
    ['allTime', 'monthly', 'weekly'].forEach(tab => {
      const userEntry = this.data.leaderboards[tab].find(u => u.isUser);
      if (userEntry) {
        userEntry.name = this.data.profile.name;
        userEntry.avatar = this.data.profile.avatar;
        userEntry.wins = totals.totalWins;
        userEntry.points = this.data.profile.xp;
      }
      this.data.leaderboards[tab].sort((a, b) => b.points - a.points);
      this.data.leaderboards[tab].forEach((item, index) => {
        item.rank = index + 1;
      });
    });
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = Object.assign(this.data.settings, newSettings);
    this.save();
  }

  resetAllStats() {
    this.data.stats = {
      ludo: { played: 0, won: 0, lost: 0 },
      tictactoe: { played: 0, won: 0, lost: 0, draw: 0 },
      chess: { played: 0, won: 0, lost: 0, draw: 0 }
    };
    this.data.recentMatches = [];
    this.data.profile.xp = 0;
    this.data.profile.level = 1;
    this.data.profile.streak = 0;
    this.updateUserInLeaderboard();
    this.save();
  }
}

window.gameStorage = new GameStorage();
