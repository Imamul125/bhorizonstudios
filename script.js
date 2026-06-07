// ── Floating Particles ───────────────────────────────────────
(function createParticles() {
    const container = document.getElementById('particles');
    const count = 25;

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        const size = Math.random() * 3 + 1;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (Math.random() * 15 + 10) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        container.appendChild(p);
    }
})();

// ── Navbar Scroll Effect ─────────────────────────────────────
(function initNavbar() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
    });
})();

// ── Mobile Menu ──────────────────────────────────────────────
(function initMobileMenu() {
    const hamburger = document.getElementById('navHamburger');
    const menu = document.getElementById('mobileMenu');

    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
        });
    });
})();

// ── Scroll Reveal ────────────────────────────────────────────
(function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const selectors = [
        '.about-stat-card',
        '.game-showcase',
        '.gallery-card',
        '.coming-soon-card',
        '.contact-card'
    ];

    document.querySelectorAll(selectors.join(', ')).forEach((el, i) => {
        el.style.transitionDelay = `${(i % 4) * 0.1}s`;
        observer.observe(el);
    });
})();

// ── Smooth scroll for anchor links ───────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});
