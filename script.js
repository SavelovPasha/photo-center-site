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
const generatedMessage = document.querySelector("#generatedMessage");
const orderMessageInput = document.querySelector("#orderMessageInput");
const copyOrder = document.querySelector("#copyOrder");
const copyStatus = document.querySelector("#copyStatus");

let activeFilter = "all";

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
  generatedMessage.textContent = message;
  orderMessageInput.value = message;
  if (clearStatus) {
    copyStatus.textContent = "";
  }
}

[orderName, orderPhone, orderService, orderDetails, orderTime].forEach((field) => {
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

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  copyStatus.classList.remove("error");

  if (!orderName.value.trim() || !orderPhone.value.trim()) {
    copyStatus.classList.add("error");
    copyStatus.textContent = "Заполните имя и телефон, чтобы оставить заявку.";
    return;
  }

  saveLead();
  updateOrderMessage();
  copyStatus.textContent = "Отправляем заявку...";

  try {
    const response = await fetch(orderForm.action, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: new FormData(orderForm),
    });

    if (!response.ok) {
      throw new Error("Form submit failed");
    }

    orderForm.reset();
    updateOrderMessage(false);
    copyStatus.textContent = "Заявка принята. Мы скоро свяжемся с вами.";
  } catch (error) {
    copyStatus.classList.add("error");
    copyStatus.textContent = "Не получилось отправить. Откройте сайт через localhost или попробуйте после публикации сайта.";
  }
});

copyOrder.addEventListener("click", async () => {
  const message = buildOrderMessage();
  copyStatus.classList.remove("error");

  try {
    await navigator.clipboard.writeText(message);
    copyStatus.textContent = "Готово, текст скопирован.";
  } catch (error) {
    generatedMessage.focus();
    copyStatus.textContent = "Можно выделить текст вручную и отправить в VK.";
  }
});
