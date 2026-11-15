// /ads.txt — 애드센스 판매자 인증. NEXT_PUBLIC_ADSENSE_CLIENT(ca-pub-…)에서 pub ID를 읽는다.
export const dynamic = "force-dynamic";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
  const pub = client.replace(/^ca-/, "");
  const body = pub ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
