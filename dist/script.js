const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!opened));
  menuButton.setAttribute('aria-label', opened ? 'Menüyü aç' : 'Menüyü kapat');
  mobileNav.hidden = opened;
});
mobileNav.addEventListener('click', event => {
  if (event.target.closest('a')) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menüyü aç');
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 820 && !mobileNav.hidden) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menüyü aç');
  }
});
const dialog = document.querySelector('#review-dialog');
const form = document.querySelector('#review-form');
const message = document.querySelector('#form-message');
document.querySelector('#open-review').addEventListener('click', () => dialog.showModal());
document.querySelector('#close-review').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
form.addEventListener('submit', event => {
  event.preventDefault();
  message.hidden = false;
  form.reset();
  message.scrollIntoView({block:'nearest',behavior:'smooth'});
});
