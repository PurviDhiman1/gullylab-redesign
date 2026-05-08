// =======================
// AUTH CHECK
// =======================
const adminToken = localStorage.getItem("admin_token");
const adminLoggedIn = localStorage.getItem("adminLoggedIn");

if (!adminToken || adminLoggedIn !== "true") {
  window.location.href = "admin-login.html";
}

// =======================
// STORE ALL ORDERS
// =======================
let allOrders = [];

// =======================
// STATS
// =======================
function updateStats(orders) {
  const totalOrdersEl = document.getElementById("totalOrders");
  const totalRevenueEl = document.getElementById("totalRevenue");
  const pendingOrdersEl = document.getElementById("pendingOrders");
  const deliveredOrdersEl = document.getElementById("deliveredOrders");

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((sum, order) => {
    return sum + Number(order.total || 0);
  }, 0);

  const pendingOrders = orders.filter(order => {
    return (order.orderStatus || "Pending") === "Pending";
  }).length;

  const deliveredOrders = orders.filter(order => {
    return (order.orderStatus || "") === "Delivered";
  }).length;

  if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
  if (totalRevenueEl) {
    totalRevenueEl.textContent = `₹${totalRevenue.toLocaleString("en-IN")}`;
  }
  if (pendingOrdersEl) pendingOrdersEl.textContent = pendingOrders;
  if (deliveredOrdersEl) deliveredOrdersEl.textContent = deliveredOrders;
}

// =======================
// STATUS CLASS
// =======================
function getStatusClass(status) {
  switch (status) {
    case "Pending":
      return "status-pending";
    case "Confirmed":
      return "status-confirmed";
    case "Shipped":
      return "status-shipped";
    case "Delivered":
      return "status-delivered";
    default:
      return "status-pending";
  }
}

// =======================
// RENDER ORDERS
// =======================
function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");

  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No matching orders</h3>
        <p>Try a different search or status filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map(order => {
    const itemsHtml = Array.isArray(order.items)
      ? order.items.map(item => `
          <li>
            ${item.name || item.productId || "Product"} — 
            Size: ${item.size || "-"} — 
            Qty: ${item.qty || 1} — 
            ₹${Number(item.price || 0).toLocaleString("en-IN")}
          </li>
        `).join("")
      : "<li>No items found</li>";

    const orderDate = order.date
      ? new Date(order.date).toLocaleString("en-IN")
      : "N/A";

    const currentStatus = order.orderStatus || "Pending";
    const statusClass = getStatusClass(currentStatus);

    return `
      <div class="order-card">
        <h3>${order.name || "Customer"}</h3>

        <div class="order-meta">
          <div><strong>Order ID:</strong> ${order.orderId || "-"}</div>
          <div><strong>Email:</strong> ${order.email || "-"}</div>
          <div><strong>Phone:</strong> ${order.phone || "-"}</div>
          <div><strong>Address:</strong> ${order.address || "-"}</div>
          <div><strong>Payment:</strong> ${order.paymentMethod || "cod"}</div>
          <div><strong>Total:</strong> ₹${Number(order.total || 0).toLocaleString("en-IN")}</div>
          <div><strong>Date:</strong> ${orderDate}</div>

          <div class="status-row">
            <strong>Status:</strong>
            <span class="status-badge ${statusClass}">
              ${currentStatus}
            </span>

            <select class="status-select" data-id="${order._id}">
              <option value="Pending" ${currentStatus === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Confirmed" ${currentStatus === "Confirmed" ? "selected" : ""}>Confirmed</option>
              <option value="Shipped" ${currentStatus === "Shipped" ? "selected" : ""}>Shipped</option>
              <option value="Delivered" ${currentStatus === "Delivered" ? "selected" : ""}>Delivered</option>
            </select>
          </div>
        </div>

        <div class="order-items">
          <strong>Items:</strong>
          <ul>${itemsHtml}</ul>
        </div>

        <div class="order-actions">
          <button class="delete-order-btn" data-id="${order._id}">
            Delete Order
          </button>
        </div>
      </div>
    `;
  }).join("");

  bindStatusEvents();
  bindDeleteEvents();
}

// =======================
// LOAD ORDERS
// =======================
async function loadOrders() {
  const container = document.getElementById("ordersContainer");

  try {
    container.innerHTML = `<div class="spinner"></div>`;

    const response = await fetch("http://localhost:5000/orders", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
      }
    });

    let orders = [];
    try {
      orders = await response.json();
    } catch (e) {
      throw new Error("Invalid response from backend.");
    }

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    allOrders = Array.isArray(orders) ? orders : [];

    updateStats(allOrders);

    if (allOrders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No orders yet</h3>
          <p>Orders will appear here after customers place them.</p>
        </div>
      `;
      return;
    }

    renderOrders(allOrders);

  } catch (error) {
    console.error("Load orders error:", error);

    container.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load orders</h3>
        <p>${error.message || "Please make sure your backend is running on port 5000."}</p>
      </div>
    `;
  }
}

// =======================
// UPDATE STATUS
// =======================
function bindStatusEvents() {
  document.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", async function () {
      const orderId = this.getAttribute("data-id");
      const status = this.value;

      try {
        const response = await fetch(`http://localhost:5000/orders/${orderId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          },
          body: JSON.stringify({ status })
        });

        let data = {};
        try {
          data = await response.json();
        } catch (e) {
          throw new Error("Invalid response from backend.");
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to update status");
        }

        alert("Status updated successfully ✅");
        loadOrders();

      } catch (error) {
        console.error("Status update error:", error);
        alert(error.message || "Status update failed.");
      }
    });
  });
}

// =======================
// DELETE ORDER
// =======================
function bindDeleteEvents() {
  document.querySelectorAll(".delete-order-btn").forEach(btn => {
    btn.addEventListener("click", async function () {
      const orderId = this.getAttribute("data-id");
      const confirmDelete = confirm("Are you sure you want to delete this order?");

      if (!confirmDelete) return;

      try {
        const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          }
        });

        let data = {};
        try {
          data = await response.json();
        } catch (e) {
          throw new Error("Invalid response from backend.");
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to delete order");
        }

        alert("Order deleted successfully!");
        loadOrders();

      } catch (error) {
        console.error("Delete error:", error);
        alert(error.message || "Delete failed.");
      }
    });
  });
}

// =======================
// SEARCH + FILTER ORDERS
// =======================
function searchOrders() {
  const searchInput = document.getElementById("searchOrders");
  const statusFilter = document.getElementById("statusFilter");

  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedStatus = statusFilter ? statusFilter.value : "";

  const filteredOrders = allOrders.filter(order => {
    const orderId = (order.orderId || "").toLowerCase();
    const name = (order.name || "").toLowerCase();
    const email = (order.email || "").toLowerCase();
    const status = order.orderStatus || "Pending";

    const matchesSearch =
      orderId.includes(searchText) ||
      name.includes(searchText) ||
      email.includes(searchText);

    const matchesStatus =
      selectedStatus === "" || status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  renderOrders(filteredOrders);
  updateStats(filteredOrders);
}

// =======================
// PAGE INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  loadOrders();

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadOrders);
  }

  const searchInput = document.getElementById("searchOrders");
  if (searchInput) {
    searchInput.addEventListener("input", searchOrders);
  }

  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", searchOrders);
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("adminLoggedIn");
      window.location.href = "admin-login.html";
    });
  }
});