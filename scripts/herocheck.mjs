/* Petino homepage hero verification.
   Measures the deployed design rather than the retired Watchino photograph. */
import { chromium } from "playwright";

const B = (process.argv[2] || "http://localhost:8788").replace(/\/+$/, "");
const WIDTHS = [375, 768, 1024, 1440];
const browser = await chromium.launch();
let failures = 0;
const fail = (message) => { failures++; console.log(`  FAIL  ${message}`); };
const pass = (message) => console.log(`  ok    ${message}`);

function measureHero() {
  const heading = document.querySelector(".pet-hero h1");
  const paragraph = document.querySelector(".pet-hero__copy>p:nth-of-type(2)");
  const header = document.querySelector(".pet-header");
  const image = document.querySelector(".pet-hero__visual img");
  const range = document.createRange();
  range.selectNodeContents(heading);
  const rects = [...range.getClientRects()].filter((rect) => rect.width > 1 && rect.height > 1);
  const tops = [...new Set(rects.map((rect) => Math.round(rect.top)))];
  const advance = tops.length > 1 ? tops[1] - tops[0] : Infinity;
  const glyphBox = Math.max(0, ...rects.map((rect) => rect.height));
  const responsive = [...document.querySelectorAll(
    ".pet-hero__visual img,.pet-category img,.pet-viewed img,.pet-feature__image img,.pet-article__art img",
  )];
  return {
    headerPosition: getComputedStyle(header).position,
    lines: tops.length,
    advance,
    glyphBox,
    headingWidth: heading.getBoundingClientRect().width,
    paragraphWidth: paragraph.getBoundingClientRect().width,
    imageLoaded: image.complete && image.naturalWidth > 0,
    responsiveMissing: responsive.filter((item) =>
      !item.srcset || !item.sizes || !item.hasAttribute("width") || !item.hasAttribute("height")).length,
  };
}

console.log("\nPetino hero — type, sticky navigation and responsive assets");
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: width === 375 ? 844 : 900 } });
  const page = await context.newPage();
  await page.goto(B + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".pet-categories .pet-category", { timeout: 30000 });
  await page.waitForFunction(() => {
    const image = document.querySelector(".pet-hero__visual img");
    return image?.complete && image.naturalWidth > 0;
  }, null, { timeout: 30000 });
  const result = await page.evaluate(measureHero);

  result.headerPosition === "sticky"
    ? pass(`${width}px header computes to sticky`)
    : fail(`${width}px header computes to ${result.headerPosition}`);
  result.lines <= 4
    ? pass(`${width}px heading uses ${result.lines} line(s)`)
    : fail(`${width}px heading uses ${result.lines} lines`);
  result.advance >= result.glyphBox - 1
    ? pass(`${width}px line advance ${result.advance.toFixed(1)}px clears ${result.glyphBox.toFixed(1)}px glyph box`)
    : fail(`${width}px line advance ${result.advance.toFixed(1)}px overlaps ${result.glyphBox.toFixed(1)}px glyph box`);
  if (width >= 768) {
    result.headingWidth + 1 >= result.paragraphWidth
      ? pass(`${width}px heading is at least as wide as body copy`)
      : fail(`${width}px heading ${result.headingWidth.toFixed(1)}px is narrower than body ${result.paragraphWidth.toFixed(1)}px`);
  }
  result.imageLoaded ? pass(`${width}px hero image loaded`) : fail(`${width}px hero image did not load`);
  result.responsiveMissing === 0
    ? pass(`${width}px homepage images carry dimensions, srcset and sizes`)
    : fail(`${width}px ${result.responsiveMissing} homepage image(s) lack responsive metadata`);

  await page.evaluate(() => scrollTo(0, Math.min(2200, document.documentElement.scrollHeight - innerHeight)));
  await page.waitForTimeout(100);
  const top = await page.locator(".pet-orbit-nav").evaluate((element) => element.getBoundingClientRect().top);
  top >= -1 && top <= 20
    ? pass(`${width}px navigation remains visible after deep scroll`)
    : fail(`${width}px navigation top is ${top.toFixed(1)}px after deep scroll`);
  await context.close();
}

console.log("\nNegative controls — the assertions must be able to fail");
{
  const context = await browser.newContext({ viewport: { width: 375, height: 844 } });
  const page = await context.newPage();
  await page.goto(B + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".pet-hero h1");
  const caught = await page.evaluate((source) => {
    const style = document.createElement("style");
    style.textContent = ".pet-hero h1{line-height:.5!important}.pet-header{position:relative!important}";
    document.head.append(style);
    const result = eval(`(${source})`)();
    style.remove();
    return result.advance < result.glyphBox - 1 && result.headerPosition !== "sticky";
  }, measureHero.toString());
  caught ? pass("broken line-height and non-sticky header are detected")
    : fail("negative control was not detected");
  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILURE(S)\n` : "\nHero checks passed.\n");
process.exit(failures ? 1 : 0);
