let currentPage = "NameSelector";

function setPage(page) {
    currentPage = page;
    ReRender(currentPage);
    console.log("Page set to:", currentPage);
}

document.addEventListener("DOMContentLoaded", () => {
    ReRender(currentPage);
    console.log("Initial page rendered:", currentPage);
});