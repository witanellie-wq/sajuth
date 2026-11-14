// Renders a report section body. Lines starting with "▸ " are sub-headings
// (the two-block structure the AI report uses); everything else is prose.
export default function ReportBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) =>
        line.startsWith("▸") ? (
          <span key={i} className="mt-3 block font-bold text-ink first:mt-0">
            {line.replace(/^▸\s*/, "")}
          </span>
        ) : (
          <span key={i} className="block">
            {line || " "}
          </span>
        )
      )}
    </>
  );
}
