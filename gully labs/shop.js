(function () {
  const PAGE_SIZE = 8;

  let allProducts = [];
  let filteredProducts = [];
  let cursor = 0;

  const state = {
    queryCollection: "",
    queryFilter: "",
    sort: "featured",
    selectedCategories: new Set(),
    selectedCollections: new Set(),
    selectedGenders: new Set(),
    minPrice: "",
    maxPrice: ""
  };

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

  function normalize(value) {
    return (value || "").toString().trim().toLowerCase();
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function getProductsObject() {
    if (window.PRODUCTS && typeof window.PRODUCTS === "object") {
      return window.PRODUCTS;
    }

    if (typeof products !== "undefined" && products && typeof products === "object") {
      return products;
    }

    console.warn("[shop.js] No products object found. Make sure products.js is loaded before shop.js");
    return {};
  }

  function getProductsArray() {
    const db = getProductsObject();

    return Object.entries(db).map(([slug, product]) => ({
      slug,
      ...product
    }));
  }

  function getCollectionLabel() {
    if (!state.queryCollection) return "All Products";
    return state.queryCollection.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function matchesQueryCollection(product) {
    if (!state.queryCollection) return true;

    const collection = normalize(product.collection);
    const category = normalize(product.category);

    return collection === state.queryCollection || category === state.queryCollection;
  }

  function matchesQueryFilter(product) {
    if (!state.queryFilter) return true;

    const filterValue = normalize(product.filter);
    const tag = normalize(product.tag);
    const name = normalize(product.name);

    return (
      filterValue === state.queryFilter ||
      tag === state.queryFilter ||
      name.includes(state.queryFilter)
    );
  }

  function matchesSidebarFilters(product) {
    const category = normalize(product.category);
    const collection = normalize(product.collection);
    const gender = normalize(product.gender || product.tag || "men");
    const price = Number(product.price || 0);

    if (state.selectedCategories.size && !state.selectedCategories.has(category)) {
      return false;
    }

    if (state.selectedCollections.size && !state.selectedCollections.has(collection)) {
      return false;
    }

    if (state.selectedGenders.size && !state.selectedGenders.has(gender)) {
      return false;
    }

    if (state.minPrice !== "" && price < Number(state.minPrice)) {
      return false;
    }

    if (state.maxPrice !== "" && price > Number(state.maxPrice)) {
      return false;
    }

    return true;
  }

  function sortList(list, mode) {
    const sorted = [...list];
    const sortMode = normalize(mode);

    if (sortMode === "price-asc") {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortMode === "price-desc") {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortMode === "name-asc") {
      sorted.sort((a, b) => normalize(a.name).localeCompare(normalize(b.name)));
    } else if (sortMode === "name-desc") {
      sorted.sort((a, b) => normalize(b.name).localeCompare(normalize(a.name)));
    }

    return sorted;
  }

  function renderCards(list) {
    return list.map((product) => {
      const image = Array.isArray(product.images) && product.images.length
        ? product.images[0]
        : "";

      const gender = product.gender || product.tag || "MEN";

      return `
        <a class="product-card" href="product.html?product=${encodeURIComponent(product.slug)}">
          <div class="product-media">
            ${image ? `<img src="${image}" alt="${product.name || "Product"}">` : ""}
          </div>
          <div class="product-info">
            <div class="product-gender">${gender}</div>
            <div class="product-name">${product.name || "Product"}</div>
            <div class="product-price">${product.price ? money(product.price) : ""}</div>
          </div>
        </a>
      `;
    }).join("");
  }

  function updateResultsCount() {
    const resultsCount = document.getElementById("resultsCount");
    if (!resultsCount) return;

    const label = filteredProducts.length === 1 ? "product" : "products";
    resultsCount.textContent = `${filteredProducts.length} ${label}`;
  }

  function renderNextPage() {
    const grid = document.getElementById("productGrid");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    if (!grid) return;

    const nextItems = filteredProducts.slice(cursor, cursor + PAGE_SIZE);

    if (cursor === 0) {
      grid.innerHTML = renderCards(nextItems);
    } else {
      grid.insertAdjacentHTML("beforeend", renderCards(nextItems));
    }

    cursor += PAGE_SIZE;

    if (!filteredProducts.length) {
      grid.innerHTML = `
        <div class="shop-empty">
          <h3>No products found.</h3>
          <p>Try changing filters or price range.</p>
        </div>
      `;
    }

    if (loadMoreBtn) {
      loadMoreBtn.style.display = cursor >= filteredProducts.length ? "none" : "inline-flex";
    }
  }

  function resetAndRender() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    grid.innerHTML = "";
    cursor = 0;
    updateResultsCount();
    renderNextPage();
  }

  function recomputeProducts() {
    const result = allProducts
      .filter(matchesQueryCollection)
      .filter(matchesQueryFilter)
      .filter(matchesSidebarFilters);

    filteredProducts = sortList(result, state.sort);
    resetAndRender();
  }

  function syncCollectionChip() {
    const activeCollection = document.getElementById("activeCollection");
    if (!activeCollection) return;
    activeCollection.textContent = getCollectionLabel();
  }

  function bindCheckboxGroup(selector, targetSet) {
    const items = document.querySelectorAll(selector);

    items.forEach((input) => {
      input.addEventListener("change", () => {
        const value = normalize(input.value);

        if (input.checked) {
          targetSet.add(value);
        } else {
          targetSet.delete(value);
        }

        recomputeProducts();
      });
    });
  }

  function setupFilters() {
    const sortSelect = document.getElementById("sortSelect");
    const minPrice = document.getElementById("minPrice");
    const maxPrice = document.getElementById("maxPrice");
    const applyPriceBtn = document.getElementById("applyPriceBtn");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");

    bindCheckboxGroup(".filter-category", state.selectedCategories);
    bindCheckboxGroup(".filter-collection", state.selectedCollections);
    bindCheckboxGroup(".filter-gender", state.selectedGenders);

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        state.sort = sortSelect.value;
        recomputeProducts();
      });
    }

    if (applyPriceBtn) {
      applyPriceBtn.addEventListener("click", () => {
        state.minPrice = minPrice ? minPrice.value.trim() : "";
        state.maxPrice = maxPrice ? maxPrice.value.trim() : "";
        recomputeProducts();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        state.selectedCategories.clear();
        state.selectedCollections.clear();
        state.selectedGenders.clear();
        state.minPrice = "";
        state.maxPrice = "";

        document.querySelectorAll(".shop-sidebar input[type='checkbox']").forEach((input) => {
          input.checked = false;
        });

        if (minPrice) minPrice.value = "";
        if (maxPrice) maxPrice.value = "";

        recomputeProducts();
      });
    }
  }

  function setupSidebarToggle() {
    const filterToggleBtn = document.getElementById("filterToggleBtn");
    const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
    const sidebar = document.getElementById("shopSidebar");
    const backdrop = document.getElementById("filterBackdrop");

    function openSidebar() {
      if (!sidebar || !backdrop) return;
      sidebar.classList.add("open");
      backdrop.classList.add("show");
      document.body.classList.add("filters-open");
    }

    function closeSidebar() {
      if (!sidebar || !backdrop) return;
      sidebar.classList.remove("open");
      backdrop.classList.remove("show");
      document.body.classList.remove("filters-open");
    }

    if (filterToggleBtn) {
      filterToggleBtn.addEventListener("click", openSidebar);
    }

    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener("click", closeSidebar);
    }

    if (backdrop) {
      backdrop.addEventListener("click", closeSidebar);
    }

    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) {
        closeSidebar();
      }
    });
  }

  function initShop() {
    state.queryCollection = normalize(getQueryParam("collection"));
    state.queryFilter = normalize(getQueryParam("filter"));

    allProducts = getProductsArray();
    state.sort = document.getElementById("sortSelect")?.value || "featured";

    syncCollectionChip();
    setupFilters();
    setupSidebarToggle();
    recomputeProducts();

    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener("click", renderNextPage);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShop);
  } else {
    initShop();
  }
})();