const FALLBACK_IMAGE = "placeholder-producto.svg";

function getGalleryImages(product) {
    const seen = new Set();
    const images = [];

    [product.image, product.hoverImage].forEach((src) => {
        if (typeof src !== "string") {
            return;
        }

        const cleanSrc = src.trim();
        if (!cleanSrc || seen.has(cleanSrc)) {
            return;
        }

        seen.add(cleanSrc);
        images.push(cleanSrc);
    });

    if (images.length === 0) {
        images.push(FALLBACK_IMAGE);
    }

    return images;
}

function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function extractContentAmount(product) {
    const rawName = safeText(product.name, "");
    const match = rawName.match(/(\d+(?:[.,]\d+)?)\s?(ml|g|gr|kg|l)\b/i);
    if (!match) {
        const lineDefaults = {
            aerosoles: "185g"
        };
        const lineKey = safeText(product.line, "").toLowerCase();
        return lineDefaults[lineKey] || "No especificado";
    }

    return `${match[1]}${match[2].toLowerCase()}`;
}

function inferOlfactiveFamily(product) {
    const text = `${safeText(product.name, "")} ${safeText(product.description, "")}`.toLowerCase();
    const rules = [
        { label: "Floral", patterns: ["floral", "flores", "rosa", "jazmin", "lirio", "peonia", "lavanda"] },
        { label: "Citrica", patterns: ["citr", "limon", "naranja", "bergamota", "mandarina"] },
        { label: "Frutal", patterns: ["frut", "mango", "uva", "papaya", "melon", "pera", "manzana"] },
        { label: "Dulce", patterns: ["vainilla", "caramelo", "chocolate", "bubblegum"] },
        { label: "Amaderada", patterns: ["madera", "cedro", "sandal", "roble"] },
        { label: "Oriental", patterns: ["oriental", "ambar", "almizcle", "musk"] }
    ];

    const detected = rules
        .filter((rule) => rule.patterns.some((pattern) => text.includes(pattern)))
        .map((rule) => rule.label);

    if (detected.length === 0) {
        return "No especificada";
    }

    return Array.from(new Set(detected)).slice(0, 2).join(" / ");
}

function inferUsageSuggestions(product) {
    const line = safeText(product.line, "").toLowerCase();
    const map = {
        aerosoles: "Ambientes, hogar, telas",
        textiles: "Telas, ambientes, hogar",
        difusores: "Ambientes interiores, hogar",
        "home spray": "Ambientes, hogar",
        "mini concentrado": "Difusores, telas, ambientes",
        touch: "Auto y ambientes pequeños",
        caritas: "Auto y ambientes pequeños",
        "tarjetas aromaticas": "Auto, placares, bolsos",
        antihumedad: "Placares, banos, lavadero",
        "route 66": "Auto"
    };

    return map[line] || "Ambientes, hogar";
}

function getSpecRows(product) {
    return [
        { label: "Contenido neto", value: extractContentAmount(product) },
        { label: "Familia olfativa", value: inferOlfactiveFamily(product) },
        { label: "Sugerencias de uso", value: inferUsageSuggestions(product) },
        { label: "Stock", value: safeText(product.stock, "No especificado") }
    ];
}

function renderSpecs(container, product) {
    const rows = getSpecRows(product);
    container.innerHTML = rows
        .map((row) => {
            return `
                <div class="product-modal-spec-row">
                    <dt class="product-modal-spec-label">${row.label}</dt>
                    <dd class="product-modal-spec-value">${row.value}</dd>
                </div>
            `;
        })
        .join("");
}

export function createProductModal({ onBuy }) {
    const wrapper = document.createElement("div");
    wrapper.className = "product-modal";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML = `
        <div class="product-modal-backdrop" data-modal-close></div>
        <div class="product-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
            <button type="button" class="product-modal-close" aria-label="Cerrar detalle">x</button>
            <div class="product-modal-gallery">
                <img class="product-modal-main-image" src="${FALLBACK_IMAGE}" alt="Imagen de producto">
                <div class="product-modal-thumbs"></div>
            </div>
            <div class="product-modal-content">
                <p class="product-modal-category"></p>
                <h2 id="product-modal-title" class="product-modal-title"></h2>
                <p class="product-modal-price"></p>
                <p class="product-modal-description"></p>
                <section class="product-modal-specs">
                    <h3 class="product-modal-specs-title">Caracteristicas</h3>
                    <dl class="product-modal-spec-list"></dl>
                </section>
                <button type="button" class="btn-buy product-modal-buy">Consultar</button>
            </div>
        </div>
    `;

    document.body.appendChild(wrapper);

    const closeButton = wrapper.querySelector(".product-modal-close");
    const backdrop = wrapper.querySelector(".product-modal-backdrop");
    const mainImage = wrapper.querySelector(".product-modal-main-image");
    const thumbs = wrapper.querySelector(".product-modal-thumbs");
    const category = wrapper.querySelector(".product-modal-category");
    const title = wrapper.querySelector(".product-modal-title");
    const price = wrapper.querySelector(".product-modal-price");
    const description = wrapper.querySelector(".product-modal-description");
    const specList = wrapper.querySelector(".product-modal-spec-list");
    const buyButton = wrapper.querySelector(".product-modal-buy");

    let activeProduct = null;

    function setMainImage(src, alt) {
        mainImage.src = src || FALLBACK_IMAGE;
        mainImage.alt = alt || "Imagen de producto";
    }

    mainImage.addEventListener("error", () => {
        mainImage.src = FALLBACK_IMAGE;
    });

    function close() {
        wrapper.classList.remove("is-open");
        wrapper.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
    }

    function open(product) {
        if (!product) {
            return;
        }

        activeProduct = product;
        const galleryImages = getGalleryImages(product);
        const productName = safeText(product.name, "Producto");
        const productCategory = `${safeText(product.brand, "Marca")} - ${safeText(product.line, "Linea")}`;

        category.textContent = productCategory;
        title.textContent = productName;
        price.textContent = safeText(product.price, "");
        description.textContent = safeText(product.description, "Sin descripcion disponible.");
        renderSpecs(specList, product);

        setMainImage(galleryImages[0], productName);
        thumbs.innerHTML = "";

        if (galleryImages.length > 1) {
            galleryImages.forEach((src, index) => {
                const thumbButton = document.createElement("button");
                thumbButton.type = "button";
                thumbButton.className = `product-modal-thumb ${index === 0 ? "is-active" : ""}`;
                thumbButton.setAttribute("aria-label", `Ver imagen ${index + 1} de ${galleryImages.length}`);
                thumbButton.innerHTML = `<img src="${src}" alt="${productName} miniatura ${index + 1}">`;

                const thumbImg = thumbButton.querySelector("img");
                thumbImg.addEventListener("error", () => {
                    thumbImg.src = FALLBACK_IMAGE;
                });

                thumbButton.addEventListener("click", () => {
                    setMainImage(src, productName);
                    thumbs.querySelectorAll(".product-modal-thumb").forEach((node) => {
                        node.classList.remove("is-active");
                    });
                    thumbButton.classList.add("is-active");
                });

                thumbs.appendChild(thumbButton);
            });

            thumbs.classList.add("is-visible");
        } else {
            thumbs.classList.remove("is-visible");
        }

        wrapper.classList.add("is-open");
        wrapper.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
    }

    closeButton.addEventListener("click", close);
    backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && wrapper.classList.contains("is-open")) {
            close();
        }
    });

    buyButton.addEventListener("click", () => {
        if (!activeProduct) {
            return;
        }

        onBuy(activeProduct.name);
    });

    return { open, close };
}
