/* =============================================================
   APTERIX — MAIN JAVASCRIPT
   Stack: GSAP + ScrollTrigger + Lenis (CDN-loaded in index.html)
   Features: smooth scroll, scroll reveals, hero stagger, counters,
             accordion, success carousel, parallax, timeline,
             mobile overlay menu, custom cursor, audio toggle.
============================================================= */

(function () {
    'use strict';

    /* ============================================
       UTILITY: Reduced motion
    ============================================ */
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============================================
       LENIS — SMOOTH SCROLL
    ============================================ */
    let lenis = null;

    function initLenis() {
        if (reduceMotion) return;
        if (typeof Lenis === 'undefined') return;

        lenis = new Lenis({
            duration: 1.2,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Bridge Lenis to ScrollTrigger if available
        if (typeof gsap !== 'undefined' && gsap.ticker) {
            lenis.on('scroll', function () {
                if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
            });
        }
    }

    /* ============================================
       GSAP REGISTRATION
    ============================================ */
    function initGSAP() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return false;
        gsap.registerPlugin(ScrollTrigger);
        return true;
    }

    /* ============================================
       HERO INTRO ANIMATION
    ============================================ */
    function initHeroAnimation(hasGSAP) {
        const eyebrow = document.querySelector('.js-hero-eyebrow');
        const title = document.querySelector('.js-hero-title');
        const buttons = document.querySelector('.js-hero-buttons');

        if (!eyebrow || !title || !buttons) return;

        if (!hasGSAP || reduceMotion) {
            eyebrow.style.opacity = '1';
            title.style.opacity = '1';
            buttons.style.opacity = '1';
            return;
        }

        // Split title into words for stagger
        const text = title.textContent.trim();
        title.innerHTML = '';
        text.split(' ').forEach(function (word) {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = word + ' ';
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(40px)';
            title.appendChild(span);
        });

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(eyebrow,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 }
        )
        .to(title.querySelectorAll('.word'),
            { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 },
            '-=0.3'
        )
        .fromTo(buttons,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 },
            '-=0.4'
        );
    }

    /* ============================================
       STICKY HEADER + ANNOUNCEMENT BAR SCROLL FX
    ============================================ */
    function initStickyHeader() {
        const header = document.getElementById('siteHeader');
        const announcement = document.getElementById('announcementBar');
        if (!header) return;

        let lastY = 0;
        function update() {
            const y = window.scrollY;
            if (y > 50) {
                header.classList.add('scrolled');
                if (announcement) announcement.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
                if (announcement) announcement.classList.remove('scrolled');
            }
            // After hero, hide announcement bar so header sits at top
            if (y > 400) document.body.classList.add('scrolled-deep');
            else document.body.classList.remove('scrolled-deep');
            lastY = y;
        }
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* ============================================
       MOBILE OVERLAY MENU
    ============================================ */
    function initMobileMenu() {
        const toggle = document.getElementById('menuToggle');
        const overlay = document.getElementById('mobileOverlay');
        if (!toggle || !overlay) return;

        const links = overlay.querySelectorAll('a');

        function open() {
            toggle.classList.add('active');
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            toggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
            if (lenis) lenis.stop();
            document.body.style.overflow = 'hidden';
        }

        function close() {
            toggle.classList.remove('active');
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
            if (lenis) lenis.start();
            document.body.style.overflow = '';
        }

        toggle.addEventListener('click', function () {
            if (overlay.classList.contains('open')) close();
            else open();
        });

        links.forEach(function (link) {
            link.addEventListener('click', close);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('open')) close();
        });
    }

    /* ============================================
       SCROLL REVEAL — sections fade-up on enter
    ============================================ */
    function initScrollReveal(hasGSAP) {
        const revealSelectors = [
            '.section-header',
            '.pillar-card',
            '.collection-card',
            '.dealer-content',
            '.dealer-image-wrap',
            '.dealer-banner',
            '.about-content',
            '.about-marquee',
            '.innovation-image-wrap',
            '.innovation-content',
            '.video-wrap',
            '.stat-card',
            '.tech-card',
            '.success-card',
            '.locator-content',
            '.locator-image-wrap',
            '.timeline-item',
            '.faq-item',
            '.cta-banner-content'
        ];
        const elements = document.querySelectorAll(revealSelectors.join(','));

        if (reduceMotion || !hasGSAP) {
            elements.forEach(function (el) { el.style.opacity = '1'; });
            return;
        }

        elements.forEach(function (el) {
            gsap.fromTo(el,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        // Stagger groups
        const groups = [
            '.pillars-grid',
            '.collections-grid',
            '.tech-cards-grid',
            '.stats-grid'
        ];
        groups.forEach(function (sel) {
            const wrap = document.querySelector(sel);
            if (!wrap) return;
            const children = wrap.children;
            gsap.fromTo(children,
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 0.7, stagger: 0.10, ease: 'power3.out',
                    scrollTrigger: { trigger: wrap, start: 'top 80%' }
                }
            );
        });
    }

    /* ============================================
       COUNTER ANIMATION
    ============================================ */
    function initCounters(hasGSAP) {
        const counters = document.querySelectorAll('.counter');
        if (!counters.length) return;

        function formatNumber(n) {
            return n.toLocaleString('en-US');
        }

        function animate(el) {
            const target = parseInt(el.getAttribute('data-target'), 10) || 0;
            if (reduceMotion) {
                el.textContent = formatNumber(target);
                return;
            }
            const duration = 2000;
            const startTime = performance.now();

            function step(now) {
                const progress = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                el.textContent = formatNumber(current);
                if (progress < 1) requestAnimationFrame(step);
                else el.textContent = formatNumber(target);
            }
            requestAnimationFrame(step);
        }

        if (hasGSAP && !reduceMotion) {
            counters.forEach(function (el) {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 80%',
                    once: true,
                    onEnter: function () { animate(el); }
                });
            });
        } else if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animate(entry.target);
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            counters.forEach(function (el) { obs.observe(el); });
        } else {
            counters.forEach(animate);
        }
    }

    /* ============================================
       PARALLAX BANNER
    ============================================ */
    function initParallax(hasGSAP) {
        const image = document.getElementById('parallaxImage');
        if (!image || !hasGSAP || reduceMotion) return;

        gsap.to(image, {
            yPercent: -20,
            ease: 'none',
            scrollTrigger: {
                trigger: image.closest('.parallax-banner'),
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    /* ============================================
       FAQ ACCORDION
    ============================================ */
    function initFAQ() {
        const items = document.querySelectorAll('.faq-item');
        items.forEach(function (item) {
            const btn = item.querySelector('.faq-question');
            if (!btn) return;
            btn.addEventListener('click', function () {
                const isActive = item.classList.contains('active');
                items.forEach(function (other) {
                    other.classList.remove('active');
                    const otherBtn = other.querySelector('.faq-question');
                    if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
                });
                if (!isActive) {
                    item.classList.add('active');
                    btn.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    /* ============================================
       SUCCESS STORIES CAROUSEL
    ============================================ */
    function initSuccessCarousel() {
        const track = document.getElementById('successCarousel');
        const prev = document.getElementById('successPrev');
        const next = document.getElementById('successNext');
        const dotsWrap = document.getElementById('successDots');
        if (!track || !prev || !next || !dotsWrap) return;

        const cards = track.querySelectorAll('.success-card');
        if (!cards.length) return;

        let index = 0;
        let visible = computeVisible();

        function computeVisible() {
            const w = window.innerWidth;
            if (w <= 480) return 1;
            if (w <= 768) return 1;
            if (w <= 1024) return 2;
            return 3;
        }

        function totalSlides() {
            return Math.max(1, cards.length - visible + 1);
        }

        function buildDots() {
            dotsWrap.innerHTML = '';
            const slides = totalSlides();
            for (let i = 0; i < slides; i++) {
                const dot = document.createElement('button');
                dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
                dot.addEventListener('click', function () { goTo(i); });
                dotsWrap.appendChild(dot);
            }
        }

        function update() {
            const cardWidth = cards[0].offsetWidth;
            const gap = parseInt(getComputedStyle(track).gap, 10) || 24;
            const offset = -(index * (cardWidth + gap));
            track.style.transform = 'translateX(' + offset + 'px)';

            const dots = dotsWrap.querySelectorAll('.carousel-dot');
            dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
        }

        function goTo(i) {
            const max = totalSlides() - 1;
            index = Math.max(0, Math.min(i, max));
            update();
        }

        function goNext() { goTo(index >= totalSlides() - 1 ? 0 : index + 1); }
        function goPrev() { goTo(index <= 0 ? totalSlides() - 1 : index - 1); }

        prev.addEventListener('click', goPrev);
        next.addEventListener('click', goNext);

        // Drag/swipe
        let isDown = false;
        let startX = 0;
        let dragDelta = 0;

        function pointerDown(e) {
            isDown = true;
            startX = (e.touches ? e.touches[0].clientX : e.clientX);
            dragDelta = 0;
            track.style.transition = 'none';
        }

        function pointerMove(e) {
            if (!isDown) return;
            const x = (e.touches ? e.touches[0].clientX : e.clientX);
            dragDelta = x - startX;
        }

        function pointerUp() {
            if (!isDown) return;
            isDown = false;
            track.style.transition = '';
            if (Math.abs(dragDelta) > 60) {
                if (dragDelta < 0) goNext();
                else goPrev();
            } else {
                update();
            }
            dragDelta = 0;
        }

        track.addEventListener('mousedown', pointerDown);
        window.addEventListener('mousemove', pointerMove);
        window.addEventListener('mouseup', pointerUp);
        track.addEventListener('touchstart', pointerDown, { passive: true });
        track.addEventListener('touchmove', pointerMove, { passive: true });
        track.addEventListener('touchend', pointerUp);

        // Resize handling
        let resizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                const newVisible = computeVisible();
                if (newVisible !== visible) {
                    visible = newVisible;
                    buildDots();
                    index = 0;
                }
                update();
            }, 150);
        });

        buildDots();
        update();
    }

    /* ============================================
       TIMELINE — animate line + items
    ============================================ */
    function initTimeline(hasGSAP) {
        const timeline = document.querySelector('.timeline');
        const line = document.getElementById('timelineLine');
        const items = document.querySelectorAll('.timeline-item');
        if (!timeline || !line || !items.length) return;

        if (hasGSAP && !reduceMotion) {
            gsap.to(line, {
                '--draw': '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: timeline,
                    start: 'top 70%',
                    end: 'bottom 80%',
                    scrub: true
                }
            });

            items.forEach(function (item, i) {
                gsap.fromTo(item,
                    { opacity: 0, y: 30 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        delay: i * 0.1,
                        ease: 'power3.out',
                        scrollTrigger: { trigger: item, start: 'top 85%' }
                    }
                );
            });
        } else if ('IntersectionObserver' in window) {
            const obs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            items.forEach(function (item) { obs.observe(item); });
            line.style.setProperty('--draw', '100%');
        } else {
            items.forEach(function (item) { item.classList.add('visible'); });
            line.style.setProperty('--draw', '100%');
        }
    }

    /* ============================================
       AUDIO TOGGLE (hero video)
    ============================================ */
    function initAudioToggle() {
        const btn = document.getElementById('audioToggle');
        const icon = document.getElementById('audioIcon');
        const video = document.getElementById('heroVideo');
        if (!btn || !icon || !video) return;

        btn.addEventListener('click', function () {
            video.muted = !video.muted;
            if (video.muted) {
                icon.classList.remove('ph-speaker-simple-high');
                icon.classList.add('ph-speaker-simple-x');
            } else {
                icon.classList.remove('ph-speaker-simple-x');
                icon.classList.add('ph-speaker-simple-high');
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(function () { /* autoplay-with-sound blocked */ });
                }
            }
        });
    }

    /* ============================================
       BACK TO TOP
    ============================================ */
    function initBackToTop() {
        const btn = document.getElementById('backToTop');
        if (!btn) return;

        function update() {
            if (window.scrollY > 500) btn.classList.add('visible');
            else btn.classList.remove('visible');
        }
        window.addEventListener('scroll', update, { passive: true });
        btn.addEventListener('click', function () {
            if (lenis) lenis.scrollTo(0);
            else window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        update();
    }

    /* ============================================
       SMOOTH ANCHOR SCROLL (Lenis-aware)
    ============================================ */
    function initAnchorScroll() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(function (link) {
            link.addEventListener('click', function (e) {
                const id = link.getAttribute('href');
                if (!id || id === '#' || id.length < 2) return;
                const target = document.querySelector(id);
                if (!target) return;
                e.preventDefault();
                const header = document.getElementById('siteHeader');
                const offset = header ? header.offsetHeight + 20 : 80;
                if (lenis) {
                    lenis.scrollTo(target, { offset: -offset });
                } else {
                    const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            });
        });
    }

    /* ============================================
       CUSTOM CURSOR (desktop only, fine pointer)
    ============================================ */
    function initCustomCursor() {
        const cursor = document.getElementById('customCursor');
        if (!cursor) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        let mouseX = 0, mouseY = 0;
        let curX = 0, curY = 0;

        document.addEventListener('mousemove', function (e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.classList.add('active');
        });

        document.addEventListener('mouseleave', function () {
            cursor.classList.remove('active');
        });

        function render() {
            curX += (mouseX - curX) * 0.18;
            curY += (mouseY - curY) * 0.18;
            cursor.style.transform = 'translate(' + curX + 'px, ' + curY + 'px) translate(-50%, -50%)';
            requestAnimationFrame(render);
        }
        render();

        const interactive = document.querySelectorAll('a, button, .faq-question, .pillar-card, .tech-card, .collection-card, .success-card, .video-wrap');
        interactive.forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursor.classList.add('grow'); });
            el.addEventListener('mouseleave', function () { cursor.classList.remove('grow'); });
        });
    }

    /* ============================================
       IMAGE SCALE-IN ON ENTER
    ============================================ */
    function initImageScaleIn(hasGSAP) {
        if (!hasGSAP || reduceMotion) return;
        const images = document.querySelectorAll('.collection-image img, .dealer-image, .innovation-image, .tech-card-image img, .success-image img, .locator-image');
        images.forEach(function (img) {
            gsap.fromTo(img,
                { scale: 1.08 },
                {
                    scale: 1, duration: 1.1, ease: 'power3.out',
                    scrollTrigger: { trigger: img, start: 'top 90%' }
                }
            );
        });
    }

    /* ============================================
       NEWSLETTER FORM
    ============================================ */
    function initNewsletter() {
        const form = document.getElementById('newsletterForm');
        if (!form) return;
        const input = form.querySelector('.footer-newsletter-input');
        const btn = form.querySelector('.footer-newsletter-btn');
        if (!input || !btn) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const value = input.value.trim();
            if (!value) { input.focus(); return; }

            const original = btn.textContent;
            btn.textContent = 'Subscribed ✓';
            btn.disabled = true;
            input.value = '';

            setTimeout(function () {
                btn.textContent = original;
                btn.disabled = false;
            }, 2400);
        });
    }

    /* ============================================
       BLOG FILTER CHIPS
    ============================================ */
    function initFilterChips() {
        const chips = document.querySelectorAll('.filter-chip');
        const grid = document.getElementById('articlesGrid');
        if (!chips.length || !grid) return;
        const cards = grid.querySelectorAll('.article-card');

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                chips.forEach(function (c) {
                    c.classList.remove('active');
                    c.setAttribute('aria-selected', 'false');
                });
                chip.classList.add('active');
                chip.setAttribute('aria-selected', 'true');

                const filter = chip.getAttribute('data-filter');
                cards.forEach(function (card) {
                    const category = card.getAttribute('data-category');
                    const match = filter === 'all' || category === filter;
                    card.style.display = match ? '' : 'none';
                });
            });
        });
    }

    /* ============================================
       READING PROGRESS BAR (article page)
    ============================================ */
    function initReadingProgress() {
        const bar = document.getElementById('readingProgressBar');
        const body = document.querySelector('.article-body');
        if (!bar || !body) return;

        function update() {
            const rect = body.getBoundingClientRect();
            const total = rect.height + rect.top - window.innerHeight;
            const scrolled = -rect.top;
            const progress = Math.max(0, Math.min(1, scrolled / total));
            bar.style.width = (progress * 100) + '%';
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    /* ============================================
       COPY LINK (article share)
    ============================================ */
    function initCopyLink() {
        const btn = document.getElementById('copyLinkBtn');
        if (!btn) return;

        btn.addEventListener('click', function () {
            const url = window.location.href;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () {
                    flashCopyState(btn);
                });
            } else {
                const tmp = document.createElement('input');
                tmp.value = url;
                document.body.appendChild(tmp);
                tmp.select();
                try { document.execCommand('copy'); flashCopyState(btn); } catch (e) {}
                document.body.removeChild(tmp);
            }
        });

        function flashCopyState(b) {
            const icon = b.querySelector('i');
            if (!icon) return;
            const original = icon.className;
            icon.className = 'ph-bold ph-check';
            b.style.backgroundColor = '#0E83E0';
            b.style.color = '#FFFFFF';
            b.style.borderColor = '#0E83E0';
            setTimeout(function () {
                icon.className = original;
                b.style.backgroundColor = '';
                b.style.color = '';
                b.style.borderColor = '';
            }, 1600);
        }
    }

    /* ============================================
       BLOG / ARTICLE NEWSLETTER FORMS (shared logic)
    ============================================ */
    function initInlineNewsletters() {
        const forms = document.querySelectorAll('#blogNewsletterForm, #articleNewsletterForm');
        forms.forEach(function (form) {
            const input = form.querySelector('input[type="email"]');
            const btn = form.querySelector('button');
            if (!input || !btn) return;

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                const value = input.value.trim();
                if (!value) { input.focus(); return; }
                const originalHTML = btn.innerHTML;
                btn.innerHTML = 'Subscribed <i class="ph-bold ph-check"></i>';
                btn.disabled = true;
                input.value = '';
                setTimeout(function () {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                }, 2400);
            });
        });
    }

    /* ============================================
       FOOTER AUDIO TOGGLE
    ============================================ */
    function initFooterAudio() {
        const btn = document.getElementById('footerAudioToggle');
        const video = document.getElementById('heroVideo');
        if (!btn || !video) return;

        btn.addEventListener('click', function () {
            video.muted = !video.muted;
            const icon = btn.querySelector('i');
            if (!icon) return;
            if (video.muted) {
                icon.classList.remove('ph-speaker-simple-high');
                icon.classList.add('ph-speaker-simple-x');
            } else {
                icon.classList.remove('ph-speaker-simple-x');
                icon.classList.add('ph-speaker-simple-high');
            }
        });
    }

    /* ============================================
       INIT EVERYTHING ON LOAD
    ============================================ */
    document.addEventListener('DOMContentLoaded', function () {
        const hasGSAP = initGSAP();
        initLenis();

        initStickyHeader();
        initMobileMenu();
        initHeroAnimation(hasGSAP);
        initScrollReveal(hasGSAP);
        initCounters(hasGSAP);
        initParallax(hasGSAP);
        initFAQ();
        initSuccessCarousel();
        initTimeline(hasGSAP);
        initAudioToggle();
        initFooterAudio();
        initNewsletter();
        initBackToTop();
        initAnchorScroll();
        initCustomCursor();
        initImageScaleIn(hasGSAP);
        initFilterChips();
        initReadingProgress();
        initCopyLink();
        initInlineNewsletters();

        // Refresh ScrollTrigger after images load (heights settle)
        if (hasGSAP) {
            window.addEventListener('load', function () {
                ScrollTrigger.refresh();
            });
        }
    });
})();
