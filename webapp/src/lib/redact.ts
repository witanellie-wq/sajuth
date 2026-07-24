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
