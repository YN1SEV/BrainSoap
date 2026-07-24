import { faviconUrl } from "./url.js";

// creates a favicon <img>; if the request fails (e.g. offline on page load)
// it gets retried automatically once the browser regains connectivity
export function createFaviconImg(pageUrl, className = "favicon") {
  const img = document.createElement("img");
  img.className = className;
  img.alt = "";
  img.src = faviconUrl(pageUrl);
  img.addEventListener("error", () => { img.dataset.faviconFailed = "1"; }, { once: true });
  return img;
}

window.addEventListener("online", () => {
  document.querySelectorAll('img[data-favicon-failed="1"]').forEach((img) => {
    const src = img.src;
    delete img.dataset.faviconFailed;
    img.src = "";
    img.src = src;
  });
});
