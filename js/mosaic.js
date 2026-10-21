// Kept as a small reusable renderer for projects that use the mosaic layout.
export function renderMosaic(news = []) {
  const container = document.getElementById("mosaic");
  if (!container) return;
  container.replaceChildren();
  news.slice(0, 6).forEach(item => {
    const card = document.createElement("a");
    card.className = "mosaic-card";
    card.href = item.link;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    if (item.image) card.style.backgroundImage = `linear-gradient(0deg, #0b1220cc, transparent), url("${String(item.image).replace(/["\\]/g, "")}")`;
    const title = document.createElement("span");
    title.textContent = item.title;
    card.append(title);
    container.append(card);
  });
}
