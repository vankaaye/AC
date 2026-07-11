/* ===== NAV SHADOW ===== */
const nav = document.getElementById('nav');
const floatCta = document.getElementById('floatCta');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
  if (floatCta) floatCta.classList.toggle('visible', window.scrollY > 500);
}, { passive: true });

/* ===== MOBILE MENU ===== */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    nav.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      nav.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ===== STATS COUNTER ===== */
function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600;
  const step = 16;
  const increment = target / (duration / step);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = Math.round(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, step);
}

const statsSection = document.querySelector('.stats');
if (statsSection) {
  let statsDone = false;
  const statsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !statsDone) {
      statsDone = true;
      document.querySelectorAll('.stat-num').forEach(animateCount);
    }
  }, { threshold: 0.4 });
  statsObserver.observe(statsSection);
}

/* ===== REVEAL ON SCROLL ===== */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.service-card, .team-card, .perk, .tile, .step, .stat-card, ' +
  '.about__text, .about__photos, .faq-item, .contact__info, .contact__form'
).forEach((el, i) => {
  el.classList.add('reveal');
  if (i % 4 === 1) el.classList.add('reveal-delay-1');
  if (i % 4 === 2) el.classList.add('reveal-delay-2');
  if (i % 4 === 3) el.classList.add('reveal-delay-3');
  revealObserver.observe(el);
});

/* ===== TESTIMONIAL SLIDER ===== */
const storyCards = document.querySelectorAll('.story-card');
const storyDots = document.querySelectorAll('#storyDots .dot');
let storyIdx = 0;

if (storyCards.length && storyDots.length) {
  const goStory = idx => {
    storyCards[storyIdx].classList.remove('active');
    storyDots[storyIdx].classList.remove('active');
    storyIdx = (idx + storyCards.length) % storyCards.length;
    storyCards[storyIdx].classList.add('active');
    storyDots[storyIdx].classList.add('active');
  };
  const prev = document.getElementById('storyPrev');
  const next = document.getElementById('storyNext');
  if (prev) prev.addEventListener('click', () => goStory(storyIdx - 1));
  if (next) next.addEventListener('click', () => goStory(storyIdx + 1));
  storyDots.forEach((dot, i) => dot.addEventListener('click', () => goStory(i)));
  setInterval(() => goStory(storyIdx + 1), 8000);
}

/* ===== FAQ — one open at a time ===== */
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      faqItems.forEach(other => {
        if (other !== item) other.open = false;
      });
    }
  });
});

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    setTimeout(() => {
      document.getElementById('formSuccess').classList.add('show');
      btn.style.display = 'none';
      this.querySelectorAll('input, select, textarea').forEach(el => (el.value = ''));
    }, 1000);
  });
}

/* ===== SMOOTH ANCHOR SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' });
    }
  });
});
