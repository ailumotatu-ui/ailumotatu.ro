(function () {
  "use strict";

  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  function closeMenu(returnFocus) {
    if (!toggle || !mobileMenu) return;
    mobileMenu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Deschide meniul");
    toggle.textContent = "☰";
    document.body.classList.remove("menu-open");
    if (returnFocus) toggle.focus();
  }

  function openMenu() {
    if (!toggle || !mobileMenu) return;
    mobileMenu.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Închide meniul");
    toggle.textContent = "×";
    document.body.classList.add("menu-open");
    const firstLink = mobileMenu.querySelector("a");
    if (firstLink) firstLink.focus();
  }

  if (toggle && mobileMenu) {
    toggle.addEventListener("click", function () {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeMenu(false);
      else openMenu();
    });

    mobileMenu.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeMenu(true);
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) closeMenu(false);
    });
  }

  document.querySelectorAll("[data-fulfillment-group]").forEach(function (group) {
    const form = group.closest("form");
    const addressWrap = form ? form.querySelector("[data-address-wrap]") : null;
    const addressInput = addressWrap ? addressWrap.querySelector("input, textarea") : null;

    function syncAddress() {
      const selected = group.querySelector("input:checked");
      const needsAddress = selected && selected.value === "Livrare";
      if (addressWrap) addressWrap.hidden = !needsAddress;
      if (addressInput) addressInput.required = Boolean(needsAddress);
      form?.dispatchEvent(new CustomEvent("orderchange"));
    }

    group.addEventListener("change", syncAddress);
    syncAddress();
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, "0"),
    String(tomorrow.getDate()).padStart(2, "0")
  ].join("-");

  document.querySelectorAll("input[data-min-tomorrow]").forEach(function (input) {
    input.min = tomorrowIso;
  });

  document.querySelectorAll("[data-current-year]").forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });
})();
