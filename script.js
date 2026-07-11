/* ===== NAV SCROLL ===== */
const nav = document.getElementById('nav');
const floatCta = document.getElementById('floatCta');
window.addEventListener('scroll', () => {
  const scrolled = window.scrollY > 60;
  nav.classList.toggle('scrolled', scrolled);
  floatCta.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

/* ===== MOBILE MENU ===== */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ===== HERO SLIDESHOW ===== */
const heroImgs = document.querySelectorAll('.hero__img');
const heroDots = document.querySelectorAll('.hero__indicators .dot');
let heroIdx = 0;
let heroTimer;

if (heroImgs.length && heroDots.length) {
  function goSlide(idx) {
    heroImgs[heroIdx].classList.remove('active');
    heroDots[heroIdx].classList.remove('active');
    heroIdx = (idx + heroImgs.length) % heroImgs.length;
    heroImgs[heroIdx].classList.add('active');
    heroDots[heroIdx].classList.add('active');
  }

  function startHero() {
    heroTimer = setInterval(() => goSlide(heroIdx + 1), 5000);
  }

  heroDots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(heroTimer);
      goSlide(i);
      startHero();
    });
  });
  startHero();
}

/* ===== COUNTER ANIMATION ===== */
function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
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
let statsDone = false;
const statsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !statsDone) {
    statsDone = true;
    document.querySelectorAll('.stat-num').forEach(animateCount);
  }
}, { threshold: 0.5 });
if (statsSection) statsObserver.observe(statsSection);

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
  '.service-card, .team-card, .pillar, .gallery__item, .process-step, .stat-item, .about__text, .about__images, .contact__info, .contact__form-wrap'
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
  function goStory(idx) {
    storyCards[storyIdx].classList.remove('active');
    storyDots[storyIdx].classList.remove('active');
    storyIdx = (idx + storyCards.length) % storyCards.length;
    storyCards[storyIdx].classList.add('active');
    storyDots[storyIdx].classList.add('active');
  }

  document.getElementById('storyPrev').addEventListener('click', () => goStory(storyIdx - 1));
  document.getElementById('storyNext').addEventListener('click', () => goStory(storyIdx + 1));
  storyDots.forEach((dot, i) => dot.addEventListener('click', () => goStory(i)));
  setInterval(() => goStory(storyIdx + 1), 6000);
}

/* ===== CONTACT FORM ===== */
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    document.getElementById('formSuccess').classList.add('show');
    btn.style.display = 'none';
    this.querySelectorAll('input, select, textarea').forEach(el => el.value = '');
  }, 1200);
});

/* ===== SMOOTH ANCHOR SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    }
  });
});
