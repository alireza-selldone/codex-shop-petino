const STORAGE_KEY = "petino.color-theme";
const THEMES = [
  { id: "coral", name: "Coral", color: "#c2462c" },
  { id: "ocean", name: "Ocean", color: "#2f6fbe" },
  { id: "forest", name: "Forest", color: "#287453" },
  { id: "plum", name: "Plum", color: "#7952ad" },
  { id: "amber", name: "Amber", color: "#a96218" },
];

const themeIds = new Set(THEMES.map(({ id }) => id));

function readTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return themeIds.has(value) ? value : "coral";
  } catch {
    return "coral";
  }
}

function setTheme(theme, persist = true) {
  const next = themeIds.has(theme) ? theme : "coral";
  document.documentElement.dataset.petinoTheme = next;
  document.querySelectorAll("[data-theme-option]").forEach((option) => {
    const selected = option.dataset.themeOption === next;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-checked", String(selected));
  });
  const current = THEMES.find(({ id }) => id === next);
  const label = document.querySelector("[data-theme-current]");
  const swatch = document.querySelector("[data-theme-current-swatch]");
  if (label && current) label.textContent = current.name;
  if (swatch && current) swatch.style.setProperty("--swatch", current.color);
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Private browsing can block storage. */ }
  }
}

function closeMenu(root, returnFocus = false) {
  const button = root.querySelector("[data-theme-toggle]");
  const menu = root.querySelector("[data-theme-menu]");
  menu.hidden = true;
  button.setAttribute("aria-expanded", "false");
  if (returnFocus) button.focus();
}

function initThemeBar() {
  if (document.querySelector(".pet-platformbar")) return;

  const activeTheme = readTheme();
  const bar = document.createElement("div");
  bar.className = "pet-platformbar";
  bar.setAttribute("data-theme-switcher", "");
  bar.innerHTML = `
    <p class="pet-platformbar__credit">
      <span class="pet-platformbar__heart" aria-hidden="true">♥</span>
      <span>Made with</span>
      <a href="https://selldone.com" target="_blank" rel="noopener">Selldone</a>
    </p>
    <div class="pet-theme-picker">
      <button class="pet-theme-picker__toggle" type="button" data-theme-toggle aria-expanded="false" aria-haspopup="true" aria-label="Choose color theme">
        <span class="pet-theme-picker__swatch" data-theme-current-swatch aria-hidden="true"></span>
        <span data-theme-current>Coral</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4"/></svg>
      </button>
      <div class="pet-theme-picker__menu" data-theme-menu role="radiogroup" aria-label="Color theme" hidden>
        ${THEMES.map(({ id, name, color }) => `
          <button type="button" role="radio" aria-checked="false" data-theme-option="${id}">
            <span class="pet-theme-picker__swatch" style="--swatch:${color}" aria-hidden="true"></span>
            <span>${name}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7"/></svg>
          </button>`).join("")}
      </div>
    </div>`;

  document.body.prepend(bar);
  const toggle = bar.querySelector("[data-theme-toggle]");
  const menu = bar.querySelector("[data-theme-menu]");

  toggle.addEventListener("click", () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    toggle.setAttribute("aria-expanded", String(opening));
    if (opening) bar.querySelector('[data-theme-option][aria-checked="true"]')?.focus();
  });

  bar.querySelectorAll("[data-theme-option]").forEach((option) => {
    option.addEventListener("click", () => {
      setTheme(option.dataset.themeOption);
      closeMenu(bar, true);
    });
  });

  document.addEventListener("click", (event) => {
    if (!bar.contains(event.target)) closeMenu(bar);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) closeMenu(bar, true);
  });

  setTheme(activeTheme, false);
}

document.documentElement.dataset.petinoTheme = readTheme();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initThemeBar, { once: true });
} else {
  initThemeBar();
}
