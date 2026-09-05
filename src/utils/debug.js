const PREFIX = "[BrainSoap]";

function serialize(details) {
  if (!details || Object.keys(details).length === 0) return "";

  try {
    return ` ${JSON.stringify(details)}`;
  } catch {
    return " [details unavailable]";
  }
}

export function debugLog(event, details = {}) {
  console.log(`${PREFIX} ${event}${serialize(details)}`);
}

export function debugError(event, error, details = {}) {
  const reason = error?.message ?? String(error ?? "unknown error");
  console.error(`${PREFIX} ERROR ${event}: ${reason}${serialize(details)}`);
}
