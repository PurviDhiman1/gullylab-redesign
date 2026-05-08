(function () {
  const cartKey = "gully_cart_v1";

  const $ = (q) => document.querySelector(q);

  const els = {
    placeOrderBtn: $("#placeOrderBtn"),
    paymentInfo: $("#paymentInfo"),

    summaryItems: $("#summaryItems"),
    sumSubtotal: $("#sumSubtotal"),
    sumShipping: $("#sumShipping"),
    sumDiscount: $("#sumDiscount"),
    sumTotal: $("#sumTotal"),

    firstName: $("#firstName"),
    lastName: $("#lastName"),
    email: $("#email"),
    phone: $("#phone"),
    addressLine1: $("#addressLine1"),
    addressLine2: $("#addressLine2"),
    city: $("#city"),
    state: $("#state"),
    pincode: $("#pincode"),
    country: $("#country")
  };

  function money(v) {
    return `₹${Number(v || 0).toLocaleString("en-IN")}`;
  }

  function getCart() {
    try {
      const checkoutItems = JSON.parse(localStorage.getItem("checkout_items"));
      if (Array.isArray(checkoutItems) && checkoutItems.length) {
        return checkoutItems;
      }
      return JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch {
      return [];
    }
  }

  function setCart(items) {
    localStorage.setItem(cartKey, JSON.stringify(items));
  }

  function subtotal(items) {
    return items.reduce((sum, item) => {
      return sum + (Number(item.price || 0) * Number(item.qty || 0));
    }, 0);
  }

  function getSavedDiscount() {
    return Number(localStorage.getItem("checkout_discount") || 0);
  }

  function getSavedCoupon() {
    return localStorage.getItem("checkout_coupon") || "";
  }

  function getSelectedPaymentMethod() {
    const checked = document.querySelector('input[name="paymentMethod"]:checked');
    return checked ? checked.value : "cod";
  }

  function updatePaymentInfo() {
    const method = getSelectedPaymentMethod();

    if (!els.paymentInfo) return;

    if (method === "cod") {
      els.paymentInfo.textContent = "Cash on Delivery selected.";
    } else if (method === "upi") {
      els.paymentInfo.textContent = "UPI selected.";
    } else if (method === "card") {
      els.paymentInfo.textContent = "Card selected.";
    }

    document.querySelectorAll(".pay-card").forEach((card) => {
      card.classList.remove("active");
      const radio = card.querySelector('input[name="paymentMethod"]');
      if (radio && radio.checked) {
        card.classList.add("active");
      }
    });
  }

  function renderSummary() {
    const items = getCart();

    if (els.summaryItems) {
      if (!items.length) {
        els.summaryItems.innerHTML = `<p>Your cart is empty.</p>`;
      } else {
        els.summaryItems.innerHTML = items.map((item) => `
          <div class="summary-item" style="display:flex; gap:12px; margin-bottom:14px; align-items:center;">
            <img src="${item.image || ""}" alt="${item.name || "Product"}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
            <div style="flex:1;">
              <div style="font-weight:600;">${item.name || "Product"}</div>
              <div style="font-size:13px; opacity:.7;">Size: ${item.size || "-"} • Qty: ${item.qty || 1}</div>
            </div>
            <div style="font-weight:600;">${money((item.price || 0) * (item.qty || 0))}</div>
          </div>
        `).join("");
      }
    }

    const sub = subtotal(items);
    const shipping = 0;
    const discount = getSavedDiscount();
    const total = Math.max(0, sub + shipping - discount);

    if (els.sumSubtotal) els.sumSubtotal.textContent = money(sub);
    if (els.sumShipping) els.sumShipping.textContent = money(shipping);
    if (els.sumDiscount) els.sumDiscount.textContent = discount > 0 ? `- ${money(discount)}` : money(0);
    if (els.sumTotal) els.sumTotal.textContent = money(total);
  }

  async function placeOrder() {
    const items = getCart();

    if (!items.length) {
      alert("Your cart is empty.");
      return;
    }

    const firstName = els.firstName?.value.trim() || "";
    const lastName = els.lastName?.value.trim() || "";
    const email = els.email?.value.trim() || "";
    const phone = els.phone?.value.trim() || "";
    const addressLine1 = els.addressLine1?.value.trim() || "";
    const addressLine2 = els.addressLine2?.value.trim() || "";
    const city = els.city?.value.trim() || "";
    const state = els.state?.value.trim() || "";
    const pincode = els.pincode?.value.trim() || "";
    const country = els.country?.value.trim() || "";
    const paymentMethod = getSelectedPaymentMethod();

    if (!firstName || !lastName || !email || !phone || !addressLine1 || !city || !state || !pincode || !country) {
      alert("Please fill all required checkout fields.");
      return;
    }

    const sub = subtotal(items);
    const discount = getSavedDiscount();
    const coupon = getSavedCoupon();
    const finalTotal = Math.max(0, sub - discount);

    const orderData = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone,
      address: [addressLine1, addressLine2, city, state, pincode, country]
        .filter(Boolean)
        .join(", "),
      items,
      subtotal: sub,
      discount,
      coupon,
      total: finalTotal,
      paymentMethod
    };

    try {
      if (els.placeOrderBtn) {
        els.placeOrderBtn.disabled = true;
        els.placeOrderBtn.textContent = "Placing Order...";
      }

      if (paymentMethod === "cod") {
        const response = await fetch("http://127.0.0.1:5000/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(orderData)
        });

        const raw = await response.text();
console.log("ORDER RESPONSE RAW:", raw);

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  throw new Error("Server returned HTML/error page instead of JSON");
}

if (!response.ok) {
  throw new Error(data.error || "Order failed");
}

        localStorage.setItem("gully_last_order", JSON.stringify({
          ...orderData,
          orderId: data.orderId
        }));

        setCart([]);
        localStorage.removeItem("checkout_items");
        localStorage.removeItem("checkout_coupon");
        localStorage.removeItem("checkout_discount");

        window.location.href = "success.html";
        return;
      }

      const response = await fetch("http://127.0.0.1:5000/create-razorpay-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create Razorpay order");
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "Gully Labs",
        description: "Order Payment",
        order_id: data.orderId,
        handler: async function (paymentResponse) {
          const verifyRes = await fetch("http://127.0.0.1:5000/verify-razorpay-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              ...paymentResponse,
              orderData
            })
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            alert("Payment verification failed.");
            return;
          }

          setCart([]);
          localStorage.removeItem("checkout_items");
          localStorage.removeItem("checkout_coupon");
          localStorage.removeItem("checkout_discount");

          alert("Payment successful and order placed!");
          window.location.href = "shop.html";
        },
        prefill: {
          name: `${firstName} ${lastName}`.trim(),
          email: email,
          contact: phone
        },
        theme: {
          color: "#111111"
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Order failed: " + error.message);
    } finally {
      if (els.placeOrderBtn) {
        els.placeOrderBtn.disabled = false;
        els.placeOrderBtn.textContent = "Place order";
      }
    }
  }

  function init() {
    renderSummary();
    updatePaymentInfo();

    document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
      radio.addEventListener("change", updatePaymentInfo);
    });

    if (els.placeOrderBtn) {
      els.placeOrderBtn.addEventListener("click", placeOrder);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();