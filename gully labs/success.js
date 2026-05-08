(function () {
  function money(v) {
    return `₹${Number(v || 0).toLocaleString("en-IN")}`;
  }

  function init() {
    const raw = localStorage.getItem("gully_last_order");

    if (!raw) return;

    let order;
    try {
      order = JSON.parse(raw);
    } catch {
      return;
    }

    const orderIdEl = document.getElementById("orderId");
    const nameEl = document.getElementById("orderName");
    const phoneEl = document.getElementById("orderPhone");
    const totalEl = document.getElementById("orderTotal");
    const paymentEl = document.getElementById("orderPayment");
    const addressEl = document.getElementById("orderAddress");

    if (orderIdEl) orderIdEl.textContent = order.orderId || "-";
    if (nameEl) nameEl.textContent = order.name || "-";
    if (phoneEl) phoneEl.textContent = order.phone || "-";
    if (totalEl) totalEl.textContent = money(order.total || 0);
    if (paymentEl) paymentEl.textContent = (order.paymentMethod || "cod").toUpperCase();
    if (addressEl) addressEl.textContent = order.address || "-";
  }

  document.addEventListener("DOMContentLoaded", init);
})();