import { getNews } from "./rssapi.js";
import { setHero } from "./hero.js";
import { renderNewsColumns } from "./newcolumns.js";

const filters = [...document.querySelectorAll(".filter")];
const grid = document.getElementById("newsGrid");
const notice = document.getElementById("notice");
const updatedAt = document.getElementById("updatedAt");
const resultCount = document.getElementById("resultCount");
const feedHeading = document.getElementById("feedHeading");
const retryButton = document.getElementById("retryButton");

let allNews = [];
let activeCategory = "all";

const categoryLabels = {
  all: "Последние новости",
  politics: "Политика",
  sports: "Спорт",
  economy: "Экономика",
  technology: "Технологии"
};

function applyFilter() {
  const filtered = activeCategory === "all"
    ? allNews
    : allNews.filter(item => item.category === activeCategory);
  const visible = activeCategory === "all" ? filtered.slice(0, 30) : filtered;
  feedHeading.textContent = categoryLabels[activeCategory] || "Последние новости";
  resultCount.textContent = `${visible.length} ${plural(visible.length)}`;
  renderNewsColumns(visible);
  setHero(visible[0] || null);
  if (allNews.length && !visible.length) {
    notice.textContent = "В этой категории пока не найдено новостей. Попробуйте «Все новости» или обновите ленту.";
    notice.className = "notice";
  } else if (allNews.length) {
    notice.textContent = `Получено ${allNews.length} новостей из RSS-источников.`;
    notice.className = "notice success";
  }
}
function plural(n) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "новость";
  if ([2,3,4].includes(mod10) && ![12,13,14].includes(mod100)) return "новости";
  return "новостей";
}
filters.forEach(button => button.addEventListener("click", () => {
  activeCategory = button.dataset.category || "all";
  filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle("active", selected);
    filter.setAttribute("aria-pressed", String(selected));
  });
  applyFilter();
}));

async function loadNews() {
  retryButton.disabled = true;
  retryButton.textContent = "Загружаем…";
  grid.setAttribute("aria-busy", "true");
  notice.className = "notice";
  notice.textContent = "Загружаем свежие новости из RSS-источников…";
  try {
    allNews = await getNews();
    updatedAt.textContent = `Обновлено ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
    applyFilter();
  } catch (error) {
    console.error("Не удалось загрузить новости:", error);
    notice.className = "notice error";
    notice.textContent = `Не удалось загрузить новости: ${error?.message || "неизвестная ошибка"}. Проверьте настройки API и запустите сайт командой npm start.`;
    grid.replaceChildren();
    const detail = document.createElement("p");
    detail.className = "empty-state";
    detail.textContent = "Новостной API временно недоступен или заблокирован сетью. Попробуйте обновить страницу позже.";
    grid.append(detail);
    resultCount.textContent = "";
    setHero(null);
  } finally {
    grid.setAttribute("aria-busy", "false");
    retryButton.disabled = false;
    retryButton.textContent = "Обновить новости";
  }
}
retryButton.addEventListener("click", loadNews);
loadNews();
