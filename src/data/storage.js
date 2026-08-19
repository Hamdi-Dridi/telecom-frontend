// Generic localStorage read/write helpers, used by every persisted store
// (users, periods, targets, weights, comments, validations, plans...).
// All keys keep the same "_v5" suffix as the vanilla-JS version so that,
// if someone opens both versions in the same browser, the data lines up.
export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
  } catch (e) { /* corrupt or blocked storage — fall through */ }
  return fallback;
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) { /* storage full or blocked — silently ignore */ }
}
