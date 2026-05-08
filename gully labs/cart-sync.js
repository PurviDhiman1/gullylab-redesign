// cart-sync.js
(function () {

    const cartKey = "gully_cart_v1";
  
    function getCart() {
      try {
        return JSON.parse(localStorage.getItem(cartKey)) || [];
      } catch {
        return [];
      }
    }
  
    function updateCartCount() {
  
      const cart = getCart();
  
      const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);
  
      const els = document.querySelectorAll("#cart-count, #cartCount");
  
      els.forEach(el => {
        el.textContent = count;
      });
  
    }
  
    // update when page loads
    document.addEventListener("DOMContentLoaded", updateCartCount);
  
    // update when cart changes in another tab
    window.addEventListener("storage", function (e) {
      if (e.key === cartKey) {
        updateCartCount();
      }
    });
  
    // expose function globally (so other scripts can call it)
    window.updateCartCountGlobal = updateCartCount;
  
  })();