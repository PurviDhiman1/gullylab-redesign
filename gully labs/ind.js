// ------------------ INTRO (PLAY ONCE PER TAB) + START SLIDER ------------------
const intro = document.getElementById("intro");
const introLogo = document.querySelector(".intro-logo");

const KEY = "gully_intro_played_session";
let introSkipped = false;

function killIntroInstant() {
  if (!intro) return;
  intro.style.display = "none";
  introSkipped = true;
}

// If already played in this session => skip intro immediately
if (sessionStorage.getItem(KEY) === "1") {
  killIntroInstant();
}

// ------------------ HERO SLIDER SETUP ------------------
const video1 = document.getElementById("video1");
const video2 = document.getElementById("video2");
const heroSection = document.querySelector(".hero");

const title = document.getElementById("flavorTitle");
const desc = document.getElementById("flavorDesc");
const progressBar = document.querySelector(".progress-bar");
const dots = document.querySelectorAll(".dot");

// Safety: if hero elements are missing, don't run slider
const canRunSlider = video1 && video2 && heroSection && title && desc && progressBar && dots.length;

let heroImage = null;
if (canRunSlider) {
  // Create image element (shark.png)
  heroImage = document.createElement("img");
  heroImage.src = "shark.png";
  heroImage.classList.add("hero-image-slide");
  heroSection.appendChild(heroImage);

  video1.muted = true;
  video2.muted = true;
  video1.playsInline = true;
  video2.playsInline = true;
}

// Slides (2 videos + 1 image)  ✅ RENAMED
const heroSlides = [
  { type: "video", src: "logo.mp4", title: "Gully Classic", desc: "Step into Style and Comfort" },
  { type: "video", src: "gullylab.mp4", title: "Gully Runner", desc: "Unleash Your Energy and Speed" },
  { type: "image", src: "shark.png", title: "Shark Edition", desc: "Dive Into Adventure" }
];

let currentIndex = 0;
let activeVideo = video1;
let inactiveVideo = video2;
let autoSlide;
let progressInterval;

function stopAllVideos() {
  if (!video1 || !video2) return;
  [video1, video2].forEach(v => {
    try { v.pause(); } catch {}
  });
}

function playWhenReady(v) {
  if (!v) return;
  const p = v.play();
  if (p && typeof p.catch === "function") p.catch(() => {});
}

function switchSlide(index) {
  if (!canRunSlider) return;

  title.classList.add("text-exit");
  desc.classList.add("text-exit");

  setTimeout(() => {
    const slide = heroSlides[index];

    // reset visuals
    video1.classList.remove("active");
    video2.classList.remove("active");
    if (heroImage) heroImage.style.opacity = 0;

    // stop both videos so only one plays
    stopAllVideos();

    if (slide.type === "video") {
      inactiveVideo.src = slide.src;
      inactiveVideo.load();

      // show new video immediately, then play when ready
      inactiveVideo.classList.add("active");
      inactiveVideo.addEventListener("loadeddata", () => playWhenReady(inactiveVideo), { once: true });
      playWhenReady(inactiveVideo);

      // swap refs
      [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
    } else {
      if (heroImage) {
        heroImage.src = slide.src;
        heroImage.style.opacity = 1;
      }
    }

    // text update
    title.textContent = slide.title;
    desc.textContent = slide.desc;

    title.classList.remove("text-exit");
    desc.classList.remove("text-exit");
    title.classList.add("text-enter");
    desc.classList.add("text-enter");

    setTimeout(() => {
      title.classList.remove("text-enter");
      desc.classList.remove("text-enter");
    }, 600);

    // dots
    dots.forEach(dot => dot.classList.remove("active"));
    if (index < dots.length) dots[index].classList.add("active");
  }, 400);
}

function startProgress(duration) {
  if (!progressBar) return;

  let width = 0;
  progressBar.style.width = "0%";
  clearInterval(progressInterval);

  const intervalTime = 50;
  const increment = 100 / (duration / intervalTime);

  progressInterval = setInterval(() => {
    width += increment;
    progressBar.style.width = width + "%";
    if (width >= 100) clearInterval(progressInterval);
  }, intervalTime);
}

function showSlide(index) {
  if (!canRunSlider) return;

  clearTimeout(autoSlide);

  const durations = [6000, 8000, 4000];
  const duration = durations[index] || 6000;

  switchSlide(index);
  startProgress(duration);

  autoSlide = setTimeout(() => {
    currentIndex = (currentIndex + 1) % heroSlides.length;
    showSlide(currentIndex);
  }, duration);
}

// Dot click
if (canRunSlider) {
  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      clearTimeout(autoSlide);
      currentIndex = parseInt(dot.dataset.index, 10);
      showSlide(currentIndex);
    });
  });
}

// ------------------ START FLOW ------------------
window.addEventListener("load", () => {
  if (!canRunSlider) return;

  // Preload first slide video early (logo.mp4) so no grey delay
  video1.src = heroSlides[0].src;
  video1.load();

  // If intro already skipped => start immediately
  if (introSkipped) {
    showSlide(currentIndex);
    return;
  }

  // First visit: play intro (3s)
  sessionStorage.setItem(KEY, "1");

  setTimeout(() => {
    introLogo?.classList.add("show");
  }, 100);

  // keep intro for 3s, then hide
  setTimeout(() => {
    if (intro) {
      intro.classList.add("hide");
      setTimeout(() => intro.remove(), 1100);
    }
    showSlide(currentIndex);
  }, 3000);
});

/* =========================
   PREMIUM SEARCH + PROFILE
========================= */
(function () {
  const openSearchBtn = document.getElementById("searchOpenBtn");
  const closeSearchBtn = document.getElementById("searchCloseBtn");
  const overlay = document.getElementById("searchModal");
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");

  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const profileName = document.getElementById("profileName");
  const profileSub = document.getElementById("profileSub");
  const profileLogin = document.getElementById("profileLogin");
  const profileOrders = document.getElementById("profileOrders");
  const profileWishlist = document.getElementById("profileWishlist");
  const profileLogout = document.getElementById("profileLogout");

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("gl_user") || "null");
    } catch {
      return null;
    }
  }

  function syncProfileUI() {
    const user = getUser();

    if (!profileName || !profileSub || !profileLogin || !profileLogout) return;

    if (user && user.name) {
      profileName.textContent = user.name;
      profileSub.textContent = user.email || "Signed in";
      profileLogin.textContent = "Account";
      profileLogin.setAttribute("href", "account.html");
      profileLogout.style.display = "block";
    } else {
      profileName.textContent = "Guest";
      profileSub.textContent = "Not signed in";
      profileLogin.textContent = "Login";
      profileLogin.setAttribute("href", "login.html");
      profileLogout.style.display = "none";
    }
  }

  function closeProfile() {
    if (!profileMenu) return;
    profileMenu.classList.remove("show");
    profileMenu.setAttribute("aria-hidden", "true");
  }

  function toggleProfile() {
    if (!profileMenu) return;
    profileMenu.classList.toggle("show");
    profileMenu.setAttribute(
      "aria-hidden",
      profileMenu.classList.contains("show") ? "false" : "true"
    );
    syncProfileUI();
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleProfile();
    });
  }

  document.addEventListener("click", (e) => {
    if (profileMenu && profileMenu.classList.contains("show")) {
      const inside = profileMenu.contains(e.target) || (profileBtn && profileBtn.contains(e.target));
      if (!inside) closeProfile();
    }
  });

  if (profileOrders) {
    profileOrders.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "track.html";
    });
  }

  if (profileWishlist) {
    profileWishlist.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "wishlist.html";
    });
  }

  if (profileLogout) {
    profileLogout.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("gl_user");
      syncProfileUI();
      closeProfile();
      window.location.href = "ind.html";
    });
  }

  function getProductsArray() {
    if (typeof window.products === "object" && window.products !== null) {
      if (Array.isArray(window.products)) return window.products;

      return Object.entries(window.products).map(([slug, p]) => ({
        slug,
        ...p
      }));
    }

    if (typeof window.PRODUCTS === "object" && window.PRODUCTS !== null) {
      if (Array.isArray(window.PRODUCTS)) return window.PRODUCTS;

      return Object.entries(window.PRODUCTS).map(([slug, p]) => ({
        slug,
        ...p
      }));
    }

    if (typeof window.PRODUCT_DETAILS === "object" && window.PRODUCT_DETAILS !== null) {
      return Object.entries(window.PRODUCT_DETAILS).map(([slug, p]) => ({
        slug,
        name: p.name || slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        category: p.category || "Sneakers",
        images: p.images || [],
        price: p.price || 0,
        ...p
      }));
    }

    return [];
  }

  function money(n) {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(n);
    } catch {
      return `₹${n}`;
    }
  }

  function renderResults(list, query = "") {
    if (!results) return;

    if (!query.trim()) {
      results.innerHTML = `<div style="padding:14px; color:rgba(255,255,255,.65); font-size:13px;">Start typing to search products.</div>`;
      return;
    }

    if (!list.length) {
      results.innerHTML = `<div style="padding:14px; color:rgba(255,255,255,.65); font-size:13px;">No results. Try a different keyword.</div>`;
      return;
    }

    results.innerHTML = list.slice(0, 8).map(p => {
      const img = (p.images && p.images.length) ? p.images[0] : "";
      const subtitle = p.category || "Sneakers";

      return `
        <div class="search-item" data-slug="${p.slug || ""}">
          <div class="search-thumb">${img ? `<img src="${img}" alt="">` : ""}</div>
          <div class="search-meta">
            <div class="search-name">${p.name || "Product"}</div>
            <div class="search-sub">${subtitle}</div>
          </div>
          <div class="search-price">${p.price ? money(p.price) : ""}</div>
        </div>
      `;
    }).join("");

    results.querySelectorAll(".search-item").forEach(item => {
      item.addEventListener("click", () => {
        const slug = item.getAttribute("data-slug");
        if (!slug) return;
        window.location.href = `product.html?product=${encodeURIComponent(slug)}`;
      });
    });
  }

  function filterProducts(q) {
    const all = getProductsArray();
    const query = (q || "").trim().toLowerCase();

    if (!query) return [];

    return all.filter(p => {
      const name = (p.name || "").toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const tagline = (p.tagline || "").toLowerCase();

      return (
        name.includes(query) ||
        slug.includes(query) ||
        category.includes(query) ||
        tagline.includes(query)
      );
    });
  }

  function openSearch() {
    if (!overlay) return;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
    if (input) input.value = "";
    renderResults([], "");
    setTimeout(() => input && input.focus(), 30);
  }

  function closeSearch() {
    if (!overlay) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    if (input) input.value = "";
    if (results) results.innerHTML = "";
  }

  if (openSearchBtn) openSearchBtn.addEventListener("click", openSearch);
  if (closeSearchBtn) closeSearchBtn.addEventListener("click", closeSearch);

  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeSearch();
    });
  }

  if (input) {
    input.addEventListener("input", () => {
      const query = input.value || "";
      renderResults(filterProducts(query), query);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSearch();
      if (e.key === "Enter") {
        const first = results?.querySelector(".search-item");
        if (first) first.click();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSearch();
      closeProfile();
    }
  });

  syncProfileUI();
})();

/* =========================
   MOBILE DRAWER (BURGER)
========================= */
(function () {
  const burger = document.getElementById("glBurger");
  const drawer = document.getElementById("glDrawer");

  if (!burger || !drawer) return;

  function openDrawer() {
    drawer.style.display = "block";
    drawer.setAttribute("aria-hidden", "false");
    burger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    drawer.style.display = "none";
    drawer.setAttribute("aria-hidden", "true");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  // start closed
  closeDrawer();

  burger.addEventListener("click", () => {
    const isOpen = drawer.getAttribute("aria-hidden") === "false";
    isOpen ? closeDrawer() : openDrawer();
  });

  drawer.addEventListener("click", (e) => {
    if (e.target.tagName === "A") closeDrawer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeDrawer();
  });
})();