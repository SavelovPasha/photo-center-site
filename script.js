const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".price-card");
const serviceCards = document.querySelectorAll(".service-card[data-target-filter]");
const searchInput = document.querySelector("#priceSearch");
const orderForm = document.querySelector("#orderForm");
const orderName = document.querySelector("#orderName");
const orderPhone = document.querySelector("#orderPhone");
const orderService = document.querySelector("#orderService");
const orderDetails = document.querySelector("#orderDetails");
const orderTime = document.querySelector("#orderTime");
const orderMessageInput = document.querySelector("#orderMessageInput");
const orderRedirect = document.querySelector("#orderRedirect");
const copyStatus = document.querySelector("#copyStatus");

let activeFilter = "all";

function formatPhoneValue(value) {
  const digits = value.replace(/\D/g, "");
  let normalized = digits;

  if (!normalized.length) {
    return "+7 ";
  }

  if (normalized.startsWith("8")) {
    normalized = "7" + normalized.slice(1);
  } else if (!normalized.startsWith("7")) {
    normalized = "7" + normalized;
  }

  normalized = normalized.slice(0, 11);
  const local = normalized.slice(1);

  let result = "+7";

  if (local.length > 0) {
    result += " " + local.slice(0, 3);
  }
  if (local.length >= 4) {
    result += " " + local.slice(3, 6);
  }
  if (local.length >= 7) {
    result += "-" + local.slice(6, 8);
  }
  if (local.length >= 9) {
    result += "-" + local.slice(8, 10);
  }

  return result;
}

function setPriceFilter(filter) {
  activeFilter = filter;
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === activeFilter);
  });
  applyFilters();
}

function normalize(value) {
  return value.toLowerCase().replaceAll("ё", "е").trim();
}

function applyFilters() {
  const query = normalize(searchInput.value);

  cards.forEach((card) => {
    const categoryMatch = activeFilter === "all" || card.dataset.category.includes(activeFilter);
    const textMatch = normalize(card.textContent).includes(query);
    card.classList.toggle("hidden", !categoryMatch || !textMatch);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setPriceFilter(tab.dataset.filter);
  });
});

searchInput.addEventListener("input", applyFilters);

if (orderRedirect) {
  orderRedirect.value = new URL("thanks.html", window.location.href).href;
}

orderPhone.addEventListener("focus", () => {
  if (!orderPhone.value.trim()) {
    orderPhone.value = "+7 ";
  }
});

orderPhone.addEventListener("input", () => {
  orderPhone.value = formatPhoneValue(orderPhone.value);
  updateOrderMessage();
});

orderPhone.addEventListener("blur", () => {
  if (orderPhone.value.trim() === "+7") {
    orderPhone.value = "";
    updateOrderMessage();
  }
});

serviceCards.forEach((card) => {
  card.addEventListener("click", () => {
    const filter = card.dataset.targetFilter || "all";
    setPriceFilter(filter);
    document.querySelector("#prices").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function buildOrderMessage() {
  const name = orderName.value.trim() || "не указано";
  const phone = orderPhone.value.trim() || "не указан";
  const service = orderService.value;
  const details = orderDetails.value.trim() || "уточню в сообщениях";
  const time = orderTime.value.trim() || "уточню в сообщениях";

  return `Здравствуйте! Хочу оставить заявку. Имя: ${name}. Телефон: ${phone}. Услуга: ${service}. Детали: ${details}. Забрать удобно: ${time}.`;
}

function updateOrderMessage(clearStatus = true) {
  const message = buildOrderMessage();
  orderMessageInput.value = message;
  if (clearStatus) {
    copyStatus.textContent = "";
  }
}

[orderName, orderService, orderDetails, orderTime].forEach((field) => {
  field.addEventListener("input", updateOrderMessage);
});

function saveLead() {
  const leads = JSON.parse(localStorage.getItem("fotochkaLeads") || "[]");
  const lead = {
    name: orderName.value.trim(),
    phone: orderPhone.value.trim(),
    service: orderService.value,
    details: orderDetails.value.trim(),
    pickupTime: orderTime.value.trim(),
    createdAt: new Date().toISOString(),
  };

  leads.unshift(lead);
  localStorage.setItem("fotochkaLeads", JSON.stringify(leads.slice(0, 30)));
}

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  copyStatus.classList.remove("error");

  if (!orderName.value.trim() || !orderPhone.value.trim()) {
    copyStatus.classList.add("error");
    copyStatus.textContent = "Заполните имя и телефон, чтобы оставить заявку.";
    return;
  }

  saveLead();
  updateOrderMessage();
  HTMLFormElement.prototype.submit.call(orderForm);
});
