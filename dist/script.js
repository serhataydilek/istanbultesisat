// Replace this public Formspree endpoint before enabling real review submissions.
const REVIEW_FORM_ENDPOINT = 'FORM_ENDPOINT_HERE';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const header = document.querySelector('.site-header');

function closeMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Menüyü aç');
}
menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') === 'true';
  if (opened) closeMenu();
  else {
    mobileNav.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Menüyü kapat');
  }
});
mobileNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenu(); });
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 35);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

const hero = document.querySelector('#hero-carousel');
const heroSlides = [...hero.querySelectorAll('.hero-slide')];
const heroIndex = document.querySelector('#hero-slide-index');
const heroLabel = document.querySelector('#hero-slide-label');
const heroProgress = document.querySelector('#hero-progress-fill');
const heroDuration = 5000;
let activeSlide = 0;
let heroTimer;
let startedAt = 0;
let remaining = heroDuration;
let pointerOverHero = false;
let focusInHero = false;

function heroShouldPause() {
  return reduceMotion.matches || document.hidden || pointerOverHero || focusInHero;
}
function resetHeroProgress() {
  heroProgress.style.animation = 'none';
  void heroProgress.offsetWidth;
  heroProgress.style.animation = '';
}
function showHeroSlide(index) {
  heroSlides[activeSlide].classList.remove('is-active');
  heroSlides[activeSlide].setAttribute('aria-hidden', 'true');
  activeSlide = (index + heroSlides.length) % heroSlides.length;
  heroSlides[activeSlide].classList.add('is-active');
  heroSlides[activeSlide].setAttribute('aria-hidden', 'false');
  heroIndex.textContent = `${String(activeSlide + 1).padStart(2, '0')} / ${String(heroSlides.length).padStart(2, '0')}`;
  heroLabel.textContent = heroSlides[activeSlide].dataset.label;
  remaining = heroDuration;
  resetHeroProgress();
  clearTimeout(heroTimer);
  if (!heroShouldPause()) startHeroTimer();
}
function startHeroTimer() {
  clearTimeout(heroTimer);
  if (heroShouldPause()) return;
  hero.classList.remove('is-paused');
  startedAt = performance.now();
  heroTimer = window.setTimeout(() => showHeroSlide(activeSlide + 1), remaining);
}
function pauseHeroTimer() {
  if (heroTimer) {
    clearTimeout(heroTimer);
    heroTimer = undefined;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
  }
  hero.classList.add('is-paused');
}
function syncHeroTimer() {
  if (heroShouldPause()) pauseHeroTimer();
  else startHeroTimer();
}
document.querySelector('#hero-prev').addEventListener('click', () => showHeroSlide(activeSlide - 1));
document.querySelector('#hero-next').addEventListener('click', () => showHeroSlide(activeSlide + 1));
hero.addEventListener('mouseenter', () => { pointerOverHero = true; syncHeroTimer(); });
hero.addEventListener('mouseleave', () => { pointerOverHero = false; syncHeroTimer(); });
hero.addEventListener('focusin', () => { focusInHero = true; syncHeroTimer(); });
hero.addEventListener('focusout', () => {
  focusInHero = hero.contains(document.activeElement);
  syncHeroTimer();
});
document.addEventListener('visibilitychange', syncHeroTimer);
reduceMotion.addEventListener('change', syncHeroTimer);
let heroTouchX = null;
hero.addEventListener('touchstart', event => { heroTouchX = event.changedTouches[0]?.clientX ?? null; }, { passive: true });
hero.addEventListener('touchend', event => {
  if (heroTouchX === null) return;
  const distance = (event.changedTouches[0]?.clientX ?? heroTouchX) - heroTouchX;
  if (Math.abs(distance) > 45) showHeroSlide(activeSlide + (distance < 0 ? 1 : -1));
  heroTouchX = null;
}, { passive: true });
if (reduceMotion.matches) pauseHeroTimer();
else startHeroTimer();

function setupScroller(trackId, prevId, nextId, meterId) {
  const track = document.querySelector(trackId);
  const prev = document.querySelector(prevId);
  const next = document.querySelector(nextId);
  const meter = document.querySelector(meterId);
  const first = track.firstElementChild;
  const step = () => first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
  const update = () => {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    const fraction = max ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0;
    const thumb = Math.min(100, track.clientWidth / track.scrollWidth * 100);
    meter.style.width = `${thumb}%`;
    meter.style.left = `${fraction * (100 - thumb)}%`;
    prev.disabled = track.scrollLeft <= 3;
    next.disabled = track.scrollLeft >= max - 3;
  };
  const scroll = direction => track.scrollBy({ left: direction * step(), behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  prev.addEventListener('click', () => scroll(-1));
  next.addEventListener('click', () => scroll(1));
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  let drag = null;
  let suppressClick = false;
  track.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, left: track.scrollLeft, moved: false };
    track.setPointerCapture(event.pointerId);
  });
  track.addEventListener('pointermove', event => {
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (Math.abs(delta) > 5) { drag.moved = true; track.classList.add('is-dragging'); }
    if (drag.moved) track.scrollLeft = drag.left - delta;
  });
  const endDrag = () => {
    if (!drag) return;
    suppressClick = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (suppressClick) window.setTimeout(() => { suppressClick = false; }, 80);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);
  update();
}
setupScroller('#services-carousel', '#services-prev', '#services-next', '#services-progress');
if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const targets = document.querySelectorAll('.section-heading, .about-photo, .about-copy, .steps > div, .service, .work-empty-state, .reviews-summary, .review-empty-state, .trust-strip-inner > div, .contact-grid > div');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08, rootMargin: '0px 0px 20px 0px' });
  targets.forEach(element => { element.classList.add('reveal'); observer.observe(element); });
}

const dialog = document.querySelector('#review-dialog');
const form = document.querySelector('#review-form');
const reviewTrigger = document.querySelector('#open-review');
const closeReview = document.querySelector('#close-review');
const newReview = document.querySelector('#new-review');
const reviewSuccess = document.querySelector('#review-success');
const reviewName = document.querySelector('#review-name');
const reviewText = document.querySelector('#review-text');
const starButtons = [...document.querySelectorAll('.star-button')];
const ratingLabel = document.querySelector('#rating-label');
const ratingField = document.querySelector('.star-field');
const previewName = document.querySelector('#preview-name');
const previewRating = document.querySelector('#preview-rating');
const previewText = document.querySelector('#preview-text');
const reviewSubmit = document.querySelector('#review-submit');
const submitStatus = document.querySelector('#review-submit-status');
const fieldErrors = {
  name: document.querySelector('#review-name-error'),
  rating: document.querySelector('#rating-error'),
  review: document.querySelector('#review-text-error')
};
const ratingLabels = {
  1: 'Çok kötü',
  2: 'Kötü',
  3: 'Ortalama',
  4: 'İyi',
  5: 'Çok iyi'
};
let selectedRating = 0;
let isSubmitting = false;

function setError(field, text) {
  const error = fieldErrors[field];
  error.textContent = text;
  error.hidden = !text;
  if (field === 'name') reviewName.setAttribute('aria-invalid', String(Boolean(text)));
  if (field === 'review') reviewText.setAttribute('aria-invalid', String(Boolean(text)));
  if (field === 'rating') ratingField.classList.toggle('is-invalid', Boolean(text));
}

function setSubmissionStatus(message, type = '') {
  submitStatus.textContent = message;
  submitStatus.hidden = !message;
  submitStatus.classList.toggle('is-notice', type === 'notice');
}

function endpointIsConfigured() {
  return REVIEW_FORM_ENDPOINT !== 'FORM_ENDPOINT_HERE' && /^https:\/\//.test(REVIEW_FORM_ENDPOINT);
}

function setSubmitting(submitting) {
  isSubmitting = submitting;
  reviewSubmit.disabled = submitting;
  reviewSubmit.textContent = submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder';
  form.setAttribute('aria-busy', String(submitting));
}

function paintStars(previewRating = 0) {
  starButtons.forEach(button => {
    const value = Number(button.dataset.rating);
    button.classList.toggle('is-selected', value <= selectedRating);
    button.classList.toggle('is-hovered', previewRating > 0 && value <= previewRating);
    button.setAttribute('aria-pressed', String(value === selectedRating));
  });
}

function selectRating(rating) {
  selectedRating = rating;
  paintStars();
  ratingLabel.textContent = `${rating}/5 — ${ratingLabels[rating]}`;
  setError('rating', '');
}

function resetReviewForm() {
  form.reset();
  selectedRating = 0;
  paintStars();
  ratingLabel.textContent = 'Puanınızı seçin';
  Object.keys(fieldErrors).forEach(field => setError(field, ''));
  setSubmissionStatus('');
  setSubmitting(false);
  reviewSuccess.hidden = true;
  form.hidden = false;
}

reviewTrigger.addEventListener('click', () => {
  dialog.showModal();
  document.documentElement.classList.add('dialog-open');
  reviewName.focus();
});
closeReview.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.documentElement.classList.remove('dialog-open');
  if (document.contains(reviewTrigger)) reviewTrigger.focus();
});

starButtons.forEach((button, index) => {
  const rating = Number(button.dataset.rating);
  button.addEventListener('click', () => selectRating(rating));
  button.addEventListener('mouseenter', () => paintStars(rating));
  button.addEventListener('mouseleave', () => paintStars());
  button.addEventListener('focus', () => paintStars(rating));
  button.addEventListener('blur', () => paintStars());
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowLeft') nextIndex = Math.max(0, index - 1);
    if (event.key === 'ArrowRight') nextIndex = Math.min(starButtons.length - 1, index + 1);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = starButtons.length - 1;
    starButtons[nextIndex].focus();
  });
});

reviewName.addEventListener('input', () => setError('name', ''));
reviewText.addEventListener('input', () => setError('review', ''));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (isSubmitting) return;
  const name = reviewName.value.trim();
  const review = reviewText.value.trim();
  const errors = {
    name: name ? '' : 'Lütfen adınızı girin.',
    rating: selectedRating ? '' : 'Lütfen bir puan seçin.',
    review: review.length >= 3 ? '' : 'Lütfen değerlendirmenizi yazın.'
  };
  Object.entries(errors).forEach(([field, text]) => setError(field, text));
  const firstInvalid = errors.name ? reviewName : errors.rating ? starButtons[0] : errors.review ? reviewText : null;
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }
  if (!endpointIsConfigured()) {
    setSubmissionStatus('Değerlendirme sistemi henüz aktif değil.', 'notice');
    return;
  }
  setSubmissionStatus('Gönderiliyor...');
  setSubmitting(true);
  const payload = {
    name,
    rating: selectedRating,
    review,
    page_url: window.location.href,
    submitted_at: new Date().toISOString()
  };
  try {
    const response = await fetch(REVIEW_FORM_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Review submission failed with ${response.status}`);
  } catch {
    setSubmissionStatus('Değerlendirmeniz gönderilemedi. Lütfen tekrar deneyin.');
    setSubmitting(false);
    return;
  }
  previewName.textContent = name;
  previewRating.textContent = `${selectedRating}/5 — ${ratingLabels[selectedRating]}`;
  previewText.textContent = review;
  form.hidden = true;
  reviewSuccess.hidden = false;
  setSubmissionStatus('');
  setSubmitting(false);
  reviewSuccess.querySelector('h3').focus();
});
newReview.addEventListener('click', () => {
  resetReviewForm();
  reviewName.focus();
});
