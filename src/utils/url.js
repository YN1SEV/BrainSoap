export function isTrackableUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}
// extract the domain and first path segment from a url, and clean it up
export function getCleanedIdentifier(input) {
  if (!input || typeof input !== 'string') return null;

  try {
    let formattedInput = input.trim();
    if (!/^https?:\/\//i.test(formattedInput)) {
      formattedInput = 'https://' + formattedInput;
    }

    const urlObj = new URL(formattedInput);

    // 1. Clean the hostname (lowercase, remove www.)
    let hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

    // 2. Handle the path
    // Split path by "/", filter out empty strings
    const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);

    // 3. Combine: Hostname + first segment (if it exists)
    if (pathSegments.length > 0) {
      return `${hostname}/${pathSegments[0]}`;
    }

    return hostname;
  } catch (error) {
    return null;
  }
}