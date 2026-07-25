// Server-side redaction for locked premium content. Blur is only a CSS
// effect — the full text would otherwise ship in the HTML where view-source
// reveals it. Before payment, generated (gen*) section bodies are cut to a
// short teaser server-side; the client blur handles the visual.

export function redactLocked<T extends { key: string; body: string; locked: boolean }>(
  sections: T[]
): T[] {
  return sections.map((s) =>
    s.locked && s.key.startsWith("gen") && s.body.length > 90
      ? { ...s, body: s.body.slice(0, 80) + " …" }
      : s
  );
}

// Safety net for degenerate generated sections — e.g. a rare model response
// that comes back as a "placeholder" stub, or an empty/too-short body. A real
// gen section is always long (700+ chars), and a locked teaser is ~80 chars,
// so anything under 40 chars (or whose body just repeats its title) is broken
// and must not reach the reader. Only touches gen* keys.
export function dropDegenerate<T extends { key: string; title: string; body: string }>(
  sections: T[]
): T[] {
  return sections.filter((s) => {
    if (!s.key.startsWith("gen")) return true;
    const body = (s.body ?? "").trim();
    if (body.length < 40) return false;
    if (body === (s.title ?? "").trim()) return false;
    return true;
  });
}
