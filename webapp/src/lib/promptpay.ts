// PromptPay QR generation (EMVCo). Thailand's Phase-0 payment rail — a personal
// PromptPay phone/ID QR needs no merchant account, so we can charge from day one.
// Payload built by hand (no external dep) per the Bank of Thailand EMVCo spec.

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** Sanitize + format a phone / national-ID target into the 13-digit field. */
function formatTarget(raw: string): { type: string; value: string } {
  const digits = raw.replace(/[^0-9]/g, "");
  // >=15 e-wallet, 13 national ID, else mobile phone.
  const type = digits.length >= 15 ? "03" : digits.length >= 13 ? "02" : "01";
  const value = ("0000000000000" + digits.replace(/^0/, "66")).slice(-13);
  return { type, value };
}

/** CRC-16/CCITT-FALSE: init 0xFFFF, poly 0x1021, no reflection. */
export function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Build a PromptPay payload string. Encode it into any QR renderer.
 * @param target PromptPay phone number or 13-digit national ID.
 * @param amount THB amount; omit for an open (static) QR.
 */
export function promptPayPayload(target: string, amount?: number): string {
  const { type, value } = formatTarget(target);

  const merchant = tlv(
    "29",
    tlv("00", "A000000677010111") + tlv(type, value)
  );

  let payload =
    tlv("00", "01") +
    tlv("01", amount != null ? "12" : "11") + // 12 dynamic (has amount), 11 static
    merchant +
    tlv("53", "764") + // currency THB
    (amount != null ? tlv("54", amount.toFixed(2)) : "") +
    tlv("58", "TH");

  payload += "6304"; // CRC tag + length, value appended next
  return payload + crc16(payload);
}
