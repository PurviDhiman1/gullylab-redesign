const API_BASE = "http://localhost:5000";

const form = document.getElementById("trackForm");
const orderIdInput = document.getElementById("orderId");
const emailInput = document.getElementById("email");
const trackBtn = document.getElementById("trackBtn");
const trackMessage = document.getElementById("trackMessage");
const trackResult = document.getElementById("trackResult");

const resultOrderId = document.getElementById("resultOrderId");
const resultStatus = document.getElementById("resultStatus");
const resultDate = document.getElementById("resultDate");
const resultTotal = document.getElementById("resultTotal");
const resultAddress = document.getElementById("resultAddress");
const resultItems = document.getElementById("resultItems");
const statusTracker = document.getElementById("statusTracker");

const statuses = ["Pending", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

function renderTracker(currentStatus) {
  const currentIndex = statuses.indexOf(currentStatus);

  statusTracker.innerHTML = statuses.map((status, index) => {
    return `<div class="step ${index <= currentIndex ? "active" : ""}">${status}</div>`;
  }).join("");
}

function renderItems(items = []) {
  resultItems.innerHTML = items.map(item => `
    <div class="item">
      <img src="${item.image || ""}" alt="${item.name || "Product"}">
      <div>
        <div class="item-name">${item.name || ""}</div>
        <div class="item-sub">Size: ${item.size || "-"} • Qty: ${item.qty || 1}</div>
      </div>
      <div>₹${Number(item.price || 0).toLocaleString("en-IN")}</div>
    </div>
  `).join("");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderId = orderIdInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();

  trackMessage.textContent = "";
  trackResult.classList.add("hidden");
  trackBtn.disabled = true;
  trackBtn.textContent = "Tracking...";

  try {
    const res = await fetch(`${API_BASE}/track-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ orderId, email })
    });

    const data = await res.json();

    if (!data.success) {
      trackMessage.textContent = data.message || "Order not found.";
      return;
    }

    const order = data.order;

    resultOrderId.textContent = order.orderId;
    resultStatus.textContent = order.orderStatus;
    resultDate.textContent = new Date(order.date).toLocaleString();
    resultTotal.textContent = `₹${Number(order.total).toLocaleString("en-IN")}`;
    resultAddress.textContent = order.address;

    renderTracker(order.orderStatus);
    renderItems(order.items);

    trackResult.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    trackMessage.textContent = "Network error. Please try again.";
  } finally {
    trackBtn.disabled = false;
    trackBtn.textContent = "Track Order";
  }
});

const params = new URLSearchParams(window.location.search);
const prefillOrderId = params.get("orderId");
const prefillEmail = params.get("email");

if (prefillOrderId) orderIdInput.value = prefillOrderId;
if (prefillEmail) emailInput.value = prefillEmail;
if (prefillOrderId && prefillEmail) form.requestSubmit();