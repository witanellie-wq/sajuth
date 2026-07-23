// Recent-results memory (localStorage) — lets a customer who closed the tab
// find their reading again just by revisiting the site on the same browser.

export interface HistoryEntry {
  id: string;
  kind: "reading" | "compat";
  label: string;
  url: string;
  ts: number;
}

const KEY = "duang_history";

export function saveHistory(entry: Omit<HistoryEntry, "ts">): void {
  try {
    const prev: HistoryEntry[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const next = [{ ...entry, ts: Date.now() }, ...prev.filter((x) => x.id !== entry.id)].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode etc. — non-fatal */
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
