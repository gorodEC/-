export function setHero(item) {
  const hero = document.getElementById("hero");
  const title = document.getElementById("hero-title");
  const summary = document.getElementById("hero-summary");
  const link = document.getElementById("hero-link");
  const category = document.getElementById("hero-category");
  if (!item) { hero.hidden = true; return; }

  hero.hidden = false;
  title.textContent = item.title;
  summary.textContent = item.description || `${item.source} · ${formatDate(item.pubDate)}`;
  link.href = item.link;
  category.textContent = categoryName(item.category);
  hero.style.backgroundImage = item.image
    ? `linear-gradient(90deg, rgba(9,15,27,.96) 0%, rgba(9,15,27,.72) 48%, rgba(9,15,27,.08) 100%), url("${safeCssUrl(item.image)}")`
    : "linear-gradient(120deg, #172554, #1d4ed8 55%, #0891b2)";
}
function safeCssUrl(url) { return String(url).replace(/["\\\n\r]/g, ""); }
function formatDate(date) {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "Дата не указана" : d.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
}
function categoryName(category) {
  return ({ politics: "Политика", sports: "Спорт", economy: "Экономика", technology: "Технологии", other: "Новости" })[category] || "Главное";
}
