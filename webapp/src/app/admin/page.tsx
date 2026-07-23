import { headers } from "next/headers";
import { store, compatStore, amuletStore } from "@/lib/store";

// Owner-only payment dashboard (Korean UI).
// Open: https://<site>/admin?key=<ADMIN_SECRET>
// Lists transfer claims awaiting verification; [승인] marks paid after you
// match the 입금자명 + amount in your bank app.
export const dynamic = "force-dynamic";

function fmt(iso?: string): string {
  if (!iso) return "-";
  return iso.replace("T", " ").slice(0, 16) + " UTC";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string; ok?: string };
}) {
  const secret = process.env.ADMIN_SECRET;
  const key = searchParams.key ?? "";
  if (!secret || key !== secret) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="text-xl font-bold text-rosewood">🔒 관리자 전용</h1>
        <p className="mt-2 text-sm text-ink/60">
          {secret
            ? "잘못된 키입니다. /admin?key=ADMIN_SECRET 형식으로 접속하세요."
            : "ADMIN_SECRET 환경변수가 설정되지 않아 관리자 기능이 꺼져 있습니다."}
        </p>
      </main>
    );
  }

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";

  const [readings, compats, packs] = await Promise.all([
    store.listPending(),
    compatStore.listPending(),
    amuletStore.listPending(),
  ]);

  const priceReading = Number(process.env.UNLOCK_PRICE_THB ?? 49);
  const priceCompat = Number(process.env.UNLOCK_COMPAT_PRICE_THB ?? 89);
  const pricePack = Number(process.env.AMULET_PACK_PRICE_THB ?? 79);

  const rows = [
    ...readings.map((r) => ({
      kind: "reading" as const,
      id: r.id,
      claim: r.claim,
      amount: priceReading,
      created: r.createdAt,
    })),
    ...compats.map((r) => ({
      kind: "compat" as const,
      id: r.id,
      claim: r.claim,
      amount: priceCompat,
      created: r.createdAt,
    })),
    ...packs.map((p) => ({
      kind: "pack" as const,
      id: p.code,
      claim: { payerName: p.payerName, contact: p.contact, claimedAt: p.createdAt },
      amount: pricePack,
      created: p.createdAt,
    })),
  ].sort((a, b) => (b.claim?.claimedAt ?? "").localeCompare(a.claim?.claimedAt ?? ""));

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-bold text-rosewood">💰 입금 확인 대기</h1>
      <p className="mt-1 text-sm text-ink/60">
        은행 앱에서 <b>입금자명 + 금액</b>이 일치하는 입금을 확인한 뒤 [승인]을 누르세요.
        승인 즉시 손님 페이지가 해제됩니다.
      </p>
      {searchParams.ok && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          ✅ 승인 완료 — 해당 결과가 해제되었습니다.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-6 text-center text-sm text-ink/50 ring-1 ring-peach/40">
          대기 중인 입금 신고가 없습니다.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-peach/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-semibold " +
                      (r.kind === "compat"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-amber-100 text-amber-700")
                    }
                  >
                    {r.kind === "compat" ? "💞 궁합" : r.kind === "pack" ? "🧿 부적3팩" : "🔮 사주"} · {r.amount}฿
                  </span>
                  <div className="mt-1 text-sm font-semibold text-ink">
                    입금자명: {r.claim?.payerName || "(미입력)"}
                  </div>
                  <div className="text-xs text-ink/60">연락처: {r.claim?.contact || "-"}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-ink/40">
                    {r.kind === "pack" ? "코드" : "ref"} {r.id.slice(0, 8).toUpperCase()} · 신고{" "}
                    {fmt(r.claim?.claimedAt)}
                  </div>
                  {r.kind !== "pack" && (
                    <a
                      href={`${r.kind === "compat" ? "/compat/result/" : "/result/"}${r.id}`}
                      target="_blank"
                      className="mt-1 block break-all font-mono text-[10px] text-sky-600 underline"
                    >
                      🔗 {base}
                      {r.kind === "compat" ? "/compat/result/" : "/result/"}
                      {r.id}
                    </a>
                  )}
                </div>
                <a
                  href={`/api/admin/confirm?kind=${r.kind}&id=${r.id}&key=${encodeURIComponent(
                    key
                  )}&redirect=1`}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white"
                >
                  ✅ 승인
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ink/40">
        새 신고는 새로고침하면 나타납니다 · 각 카드의 🔗 링크가 손님 결과 페이지예요 —
        손님이 창을 닫았더라도 승인 후 이 링크를 DM·이메일·LINE으로 보내주면 됩니다
      </p>
    </main>
  );
}
