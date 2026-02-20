const WHATSAPP_NUMBER = "5491111111111";

const PRODUCTS = [
  {
    id: 1,
    name: "Difusor Saphirus Aroma Lino",
    category: "Difusor",
    price: 10490
  },
  {
    id: 2,
    name: "Aerosol Saphirus Aroma Vainilla",
    category: "Aerosol",
    price: 7390
  },
  {
    id: 3,
    name: "Textil Saphirus Aroma Bebe",
    category: "Textil",
    price: 8290
  },
  {
    id: 4,
    name: "Home Spray Saphirus Brisa Serena",
    category: "Home Spray",
    price: 7990
  },
  {
    id: 5,
    name: "Difusor Premium Saphirus Nacar",
    category: "Difusor Premium",
    price: 14290
  },
  {
    id: 6,
    name: "Aceite Esencial Saphirus Lavanda",
    category: "Aceites",
    price: 6890
  },
  {
    id: 7,
    name: "Sahumerios Saphirus Himalaya",
    category: "Sahumerios",
    price: 4990
  },
  {
    id: 8,
    name: "Mini Textil Saphirus Mix",
    category: "Textil",
    price: 5890
  },
  {
    id: 9,
    name: "Touch Aromas para Auto",
    category: "Auto",
    price: 6490
  },
  {
    id: 10,
    name: "Tarjeta Aromatica Saphirus",
    category: "Auto",
    price: 3690
  },
  {
    id: 11,
    name: "Holder Ceramico con Sensaciones",
    category: "Difusor",
    price: 9690
  },
  {
    id: 12,
    name: "Promo Textil + Mini",
    category: "Promos",
    price: 12990
  }
];

const state = {
  category: "all",
  query: ""
};

const refs = {
  productsGrid: document.querySelector("#productsGrid"),
  categoryFilter: document.querySelector("#categoryFilter"),
  categoryChips: document.querySelector("#categoryChips"),
  searchInput: document.querySelector("#searchInput"),
  emptyState: document.querySelector("#emptyState"),
  navToggle: document.querySelector(".nav-toggle"),
  siteHeader: document.querySelector(".site-header"),
  navLinks: document.querySelectorAll(".main-nav a"),
  year: document.querySelector("#year")
};

function formatARS(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

function getCategories() {
  return [...new Set(PRODUCTS.map((product) => product.category))].sort((a, b) => a.localeCompare(b));
}

function getFilteredProducts() {
  const query = state.query.trim().toLowerCase();

  return PRODUCTS.filter((product) => {
    const matchesCategory = state.category === "all" || product.category === state.category;
    const matchesQuery =
      query.length === 0 ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });
}

function createWhatsAppLink(product) {
  const message = `Hola AleaHome, quiero consultar por ${product.name} (${formatARS(product.price)}).`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderProducts() {
  const filtered = getFilteredProducts();

  refs.productsGrid.innerHTML = filtered
    .map(
      (product) => `
      <article class="product-card">
        <div class="card-media placeholder-media" role="img" aria-label="Imagen de producto proximamente">
          <span class="placeholder-tag">Imagen pendiente</span>
          <span class="placeholder-name">${product.category}</span>
        </div>
        <div class="card-body">
          <span class="category-badge">${product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-price">${formatARS(product.price)}</p>
          <a class="whatsapp-btn" href="${createWhatsAppLink(product)}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a>
        </div>
      </article>
    `
    )
    .join("");

  refs.emptyState.hidden = filtered.length > 0;
}

function syncActiveChip() {
  const chips = refs.categoryChips.querySelectorAll(".chip");

  chips.forEach((chip) => {
    const isActive = chip.dataset.value === state.category;
    chip.classList.toggle("active", isActive);
    chip.setAttribute("aria-pressed", String(isActive));
  });
}

function renderCategoryControls() {
  const categories = getCategories();

  refs.categoryFilter.innerHTML = [
    `<option value="all">Todas</option>`,
    ...categories.map((category) => `<option value="${category}">${category}</option>`)
  ].join("");

  refs.categoryChips.innerHTML = [
    `<button type="button" class="chip active" data-value="all" aria-pressed="true">Todas</button>`,
    ...categories.map(
      (category) => `<button type="button" class="chip" data-value="${category}" aria-pressed="false">${category}</button>`
    )
  ].join("");

  refs.categoryChips.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;

    state.category = chip.dataset.value;
    refs.categoryFilter.value = state.category;
    syncActiveChip();
    renderProducts();
  });
}

function setupFilters() {
  refs.categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    syncActiveChip();
    renderProducts();
  });

  refs.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderProducts();
  });
}

function setupMobileMenu() {
  if (!refs.navToggle || !refs.siteHeader) return;

  refs.navToggle.addEventListener("click", () => {
    const isOpen = refs.siteHeader.classList.toggle("nav-open");
    refs.navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  refs.navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      refs.siteHeader.classList.remove("nav-open");
      refs.navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function init() {
  renderCategoryControls();
  setupFilters();
  setupMobileMenu();
  renderProducts();

  if (refs.year) {
    refs.year.textContent = String(new Date().getFullYear());
  }
}

init();
