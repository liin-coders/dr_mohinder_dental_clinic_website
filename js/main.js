(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Sticky header glass state
  const header = $(".site-header");
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 20);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Responsive navigation
  const toggle = $(".menu-toggle");
  const nav = $(".primary-nav");
  function closeMenu() {
    toggle?.setAttribute("aria-expanded", "false");
    toggle?.setAttribute("aria-label", "Open navigation menu");
    nav?.classList.remove("open");
    document.body.classList.remove("menu-open");
  }
  toggle?.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
    nav?.classList.toggle("open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });
  $$("#primary-nav a").forEach(link => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMenu(); });

  // Hero carousel: autoplay, buttons, dots, pointer drag and touch swipe
  const hero = $(".hero");
  const slides = $$(".hero-slide");
  const heroDots = $$(".hero-pagination button");
  let heroIndex = 0, heroTimer, heroStartX = 0, heroMoved = false;
  function showHero(index) {
    if (!slides.length) return;
    heroIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === heroIndex));
    heroDots.forEach((dot, i) => {
      dot.classList.toggle("active", i === heroIndex);
      dot.setAttribute("aria-current", i === heroIndex ? "true" : "false");
    });
  }
  function startHeroTimer() { clearInterval(heroTimer); heroTimer = setInterval(() => showHero(heroIndex + 1), 6000); }
  $(".hero-prev")?.addEventListener("click", () => { showHero(heroIndex - 1); startHeroTimer(); });
  $(".hero-next")?.addEventListener("click", () => { showHero(heroIndex + 1); startHeroTimer(); });
  heroDots.forEach((dot, i) => dot.addEventListener("click", () => { showHero(i); startHeroTimer(); }));
  hero?.addEventListener("pointerdown", e => { heroStartX = e.clientX; heroMoved = false; });
  hero?.addEventListener("pointerup", e => {
    const dx = e.clientX - heroStartX;
    if (Math.abs(dx) > 55) { showHero(heroIndex + (dx < 0 ? 1 : -1)); startHeroTimer(); heroMoved = true; }
  });
  hero?.addEventListener("mouseenter", () => clearInterval(heroTimer));
  hero?.addEventListener("mouseleave", startHeroTimer);
  hero?.addEventListener("touchstart", e => { heroStartX = e.changedTouches[0].clientX; }, { passive: true });
  hero?.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - heroStartX; if (Math.abs(dx) > 50) { showHero(heroIndex + (dx < 0 ? 1 : -1)); startHeroTimer(); } }, { passive: true });
  startHeroTimer();

  // Lightbox galleries, with each gallery group navigated independently
  const lightbox = $("#lightbox");
  const lightboxImg = $("figure img", lightbox);
  const lightboxCaption = $("figcaption", lightbox);
  const galleryButtons = $$(".gallery-item[data-gallery]");
  let currentGroup = [], currentLightboxIndex = 0, lastFocused = null;
  function openLightbox(button) {
    const groupName = button.dataset.gallery;
    currentGroup = galleryButtons.filter(item => item.dataset.gallery === groupName);
    currentLightboxIndex = currentGroup.indexOf(button);
    lastFocused = button;
    renderLightbox();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    $(".lightbox-close").focus();
  }
  function renderLightbox() {
    const button = currentGroup[currentLightboxIndex];
    if (!button) return;
    const img = $("img", button);
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || "Clinic gallery image";
    lightboxCaption.textContent = `${currentLightboxIndex + 1} of ${currentGroup.length} · ${img.alt || "Gallery image"}`;
  }
  function moveLightbox(delta) { if (!currentGroup.length) return; currentLightboxIndex = (currentLightboxIndex + delta + currentGroup.length) % currentGroup.length; renderLightbox(); }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    lightboxImg.src = "";
    lastFocused?.focus();
  }
  galleryButtons.forEach(button => button.addEventListener("click", () => openLightbox(button)));
  $(".lightbox-close")?.addEventListener("click", closeLightbox);
  $(".lightbox-prev")?.addEventListener("click", () => moveLightbox(-1));
  $(".lightbox-next")?.addEventListener("click", () => moveLightbox(1));
  lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", e => {
    if (!lightbox?.classList.contains("open")) return;
    if (e.key === "ArrowLeft") moveLightbox(-1);
    if (e.key === "ArrowRight") moveLightbox(1);
    if (e.key === "Escape") closeLightbox();
  });
  let lbTouchX = 0;
  lightbox?.addEventListener("touchstart", e => { lbTouchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox?.addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - lbTouchX; if (Math.abs(dx) > 45) moveLightbox(dx < 0 ? 1 : -1); }, { passive: true });

  // Testimonials carousel: responsive cards, dot pagination, drag/swipe
  const track = $(".testimonial-track");
  const cards = $$(".testimonial-card");
  const dotsWrap = $(".testimonial-dots");
  let testimonialIndex = 0, testimonialTimer, dragStartX = 0, dragDelta = 0, dragging = false;
  const cardsPerView = () => window.innerWidth <= 650 ? 1 : window.innerWidth <= 900 ? 2 : 3;
  const maxTestimonialIndex = () => Math.max(0, cards.length - cardsPerView());
  function buildTestimonialDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    const count = maxTestimonialIndex() + 1;
    for (let i = 0; i < count; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Show testimonial set ${i + 1}`);
      dot.addEventListener("click", () => { testimonialIndex = i; updateTestimonials(); restartTestimonials(); });
      dotsWrap.appendChild(dot);
    }
  }
  function updateTestimonials() {
    if (!track || !cards.length) return;
    testimonialIndex = Math.min(testimonialIndex, maxTestimonialIndex());
    const first = cards[0];
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const cardWidth = first.getBoundingClientRect().width;
    track.style.transform = `translateX(-${testimonialIndex * (cardWidth + gap)}px)`;
    $$(".testimonial-dots button").forEach((dot, i) => dot.classList.toggle("active", i === testimonialIndex));
  }
  function restartTestimonials() { clearInterval(testimonialTimer); testimonialTimer = setInterval(() => { testimonialIndex = testimonialIndex >= maxTestimonialIndex() ? 0 : testimonialIndex + 1; updateTestimonials(); }, 6500); }
  $(".testimonial-prev")?.addEventListener("click", () => { testimonialIndex = testimonialIndex <= 0 ? maxTestimonialIndex() : testimonialIndex - 1; updateTestimonials(); restartTestimonials(); });
  $(".testimonial-next")?.addEventListener("click", () => { testimonialIndex = testimonialIndex >= maxTestimonialIndex() ? 0 : testimonialIndex + 1; updateTestimonials(); restartTestimonials(); });
  track?.addEventListener("pointerdown", e => { dragging = true; dragStartX = e.clientX; dragDelta = 0; track.classList.add("dragging"); track.setPointerCapture?.(e.pointerId); clearInterval(testimonialTimer); });
  track?.addEventListener("pointermove", e => { if (dragging) dragDelta = e.clientX - dragStartX; });
  track?.addEventListener("pointerup", () => { if (!dragging) return; dragging = false; track.classList.remove("dragging"); if (Math.abs(dragDelta) > 45) testimonialIndex = Math.max(0, Math.min(maxTestimonialIndex(), testimonialIndex + (dragDelta < 0 ? 1 : -1))); updateTestimonials(); restartTestimonials(); });
  track?.addEventListener("pointercancel", () => { dragging = false; track?.classList.remove("dragging"); restartTestimonials(); });
  track?.addEventListener("mouseenter", () => clearInterval(testimonialTimer));
  track?.addEventListener("mouseleave", restartTestimonials);
  buildTestimonialDots(); updateTestimonials(); restartTestimonials();
  window.addEventListener("resize", () => { buildTestimonialDots(); updateTestimonials(); });

  // Contact form validation; valid details are prepared in WhatsApp for the user to send.
  const form = $("#contact-form");
  const status = $("#form-status");
  const whatsappNumber = "917508278995";
  const validators = {
    name: value => value.trim().length >= 2 ? "" : "Please enter your full name.",
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Please enter a valid email address.",
    phone: value => value.replace(/\D/g, "").length >= 10 ? "" : "Please enter a valid contact number.",
    message: value => value.trim().length >= 8 ? "" : "Please enter a message of at least 8 characters."
  };
  function validateField(input) {
    const wrapper = input.closest(".field");
    const error = $(".field-error", wrapper);
    const message = validators[input.name] ? validators[input.name](input.value) : "";
    wrapper.classList.toggle("invalid", Boolean(message));
    error.textContent = message;
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  }
  form?.querySelectorAll("input, textarea").forEach(input => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("invalid")) validateField(input);
      if (status) { status.textContent = ""; status.className = "form-status"; }
    });
  });
  form?.addEventListener("submit", e => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll("input, textarea")];
    const valid = inputs.map(validateField).every(Boolean);
    if (!valid) {
      status.textContent = "Please check the highlighted fields and try again.";
      status.className = "form-status error";
      form.querySelector(".field.invalid input, .field.invalid textarea")?.focus();
      return;
    }
    const data = new FormData(form);
    const message = `Hello Dr. Mohinder Dental Clinic,%0A%0AI would like to make an enquiry.%0A%0AName: ${encodeURIComponent(data.get("name"))}%0AEmail: ${encodeURIComponent(data.get("email"))}%0AContact: ${encodeURIComponent(data.get("phone"))}%0AMessage: ${encodeURIComponent(data.get("message"))}`;
    status.textContent = "Opening WhatsApp with your enquiry. Please review the message and press Send in WhatsApp.";
    status.className = "form-status success";
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank", "noopener,noreferrer");
  });
  form?.addEventListener("reset", () => {
    setTimeout(() => {
      $$(".field", form).forEach(field => { field.classList.remove("invalid"); $(".field-error", field).textContent = ""; $("input, textarea", field)?.removeAttribute("aria-invalid"); });
      status.textContent = ""; status.className = "form-status";
    }, 0);
  });
})();
