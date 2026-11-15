// Automatic PromptPay slip verification via EasySlip (https://easyslip.com).
// The buyer uploads the bank-app transfer slip; EasySlip reads the slip's
// mini-QR, asks the bank for the real transaction, and returns amount,
// receiver and a duplicate flag. We unlock only when:
//   1. the slip is genuine (EasySlip found the transaction),
//   2. it was not used before (checkDuplicate),
//   3. amount >= price,
//   4. the receiver is OUR PromptPay (last 4 digits of PROMPTPAY_TARGET match
//      the masked receiver account, or the receiver name matches
//      EASYSLIP_RECEIVER_NAME), and
//   5. the transfer is recent (≤ 48 h).
// Disabled (returns { enabled:false }) when EASYSLIP_API_KEY is not set, so
// the site keeps the manual claim flow as a fallback.

const API = "https://developer.easyslip.com/api/v1/verify";

export type SlipResult =
  | { ok: true; transRef: string; amount: number }
  | { ok: false; reason: SlipFail; detail?: string };

export type SlipFail =
  | "disabled"
  | "not_slip" // no QR / not a bank slip
  | "not_found" // bank has no such transaction (fake)
  | "duplicate"
  | "amount"
  | "receiver"
  | "too_old"
  | "quota"
  | "error";

export function slipEnabled(): boolean {
  return !!process.env.EASYSLIP_API_KEY;
}

function digits(s: unknown): string {
  return String(s ?? "").replace(/[^0-9]/g, "");
}

/** Does a masked account like "xxx-xxx-3114" belong to our PromptPay target? */
export function receiverMatches(receiver: any): boolean {
  const target = digits(process.env.PROMPTPAY_TARGET);
  const accounts = [
    receiver?.account?.proxy?.account,
    receiver?.account?.bank?.account,
    receiver?.proxy?.account,
  ]
    .map(digits)
    .filter((d) => d.length >= 3);
  // Slips mask most digits ("xxx-xxx-3114"): compare the visible tail.
  if (target && accounts.some((d) => target.endsWith(d.slice(-4)))) return true;
  const name = (process.env.EASYSLIP_RECEIVER_NAME ?? "").trim().toLowerCase();
  if (name) {
    const names = [receiver?.account?.name?.th, receiver?.account?.name?.en, receiver?.displayName]
      .map((n) => String(n ?? "").toLowerCase().replace(/\s+/g, " "));
    const key = name.split(/\s+/)[0];
    if (names.some((n) => n && n.includes(key))) return true;
  }
  return false;
}

export async function verifySlip(file: Blob, expectedAmount: number): Promise<SlipResult> {
  const key = process.env.EASYSLIP_API_KEY;
  if (!key) return { ok: false, reason: "disabled" };

  const fd = new FormData();
  fd.append("file", file, "slip.jpg");
  fd.append("checkDuplicate", "true");

  let json: any;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: fd,
    });
    json = await res.json().catch(() => ({}));
  } catch (err) {
    return { ok: false, reason: "error", detail: String(err) };
  }

  const msg = String(json?.message ?? "");
  if (json?.status !== 200 || !json?.data) {
    if (msg === "duplicate_slip") return { ok: false, reason: "duplicate" };
    if (msg === "invalid_image" || msg === "qrcode_not_found" || msg === "invalid_payload")
      return { ok: false, reason: "not_slip" };
    if (msg === "slip_not_found") return { ok: false, reason: "not_found" };
    if (msg === "quota_exceeded" || msg === "application_expired")
      return { ok: false, reason: "quota", detail: msg };
    return { ok: false, reason: "error", detail: msg || `status ${json?.status}` };
  }

  const d = json.data;
  const amount = Number(d?.amount?.amount ?? d?.amount ?? 0);
  if (!(amount + 0.001 >= expectedAmount)) return { ok: false, reason: "amount", detail: String(amount) };
  if (!receiverMatches(d?.receiver)) return { ok: false, reason: "receiver" };
  const when = Date.parse(d?.date ?? "");
  if (Number.isFinite(when) && Date.now() - when > 48 * 3600 * 1000)
    return { ok: false, reason: "too_old" };

  return { ok: true, transRef: String(d?.transRef ?? ""), amount };
}
