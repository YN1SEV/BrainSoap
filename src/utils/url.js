export function isTrackableUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}
// turns a url into "domain/firstpath" so pages can be grouped
export function getCleanedIdentifier(input) {
  if (!input || typeof input !== 'string') return null;

  try {
    let formattedInput = input.trim();
    if (!/^https?:\/\//i.test(formattedInput)) {
      formattedInput = 'https://' + formattedInput;
    }

    const urlObj = new URL(formattedInput);

    let hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);

    if (pathSegments.length > 0) {
      return `${hostname}/${pathSegments[0]}`;
    }

    return hostname;
  } catch (error) {
    return null;
  }
}