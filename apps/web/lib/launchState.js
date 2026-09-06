const STORAGE_KEY = "viralterminal_launches_v1";
const EVENT_NAME = "viralterminal:launch-state";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    const now = Date.now();
    let changed = false;
    Object.entries(value).forEach(([id, record]) => {
      if (record.status === "RESERVED" && record.reservedUntil <= now) {
        delete value[id];
        changed = true;
      }
    });
    if (changed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return value;
  } catch {
    return {};
  }
}

function writeAll(value) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getLaunchStates() {
  return readAll();
}

export function getEventLaunch(eventId) {
  return readAll()[String(eventId)] || null;
}

export function getLaunchByToken(tokenId) {
  return Object.values(readAll()).find((record) => record.tokenId === tokenId) || null;
}

export function reserveEvent(eventId, wallet = "0x7a3f…c821", durationMs = 90000) {
  const all = readAll();
  const key = String(eventId);
  const current = all[key];
  if (current?.status === "LAUNCHED") return { ok: false, reason: "already_launched", record: current };
  if (current?.status === "RESERVED" && current.reservedUntil > Date.now() && current.reservedBy !== wallet) {
    return { ok: false, reason: "reserved", record: current };
  }
  const record = {
    status: "RESERVED",
    eventId: Number(eventId),
    reservedBy: wallet,
    reservedUntil: Date.now() + durationMs,
    createdAt: new Date().toISOString(),
  };
  writeAll({ ...all, [key]: record });
  return { ok: true, record };
}

export function releaseEvent(eventId) {
  const all = readAll();
  delete all[String(eventId)];
  writeAll(all);
}

export function confirmLaunch(eventId, payload) {
  const all = readAll();
  const record = {
    ...all[String(eventId)],
    ...payload,
    eventId: Number(eventId),
    status: "LAUNCHED",
    confirmedAt: new Date().toISOString(),
    reservedUntil: null,
  };
  writeAll({ ...all, [String(eventId)]: record });
  return record;
}

export function subscribeLaunchState(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}
