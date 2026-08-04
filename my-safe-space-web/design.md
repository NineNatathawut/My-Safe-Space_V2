🎨 Design System & UI Guidelines (UP Theme Edition)

ไฟล์นี้ใช้เป็นพิมพ์เขียว (Blueprint) ในการปรับแต่งสไตล์และ UI ของแอปพลิเคชัน โดยได้รับแรงบันดาลใจจากสไตล์ Modern Tech ของคณะ ICT และสีประจำมหาวิทยาลัยพะเยา (โทนม่วง-ชมพู)
สำคัญ: ยังคง Logic, State และ Data Flow ของระบบเดิมไว้ 100%

1. Design Concept & Philosophy

Concept: Modern Academic & Tech-Savvy (ทันสมัย น่าเชื่อถือ ใช้งานง่าย)

Target Tone: โทนสีม่วงประจำมหาวิทยาลัย (ฟ้ามุ่ย) ผสานกับความคลีนของ UI สมัยใหม่ ให้ความรู้สึกเป็นมืออาชีพ แต่ไม่น่าเบื่อ

Visual Style: Rounded corners (ขอบมน), Soft & Smooth shadows (เงาฟุ้งแบบนุ่มนวล), Gradients (ไล่สีสไตล์ Tech)

2. Color Palette (Tailwind CSS Mapping)

Primary Brand (ม่วงมหาวิทยาลัยพะเยา & ICT Tech)

เราจะใช้กลุ่มสี purple และ fuchsia ของ Tailwind เพื่อสะท้อนความเป็น ม.พะเยา และคณะ ICT

purple-50: #faf5ff — Background สำหรับ Highlight อ่อนๆ หรือ Hover state

purple-100: #f3e8ff — พื้นหลัง Badge หรือส่วนเน้นข้อความ

purple-600: #9333ea — สีหลักของไอคอน / ส่วนตกแต่ง

purple-700: #7e22ce — สีแบรนด์หลัก (Primary Brand) สำหรับปุ่มหลัก, Header

purple-800: #6b21a8 — สำหรับ Hover ปุ่มหลัก (Active/Hover State)

fuchsia-600: #c026d3 — สีรองที่ใช้คู่กับสีม่วงในการทำ Gradient สไตล์ Tech

Neutral (พื้นหลังและข้อความ - เน้นความคลีนแบบ Modern)

slate-50: #f8fafc — พื้นหลังหลักของหน้าเว็บ (App Background) ทำให้การ์ดสีขาวดูลอยเด่นขึ้นมา

slate-200: #e2e8f0 — เส้นขอบ (Borders & Dividers)

slate-500: #64748b — ข้อความรอง / Muted text / Subtitle

slate-800: #1e293b — Body text & Headings (ข้อความหลัก)

3. Typography & Hierarchy

Heading 1 (Page Title): text-2xl font-bold text-slate-800 tracking-tight

Heading 2 (Section Title): text-lg font-semibold text-purple-700 (ใช้สีม่วงเน้นหัวข้อย่อย)

Body / Input Text: text-sm text-slate-700

Caption / Hint: text-xs text-slate-500 font-medium

4. UI Components Specification

A. Cards (การ์ดพื้นฐาน)

ใช้การ์ดสีขาวล้วนขอบมน ตัดกับพื้นหลัง slate-50 พร้อมเงาอ่อนๆ

className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"


B. Buttons (ปุ่มคำสั่ง)

Primary Button (ปุ่มหลัก - ไล่สีม่วงเท่ๆ สไตล์ Tech):

className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-medium text-sm rounded-xl shadow-md shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"


Secondary / Outline Button (ปุ่มรอง):

className="px-4 py-2 border-2 border-purple-100 bg-white text-purple-700 hover:bg-purple-50 font-medium text-sm rounded-xl transition-all"


Danger Button (ปุ่มลบ/ยกเลิก):

className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm rounded-xl transition-all"


C. Inputs & Form Controls

กล่องข้อความขอบมน เวลา Focus จะมีขอบเรืองแสงสีม่วง

className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:bg-white transition-all"


D. Stepper (Progress Bar)

Active Step: bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white ring-4 ring-purple-100 shadow-md

Completed Step: bg-purple-800 text-white (ม่วงเข้มขึ้นเมื่อทำเสร็จ)

Inactive Step: bg-slate-100 text-slate-400 border border-slate-200

5. Layout & Spacing Rules

Page Container: max-w-4xl mx-auto px-4 py-8 (เน้นเนื้อหาให้อ่านง่าย)

Spacing: ใช้ space-y-6 สำหรับระยะห่าง Section ใหญ่ และ space-y-4 สำหรับ Form

Icons: ใช้สี text-purple-600 เป็นหลักสำหรับไอคอนตกแต่ง

6. Implementation Checklist for Refactoring

[ ] ห้ามเปลี่ยนชื่อ State, Function Handlers หรือ Props ของ Component เด็ดขาด

[ ] อัปเดต className โดยอ้างอิงจากดีไซน์นี้

[ ] เปลี่ยนโทนสีน้ำเงิน/เขียว เดิม ให้เป็นโทน purple/fuchsia ตามสไตล์ ม.พะเยา

[ ] เพิ่ม Micro-interactions (เช่น การไล่สีปุ่ม, เงาฟุ้งตอน Hover)