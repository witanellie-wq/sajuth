// QR이 없는 슬립(예: K BIZ 기업뱅킹 슬립)용 보조 확인.
// Claude 비전으로 슬립 글자를 읽어 금액·받는 계좌·시각·거래번호를 뽑고,
// 받는 계좌 끝자리(PROMPTPAY_TARGET) · 금액 · 48시간 이내 · 거래번호 중복을
// 검사한다. QR 확인(은행 조회)보다 약하므로 claim에 "ocr:"로 표시해
// 관리자 화면에서 나중에 대조할 수 있게 한다.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MODEL = process.env.SLIP_OCR_MODEL || process.env.REPORT_MODEL || "claude-sonnet-5";

export interface OcrSlip {
  isBankSlip: boolean;
  amount: number | null;
  receiverAccount: string | null; // masked as printed, e.g. xxx-xxx-3114
  receiverName: string | null;
  datetime: string | null; // ISO 8601 with +07:00
  transactionNo: string | null;
}

export async function readSlip(file: Blob): Promise<OcrSlip | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Anthropic = require("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey: key });
  const buf = Buffer.from(await file.arrayBuffer());
  const type = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: type, data: buf.toString("base64") } },
          {
            type: "text",
            text:
              "This should be a Thai bank transfer slip (e.g. K PLUS, K BIZ, SCB, Krungthai). " +
              "Read ONLY what is printed. Reply with JSON only, no prose: " +
              '{"isBankSlip":bool,"amount":number|null,"receiverAccount":string|null,' +
              '"receiverName":string|null,"datetime":"YYYY-MM-DDTHH:mm:00+07:00"|null,' +
              '"transactionNo":string|null}. receiverAccount = the TO/ผู้รับ account or PromptPay ' +
              "number exactly as printed (masked ok). Thai Buddhist years: subtract 543. " +
              "Two-digit years like 26 mean 2026.",
          },
        ],
      },
    ],
  });
  const text = res.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as OcrSlip;
  } catch {
    return null;
  }
}
