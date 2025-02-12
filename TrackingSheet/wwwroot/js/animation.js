class ParticleNetworkAnimation {
    constructor() {}

    init(element) {
        this.container = element;
        this.canvas = document.createElement('canvas');
        this.sizeCanvas();
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.particleNetwork = new ParticleNetwork(this);

        this.bindUiActions();
        return this;
    }

    bindUiActions() {
        window.addEventListener('resize', () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.sizeCanvas();
            this.particleNetwork.createParticles();
        });
    }

    sizeCanvas() {
        this.canvas.width = this.container.offsetWidth;
        this.canvas.height = this.container.offsetHeight;
    }
}

class Particle {
    constructor(parent, x, y) {
        this.network = parent;
        this.canvas = parent.canvas;
        this.ctx = parent.ctx;
        this.particleColor = returnRandomArrayItem(this.network.options.particleColors);
        this.radius = getLimitedRandom(1.5, 2.5);
        this.opacity = 0;
        this.x = x || Math.random() * this.canvas.width;
        this.y = y || Math.random() * this.canvas.height;
        this.velocity = {
            x: (Math.random() - 0.5) * parent.options.velocity,
            y: (Math.random() - 0.5) * parent.options.velocity,
        };
    }

    update() {
        this.opacity = Math.min(this.opacity + 0.01, 1);

        if (this.x > this.canvas.width + 100 || this.x < -100) {
            this.velocity.x = -this.velocity.x;
        }
        if (this.y > this.canvas.height + 100 || this.y < -100) {
            this.velocity.y = -this.velocity.y;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.particleColor;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
}

class ParticleNetwork {
    constructor(parent) {
        this.options = {
            velocity: 1,
            density: 10000,
            netLineDistance: 150,
            netLineColor: '#fff',
            particleColors: ['#fff'],
        };
        this.canvas = parent.canvas;
        this.ctx = parent.ctx;

        this.init();
    }

    init() {
        this.createParticles(true);
        this.animationFrame = requestAnimationFrame(this.update.bind(this));
        this.bindUiActions();
    }

    createParticles(isInitial) {
        this.particles = [];
        const quantity = (this.canvas.width * this.canvas.height) / this.options.density;

        if (isInitial) {
            let counter = 0;
            clearInterval(this.createIntervalId);
            this.createIntervalId = setInterval(() => {
                if (counter < quantity - 1) {
                    this.particles.push(new Particle(this));
                } else {
                    clearInterval(this.createIntervalId);
                }
                counter++;
            }, 250);
        } else {
            for (let i = 0; i < quantity; i++) {
                this.particles.push(new Particle(this));
            }
        }
    }

    update() {
        if (this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1;

            this.particles.forEach((p1, i) => {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    let distance = Math.min(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

                    if (distance > this.options.netLineDistance) continue;

                    distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

                    if (distance <= this.options.netLineDistance) {
                        this.ctx.beginPath();
                        this.ctx.strokeStyle = this.options.netLineColor;
                        this.ctx.globalAlpha = ((this.options.netLineDistance - distance) / this.options.netLineDistance) * p1.opacity * p2.opacity;
                        this.ctx.lineWidth = 0.7;
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }
            });

            this.particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });

            if (this.options.velocity !== 0) {
                this.animationFrame = requestAnimationFrame(this.update.bind(this));
            }
        } else {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    bindUiActions() {
        this.mouseIsDown = false;
        this.touchIsMoving = false;

        this.onMouseMove = (e) => {
            if (!this.interactionParticle) {
                this.createInteractionParticle();
            }
            this.interactionParticle.x = e.offsetX;
            this.interactionParticle.y = e.offsetY;
        };

        this.canvas.addEventListener('mousemove', this.onMouseMove);
    }

    createInteractionParticle() {
        this.interactionParticle = new Particle(this);
        this.particles.push(this.interactionParticle);
    }
}

function getLimitedRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function returnRandomArrayItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Инициализация анимации
document.addEventListener('DOMContentLoaded', () => {
    const particleNetworkContainer = document.querySelector('.particle-network-animation');
    if (particleNetworkContainer) {
        const pna = new ParticleNetworkAnimation();
        pna.init(particleNetworkContainer);
    }
});
