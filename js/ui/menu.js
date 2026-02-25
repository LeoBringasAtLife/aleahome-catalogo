export function renderCatalogMenu({
    catalogMenu,
    catalogStructure,
    activeFilter,
    getFilterKey
}) {
    const groupsHtml = catalogStructure
        .map((group) => {
            const optionsHtml = group.lines
                .map((line) => {
                    const key = getFilterKey(group.brand, line);
                    const activeClass = key === activeFilter ? "is-active" : "";
                    return `<button class="catalog-option ${activeClass}" type="button" data-filter="${key}">${line}</button>`;
                })
                .join("");

            return `
                <section class="catalog-group">
                    <h3 class="catalog-group-title">${group.brand}</h3>
                    <div class="catalog-options">${optionsHtml}</div>
                </section>
            `;
        })
        .join("");

    const allActiveClass = activeFilter === "all" ? "is-active" : "";

    catalogMenu.innerHTML = `
        <section class="catalog-group">
            <h3 class="catalog-group-title">General</h3>
            <div class="catalog-options">
                <button class="catalog-option ${allActiveClass}" type="button" data-filter="all">Ver todos</button>
            </div>
        </section>
        ${groupsHtml}
    `;
}
