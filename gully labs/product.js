// product.js (ROLLBACK SAFE VERSION)

(function () {
  const $ = (q) => document.querySelector(q);
  const cartKey = "gully_cart_v1";

  const els = {
    cartCount: $("#cartCount"),

    productTag: $("#productTag"),
    productName: $("#productName"),
    productPrice: $("#productPrice"),

    sizeOptions: $("#sizeOptions"),
    sizeHint: $("#sizeHint"),

    qty: $("#qty"),
    minus: $("#minus"),
    plus: $("#plus"),

    addToCartBtn: $("#addToCartBtn"),
    goToCartBtn: $("#goToCartBtn"),
    buyNowBtn: $("#buyNow"),

    sliderTrack: $("#sliderTrack"),
    thumbRow: $("#thumbnailRow"),
    prevBtn: $("#prevBtn"),
    nextBtn: $("#nextBtn"),

    stickyCart: $("#stickyCart"),
    stickyName: $("#stickyName"),
    stickyPrice: $("#stickyPrice"),
    stickyAdd: $("#stickyAdd"),

    descTitle: $("#descTitle"),
    descTagline: $("#descTagline"),
    featureList: $("#featureList"),
    paymentBlock: $("#paymentBlock"),
    deliveryBlock: $("#deliveryBlock"),
    detailsGrid: $("#detailsGrid"),

    openCartBtn: $("#openCartBtn"),
    cartOverlay: $("#cartOverlay"),
    cartDrawer: $("#cartDrawer"),
    closeCartBtn: $("#closeCartBtn"),
    drawerItems: $("#drawerItems"),
    drawerSubtotal: $("#drawerSubtotal"),
    drawerCheckout: $("#drawerCheckout"),
    drawerViewCart: $("#drawerViewCart"),
    wishlistBtn: $("#wishlistBtn"),
  };

  let product = null;
  let currentProductId = null;
  let activeSize = null;
  let activeIndex = 0;
  let quantity = 1;

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

  function renderRecommendations(currentSlug) {
    const grid = document.getElementById("recommendGrid");
    if (!grid || !window.PRODUCTS) return;
  
    const allProducts = Object.entries(window.PRODUCTS).map(([slug, product]) => ({
      slug,
      ...product
    }));
  
    let recommended = allProducts.filter((item) => item.slug !== currentSlug);
  
    const currentProduct = window.PRODUCTS[currentSlug];
    if (currentProduct) {
      const sameCategory = recommended.filter(
        (item) => (item.category || "").toLowerCase() === (currentProduct.category || "").toLowerCase()
      );
  
      const otherProducts = recommended.filter(
        (item) => (item.category || "").toLowerCase() !== (currentProduct.category || "").toLowerCase()
      );
  
      recommended = [...sameCategory, ...otherProducts];
    }
  
    recommended = recommended.slice(0, 4);
  
    if (!recommended.length) {
      grid.innerHTML = "";
      return;
    }
  
    grid.innerHTML = recommended.map((item) => `
      <a class="rec-card" href="product.html?product=${encodeURIComponent(item.slug)}">
        <div class="rec-media">
          <img src="${item.images?.[0] || ""}" alt="${item.name || "Product"}">
        </div>
        <div class="rec-info">
          <p class="rec-tag">${item.tag || "MEN"}</p>
          <h3 class="rec-name">${item.name || "Product"}</h3>
          <p class="rec-price">${money(item.price || 0)}</p>
        </div>
      </a>
    `).join("");
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch {
      return [];
    }
  }

  function setCart(items) {
    localStorage.setItem(cartKey, JSON.stringify(items));
    updateCartCount();
    renderDrawer();
  }

  function updateWishlistButton() {
    if (!els.wishlistBtn || !currentProductId || typeof isInWishlist !== "function") return;

    const saved = isInWishlist(currentProductId);
    els.wishlistBtn.textContent = saved ? "REMOVE FROM WISHLIST" : "ADD TO WISHLIST";
  }

  function updateCartCount() {
    const items = getCart();
    const count = items.reduce((sum, it) => sum + (it.qty || 0), 0);
    if (els.cartCount) els.cartCount.textContent = String(count);
  }

  function getProductIdFromURL() {
    const url = new URL(window.location.href);
    return (
      url.searchParams.get("product") ||
      url.searchParams.get("p") ||
      "barfi-burgundy"
    );
  }

  let isDragging = false;
  let startX = 0;
  let dragDX = 0;
  let dragRAF = null;

  function slideWidth() {
    const viewport = els.sliderTrack?.parentElement;
    return viewport ? viewport.clientWidth : window.innerWidth;
  }

  function applySliderTransform(pxOffset = 0, snap = false) {
    if (!els.sliderTrack) return;

    els.sliderTrack.style.transition = snap
      ? "transform 0.38s cubic-bezier(.2,.9,.2,1)"
      : "none";

    const base = -activeIndex * slideWidth();
    els.sliderTrack.style.transform = `translateX(${base + pxOffset}px)`;
  }

  function highlightThumb() {
    if (!els.thumbRow) return;
    const thumbs = Array.from(els.thumbRow.querySelectorAll("img"));
    thumbs.forEach((t, i) => t.classList.toggle("active", i === activeIndex));
  }

  function goTo(idx) {
    const max = (product?.images?.length || 1) - 1;
    activeIndex = Math.min(Math.max(idx, 0), max);
    applySliderTransform(0, true);
    highlightThumb();
  }

  function next() { goTo(activeIndex + 1); }
  function prev() { goTo(activeIndex - 1); }

  function bindSliderDrag() {
    const viewport = els.sliderTrack?.parentElement;
    if (!viewport) return;
    if (viewport.dataset.dragBound === "1") return;
    viewport.dataset.dragBound = "1";

    const onDown = (clientX) => {
      isDragging = true;
      startX = clientX;
      dragDX = 0;
      applySliderTransform(0, false);
    };

    const onMove = (clientX) => {
      if (!isDragging) return;
      dragDX = clientX - startX;

      const max = (product?.images?.length || 1) - 1;
      const atStart = activeIndex === 0 && dragDX > 0;
      const atEnd = activeIndex === max && dragDX < 0;
      const resisted = (atStart || atEnd) ? dragDX * 0.35 : dragDX;

      if (!dragRAF) {
        dragRAF = requestAnimationFrame(() => {
          applySliderTransform(resisted, false);
          dragRAF = null;
        });
      }
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;

      const w = slideWidth();
      const threshold = Math.max(40, w * 0.14);

      if (dragDX < -threshold) next();
      else if (dragDX > threshold) prev();
      else applySliderTransform(0, true);

      setTimeout(() => { dragDX = 0; }, 0);
    };

    viewport.addEventListener("mousedown", (e) => onDown(e.clientX));
    window.addEventListener("mousemove", (e) => onMove(e.clientX));
    window.addEventListener("mouseup", onUp);

    viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
    viewport.addEventListener("touchend", onUp, { passive: true });

    window.addEventListener("resize", () => applySliderTransform(0, true), { passive: true });
  }

  function renderSlider(images) {
    if (!els.sliderTrack || !els.thumbRow) return;

    els.sliderTrack.innerHTML = "";
    els.thumbRow.innerHTML = "";

    images.forEach((src, idx) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = `${product.name} image ${idx + 1}`;
      img.draggable = false;
      els.sliderTrack.appendChild(img);

      const t = document.createElement("img");
      t.src = src;
      t.alt = `Thumbnail ${idx + 1}`;
      t.className = "thumb";
      t.draggable = false;
      t.addEventListener("click", () => goTo(idx));
      els.thumbRow.appendChild(t);
    });

    activeIndex = 0;
    applySliderTransform(0, true);
    highlightThumb();
    bindSliderDrag();
  }

  function renderSizes(product) {
    const sizeOptions = document.getElementById("sizeOptions");
    const sizeHint = document.getElementById("sizeHint");

    if (!sizeOptions) return;

    sizeOptions.innerHTML = "";
    activeSize = null;

    if (!product || !product.stock || !Object.keys(product.stock).length) {
      if (sizeHint) sizeHint.textContent = "Sizes unavailable.";
      return;
    }

    Object.keys(product.stock).forEach((size) => {
      const qty = product.stock[size];

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-btn";
      btn.textContent = size;

      if (qty <= 0) {
        btn.disabled = true;
        btn.classList.add("sold-out");
      }

      btn.addEventListener("click", () => {
        document.querySelectorAll(".size-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        activeSize = size;

        if (sizeHint) {
          sizeHint.textContent = `Selected size: UK ${size}`;
          sizeHint.classList.remove("warn");
        }

        const selectedChip = document.getElementById("selectedChip");
        const selectedChipText = document.getElementById("selectedChipText");

        if (selectedChip && selectedChipText) {
          selectedChip.hidden = false;
          selectedChipText.textContent = `UK ${size}`;
        }
      });

      sizeOptions.appendChild(btn);
    });
  }

  function setQty(q) {
    quantity = Math.max(1, Math.min(10, q));
    if (els.qty) els.qty.textContent = String(quantity);
  }

  function addToCart() {
    if (!activeSize) {
      if (els.sizeHint) {
        els.sizeHint.textContent = "Please select a size first.";
        els.sizeHint.classList.add("warn");
      }
      return;
    }

    const cart = getCart();
    const key = `${currentProductId}__${activeSize}`;
    const existing = cart.find((i) => i.key === key);

    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({
        key,
        productId: currentProductId,
        name: product.name,
        size: activeSize,
        price: product.price,
        image: (product.images && product.images[0]) ? product.images[0] : "",
        qty: quantity,
      });
    }

    setCart(cart);

    if (els.sizeHint) {
      els.sizeHint.textContent = `Added size UK ${activeSize} to cart`;
      els.sizeHint.classList.remove("warn");
    }

    if (els.addToCartBtn) els.addToCartBtn.textContent = "ADDED ✓";
    if (els.stickyAdd) els.stickyAdd.textContent = "ADDED ✓";

    setTimeout(() => {
      if (els.addToCartBtn) els.addToCartBtn.textContent = "ADD TO CART";
      if (els.stickyAdd) els.stickyAdd.textContent = "ADD TO CART";
    }, 900);
  }

  function buyNow() {
    if (!activeSize) {
      if (els.sizeHint) {
        els.sizeHint.textContent = "Please select a size first.";
        els.sizeHint.classList.add("warn");
      }
      return;
    }

    const cart = getCart();
    const key = `${currentProductId}__${activeSize}`;
    const existing = cart.find((i) => i.key === key);

    if (existing) {
      existing.qty += quantity;
    } else {
      cart.push({
        key,
        productId: currentProductId,
        name: product.name,
        size: activeSize,
        price: product.price,
        image: (product.images && product.images[0]) ? product.images[0] : "",
        qty: quantity,
      });
    }

    setCart(cart);
    window.location.href = "checkout.html";
  }

  function handleWishlist() {
    if (!currentProductId || typeof toggleWishlist !== "function") return;

    toggleWishlist(currentProductId);
    updateWishlistButton();
  }

  function renderDescription() {
    if (els.descTitle) els.descTitle.textContent = product.name;
    if (els.descTagline) els.descTagline.textContent = product.tagline || "";

    if (els.featureList) {
      els.featureList.innerHTML = "";
      (product.features || []).forEach((f) => {
        const li = document.createElement("li");
        li.textContent = f;
        els.featureList.appendChild(li);
      });
    }

    if (els.paymentBlock) {
      els.paymentBlock.innerHTML = `
        <p><strong>${product.payment?.title || ""}</strong></p>
        <p>${product.payment?.subtitle || ""}</p>
      `;
    }

    if (els.deliveryBlock) {
      const ship = (product.delivery?.shipping || [])
        .map((x) => `<p>${x.region}: ${x.time}</p>`)
        .join("");

      const returns = (product.delivery?.returns || [])
        .map((x) => `<p>${x}</p>`)
        .join("");

      els.deliveryBlock.innerHTML = `
        <div class="delivery-grid">
          <div>
            <h4>Shipping Timeline</h4>
            ${ship}
            <small>${product.delivery?.note || ""}</small>
          </div>
          <div>
            <h4>Returns & Exchange</h4>
            ${returns}
          </div>
        </div>
      `;
    }

    if (els.detailsGrid) {
      els.detailsGrid.innerHTML = "";
      Object.entries(product.details || {}).forEach(([k, v]) => {
        const div = document.createElement("div");
        div.innerHTML = `<span>${k}</span><strong>${v}</strong>`;
        els.detailsGrid.appendChild(div);
      });
    }
  }

  function drawerSubtotal(items) {
    return items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 0), 0);
  }

  function openDrawer() {
    if (!els.cartOverlay || !els.cartDrawer) return;
    els.cartOverlay.classList.add("show");
    els.cartDrawer.classList.add("show");
    els.cartDrawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    if (!els.cartOverlay || !els.cartDrawer) return;
    els.cartOverlay.classList.remove("show");
    els.cartDrawer.classList.remove("show");
    els.cartDrawer.setAttribute("aria-hidden", "true");
  }

  function renderDrawer() {
    if (!els.drawerItems || !els.drawerSubtotal) return;

    const items = getCart();

    if (!items.length) {
      els.drawerItems.innerHTML = `<p style="color:rgba(0,0,0,.55);font-size:13px;">Your cart is empty.</p>`;
      els.drawerSubtotal.textContent = "₹0";
      return;
    }

    els.drawerItems.innerHTML = items
      .map((it, idx) => {
        const line = (it.price || 0) * (it.qty || 0);
        return `
          <div class="cd-item" data-i="${idx}">
            <img src="${it.image || ""}" alt="${it.name || "Product"}">
            <div>
              <h4>${it.name || "Product"}</h4>
              <div class="cd-meta">Size: ${it.size || "-"}</div>
              <div class="cd-bottom">
                <div class="cd-qty">
                  <button data-act="minus">−</button>
                  <span>${it.qty || 1}</span>
                  <button data-act="plus">+</button>
                </div>
                <div class="cd-price">₹${Number(line).toLocaleString("en-IN")}</div>
              </div>
              <button class="cd-remove" data-act="remove">Remove</button>
            </div>
          </div>
        `;
      })
      .join("");

    els.drawerSubtotal.textContent = `₹${Number(drawerSubtotal(items)).toLocaleString("en-IN")}`;
  }

  function bindDrawerEvents() {
    if (!els.drawerItems) return;

    els.drawerItems.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const act = btn.getAttribute("data-act");
      if (!act) return;

      const row = btn.closest(".cd-item");
      if (!row) return;

      const idx = Number(row.getAttribute("data-i"));
      if (Number.isNaN(idx)) return;

      const cart = getCart();
      const it = cart[idx];
      if (!it) return;

      if (act === "minus") it.qty = Math.max(1, (it.qty || 1) - 1);
      if (act === "plus") it.qty = Math.min(10, (it.qty || 1) + 1);
      if (act === "remove") cart.splice(idx, 1);

      setCart(cart);
    });
  }

  function setupAccordion() {
    const items = document.querySelectorAll(".accordion-item");

    if (!items.length) return;

    items.forEach((item) => {
      const header = item.querySelector(".accordion-header");
      const content = item.querySelector(".accordion-content");
      const icon = item.querySelector(".accordion-icon");

      if (!header || !content) return;

      item.classList.remove("open");
      content.style.maxHeight = "0px";
      content.style.overflow = "hidden";
      content.style.transition = "max-height 0.35s ease";

      header.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        items.forEach((other) => {
          other.classList.remove("open");
          const otherContent = other.querySelector(".accordion-content");
          const otherIcon = other.querySelector(".accordion-icon");
          if (otherContent) otherContent.style.maxHeight = "0px";
          if (otherIcon) otherIcon.textContent = "+";
        });

        if (!isOpen) {
          item.classList.add("open");
          content.style.maxHeight = content.scrollHeight + "px";
          if (icon) icon.textContent = "–";
        }
      });
    });
  }

  function setupReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("in");
        });
      },
      { threshold: 0.1 }
    );

    nodes.forEach((n) => io.observe(n));
  }

  function setupSticky() {
    if (!els.stickyCart) return;

    function onScroll() {
      const show = window.scrollY > 260;
      els.stickyCart.classList.toggle("show", show);
      els.stickyCart.setAttribute("aria-hidden", show ? "false" : "true");
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function init() {
    updateCartCount();

    const id = getProductIdFromURL();
    currentProductId = id;

    const baseProduct = window.PRODUCTS?.[id] || window.PRODUCTS?.["barfi-burgundy"];
    const detailProduct = window.PRODUCT_DETAILS?.[id] || {};

    product = {
      ...baseProduct,
      ...detailProduct
    };

    if (!product) {
      if (els.productName) els.productName.textContent = "Product not found.";
      return;
    }

    document.title = product.name;

    if (els.productTag) els.productTag.textContent = product.tag || "MEN";
    if (els.productName) els.productName.textContent = product.name;
    if (els.productPrice) els.productPrice.textContent = money(product.price);

    if (els.stickyName) els.stickyName.textContent = product.name;
    if (els.stickyPrice) els.stickyPrice.textContent = money(product.price);

    renderSlider(product.images || []);
    renderSizes(product);
    renderDescription();

    if (els.prevBtn) els.prevBtn.addEventListener("click", prev);
    if (els.nextBtn) els.nextBtn.addEventListener("click", next);

    if (els.minus) els.minus.addEventListener("click", () => setQty(quantity - 1));
    if (els.plus) els.plus.addEventListener("click", () => setQty(quantity + 1));
    setQty(1);

    if (els.addToCartBtn) els.addToCartBtn.addEventListener("click", addToCart);
    if (els.stickyAdd) els.stickyAdd.addEventListener("click", addToCart);
    if (els.buyNowBtn) els.buyNowBtn.addEventListener("click", buyNow);

    if (els.goToCartBtn) {
      els.goToCartBtn.addEventListener("click", () => {
        window.location.href = "cart.html";
      });
    }

    if (els.openCartBtn) els.openCartBtn.addEventListener("click", openDrawer);
    if (els.closeCartBtn) els.closeCartBtn.addEventListener("click", closeDrawer);
    if (els.cartOverlay) els.cartOverlay.addEventListener("click", closeDrawer);

    if (els.drawerViewCart) {
      els.drawerViewCart.addEventListener("click", () => {
        window.location.href = "cart.html";
      });
    }

    bindDrawerEvents();
    renderDrawer();
    setupAccordion();
    setupReveal();
    setupSticky();
    renderRecommendations(currentProductId);

    updateWishlistButton();

    if (els.wishlistBtn) {
      els.wishlistBtn.addEventListener("click", handleWishlist);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();

async function placeOrder(orderData){
  try{
    const response = await fetch("http://localhost:5000/order",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(orderData)
    });

    const data = await response.json();
    console.log("Order response:",data);

    alert("Order placed successfully!");
  }
  catch(err){
    console.error(err);
    alert("Order failed");
  }
}