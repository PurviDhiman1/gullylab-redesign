(function () {
  const cartKey = "gully_cart_v1";
  const $ = (q) => document.querySelector(q);

  const els = {
    cartCount: $("#cartCount"),
    subtext: $("#cartSubtext"),

    container: $("#cart-container"),

    sumSubtotal: $("#sumSubtotal"),
    sumDiscount: $("#sumDiscount"),
    sumTotal: $("#sumTotal"),

    couponInput: $("#coupon-input"),
    couponMsg: $("#coupon-message"),
    applyCouponBtn: $("#applyCouponBtn"),

    checkoutBtn: $("#checkoutBtn"),
    clearCartBtn: $("#clearCartBtn"),

    recoGrid: document.getElementById("recommendGrid"),
  };

  let discountAmount = 0;
  let appliedCoupon = "";

  function money(v) {
    return `₹${Number(v || 0).toLocaleString("en-IN")}`;
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
    updateCartCount(items);
  }

  function updateCartCount(items = getCart()) {
    const count = items.reduce((sum, it) => sum + Number(it.qty || 0), 0);

    if (els.cartCount) els.cartCount.textContent = String(count);
    if (els.subtext) {
      els.subtext.textContent = `${count} item${count === 1 ? "" : "s"} in bag`;
    }
  }

  function subtotal(items) {
    return items.reduce((sum, it) => {
      return sum + Number(it.price || 0) * Number(it.qty || 0);
    }, 0);
  }

  function recalculateDiscount(items) {
    const sub = subtotal(items);

    if (appliedCoupon === "GULLY10") {
      discountAmount = Math.round(sub * 0.10);
    } else if (appliedCoupon === "FIRST500") {
      discountAmount = Math.min(500, sub);
    } else {
      discountAmount = 0;
    }
  }

  function updateSummary(items) {
    const sub = subtotal(items);

    recalculateDiscount(items);

    const total = Math.max(0, sub - discountAmount);

    if (els.sumSubtotal) els.sumSubtotal.textContent = money(sub);
    if (els.sumDiscount) els.sumDiscount.textContent = `- ${money(discountAmount)}`;
    if (els.sumTotal) els.sumTotal.textContent = money(total);

    renderRecommendations(items);
  }

  function getAllProducts() {
    const obj = window.PRODUCTS || {};
    return Object.entries(obj).map(([slug, product]) => ({
      slug,
      ...product
    }));
  }

  function renderRecommendations(cartItems) {
    if (!els.recoGrid) return;

    const all = getAllProducts();

    if (!all.length) {
      els.recoGrid.innerHTML = "";
      return;
    }

    const inCartIds = new Set(
      cartItems.map(it => String(it.productId || "").trim())
    );

    let candidates = all.filter(
      p => !inCartIds.has(String(p.slug || "").trim())
    );

    if (!candidates.length) {
      candidates = all;
    }

    const picks = candidates.slice(0, 4);

    if (!picks.length) {
      els.recoGrid.innerHTML = "";
      return;
    }

    els.recoGrid.innerHTML = picks.map(p => {
      const cover = (p.images && p.images[0]) ? p.images[0] : "";
      return `
        <a class="rec-card" href="product.html?product=${encodeURIComponent(p.slug)}">
          <div class="rec-media">
            <img class="reco-img" src="${cover}" alt="${p.name}">
          </div>
          <div class="rec-info">
            <p class="rec-tag">${p.tag || "MEN"}</p>
            <h3 class="rec-name">${p.name}</h3>
            <p class="rec-price">₹${Number(p.price || 0).toLocaleString("en-IN")}</p>
          </div>
        </a>
      `;
    }).join("");
  }

  function render() {
    const items = getCart();
    updateCartCount(items);

    if (!els.container) return;

    if (!items.length) {
      els.container.innerHTML = `
        <div class="empty">
          <h2>Your bag is empty</h2>
          <p>Go back to the shop and add your first pair.</p>
        </div>
      `;

      appliedCoupon = "";
      discountAmount = 0;

      if (els.couponInput) els.couponInput.value = "";
      if (els.couponMsg) els.couponMsg.textContent = "";

      updateSummary(items);
      return;
    }

    els.container.innerHTML = items.map((it, idx) => {
      const qty = Number(it.qty || 1);
      const price = Number(it.price || 0);
      const line = price * qty;

      return `
        <div class="cart-item" data-i="${idx}">
          <div class="cart-left">
            <img class="cart-img" src="${it.image || ""}" alt="${it.name || "Product"}">
            <div class="cart-info">
              <h3>${it.name || "Product"}</h3>
              <p class="meta">${it.color ? `Color: ${it.color} · ` : ""}Size: ${it.size || "-"}</p>
              <p class="price">${money(price)}</p>
            </div>
          </div>

          <div class="cart-right">
            <div class="qty">
              <button class="qty-btn" data-act="minus">−</button>
              <span class="qty-num">${qty}</span>
              <button class="qty-btn" data-act="plus">+</button>
            </div>

            <p class="line-total">${money(line)}</p>

            <button class="remove-btn" data-act="remove">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    updateSummary(items);
  }

  function bindEvents() {
    if (els.container) {
      els.container.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;

        const act = btn.getAttribute("data-act");
        if (!act) return;

        const itemEl = btn.closest(".cart-item");
        if (!itemEl) return;

        const idx = Number(itemEl.getAttribute("data-i"));
        if (Number.isNaN(idx)) return;

        const cart = getCart();
        const it = cart[idx];
        if (!it) return;

        if (act === "minus") {
          it.qty = Math.max(1, Number(it.qty || 1) - 1);
        }

        if (act === "plus") {
          it.qty = Math.min(10, Number(it.qty || 1) + 1);
        }

        if (act === "remove") {
          cart.splice(idx, 1);
        }

        setCart(cart);
        render();
      });
    }

    if (els.applyCouponBtn) {
      els.applyCouponBtn.addEventListener("click", applyCoupon);
    }

    if (els.clearCartBtn) {
      els.clearCartBtn.addEventListener("click", () => {
        localStorage.removeItem(cartKey);
        appliedCoupon = "";
        discountAmount = 0;

        if (els.couponInput) els.couponInput.value = "";
        if (els.couponMsg) els.couponMsg.textContent = "";

        render();
      });
    }

    if (els.checkoutBtn) {
      els.checkoutBtn.addEventListener("click", () => {
        const items = getCart();

        if (!items.length) {
          alert("Your cart is empty.");
          return;
        }

        localStorage.setItem("checkout_items", JSON.stringify(items));
        localStorage.setItem("checkout_coupon", appliedCoupon);
        localStorage.setItem("checkout_discount", String(discountAmount));

        window.location.href = "checkout.html";
      });
    }
  }

  function applyCoupon() {
    const code = (els.couponInput?.value || "").trim().toUpperCase();
    const items = getCart();
    const sub = subtotal(items);

    if (!items.length) {
      appliedCoupon = "";
      discountAmount = 0;

      if (els.couponMsg) els.couponMsg.textContent = "Your cart is empty.";
      updateSummary(items);
      return;
    }

    if (code === "GULLY10") {
      appliedCoupon = "GULLY10";
      discountAmount = Math.round(sub * 0.10);

      if (els.couponMsg) {
        els.couponMsg.textContent = "Coupon applied: 10% OFF ✅";
      }
    } else if (code === "FIRST500") {
      appliedCoupon = "FIRST500";
      discountAmount = Math.min(500, sub);

      if (els.couponMsg) {
        els.couponMsg.textContent = "Coupon applied: ₹500 OFF ✅";
      }
    } else {
      appliedCoupon = "";
      discountAmount = 0;

      if (els.couponMsg) {
        els.couponMsg.textContent = "Invalid coupon code ❌";
      }
    }

    updateSummary(items);
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    render();
  });
})();