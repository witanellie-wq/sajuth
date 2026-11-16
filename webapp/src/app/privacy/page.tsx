import Link from "next/link";

export const metadata = { title: "นโยบายความเป็นส่วนตัว | ดวงซาจู" };

// 개인정보처리방침 — 애드센스 승인 요건(쿠키·제3자 광고 고지) 포함. 태국어 + 영어.
export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6 text-center">
        <Link href="/" className="text-3xl font-bold text-rose-500">ดวงซาจู</Link>
      </header>
      <article className="space-y-4 rounded-3xl bg-white p-6 text-sm leading-relaxed text-ink/80 shadow">
        <h1 className="text-xl font-bold text-ink">นโยบายความเป็นส่วนตัว</h1>
        <p>ดวงซาจู (ดูดวงสไตล์เกาหลี) ให้บริการโดย Witan Thailand เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ</p>
        <h2 className="font-semibold text-ink">ข้อมูลที่เราเก็บ</h2>
        <p>วัน เดือน ปี เวลาเกิด เพศ ชื่อเล่น และประเทศที่เกิด ที่คุณกรอกเพื่อคำนวณดวง รวมถึงหลักฐานการโอนเงินเมื่อซื้อรายงานแบบเต็ม ข้อมูลเหล่านี้ใช้เพื่อแสดงผลดวงของคุณเท่านั้น และไม่ขายให้บุคคลอื่น</p>
        <p>เมื่อเข้าสู่ระบบด้วย LINE หรือ Google เราเก็บเพียงรหัสผู้ใช้ ชื่อที่แสดง รูปโปรไฟล์ และอีเมล (ถ้ามี) เพื่อเก็บผลดวงที่คุณซื้อไว้ในบัญชี รวมถึงคำถามและคำตอบในแชทถามดวง</p>
        <h2 className="font-semibold text-ink">คุกกี้และโฆษณา</h2>
        <p>เว็บไซต์นี้แสดงโฆษณาจาก Google AdSense ผู้ให้บริการภายนอก รวมถึง Google ใช้คุกกี้เพื่อแสดงโฆษณาตามการเข้าชมเว็บไซต์นี้และเว็บไซต์อื่นของคุณ คุณสามารถปิดโฆษณาแบบปรับตามความสนใจได้ที่ <a className="text-rose-500 underline" href="https://adssettings.google.com" target="_blank" rel="noreferrer">Google Ads Settings</a> หรือ <a className="text-rose-500 underline" href="https://www.aboutads.info" target="_blank" rel="noreferrer">aboutads.info</a></p>
        <h2 className="font-semibold text-ink">การลบข้อมูลและติดต่อเรา</h2>
        <p>หากต้องการให้ลบข้อมูลหรือมีคำถาม ติดต่อได้ทาง Instagram @duangsaju</p>
        <hr />
        <h2 className="font-semibold text-ink">Privacy Policy (English)</h2>
        <p>Duang Saju is operated by Witan Thailand. We collect the birth date, time, gender, nickname and birth country you enter to calculate your reading, and payment slips for full reports. We use them only to show your reading and never sell them.</p>
        <p>This site shows ads from Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your visits to this and other websites. You can opt out of personalized advertising at Google Ads Settings or aboutads.info.</p>
        <p>To request deletion or ask a question, contact us on Instagram @duangsaju.</p>
        <p className="text-xs text-ink/40">อัปเดตล่าสุด 15 พ.ย. 2026</p>
      </article>
    </main>
  );
}
