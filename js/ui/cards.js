const FALLBACK_IMAGE = "productos/aerosoles/1-aerosol-clean-cotton.jpg";
const WHATSAPP_BASE_URL = "https://wa.link/e00gp9";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export function buyProduct(productName) {
    const message = `Hola AleaHome. Me interesa el producto: ${productName}`;
    const whatsappUrl = `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

function createImageCandidates(path) {
    if (typeof path !== "string" || path.trim() === "") {
        return [FALLBACK_IMAGE];
    }

    const cleanPath = path.trim();
    const seen = new Set();
    const candidates = [];

    const add = (candidate) => {
        if (!candidate || seen.has(candidate)) {
            return;
        }

        seen.add(candidate);
        candidates.push(candidate);
    };

    add(cleanPath);

    const extensionMatch = cleanPath.match(/\.[^.]+$/);
    const currentExtension = extensionMatch ? extensionMatch[0].toLowerCase() : "";
    const baseWithoutExtension = extensionMatch ? cleanPath.slice(0, -currentExtension.length) : cleanPath;

    IMAGE_EXTENSIONS.forEach((ext) => {
        if (ext !== currentExtension) {
            add(`${baseWithoutExtension}${ext}`);
        }
    });

    // Some assets exist both as "123-name.ext" and "name.ext".
    const filename = baseWithoutExtension.split("/").pop() || "";
    const normalizedFilename = filename.replace(/^\d+-/, "");
    if (normalizedFilename !== filename) {
        const baseDir = baseWithoutExtension.slice(0, -filename.length);
        IMAGE_EXTENSIONS.forEach((ext) => add(`${baseDir}${normalizedFilename}${ext}`));
    }

    add(FALLBACK_IMAGE);
    return candidates;
}

function attachImageFallback(imgEl, originalPath, onFinalFallback) {
    const candidates = createImageCandidates(originalPath);
    let index = 0;

    imgEl.addEventListener("error", () => {
        index += 1;

        if (index < candidates.length) {
            imgEl.src = candidates[index];
            return;
        }

        if (typeof onFinalFallback === "function") {
            onFinalFallback();
        }
    });
}

export function createCard(product, onBuy = buyProduct) {
    const card = document.createElement("article");
    card.className = "product-card";

    const hasHoverImage = typeof product.hoverImage === "string" && product.hoverImage.trim() !== "";
    const mainImageSrc = product.image;
    const showHoverSwap = hasHoverImage && product.hoverImage !== product.image;
    const hoverImageSrc = showHoverSwap ? product.hoverImage : "";
    const hoverImageHtml = showHoverSwap
        ? `<img class="product-image product-image-hover" src="${hoverImageSrc}" alt="${product.name} - vista alternativa" loading="lazy">`
        : "";
    const imageWrapperClass = showHoverSwap ? "has-hover-image" : "";

    card.innerHTML = `
        <div class="card-image-wrapper ${imageWrapperClass}">
            <img class="product-image product-image-main" src="${mainImageSrc}" alt="${product.name}" loading="lazy">
            ${hoverImageHtml}
        </div>
        <div class="card-info">
            <div>
                <span class="product-category">${product.brand} - ${product.line}</span>
                <h3 class="product-name">${product.name}</h3>
            </div>
            <span class="product-price">${product.price}</span>
        </div>
        <button class="btn-buy" type="button">Consultar</button>
    `;

    const imageEl = card.querySelector(".product-image-main");
    attachImageFallback(imageEl, mainImageSrc);

    const hoverImageEl = card.querySelector(".product-image-hover");
    if (hoverImageEl) {
        attachImageFallback(hoverImageEl, hoverImageSrc, () => {
            hoverImageEl.remove();
            card.querySelector(".card-image-wrapper")?.classList.remove("has-hover-image");
        });
    }

    card.querySelector(".btn-buy").addEventListener("click", () => {
        onBuy(product.name);
    });

    return card;
}
