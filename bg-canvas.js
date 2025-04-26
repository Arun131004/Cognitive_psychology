// Modern animated glowing particle background (with simplex noise flow)

'use strict';

// --- SimplexNoise implementation (https://github.com/jwagner/simplex-noise.js) ---
class SimplexNoise {
    constructor(r) {
        if (!r) r = Math.random;
        this.p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        let n, q;
        for (let i = 255; i > 0; i--) {
            n = Math.floor((i + 1) * r());
            q = this.p[i];
            this.p[i] = this.p[n];
            this.p[n] = q;
        }
        this.perm = new Uint8Array(512);
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }
    noise3D(x, y, z) {
        const F3 = 1 / 3, G3 = 1 / 6;
        let n0, n1, n2, n3;
        let s = (x + y + z) * F3;
        let i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
        let t = (i + j + k) * G3;
        let X0 = i - t, Y0 = j - t, Z0 = k - t;
        let x0 = x - X0, y0 = y - Y0, z0 = z - Z0;
        let i1, j1, k1, i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0)      { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else               { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0)       { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0)  { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else               { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        let x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        let x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
        let x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
        i &= 255; j &= 255; k &= 255;
        let gi0 = this.perm[i + this.perm[j + this.perm[k]]] % 12;
        let gi1 = this.perm[i + i1 + this.perm[j + j1 + this.perm[k + k1]]] % 12;
        let gi2 = this.perm[i + i2 + this.perm[j + j2 + this.perm[k + k2]]] % 12;
        let gi3 = this.perm[i + 1 + this.perm[j + 1 + this.perm[k + 1]]] % 12;
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        n0 = t0 < 0 ? 0 : (t0 ** 4) * dot3(gi0, x0, y0, z0);
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        n1 = t1 < 0 ? 0 : (t1 ** 4) * dot3(gi1, x1, y1, z1);
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        n2 = t2 < 0 ? 0 : (t2 ** 4) * dot3(gi2, x2, y2, z2);
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        n3 = t3 < 0 ? 0 : (t3 ** 4) * dot3(gi3, x3, y3, z3);
        return 32 * (n0 + n1 + n2 + n3);
    }
}
const grad3 = [
    [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
    [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
    [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
];
function dot3(g, x, y, z) {
    return grad3[g][0]*x + grad3[g][1]*y + grad3[g][2]*z;
}

// --- Utility functions ---
const TAU = Math.PI * 2;
function rand(n) { return Math.random() * n; }
function randRange(n) { return (Math.random() - 0.5) * 2 * n; }
function lerp(a, b, n) { return (1 - n) * a + n * b; }
function fadeInOut(t, m) {
    let hm = 0.5 * m;
    return Math.abs((t + hm) % m - hm) / hm;
}

// --- Particle system parameters ---
const particleCount = 700;
const particlePropCount = 9;
const particlePropsLength = particleCount * particlePropCount;
const rangeY = 100;
const baseTTL = 50;
const rangeTTL = 150;
const baseSpeed = 0.1;
const rangeSpeed = 2;
const baseRadius = 1;
const rangeRadius = 4;
const baseHue = 220;
const rangeHue = 100;
const noiseSteps = 8;
const xOff = 0.00125;
const yOff = 0.00125;
const zOff = 0.0005;
const backgroundColor = 'hsla(260,40%,5%,1)';

// Use the existing canvas from the HTML
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let center = [];
let tick = 0;
let simplex = new SimplexNoise();
let particleProps = new Float32Array(particlePropsLength);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    center[0] = 0.5 * canvas.width;
    center[1] = 0.5 * canvas.height;
}
window.addEventListener('resize', resize);
resize();

function initParticle(i) {
    let x = rand(canvas.width);
    let y = center[1] + randRange(rangeY);
    let vx = 0;
    let vy = 0;
    let life = 0;
    let ttl = baseTTL + rand(rangeTTL);
    let speed = baseSpeed + rand(rangeSpeed);
    let radius = baseRadius + rand(rangeRadius);
    let hue = baseHue + rand(rangeHue);

    particleProps.set([x, y, vx, vy, life, ttl, speed, radius, hue], i);
}

function initParticles() {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        initParticle(i);
    }
}

function drawParticle(x, y, x2, y2, life, ttl, radius, hue) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = radius;
    ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

function checkBounds(x, y) {
    return (
        x > canvas.width ||
        x < 0 ||
        y > canvas.height ||
        y < 0
    );
}

function updateParticle(i) {
    let i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i;
    let x = particleProps[i];
    let y = particleProps[i2];
    let n = simplex.noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
    let vx = lerp(particleProps[i3], Math.cos(n), 0.5);
    let vy = lerp(particleProps[i4], Math.sin(n), 0.5);
    let life = particleProps[i5];
    let ttl = particleProps[i6];
    let speed = particleProps[i7];
    let x2 = x + vx * speed;
    let y2 = y + vy * speed;
    let radius = particleProps[i8];
    let hue = particleProps[i9];

    drawParticle(x, y, x2, y2, life, ttl, radius, hue);

    life++;

    particleProps[i] = x2;
    particleProps[i2] = y2;
    particleProps[i3] = vx;
    particleProps[i4] = vy;
    particleProps[i5] = life;

    (checkBounds(x, y) || life > ttl) && initParticle(i);
}

function drawParticles() {
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        updateParticle(i);
    }
}

function renderGlow() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(8px) brightness(200%)';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(4px) brightness(200%)';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
}

function draw() {
    tick++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawParticles();
    // Optionally, you can call renderGlow() here for extra glow, but it may be redundant on a single canvas.

    window.requestAnimationFrame(draw);
}

initParticles();
draw();