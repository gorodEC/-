export function renderNewsColumns(news = []) {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;
  grid.replaceChildren();
  if (!news.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "По этой теме пока нет новостей. Попробуйте другую категорию.";
    grid.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  for (const item of news) {
    const card = document.createElement("article");
    card.className = "news-card";
    const link = document.createElement("a");
    link.className = "news-card-link";
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    if (item.image) {
      const image = document.createElement("img");
      image.className = "news-image";
      image.src = item.image;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.onerror = () => image.remove();
      link.append(image);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "image-placeholder";
      placeholder.textContent = "НОВОСТИ";
      link.append(placeholder);
    }
    const content = document.createElement("div");
    content.className = "news-card-content";
    const meta = document.createElement("div");
    meta.className = "news-meta";
    const cat = document.createElement("span");
    cat.className = `category-chip cat-${item.category}`;
    cat.textContent = categoryName(item.category);
    const source = document.createElement("span");
    source.textContent = item.source || "Новостной источник";
    meta.append(cat, source);
    const title = document.createElement("h3");
    title.textContent = item.title;
    const description = document.createElement("p");
    description.className = "news-description";
    description.textContent = item.description || "Откройте материал, чтобы прочитать подробности.";
    const date = document.createElement("time");
    date.className = "news-date";
    const parsed = Date.parse(item.pubDate);
    if (parsed) date.dateTime = new Date(parsed).toISOString();
    date.textContent = parsed ? new Date(parsed).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }) : "Дата не указана";
    content.append(meta, title, description, date);
    link.append(content);
    card.append(link);
    fragment.append(card);
  }
  grid.append(fragment);
}
function categoryName(category) {
  return ({ politics: "Политика", sports: "Спорт", economy: "Экономика", technology: "Технологии", other: "Общее" })[category] || "Общее";
}
