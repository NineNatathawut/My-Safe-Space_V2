import { Hono } from 'hono'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

const auth = new Hono()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const NOUNS = [
  "แมวน้อย", "หมาป่า", "นกฮูก", "เพนกวิน", "แพนด้า", "กระต่าย", "จิ้งจอก", "หมีตัวใหญ่", "โลมา", "วาฬน้อย",
  "สายลม", "ก้อนเมฆ", "ดวงดาว", "พระจันทร์", "ดวงอาทิตย์", "ท้องทะเล", "ภูเขา", "ต้นไม้", "ดอกไม้", "ใบไม้",
  "ชานม", "กาแฟ", "ขนมปัง", "เค้กส้ม", "คุกกี้", "ช็อกโกแลต", "ไอศกรีม", "พุดดิ้ง", "สายไหม", "พีชสด",
  "สตรอเบอร์รี่", "ผลไม้", "แอปเปิ้ล", "เมล่อน", "ถ้วยชา", "ร่มคันเล็ก", "ดาวตก", "ละอองดาว", "สะพานโค้ง", "รอยยิ้ม",
  "ไออุ่น", "บทเพลง", "ทะเลดาว", "เมฆนุ่ม", "คลื่นทะเล", "ใบชา", "สายฝน", "แสงแดด", "ปุยเมฆ", "ดาวดวงใหม่"
]

const ADJECTIVES = [
  "แสนดี", "อบอุ่น", "น่ารัก", "ใจฟู", "สดใส", "นุ่มฟู", "เงียบสงบ", "พลิ้วไหว", "ละมุน", "ขี้อ้อน",
  "อารมณ์ดี", "ยิ้มแย้ม", "ร่าเริง", "อ่อนโยน", "ฝันหวาน", "ขี้เล่น", "ซุกซน", "เบาหวิว", "ง่วงนอน", "ส่องแสง",
  "ระยิบระยับ", "หวานเจี๊ยบ", "ชุ่มฉ่ำ", "เย็นฉ่ำ", "พาสเทล", "มุ้งมิ้ง", "กรุบกรอบ", "หอมหวาน", "สดชื่น", "สบายใจ",
  "เบิกบาน", "กล้าหาญ", "โชคดี", "งดงาม", "สว่างไสว", "ตัวเล็ก", "น่าเอ็นดู", "ละมุนใจ", "แสนซ่า", "สุดสตรอง",
  "ใจดี", "สุดเท่", "สุขใจ", "ผู้กล้า", "นุ่มนวล", "สดใสจัง", "สุดปัง", "มีพลัง", "น่าเอ็นดูจริง", "อบอุ่นจัง"
]

function generateUniqueNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${noun}${adj}#${suffix}`
}

// 🟢 POST /api/auth/register
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    if (!email || !password) {
      return c.json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' }, 400)
    }

    // 1. สุ่มนามแฝง (adj+noun+#XXXX = 640,000 combos)
    let nickname = ''
    const prompt = 'สร้างนามแฝงภาษาไทยสั้นๆ 1 ชื่อ ที่ให้อารมณ์อบอุ่น ปลอดภัย ฮีลใจ (ตอบเฉพาะชื่อ ไม่ต้องใส่เครื่องหมายอัญประกาศหรือคำอธิบายเพิ่มเติม)'

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: prompt,
      })
      nickname = response.text?.trim() || generateUniqueNickname()
    } catch (err) {
      console.warn('⚠️ AI Quota Exceeded. Using Local Fallback Nickname.')
      nickname = generateUniqueNickname()
    }

    // 2. บันทึกลง Supabase Auth (พร้อมแนบ นามแฝง เข้าไปใน User Metadata)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname
        }
      }
    })

    if (error) {
      return c.json({ success: false, error: error.message }, 400)
    }

    return c.json({
      success: true,
      message: '🎉 สมัครสมาชิกสำเร็จ!',
      user: data.user,
      assignedNickname: nickname
    }, 200)

  } catch (err) {
    return c.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง กรุณาส่งเป็น JSON' }, 400)
  }
})

// 🟢 POST /api/auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return c.json({ success: false, error: error.message }, 401)

  return c.json({
    success: true,
    message: '🔓 ล็อกอินสำเร็จ!',
    access_token: data.session?.access_token
  })
})

export default auth


// 🧪 API สำหรับทดสอบระบบสุ่มชื่อ (GET /api/auth/test-nickname)
auth.get('/test-nickname', async (c) => {
  const nickname = generateUniqueNickname()
  return c.json({
    success: true,
    source: 'Adj+Noun+#XXXX',
    nickname: nickname
  })
})