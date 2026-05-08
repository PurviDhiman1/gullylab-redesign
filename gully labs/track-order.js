(function () {
    const trackBtn = document.getElementById("trackBtn");
    const trackMessage = document.getElementById("trackMessage");
    const trackResult = document.getElementById("trackResult");
  
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
  
    function money(v) {
      return `₹${Number(v || 0).toLocaleString("en-IN")}`;
    }
  
    function getProgressSteps(status) {
      switch (status) {
        case "Pending":
          return ["placed"];
        case "Confirmed":
          return ["placed", "confirmed"];
        case "Shipped":
          return ["placed", "confirmed", "shipped"];
        case "Delivered":
          return ["placed", "confirmed", "shipped", "delivered"];
        default:
          return ["placed"];
      }
    }
  
    function renderProgress(status) {
      const activeSteps = getProgressSteps(status);
  
      const isActive = (step) => activeSteps.includes(step) ? "active" : "";
      const isLineActive = (step) => activeSteps.includes(step) ? "active" : "";
  
      return `
        <div class="order-progress">
          <div class="progress-step ${isActive("placed")}">
            <div class="circle"></div>
            <p>Order Placed</p>
          </div>
  
          <div class="progress-line ${isLineActive("confirmed")}"></div>
  
          <div class="progress-step ${isActive("confirmed")}">
            <div class="circle"></div>
            <p>Confirmed</p>
          </div>
  
          <div class="progress-line ${isLineActive("shipped")}"></div>
  
          <div class="progress-step ${isActive("shipped")}">
            <div class="circle"></div>
            <p>Shipped</p>
          </div>
  
          <div class="progress-line ${isLineActive("delivered")}"></div>
  
          <div class="progress-step ${isActive("delivered")}">
            <div class="circle"></div>
            <p>Delivered</p>
          </div>
        </div>
      `;
    }
  
    async function trackOrder() {
      const orderId = document.getElementById("trackOrderId")?.value.trim();
      const email = document.getElementById("trackEmail")?.value.trim().toLowerCase();
  
      trackMessage.textContent = "";
      trackResult.innerHTML = "";
  
      if (!orderId || !email) {
        trackMessage.textContent = "Please enter both Order ID and Email.";
        return;
      }
  
      try {
        trackBtn.disabled = true;
        trackBtn.textContent = "Checking...";
  
        const response = await fetch("http://localhost:5000/track-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ orderId, email })
        });
  
        const data = await response.json();
  
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Order not found");
        }
  
        const order = data.order;
        const statusClass = getStatusClass(order.orderStatus);
  
        trackResult.innerHTML = `
          <div class="track-result">
            <div class="track-row">
              <strong>Order ID</strong>
              <span>${order.orderId}</span>
            </div>
  
            <div class="track-row">
              <strong>Name</strong>
              <span>${order.name}</span>
            </div>
  
            <div class="track-row">
              <strong>Status</strong>
              <span class="status-badge ${statusClass}">${order.orderStatus}</span>
            </div>
  
            ${renderProgress(order.orderStatus)}
  
            <div class="track-row">
              <strong>Payment</strong>
              <span>${order.paymentMethod || "cod"}</span>
            </div>
  
            <div class="track-row">
              <strong>Total</strong>
              <span>${money(order.total)}</span>
            </div>
  
            <div class="track-row">
              <strong>Address</strong>
              <span style="text-align:right; max-width:70%;">${order.address}</span>
            </div>
          </div>
        `;
      } catch (error) {
        trackMessage.textContent = error.message || "Unable to track order.";
      } finally {
        trackBtn.disabled = false;
        trackBtn.textContent = "Track Order";
      }
    }
  
    if (trackBtn) {
      trackBtn.addEventListener("click", trackOrder);
    }
  })();