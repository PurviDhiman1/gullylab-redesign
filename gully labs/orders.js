const API_BASE = "http://localhost:5000";

const ordersForm = document.getElementById("ordersForm");
const ordersEmail = document.getElementById("ordersEmail");
const ordersBtn = document.getElementById("ordersBtn");
const ordersMessage = document.getElementById("ordersMessage");
const ordersList = document.getElementById("ordersList");

ordersForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = ordersEmail.value.trim().toLowerCase();
  ordersMessage.textContent = "";
  ordersList.innerHTML = "";
  ordersBtn.disabled = true;
  ordersBtn.textContent = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/my-orders?email=${encodeURIComponent(email)}`);
    const data = await res.json();

    if (!data.success) {
      ordersMessage.textContent = data.message || "Could not fetch orders.";
      return;
    }

    if (!data.orders.length) {
      ordersMessage.textContent = "No orders found for this email.";
      return;
    }

    ordersList.innerHTML = data.orders.map(order => `
      <div class="order-card">
        <div class="order-title">${order.orderId}</div>
        <div class="order-sub">Status: ${order.orderStatus}</div>
        <div class="order-sub">Total: ₹${Number(order.total).toLocaleString("en-IN")}</div>
        <div class="order-sub">Date: ${new Date(order.date).toLocaleString()}</div>
        <div class="order-sub">
          <a href="track.html?orderId=${encodeURIComponent(order.orderId)}&email=${encodeURIComponent(order.email)}">
            Track this order
          </a>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error(error);
    ordersMessage.textContent = "Network error. Please try again.";
  } finally {
    ordersBtn.disabled = false;
    ordersBtn.textContent = "View Orders";
  }
});