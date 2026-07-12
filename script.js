/* ===== TEXT SIZE TOGGLE (persists across visits) ===== */
const SIZES = ['normal', 'large', 'xl'];
const SIZE_LABELS = { normal: 'Normal', large: 'Large', xl: 'Extra Large' };
const textSizeBtn = document.getElementById('textSizeBtn');
const textSizeState = document.getElementById('textSizeState');

function applyTextSize(size) {
  if (size === 'normal') {
    document.documentElement.removeAttribute('data-textsize');
  } else {
    document.documentElement.setAttribute('data-textsize', size);
  }
  if (textSizeState) textSizeState.textContent = SIZE_LABELS[size];
  try { localStorage.setItem('astro-textsize', size); } catch (e) { /* private mode */ }
}

let savedSize = 'normal';
try { savedSize = localStorage.getItem('astro-textsize') || 'normal'; } catch (e) { /* private mode */ }
if (!SIZES.includes(savedSize)) savedSize = 'normal';
applyTextSize(savedSize);

if (textSizeBtn) {
  textSizeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-textsize') || 'normal';
    const next = SIZES[(SIZES.indexOf(current) + 1) % SIZES.length];
    applyTextSize(next);
  });
}

/* ===== MOBILE MENU ===== */
const header = document.getElementById('header');
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      header.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

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
      this.querySelectorAll('input, select').forEach(el => (el.value = ''));
    }, 900);
  });
}

/* ===== SMOOTH ANCHOR SCROLL WITH HEADER OFFSET ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      window.scrollTo({ top: target.offsetTop - headerHeight - 12, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });
});
