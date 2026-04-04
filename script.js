// ── Theme Toggle ──────────────────────────────
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const toggleLabel = document.getElementById('toggleLabel');

const saved = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', saved);
toggleLabel.textContent = saved === 'dark' ? '[ LIGHT ]' : '[ DARK ]';

themeToggle.addEventListener('click', () => {
    const cur  = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    toggleLabel.textContent = next === 'dark' ? '[ LIGHT ]' : '[ DARK ]';
});

// ── Pulsing Noise Canvas ──────────────────────
const canvas = document.getElementById('noiseCanvas');
const ctx    = canvas.getContext('2d');
let W, H, imageData, buf, t = 0;

function resize() {
    W = Math.floor(window.innerWidth  / 3);
    H = Math.floor(window.innerHeight / 3);
    canvas.width  = W; canvas.height = H;
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.style.imageRendering = 'pixelated';
    imageData = ctx.createImageData(W, H);
    buf = imageData.data;
}
resize();
window.addEventListener('resize', resize);

function noise(x, y, t) {
    const a = Math.sin(x * 0.08 + t * 0.4) * Math.cos(y * 0.06 + t * 0.3);
    const b = Math.sin(x * 0.15 - t * 0.25 + y * 0.1) * 0.5;
    const c = Math.cos((x + y) * 0.05 + t * 0.6) * 0.3;
    return ((a + b + c) / 1.8 + 1) / 2;
}

function drawNoise() {
    const dark = html.getAttribute('data-theme') === 'dark';
    const [bR,bG,bB] = dark ? [8,13,28]    : [240,242,245];
    const [fR,fG,fB] = dark ? [100,130,200]: [13,27,62];
    t += 0.012;
    const pulse = 0.55 + 0.45 * (Math.sin(t * 0.5) * 0.5 + 0.5);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const n = Math.pow(noise(x, y, t), 1.6);
            const a = n * pulse * (dark ? 0.18 : 0.09);
            const i = (y * W + x) * 4;
            buf[i]   = bR + (fR-bR)*a;
            buf[i+1] = bG + (fG-bG)*a;
            buf[i+2] = bB + (fB-bB)*a;
            buf[i+3] = 255;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(drawNoise);
}
drawNoise();

// ── Mobile Menu ───────────────────────────────
const menuBtn = document.getElementById('mobile-menu-toggle');
const navMenu = document.getElementById('nav-menu');

menuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    menuBtn.classList.toggle('active');
});

// ── Scroll: Navbar + Back to Top ─────────────
const navbar    = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
    backToTop.classList.toggle('visible', y > 60);
    updateActiveNav();
});

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-link');
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 90) current = s.id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
}

// ── DATA CORRUPTION TRANSITION ───────────────
const CHARS = '!@#$%^&*()_+-=[]{}|;,.<>?/\\~`ABCDEFabcdef0123456789░▒▓█▄▀■□▪';
const COL_W = 10;
const ROW_H = 14;

function getThemeColors() {
    const dark = html.getAttribute('data-theme') === 'dark';
    return {
        ink: dark ? '#e8edf5' : '#0d1b3e',
        bg:  dark ? '#080d1c' : '#f0f2f5',
    };
}

function createCorruptionCanvas(section) {
    const existing = section.querySelector('.corruption-canvas');
    if (existing) existing.remove();
    const c = document.createElement('canvas');
    c.classList.add('corruption-canvas');
    section.appendChild(c);
    return c;
}

function runCorruption(section, onDone) {
    const cv  = createCorruptionCanvas(section);
    const W   = section.offsetWidth;
    const H   = section.offsetHeight;
    cv.width  = W;
    cv.height = H;
    const cx   = cv.getContext('2d');
    const cols = Math.floor(W / COL_W);
    const rows = Math.floor(H / ROW_H);
    const { ink } = getThemeColors();

    const colState = Array(cols).fill('corrupt');

    colState.forEach((_, i) => {
        const delay = (i / cols) * 700 + Math.random() * 120;
        setTimeout(() => {
            colState[i] = 'resolving';
            setTimeout(() => { colState[i] = 'done'; }, 180);
        }, delay);
    });

    let animId;

    function drawFrame() {
        cx.clearRect(0, 0, W, H);
        let allDone = true;

        for (let c = 0; c < cols; c++) {
            const state = colState[c];
            if (state === 'done') continue;
            allDone = false;

            for (let r = 0; r < rows; r++) {
                const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
                if (state === 'corrupt') {
                    cx.globalAlpha = 0.55 + Math.random() * 0.45;
                    cx.fillStyle   = ink;
                    cx.font        = `${Math.random() > 0.85 ? 'bold ' : ''}11px IBM Plex Mono, monospace`;
                    cx.fillText(ch, c * COL_W, r * ROW_H + 11);
                    cx.globalAlpha = 1;
                } else if (state === 'resolving') {
                    cx.globalAlpha = 0.2 + Math.random() * 0.3;
                    cx.fillStyle   = ink;
                    cx.font        = '11px IBM Plex Mono, monospace';
                    if (Math.random() > 0.5) cx.fillText(ch, c * COL_W, r * ROW_H + 11);
                    cx.globalAlpha = 1;
                }
            }
        }

        if (!allDone) {
            animId = requestAnimationFrame(drawFrame);
        } else {
            cx.clearRect(0, 0, W, H);
            cv.remove();
            if (onDone) onDone();
        }
    }

    animId = requestAnimationFrame(drawFrame);
    return () => { cancelAnimationFrame(animId); cv.remove(); };
}

function runScramble(section) {
    const cv  = createCorruptionCanvas(section);
    const W   = section.offsetWidth;
    const H   = section.offsetHeight;
    cv.width  = W;
    cv.height = H;
    const cx   = cv.getContext('2d');
    const cols = Math.floor(W / COL_W);
    const rows = Math.floor(H / ROW_H);
    const { ink } = getThemeColors();

    const colState = Array(cols).fill('empty');

    colState.forEach((_, i) => {
        const delay = ((cols - i) / cols) * 300 + Math.random() * 80;
        setTimeout(() => { colState[i] = 'corrupt'; }, delay);
    });

    let animId;

    function drawFrame() {
        cx.clearRect(0, 0, W, H);
        for (let c = 0; c < cols; c++) {
            if (colState[c] !== 'corrupt') continue;
            for (let r = 0; r < rows; r++) {
                const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
                cx.globalAlpha = 0.45 + Math.random() * 0.55;
                cx.fillStyle   = ink;
                cx.font        = '11px IBM Plex Mono, monospace';
                cx.fillText(ch, c * COL_W, r * ROW_H + 11);
                cx.globalAlpha = 1;
            }
        }
        animId = requestAnimationFrame(drawFrame);
    }

    animId = requestAnimationFrame(drawFrame);

    setTimeout(() => {
        cancelAnimationFrame(animId);
        cx.clearRect(0, 0, W, H);
        cv.remove();
    }, 400);
}

// ── Stagger observer ──────────────────────────
const staggerObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            staggerObs.unobserve(e.target);
        }
    });
}, { threshold: 0.1 });

// Store delays on dataset so resets preserve them
document.querySelectorAll('.exp-list,.projects-grid,.skills-grid,.cert-list,.contact-grid,.about-grid')
    .forEach(c => c.querySelectorAll('.stagger').forEach((el, i) => {
        const delay = `${i * 0.08}s`;
        el.style.transitionDelay = delay;
        el.dataset.delay = delay;
    }));

// ── Main section observer ─────────────────────
const sectionMap = new WeakMap();

const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        const sec = e.target;

        if (sectionMap.has(sec)) {
            sectionMap.get(sec)();
            sectionMap.delete(sec);
        }

        if (e.isIntersecting) {
            const cancel = runCorruption(sec, () => {
                sec.querySelectorAll('.stagger').forEach(el => staggerObs.observe(el));
            });
            sectionMap.set(sec, cancel);
        } else {
            sec.querySelectorAll('.stagger').forEach(el => {
                el.classList.remove('visible');
                el.style.transitionDelay = el.dataset.delay || '0s';
                staggerObs.unobserve(el);
            });
            runScramble(sec);
        }
    });
}, { threshold: 0, rootMargin: '0px 0px -80px 0px' });

document.querySelectorAll('section:not(.hero)').forEach(sec => {
    sectionObs.observe(sec);
});

// ── Glitch fire on load ───────────────────────
window.addEventListener('load', () => {
    document.querySelectorAll('.hero-title .glitch').forEach((el, i) => {
        setTimeout(() => {
            el.dispatchEvent(new MouseEvent('mouseenter'));
            setTimeout(() => el.dispatchEvent(new MouseEvent('mouseleave')), 400);
        }, 300 + i * 200);
    });
});

// ── TV SHUTDOWN TRANSITION ────────────────────
html.style.scrollBehavior = 'auto';

const OV = document.createElement('div');
OV.id = 'glitch-overlay';
OV.style.cssText = 'display:none;position:fixed;inset:0;z-index:999999;pointer-events:none;overflow:hidden';
document.body.appendChild(OV);

const INK_L = '#0d1b3e';
const INK_D = '#e8edf5';
let busy = false;

function runTVShutdown(targetId) {
    if (busy) return;
    busy = true;

    navMenu.classList.remove('active');
    menuBtn.classList.remove('active');

    OV.innerHTML = '';
    OV.style.display = 'block';
    const ink = html.getAttribute('data-theme') === 'dark' ? INK_D : INK_L;
    const bg  = html.getAttribute('data-theme') === 'dark' ? '#080d1c' : '#f0f2f5';

    const screen = document.createElement('div');
    screen.style.cssText = `
        position:absolute;inset:0;
        background:${bg};
        transform-origin:center;
        transform:scaleY(1);
        transition:none;
    `;
    OV.appendChild(screen);

    const scan = document.createElement('div');
    scan.style.cssText = `
        position:absolute;inset:0;
        background:repeating-linear-gradient(
            to bottom,
            transparent 0px, transparent 2px,
            rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 3px
        );
        pointer-events:none;
    `;
    OV.appendChild(scan);

    const line = document.createElement('div');
    line.style.cssText = `
        position:absolute;
        left:0; width:100%; height:3px;
        top:50%; transform:translateY(-50%);
        background:${ink};
        opacity:0;
        box-shadow:0 0 8px 2px ${ink};
    `;
    OV.appendChild(line);

    const lineBlue = document.createElement('div');
    lineBlue.style.cssText = `
        position:absolute;left:0;width:100%;height:1px;
        top:calc(50% - 3px);background:#1a6bff;opacity:0;
    `;
    OV.appendChild(lineBlue);

    const lineRed = document.createElement('div');
    lineRed.style.cssText = `
        position:absolute;left:0;width:100%;height:1px;
        top:calc(50% + 3px);background:#ff1a4b;opacity:0;
    `;
    OV.appendChild(lineRed);

    const noiseEl = document.createElement('canvas');
    noiseEl.width = 300; noiseEl.height = 200;
    noiseEl.style.cssText = `
        position:absolute;inset:0;
        width:100%;height:100%;
        opacity:0;image-rendering:pixelated;
    `;
    OV.appendChild(noiseEl);
    const nctx = noiseEl.getContext('2d');

    function drawStatic(alpha) {
        const id = nctx.createImageData(300, 200);
        const d  = id.data;
        for (let i = 0; i < d.length; i += 4) {
            const v = Math.random() > 0.5 ? 255 : 0;
            d[i] = d[i+1] = d[i+2] = v;
            d[i+3] = Math.random() * 180;
        }
        nctx.putImageData(id, 0, 0);
        noiseEl.style.opacity = String(alpha);
    }

    let staticInterval = setInterval(() => drawStatic(0.25), 80);

    setTimeout(() => {
        screen.style.transition = 'transform 0.18s steps(6)';
        screen.style.transform  = 'scaleY(0.08)';
        drawStatic(0.5);
    }, 80);

    setTimeout(() => {
        clearInterval(staticInterval);
        screen.style.transition = 'none';
        screen.style.transform  = 'scaleY(0)';
        line.style.transition   = 'opacity 0.05s steps(1)';
        line.style.opacity      = '1';
        lineBlue.style.opacity  = '0.7';
        lineRed.style.opacity   = '0.7';
        noiseEl.style.opacity   = '0';
    }, 240);

    setTimeout(() => { line.style.opacity = '0.3'; lineBlue.style.opacity = '0.3'; lineRed.style.opacity = '0.3'; }, 300);
    setTimeout(() => { line.style.opacity = '0.8'; lineBlue.style.opacity = '0.6'; lineRed.style.opacity = '0.6'; }, 340);
    setTimeout(() => { line.style.opacity = '0.1'; }, 380);
    setTimeout(() => { line.style.opacity = '0.6'; }, 410);
    setTimeout(() => {
        line.style.transition  = 'opacity 0.06s steps(2), width 0.1s steps(4)';
        line.style.opacity     = '0';
        line.style.width       = '0%';
        line.style.left        = '50%';
        lineBlue.style.opacity = '0';
        lineRed.style.opacity  = '0';
    }, 450);

    setTimeout(() => {
        const target = document.querySelector(targetId);
        if (target) target.scrollIntoView({ behavior: 'instant' });
    }, 470);

    setTimeout(() => {
        OV.style.display = 'none';
        OV.innerHTML = '';
        busy = false;
    }, 560);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        e.stopPropagation();
        runTVShutdown(href);
    });
});
