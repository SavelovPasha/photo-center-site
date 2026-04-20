const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".price-card");
const serviceCards = document.querySelectorAll(".service-card[data-target-filter]");
const searchInput = document.querySelector("#priceSearch");
const actionMenus = document.querySelectorAll(".header-menu, .action-menu");
const orderForm = document.querySelector("#orderForm");
const mobileSticky = document.querySelector(".mobile-sticky");
const contactSection = document.querySelector(".contact-section");
const orderName = document.querySelector("#orderName");
const orderPhone = document.querySelector("#orderPhone");
const orderService = document.querySelector("#orderService");
const orderDetails = document.querySelector("#orderDetails");
const orderTime = document.querySelector("#orderTime");
const orderMessageInput = document.querySelector("#orderMessageInput");
const orderRedirect = document.querySelector("#orderRedirect");
const copyStatus = document.querySelector("#copyStatus");
const priceFilterStatus = document.querySelector("#priceFilterStatus");
const priceEmptyMessage = document.querySelector("#priceEmptyMessage");
const serviceChoiceButtons = document.querySelectorAll("[data-service-choice]");

let activeFilter = "all";

const filterLabels = {
  all: "все разделы прайса",
  photo: "раздел «Фотоуслуги»",
  docs: "раздел «Фото на документы»",
  digital: "раздел «Оцифровка и сканирование»",
  print: "раздел «Ксерокопии и распечатка»",
  binding: "раздел «Брошюровка»",
  lamination: "раздел «Ламинирование»",
  paper: "раздел «Плотная бумага»",
  sticker: "раздел «Самоклеящаяся бумага»",
  gifts: "раздел «Сувенирная печать»",
};

function updateMobileStickyVisibility() {
  if (!mobileSticky) {
    return;
  }

  const reachedContacts =
    contactSection &&
    contactSection.getBoundingClientRect().top <= window.innerHeight - 120;
  const shouldShow = window.innerWidth <= 760 && window.scrollY > 260 && !reachedContacts;
  mobileSticky.classList.toggle("is-visible", shouldShow);
}

function closeActionMenu(menu) {
  menu.classList.remove("open");
  const toggle = menu.querySelector(".header-menu-toggle, .action-menu-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }
}

actionMenus.forEach((menu) => {
  const toggle = menu.querySelector(".header-menu-toggle, .action-menu-toggle");
  const links = menu.querySelectorAll(".header-menu-dropdown a, .action-menu-dropdown a");

  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));

    actionMenus.forEach((otherMenu) => {
      if (otherMenu !== menu) {
        closeActionMenu(otherMenu);
      }
    });
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      closeActionMenu(menu);
    });
  });
});

document.addEventListener("click", (event) => {
  actionMenus.forEach((menu) => {
    if (!menu.contains(event.target)) {
      closeActionMenu(menu);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    actionMenus.forEach((menu) => closeActionMenu(menu));
  }
});

updateMobileStickyVisibility();
window.addEventListener("scroll", updateMobileStickyVisibility, { passive: true });
window.addEventListener("resize", updateMobileStickyVisibility);

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
  if (priceFilterStatus) {
    priceFilterStatus.textContent =
      activeFilter === "all"
        ? "Показаны все разделы прайса."
        : `Показаны цены по выбранной услуге: ${filterLabels[activeFilter] || "выбранный раздел"}.`;
  }
  applyFilters();
}

function selectOrderService(serviceName) {
  if (!serviceName || !orderService) {
    return;
  }

  const option = Array.from(orderService.options).find((item) => item.value === serviceName);
  if (!option) {
    return;
  }

  orderService.value = serviceName;
  syncServiceChoiceButtons();
  updateOrderMessage();
}

function syncServiceChoiceButtons() {
  serviceChoiceButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.serviceChoice === orderService.value);
  });
}

function normalize(value) {
  return value.toLowerCase().replaceAll("ё", "е").trim();
}

function applyFilters() {
  const query = normalize(searchInput.value);
  let visibleCount = 0;

  cards.forEach((card) => {
    const categories = card.dataset.category.split(/\s+/);
    const categoryMatch = activeFilter === "all" || categories.includes(activeFilter);
    const textMatch = normalize(card.textContent).includes(query);
    const isHidden = !categoryMatch || !textMatch;
    card.classList.toggle("hidden", isHidden);
    if (!isHidden) {
      visibleCount += 1;
    }
  });

  if (priceEmptyMessage) {
    priceEmptyMessage.classList.toggle("is-visible", visibleCount === 0);
  }
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
    selectOrderService(card.dataset.orderService);
    document.querySelector("#prices").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

serviceChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectOrderService(button.dataset.serviceChoice);
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

[orderName, orderDetails, orderTime].forEach((field) => {
  field.addEventListener("input", updateOrderMessage);
});

orderService.addEventListener("input", () => {
  syncServiceChoiceButtons();
  updateOrderMessage();
});

syncServiceChoiceButtons();

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
