// ══════════════════════════════════════════════════════════════
// BHORIZON STUDIOS — Interactions
// ══════════════════════════════════════════════════════════════

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Global nav: mobile menu ──────────────────────────────────
(function initGlobalNav() {
    const nav = document.getElementById('gnav');
    const btn = document.getElementById('gnavBurger');
    const menu = document.getElementById('gnavMenu');
    if (!nav || !btn || !menu) return;

    const setOpen = open => {
        nav.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open);
        document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false); });
})();

// ── Local nav: hairline once it sticks ───────────────────────
(function initLocalNav() {
    const local = document.getElementById('localnav');
    const gnav = document.getElementById('gnav');
    if (!local || !gnav) return;
    new IntersectionObserver(([entry]) => {
        local.classList.toggle('stuck', !entry.isIntersecting);
    }).observe(gnav);
})();

// ── Scroll reveal ────────────────────────────────────────────
(function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('visible')); return; }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => {
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 0.08}s`;
        observer.observe(el);
    });
})();

// ── Segmented controls ───────────────────────────────────────
function initSegmented(group, onSelect) {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const select = tab => {
        tabs.forEach(t => t.setAttribute('aria-selected', t === tab));
        onSelect(tab);
    };
    tabs.forEach(tab => tab.addEventListener('click', () => select(tab)));
    group.addEventListener('keydown', e => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const i = tabs.indexOf(document.activeElement);
        if (i < 0) return;
        const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        select(next);
    });
    return select;
}

// Lineup filter: All / Apps / Games
(function initLineupFilter() {
    const group = document.getElementById('lineupFilter');
    const grid = document.getElementById('lineupGrid');
    if (!group || !grid) return;
    const models = [...grid.querySelectorAll('.model')];
    initSegmented(group, tab => {
        const filter = tab.dataset.filter;
        models.forEach(m => { m.hidden = filter !== 'all' && m.dataset.kind !== filter; });
        grid.scrollTo({ left: 0 });
    });
})();

// Screens: one panel per title
const selectScreens = (function initScreens() {
    const group = document.getElementById('screensTabs');
    if (!group) return () => {};
    const select = initSegmented(group, tab => {
        group.querySelectorAll('[role="tab"]').forEach(t => {
            document.getElementById(t.getAttribute('aria-controls')).hidden = t !== tab;
        });
    });
    return name => select(document.getElementById(`t-${name}`));
})();

// "Screens ›" links in the lineup jump to the right panel
document.querySelectorAll('[data-screens]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        selectScreens(link.dataset.screens);
        document.getElementById('screens').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
});

// ── Highlights gallery paddles ───────────────────────────────
(function initGallery() {
    const gallery = document.getElementById('gallery');
    const prev = document.getElementById('paddlePrev');
    const next = document.getElementById('paddleNext');
    if (!gallery || !prev || !next) return;

    const step = () => {
        const card = gallery.querySelector('.card');
        return card ? card.getBoundingClientRect().width + 20 : gallery.clientWidth * 0.8;
    };
    const update = () => {
        const max = gallery.scrollWidth - gallery.clientWidth - 2;
        prev.disabled = gallery.scrollLeft <= 2;
        next.disabled = gallery.scrollLeft >= max;
    };
    prev.addEventListener('click', () => gallery.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => gallery.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' }));
    gallery.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();

// ── "+" card modals ──────────────────────────────────────────
(function initModals() {
    const modal = document.getElementById('modal');
    if (!modal || typeof modal.showModal !== 'function') return;
    const body = modal.querySelector('.modal-body');

    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tpl = document.getElementById(btn.dataset.modal);
            if (!tpl) return;
            body.replaceChildren(tpl.content.cloneNode(true));
            const title = body.querySelector('.modal-title');
            if (title) title.id = 'modalTitle';
            modal.showModal();
            document.body.style.overflow = 'hidden';
        });
    });

    modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    modal.addEventListener('close', () => { document.body.style.overflow = ''; });
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
        if (!source) return [];
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
    document.querySelectorAll('[data-lightbox]').forEach(btn => {
        btn.addEventListener('click', () => open(btn.dataset.lightbox, 0));
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

document.getElementById('year').textContent = new Date().getFullYear();
