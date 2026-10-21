export function classify(text = "") {
  const value = text.toLocaleLowerCase("ru");
  const rules = [
    ["politics", /политик|государств|кремл|президент|госдум|министр|выбор|законопроект|санкци|дипломат|правительств|совет федерац|мид россии|депутат|парламент/],
    ["sports", /спорт|футбол|хокке|баскетбол|теннис|олимпи|чемпионат|матч|тренер|голы|турнир|спортсмен|рпл|сборная|лыж|формула-1/],
    ["economy", /экономик|рубл|доллар|евро|инфляц|цб россии|центробанк|ставк|бизнес|рынок акци|бирж|нефть|газ|бюджет|налог|зарплат|цены|ввп|инвестиц|компани|торговл|финанс/],
    ["technology", /технолог|искусственн.*интеллект|нейросет|ии\b|робот|гаджет|смартфон|программ|кибербезопас|интернет|приложени|разработчик|цифров|космос|спутник|научн|стартап|компьютер/]
  ];
  for (const [category, pattern] of rules) if (pattern.test(value)) return category;
  return "other";
}

function cleanText(value = "") {
  const el = document.createElement("div");
  el.innerHTML = String(value);
  return (el.textContent || el.innerText || "").replace(/\s+/g, " ").trim();
}

function looksRussian(article) {
  // Mediastack supplies an explicit ISO language field; require it to be Russian.
  if (String(article.language || "").toLowerCase().split(/[-_]/)[0] !== "ru") return false;
  // Extra guard against malformed records that claim Russian but contain no Cyrillic text.
  const text = `${article.title || ""} ${article.description || ""}`;
  return /[А-Яа-яЁё]{2}/.test(text);
}

function normalize(article) {
  if (!looksRussian(article)) return null;
  const title = cleanText(article.title || "");
  const link = article.url || "";
  if (!title || !/^https?:\/\//i.test(link)) return null;
  return {
    title,
    link,
    image: article.image || "",
    source: article.source || "Mediastack",
    description: cleanText(article.description || "").slice(0, 360),
    pubDate: article.published_at || "",
    language: "ru",
    category: classify(`${title} ${article.description || ""}`)
  };
}

export async function getNews() {
  const response = await fetch("/api/news", { headers: { Accept: "application/json" } });
  let payload;
  try { payload = await response.json(); }
  catch { throw new Error("Сервер вернул не JSON. Проверьте, что запущен npm start."); }
  if (!response.ok) throw new Error(payload.error || `Ошибка сервера: HTTP ${response.status}`);
  if (!Array.isArray(payload.data)) throw new Error(payload.error || "API вернул неожиданный формат данных");
  const news = payload.data.map(normalize).filter(Boolean);
  if (!news.length) throw new Error("Mediastack не вернул русскоязычных статей. Проверьте ключ, тариф и доступность русских источников.");
  const unique = new Map();
  for (const item of news) if (!unique.has(item.link)) unique.set(item.link, item);
  return [...unique.values()].sort((a,b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0));
}
