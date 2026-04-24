const tabs = document.querySelectorAll(".tab");
const cards = document.querySelectorAll(".price-card");
const serviceCards = document.querySelectorAll(".service-card[data-target-filter]");
const searchInput = document.querySelector("#priceSearch");
const actionMenus = document.querySelectorAll(".header-menu, .action-menu");
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
const calcBuilderNote = document.querySelector("#calcBuilderNote");
const calcReviewPromo = document.querySelector("#calcReviewPromo");
const calcCartBadge = document.querySelector("#calcCartBadge");
const calcCartTotal = document.querySelector("#calcCartTotal");
const calcCartSummary = document.querySelector("#calcCartSummary");
const calcCartList = document.querySelector("#calcCartList");
const calcCartEmpty = document.querySelector("#calcCartEmpty");
const calcCartSubtotal = document.querySelector("#calcCartSubtotal");
const calcCartDiscounts = document.querySelector("#calcCartDiscounts");
const calcCartMeta = document.querySelector("#calcCartMeta");
const calcCartNote = document.querySelector("#calcCartNote");
const calcCartTransfer = document.querySelector("#calcCartTransfer");

let activeFilter = "all";

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
  };
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
        option.pricingMode === "fixed"
          ? option.parameters?.sides
            ? ` · ${option.parameters.sides}`
            : ""
          : "";
      return `<option value="${option.id}"${
        currentOptionId === option.id ? " selected" : ""
      }>${format} · ${paperType}${sideSuffix}</option>`;
    })
    .join("");

  const showSides = selectedOption?.pricingMode === "variant_fixed" && selectedOption?.priceVariants?.length;
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
  const urgentChecked = Boolean(calcFields?.querySelector("#calcDigitalUrgent")?.checked);
  const digitalServices = getDigitalServices();
  const filmOptions = digitalServices.filmDigitization?.options || [];
  const addonOptions = digitalServices.addons?.options || [];
  const showFilmMode = currentMode === "film_digitization";
  const showAddonMode = currentMode === "addons";
  const allowUrgent = currentMode !== "addons" || currentAddon !== "disk_cd_dvd";

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
      <span>${currentMode === "video" ? "Минуты" : "Количество"}</span>
      <input id="calcDigitalQuantity" type="number" min="1" step="1" value="${currentQuantity}" inputmode="numeric" />
    </label>
    ${
      allowUrgent
        ? `
      <label class="calculator-toggle">
        <input id="calcDigitalUrgent" type="checkbox"${urgentChecked ? " checked" : ""} />
        <span>Срочная оцифровка x2</span>
      </label>
    `
        : `
      <p class="calculator-builder-note">Для товара «Диск CD / DVD» срочная оцифровка не применяется.</p>
    `
    }
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
  const urgentAdjustment = digitalServices.addons?.adjustments?.find(
    (item) => item.id === "urgent_digitization"
  );
  const urgentChecked = Boolean(calcFields?.querySelector("#calcDigitalUrgent")?.checked);
  const urgentMultiplier = urgentChecked ? urgentAdjustment?.multiplier || 2 : 1;

  if (digitalMode === "video") {
    const priceData = calculateTieredUnitPrice(digitalServices.video, quantity);
    if (!priceData) {
      return { error: "Для такого количества минут нужен точный выбор тарифа." };
    }

    const baseUnitPrice = priceData.unitPrice;
    const unitPrice = Math.round(baseUnitPrice * urgentMultiplier);
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
      description: `${priceData.tierLabel}${urgentChecked ? " · срочная x2" : ""}${minApplied ? " · мин. стоимость кассеты 900 ₽" : ""}`,
      displayQuantity: `${quantity} мин.`,
      displayUnit: `${formatRubles(unitPrice)} за минуту`,
      displayLineTotal: formatRubles(subtotal),
      hasUrgent: urgentChecked,
    };
  }

  if (digitalMode === "film_digitization") {
    const filmMode = calcFields?.querySelector("#calcDigitalFilmMode")?.value;
    const option = digitalServices.filmDigitization?.options?.find((item) => item.id === filmMode) || null;
    const priceData = calculateTieredUnitPrice(option, quantity);

    if (!option || !priceData) {
      return { error: "Для такого количества катушек нужен точный выбор тарифа." };
    }

    const unitPrice = Math.round(priceData.unitPrice * urgentMultiplier);
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
      description: `${priceData.tierLabel}${urgentChecked ? " · срочная x2" : ""}`,
      hasUrgent: urgentChecked,
    };
  }

  if (digitalMode === "addons") {
    const addonId = calcFields?.querySelector("#calcDigitalAddon")?.value;
    const option = digitalServices.addons?.options?.find((item) => item.id === addonId) || null;

    if (!option) {
      return { error: "Для допуслуги оцифровки не выбран вариант." };
    }

    const allowUrgent = addonId !== "disk_cd_dvd";
    const multiplier = urgentChecked && allowUrgent ? urgentMultiplier : 1;
    const unitPrice = Math.round((option.price || 0) * multiplier);

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "digital",
      itemKind: "digital_addon",
      format: `digital-addon-${addonId}`,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      tierLabel: "Фиксированная цена",
      title: option.title,
      description: `${option.parameters?.mode || ""}${urgentChecked && allowUrgent ? " · срочная x2" : ""}`.replace(
        /^,\s*/,
        ""
      ),
      hasUrgent: urgentChecked && allowUrgent,
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

  const unitPrice = Math.round(priceData.unitPrice * urgentMultiplier);

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
    description: `${priceData.tierLabel}${urgentChecked ? " · срочная x2" : ""}`,
    hasUrgent: urgentChecked,
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

    const unitPrice = service.price || 0;

    return {
      id: assignId ? `calc-item-${++calculatorItemId}` : null,
      category: "binding",
      itemKind: "binding_sheet",
      format: service.id,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
      tierLabel: "Фиксированная цена",
      title: service.title,
      description: "1 лист",
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
  let sideLabel = option.parameters?.sides || "";

  if (option.pricingMode === "fixed") {
    unitPrice = option.price || 0;
  } else if (option.pricingMode === "variant_fixed") {
    const sideId =
      calcFields?.querySelector("#calcPaperSide")?.value || option.priceVariants?.[0]?.id || "";
    const sideVariant = option.priceVariants?.find((item) => item.id === sideId) || null;

    if (!sideVariant) {
      return { error: "Для плотной бумаги не выбраны стороны." };
    }

    unitPrice = sideVariant.price || 0;
    sideLabel = sideVariant.title || "";
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
    tierLabel: "Фиксированная цена",
    title: `Плотная бумага ${format}`,
    description: descriptionParts.join(" · "),
    hasFill: fillMode !== "none",
    fillMode,
    requiresConfirmation: fillMode === "unknown",
    displayUnit: hasExactPrice(adjustedUnitPrice) ? `${formatRubles(adjustedUnitPrice)} за шт.` : "цену уточнить",
    displayLineTotal: hasExactPrice(subtotal) ? formatRubles(subtotal) : "Уточнить",
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

  const unitPrice = option.price || 0;
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
    tierLabel: "Фиксированная цена",
    title: `${typeLabel} ${format}`,
    description: format,
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
  };
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

  calcBuilderNote.textContent = `${draft.title} · ${draft.displayQuantity || `${draft.quantity} шт.`} · ${draft.displayUnit || `${formatRubles(draft.unitPrice)} за шт.`} · ${formatRubles(draft.subtotal)}`;
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

function calculatePhotoBundleDiscounts(items) {
  const photoUnits = expandUnitsByPredicate(items, (item) => item.category === "photo");
  const frameUnits = expandUnitsByPredicate(items, (item) => item.category === "frames");
  const laminationUnits = expandUnitsByPredicate(items, (item) => item.category === "lamination");
  const processedUnits = expandUnitsByPredicate(items, (item) => item.itemKind === "scan_processed");

  if (!photoUnits.length) {
    return [];
  }

  const partners = [
    ...frameUnits.map((unit) => ({ ...unit, discountType: "frame" })),
    ...laminationUnits.map((unit) => ({ ...unit, discountType: "lamination" })),
    ...processedUnits.map((unit) => ({ ...unit, discountType: "digitization" })),
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

      if (partner.discountType === "frame" && photo.format === partner.format) {
        amount = Math.round((photo.unitPrice + partner.unitPrice) * 0.15);
        label = `Фото + рамка ${photo.format}`;
      } else if (partner.discountType === "lamination" && photo.format === partner.format) {
        amount = Math.round((photo.unitPrice + partner.unitPrice) * 0.1);
        label = `Фото + ламинация ${photo.format}`;
      } else if (partner.discountType === "digitization") {
        amount = Math.round((photo.unitPrice + partner.unitPrice) * 0.1);
        label = "После оцифровки + печать фото";
      }

      if (!amount || amount <= 0) {
        return;
      }

      flow.addEdge(photoOffset + photoIndex, partnerOffset + partnerIndex, 1, -amount, {
        amount,
        label,
        type: partner.discountType,
        format: photo.format,
      });
    });
  });

  flow.maximizeNegativeCost(source, sink);

  const aggregated = new Map();

  photoUnits.forEach((photo, photoIndex) => {
    const edges = flow.graph[photoOffset + photoIndex];
    edges.forEach((edge) => {
      if (!edge.meta || edge.flow <= 0) {
        return;
      }

      const discountId =
        edge.meta.type === "digitization"
          ? "digitization-photo"
          : `${edge.meta.type}-${edge.meta.format}`;
      const existing = aggregated.get(discountId) || {
        id: discountId,
        label: edge.meta.label,
        amount: 0,
        count: 0,
      };

      existing.amount += edge.meta.amount;
      existing.count += 1;
      aggregated.set(discountId, existing);
    });
  });

  return Array.from(aggregated.values()).map((discount) => ({
    id: discount.id,
    label: `${discount.label} (${discount.count} компл.)`,
    amount: discount.amount,
  }));
}

function pairGiftUnits(units) {
  const sorted = [...units].sort((a, b) => b.unitPrice - a.unitPrice);
  const usableCount = sorted.length - (sorted.length % 2);
  const selected = sorted.slice(0, usableCount);

  const mugs = selected.filter((unit) => unit.giftKind === "mug");
  const tshirts = selected.filter((unit) => unit.giftKind === "tshirt");
  const others = selected.filter((unit) => unit.giftKind !== "mug" && unit.giftKind !== "tshirt");
  const discounts = [];
  const leftovers = [];

  function consumePairs(pool, label) {
    const localPool = [...pool];
    while (localPool.length >= 2) {
      const first = localPool.shift();
      const second = localPool.shift();
      discounts.push({
        id: `${label}-${discounts.length}`,
        label,
        amount: Math.round((first.unitPrice + second.unitPrice) * 0.1),
      });
    }
    leftovers.push(...localPool);
  }

  consumePairs(mugs, "Парные кружки / футболки");
  consumePairs(tshirts, "Парные кружки / футболки");
  leftovers.push(...others);
  leftovers.sort((a, b) => b.unitPrice - a.unitPrice);

  while (leftovers.length >= 2) {
    const first = leftovers.shift();
    const second = leftovers.shift();
    discounts.push({
      id: `gift-bundle-${discounts.length}`,
      label: "Комплект из 2 товаров",
      amount: Math.round((first.unitPrice + second.unitPrice) * 0.1),
    });
  }

  const aggregated = new Map();
  discounts.forEach((discount) => {
    const existing = aggregated.get(discount.label) || {
      id: discount.label === "Парные кружки / футболки" ? "gift-pair" : "gift-bundle",
      label: discount.label,
      amount: 0,
      count: 0,
    };
    existing.amount += discount.amount;
    existing.count += 1;
    aggregated.set(discount.label, existing);
  });

  return {
    totalAmount: discounts.reduce((sum, discount) => sum + discount.amount, 0),
    discounts: Array.from(aggregated.values()).map((discount) => ({
      id: discount.id,
      label: `${discount.label} (${discount.count} компл.)`,
      amount: discount.amount,
    })),
  };
}

function calculateGiftDiscounts(items) {
  const giftUnits = expandUnitsByPredicate(items, (item) => item.category === "gifts");

  if (!giftUnits.length) {
    return [];
  }

  const quantity = giftUnits.length;
  const subtotal = giftUnits.reduce((sum, unit) => sum + unit.unitPrice, 0);
  const bulkPercent = quantity >= 5 ? 15 : quantity >= 3 ? 10 : 0;
  const bulkDiscounts = bulkPercent
    ? [
        {
          id: "gifts-bulk",
          label: `Сувенирная печать (${quantity} шт.)`,
          amount: Math.round(subtotal * (bulkPercent / 100)),
        },
      ]
    : [];
  const pairedResult = pairGiftUnits(giftUnits);
  const bulkAmount = bulkDiscounts.reduce((sum, discount) => sum + discount.amount, 0);

  return pairedResult.totalAmount > bulkAmount ? pairedResult.discounts : bulkDiscounts;
}

function calculateCartTotals() {
  const subtotal = calculatorCart.reduce(
    (sum, item) => sum + (hasExactPrice(item.subtotal) ? item.subtotal : 0),
    0
  );
  const unresolvedItems = calculatorCart.filter((item) => item.requiresConfirmation);
  const bundleDiscounts = [
    ...calculatePhotoBundleDiscounts(calculatorCart),
    ...calculateGiftDiscounts(calculatorCart),
  ];

  const bundleDiscountAmount = bundleDiscounts.reduce((sum, discount) => sum + discount.amount, 0);
  const reviewDiscountAmount = calcReviewPromo?.checked ? Math.round(subtotal * 0.15) : 0;
  const uncappedDiscountAmount = bundleDiscountAmount + reviewDiscountAmount;
  const maxAllowedDiscount = calcReviewPromo?.checked ? Math.round(subtotal * 0.2) : uncappedDiscountAmount;
  const discountAmount = calcReviewPromo?.checked
    ? Math.min(uncappedDiscountAmount, maxAllowedDiscount)
    : uncappedDiscountAmount;
  const capReduction = calcReviewPromo?.checked
    ? Math.max(0, uncappedDiscountAmount - discountAmount)
    : 0;
  const total = subtotal - discountAmount;

  return {
    subtotal,
    unresolvedItems,
    bundleDiscounts,
    bundleDiscountAmount,
    reviewDiscountAmount,
    uncappedDiscountAmount,
    maxAllowedDiscount,
    discountAmount,
    capReduction,
    total,
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
    !calcCartMeta ||
    !calcCartNote ||
    !calcCartTransfer
  ) {
    return;
  }

  if (!calculatorCart.length) {
    calcCartBadge.textContent = "Пустой расчёт";
    calcCartTotal.textContent = "0 ₽";
    calcCartSummary.textContent = "Добавьте фото, ламинацию или рамки, чтобы собрать заказ по шагам.";
    calcCartList.innerHTML = "";
    calcCartEmpty.hidden = false;
    calcCartSubtotal.textContent = "Сумма по позициям: 0 ₽";
    calcCartDiscounts.textContent = "Скидки пока не применялись";
    calcCartMeta.textContent = "Комплекты считаются по совпадающим форматам.";
    calcCartNote.textContent = "Здесь собирается общий расчёт заказа из нескольких позиций.";
    calcCartTransfer.disabled = true;
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
    : `В корзине ${calculatorCart.length} поз. · ${formatRubles(totals.subtotal)} до скидок`;
  calcCartEmpty.hidden = true;
  calcCartList.innerHTML = calculatorCart
    .map(
      (item) => `
        <article class="calculator-cart-item">
          <div class="calculator-cart-copy">
            <strong>${item.title}</strong>
            <span>${item.description}</span>
            <span>${item.displayQuantity || `${item.quantity} шт.`} · ${item.displayUnit || `${formatRubles(item.unitPrice)} за шт.`}</span>
          </div>
          <div class="calculator-cart-side">
            <strong>${item.displayLineTotal || formatRubles(item.subtotal)}</strong>
            <button class="calculator-remove" type="button" data-remove-id="${item.id}">Убрать</button>
          </div>
        </article>
      `
    )
    .join("");

  const discountParts = [];
  totals.bundleDiscounts.forEach((discount) => {
    discountParts.push(`${discount.label}: -${formatRubles(discount.amount)}`);
  });
  if (totals.reviewDiscountAmount > 0) {
    discountParts.push(`Отзыв на Яндекс Картах: -${formatRubles(totals.reviewDiscountAmount)}`);
  }
  if (totals.capReduction > 0) {
    discountParts.push(`Ограничение скидки 20%: +${formatRubles(totals.capReduction)}`);
  }

  calcCartSubtotal.textContent = totals.unresolvedItems.length
    ? `Рассчитанная часть: ${formatRubles(totals.subtotal)}`
    : `Сумма по позициям: ${formatRubles(totals.subtotal)}`;
  calcCartDiscounts.textContent = discountParts.length
    ? discountParts.join(" · ")
    : "Скидки пока не применялись";
  calcCartMeta.textContent = totals.unresolvedItems.length
    ? "Позиции с пометкой «цену уточнить» не входят в точный итог и требуют уточнения у вас."
    : "Скидки считаются по связкам внутри корзины: фото, оцифровка, рамки, ламинация и сувенирные комплекты.";
  calcCartNote.textContent = totals.unresolvedItems.length
    ? "Если часть листов с заливкой, а часть без неё, добавляйте их отдельными строками."
    : totals.discountAmount > 0
      ? `Итоговая скидка: ${formatRubles(totals.discountAmount)}`
      : "Можно добавить ещё позиции из других категорий.";
  calcCartTransfer.disabled = false;
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
}

function addDraftToCart() {
  const draft = buildDraftCartItem(true);

  if (draft.error) {
    if (calcBuilderNote) {
      calcBuilderNote.textContent = draft.error;
    }
    return;
  }

  calculatorCart.push(draft);
  renderCartSummary();
  updateCalculatorBuilderNote();
}

function removeCartItem(itemId) {
  calculatorCart = calculatorCart.filter((item) => item.id !== itemId);
  renderCartSummary();
  updateCalculatorBuilderNote();
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

  totals.bundleDiscounts.forEach((discount) => {
    lines.push(`${discount.label}: -${formatRubles(discount.amount)}`);
  });

  if (totals.reviewDiscountAmount > 0) {
    lines.push(`Отзыв на Яндекс Картах: -${formatRubles(totals.reviewDiscountAmount)}`);
  }

  if (totals.capReduction > 0) {
    lines.push(`Ограничение общей скидки 20%: +${formatRubles(totals.capReduction)}`);
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
  renderCartSummary();

  calcCategory.addEventListener("change", () => {
    renderCalculatorFields();
    updateCalculatorBuilderNote();
  });

  calcFields.addEventListener("input", handleCalculatorFieldChange);
  calcFields.addEventListener("change", handleCalculatorFieldChange);
  calcAddItem?.addEventListener("click", addDraftToCart);
  calcReviewPromo?.addEventListener("change", renderCartSummary);
  calcCartList?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-id]");
    if (!removeButton) {
      return;
    }

    removeCartItem(removeButton.dataset.removeId);
  });
  calcCartTransfer?.addEventListener("click", transferCartToOrder);
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
