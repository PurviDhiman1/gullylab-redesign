// Dropdown open/close (desktop)
document.querySelectorAll("[data-dd]").forEach(dd => {
    const btn = dd.querySelector(".gl-dd-btn");
    btn?.addEventListener("click", () => {
      const open = dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  
    document.addEventListener("click", (e) => {
      if (!dd.contains(e.target)) {
        dd.classList.remove("open");
        btn?.setAttribute("aria-expanded", "false");
      }
    });
  });
  
  // Mobile drawer
  const burger = document.getElementById("glBurger");
  const drawer = document.getElementById("glDrawer");
  
  burger?.addEventListener("click", () => {
    const isOpen = drawer.classList.toggle("show");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    drawer.setAttribute("aria-hidden", isOpen ? "false" : "true");
  });
  
  // Highlights rail arrows
  const rail = document.getElementById("rail");
  document.querySelectorAll("[data-scroll]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!rail) return;
      const dir = btn.getAttribute("data-scroll");
      const amount = Math.round(rail.clientWidth * 0.85);
      rail.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    });
  });