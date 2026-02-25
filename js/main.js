import { catalogStructure } from "./config/catalog-structure.js";
import { buildFilterMeta, getFilterKey } from "./utils/filters.js";
import { createCard, buyProduct } from "./ui/cards.js";
import { renderCatalogMenu } from "./ui/menu.js";
import { PRODUCTS } from "../data/products.js";

const productContainer = document.getElementById("product-container");
const activeFilterLabel = document.getElementById("active-filter-label");
const catalogToggle = document.getElementById("catalog-toggle");
const catalogMenu = document.getElementById("catalog-menu");
const navDropdown = document.querySelector(".nav-dropdown");
const catalogSection = document.getElementById("catalogo");
const FILTER_STORAGE_KEY = "aleahome.activeFilter";
const FILTER_QUERY_PARAM = "f";

function sanitizeProducts(rawProducts) {
    if (!Array.isArray(rawProducts)) {
        return [];
    }

    return rawProducts.filter((product) => {
        return (
            product &&
            typeof product.name === "string" &&
            typeof product.brand === "string" &&
            typeof product.line === "string" &&
            typeof product.image === "string"
        );
    });
}

function mergeCatalogWithData(preferredCatalog, rawProducts) {
    const productsByBrand = new Map();

    rawProducts.forEach((product) => {
        if (!productsByBrand.has(product.brand)) {
            productsByBrand.set(product.brand, new Set());
        }
        productsByBrand.get(product.brand).add(product.line);
    });

    const merged = [];
    const usedBrands = new Set();

    preferredCatalog.forEach((group) => {
        const linesInData = productsByBrand.get(group.brand);
        if (!linesInData) {
            return;
        }

        const lines = group.lines.filter((line) => linesInData.has(line));
        if (lines.length === 0) {
            return;
        }

        merged.push({ brand: group.brand, lines });
        usedBrands.add(group.brand);
    });

    productsByBrand.forEach((linesSet, brand) => {
        if (usedBrands.has(brand)) {
            return;
        }

        merged.push({
            brand,
            lines: Array.from(linesSet).sort((a, b) => a.localeCompare(b, "es"))
        });
    });

    return merged;
}

const products = sanitizeProducts(PRODUCTS);
const effectiveCatalogStructure = mergeCatalogWithData(catalogStructure, products);
const filterMeta = buildFilterMeta(effectiveCatalogStructure);
let activeFilter = "all";

function getFilterFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get(FILTER_QUERY_PARAM);
}

function updateUrlFilter(filterKey) {
    const url = new URL(window.location.href);
    if (filterKey === "all") {
        url.searchParams.delete(FILTER_QUERY_PARAM);
    } else {
        url.searchParams.set(FILTER_QUERY_PARAM, filterKey);
    }
    window.history.replaceState({}, "", url);
}

function getPersistedFilter() {
    const fromUrl = getFilterFromUrl();
    if (fromUrl && filterMeta.has(fromUrl)) {
        return fromUrl;
    }

    try {
        const fromStorage = window.localStorage.getItem(FILTER_STORAGE_KEY);
        if (fromStorage && filterMeta.has(fromStorage)) {
            return fromStorage;
        }
    } catch (_error) {
        // localStorage can fail in private/restricted browser contexts.
    }

    return "all";
}

function persistFilter(filterKey) {
    updateUrlFilter(filterKey);

    try {
        if (filterKey === "all") {
            window.localStorage.removeItem(FILTER_STORAGE_KEY);
        } else {
            window.localStorage.setItem(FILTER_STORAGE_KEY, filterKey);
        }
    } catch (_error) {
        // Ignore persistence errors and keep UI functional.
    }
}

function updateActiveLabel() {
    const meta = filterMeta.get(activeFilter);
    activeFilterLabel.textContent = `Mostrando: ${meta ? meta.label : "Todos"}`;
}

function renderProducts() {
    productContainer.innerHTML = "";

    const filteredProducts =
        activeFilter === "all"
            ? products
            : products.filter((product) => getFilterKey(product.brand, product.line) === activeFilter);

    if (filteredProducts.length === 0) {
        productContainer.innerHTML = '<p class="empty-state">No hay productos para ese filtro todavia.</p>';
        return;
    }

    filteredProducts.forEach((product) => {
        productContainer.appendChild(createCard(product, buyProduct));
    });
}

function drawCatalogMenu() {
    renderCatalogMenu({
        catalogMenu,
        catalogStructure: effectiveCatalogStructure,
        activeFilter,
        getFilterKey
    });
}

function setFilter(filterKey) {
    activeFilter = filterMeta.has(filterKey) ? filterKey : "all";
    persistFilter(activeFilter);
    updateActiveLabel();
    drawCatalogMenu();
    renderProducts();

    if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function setupEvents() {
    catalogToggle.addEventListener("click", () => {
        const isOpen = navDropdown.classList.toggle("open");
        catalogToggle.setAttribute("aria-expanded", String(isOpen));
    });

    catalogMenu.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.classList.contains("catalog-option")) {
            return;
        }

        setFilter(target.dataset.filter || "all");
        navDropdown.classList.remove("open");
        catalogToggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Node)) {
            return;
        }

        if (!navDropdown.contains(event.target)) {
            navDropdown.classList.remove("open");
            catalogToggle.setAttribute("aria-expanded", "false");
        }
    });
}

function init() {
    if (!productContainer || !activeFilterLabel || !catalogToggle || !catalogMenu || !navDropdown) {
        return;
    }

    activeFilter = getPersistedFilter();
    drawCatalogMenu();
    updateActiveLabel();
    renderProducts();
    setupEvents();
}

init();
