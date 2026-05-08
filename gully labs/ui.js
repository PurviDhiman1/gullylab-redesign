// ui.js — global loader + navigation smooth

(function(){
  const LOADER_ID = "pageLoader";

  function ensureLoader(){
    if (document.getElementById(LOADER_ID)) return;

    const loader = document.createElement("div");
    loader.className = "page-loader";
    loader.id = LOADER_ID;
    loader.setAttribute("aria-hidden","true");

    loader.innerHTML = `
      <div class="pl-box">
        <div class="pl-row">
          <div class="pl-brand">
            <img src="new.png" alt="Logo">
            <span>Loading</span>
          </div>
          <div class="pl-dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
        </div>
        <p class="pl-text">Just a second…</p>
      </div>
    `;
    document.body.appendChild(loader);
  }

  function showLoader(){
    const el = document.getElementById(LOADER_ID);
    if (!el) return;
    el.classList.add("show");
    el.setAttribute("aria-hidden","false");
  }

  function hideLoader(){
    const el = document.getElementById(LOADER_ID);
    if (!el) return;
    el.classList.remove("show");
    el.setAttribute("aria-hidden","true");
  }

  function bindNav(){
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;

      const href = a.getAttribute("href");
      const target = a.getAttribute("target");

      if (!href || href.startsWith("#")) return;
      if (target && target !== "_self") return;
      if (/^https?:\/\//i.test(href)) return;
      if (!href.endsWith(".html") && !href.includes(".html?")) return;

      e.preventDefault();
      showLoader();

      setTimeout(() => {
        window.location.href = href;
      }, 120);
    });

    window.addEventListener("pageshow", () => {
      hideLoader();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    ensureLoader();
    bindNav();
  });

})();

(function () {
  // Dropdown (desktop)
  const dd = document.querySelector("[data-dd]");
  if (dd) {
    const btn = dd.querySelector(".gl-dd-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        const open = dd.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });

      document.addEventListener("click", (e) => {
        if (!dd.contains(e.target)) {
          dd.classList.remove("open");
          btn.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  // Mobile drawer
  const burger = document.getElementById("glBurger");
  const drawer = document.getElementById("glDrawer");
  if (burger && drawer) {
    burger.addEventListener("click", () => {
      const isOpen = drawer.style.display === "block";
      drawer.style.display = isOpen ? "none" : "block";
      drawer.setAttribute("aria-hidden", isOpen ? "true" : "false");
      burger.setAttribute("aria-expanded", isOpen ? "false" : "true");
    });

    drawer.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) {
        drawer.style.display = "none";
        drawer.setAttribute("aria-hidden", "true");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }
})();

(function () {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchOpenBtn = document.getElementById("searchOpenBtn");
  const searchModal = document.getElementById("searchModal");
  const searchCloseBtn = document.getElementById("searchCloseBtn");

  function getAllProductsForSearch() {
    const db = window.PRODUCTS || {};
    return Object.entries(db).map(([slug, product]) => ({
      slug,
      ...product
    }));
  }

  function money(v) {
    return `₹${Number(v || 0).toLocaleString("en-IN")}`;
  }

  function openSearch() {
    if (!searchModal) return;
    searchModal.classList.add("show");
    searchModal.setAttribute("aria-hidden", "false");
    if (searchInput) {
      setTimeout(() => searchInput.focus(), 50);
    }
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.classList.remove("show");
    searchModal.setAttribute("aria-hidden", "true");
  }

  function renderSearchResults(query) {
    if (!searchResults) return;

    const q = (query || "").trim().toLowerCase();
    const allProducts = getAllProductsForSearch();

    if (!q) {
      searchResults.innerHTML = `<p class="search-empty">Start typing to search products.</p>`;
      return;
    }

    const matches = allProducts.filter((product) => {
      return (
        (product.name || "").toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q) ||
        (product.collection || "").toLowerCase().includes(q)
      );
    });

    if (!matches.length) {
      searchResults.innerHTML = `<p class="search-empty">No results. Try a different keyword.</p>`;
      return;
    }

    searchResults.innerHTML = matches.map((product) => `
      <a class="search-result-item" href="product.html?product=${encodeURIComponent(product.slug)}">
        <img src="${product.images?.[0] || ""}" alt="${product.name || "Product"}">
        <div class="search-result-info">
          <div class="search-result-name">${product.name || "Product"}</div>
          <div class="search-result-price">${money(product.price)}</div>
        </div>
      </a>
    `).join("");
  }

  if (searchOpenBtn) {
    searchOpenBtn.addEventListener("click", openSearch);
  }

  if (searchCloseBtn) {
    searchCloseBtn.addEventListener("click", closeSearch);
  }

  if (searchModal) {
    searchModal.addEventListener("click", (e) => {
      if (e.target === searchModal) {
        closeSearch();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSearch();
    }
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderSearchResults(e.target.value);
    });

    renderSearchResults("");
  }
})();