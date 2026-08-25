(function () {
  "use strict";

  const WHATSAPP_NUMBER = "40736063522";
  const FREE_DELIVERY_FROM = 100;
  const DELIVERY_FEE = 10;

  const memorialChoices = {
    dulce: {
      price: 40,
      label: "Meniu de dulce",
      first: [
        "Ciorbă de pui",
        "Ciorbă de porc",
        "Ciorbă de fasole cu afumătură",
        "Ciorbă a la grec",
        "Ciorbă de burtă",
        "Ciorbă de perișoare",
        "Ciorbă de cartofi cu afumătură",
        "Saramură de pește"
      ],
      second: [
        "Sarmale cu mămăligă",
        "Fasole cu ciolan și cârnați",
        "Ceafă de porc la grătar cu cartofi țărănești",
        "Pulpă de pui dezosată la grătar cu cartofi țărănești",
        "Pulpă de pui la cuptor cu pilaf de orez cu legume și salată de varză",
        "Ardei umplut"
      ],
      dessert: [
        "Negresă",
        "Prăjitură cu gem",
        "Prăjitură cu fructe",
        "Cremă de zahăr ars",
        "Plăcintă cu brânză",
        "Plăcintă cu mere și scorțișoară"
      ]
    },
    post: {
      price: 37,
      label: "Meniu de post",
      first: [
        "Ciorbă de legume",
        "Ciorbă de fasole",
        "Supă cremă de legume"
      ],
      second: [
        "Sarmale de post",
        "Iahnie de fasole",
        "Hummus",
        "Șnițel de soia cu piure de cartofi",
        "Saramură de pește",
        "Pește prăjit cu mămăligă",
        "Pește la cuptor",
        "Pește la alegere"
      ],
      dessert: [
        "Negresă de post",
        "Prăjitură cu gem",
        "Plăcintă cu mere și scorțișoară"
      ]
    }
  };

  function money(value) {
    return new Intl.NumberFormat("ro-RO", {
      maximumFractionDigits: 0,
      style: "currency",
      currency: "RON"
    }).format(value);
  }

  function selectedValue(form, name) {
    const selected = form.querySelector(`[name="${name}"]:checked`);
    return selected ? selected.value : "";
  }

  function deliveryFee(subtotal, fulfillment) {
    if (fulfillment !== "Livrare" || subtotal >= FREE_DELIVERY_FROM) return 0;
    return subtotal > 0 ? DELIVERY_FEE : 0;
  }

  function setSummary(form, subtotal, fulfillment) {
    const fee = deliveryFee(subtotal, fulfillment);
    const total = subtotal + fee;
    const subtotalNode = document.querySelector(`[data-summary-for="${form.id}"] [data-subtotal]`);
    const deliveryNode = document.querySelector(`[data-summary-for="${form.id}"] [data-delivery-fee]`);
    const totalNode = document.querySelector(`[data-summary-for="${form.id}"] [data-total]`);

    if (subtotalNode) subtotalNode.textContent = money(subtotal);
    if (deliveryNode) {
      deliveryNode.textContent = fulfillment === "Ridicare"
        ? "0 lei — ridicare"
        : fee === 0 && subtotal >= FREE_DELIVERY_FROM
          ? "Gratuit"
          : money(fee);
    }
    if (totalNode) totalNode.textContent = money(total);

    return { fee, total };
  }

  function commonDetails(form) {
    const fulfillment = selectedValue(form, "fulfillment");
    const addressInput = form.querySelector("[name=address]");
    const details = {
      fulfillment,
      address: addressInput ? addressInput.value.trim() : "",
      name: form.elements.customerName.value.trim(),
      phone: form.elements.phone.value.trim(),
      desiredDate: form.elements.desiredDate ? form.elements.desiredDate.value : "",
      desiredTime: form.elements.desiredTime ? form.elements.desiredTime.value : "",
      notes: form.elements.notes ? form.elements.notes.value.trim() : ""
    };
    return details;
  }

  function appendCommon(lines, details) {
    if (details.desiredDate) lines.push(`Data dorită: ${details.desiredDate}`);
    if (details.desiredTime) lines.push(`Ora dorită: ${details.desiredTime}`);
    lines.push(`Modalitate: ${details.fulfillment}`);
    if (details.fulfillment === "Livrare") lines.push(`Adresă: ${details.address}`);
    lines.push(`Nume: ${details.name}`);
    lines.push(`Telefon: ${details.phone}`);
    if (details.notes) lines.push(`Observații: ${details.notes}`);
  }

  function appendTotals(lines, subtotal, fee, total, fulfillment) {
    lines.push("");
    lines.push(`Subtotal: ${money(subtotal)}`);
    if (fulfillment === "Livrare") {
      lines.push(`Transport: ${fee === 0 ? "gratuit" : money(fee)}`);
    }
    lines.push(`TOTAL ESTIMAT: ${money(total)}`);
    lines.push("");
    lines.push("Știu că această comandă devine confirmată numai după răspunsul Ai lu’ Moțatu.");
  }

  function openWhatsApp(lines) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = url;
  }

  function showError(form, message) {
    const error = form.querySelector("[data-form-error]");
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
    if (message) error.focus();
  }

  function validateForm(form) {
    showError(form, "");
    if (!form.checkValidity()) {
      form.reportValidity();
      return false;
    }
    return true;
  }

  function validateAdvance(form, hours) {
    const dateInput = form.elements.desiredDate;
    const timeInput = form.elements.desiredTime;
    if (!dateInput || !timeInput || !dateInput.value || !timeInput.value) return true;

    const requestedAt = new Date(`${dateInput.value}T${timeInput.value}:00`);
    const earliest = new Date(Date.now() + hours * 60 * 60 * 1000);
    if (Number.isNaN(requestedAt.getTime()) || requestedAt >= earliest) return true;

    showError(form, `Alege o dată și o oră aflate la cel puțin ${hours} de ore de acum.`);
    return false;
  }

  function validateDailyOrderWindow(form) {
    const now = new Date();
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const isWeekday = day >= 1 && day <= 5;
    const isInTimeRange = minutes >= 7 * 60 && minutes <= 12 * 60;
    if (isWeekday && isInTimeRange) return true;

    showError(form, "Comenzile pentru meniul zilei se primesc de luni până vineri, între 07:00 și 12:00.");
    return false;
  }

  function setupDailyMenu(form) {
    function calculate() {
      const quantity = Math.max(1, Number(form.elements.quantity.value) || 1);
      const subtotal = quantity * 35;
      const fulfillment = selectedValue(form, "fulfillment");
      return { subtotal, fulfillment, ...setSummary(form, subtotal, fulfillment) };
    }

    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    form.addEventListener("orderchange", calculate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateForm(form)) return;
      if (!validateDailyOrderWindow(form)) return;

      const result = calculate();
      const quantity = Number(form.elements.quantity.value);
      const details = commonDetails(form);
      const lines = [
        "Bună ziua! Doresc să comand MENIUL ZILEI de la Ai lu’ Moțatu:",
        "",
        `Felul I: ${form.elements.firstCourse.value.trim()}`,
        `Felul II: ${form.elements.secondCourse.value.trim()}`,
        `Desert: ${form.elements.dessert.value.trim()}`,
        "Chiflă caldă: inclusă",
        `Cantitate: ${quantity} ${quantity === 1 ? "porție" : "porții"} × 35 lei`,
        ""
      ];
      appendCommon(lines, details);
      appendTotals(lines, result.subtotal, result.fee, result.total, details.fulfillment);
      openWhatsApp(lines);
    });

    calculate();
  }

  function setupPlatters(form) {
    const itemRows = Array.from(form.querySelectorAll("[data-order-item]"));

    function selectedItems() {
      return itemRows.map(function (row) {
        const quantity = Number(row.querySelector("select").value) || 0;
        return {
          name: row.dataset.name,
          price: Number(row.dataset.price),
          quantity
        };
      }).filter(function (item) {
        return item.quantity > 0;
      });
    }

    function calculate() {
      const items = selectedItems();
      const subtotal = items.reduce(function (sum, item) {
        return sum + item.price * item.quantity;
      }, 0);
      const fulfillment = selectedValue(form, "fulfillment");
      return { items, subtotal, fulfillment, ...setSummary(form, subtotal, fulfillment) };
    }

    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    form.addEventListener("orderchange", calculate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateForm(form)) return;
      if (!validateAdvance(form, 24)) return;

      const result = calculate();
      if (!result.items.length) {
        showError(form, "Alege cel puțin un platou înainte de trimiterea comenzii.");
        return;
      }

      const details = commonDetails(form);
      const lines = [
        "Bună ziua! Doresc să comand PLATOURI de la Ai lu’ Moțatu:",
        ""
      ];
      result.items.forEach(function (item) {
        lines.push(`${item.quantity} × ${item.name} — ${money(item.price * item.quantity)}`);
      });
      lines.push("");
      appendCommon(lines, details);
      appendTotals(lines, result.subtotal, result.fee, result.total, details.fulfillment);
      openWhatsApp(lines);
    });

    calculate();
  }

  function fillSelect(select, values) {
    const current = select.value;
    select.innerHTML = '<option value="">Alege o variantă</option>';
    values.forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if (values.includes(current)) select.value = current;
  }

  function setupMemorial(form) {
    const typeSelect = form.elements.menuType;
    const firstSelect = form.elements.firstCourse;
    const secondSelect = form.elements.secondCourse;
    const dessertSelect = form.elements.dessert;

    function syncChoices() {
      const menu = memorialChoices[typeSelect.value] || memorialChoices.dulce;
      fillSelect(firstSelect, menu.first);
      fillSelect(secondSelect, menu.second);
      fillSelect(dessertSelect, menu.dessert);
      calculate();
    }

    function calculate() {
      const menu = memorialChoices[typeSelect.value] || memorialChoices.dulce;
      const packs = Math.max(1, Number(form.elements.quantity.value) || 1);
      const bread = Math.max(0, Number(form.elements.breadQuantity.value) || 0);
      const coliva = Math.max(0, Number(form.elements.colivaQuantity.value) || 0);
      const subtotal = menu.price * packs + bread * 2 + coliva * 75;
      const fulfillment = selectedValue(form, "fulfillment");
      return { menu, packs, bread, coliva, subtotal, fulfillment, ...setSummary(form, subtotal, fulfillment) };
    }

    typeSelect.addEventListener("change", syncChoices);
    form.addEventListener("input", calculate);
    form.addEventListener("change", calculate);
    form.addEventListener("orderchange", calculate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateForm(form)) return;
      if (!validateAdvance(form, 24)) return;

      const result = calculate();
      const details = commonDetails(form);
      const lines = [
        "Bună ziua! Doresc să comand un MENIU PENTRU POMANĂ / PARASTAS de la Ai lu’ Moțatu:",
        "",
        `Tip: ${result.menu.label}`,
        `Felul I: ${firstSelect.value}`,
        `Felul II: ${secondSelect.value}`,
        `Desert: ${dessertSelect.value}`,
        `Pachete: ${result.packs} × ${money(result.menu.price)}`
      ];
      if (result.bread) lines.push(`Chifle de casă: ${result.bread} × 2 lei`);
      if (result.coliva) lines.push(`Colivă mare: ${result.coliva} × 75 lei`);
      lines.push("");
      appendCommon(lines, details);
      appendTotals(lines, result.subtotal, result.fee, result.total, details.fulfillment);
      openWhatsApp(lines);
    });

    syncChoices();
  }

  document.querySelectorAll("form[data-order-type]").forEach(function (form) {
    const type = form.dataset.orderType;
    if (type === "daily") setupDailyMenu(form);
    if (type === "platters") setupPlatters(form);
    if (type === "memorial") setupMemorial(form);
  });
})();
