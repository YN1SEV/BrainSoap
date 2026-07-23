export function isTrackableUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

export function hasOptOutPrefix(url) {
  return typeof url === "string" && /^[^a-z0-9]/i.test(url.trim());
}

export function ruleTarget(url) {
  return (url ?? "")
    .trim()
    .replace(/^[^a-z0-9]+/i, "")
    .replace(/^[a-z]+:\/\//i, "")
    .toLowerCase();
}

export function isFullUrlRule(url) {
  return /[/?]/.test(ruleTarget(url));
}

export function domainOf(value) {
  return ruleTarget(value).split(/[/?]/)[0].replace(/^www\./, "");
}

export function faviconUrl(value) {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domainOf(value))}`;
}

// reduces a url to its host; a page covered by a full-url rule keeps the whole url
export function getCleanedIdentifier(input, blacklist = []) {
  if (!input || typeof input !== 'string') return null;

  try {
    let formattedInput = input.trim();
    if (!/^https?:\/\//i.test(formattedInput)) {
      formattedInput = 'https://' + formattedInput;
    }

    const urlObj = new URL(formattedInput);

    let hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');
    const fullUrl = urlObj.href;       

    const keepsFullUrl = blacklist
      .flatMap(category => category.items ?? [])
      .some(item => {
        const target = ruleTarget(item.url);
        return item.active && isFullUrlRule(item.url) && target && fullUrl.toLowerCase().includes(target);
      });

    return keepsFullUrl ? fullUrl : hostname;
  } catch (error) {
    return null;
  }
}