"""Prompt templates for theme-driven multi-source synthesis.

Kept stable to maximise prompt cache hits on the system prompt.
"""
from __future__ import annotations

SYSTEM_PROMPT = """\
คุณเป็นนักเขียนคอนเทนต์ดูดวงสไตล์เกาหลี (ซาจู) สำหรับกลุ่มเป้าหมายหญิงไทยอายุ 20-35 ปี
ทำงานให้กับแบรนด์ชื่อ "ดวงซาจู (Duang Saju / @duangsaju)"

หลักการเขียน:
- โทนอบอุ่น เข้าใจง่าย เหมือนเพื่อนสนิทคุยด้วย
- ใช้ภาษาไทยธรรมชาติ ไม่แปลตรงตัวจากภาษาเกาหลี/อังกฤษ
- หลีกเลี่ยงศัพท์เทคนิคหนัก อธิบายแบบใช้ชีวิตจริง
- ใส่อิโมจิพอเหมาะ (ไม่เกิน 3 ตัวต่อสไลด์)
- ไม่ให้คำแนะนำทางการแพทย์ กฎหมาย หรือการลงทุนที่เฉพาะเจาะจง
- ห้ามคัดลอกข้อความใดๆ จากแหล่งอ้างอิง ต้องสังเคราะห์ใหม่ทั้งหมด
- ต้องเขียนเป็น "คอนเทนต์ต้นฉบับใหม่" ที่ได้แรงบันดาลใจจากแหล่งอ้างอิง ไม่ใช่การแปล

สไตล์:
- คำแรกต้องดึงดูด (hook) ภายใน 2 วินาที
- ใช้ประโยคสั้น กระชับ เหมาะกับการอ่านบนมือถือ
- สไลด์สุดท้ายต้องมี CTA ให้ทัก DM หรือ LINE (@duangsaju) เพื่ออ่านดวงส่วนตัวละเอียด

รูปแบบเอาต์พุตเป็น JSON เท่านั้น ไม่มีข้อความอื่น
"""

SYNTHESIS_USER_TEMPLATE = """\
ธีมวันนี้: {theme_title}
หมวด: {theme_category}
มุมมองที่ต้องการ: {theme_hook}

แหล่งอ้างอิง (inspiration only — ห้ามคัดลอก):
{source_block}

สร้างคอนเทนต์สไลด์ Instagram ภาษาไทย สังเคราะห์จากแหล่งอ้างอิงข้างต้น
โดยเขียนขึ้นใหม่ทั้งหมด ให้เหมาะกับกลุ่มเป้าหมายหญิงไทยอายุ 20-35 ปี

ส่งกลับเป็น JSON เท่านั้น ตามโครงสร้างนี้:
{{
  "hook_title": "หัวข้อดึงดูดสำหรับสไลด์แรก (ไม่เกิน 30 ตัวอักษร)",
  "slides": [
    {{"heading": "หัวข้อสั้น", "body": "เนื้อหา 2-3 ประโยค"}}
  ],
  "caption": "แคปชั่นโพสต์ 150-300 ตัวอักษร ลงท้ายด้วยคำชวนให้ทัก DM/LINE",
  "hashtags": ["#ดูดวง", "#ซาจู", "..."],
  "cta": "ข้อความเชิญชวนให้ทัก DM/LINE @duangsaju"
}}

เกณฑ์:
- slides: 5-7 รายการ (ไม่รวม hook เพราะ hook คือสไลด์แรกอยู่แล้ว)
- hashtags: 15 tag รวมถึง #ดูดวง #ซาจู #ดวงเกาหลี #duangsaju
- ต้องเขียนใหม่ 100% ห้ามตรงกับต้นฉบับ
"""


def build_source_block(snippets: list[dict]) -> str:
    """Render collected source snippets into the prompt-friendly block.

    Each snippet is a dict: {account, platform, url, caption, likes}
    """
    lines: list[str] = []
    for i, s in enumerate(snippets, 1):
        cap = (s.get("caption") or "").strip()
        if len(cap) > 600:
            cap = cap[:600] + "…"
        lines.append(
            f"[{i}] @{s.get('account')} ({s.get('platform')}, ❤{s.get('likes', 0)})\n"
            f"    URL: {s.get('url', '')}\n"
            f"    {cap}"
        )
    return "\n\n".join(lines) if lines else "(ไม่มีแหล่งอ้างอิง — ใช้ความรู้ทั่วไปเกี่ยวกับซาจู)"
