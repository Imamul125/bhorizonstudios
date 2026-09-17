// ══════════════════════════════════════════════════════════════
// BHORIZON STUDIOS — Interactions
// ══════════════════════════════════════════════════════════════

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ── Starfield Canvas ─────────────────────────────────────────
(function initCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const COLORS = ['255,255,255', '232,182,76', '34,211,166', '255,122,47'];
    let w, h, dpr, stars = [];

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth; h = window.innerHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round(Math.min(90, (w * h) / 16000));
        stars = Array.from({ length: count }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.3 + 0.3,
            vy: Math.random() * 0.15 + 0.03,
            c: COLORS[Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 3)],
            p: Math.random() * Math.PI * 2,
            ps: Math.random() * 0.02 + 0.005,
        }));
    }

    let scrollShift = 0;
    window.addEventListener('scroll', () => { scrollShift = window.scrollY * 0.05; }, { passive: true });

    function frame() {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
            s.y -= s.vy; s.p += s.ps;
            if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; }
            const y = ((s.y - scrollShift * s.r) % h + h) % h;
            ctx.beginPath();
            ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${s.c},${0.15 + (Math.sin(s.p) + 1) * 0.25})`;
            ctx.fill();
        }
        requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    frame();
})();

// ── Navbar: scrolled state + active link ─────────────────────
(function initNav() {
    const nav = document.getElementById('navbar');
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const links = [...document.querySelectorAll('.nav-links a')];
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(s => observer.observe(s));
})();

// ── Mobile Menu ──────────────────────────────────────────────
(function initMobileMenu() {
    const btn = document.getElementById('navHamburger');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    const setOpen = open => {
        btn.classList.toggle('active', open);
        menu.classList.toggle('active', open);
        btn.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => setOpen(!menu.classList.contains('active')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
})();

// ── Scroll Reveal ────────────────────────────────────────────
(function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (reduceMotion) { els.forEach(el => el.classList.add('visible')); return; }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => {
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        el.style.transitionDelay = `${siblings.indexOf(el) * 0.08}s`;
        observer.observe(el);
    });
})();

// ── Counters ─────────────────────────────────────────────────
(function initCounters() {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const suffix = el.dataset.suffix || '';
            const start = performance.now();
            const duration = reduceMotion ? 1 : 1600;

            (function tick(now) {
                const t = Math.min((now - start) / duration, 1);
                el.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target) + (t === 1 ? suffix : '');
                if (t < 1) requestAnimationFrame(tick);
            })(start);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.counter').forEach(c => observer.observe(c));
})();

// ── Cursor spotlight on cards ────────────────────────────────
(function initSpotlight() {
    if (!finePointer) return;
    document.querySelectorAll('.spot').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });
})();

// ── 3D tilt on game cards ────────────────────────────────────
(function initTilt() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.tilt').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transition = 'transform 0.15s ease-out, border-color 0.4s';
            card.style.transform = `perspective(1000px) rotateX(${-y * 5}deg) rotateY(${x * 6}deg) translateY(-4px)`;
        });
        card.addEventListener('pointerleave', () => {
            card.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s';
            card.style.transform = '';
        });
    });
})();

// ── Magnetic buttons ─────────────────────────────────────────
(function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('pointermove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.18}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
})();

// ── Hero parallax ────────────────────────────────────────────
(function initHeroParallax() {
    const hero = document.getElementById('hero');
    const layers = document.querySelectorAll('#heroVisual [data-depth]');
    if (!hero || !finePointer || reduceMotion) return;

    let raf = null;
    hero.addEventListener('pointermove', e => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
            layers.forEach(layer => {
                const d = parseFloat(layer.dataset.depth);
                const offset = `${-x * d}px ${-y * d}px`;
                if (layer.classList.contains('float-chip')) layer.style.transform = `translate(${-x * d}px, ${-y * d}px)`;
                else layer.style.translate = offset;
            });
        });
    });
    hero.addEventListener('pointerleave', () => {
        layers.forEach(l => { l.style.transform = ''; l.style.translate = ''; });
    });
})();

// ── Pause hero animations when off-screen ────────────────────
(function initHeroPause() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    new IntersectionObserver(([entry]) => {
        hero.classList.toggle('offscreen', !entry.isIntersecting);
    }).observe(hero);
})();

// ── Lightbox galleries ───────────────────────────────────────
(function initLightbox() {
    const box = document.getElementById('lightbox');
    if (!box) return;
    const img = box.querySelector('.lb-img');
    const count = box.querySelector('.lb-count');
    let items = [], index = 0, lastFocus = null;

    function galleryImages(name) {
        const source = document.querySelector(`[data-gallery="${name}"]`);
        return [...source.querySelectorAll('[data-index]')]
            .sort((a, b) => a.dataset.index - b.dataset.index)
            .map(b => { const i = b.querySelector('img'); return { src: i.src, alt: i.alt }; });
    }

    function show(i) {
        index = (i + items.length) % items.length;
        img.src = items[index].src;
        img.alt = items[index].alt;
        count.textContent = `${index + 1} / ${items.length}`;
        img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
    }

    function open(name, i) {
        items = galleryImages(name);
        if (!items.length) return;
        lastFocus = document.activeElement;
        box.hidden = false;
        document.body.style.overflow = 'hidden';
        show(i);
        box.querySelector('.lb-close').focus();
    }

    function close() {
        box.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus) lastFocus.focus();
    }

    document.querySelectorAll('[data-gallery] [data-index]').forEach(btn => {
        btn.addEventListener('click', () => open(btn.closest('[data-gallery]').dataset.gallery, +btn.dataset.index));
    });

    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
    box.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
    box.addEventListener('click', e => { if (e.target === box) close(); });

    document.addEventListener('keydown', e => {
        if (box.hidden) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
    });

    let touchX = null;
    box.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
        touchX = null;
    });
})();

// ── Mindolock poster fan: rotate which screen is in front ────
(function initFan() {
    const fan = document.getElementById('mindolockFan');
    if (!fan || reduceMotion) return;
    const posters = [...fan.querySelectorAll('.poster')];
    const dots = [...fan.parentElement.querySelectorAll('.fan-dots span')];
    const slots = ['p1', 'p2', 'p3']; // left, right, front
    let order = posters.map(p => slots.find(c => p.classList.contains(c)));
    let paused = false;

    function rotate() {
        if (paused || document.hidden) return;
        order = order.map(slot => ({ p3: 'p1', p1: 'p2', p2: 'p3' })[slot]);
        posters.forEach((p, i) => { p.classList.remove(...slots); p.classList.add(order[i]); });
        const front = posters[order.indexOf('p3')].dataset.index;
        dots.forEach((d, i) => d.classList.toggle('on', String(i) === front));
    }

    const product = fan.closest('.product');
    product.addEventListener('pointerenter', () => { paused = true; });
    product.addEventListener('pointerleave', () => { paused = false; });
    setInterval(rotate, 3500);
})();

// ── App Store buttons not live yet ───────────────────────────
document.querySelectorAll('.store-soon').forEach(btn => {
    btn.addEventListener('click', e => {
        e.preventDefault();
        btn.classList.remove('nudge'); void btn.offsetWidth; btn.classList.add('nudge');
    });
});

// ── Copy email ───────────────────────────────────────────────
(function initCopyEmail() {
    const btn = document.getElementById('copyEmail');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(btn.dataset.email);
            btn.textContent = 'Copied ✓';
        } catch {
            btn.textContent = btn.dataset.email;
        }
        setTimeout(() => { btn.textContent = 'Copy email'; }, 2000);
    });
})();

// ── Smooth anchor scroll (offset for floating nav) ───────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href');
        const target = id.length > 1 && document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - (id === '#hero' ? 0 : 70);
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
});

document.getElementById('year').textContent = new Date().getFullYear();
