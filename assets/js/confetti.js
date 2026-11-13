/**
 * Confetti Canvas Celebration Engine 
 */ 
class ConfettiCannon {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.colors = ['#FF2D55', '#4CD964', '#5AC8FA', '#FFCC00', '#FF9500', '#AF52DE', '#FF3B30'];
  }
 
  init(canvasElement) {
    this.canvas = canvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }
 
  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  fire(duration = 3500, count = 120) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: this.canvas.height * 0.45 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle'
      });
    }

    if (this.animationId) cancelAnimationFrame(this.animationId);
    const startTime = performance.now();

    const render = (now) => {
      const elapsed = now - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.985;
        p.rotation += p.vRot;
        if (elapsed > duration - 1000) {
          p.opacity = Math.max(0, 1 - (elapsed - (duration - 1000)) / 1000);
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.opacity;
        this.ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      });

      if (elapsed < duration) {
        this.animationId = requestAnimationFrame(render);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(render);
  }
}

window.confettiCannon = new ConfettiCannon();
