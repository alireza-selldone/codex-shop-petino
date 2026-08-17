import { loadCatalog, money, byId, loadReviews } from "./shop-data.js";
import { cardHTML, esc, productCount, responsiveProductAttrs } from "./app.js";

function stars(n) {
  const full = Math.round(n);
  return `<span aria-hidden="true">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>`;
}

function renderCategories(cat) {
  const root = document.querySelector("[data-home-categories]");
  if (!root) return;
  const categories = cat.cats.slice(0, 4);
  root.dataset.n = String(categories.length);
  const section = root.closest("section");
  if (section) section.hidden = categories.length < 3;
  root.innerHTML = categories.map((category) => `
    <a class="pet-category" href="shop.html?cat=${encodeURIComponent(category.slug)}">
      <b>${esc(category.name)}</b>
      <small>${productCount(category.count)} · from ${money(category.from)}</small>
      <img src="${category.image}"${responsiveProductAttrs(category.image, "(max-width: 767px) 46vw, (max-width: 1023px) 30vw, 280px", category.image256, category.image512)} alt="${esc(category.name)}" width="512" height="512" loading="lazy">
    </a>`).join("");
}

function renderMostViewed(cat) {
  const root = document.querySelector("[data-most-viewed]");
  if (!root) return;
  const snapshot = Array.isArray(cat.cfg?.mostVisited) ? cat.cfg.mostVisited : [];
  const viewed = snapshot.map((item) => ({ product: byId(cat, item.productId), views: item.views })).filter((item) => item.product).slice(0, 4);
  const fallback = cat.products.slice(0, 4).map((product) => ({ product, views: null }));
  root.innerHTML = (viewed.length ? viewed : fallback).map(({ product, views }) => `
    <div class="pet-viewed">
      ${views === null ? "" : `<span class="pet-view-count">◉ ${views} views</span>`}
      ${cardHTML(product)}
    </div>`).join("");

  const featured = (viewed[0] || fallback[0])?.product;
  if (!featured) return;
  const name = document.querySelector("[data-feature-name]");
  const image = document.querySelector("[data-feature-image]");
  const link = document.querySelector("[data-feature-link]");
  const badge = document.querySelector("[data-feature-badge]");
  if (name) name.textContent = featured.name;
  if (image) {
    image.src = featured.image;
    image.alt = featured.name;
    const local = /^assets\/products\/.*\.png$/i.test(featured.image);
    image.srcset = featured.image256 && featured.image512
      ? `${featured.image256} 256w, ${featured.image512} 512w`
      : local ? `${featured.image.slice(0, -4)}-320.png 320w, ${featured.image.slice(0, -4)}-640.png 640w` : "";
    image.sizes = "(max-width: 767px) 80vw, 38vw";
  }
  if (link) link.href = `product.html?id=${featured.id}`;
  if (badge && viewed[0]?.views) badge.textContent = `${viewed[0].views} visits · Pack favorite`;
}

function renderReviews(products) {
  const root = document.querySelector("[data-review-list]");
  const summary = document.querySelector("[data-review-summary]");
  const note = document.querySelector("[data-review-note]");
  if (!root) return;
  const { reviews, average, total, sample } = loadReviews(products);
  if (summary) summary.innerHTML = `${average.toFixed(1)} <span>${stars(average)}</span><small>${total} sample pet stories</small>`;
  if (sample && note) {
    note.hidden = false;
    note.textContent = "Sample reviews for layout demonstration only — these are fictional pet stories, not real customer testimonials.";
  }
  root.innerHTML = reviews.map((review) => `
    <figure class="pet-review">
      <p class="pet-review__stars" aria-label="${review.rating} out of 5">${stars(review.rating)}</p>
      <blockquote>“${esc(review.body)}”</blockquote>
      <figcaption><span>${esc(review.name.slice(0, 1))}</span><b>${esc(review.name)}</b> · ${esc(review.city || "Sample story")}</figcaption>
    </figure>`).join("");
}

async function hydrateHome() {
  const cat = await loadCatalog();
  renderCategories(cat);
  renderMostViewed(cat);
  renderReviews(cat.products);
  document.querySelectorAll(".pet-hero__proof b").forEach((el) => { el.textContent = `${cat.products.length} thoughtful picks`; });
}

document.addEventListener("catalog:ready", hydrateHome, { once: true });
