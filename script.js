const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".price-card");
const priceTableCards = document.querySelectorAll(".price-table-card");
const serviceCards = document.querySelectorAll(".service-card[data-target-filter]");
const searchInput = document.querySelector("#priceSearch");
const actionMenus = document.querySelectorAll(".header-menu, .action-menu, .header-nav-menu");
const orderForm = document.querySelector("#orderForm");
const mobileSticky = document.querySelector(".mobile-sticky");
const contactSection = document.querySelector(".contact-section");
const priceSection = document.querySelector(".price-section");
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
const scrollTopButton = document.querySelector("#scrollTopButton");
const calcCategory = document.querySelector("#calcCategory");
const calcFields = document.querySelector("#calcFields");
const calcAddItem = document.querySelector("#calcAddItem");
const calcReplaceItem = document.querySelector("#calcReplaceItem");
const calcBuilderNote = document.querySelector("#calcBuilderNote");
const calcReviewPromo = document.querySelector("#calcReviewPromo");
const calcPreviewMeta = document.querySelector("#calcPreviewMeta");
const calcPreviewTitle = document.querySelector("#calcPreviewTitle");
const calcPreviewDescription = document.querySelector("#calcPreviewDescription");
const calcPreviewTotal = document.querySelector("#calcPreviewTotal");
const calcPreviewBadges = document.querySelector("#calcPreviewBadges");
const calcCartBadge = document.querySelector("#calcCartBadge");
const calcCartTotal = document.querySelector("#calcCartTotal");
const calcCartSummary = document.querySelector("#calcCartSummary");
const calcCartList = document.querySelector("#calcCartList");
const calcCartEmpty = document.querySelector("#calcCartEmpty");
const calcCartSubtotal = document.querySelector("#calcCartSubtotal");
const calcCartDiscounts = document.querySelector("#calcCartDiscounts");
const calcCartGrandTotal = document.querySelector("#calcCartGrandTotal");
const calcCartMeta = document.querySelector("#calcCartMeta");
const calcCartInsights = document.querySelector("#calcCartInsights");
const calcCartAppliedDiscounts = document.querySelector("#calcCartAppliedDiscounts");
const calcCartSavingsTips = document.querySelector("#calcCartSavingsTips");
const calcCartNote = document.querySelector("#calcCartNote");
const calcCartTransfer = document.querySelector("#calcCartTransfer");
const calcCartClear = document.querySelector("#calcCartClear");
const calcToast = document.querySelector("#calcToast");
const cookieBanner = document.querySelector("#cookieBanner");
const cookieBannerAccept = document.querySelector("#cookieBannerAccept");

let activeFilter = "all";
let calculatorToastTimer = null;

function setPriceCardOpen(card, isOpen) {
  if (!card) {
    return;
  }

  const toggle = card.querySelector(".price-card-toggle");
  const body = card.querySelector(".price-card-body");
  if (!toggle || !body) {
    return;
  }

  card.classList.toggle("is-open", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));
  body.hidden = !isOpen;
}

function closePriceCards() {
  priceTableCards.forEach((card) => setPriceCardOpen(card, false));
}

function setPriceSubcategoryOpen(row, isOpen) {
  if (!row) {
    return;
  }

  const button = row.querySelector(".price-subcategory-toggle");
  const rows = row._subcategoryRows || [];
  row.classList.toggle("is-open", isOpen);
  if (button) {
    button.setAttribute("aria-expanded", String(isOpen));
  }
  rows.forEach((item) => {
    item.hidden = !isOpen;
  });
}

function setPriceSubcategoriesOpen(card, isOpen) {
  if (!card) {
    return;
  }

  card.querySelectorAll(".price-subcategory-row").forEach((row) => {
    setPriceSubcategoryOpen(row, isOpen);
  });
}

function resetPriceExpansion() {
  closePriceCards();
  priceTableCards.forEach((card) => setPriceSubcategoriesOpen(card, false));
}

function closeSiblingPriceCards(activeCard) {
  priceTableCards.forEach((card) => {
    if (card !== activeCard) {
      setPriceCardOpen(card, false);
    }
  });
}

function closeSiblingSubcategories(activeRow) {
  const tbody = activeRow?.parentElement;
  if (!tbody) {
    return;
  }

  tbody.querySelectorAll(".price-subcategory-row").forEach((row) => {
    if (row !== activeRow) {
      setPriceSubcategoryOpen(row, false);
    }
  });
}

function keepPriceItemInView(element) {
  if (!element) {
    return;
  }

  window.requestAnimationFrame(() => {
    const rect = element.getBoundingClientRect();
    const topLimit = 88;
    const bottomLimit = window.innerHeight - 80;
    if (rect.top < topLimit || rect.top > bottomLimit) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function setupPriceSubcategories() {
  document.querySelectorAll(".price-table").forEach((table, tableIndex) => {
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    rows.forEach((row, rowIndex) => {
      if (!row.classList.contains("price-subcategory-row")) {
        return;
      }

      const cell = row.querySelector("td");
      if (!cell) {
        return;
      }

      const title = cell.textContent.trim();
      let button = cell.querySelector(".price-subcategory-toggle");
      if (!button) {
        button = document.createElement("button");
        button.className = "price-subcategory-toggle";
        button.type = "button";
        button.textContent = title;
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", `price-subcategory-${tableIndex}-${rowIndex}`);
        cell.textContent = "";
        cell.append(button);
      }

      const items = [];
      let sibling = row.nextElementSibling;
      while (sibling && !sibling.classList.contains("price-subcategory-row")) {
        sibling.classList.add("price-subcategory-item");
        sibling.dataset.subcategoryOwner = button.getAttribute("aria-controls");
        items.push(sibling);
        sibling = sibling.nextElementSibling;
      }

      row._subcategoryRows = items;
      button.addEventListener("click", () => {
        const nextOpen = !row.classList.contains("is-open");
        if (nextOpen) {
          closeSiblingSubcategories(row);
        }
        setPriceSubcategoryOpen(row, nextOpen);
        if (nextOpen) {
          keepPriceItemInView(row);
        }
      });
      setPriceSubcategoryOpen(row, false);
    });
  });
}

function syncPriceTableLabels() {
  document.querySelectorAll(".price-table").forEach((table) => {
    const labels = Array.from(table.querySelectorAll("thead th")).map((cell) =>
      cell.textContent.trim()
    );

    table.querySelectorAll("tbody tr").forEach((row) => {
      row.querySelectorAll("td").forEach((cell, index) => {
        if (labels[index]) {
          cell.dataset.label = labels[index];
        }
      });
    });
  });
}

const filterLabels = {
  all: "все разделы прайса",
  photo: "раздел «Печать фото»",
  docs: "раздел «Фото на документы»",
  digital: "раздел «Оцифровка»",
  scan: "раздел «Сканирование»",
  print: "раздел «Ксерокопии и распечатка»",
  binding: "раздел «Брошюровка»",
  lamination: "раздел «Ламинирование»",
  paper: "раздел «Плотная бумага»",
  sticker: "раздел «Самоклеющаяся бумага»",
  gifts: "раздел «Сувенирная печать»",
};

function initializeCalculatorFoundation() {
  const calculatorData = window.photoCenterCalculatorData;

  if (!calculatorData || !Array.isArray(calculatorData.categories)) {
    console.warn("Calculator foundation: data source is missing.");
    return;
  }

  const categoriesById = Object.fromEntries(
    calculatorData.categories.map((category) => [category.id, category])
  );
  const servicesById = {};
  const manualPromosById = Object.fromEntries(
    (calculatorData.manualPromos || []).map((promo) => [promo.id, promo])
  );
  const autoDiscountsById = Object.fromEntries(
    (calculatorData.autoDiscounts || []).map((discount) => [discount.id, discount])
  );
  const missingFieldWarnings = [];

  calculatorData.categories.forEach((category) => {
    if (!Array.isArray(category.services)) {
      missingFieldWarnings.push(`Категория ${category.id} не содержит массива services.`);
      return;
    }

    category.services.forEach((service) => {
      const requiredFields = [
        "id",
        "category",
        "title",
        "pricingMode",
        "options",
        "tiers",
        "adjustments",
        "manualPromos",
        "notes",
      ];

      requiredFields.forEach((field) => {
        if (!(field in service)) {
          missingFieldWarnings.push(`Услуга ${service.id || category.id} не содержит поле ${field}.`);
        }
      });

      servicesById[service.id] = service;
    });
  });

  window.photoCenterCalculatorFoundation = {
    data: calculatorData,
    lookups: {
      categoriesById,
      servicesById,
      manualPromosById,
      autoDiscountsById,
    },
  };

  if (missingFieldWarnings.length) {
    console.warn("Calculator foundation: validation warnings.", missingFieldWarnings);
    return;
  }

  console.info(
    `Calculator foundation ready: ${calculatorData.categories.length} categories, ${Object.keys(
      servicesById
    ).length} services.`
  );
}

initializeCalculatorFoundation();

syncPriceTableLabels();

const calculatorCategoryLabels = {
  photo: "Печать фото",
  docs: "Фото на документы",
  scan: "Сканирование",
  print: "Ксерокопии и распечатка",
  digital: "Оцифровка",
  binding: "Брошюровка",
  gifts: "Сувенирная печать",
  paper: "Плотная бумага",
  sticker: "Самоклеющаяся бумага",
  lamination: "Ламинирование",
  frames: "Рамки",
};

let calculatorCart = [];
let calculatorItemId = 0;

function formatRubles(value) {
  return `${Math.round(value)} ₽`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isReviewPromoEnabled() {
  return calcReviewPromo?.value === "yes";
}

function showCalculatorToast(message) {
  if (!calcToast) {
    return;
  }

  calcToast.textContent = message;
  calcToast.classList.add("is-visible");

  if (calculatorToastTimer) {
    window.clearTimeout(calculatorToastTimer);
  }

  calculatorToastTimer = window.setTimeout(() => {
    calcToast.classList.remove("is-visible");
  }, 2400);
}

function hasExactPrice(value) {
  return Number.isFinite(value);
}

function getFilmModeLabel(mode) {
  const normalized = String(mode || "").trim().toLowerCase();

  if (normalized === "budget") {
    return "Бюджетный режим";
  }

  if (normalized === "standard") {
    return "Стандартный режим";
  }

  if (normalized === "max") {
    return "Максимальный режим";
  }

  return mode || "";
}

function findPriceTier(tiers, quantity) {
  return (tiers || []).find((tier) => {
    if (tier.min != null && quantity < tier.min) {
      return false;
    }

    if (tier.max != null && quantity > tier.max) {
      return false;
    }

    return true;
  });
}

function findNextPriceTier(tiers, quantity) {
  return (tiers || []).find((tier) => tier.min != null && tier.min > quantity) || null;
}

function calculateTieredUnitPrice(option, quantity) {
  if (!option) {
    return null;
  }

  if (option.pricingMode === "fixed") {
    return {
      unitPrice: option.price || 0,
      tierLabel: "Фиксированная цена",
    };
  }

  if (option.pricingMode !== "tiered") {
    return null;
  }

  const matchedTier = findPriceTier(option.tiers, quantity);
  if (!matchedTier) {
    return null;
  }

  return {
    unitPrice: matchedTier.price || 0,
    tierLabel: matchedTier.label || "Тиражный тариф",
    matchedTier,
    nextTier: findNextPriceTier(option.tiers, quantity),
  };
}

function buildNextTierHint(priceData, quantity, unitLabel = "шт.") {
  if (!priceData?.nextTier || priceData.nextTier.min == null) {
    return null;
  }

  return {
    remaining: Math.max(0, priceData.nextTier.min - quantity),
    threshold: priceData.nextTier.min,
    label: priceData.nextTier.label || "",
    unitPrice: priceData.nextTier.price || 0,
    unitLabel,
  };
}

function getBaseTierPrice(option) {
  if (!option) {
    return null;
  }

  if (option.pricingMode === "tiered") {
    return option.tiers?.[0]?.price ?? null;
  }

  if (option.pricingMode === "fixed") {
    return option.price ?? null;
  }

  return null;
}

function getServicesById() {
  return window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
}

function getPhotoService() {
  return window.photoCenterCalculatorFoundation?.lookups?.servicesById?.photo_print_standard || null;
}

function getLaminationService() {
  return window.photoCenterCalculatorFoundation?.lookups?.servicesById?.lamination_main || null;
}

function getDocsServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    main: servicesById.documents_main_sets || null,
    ready: servicesById.documents_ready_pack || null,
    extra: servicesById.documents_extra_pack || null,
    addons: servicesById.documents_addons || null,
  };
}

function getScanServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    document: servicesById.document_scanning || null,
    fileSend: servicesById.file_send || null,
    photo: servicesById.photo_scan_a4_600dpi || null,
    processed: servicesById.photo_digitization_processed || null,
  };
}

function getPrintServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    copyA4: servicesById.copy_a4 || null,
    extraA4: servicesById.extra_roll_a4 || null,
    printA4: servicesById.print_a4 || null,
    printA3: servicesById.print_a3 || null,
    extraA3: servicesById.extra_roll_a3 || null,
    fill: servicesById.print_fill_adjustment || null,
  };
}

function getDigitalServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    video: servicesById.video_digitization || null,
    filmDigitization: servicesById.film_digitization || null,
    filmProcessing: servicesById.film_processing || null,
    filmScanning: servicesById.film_scanning || null,
    cutFrame: servicesById.cut_frame || null,
    addons: servicesById.digitization_addons || null,
  };
}

function getPaperService() {
  return window.photoCenterCalculatorFoundation?.lookups?.servicesById?.thick_paper_print || null;
}

function getBindingServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    plastic: servicesById.binding_plastic || null,
    metal: servicesById.binding_metal || null,
    sheet: servicesById.binding_sheet_replace || null,
  };
}

function getGiftServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    fixed: servicesById.gift_fixed_items || null,
    tshirts: servicesById.tshirts || null,
    magnets: servicesById.vinyl_magnets || null,
  };
}

function getStickerServices() {
  const servicesById = window.photoCenterCalculatorFoundation?.lookups?.servicesById || {};
  return {
    paper: servicesById.sticker_paper || null,
    photoPaper: servicesById.sticker_photo_paper || null,
  };
}

function getPhotoFormatGroups() {
  const service = getPhotoService();
  if (!service) {
    return [];
  }

  const groups = new Map();

  service.options.forEach((option) => {
    if (!groups.has(option.title)) {
      groups.set(option.title, []);
    }

    groups.get(option.title).push(option);
  });

  return Array.from(groups.entries()).map(([format, options]) => ({
    format,
    size: options[0]?.parameters?.size || "",
    options,
  }));
}

function getLaminationOptions() {
  return getLaminationService()?.options || [];
}

function getFrameCatalog() {
  return window.photoCenterCalculatorFoundation?.data?.referenceCatalogs?.photoFrames || {};
}

function getCalculatorCategories() {
  return [
    { id: "photo", title: "Печать фото" },
    { id: "docs", title: "Фото на документы" },
    { id: "scan", title: "Сканирование" },
    { id: "print", title: "Ксерокопии и распечатка" },
    { id: "digital", title: "Оцифровка" },
    { id: "binding", title: "Брошюровка" },
    { id: "gifts", title: "Сувенирная печать" },
    { id: "paper", title: "Плотная бумага" },
    { id: "sticker", title: "Самоклеющаяся бумага" },
    { id: "lamination", title: "Ламинирование" },
    { id: "frames", title: "Рамки" },
  ];
}

function populateCalculatorCategories() {
  if (!calcCategory) {
    return;
  }

  calcCategory.innerHTML = getCalculatorCategories()
    .map((category) => `<option value="${category.id}">${category.title}</option>`)
    .join("");
}

function renderCalculatorFields() {
  if (!calcCategory || !calcFields) {
    return;
  }

  const category = calcCategory.value || "photo";

  if (category === "photo") {
    const formatOptions = getPhotoFormatGroups()
      .map(
        (group) =>
          `<option value="${group.format}">${group.format}${group.size ? ` · ${group.size}` : ""}</option>`
      )
      .join("");

    calcFields.innerHTML = `
      <label>
        <span>Услуга</span>
        <select id="calcPhotoFormat">${formatOptions}</select>
      </label>
      <label>
        <span>Бумага или тип</span>
        <select id="calcPhotoPaper"></select>
      </label>
      <label>
        <span>Количество</span>
        <input id="calcQuantity" type="number" min="1" step="1" value="10" inputmode="numeric" />
      </label>
      <label class="calculator-toggle">
        <input id="calcPhotoCustom" type="checkbox" />
        <span>Нестандартный макет (+15 ₽ за фото)</span>
      </label>
    `;

    populatePhotoPaperField();
    return;
  }

  if (category === "docs") {
    renderDocsFields();
    return;
  }

  if (category === "scan") {
    renderScanFields();
    return;
  }

  if (category === "print") {
    renderPrintFields();
    return;
  }

  if (category === "digital") {
    renderDigitalFields();
    return;
  }

  if (category === "binding") {
    renderBindingFields();
    return;
  }

  if (category === "gifts") {
    renderGiftFields();
    return;
  }

  if (category === "paper") {
    renderPaperFields();
    return;
  }

  if (category === "sticker") {
    renderStickerFields();
    return;
  }

  if (category === "lamination") {
    const laminationOptions = getLaminationOptions()
      .map((option) => {
        const format = option.parameters?.format || option.title;
        return `<option value="${option.id}">${format}</option>`;
      })
      .join("");

    calcFields.innerHTML = `
      <label>
        <span>Услуга</span>
        <select id="calcLaminationOption">${laminationOptions}</select>
      </label>
      <label>
        <span>Количество</span>
        <input id="calcQuantity" type="number" min="1" step="1" value="1" inputmode="numeric" />
      </label>
    `;
    return;
  }

  const frameOptions = Object.entries(getFrameCatalog())
    .map(([format, price]) => `<option value="${format}">${format} · ${formatRubles(price)}</option>`)
    .join("");

  calcFields.innerHTML = `
    <label>
      <span>Услуга</span>
      <select id="calcFrameFormat">${frameOptions}</select>
    </label>
    <label>
      <span>Количество</span>
      <input id="calcQuantity" type="number" min="1" step="1" value="1" inputmode="numeric" />
    </label>
  `;
}

function renderStickerFields() {
  const stickerServices = getStickerServices();
  const stickerType = calcFields?.querySelector("#calcStickerType")?.value || "paper";
  const currentQuantity = calcFields?.querySelector("#calcStickerQuantity")?.value || "1";
  const currentService =
    stickerType === "photo" ? stickerServices.photoPaper : stickerServices.paper;
  const currentOptionId =
    calcFields?.querySelector("#calcStickerOption")?.value || currentService?.options?.[0]?.id || "";

  const typeOptions = [
    { id: "paper", title: "Самоклеющаяся бумага" },
    { id: "photo", title: "Самоклеющаяся фотобумага" },
  ];

  const formatOptions = (currentService?.options || [])
    .map((option) => {
      const format = option.parameters?.format || option.title;
      return `<option value="${option.id}"${
        currentOptionId === option.id ? " selected" : ""
      }>${format}</option>`;
    })
    .join("");

  calcFields.innerHTML = `
    <label>
      <span>Тип</span>
      <select id="calcStickerType">
        ${typeOptions
          .map(
            (option) =>
              `<option value="${option.id}"${stickerType === option.id ? " selected" : ""}>${option.title}</option>`
          )
          .join("")}
      </select>
    </label>
    <label>
      <span>Формат</span>
      <select id="calcStickerOption">${formatOptions}</select>
    </label>
    <label>
      <span>Количество</span>
      <input id="calcStickerQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
    </label>
  `;
}

function renderBindingFields() {
  const currentMode = calcFields?.querySelector("#calcBindingMode")?.value || "plastic";
  const currentSheets = calcFields?.querySelector("#calcBindingSheets")?.value || "10";
  const currentExtraSheets = calcFields?.querySelector("#calcBindingExtraSheets")?.value || "1";
  const serviceLabels = {
    plastic: "Пластиковая пружина",
    metal: "Металлическая пружина",
    sheet: "Замена / доп. лист",
  };

  calcFields.innerHTML = `
    <label>
      <span>Тип услуги</span>
      <select id="calcBindingMode">
        ${Object.entries(serviceLabels)
          .map(
            ([value, label]) =>
              `<option value="${value}"${currentMode === value ? " selected" : ""}>${label}</option>`
          )
          .join("")}
      </select>
    </label>
    ${
      currentMode === "sheet"
        ? `
      <label>
        <span>Количество листов</span>
        <input id="calcBindingExtraSheets" type="number" min="1" step="1" value="${currentExtraSheets}" inputmode="numeric" />
      </label>
    `
        : `
      <label>
        <span>Листов в брошюре</span>
        <input id="calcBindingSheets" type="number" min="1" step="1" value="${currentSheets}" inputmode="numeric" />
      </label>
      <p class="calculator-builder-note">
        Если нужны несколько разных брошюр, добавляйте их отдельными строками.
      </p>
    `
    }
  `;
}

function renderGiftFields() {
  const giftServices = getGiftServices();
  const currentMode = calcFields?.querySelector("#calcGiftMode")?.value || "fixed";
  const currentQuantity = calcFields?.querySelector("#calcGiftQuantity")?.value || "1";
  const currentFixedId =
    calcFields?.querySelector("#calcGiftFixedOption")?.value || giftServices.fixed?.options?.[0]?.id || "";
  const currentTshirtId =
    calcFields?.querySelector("#calcGiftTshirtBase")?.value || giftServices.tshirts?.options?.[0]?.id || "";
  const selectedTshirt =
    giftServices.tshirts?.options?.find((item) => item.id === currentTshirtId) ||
    giftServices.tshirts?.options?.[0] ||
    null;
  const currentTshirtVariantId =
    calcFields?.querySelector("#calcGiftTshirtVariant")?.value ||
    selectedTshirt?.priceVariants?.[0]?.id ||
    "";
  const currentMagnetId =
    calcFields?.querySelector("#calcGiftMagnetOption")?.value || giftServices.magnets?.options?.[0]?.id || "";

  const modeOptions = [
    { id: "fixed", title: "Сувениры" },
    { id: "tshirts", title: "Футболки" },
    { id: "magnets", title: "Виниловые магниты" },
  ];

  let dynamicMarkup = "";

  if (currentMode === "fixed") {
    dynamicMarkup = `
      <label>
        <span>Товар</span>
        <select id="calcGiftFixedOption">
          ${(giftServices.fixed?.options || [])
            .map(
              (option) =>
                `<option value="${option.id}"${currentFixedId === option.id ? " selected" : ""}>${option.title}</option>`
            )
            .join("")}
        </select>
      </label>
    `;
  } else if (currentMode === "tshirts") {
    dynamicMarkup = `
      <label>
        <span>Тип футболки</span>
        <select id="calcGiftTshirtBase">
          ${(giftServices.tshirts?.options || [])
            .map(
              (option) =>
                `<option value="${option.id}"${currentTshirtId === option.id ? " selected" : ""}>${option.title}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>
        <span>Размер / принт</span>
        <select id="calcGiftTshirtVariant">
          ${(selectedTshirt?.priceVariants || [])
            .map(
              (variant) =>
                `<option value="${variant.id}"${currentTshirtVariantId === variant.id ? " selected" : ""}>${variant.title}</option>`
            )
            .join("")}
        </select>
      </label>
    `;
  } else {
    dynamicMarkup = `
      <label>
        <span>Формат магнита</span>
        <select id="calcGiftMagnetOption">
          ${(giftServices.magnets?.options || [])
            .map(
              (option) =>
                `<option value="${option.id}"${currentMagnetId === option.id ? " selected" : ""}>${option.title}</option>`
            )
            .join("")}
        </select>
      </label>
    `;
  }

  calcFields.innerHTML = `
    <label>
      <span>Тип услуги</span>
      <select id="calcGiftMode">
        ${modeOptions
          .map(
            (option) =>
              `<option value="${option.id}"${currentMode === option.id ? " selected" : ""}>${option.title}</option>`
          )
          .join("")}
      </select>
    </label>
    ${dynamicMarkup}
    <label>
      <span>Количество</span>
      <input id="calcGiftQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
    </label>
    <p class="calculator-builder-note">
      Для сувенирной печати автоматически применяется скидка: от 3 шт. -10%, от 5 шт. -15%.
    </p>
  `;
}

function renderPaperFields() {
  const paperService = getPaperService();
  const paperOptions = paperService?.options || [];
  const currentOptionId =
    calcFields?.querySelector("#calcPaperOption")?.value || paperOptions[0]?.id || "";
  const currentQuantity = calcFields?.querySelector("#calcPaperQuantity")?.value || "1";
  const fillMode = calcFields?.querySelector("#calcPaperFillMode")?.value || "none";
  const selectedOption =
    paperOptions.find((option) => option.id === currentOptionId) || paperOptions[0] || null;
  const currentSideId =
    calcFields?.querySelector("#calcPaperSide")?.value ||
    selectedOption?.priceVariants?.[0]?.id ||
    "";

  if (!paperOptions.length) {
    calcFields.innerHTML = "";
    return;
  }

  const optionMarkup = paperOptions
    .map((option) => {
      const format = option.parameters?.format || option.title;
      const paperType = option.parameters?.paperType || "";
      const sideSuffix =
        option.pricingMode === "fixed" || option.pricingMode === "tiered"
          ? option.parameters?.sides
            ? ` · ${option.parameters.sides}`
            : ""
          : "";
      return `<option value="${option.id}"${
        currentOptionId === option.id ? " selected" : ""
      }>${format} · ${paperType}${sideSuffix}</option>`;
    })
    .join("");

  const showSides =
    (selectedOption?.pricingMode === "variant_fixed" || selectedOption?.pricingMode === "variant_tiered") &&
    selectedOption?.priceVariants?.length;
  const sideMarkup = showSides
    ? `
      <label>
        <span>Стороны</span>
        <select id="calcPaperSide">
          ${selectedOption.priceVariants
            .map(
              (variant) =>
                `<option value="${variant.id}"${
                  currentSideId === variant.id ? " selected" : ""
                }>${variant.title}</option>`
            )
            .join("")}
        </select>
      </label>
    `
    : "";

  calcFields.innerHTML = `
    <label>
      <span>Вариант бумаги</span>
      <select id="calcPaperOption">${optionMarkup}</select>
    </label>
    ${sideMarkup}
    <label>
      <span>Количество</span>
      <input id="calcPaperQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
    </label>
    <label>
      <span>Заливка свыше 50%</span>
      <select id="calcPaperFillMode">
        <option value="none"${fillMode === "none" ? " selected" : ""}>Нет</option>
        <option value="high"${fillMode === "high" ? " selected" : ""}>Да</option>
        <option value="unknown"${fillMode === "unknown" ? " selected" : ""}>Не знаю, цену уточнить</option>
      </select>
    </label>
    <p class="calculator-builder-note">
      Если часть листов с заливкой, а часть без неё, добавляйте их отдельными строками.
    </p>
  `;
}

function renderDigitalFields() {
  const currentMode = calcFields?.querySelector("#calcDigitalMode")?.value || "video";
  const currentQuantity = calcFields?.querySelector("#calcDigitalQuantity")?.value || "1";
  const currentFilmMode = calcFields?.querySelector("#calcDigitalFilmMode")?.value || "film_budget";
  const currentAddon = calcFields?.querySelector("#calcDigitalAddon")?.value || "extract_film";
  const digitalServices = getDigitalServices();
  const filmOptions = digitalServices.filmDigitization?.options || [];
  const addonOptions = digitalServices.addons?.options || [];
  const showFilmMode = currentMode === "film_digitization";
  const showAddonMode = currentMode === "addons";
  const quantityLabel =
    currentMode === "video"
      ? "Минуты"
      : showAddonMode && currentAddon === "storage_digitization"
        ? "Объём (ГБ)"
        : "Количество";

  calcFields.innerHTML = `
    <label>
      <span>Тип услуги</span>
      <select id="calcDigitalMode">
        <option value="video"${currentMode === "video" ? " selected" : ""}>Оцифровка видеокассет</option>
        <option value="film_digitization"${currentMode === "film_digitization" ? " selected" : ""}>Оцифровка фотоплёнки</option>
        <option value="film_processing"${currentMode === "film_processing" ? " selected" : ""}>Проявка фотоплёнки</option>
        <option value="film_scanning"${currentMode === "film_scanning" ? " selected" : ""}>Сканирование фотоплёнки</option>
        <option value="cut_frame"${currentMode === "cut_frame" ? " selected" : ""}>Порезанный кадр</option>
        <option value="addons"${currentMode === "addons" ? " selected" : ""}>Дополнительные услуги оцифровки</option>
      </select>
    </label>
    ${
      showFilmMode
        ? `
      <label>
        <span>Режим</span>
        <select id="calcDigitalFilmMode">
          ${filmOptions
            .map((option) => {
              const mode = getFilmModeLabel(option.parameters?.mode || option.title);
              return `<option value="${option.id}"${currentFilmMode === option.id ? " selected" : ""}>${mode}</option>`;
            })
            .join("")}
        </select>
      </label>
    `
        : ""
    }
    ${
      showAddonMode
        ? `
      <label>
        <span>Услуга</span>
        <select id="calcDigitalAddon">
          ${addonOptions
            .map((option) => {
              const mode = option.parameters?.mode ? ` · ${option.parameters.mode}` : "";
              return `<option value="${option.id}"${currentAddon === option.id ? " selected" : ""}>${option.title}${mode}</option>`;
            })
            .join("")}
        </select>
      </label>
    `
        : ""
    }
    <label>
      <span>${quantityLabel}</span>
      <input id="calcDigitalQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
    </label>
  `;
}

function renderPrintFields() {
  const currentMode = calcFields?.querySelector("#calcPrintMode")?.value || "copy_a4";
  const currentVariant = calcFields?.querySelector("#calcPrintVariant")?.value || "bw";
  const currentQuantity = calcFields?.querySelector("#calcPrintQuantity")?.value || "1";
  const fillMode = calcFields?.querySelector("#calcPrintFillMode")?.value || "none";
  const serviceLabels = {
    copy_a4: "Ксерокопия A4",
    extra_a4: "Доп. прокат A4",
    print_a4: "Распечатка A4",
    print_a3: "Распечатка A3",
    extra_a3: "Доп. прокат A3",
  };
  const needsVariant = true;
  const allowFill = true;

  calcFields.innerHTML = `
    <label>
      <span>Тип услуги</span>
      <select id="calcPrintMode">
        <option value="copy_a4"${currentMode === "copy_a4" ? " selected" : ""}>Ксерокопия A4</option>
        <option value="extra_a4"${currentMode === "extra_a4" ? " selected" : ""}>Доп. прокат A4</option>
        <option value="print_a4"${currentMode === "print_a4" ? " selected" : ""}>Распечатка A4</option>
        <option value="print_a3"${currentMode === "print_a3" ? " selected" : ""}>Распечатка A3</option>
        <option value="extra_a3"${currentMode === "extra_a3" ? " selected" : ""}>Доп. прокат A3</option>
      </select>
    </label>
    ${
      needsVariant
        ? `
      <label>
        <span>Вариант печати</span>
        <select id="calcPrintVariant">
          <option value="bw"${currentVariant === "bw" ? " selected" : ""}>Ч/б</option>
          <option value="color"${currentVariant === "color" ? " selected" : ""}>Цвет</option>
        </select>
      </label>
    `
        : ""
    }
    <label>
      <span>Количество</span>
      <input id="calcPrintQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
    </label>
    ${
      allowFill
        ? `
      <label>
        <span>Заливка свыше 50%</span>
        <select id="calcPrintFillMode">
          <option value="none"${fillMode === "none" ? " selected" : ""}>Нет</option>
          <option value="high"${fillMode === "high" ? " selected" : ""}>Да</option>
          <option value="unknown"${fillMode === "unknown" ? " selected" : ""}>Не знаю, цену уточнить</option>
        </select>
      </label>
      <p class="calculator-builder-note">
        Если часть листов с заливкой, а часть без неё, добавьте их двумя отдельными позициями.
      </p>
    `
        : `
      <p class="calculator-builder-note">Для услуги «${serviceLabels[currentMode]}» надбавка за заливку не применяется.</p>
    `
    }
  `;
}

function renderScanFields() {
  const currentMode = calcFields?.querySelector("#calcScanMode")?.value || "document";
  const currentQuantity = calcFields?.querySelector("#calcScanQuantity")?.value || "1";
  const currentOption = calcFields?.querySelector("#calcScanProcessedOption")?.value || "";
  const scanServices = getScanServices();
  const processedOptions = scanServices.processed?.options || [];

  const processedOptionsMarkup = processedOptions
    .map((option) => {
      const dpi = option.parameters?.dpi || option.title;
      const selected = option.id === currentOption ? " selected" : "";
      return `<option value="${option.id}"${selected}>${dpi}</option>`;
    })
    .join("");

  calcFields.innerHTML = `
    <label>
      <span>Тип услуги</span>
      <select id="calcScanMode">
        <option value="document"${currentMode === "document" ? " selected" : ""}>Сканирование документа</option>
        <option value="file_send"${currentMode === "file_send" ? " selected" : ""}>Отправка файла</option>
        <option value="photo"${currentMode === "photo" ? " selected" : ""}>Сканирование фото A4, 600 dpi</option>
        <option value="processed"${currentMode === "processed" ? " selected" : ""}>Оцифровка фото с обработкой</option>
      </select>
    </label>
    ${
      currentMode === "processed"
        ? `
      <label>
        <span>Режим / DPI</span>
        <select id="calcScanProcessedOption">${processedOptionsMarkup}</select>
      </label>
      <label>
        <span>Количество</span>
        <input id="calcScanQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
      </label>
    `
        : `
      <label>
        <span>Количество</span>
        <input id="calcScanQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
      </label>
    `
    }
  `;
}

function renderDocsFields() {
  const currentMode = calcFields?.querySelector("#calcDocsMode")?.value || "main";
  const currentOption = calcFields?.querySelector("#calcDocsOption")?.value || "";
  const currentCopies = calcFields?.querySelector("#calcDocsCopies")?.value || "1";
  const currentPackQuantity = calcFields?.querySelector("#calcDocsPackQuantity")?.value || "2";
  const currentAddonOption = calcFields?.querySelector("#calcDocsAddonOption")?.value || "";
  const currentAddonQuantity = calcFields?.querySelector("#calcDocsAddonQuantity")?.value || "1";
  const docsServices = getDocsServices();
  const mainOptions = docsServices.main?.options || [];
  const readyTiers = docsServices.ready?.tiers || [];
  const extraTiers = docsServices.extra?.tiers || [];
  const addonOptions = docsServices.addons?.options || [];

  const mainOptionMarkup = mainOptions
    .map((option) => {
      const format = option.parameters?.format || option.title;
      const shortDescription = (option.parameters?.description || "")
        .split(",")[0]
        .replace(/\.$/, "")
        .trim();
      const selected = option.id === currentOption ? " selected" : "";
      return `<option value="${option.id}"${selected}>${format}${shortDescription ? ` · ${shortDescription}` : ""}</option>`;
    })
    .join("");

  const activeTierList = currentMode === "extra" ? extraTiers : readyTiers;
  const packOptionsMarkup = activeTierList
    .map((tier) => {
      const value = String(tier.min ?? "");
      const selected = value === currentPackQuantity ? " selected" : "";
      return `<option value="${value}"${selected}>${tier.label || `${value} шт.`}</option>`;
    })
    .join("");

  const addonOptionsMarkup = addonOptions
    .map((option) => {
      const format = option.parameters?.format || option.title;
      const selected = option.id === currentAddonOption ? " selected" : "";
      return `<option value="${option.id}"${selected}>${option.title}${format ? ` · ${format}` : ""}</option>`;
    })
    .join("");

  calcFields.innerHTML = `
    <label>
      <span>Тип услуги</span>
      <select id="calcDocsMode">
        <option value="main"${currentMode === "main" ? " selected" : ""}>Фото на документы</option>
        <option value="ready"${currentMode === "ready" ? " selected" : ""}>Готовый комплект</option>
        <option value="extra"${currentMode === "extra" ? " selected" : ""}>Дополнительный комплект</option>
        <option value="addons"${currentMode === "addons" ? " selected" : ""}>Дополнительные услуги</option>
      </select>
    </label>
    ${
      currentMode === "main"
        ? `
      <label>
        <span>Вариант</span>
        <select id="calcDocsOption">${mainOptionMarkup}</select>
      </label>
      <label>
        <span>Количество наборов</span>
        <input id="calcDocsCopies" type="number" min="1" step="1" value="${currentCopies}" inputmode="numeric" />
      </label>
    `
        : currentMode === "addons"
          ? `
      <label>
        <span>Услуга</span>
        <select id="calcDocsAddonOption">${addonOptionsMarkup}</select>
      </label>
      <label>
        <span>Количество</span>
        <input id="calcDocsAddonQuantity" type="number" min="1" step="1" value="${currentAddonQuantity}" inputmode="numeric" />
      </label>
    `
        : `
      <label>
        <span>Количество в комплекте</span>
        <select id="calcDocsPackQuantity">${packOptionsMarkup}</select>
      </label>
    `
    }
  `;
}

function populatePhotoPaperField() {
  const formatSelect = calcFields?.querySelector("#calcPhotoFormat");
  const paperSelect = calcFields?.querySelector("#calcPhotoPaper");

  if (!formatSelect || !paperSelect) {
    return;
  }

  const group = getPhotoFormatGroups().find((item) => item.format === formatSelect.value);
  const options = group?.options || [];

  paperSelect.innerHTML = options
    .map(
      (option) =>
        `<option value="${option.id}">${option.parameters?.paperType || option.title}</option>`
    )
    .join("");

  paperSelect.disabled = options.length <= 1;
}

function getActiveQuantityValue() {
  const quantityInput = calcFields?.querySelector("#calcQuantity");
  const parsedQuantity = Number.parseInt(quantityInput?.value || "1", 10);
  return Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1;
}

function buildPhotoCartItem(assignId = false) {
  const formatSelect = calcFields?.querySelector("#calcPhotoFormat");
  const paperSelect = calcFields?.querySelector("#calcPhotoPaper");
  const customInput = calcFields?.querySelector("#calcPhotoCustom");
  const quantity = getActiveQuantityValue();
  const group = getPhotoFormatGroups().find((item) => item.format === formatSelect?.value);
  const option =
    group?.options.find((item) => item.id === paperSelect?.value) || group?.options?.[0] || null;

  if (!option) {
    return { error: "Для такого сочетания фото нет тарифа." };
  }

  const priceData = calculateTieredUnitPrice(option, quantity);
  if (!priceData) {
    return { error: "Для такого количества фото нужен ручной расчёт." };
  }

  const customSurcharge = customInput?.checked ? 15 : 0;
  const unitPrice = priceData.unitPrice + customSurcharge;
  const baseUnitPrice = (getBaseTierPrice(option) ?? priceData.unitPrice) + customSurcharge;

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "photo",
    itemKind: "photo_print",
    format: option.title,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
    tierLabel: priceData.tierLabel,
    title: `Печать фото ${option.title}`,
    description: `${option.parameters?.size || ""}, ${option.parameters?.paperType || option.title}`.replace(
      /^,\s*/,
      ""
    ),
    customSurcharge,
    baseUnitPrice,
    originalSubtotal: baseUnitPrice * quantity,
    nextTierHint: buildNextTierHint(priceData, quantity),
    mergeConfig: { kind: "photo_print", optionId: option.id, customSurcharge },
  };
}

function buildLaminationCartItem(assignId = false) {
  const laminationSelect = calcFields?.querySelector("#calcLaminationOption");
  const quantity = getActiveQuantityValue();
  const option = getLaminationOptions().find((item) => item.id === laminationSelect?.value);

  if (!option) {
    return { error: "Для ламинации не выбран тариф." };
  }

  const priceData = calculateTieredUnitPrice(option, quantity);
  if (!priceData) {
    return { error: "Для такого количества ламинации нужен ручной расчёт." };
  }

  const format = option.parameters?.format || option.title;
  const baseUnitPrice = getBaseTierPrice(option) ?? priceData.unitPrice;

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "lamination",
    itemKind: "lamination",
    format,
    quantity,
    unitPrice: priceData.unitPrice,
    subtotal: priceData.unitPrice * quantity,
    tierLabel: priceData.tierLabel,
    title: `Ламинирование ${format}`,
    description: option.parameters?.filmType || "Глянец",
    baseUnitPrice,
    originalSubtotal: baseUnitPrice * quantity,
    nextTierHint: buildNextTierHint(priceData, quantity),
    mergeConfig: { kind: "lamination", optionId: option.id },
  };
}

function buildPrintCartItem(assignId = false) {
  const printMode = calcFields?.querySelector("#calcPrintMode")?.value || "copy_a4";
  const printVariant = calcFields?.querySelector("#calcPrintVariant")?.value || "bw";
  const quantityValue = Number.parseInt(
    calcFields?.querySelector("#calcPrintQuantity")?.value || "1",
    10
  );
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
  const fillMode = calcFields?.querySelector("#calcPrintFillMode")?.value || "none";
  const printServices = getPrintServices();
  const serviceMap = {
    copy_a4: printServices.copyA4,
    extra_a4: printServices.extraA4,
    print_a4: printServices.printA4,
    print_a3: printServices.printA3,
    extra_a3: printServices.extraA3,
  };
  const service = serviceMap[printMode];

  if (!service) {
    return { error: "Для печати не найден выбранный тариф." };
  }

  const option = service.options?.find((item) =>
    printVariant === "color" ? /цвет/i.test(item.title) : /ч\/б|черно-бел/i.test(item.title)
  );

  if (!option) {
    return { error: "Для выбранной услуги не найден вариант печати." };
  }

  const priceData =
    option.pricingMode === "fixed"
      ? { unitPrice: option.price || 0, tierLabel: "Фиксированная цена" }
      : calculateTieredUnitPrice(option, quantity);

  if (!priceData) {
    return { error: "Для такого количества печати нужен точный выбор тарифа." };
  }

  const fillMultiplier = fillMode === "high" ? printServices.fill?.adjustments?.[0]?.multiplier || 1.5 : 1;
  const unitPrice = fillMode === "unknown" ? null : Math.round(priceData.unitPrice * fillMultiplier);
  const baseUnitPriceRaw = option.pricingMode === "fixed" ? option.price || 0 : getBaseTierPrice(option) ?? priceData.unitPrice;
  const baseUnitPrice = fillMode === "unknown" ? null : Math.round(baseUnitPriceRaw * fillMultiplier);
  const printType = printVariant === "color" ? "Цвет" : "Ч/б";
  const fillNote =
    fillMode === "high"
      ? " · заливка >50%"
      : fillMode === "unknown"
        ? " · заливка >50%: цену уточнить"
        : "";
  const subtotal = hasExactPrice(unitPrice) ? unitPrice * quantity : null;

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "print",
    format: `${service.id}-${printVariant}`,
    quantity,
    unitPrice,
    subtotal,
    tierLabel: priceData.tierLabel,
    title: `${service.title} ${printType}`,
    description: `${option.parameters?.format || ""}${fillNote}${priceData.tierLabel ? `, ${priceData.tierLabel}` : ""}`.replace(
      /^,\s*/,
      ""
    ),
    hasFill: fillMode !== "none",
    fillMode,
    requiresConfirmation: fillMode === "unknown",
    displayUnit: hasExactPrice(unitPrice) ? `${formatRubles(unitPrice)} за шт.` : "цену уточнить",
    displayLineTotal: hasExactPrice(subtotal) ? formatRubles(subtotal) : "Уточнить",
    baseUnitPrice,
    originalSubtotal: hasExactPrice(baseUnitPrice) ? baseUnitPrice * quantity : subtotal,
    nextTierHint: buildNextTierHint(priceData, quantity),
    sheetsCount: quantity,
    mergeConfig: { kind: "print", serviceId: service.id, optionId: option.id, fillMode },
  };
}

function buildDigitalCartItem(assignId = false) {
  const digitalMode = calcFields?.querySelector("#calcDigitalMode")?.value || "video";
  const quantityValue = Number.parseInt(
    calcFields?.querySelector("#calcDigitalQuantity")?.value || "1",
    10
  );
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
  const digitalServices = getDigitalServices();

  if (digitalMode === "video") {
    const priceData = calculateTieredUnitPrice(digitalServices.video, quantity);
    if (!priceData) {
      return { error: "Для такого количества минут нужен точный выбор тарифа." };
    }

    const unitPrice = priceData.unitPrice;
    const baseUnitPrice = getBaseTierPrice(digitalServices.video) ?? priceData.unitPrice;
    const baseSubtotal = unitPrice * quantity;
    const subtotal = Math.max(baseSubtotal, 900);
    const minApplied = subtotal > baseSubtotal;

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "digital",
      itemKind: "digital_video",
      format: "video_digitization",
      quantity,
      unitPrice,
      subtotal,
      tierLabel: priceData.tierLabel,
      title: "Оцифровка видеокассет",
      description: `${priceData.tierLabel}${minApplied ? " · мин. стоимость кассеты 900 ₽" : ""}`,
      displayQuantity: `${quantity} мин.`,
      displayUnit: `${formatRubles(unitPrice)} за минуту`,
      displayLineTotal: formatRubles(subtotal),
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * quantity,
      nextTierHint: buildNextTierHint(priceData, quantity, "мин."),
      mergeConfig: { kind: "digital_video" },
    };
  }

  if (digitalMode === "film_digitization") {
    const filmMode = calcFields?.querySelector("#calcDigitalFilmMode")?.value;
    const option = digitalServices.filmDigitization?.options?.find((item) => item.id === filmMode) || null;
    const priceData = calculateTieredUnitPrice(option, quantity);

    if (!option || !priceData) {
      return { error: "Для такого количества катушек нужен точный выбор тарифа." };
    }

    const unitPrice = priceData.unitPrice;
    const baseUnitPrice = getBaseTierPrice(option) ?? priceData.unitPrice;
    const modeLabel = getFilmModeLabel(option.parameters?.mode || option.title);

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "digital",
      itemKind: "digital_film",
      format: `film_digitization-${option.id}`,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      tierLabel: priceData.tierLabel,
      title: `Оцифровка фотоплёнки ${modeLabel}`,
      description: priceData.tierLabel,
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * quantity,
      nextTierHint: buildNextTierHint(priceData, quantity),
      mergeConfig: { kind: "digital_film", optionId: option.id },
    };
  }

  if (digitalMode === "addons") {
    const addonId = calcFields?.querySelector("#calcDigitalAddon")?.value;
    const option = digitalServices.addons?.options?.find((item) => item.id === addonId) || null;

    if (!option) {
      return { error: "Для допуслуги оцифровки не выбран вариант." };
    }

    const priceData =
      option.pricingMode === "fixed"
        ? { unitPrice: option.price || 0, tierLabel: "Фиксированная цена" }
        : calculateTieredUnitPrice(option, quantity);

    if (!priceData) {
      return { error: "Для такого объёма нужен точный выбор тарифа." };
    }

    const subtotal = priceData.unitPrice * quantity;
    const baseUnitPrice = option.pricingMode === "fixed" ? option.price || 0 : getBaseTierPrice(option) ?? priceData.unitPrice;

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "digital",
      itemKind: "digital_addon",
      format: `digital-addon-${addonId}`,
      quantity,
      unitPrice: priceData.unitPrice,
      subtotal,
      tierLabel: priceData.tierLabel,
      title: option.title,
      description: [option.parameters?.mode || "", option.pricingMode === "fixed" ? "" : priceData.tierLabel]
        .filter(Boolean)
        .join(" · "),
      displayQuantity:
        option.id === "storage_digitization" ? `${quantity} ГБ` : `${quantity} шт.`,
      displayUnit:
        option.pricingMode === "fixed"
          ? `${formatRubles(priceData.unitPrice)} за шт.`
          : option.id === "storage_digitization"
            ? `${formatRubles(priceData.unitPrice)} за ГБ`
            : `${formatRubles(priceData.unitPrice)} за шт.`,
      displayLineTotal: formatRubles(subtotal),
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * quantity,
      nextTierHint:
        option.pricingMode === "fixed"
          ? null
          : buildNextTierHint(priceData, quantity, option.id === "storage_digitization" ? "ГБ" : "шт."),
      mergeConfig: { kind: "digital_addon", optionId: option.id },
    };
  }

  const serviceMap = {
    film_processing: digitalServices.filmProcessing,
    film_scanning: digitalServices.filmScanning,
    cut_frame: digitalServices.cutFrame,
  };
  const service = serviceMap[digitalMode];
  const priceData = calculateTieredUnitPrice(service, quantity);

  if (!service || !priceData) {
    return { error: "Для такого количества нужен точный выбор тарифа." };
  }

  const unitPrice = priceData.unitPrice;
  const baseUnitPrice = getBaseTierPrice(service) ?? priceData.unitPrice;

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "digital",
    itemKind: "digital_service",
    format: service.id,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
    tierLabel: priceData.tierLabel,
    title: service.title,
    description: priceData.tierLabel,
    baseUnitPrice,
    originalSubtotal: baseUnitPrice * quantity,
    nextTierHint: buildNextTierHint(priceData, quantity),
    mergeConfig: { kind: "digital_service", serviceId: service.id },
  };
}

function buildBindingCartItem(assignId = false) {
  const bindingMode = calcFields?.querySelector("#calcBindingMode")?.value || "plastic";
  const bindingServices = getBindingServices();

  if (bindingMode === "sheet") {
    const quantityValue = Number.parseInt(
      calcFields?.querySelector("#calcBindingExtraSheets")?.value || "1",
      10
    );
    const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
    const service = bindingServices.sheet;

    if (!service) {
      return { error: "Для доп. листов не найден тариф." };
    }

    const priceData = calculateTieredUnitPrice(service, quantity);

    if (!priceData) {
      return { error: "Для такого количества доп. листов нужен точный выбор тарифа." };
    }

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "binding",
      itemKind: "binding_sheet",
      format: service.id,
      quantity,
      unitPrice: priceData.unitPrice,
      subtotal: priceData.unitPrice,
      tierLabel: priceData.tierLabel,
      title: service.title,
      description: priceData.tierLabel,
      displayQuantity: `${quantity} лист.`,
      displayUnit: formatRubles(priceData.unitPrice),
      displayLineTotal: formatRubles(priceData.unitPrice),
      mergeConfig: { kind: "binding_sheet" },
    };
  }

  const service = bindingMode === "metal" ? bindingServices.metal : bindingServices.plastic;
  const sheetsValue = Number.parseInt(
    calcFields?.querySelector("#calcBindingSheets")?.value || "1",
    10
  );
  const sheets = Number.isFinite(sheetsValue) && sheetsValue > 0 ? sheetsValue : 1;
  const priceData = calculateTieredUnitPrice(service, sheets);

  if (!service || !priceData) {
    return { error: "Для такого количества листов нужен точный выбор тарифа." };
  }

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "binding",
    itemKind: "binding_booklet",
    format: `${service.id}-${sheets}`,
    quantity: 1,
    unitPrice: priceData.unitPrice,
    subtotal: priceData.unitPrice,
    tierLabel: priceData.tierLabel,
    title: service.title,
    description: `${sheets} лист. · ${priceData.tierLabel}`,
    displayQuantity: "1 брошюра",
    displayUnit: `${formatRubles(priceData.unitPrice)} за брошюру`,
    sheetsCount: sheets,
    mergeConfig: { kind: "binding_booklet", serviceId: service.id, sheetsCount: sheets },
  };
}

function buildGiftCartItem(assignId = false) {
  const giftMode = calcFields?.querySelector("#calcGiftMode")?.value || "fixed";
  const quantityValue = Number.parseInt(
    calcFields?.querySelector("#calcGiftQuantity")?.value || "1",
    10
  );
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
  const giftServices = getGiftServices();

  if (giftMode === "fixed") {
    const optionId = calcFields?.querySelector("#calcGiftFixedOption")?.value || "";
    const option = giftServices.fixed?.options?.find((item) => item.id === optionId) || null;

    if (!option) {
      return { error: "Для сувенира не выбран товар." };
    }

      return {
        id: assignId ? `calc-item-${++calculatorItemId}` : null,
        category: "gifts",
        itemKind: "gift_item",
        giftKind: /кружк/i.test(option.title) ? "mug" : "other",
        format: option.id,
      quantity,
      unitPrice: option.price || 0,
      subtotal: (option.price || 0) * quantity,
      tierLabel: "Фиксированная цена",
      title: option.title,
      description: option.parameters?.description || "1 шт.",
      mergeConfig: { kind: "gift_fixed", optionId: option.id },
    };
  }

  if (giftMode === "tshirts") {
    const tshirtId = calcFields?.querySelector("#calcGiftTshirtBase")?.value || "";
    const baseOption = giftServices.tshirts?.options?.find((item) => item.id === tshirtId) || null;
    const variantId = calcFields?.querySelector("#calcGiftTshirtVariant")?.value || "";
    const variant = baseOption?.priceVariants?.find((item) => item.id === variantId) || null;

    if (!baseOption || !variant) {
      return { error: "Для футболки не выбран вариант." };
    }

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "gifts",
      itemKind: "gift_item",
      giftKind: "tshirt",
      format: variant.id,
      quantity,
      unitPrice: variant.price || 0,
      subtotal: (variant.price || 0) * quantity,
      tierLabel: "Фиксированная цена",
      title: baseOption.title,
      description: `${baseOption.parameters?.material || ""}${variant.title ? ` · ${variant.title}` : ""}`.replace(
        /^ · /,
        ""
      ),
      mergeConfig: { kind: "gift_tshirt", baseOptionId: baseOption.id, variantId: variant.id },
    };
  }

  const magnetId = calcFields?.querySelector("#calcGiftMagnetOption")?.value || "";
  const option = giftServices.magnets?.options?.find((item) => item.id === magnetId) || null;

  if (!option) {
    return { error: "Для магнита не выбран формат." };
  }

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "gifts",
    itemKind: "gift_item",
    giftKind: "other",
    format: option.id,
    quantity,
    unitPrice: option.price || 0,
    subtotal: (option.price || 0) * quantity,
    tierLabel: "Фиксированная цена",
    title: giftServices.magnets?.title || "Фото-магнит виниловый",
    description: option.parameters?.format || option.title,
    mergeConfig: { kind: "gift_magnet", optionId: option.id },
  };
}

function buildPaperCartItem(assignId = false) {
  const paperService = getPaperService();
  const paperOptions = paperService?.options || [];
  const optionId = calcFields?.querySelector("#calcPaperOption")?.value || paperOptions[0]?.id;
  const option = paperOptions.find((item) => item.id === optionId) || null;
  const quantityValue = Number.parseInt(
    calcFields?.querySelector("#calcPaperQuantity")?.value || "1",
    10
  );
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
  const fillMode = calcFields?.querySelector("#calcPaperFillMode")?.value || "none";

  if (!paperService || !option) {
    return { error: "Для плотной бумаги не найден выбранный тариф." };
  }

  let unitPrice = null;
  let tierLabel = "Фиксированная цена";
  let sideLabel = option.parameters?.sides || "";
  let nextTierHint = null;

  if (option.pricingMode === "fixed" || option.pricingMode === "tiered") {
    const priceData =
      option.pricingMode === "fixed"
        ? { unitPrice: option.price || 0, tierLabel: "Фиксированная цена" }
        : calculateTieredUnitPrice(option, quantity);

    if (!priceData) {
      return { error: "Для такого количества плотной бумаги нужен точный выбор тарифа." };
    }

    unitPrice = priceData.unitPrice;
    tierLabel = priceData.tierLabel;
    nextTierHint = buildNextTierHint(priceData, quantity);
  } else if (option.pricingMode === "variant_fixed") {
    const sideId =
      calcFields?.querySelector("#calcPaperSide")?.value || option.priceVariants?.[0]?.id || "";
    const sideVariant = option.priceVariants?.find((item) => item.id === sideId) || null;

    if (!sideVariant) {
      return { error: "Для плотной бумаги не выбраны стороны." };
    }

    unitPrice = sideVariant.price || 0;
    sideLabel = sideVariant.title || "";
  } else if (option.pricingMode === "variant_tiered") {
    const sideId =
      calcFields?.querySelector("#calcPaperSide")?.value || option.priceVariants?.[0]?.id || "";
    const sideVariant = option.priceVariants?.find((item) => item.id === sideId) || null;

    if (!sideVariant) {
      return { error: "Для плотной бумаги не выбраны стороны." };
    }

    const priceData = calculateTieredUnitPrice(sideVariant, quantity);
    if (!priceData) {
      return { error: "Для такого количества плотной бумаги нужен точный выбор тарифа." };
    }

    unitPrice = priceData.unitPrice;
    tierLabel = priceData.tierLabel;
    sideLabel = sideVariant.title || "";
    nextTierHint = buildNextTierHint(priceData, quantity);
  } else {
    return { error: "Для выбранной бумаги пока нет точного автоматического расчёта." };
  }

  const fillMultiplier = fillMode === "high" ? paperService.adjustments?.[0]?.multiplier || 1.5 : 1;
  const adjustedUnitPrice = fillMode === "unknown" ? null : Math.round(unitPrice * fillMultiplier);
  const subtotal = hasExactPrice(adjustedUnitPrice) ? adjustedUnitPrice * quantity : null;
  const format = option.parameters?.format || option.title;
  const paperType = option.parameters?.paperType || option.title;
  const fillNote =
    fillMode === "high"
      ? " · заливка >50%"
      : fillMode === "unknown"
        ? " · заливка >50%: цену уточнить"
        : "";
  const descriptionParts = [paperType];

  if (sideLabel) {
    descriptionParts.push(sideLabel);
  }

  if (fillNote) {
    descriptionParts.push(fillNote.replace(/^ · /, ""));
  }

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "paper",
    itemKind: "paper",
    format: `${option.id}${sideLabel ? `-${sideLabel}` : ""}`,
    quantity,
    unitPrice: adjustedUnitPrice,
    subtotal,
    tierLabel,
    title: `Плотная бумага ${format}`,
    description: descriptionParts.join(" · "),
    hasFill: fillMode !== "none",
    fillMode,
    requiresConfirmation: fillMode === "unknown",
    displayUnit: hasExactPrice(adjustedUnitPrice) ? `${formatRubles(adjustedUnitPrice)} за шт.` : "цену уточнить",
    displayLineTotal: hasExactPrice(subtotal) ? formatRubles(subtotal) : "Уточнить",
    nextTierHint,
    baseUnitPrice: hasExactPrice(adjustedUnitPrice)
      ? (() => {
          const rawBase = tierLabel === "Фиксированная цена" ? unitPrice : null;
          return rawBase;
        })()
      : null,
    originalSubtotal:
      hasExactPrice(adjustedUnitPrice) && hasExactPrice(unitPrice) ? adjustedUnitPrice * quantity : subtotal,
    mergeConfig: {
      kind: "paper",
      optionId: option.id,
      sideId: calcFields?.querySelector("#calcPaperSide")?.value || "",
      fillMode,
    },
  };
}

function buildStickerCartItem(assignId = false) {
  const stickerType = calcFields?.querySelector("#calcStickerType")?.value || "paper";
  const optionId = calcFields?.querySelector("#calcStickerOption")?.value || "";
  const quantityValue = Number.parseInt(
    calcFields?.querySelector("#calcStickerQuantity")?.value || "1",
    10
  );
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
  const stickerServices = getStickerServices();
  const service = stickerType === "photo" ? stickerServices.photoPaper : stickerServices.paper;
  const option = service?.options?.find((item) => item.id === optionId) || service?.options?.[0] || null;

  if (!service || !option) {
    return { error: "Для самоклеющейся бумаги не найден выбранный тариф." };
  }

  const priceData =
    option.pricingMode === "fixed"
      ? { unitPrice: option.price || 0, tierLabel: "Фиксированная цена" }
      : calculateTieredUnitPrice(option, quantity);

  if (!priceData) {
    return { error: "Для такого количества самоклеющейся бумаги нужен точный выбор тарифа." };
  }

  const unitPrice = priceData.unitPrice;
  const format = option.parameters?.format || option.title;
  const typeLabel = service.title || "Самоклеющаяся бумага";

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "sticker",
    itemKind: "sticker",
    format: option.id,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
    tierLabel: priceData.tierLabel,
    title: `${typeLabel} ${format}`,
    description: `${format}${priceData.tierLabel ? ` · ${priceData.tierLabel}` : ""}`,
    nextTierHint: buildNextTierHint(priceData, quantity),
    baseUnitPrice: getBaseTierPrice(option) ?? priceData.unitPrice,
    originalSubtotal: (getBaseTierPrice(option) ?? priceData.unitPrice) * quantity,
    mergeConfig: { kind: "sticker", serviceId: service.id, optionId: option.id },
  };
}

function buildScanCartItem(assignId = false) {
  const scanMode = calcFields?.querySelector("#calcScanMode")?.value || "document";
  const quantityValue = Number.parseInt(
    calcFields?.querySelector("#calcScanQuantity")?.value || "1",
    10
  );
  const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
  const scanServices = getScanServices();

  if (scanMode === "processed") {
    const optionId = calcFields?.querySelector("#calcScanProcessedOption")?.value;
    const option = scanServices.processed?.options?.find((item) => item.id === optionId) || null;

    if (!option) {
      return { error: "Для оцифровки фото с обработкой не выбран режим." };
    }

    const unitPrice = option.price || 0;
    const dpi = option.parameters?.dpi || option.title;

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "scan",
      itemKind: "scan_processed",
      format: `processed-${dpi}`,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      tierLabel: "Фиксированная цена",
      title: `Оцифровка фото с обработкой ${dpi}`,
      description: option.parameters?.description || dpi,
      mergeConfig: { kind: "scan_processed", optionId: option.id },
    };
  }

  if (scanMode === "file_send") {
    const service = scanServices.fileSend;

    if (!service) {
      return { error: "Для отправки файла не найден тариф." };
    }

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "scan",
      itemKind: "scan_file_send",
      format: service.id,
      quantity,
      unitPrice: service.price || 0,
      subtotal: (service.price || 0) * quantity,
      tierLabel: "Фиксированная цена",
      title: service.title,
      description: "1 отправка",
      mergeConfig: { kind: "scan_file_send" },
    };
  }

  const service = scanMode === "photo" ? scanServices.photo : scanServices.document;
  const priceData = calculateTieredUnitPrice(service, quantity);

  if (!service || !priceData) {
    return { error: "Для такого количества сканирования нужен точный выбор тарифа." };
  }

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "scan",
    itemKind: scanMode === "photo" ? "scan_photo" : "scan_document",
    format: service.id,
    quantity,
    unitPrice: priceData.unitPrice,
    subtotal: priceData.unitPrice * quantity,
    tierLabel: priceData.tierLabel,
    title: service.title,
    description: priceData.tierLabel,
    nextTierHint: buildNextTierHint(priceData, quantity),
    baseUnitPrice: getBaseTierPrice(service) ?? priceData.unitPrice,
    originalSubtotal: (getBaseTierPrice(service) ?? priceData.unitPrice) * quantity,
    mergeConfig: { kind: "scan_tiered", serviceId: service.id },
  };
}

function buildDocsCartItem(assignId = false) {
  const docsMode = calcFields?.querySelector("#calcDocsMode")?.value || "main";
  const docsServices = getDocsServices();

  if (docsMode === "main") {
    const optionId = calcFields?.querySelector("#calcDocsOption")?.value;
    const copiesValue = Number.parseInt(calcFields?.querySelector("#calcDocsCopies")?.value || "1", 10);
    const quantity = Number.isFinite(copiesValue) && copiesValue > 0 ? copiesValue : 1;
    const option = docsServices.main?.options?.find((item) => item.id === optionId) || null;

    if (!option) {
      return { error: "Для фото на документы не выбран вариант." };
    }

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "docs",
      itemKind: "docs_main",
      format: option.parameters?.format || option.title,
      quantity,
      unitPrice: option.price || 0,
      subtotal: (option.price || 0) * quantity,
      tierLabel: "Фиксированная цена",
      title: "Фото на документы",
      description: `${option.parameters?.format || ""}${option.parameters?.description ? `, ${option.parameters.description}` : ""}`.replace(
        /^,\s*/,
        ""
      ),
      displayQuantity: `${quantity} наб.`,
      displayUnit: `${formatRubles(option.price || 0)} за набор`,
      mergeConfig: { kind: "docs_main", optionId: option.id },
    };
  }

  if (docsMode === "addons") {
    const optionId = calcFields?.querySelector("#calcDocsAddonOption")?.value || "";
    const quantityValue = Number.parseInt(
      calcFields?.querySelector("#calcDocsAddonQuantity")?.value || "1",
      10
    );
    const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
    const option = docsServices.addons?.options?.find((item) => item.id === optionId) || null;

    if (!option) {
      return { error: "Для дополнительной услуги не выбран вариант." };
    }

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "docs",
      itemKind: "docs_addon",
      format: option.id,
      quantity,
      unitPrice: option.price || 0,
      subtotal: (option.price || 0) * quantity,
      tierLabel: "Фиксированная цена",
      title: option.title,
      description: `${option.parameters?.format || ""}${option.parameters?.description ? `, ${option.parameters.description}` : ""}`.replace(
        /^,\s*/,
        ""
      ),
      mergeConfig: { kind: "docs_addon", optionId: option.id },
    };
  }

  const service = docsMode === "extra" ? docsServices.extra : docsServices.ready;
  const selectedQuantity = Number.parseInt(
    calcFields?.querySelector("#calcDocsPackQuantity")?.value || "0",
    10
  );
  const matchedTier = findPriceTier(service?.tiers, selectedQuantity);

  if (!service || !matchedTier) {
    return { error: "Для такого комплекта нужен точный выбор из доступных количеств." };
  }

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "docs",
    itemKind: docsMode === "extra" ? "docs_extra_pack" : "docs_ready_pack",
    format: service.title,
    quantity: 1,
    unitPrice: matchedTier.price || 0,
    subtotal: matchedTier.price || 0,
    tierLabel: matchedTier.label || "Комплект",
    title: service.title,
    description: `${matchedTier.label || `${selectedQuantity} шт.`}`,
    displayQuantity: `${matchedTier.label || `${selectedQuantity} шт.`} в комплекте`,
    displayUnit: `${formatRubles(matchedTier.price || 0)} за комплект`,
    mergeConfig: {
      kind: "docs_pack",
      serviceId: service.id,
      selectedQuantity,
      mode: docsMode === "extra" ? "extra" : "ready",
    },
  };
}

function buildFrameCartItem(assignId = false) {
  const frameSelect = calcFields?.querySelector("#calcFrameFormat");
  const quantity = getActiveQuantityValue();
  const format = frameSelect?.value;
  const unitPrice = getFrameCatalog()[format];

  if (!format || unitPrice == null) {
    return { error: "Для рамки не выбран формат." };
  }

  return {
    id: assignId ? `calc-item-${++calculatorItemId}` : null,
    category: "frames",
    itemKind: "frame",
    format,
    quantity,
    unitPrice,
    subtotal: unitPrice * quantity,
    tierLabel: "Фиксированная цена",
    title: `Рамка ${format}`,
    description: "Временный тариф до раздела «Прочее»",
    mergeConfig: { kind: "frame", format },
  };
}

function buildMergeKey(item) {
  return JSON.stringify(item?.mergeConfig || { kind: item?.itemKind, format: item?.format });
}

function rebuildMergedCartItem(existingItem, totalQuantity) {
  const config = existingItem.mergeConfig || {};
  const servicesById = getServicesById();

  if (config.kind === "photo_print") {
    const service = getPhotoService();
    const option = service?.options?.find((item) => item.id === config.optionId) || null;
    const priceData = calculateTieredUnitPrice(option, totalQuantity);
    if (!option || !priceData) return existingItem;
    const customSurcharge = config.customSurcharge || 0;
    const unitPrice = priceData.unitPrice + customSurcharge;
    const baseUnitPrice = (getBaseTierPrice(option) ?? priceData.unitPrice) + customSurcharge;
    return {
      ...existingItem,
      quantity: totalQuantity,
      unitPrice,
      subtotal: unitPrice * totalQuantity,
      tierLabel: priceData.tierLabel,
      displayQuantity: undefined,
      displayUnit: undefined,
      displayLineTotal: undefined,
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * totalQuantity,
      nextTierHint: buildNextTierHint(priceData, totalQuantity),
    };
  }

  if (config.kind === "lamination") {
    const option = getLaminationOptions().find((item) => item.id === config.optionId) || null;
    const priceData = calculateTieredUnitPrice(option, totalQuantity);
    if (!option || !priceData) return existingItem;
    const baseUnitPrice = getBaseTierPrice(option) ?? priceData.unitPrice;
    return {
      ...existingItem,
      quantity: totalQuantity,
      unitPrice: priceData.unitPrice,
      subtotal: priceData.unitPrice * totalQuantity,
      tierLabel: priceData.tierLabel,
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * totalQuantity,
      nextTierHint: buildNextTierHint(priceData, totalQuantity),
    };
  }

  if (config.kind === "print") {
    const service = servicesById[config.serviceId] || null;
    const option = service?.options?.find((item) => item.id === config.optionId) || null;
    const priceData =
      option?.pricingMode === "fixed"
        ? { unitPrice: option.price || 0, tierLabel: "Фиксированная цена" }
        : calculateTieredUnitPrice(option, totalQuantity);
    if (!service || !option || !priceData) return existingItem;
    const fillMultiplier = config.fillMode === "high" ? service.adjustments?.[0]?.multiplier || 1.5 : 1;
    const unitPrice =
      config.fillMode === "unknown" ? null : Math.round(priceData.unitPrice * fillMultiplier);
    const baseUnitPriceRaw =
      option.pricingMode === "fixed" ? option.price || 0 : getBaseTierPrice(option) ?? priceData.unitPrice;
    const baseUnitPrice =
      config.fillMode === "unknown" ? null : Math.round(baseUnitPriceRaw * fillMultiplier);
    const subtotal = hasExactPrice(unitPrice) ? unitPrice * totalQuantity : null;
    return {
      ...existingItem,
      quantity: totalQuantity,
      unitPrice,
      subtotal,
      tierLabel: priceData.tierLabel,
      displayQuantity: undefined,
      displayUnit: hasExactPrice(unitPrice) ? `${formatRubles(unitPrice)} за шт.` : "цену уточнить",
      displayLineTotal: hasExactPrice(subtotal) ? formatRubles(subtotal) : "Уточнить",
      baseUnitPrice,
      originalSubtotal: hasExactPrice(baseUnitPrice) ? baseUnitPrice * totalQuantity : subtotal,
      nextTierHint: buildNextTierHint(priceData, totalQuantity),
      sheetsCount: totalQuantity,
    };
  }

  if (config.kind === "digital_video") {
    const service = servicesById.video_digitization || null;
    const priceData = calculateTieredUnitPrice(service, totalQuantity);
    if (!service || !priceData) return existingItem;
    const unitPrice = priceData.unitPrice;
    const baseUnitPrice = getBaseTierPrice(service) ?? priceData.unitPrice;
    const subtotal = Math.max(unitPrice * totalQuantity, 900);
    return {
      ...existingItem,
      quantity: totalQuantity,
      unitPrice,
      subtotal,
      tierLabel: priceData.tierLabel,
      description: `${priceData.tierLabel}${subtotal > unitPrice * totalQuantity ? " · мин. стоимость кассеты 900 ₽" : ""}`,
      displayQuantity: `${totalQuantity} мин.`,
      displayUnit: `${formatRubles(unitPrice)} за минуту`,
      displayLineTotal: formatRubles(subtotal),
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * totalQuantity,
      nextTierHint: buildNextTierHint(priceData, totalQuantity, "мин."),
    };
  }

  if (config.kind === "digital_film" || config.kind === "digital_service" || config.kind === "digital_addon" || config.kind === "scan_tiered" || config.kind === "sticker") {
    const sourceOption =
      config.kind === "digital_film"
        ? servicesById.film_digitization?.options?.find((item) => item.id === config.optionId)
        : config.kind === "digital_addon"
          ? servicesById.digitization_addons?.options?.find((item) => item.id === config.optionId)
          : config.kind === "scan_tiered"
            ? servicesById[config.serviceId]
            : config.kind === "sticker"
              ? servicesById[config.serviceId]?.options?.find((item) => item.id === config.optionId)
              : servicesById[config.serviceId];
    const priceData =
      sourceOption?.pricingMode === "fixed"
        ? { unitPrice: sourceOption.price || 0, tierLabel: "Фиксированная цена" }
        : calculateTieredUnitPrice(sourceOption, totalQuantity);
    if (!sourceOption || !priceData) return existingItem;
    const baseUnitPrice =
      sourceOption.pricingMode === "fixed"
        ? sourceOption.price || 0
        : getBaseTierPrice(sourceOption) ?? priceData.unitPrice;
    const subtotal = priceData.unitPrice * totalQuantity;
    return {
      ...existingItem,
      quantity: totalQuantity,
      unitPrice: priceData.unitPrice,
      subtotal,
      tierLabel: priceData.tierLabel,
      displayQuantity:
        config.kind === "digital_addon" && config.optionId === "storage_digitization"
          ? `${totalQuantity} ГБ`
          : existingItem.displayQuantity,
      displayUnit:
        config.kind === "digital_addon" && config.optionId === "storage_digitization"
          ? `${formatRubles(priceData.unitPrice)} за ГБ`
          : existingItem.displayUnit,
      displayLineTotal: formatRubles(subtotal),
      baseUnitPrice,
      originalSubtotal: baseUnitPrice * totalQuantity,
      nextTierHint: sourceOption.pricingMode === "fixed" ? null : buildNextTierHint(priceData, totalQuantity, config.optionId === "storage_digitization" ? "ГБ" : "шт."),
    };
  }

  if (config.kind === "binding_sheet") {
    const service = servicesById.binding_sheet_replace || null;
    const priceData = calculateTieredUnitPrice(service, totalQuantity);
    if (!service || !priceData) return existingItem;
    return {
      ...existingItem,
      quantity: totalQuantity,
      unitPrice: priceData.unitPrice,
      subtotal: priceData.unitPrice,
      tierLabel: priceData.tierLabel,
      description: priceData.tierLabel,
      displayQuantity: `${totalQuantity} лист.`,
      displayUnit: formatRubles(priceData.unitPrice),
      displayLineTotal: formatRubles(priceData.unitPrice),
    };
  }

  if (config.kind === "binding_booklet" || config.kind === "docs_pack" || config.kind === "docs_main" || config.kind === "docs_addon" || config.kind === "scan_processed" || config.kind === "scan_file_send" || config.kind === "frame" || config.kind === "gift_fixed" || config.kind === "gift_tshirt" || config.kind === "gift_magnet" || config.kind === "paper") {
    return {
      ...existingItem,
      quantity: totalQuantity,
      subtotal: (existingItem.unitPrice || 0) * totalQuantity,
      displayQuantity:
        config.kind === "binding_booklet"
          ? `${totalQuantity} брош.`
          : config.kind === "docs_main"
            ? `${totalQuantity} наб.`
            : totalQuantity > 1
              ? `${totalQuantity} шт.`
              : existingItem.displayQuantity,
      displayLineTotal: formatRubles((existingItem.unitPrice || 0) * totalQuantity),
    };
  }

  return {
    ...existingItem,
    quantity: totalQuantity,
    subtotal: (existingItem.unitPrice || 0) * totalQuantity,
    displayLineTotal: formatRubles((existingItem.unitPrice || 0) * totalQuantity),
  };
}

function upsertCartItem(draft) {
  const mergeKey = buildMergeKey(draft);
  const existingIndex = calculatorCart.findIndex((item) => buildMergeKey(item) === mergeKey);

  if (existingIndex === -1) {
    calculatorCart.push(draft);
    return { merged: false, quantity: draft.quantity, item: draft };
  }

  const existingItem = calculatorCart[existingIndex];
  const mergedItem = rebuildMergedCartItem(existingItem, existingItem.quantity + draft.quantity);
  mergedItem.id = existingItem.id;
  calculatorCart.splice(existingIndex, 1, mergedItem);
  return { merged: true, quantity: mergedItem.quantity, item: mergedItem };
}

function decrementCartItem(itemId) {
  const index = calculatorCart.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return;
  }

  const item = calculatorCart[index];
  if (item.quantity <= 1) {
    calculatorCart.splice(index, 1);
  } else {
    const updatedItem = rebuildMergedCartItem(item, item.quantity - 1);
    updatedItem.id = item.id;
    calculatorCart.splice(index, 1, updatedItem);
  }

  renderCartSummary();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
}

function incrementCartItem(itemId) {
  const index = calculatorCart.findIndex((item) => item.id === itemId);
  if (index === -1) {
    return;
  }

  const item = calculatorCart[index];
  const updatedItem = rebuildMergedCartItem(item, item.quantity + 1);
  updatedItem.id = item.id;
  calculatorCart.splice(index, 1, updatedItem);
  renderCartSummary();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
}

function buildDraftCartItem(assignId = false) {
  const category = calcCategory?.value || "photo";

  if (category === "photo") {
    return buildPhotoCartItem(assignId);
  }

  if (category === "docs") {
    return buildDocsCartItem(assignId);
  }

  if (category === "scan") {
    return buildScanCartItem(assignId);
  }

  if (category === "print") {
    return buildPrintCartItem(assignId);
  }

  if (category === "digital") {
    return buildDigitalCartItem(assignId);
  }

  if (category === "binding") {
    return buildBindingCartItem(assignId);
  }

  if (category === "gifts") {
    return buildGiftCartItem(assignId);
  }

  if (category === "paper") {
    return buildPaperCartItem(assignId);
  }

  if (category === "sticker") {
    return buildStickerCartItem(assignId);
  }

  if (category === "lamination") {
    return buildLaminationCartItem(assignId);
  }

  return buildFrameCartItem(assignId);
}

function updateCalculatorBuilderNote() {
  if (!calcBuilderNote) {
    return;
  }

  const draft = buildDraftCartItem();
  if (draft.error) {
    calcBuilderNote.textContent = draft.error;
    return;
  }

  calcBuilderNote.textContent = `${draft.title} · ${
    draft.displayQuantity || `${draft.quantity} шт.`
  } · ${draft.displayUnit || (hasExactPrice(draft.unitPrice) ? `${formatRubles(draft.unitPrice)} за шт.` : "цену уточнить")} · ${
    hasExactPrice(draft.subtotal) ? formatRubles(draft.subtotal) : "цену уточнить"
  }`;
}

function getPreviewPromoHints(draft) {
  if (!draft) {
    return [];
  }

  const hints = [];

  if (draft.category === "photo") {
    hints.push("С этим фото можно добавить ламинацию -10% или рамку -15%");
  }

  if (draft.category === "lamination") {
    hints.push("При печати фото этого же формата ламинация получает скидку -10%");
  }

  if (draft.category === "frames") {
    hints.push("При печати фото этого же формата рамка получает скидку -15%");
  }

  if (draft.category === "sticker") {
    hints.push("Самоклейка с ламинацией даёт скидку -5% на ламинацию");
  }

  if (draft.category === "binding" || draft.category === "print") {
    hints.push("Распечатка вместе с брошюровкой может дать скидку от -5% до -10%");
  }

  if (draft.category === "gifts") {
    hints.push("Сувениры считаются парами: каждые 2 шт. дают скидку -10%");
  }

  return hints;
}

function renderCalculatorPreview() {
  if (
    !calcPreviewMeta ||
    !calcPreviewTitle ||
    !calcPreviewDescription ||
    !calcPreviewTotal ||
    !calcPreviewBadges
  ) {
    return;
  }

  const draft = buildDraftCartItem();
  const categoryLabel =
    calculatorCategoryLabels[calcCategory?.value || "photo"] || calculatorCategoryLabels.photo;

  if (draft.error) {
    calcPreviewMeta.textContent = categoryLabel;
    calcPreviewTitle.textContent = "Нужно уточнение";
    calcPreviewDescription.textContent = draft.error;
    calcPreviewTotal.textContent = "Уточнить";
    calcPreviewBadges.innerHTML = '<span class="calculator-badge calculator-pill-warn">Проверьте параметры позиции</span>';
    return;
  }

  calcPreviewMeta.textContent = categoryLabel;
  calcPreviewTitle.textContent = draft.title;
  calcPreviewDescription.textContent =
    draft.description || "Краткое описание появится после выбора параметров.";
  calcPreviewTotal.textContent = hasExactPrice(draft.subtotal)
    ? formatRubles(draft.subtotal)
    : "Уточнить";

  const badges = [];

  if (draft.tierLabel) {
    badges.push(
      `<span class="calculator-badge calculator-pill-good">${escapeHtml(
        draft.tierLabel
      )}${hasExactPrice(draft.unitPrice) ? ` · ${escapeHtml(draft.displayUnit || `${formatRubles(draft.unitPrice)} за шт.`)}` : ""}</span>`
    );
  }

  if (
    hasExactPrice(draft.originalSubtotal) &&
    hasExactPrice(draft.subtotal) &&
    draft.originalSubtotal > draft.subtotal
  ) {
    badges.push(
      `<span class="calculator-badge calculator-pill-good">Тиражная скидка уже учтена: -${escapeHtml(
        formatRubles(draft.originalSubtotal - draft.subtotal)
      )}</span>`
    );
  }

  if (draft.nextTierHint?.remaining > 0) {
    badges.push(
      `<span class="calculator-badge">До следующей цены: ещё ${escapeHtml(
        String(draft.nextTierHint.remaining)
      )} ${escapeHtml(draft.nextTierHint.unitLabel || "шт.")} · ${escapeHtml(
        formatRubles(draft.nextTierHint.unitPrice)
      )}</span>`
    );
  }

  if (draft.customSurcharge) {
    badges.push(
      `<span class="calculator-badge calculator-pill-warn">Нестандартный размер: +${escapeHtml(
        formatRubles(draft.customSurcharge)
      )} за фото</span>`
    );
  }

  if (draft.requiresConfirmation) {
    badges.push(
      '<span class="calculator-badge calculator-pill-warn">Есть часть с ручным уточнением цены</span>'
    );
  }

  getPreviewPromoHints(draft).forEach((hint) => {
    badges.push(`<span class="calculator-badge calculator-pill-muted">${escapeHtml(hint)}</span>`);
  });

  calcPreviewBadges.innerHTML = badges.join("");
}

function expandItemUnits(items, category, format) {
  return items
    .filter((item) => item.category === category && item.format === format)
    .flatMap((item) =>
      Array.from({ length: item.quantity }, () => ({
        unitPrice: item.unitPrice,
      }))
    )
    .sort((a, b) => b.unitPrice - a.unitPrice);
}

function expandUnitsByPredicate(items, predicate) {
  return items
    .filter((item) => predicate(item) && hasExactPrice(item.unitPrice))
    .flatMap((item) =>
      Array.from({ length: item.quantity }, (_, index) => ({
        unitPrice: item.unitPrice,
        title: item.title,
        description: item.description,
        category: item.category,
        itemKind: item.itemKind,
        format: item.format,
        giftKind: item.giftKind || null,
        sourceId: item.id,
        unitIndex: index,
      }))
    )
    .sort((a, b) => b.unitPrice - a.unitPrice);
}

function createMinCostMaxFlow(nodeCount) {
  const graph = Array.from({ length: nodeCount }, () => []);

  function addEdge(from, to, capacity, cost, meta = null) {
    const forward = {
      to,
      rev: graph[to].length,
      capacity,
      cost,
      meta,
      flow: 0,
    };
    const backward = {
      to: from,
      rev: graph[from].length,
      capacity: 0,
      cost: -cost,
      meta: null,
      flow: 0,
    };
    graph[from].push(forward);
    graph[to].push(backward);
  }

  function findNegativePath(source, sink) {
    const dist = Array(nodeCount).fill(Infinity);
    const inQueue = Array(nodeCount).fill(false);
    const prevNode = Array(nodeCount).fill(-1);
    const prevEdge = Array(nodeCount).fill(-1);
    const queue = [source];

    dist[source] = 0;
    inQueue[source] = true;

    while (queue.length) {
      const node = queue.shift();
      inQueue[node] = false;

      graph[node].forEach((edge, index) => {
        if (edge.capacity <= 0) {
          return;
        }

        const nextDistance = dist[node] + edge.cost;
        if (nextDistance < dist[edge.to]) {
          dist[edge.to] = nextDistance;
          prevNode[edge.to] = node;
          prevEdge[edge.to] = index;

          if (!inQueue[edge.to]) {
            queue.push(edge.to);
            inQueue[edge.to] = true;
          }
        }
      });
    }

    if (!Number.isFinite(dist[sink]) || dist[sink] >= 0) {
      return null;
    }

    return { dist, prevNode, prevEdge };
  }

  return {
    graph,
    addEdge,
    maximizeNegativeCost(source, sink) {
      let totalCost = 0;

      while (true) {
        const path = findNegativePath(source, sink);
        if (!path) {
          break;
        }

        let flow = Infinity;
        for (let node = sink; node !== source; node = path.prevNode[node]) {
          const edge = graph[path.prevNode[node]][path.prevEdge[node]];
          flow = Math.min(flow, edge.capacity);
        }

        for (let node = sink; node !== source; node = path.prevNode[node]) {
          const edge = graph[path.prevNode[node]][path.prevEdge[node]];
          edge.capacity -= flow;
          edge.flow += flow;
          const reverse = graph[edge.to][edge.rev];
          reverse.capacity += flow;
          reverse.flow -= flow;
        }

        totalCost += path.dist[sink] * flow;
      }

      return totalCost;
    },
  };
}

function aggregateDiscountDetails(records) {
  const aggregated = new Map();

  records.forEach((record, index) => {
    const key = record.groupId || record.id || `discount-${index}`;
    const existing = aggregated.get(key) || {
      id: key,
      label: record.label,
      amount: 0,
      count: 0,
      details: [],
      itemIds: [],
      type: record.type || "promo",
    };

    existing.amount += record.amount || 0;
    existing.count += record.count || 1;
    if (record.detail) {
      existing.details.push(record.detail);
    }
    if (record.itemIds?.length) {
      existing.itemIds.push(...record.itemIds);
    }
    aggregated.set(key, existing);
  });

  return Array.from(aggregated.values()).map((discount) => ({
    ...discount,
    itemIds: Array.from(new Set(discount.itemIds)),
  }));
}

function calculatePhotoBundleDiscounts(items) {
  const photoUnits = expandUnitsByPredicate(items, (item) => item.category === "photo");
  const frameUnits = expandUnitsByPredicate(items, (item) => item.category === "frames");
  const laminationUnits = expandUnitsByPredicate(items, (item) => item.category === "lamination");
  const digitizedFilmUnits = expandUnitsByPredicate(items, (item) => item.itemKind === "digital_film");

  if (!photoUnits.length) {
    return [];
  }

  const partners = [
    ...frameUnits.map((unit) => ({ ...unit, discountType: "frame" })),
    ...laminationUnits.map((unit) => ({ ...unit, discountType: "lamination" })),
    ...digitizedFilmUnits.map((unit) => ({ ...unit, discountType: "digitization" })),
  ];

  if (!partners.length) {
    return [];
  }

  const source = 0;
  const photoOffset = 1;
  const partnerOffset = photoOffset + photoUnits.length;
  const sink = partnerOffset + partners.length;
  const flow = createMinCostMaxFlow(sink + 1);

  photoUnits.forEach((photo, index) => {
    flow.addEdge(source, photoOffset + index, 1, 0);
  });

  partners.forEach((partner, index) => {
    flow.addEdge(partnerOffset + index, sink, 1, 0);
  });

  photoUnits.forEach((photo, photoIndex) => {
    partners.forEach((partner, partnerIndex) => {
      let amount = null;
      let label = "";
      let detail = "";
      let groupId = "";

      if (partner.discountType === "frame" && photo.format === partner.format) {
        amount = Math.round(partner.unitPrice * 0.15);
        label = "Фото + фоторамка";
        detail = `Рамка ${partner.format} со скидкой 15%`;
        groupId = `frame-${partner.format}`;
      } else if (partner.discountType === "lamination" && photo.format === partner.format) {
        amount = Math.round(partner.unitPrice * 0.1);
        label = "Фото + ламинация";
        detail = `Ламинация ${partner.format} со скидкой 10%`;
        groupId = `lamination-${partner.format}`;
      } else if (partner.discountType === "digitization") {
        amount = Math.round(photo.unitPrice * 0.1);
        label = "После оцифровки фотоплёнки";
        detail = `Печать фото ${photo.format} со скидкой 10%`;
        groupId = `digitization-${photo.format}`;
      }

      if (!amount || amount <= 0) {
        return;
      }

      flow.addEdge(photoOffset + photoIndex, partnerOffset + partnerIndex, 1, -amount, {
        amount,
        label,
        detail,
        groupId,
        type: partner.discountType,
        itemIds:
          partner.discountType === "digitization"
            ? [photo.sourceId]
            : [partner.sourceId],
      });
    });
  });

  flow.maximizeNegativeCost(source, sink);

  const discounts = [];
  photoUnits.forEach((photo, photoIndex) => {
    flow.graph[photoOffset + photoIndex].forEach((edge) => {
      if (!edge.meta || edge.flow <= 0) {
        return;
      }
      discounts.push({
        id: `${edge.meta.groupId}-${photoIndex}`,
        groupId: edge.meta.groupId,
        label: edge.meta.label,
        amount: edge.meta.amount,
        detail: edge.meta.detail,
        itemIds: edge.meta.itemIds,
        type: edge.meta.type,
      });
    });
  });

  return aggregateDiscountDetails(discounts);
}

function calculateGiftDiscounts(items) {
  const giftUnits = expandUnitsByPredicate(items, (item) => item.category === "gifts");

  if (giftUnits.length < 2) {
    return [];
  }

  const sorted = [...giftUnits].sort((a, b) => b.unitPrice - a.unitPrice);
  const usable = sorted.slice(0, sorted.length - (sorted.length % 2));
  const discounts = [];

  for (let index = 0; index < usable.length; index += 2) {
    const first = usable[index];
    const second = usable[index + 1];
    const amount = Math.round((first.unitPrice + second.unitPrice) * 0.1);

    discounts.push({
      id: `gift-pair-${index / 2}`,
      groupId: "gift-pairs",
      label: "Сувенирная печать",
      amount,
      detail: `${first.title} + ${second.title} · скидка 10% на комплект`,
      itemIds: [first.sourceId, second.sourceId],
      type: "gift",
    });
  }

  return aggregateDiscountDetails(discounts);
}

function calculatePrintBindingDiscounts(items) {
  const printItems = items.filter(
    (item) =>
      item.category === "print" &&
      !item.requiresConfirmation &&
      hasExactPrice(item.subtotal) &&
      /распечатка/i.test(item.title)
  );
  const bindingItems = items.filter(
    (item) =>
      item.category === "binding" &&
      item.itemKind === "binding_booklet" &&
      !item.requiresConfirmation &&
      hasExactPrice(item.subtotal)
  );

  if (!printItems.length || !bindingItems.length) {
    return [];
  }

  const printSheets = printItems.reduce((sum, item) => sum + (item.sheetsCount || item.quantity || 0), 0);
  const bindingSheets = bindingItems.reduce((sum, item) => sum + (item.sheetsCount || 0), 0);
  const percent = printSheets >= 100 && bindingSheets >= 100 ? 10 : printSheets >= 20 && bindingSheets >= 20 ? 5 : 0;

  if (!percent) {
    return [];
  }

  const eligibleSubtotal =
    printItems.reduce((sum, item) => sum + item.subtotal, 0) +
    bindingItems.reduce((sum, item) => sum + item.subtotal, 0);

  return [
    {
      id: "print-binding",
      label: "Распечатка + брошюровка",
      amount: Math.round(eligibleSubtotal * (percent / 100)),
      details: [
        `Печать ${printSheets} лист. + брошюровка ${bindingSheets} лист. · скидка ${percent}%`,
      ],
      itemIds: [...printItems.map((item) => item.id), ...bindingItems.map((item) => item.id)],
      type: "bundle",
      count: 1,
    },
  ];
}

function calculateStickerLaminationDiscounts(items) {
  const stickerUnits = expandUnitsByPredicate(items, (item) => item.category === "sticker");
  const laminationUnits = expandUnitsByPredicate(items, (item) => item.category === "lamination");

  if (!stickerUnits.length || !laminationUnits.length) {
    return [];
  }

  const source = 0;
  const stickerOffset = 1;
  const laminationOffset = stickerOffset + stickerUnits.length;
  const sink = laminationOffset + laminationUnits.length;
  const flow = createMinCostMaxFlow(sink + 1);

  stickerUnits.forEach((unit, index) => {
    flow.addEdge(source, stickerOffset + index, 1, 0);
  });

  laminationUnits.forEach((unit, index) => {
    flow.addEdge(laminationOffset + index, sink, 1, 0);
  });

  stickerUnits.forEach((sticker, stickerIndex) => {
    const stickerFormat = sticker.title.split(" ").pop();
    laminationUnits.forEach((lamination, laminationIndex) => {
      if (stickerFormat !== lamination.format) {
        return;
      }

      const amount = Math.round(lamination.unitPrice * 0.05);
      if (amount <= 0) {
        return;
      }

      flow.addEdge(stickerOffset + stickerIndex, laminationOffset + laminationIndex, 1, -amount, {
        amount,
        label: "Самоклейка + ламинация",
        detail: `Ламинация ${lamination.format} со скидкой 5%`,
        itemIds: [lamination.sourceId],
        groupId: `sticker-lamination-${lamination.format}`,
        type: "bundle",
      });
    });
  });

  flow.maximizeNegativeCost(source, sink);

  const discounts = [];
  stickerUnits.forEach((unit, stickerIndex) => {
    flow.graph[stickerOffset + stickerIndex].forEach((edge) => {
      if (!edge.meta || edge.flow <= 0) {
        return;
      }

      discounts.push({
        id: `${edge.meta.groupId}-${stickerIndex}`,
        ...edge.meta,
      });
    });
  });

  return aggregateDiscountDetails(discounts);
}

function calculateAppliedDiscounts(items) {
  return [
    ...calculatePhotoBundleDiscounts(items),
    ...calculateGiftDiscounts(items),
    ...calculatePrintBindingDiscounts(items),
    ...calculateStickerLaminationDiscounts(items),
  ];
}

function calculateTierDiscounts(items) {
  return items
    .filter(
      (item) =>
        hasExactPrice(item.subtotal) &&
        hasExactPrice(item.originalSubtotal) &&
        item.originalSubtotal > item.subtotal
    )
    .map((item) => ({
      id: `tier-${item.id}`,
      label: "Тиражная скидка",
      amount: item.originalSubtotal - item.subtotal,
      details: [`${item.title} · ${item.tierLabel}`],
      itemIds: [item.id],
      type: "tier",
      count: 1,
    }));
}

function calculateSavingsTips(items, subtotal, appliedDiscountAmount) {
  const tips = [];
  const seen = new Set();

  function addTip(id, text, priority = 0) {
    if (!text || seen.has(id)) {
      return;
    }
    seen.add(id);
    tips.push({ id, text, priority });
  }

  items.forEach((item) => {
    const hint = item.nextTierHint;
    if (!hint || !hint.remaining) {
      return;
    }

    const futureQuantity = hint.threshold;
    const estimatedTotal = futureQuantity * hint.unitPrice;
    const currentTotal = hasExactPrice(item.subtotal) ? item.subtotal : item.quantity * item.unitPrice;
    const extraCost = Math.max(0, estimatedTotal - currentTotal);
    addTip(
      `tier-${item.id}`,
      `Для «${item.title}» добавьте ещё ${hint.remaining} ${hint.unitLabel}, чтобы перейти в диапазон ${hint.label || hint.threshold} и платить по ${formatRubles(hint.unitPrice)} за единицу.`,
      extraCost
    );
  });

  const giftUnits = expandUnitsByPredicate(items, (item) => item.category === "gifts");
  if (giftUnits.length % 2 === 1 && giftUnits.length > 0) {
    addTip(
      "gift-pair",
      "Добавьте ещё 1 сувенир, и он соберётся в пару со скидкой 10% на комплект.",
      50
    );
  }

  const photoUnits = expandUnitsByPredicate(items, (item) => item.category === "photo");
  const laminationUnits = expandUnitsByPredicate(items, (item) => item.category === "lamination");
  const frameUnits = expandUnitsByPredicate(items, (item) => item.category === "frames");

  const countByFormat = (units) =>
    units.reduce((map, unit) => {
      map.set(unit.format, (map.get(unit.format) || 0) + 1);
      return map;
    }, new Map());

  const photoByFormat = countByFormat(photoUnits);
  const laminationByFormat = countByFormat(laminationUnits);
  const frameByFormat = countByFormat(frameUnits);

  photoByFormat.forEach((count, format) => {
    if ((laminationByFormat.get(format) || 0) < count) {
      addTip(
        `lamination-${format}`,
        `Для фото ${format} можно добавить ламинацию: на ламинацию по этой связке действует скидка 10%.`,
        30
      );
    }

    if ((frameByFormat.get(format) || 0) < count) {
      addTip(
        `frame-${format}`,
        `Для фото ${format} можно добавить фоторамку: на рамку по этой связке действует скидка 15%.`,
        20
      );
    }
  });

  const printSheets = items
    .filter((item) => item.category === "print" && /распечатка/i.test(item.title))
    .reduce((sum, item) => sum + (item.sheetsCount || item.quantity || 0), 0);
  const bindingSheets = items
    .filter((item) => item.category === "binding" && item.itemKind === "binding_booklet")
    .reduce((sum, item) => sum + (item.sheetsCount || 0), 0);

  if (printSheets > 0 || bindingSheets > 0) {
    if (printSheets < 20 || bindingSheets < 20) {
      const missingPrint = Math.max(0, 20 - printSheets);
      const missingBinding = Math.max(0, 20 - bindingSheets);
      if (missingPrint || missingBinding) {
        addTip(
          "print-binding-20",
          `Для скидки 5% на связку распечатки и брошюровки не хватает: печать ${missingPrint} лист., брошюровка ${missingBinding} лист.`,
          40
        );
      }
    } else if (printSheets < 100 || bindingSheets < 100) {
      const missingPrint = Math.max(0, 100 - printSheets);
      const missingBinding = Math.max(0, 100 - bindingSheets);
      addTip(
        "print-binding-100",
        `До скидки 10% на связку распечатки и брошюровки не хватает: печать ${missingPrint} лист., брошюровка ${missingBinding} лист.`,
        45
      );
    }
  }

  if (!isReviewPromoEnabled() && subtotal > 0) {
    const reviewLimit = Math.max(0, Math.round(subtotal * 0.2) - appliedDiscountAmount);
    const reviewDiscount = Math.min(Math.round(subtotal * 0.15), reviewLimit);
    if (reviewDiscount > 0) {
      addTip(
        "review",
        `Отзыв на Яндекс Картах даст ещё до ${formatRubles(reviewDiscount)} скидки по текущей корзине.`,
        10
      );
    }
  }

  return tips.sort((a, b) => a.priority - b.priority).slice(0, 6);
}

function calculateCartTotals() {
  const subtotal = calculatorCart.reduce(
    (sum, item) => sum + (hasExactPrice(item.subtotal) ? item.subtotal : 0),
    0
  );
  const originalSubtotal = calculatorCart.reduce(
    (sum, item) =>
      sum +
      (hasExactPrice(item.originalSubtotal)
        ? item.originalSubtotal
        : hasExactPrice(item.subtotal)
          ? item.subtotal
          : 0),
    0
  );
  const unresolvedItems = calculatorCart.filter((item) => item.requiresConfirmation);
  const tierDiscounts = calculateTierDiscounts(calculatorCart);
  const promoDiscounts = calculateAppliedDiscounts(calculatorCart);
  const appliedDiscounts = [...tierDiscounts, ...promoDiscounts];
  const appliedDiscountAmount = appliedDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
  const reviewLimit = Math.max(0, Math.round(originalSubtotal * 0.2) - appliedDiscountAmount);
  const reviewPotentialAmount = isReviewPromoEnabled() ? Math.round(originalSubtotal * 0.15) : 0;
  const reviewDiscountAmount = isReviewPromoEnabled()
    ? Math.min(reviewPotentialAmount, reviewLimit)
    : 0;
  const reviewBlockedAmount = isReviewPromoEnabled()
    ? Math.max(0, reviewPotentialAmount - reviewDiscountAmount)
    : 0;
  const discountAmount = appliedDiscountAmount + reviewDiscountAmount;
  const total = subtotal - discountAmount;

  return {
    subtotal,
    originalSubtotal,
    unresolvedItems,
    tierDiscounts,
    promoDiscounts,
    appliedDiscounts,
    appliedDiscountAmount,
    reviewPotentialAmount,
    reviewDiscountAmount,
    reviewBlockedAmount,
    discountAmount,
    total,
    savingsTips: calculateSavingsTips(calculatorCart, subtotal, appliedDiscountAmount),
  };
}

function renderCartSummary() {
  if (
    !calcCartBadge ||
    !calcCartTotal ||
    !calcCartSummary ||
    !calcCartList ||
    !calcCartEmpty ||
    !calcCartSubtotal ||
    !calcCartDiscounts ||
    !calcCartGrandTotal ||
    !calcCartMeta ||
    !calcCartInsights ||
    !calcCartAppliedDiscounts ||
    !calcCartSavingsTips ||
    !calcCartNote ||
    !calcCartTransfer ||
    !calcCartClear
  ) {
    return;
  }

  if (!calculatorCart.length) {
    calcCartBadge.textContent = "Пустой расчёт";
    calcCartTotal.textContent = "0 ₽";
    calcCartSummary.textContent = "Добавьте позицию из калькулятора, чтобы увидеть итог и скидки.";
    calcCartList.innerHTML = "";
    calcCartEmpty.hidden = false;
    calcCartSubtotal.textContent = "0 ₽";
    calcCartDiscounts.textContent = "0 ₽";
    calcCartGrandTotal.textContent = "0 ₽";
    calcCartMeta.textContent = "Комплекты считаются по совпадающим форматам.";
    calcCartInsights.hidden = true;
    calcCartAppliedDiscounts.innerHTML = "";
    calcCartSavingsTips.innerHTML = "";
    calcCartNote.textContent = "Здесь собирается общий расчёт заказа из нескольких позиций.";
    calcCartTransfer.disabled = true;
    calcCartClear.disabled = true;
    return;
  }

  const totals = calculateCartTotals();

  calcCartBadge.textContent = totals.unresolvedItems.length
    ? "Есть позиции с уточнением"
    : totals.discountAmount > 0
      ? "Корзина со скидками"
      : "Корзина готова";
  calcCartTotal.textContent = totals.unresolvedItems.length
    ? totals.subtotal > 0
      ? `от ${formatRubles(totals.total)}`
      : "Уточнить"
    : formatRubles(totals.total);
  calcCartSummary.textContent = totals.unresolvedItems.length
    ? `В корзине ${calculatorCart.length} поз. · ${totals.unresolvedItems.length} поз. нужно уточнить`
    : `В корзине ${calculatorCart.length} поз. · видно итог и все сработавшие скидки`;
  calcCartEmpty.hidden = true;
  calcCartList.innerHTML = calculatorCart
    .map(
      (item) => `
        <article class="calculator-cart-item">
          <div class="calculator-cart-copy">
            <strong>${item.title}</strong>
            <span>${item.description}</span>
            <span>${item.displayQuantity || `${item.quantity} шт.`} · ${item.displayUnit || `${formatRubles(item.unitPrice)} за шт.`}</span>
            <div class="calculator-cart-actions">
              <button class="calculator-remove" type="button" data-decrement-id="${item.id}">${
                item.quantity > 1 ? "−1" : "Убрать"
              }</button>
              <button class="calculator-remove" type="button" data-increment-id="${item.id}">+1</button>
              <button class="calculator-remove" type="button" data-remove-id="${item.id}">Удалить</button>
            </div>
          </div>
          <div class="calculator-cart-side">
            <strong>${item.displayLineTotal || formatRubles(item.subtotal)}</strong>
          </div>
        </article>
      `
    )
    .join("");

  const discountParts = [];
  totals.appliedDiscounts.forEach((discount) => {
    discountParts.push(`${discount.label}: -${formatRubles(discount.amount)}`);
  });
  if (totals.reviewDiscountAmount > 0) {
    discountParts.push(`Отзыв на Яндекс Картах: -${formatRubles(totals.reviewDiscountAmount)}`);
  }
  if (isReviewPromoEnabled() && totals.reviewBlockedAmount > 0) {
    discountParts.push(`Лимит отзыва: недоступно ${formatRubles(totals.reviewBlockedAmount)}`);
  }

  calcCartSubtotal.textContent = totals.unresolvedItems.length
    ? formatRubles(totals.subtotal)
    : formatRubles(totals.originalSubtotal || totals.subtotal);
  calcCartDiscounts.textContent = totals.discountAmount > 0 ? `−${formatRubles(totals.discountAmount)}` : "0 ₽";
  calcCartGrandTotal.textContent = totals.unresolvedItems.length
    ? `от ${formatRubles(totals.total)}`
    : formatRubles(totals.total);
  calcCartMeta.textContent = totals.unresolvedItems.length
    ? "Позиции с пометкой «цену уточнить» не входят в точный итог и требуют уточнения у вас."
    : "Тиражные цены уже учтены в позициях. Ниже показаны дополнительные акции по связкам и комплектам.";
  calcCartNote.textContent = totals.unresolvedItems.length
    ? "Если часть листов с заливкой, а часть без неё, добавляйте их отдельными строками."
    : totals.discountAmount > 0
      ? `Итоговая скидка: ${formatRubles(totals.discountAmount)}`
      : "Можно добавить ещё позиции из других категорий.";

  const appliedLines = [
    ...totals.appliedDiscounts.map(
      (discount) => `
        <div class="calculator-line">
          <span>${discount.label}${discount.details?.length ? ` · ${discount.details.join("; ")}` : ""}</span>
          <strong>-${formatRubles(discount.amount)}</strong>
        </div>
      `
    ),
    ...(totals.reviewDiscountAmount > 0
      ? [
          `
        <div class="calculator-line">
          <span>Отзыв на Яндекс Картах · скидка применяется после остальных акций</span>
          <strong>-${formatRubles(totals.reviewDiscountAmount)}</strong>
        </div>
      `,
        ]
      : []),
    ...(isReviewPromoEnabled() && totals.reviewBlockedAmount > 0
      ? [
          `
        <div class="calculator-line">
          <span>Отзыв на Яндекс Картах · часть скидки не поместилась в лимит 20%</span>
          <strong>${formatRubles(totals.reviewBlockedAmount)} не применилось</strong>
        </div>
      `,
        ]
      : []),
  ];
  const savingsLines = totals.savingsTips.map(
    (tip) => `
      <div class="calculator-line">
        <span>${tip.text}</span>
      </div>
    `
  );

  calcCartAppliedDiscounts.innerHTML = appliedLines.length
    ? appliedLines.join("")
    : `<div class="calculator-line"><span>Акции пока не применены</span><strong>0 ₽</strong></div>`;
  calcCartSavingsTips.innerHTML = savingsLines.length ? savingsLines.join("") : "";
  calcCartInsights.hidden = false;
  const [discountSection, tipsSection] = calcCartInsights.querySelectorAll(".calculator-insight");
  if (discountSection) {
    discountSection.hidden = false;
  }
  if (tipsSection) {
    tipsSection.hidden = savingsLines.length === 0;
  }
  calcCartTransfer.disabled = false;
  calcCartClear.disabled = false;
}

function handleCalculatorFieldChange(event) {
  if (event.target?.id === "calcPhotoFormat") {
    populatePhotoPaperField();
  }

  if (event.target?.id === "calcDocsMode") {
    renderDocsFields();
  }

  if (event.target?.id === "calcScanMode") {
    renderScanFields();
  }

  if (event.target?.id === "calcPrintMode") {
    renderPrintFields();
  }

  if (event.target?.id === "calcDigitalMode" || event.target?.id === "calcDigitalAddon") {
    renderDigitalFields();
  }

  if (event.target?.id === "calcBindingMode") {
    renderBindingFields();
  }

  if (event.target?.id === "calcGiftMode" || event.target?.id === "calcGiftTshirtBase") {
    renderGiftFields();
  }

  if (event.target?.id === "calcPaperOption") {
    renderPaperFields();
  }

  if (event.target?.id === "calcStickerType") {
    renderStickerFields();
  }

  updateCalculatorBuilderNote();
  renderCalculatorPreview();
}

function addDraftToCart() {
  const draft = buildDraftCartItem(true);

  if (draft.error) {
    if (calcBuilderNote) {
      calcBuilderNote.textContent = draft.error;
    }
    return;
  }

  const result = upsertCartItem(draft);
  renderCartSummary();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
  showCalculatorToast(
    result?.merged
      ? `Такая позиция уже была в расчёте — количество увеличено до ${result.quantity}.`
      : "Позиция добавлена в расчёт."
  );
}

function replaceCartWithDraft() {
  const draft = buildDraftCartItem(true);

  if (draft.error) {
    if (calcBuilderNote) {
      calcBuilderNote.textContent = draft.error;
    }
    return;
  }

  calculatorCart = [draft];
  renderCartSummary();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
  showCalculatorToast("Расчёт обновлён только этой позицией.");
}

function removeCartItem(itemId) {
  calculatorCart = calculatorCart.filter((item) => item.id !== itemId);
  renderCartSummary();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
  showCalculatorToast("Позиция убрана из расчёта.");
}

function clearCalculatorCart() {
  calculatorCart = [];
  renderCartSummary();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
  showCalculatorToast("Корзина очищена.");
}

function buildCartTextForOrder() {
  if (!calculatorCart.length) {
    return "";
  }

  const totals = calculateCartTotals();
  const lines = calculatorCart.map(
    (item) =>
      `${item.title}: ${item.displayQuantity || `${item.quantity} шт.`} по ${item.displayUnit || `${formatRubles(item.unitPrice)} за шт.`} (${item.displayLineTotal || formatRubles(
        item.subtotal
      )})`
  );

  totals.appliedDiscounts.forEach((discount) => {
    lines.push(`${discount.label}: -${formatRubles(discount.amount)}`);
  });

  if (totals.reviewDiscountAmount > 0) {
    lines.push(`Отзыв на Яндекс Картах: -${formatRubles(totals.reviewDiscountAmount)}`);
  }

  if (totals.reviewBlockedAmount > 0) {
    lines.push(`Отзыв ограничен лимитом 20%: не применилось ${formatRubles(totals.reviewBlockedAmount)}`);
  }

  if (totals.unresolvedItems.length) {
    lines.push(`Итог по рассчитанной части: ${formatRubles(totals.total)}`);
    lines.push(`Есть позиции с пометкой «цену уточнить»`);
  } else {
    lines.push(`Итог: ${formatRubles(totals.total)}`);
  }

  return `Калькулятор заказа: ${lines.join("; ")}.`;
}

function transferCartToOrder() {
  const detailsText = buildCartTextForOrder();
  if (!detailsText || !orderDetails) {
    return;
  }

  const categories = new Set(calculatorCart.map((item) => item.category));
  let serviceTitle = "Печать фото";

  if (categories.size === 1 && categories.has("docs")) {
    serviceTitle = "Фото на документы";
  } else if (categories.size === 1 && categories.has("scan")) {
    serviceTitle = "Сканирование";
  } else if (categories.size === 1 && categories.has("print")) {
    serviceTitle = "Ксерокопии и распечатка";
  } else if (categories.size === 1 && categories.has("digital")) {
    serviceTitle = "Оцифровка";
  } else if (categories.size === 1 && categories.has("binding")) {
    serviceTitle = "Брошюровка";
  } else if (categories.size === 1 && categories.has("gifts")) {
    serviceTitle = "Сувенирная печать";
  } else if (categories.size === 1 && categories.has("paper")) {
    serviceTitle = "Плотная бумага";
  } else if (categories.size === 1 && categories.has("sticker")) {
    serviceTitle = "Самоклеющаяся бумага";
  } else if (categories.size === 1 && categories.has("lamination")) {
    serviceTitle = "Ламинирование";
  } else if (!categories.has("photo") && categories.has("lamination")) {
    serviceTitle = "Ламинирование";
  }

  selectOrderService(serviceTitle);
  orderDetails.value = detailsText;
  updateOrderMessage();
  document.querySelector("#order")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function initializeCalculatorCart() {
  if (!calcCategory || !calcFields) {
    return;
  }

  populateCalculatorCategories();
  renderCalculatorFields();
  updateCalculatorBuilderNote();
  renderCalculatorPreview();
  renderCartSummary();

  calcCategory.addEventListener("change", () => {
    renderCalculatorFields();
    updateCalculatorBuilderNote();
    renderCalculatorPreview();
  });

  calcFields.addEventListener("input", handleCalculatorFieldChange);
  calcFields.addEventListener("change", handleCalculatorFieldChange);
  calcAddItem?.addEventListener("click", addDraftToCart);
  calcReplaceItem?.addEventListener("click", replaceCartWithDraft);
  calcReviewPromo?.addEventListener("change", renderCartSummary);
  calcCartList?.addEventListener("click", (event) => {
    const decrementButton = event.target.closest("[data-decrement-id]");
    if (decrementButton) {
      decrementCartItem(decrementButton.dataset.decrementId);
      return;
    }

    const incrementButton = event.target.closest("[data-increment-id]");
    if (incrementButton) {
      incrementCartItem(incrementButton.dataset.incrementId);
      return;
    }

    const removeButton = event.target.closest("[data-remove-id]");
    if (!removeButton) {
      return;
    }

    removeCartItem(removeButton.dataset.removeId);
  });
  calcCartTransfer?.addEventListener("click", transferCartToOrder);
  calcCartClear?.addEventListener("click", clearCalculatorCart);
}

initializeCalculatorCart();

function updateMobileStickyVisibility() {
  if (!mobileSticky) {
    return;
  }

  const reachedContacts =
    contactSection &&
    contactSection.getBoundingClientRect().top <= window.innerHeight - 120;
  const priceRect = priceSection && priceSection.getBoundingClientRect();
  const viewingPrices =
    priceRect && priceRect.top < window.innerHeight - 80 && priceRect.bottom > 120;
  document.body.classList.toggle("hide-mobile-sticky", Boolean(viewingPrices));
  const shouldShow =
    window.innerWidth <= 760 && window.scrollY > 260 && !reachedContacts && !viewingPrices;
  mobileSticky.classList.toggle("is-visible", shouldShow);
}

function updateScrollTopButtonVisibility() {
  if (!scrollTopButton) {
    return;
  }

  const documentHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const revealOffset = Math.max(0, documentHeight - viewportHeight - 700);
  const shouldShow = window.scrollY >= revealOffset;
  scrollTopButton.classList.toggle("is-visible", shouldShow);
}

function closeActionMenu(menu) {
  menu.classList.remove("open");
  const toggle = menu.querySelector(".header-menu-toggle, .action-menu-toggle, .header-nav-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }
}

actionMenus.forEach((menu) => {
  const toggle = menu.querySelector(".header-menu-toggle, .action-menu-toggle, .header-nav-toggle");
  const links = menu.querySelectorAll(".header-menu-dropdown a, .action-menu-dropdown a, .nav a");

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

if (cookieBanner && cookieBannerAccept) {
  const cookieAccepted = localStorage.getItem("fotochkaCookieConsent") === "accepted";
  cookieBanner.hidden = cookieAccepted;

  cookieBannerAccept.addEventListener("click", () => {
    localStorage.setItem("fotochkaCookieConsent", "accepted");
    cookieBanner.hidden = true;
  });
}

updateMobileStickyVisibility();
updateScrollTopButtonVisibility();
window.addEventListener("scroll", updateMobileStickyVisibility, { passive: true });
window.addEventListener("scroll", updateScrollTopButtonVisibility, { passive: true });
window.addEventListener("resize", updateMobileStickyVisibility);
window.addEventListener("resize", updateScrollTopButtonVisibility);

if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

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

  resetPriceExpansion();

  if (priceEmptyMessage) {
    priceEmptyMessage.classList.toggle("is-visible", visibleCount === 0);
  }
}

priceTableCards.forEach((card) => {
  const toggle = card.querySelector(".price-card-toggle");
  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const nextOpen = !card.classList.contains("is-open");
    if (nextOpen) {
      closeSiblingPriceCards(card);
    }
    setPriceCardOpen(card, nextOpen);
    if (nextOpen) {
      keepPriceItemInView(card);
    }
  });
});

setupPriceSubcategories();

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
