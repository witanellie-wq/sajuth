// Claude rewrite layer — turns the deterministic template sections into natural,
// on-brand Thai prose (PLAN.md 6.3). Voice: "포스텔러 세련됨 + easy_saju 체감형".
//
// Enabled only when ANTHROPIC_API_KEY is set AND the caller opts in (rewrite is
// slower + costs tokens). Without a key it's a no-op — templates pass through,
// so the app always works offline. The system prompt is cached to cut cost.

import type { SajuChart } from "./saju";
import type { ReportSection } from "./interpret";

const MODEL = "claude-sonnet-5";

const SYSTEM = `คุณคือนักเขียนคำทำนายซาจู (사주) สไตล์เกาหลีสำหรับผู้หญิงไทยวัย 20-35 ปี
โทน: อบอุ่น เป็นกันเองเหมือนเพื่อนสนิท ทันสมัย ไม่ขู่ ไม่ตัดสิน
งานของคุณ: เขียนข้อความต้นฉบับให้เป็นธรรมชาติขึ้น กระชับ อ่านลื่น เก็บความหมายเดิมไว้
ห้ามเพิ่มคำทำนายที่ชี้ชะตาแบบฟันธง และคงความยาวใกล้เคียงเดิม
ตอบกลับเป็นภาษาไทยเท่านั้น`;

interface AnthropicLike {
  messages: {
    create(args: unknown): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
}

let client: AnthropicLike | null | undefined;

function getClient(): AnthropicLike | null {
  if (client !== undefined) return client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    client = null;
    return null;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Anthropic = require("@anthropic-ai/sdk");
  client = new Anthropic({ apiKey: key }) as AnthropicLike;
  return client;
}

/**
 * Rewrite the FREE (unlocked) sections into natural Thai. Locked sections keep
 * their placeholder body (they're blurred anyway). Falls back to the input on
 * any error so a failed API call never breaks the reading.
 */
export async function rewriteSections(
  chart: SajuChart,
  sections: ReportSection[]
): Promise<ReportSection[]> {
  const c = getClient();
  if (!c) return sections;

  const targets = sections.filter((s) => !s.locked);
  if (targets.length === 0) return sections;

  const payload = targets.map((s) => ({ key: s.key, title: s.title, body: s.body }));
  const prompt =
    `ธาตุประจำวันเกิด (일간): ${chart.dayMaster} (${chart.dayMasterElement})\n` +
    `ปรับข้อความในแต่ละหมวดให้เป็นธรรมชาติขึ้น ตอบเป็น JSON array ` +
    `รูปแบบ [{"key":"...","body":"..."}] เท่านั้น ไม่ต้องมีข้อความอื่น:\n` +
    JSON.stringify(payload, null, 2);

  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content.find((b) => b.type === "text")?.text ?? "";
    const json = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
    const rewritten = JSON.parse(json) as Array<{ key: string; body: string }>;
    const byKey = new Map(rewritten.map((r) => [r.key, r.body]));
    return sections.map((s) =>
      byKey.has(s.key) ? { ...s, body: byKey.get(s.key)! } : s
    );
  } catch {
    return sections; // graceful fallback — never break the reading
  }
}
