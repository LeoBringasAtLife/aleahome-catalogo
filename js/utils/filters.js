export function normalizeText(value) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function getFilterKey(brand, line) {
    return `${normalizeText(brand)}-${normalizeText(line)}`;
}

export function buildFilterMeta(catalogStructure) {
    const filterMeta = new Map();
    filterMeta.set("all", { label: "Todos" });

    catalogStructure.forEach((group) => {
        group.lines.forEach((line) => {
            const key = getFilterKey(group.brand, line);
            filterMeta.set(key, {
                brand: group.brand,
                line,
                label: `${group.brand} / ${line}`
            });
        });
    });

    return filterMeta;
}
