import 'dotenv/config';

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { createClient } from '@supabase/supabase-js'

import authRouter from './routes/auth.js'

type Variables = {
  user: any
}

const PROFESSION_LABELS: Record<string, string> = {
  psychiatrist: 'จิตแพทย์',
  clinical_psychologist: 'นักจิตวิทยาคลินิก',
  counseling_psychologist: 'นักจิตวิทยาการปรึกษา',
  social_worker: 'นักสังคมสงเคราะห์จิตเวช',
}

const SPECIALTY_LABELS: Record<string, string> = {
  stress: '🧠 จัดการความเครียด / ภาวะซึมเศร้า',
  relationship: '💔 เยียวยาความสัมพันธ์',
  burnout: '🔥 ภาวะหมดไฟในการทำงาน',
  family: '🏠 ปัญหาครอบครัวและคนใกล้ชิด',
  self_esteem: '✨ การเห็นคุณค่าในตัวเอง (Self-Esteem)',
  anxiety: '🌀 ความวิตกกังวล / อาการแพนิค',
  grief: '🕊️ การสูญเสียและความเศร้าโศก',
  lgbtq: '🌈 ความหลากหลายทางเพศ (LGBTQ+)',
}

// 1. เพิ่มการสร้าง supabaseAdmin ด้านบนของไฟล์
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const app = new Hono<{ Variables: Variables }>()

// ==========================================
// 🛡️ Middleware: CORS (อนุญาตให้ Frontend เข้าถึง Backend ได้)
// ==========================================
app.use('*', cors({
  origin: 'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'PATCH', 'DELETE'],
}))

// ==========================================
// 🚨 Global Error Handler (ดัก Error ที่หนีจาก routes ทั้งหมด)
// ==========================================
app.onError((err, c) => {
  console.error('❌ Unhandled Error:', err)
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error'
  }, 500)
})

// ==========================================
// 🔍 404 Handler
// ==========================================
app.notFound((c) => {
  console.warn(`⚠️ 404 — ${c.req.method} ${c.req.url}`)
  return c.json({ success: false, error: 'Not Found' }, 404)
})

export const supabaseUrl = process.env.SUPABASE_URL!
export const supabaseKey = process.env.SUPABASE_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

// 🟢 1. เชื่อมต่อระบบ Auth (สมัครสมาชิก / ล็อกอิน / สุ่มชื่อ AI)
app.route('/api/auth', authRouter)

// ==========================================
// 🛡️ 2. Middleware: ยืนยันตัวตน (Strict Auth & Optional Auth)
// ==========================================

// 🔒 แบบเข้มงวด: ต้องมี Token เท่านั้น (สำหรับ สร้าง/แก้ไข/ลบ โพสต์ของตัวเอง)
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: จำเป็นต้องมี Token เพื่อเข้าสู่ระบบ' }, 401)
  }

  const token = authHeader.split(' ')[1]
  if (!token || token === 'null' || token === 'undefined') {
    return c.json({ error: 'Unauthorized: Token ไม่ถูกต้อง' }, 401)
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return c.json({ error: 'Unauthorized: Token ไม่ถูกต้องหรือหมดอายุ' }, 401)
  }

  c.set('user', data.user)
  await next()
}

// 🔓 แบบยืดหยุ่น: มี Token ก็ได้ ไม่มีก็ได้ (สำหรับ คอมเมนต์ / ส่งกอด แบบไม่ต้องล็อกอิน)
const optionalAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    if (token && token !== 'null' && token !== 'undefined') {
      const { data } = await supabase.auth.getUser(token)
      if (data?.user) {
        c.set('user', data.user)
      }
    }
  }
  await next()
}

// ==========================================
// 🧑‍💻 3. API: ตรวจสอบ Token และดึงข้อมูลผู้ใช้
// ==========================================

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

function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `${noun}${adj}#${suffix}`
}

// 🟢 API: ดึงข้อมูลผู้ใช้ปัจจุบัน (GET /api/auth/me)
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')

  const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'
  const userRole = user.user_metadata?.role || 'user'

  // Admin ไม่ต้องมี alias_name — เคลียร์ metadata จริง (service_role มีสิทธิ์สูงสุด)
  if (isAdmin) {
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { role: 'admin', nickname: null }
    }).catch((err) => {
      console.error('Failed to clear admin nickname:', err)
    })

    return c.json({
      success: true,
      user: { id: user.id, email: user.email, nickname: undefined, role: 'admin' }
    })
  }

  let nickname = user.user_metadata?.nickname

  // ถ้าไม่มีชื่อ หรือชื่อไม่มี #XXXX → generate + save
  if (!nickname || !/#\d{4}$/.test(nickname)) {
    nickname = generateNickname()
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, nickname }
    }).catch((err) => {
      console.error('Failed to update nickname:', err)
    })
  }

  return c.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: nickname,
      role: userRole,
    }
  })
})

// ==========================================
// 📝 4. API: บันทึกข้อความระบายความรู้สึก (Posts)
// ==========================================

// 🟢 API: สร้างโพสต์ (POST /api/posts)
app.post('/api/posts', authMiddleware, async (c) => {
  const user = c.get('user') 
  const body = await c.req.json() 

  console.log("👉 [DEBUG] ค่า user_id ที่กำลังจะส่งไปให้ฐานข้อมูลคือ:", user.id);

  if (!body.content || body.content.trim() === '') {
    return c.json({ error: 'กรุณากรอกข้อความระบายความในใจ' }, 400)
  }
  if (body.content.length > 1000) {
    return c.json({ error: 'ข้อความต้องมีความยาวไม่เกิน 1,000 ตัวอักษร' }, 400)
  }
  if (!body.emotion) {
    return c.json({ error: 'กรุณาเลือกไอคอนอารมณ์ในวันนี้' }, 400)
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,          
      alias_name: body.alias_name || 'ผู้ใช้ไร้นาม', 
      emotion: body.emotion,      
      content: body.content,
      poster_role: user.user_metadata?.role || 'user',
    })
    .select()

  if (error) {
    return c.json({ error: `Database Error: ${error.message}` }, 500)
  }

  return c.json({
    success: true,
    message: 'ส่งความในใจเข้าสู่พื้นที่ปลอดภัยเรียบร้อยแล้ว',
    post: data[0]
  }, 201)
})

// 🟢 API: ดึงข้อความระบายความรู้สึกทั้งหมด (GET /api/posts)
app.get('/api/posts', async (c) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      emotion,
      alias_name,
      poster_role,
      created_at,
      hugs (count),
      comments (count)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return c.json({ error: `Database Error: ${error.message}` }, 500)
  }

  const formattedPosts = data.map((post: any) => ({
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    emotion: post.emotion,
    alias_name: post.alias_name,
    poster_role: post.poster_role,
    created_at: post.created_at,
    hug_count: post.hugs?.[0]?.count || 0,
    comment_count: post.comments?.[0]?.count || 0
  }))

  return c.json({
    success: true,
    posts: formattedPosts
  }, 200)
})

// 🟢 API: ดึงประวัติการโพสต์ของตัวเอง (GET /api/posts/me)
app.get('/api/posts/me', authMiddleware, async (c) => {
  const user = c.get('user') 

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      emotion,
      alias_name,
      poster_role,
      created_at,
      hugs (count),
      comments (count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ error: `Database Error: ${error.message}` }, 500)
  }

  const formattedPosts = data.map((post: any) => ({
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    emotion: post.emotion,
    alias_name: post.alias_name,
    poster_role: post.poster_role,
    created_at: post.created_at,
    hug_count: post.hugs?.[0]?.count || 0,
    comment_count: post.comments?.[0]?.count || 0
  }))

  return c.json({
    success: true,
    message: `ดึงข้อมูลโพสต์ของคุณสำเร็จ (จำนวน ${formattedPosts.length} โพสต์)`,
    posts: formattedPosts
  }, 200)
})

// 🟢 API: ดึงรายละเอียดโพสต์ + คอมเมนต์ตาม ID (GET /api/posts/:id)
app.get('/api/posts/:id', async (c) => {
  const id = c.req.param('id')

  try {
    // 1. ดึงข้อมูลโพสต์จาก Supabase
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        hugs (count),
        comments (count)
      `)
      .eq('id', id)
      .single()

    if (postError || !post) {
      return c.json({ success: false, message: 'ไม่พบโพสต์นี้ในระบบ' }, 404)
    }

    // 2. ดึงคอมเมนต์ทั้งหมดของโพสต์นี้
    const { data: comments, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true })

    const formattedPost = {
      ...post,
      hug_count: post.hugs?.[0]?.count || 0,
      comment_count: post.comments?.[0]?.count || 0
    }

    return c.json({
      success: true,
      post: formattedPost,
      comments: comments || []
    })
  } catch (err) {
    console.error('Error fetching post detail:', err)
    return c.json({ success: false, message: 'Server error' }, 500)
  }
})

// 🔴 API: ลบโพสต์ (DELETE /api/posts/:id)
app.delete('/api/posts/:id', authMiddleware, async (c) => {
  const user = c.get('user') 
  const postId = c.req.param('id')

  try {
    // 🌟 1. เช็คสิทธิ์ว่าเป็น Admin หรือไม่ (เช็คจากอีเมลหรือ metadata)
    const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'

    // 🌟 2. ถ้า *ไม่ใช่* Admin ให้เช็คว่าเป็นเจ้าของโพสต์จริงๆ ไหม
    if (!isAdmin) {
      const { data: ownerCheck } = await supabase
        .from('posts')
        .select('id')
        .eq('id', postId)
        .eq('user_id', user.id)
        .single()

      if (!ownerCheck) {
        return c.json({ 
          error: 'ไม่พบโพสต์ หรือคุณไม่มีสิทธิ์ลบโพสต์นี้' 
        }, 403)
      }
    }

    // 🌟 3. ลบข้อมูลที่ผูกอยู่กับโพสต์นี้ก่อน (ลบ hugs และ comments) เพื่อป้องกัน Database Error (500)
    await supabase.from('hugs').delete().eq('post_id', postId)
    await supabase.from('comments').delete().eq('post_id', postId)

    // 🌟 4. สั่งลบโพสต์หลักออกจากฐานข้อมูล
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .select()

    if (error) {
      console.error('Supabase Delete Error:', error)
      return c.json({ error: `Database Error: ${error.message}` }, 500)
    }
    
    return c.json({
      success: true,
      message: '🗑️ ลบข้อความออกจากพื้นที่ปลอดภัยเรียบร้อยแล้ว'
    }, 200)

  } catch (err) {
    console.error('Error deleting post:', err)
    return c.json({ error: 'Server error' }, 500)
  }
})

// 🟡 API: แก้ไขข้อความระบายความรู้สึก (PUT /api/posts/:id)
app.put('/api/posts/:id', authMiddleware, async (c) => {
  const user = c.get('user') 
  const postId = c.req.param('id')

  try {
    const body = await c.req.json()
    const { content } = body

    if (!content || content.trim() === '') {
      return c.json({ error: 'กรุณาส่งข้อความใหม่ที่ต้องการแก้ไขมาด้วย' }, 400)
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ content: content })
      .eq('id', postId)
      .eq('user_id', user.id)
      .select()

    if (error) {
      return c.json({ error: `Database Error: ${error.message}` }, 500)
    }

    if (data.length === 0) {
      return c.json({ 
        error: 'ไม่พบโพสต์ที่ต้องการแก้ไข หรือคุณไม่มีสิทธิ์แก้ไขโพสต์นี้' 
      }, 403)
    }

    return c.json({
      success: true,
      message: '✍️ แก้ไขความรู้สึกเรียบร้อยแล้ว',
      post: data[0]
    }, 200)

  } catch (err) {
    return c.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง กรุณาส่งเป็น JSON' }, 400)
  }
})

// ==========================================
// 🫂 4. API: ระบบส่งกอด (ให้กำลังใจ) [อัปเดตใช้ optionalAuthMiddleware]
// ==========================================
app.post('/api/posts/:id/hug', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')

  const userId = user?.id || null

  if (userId) {
    // 1. เช็กว่า User คนนี้เคยส่งกอดให้โพสต์นี้หรือยัง
    const { data: existingHug } = await supabase
      .from('hugs')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    if (existingHug) {
      await supabase.from('hugs').delete().eq('id', existingHug.id)
      return c.json({ success: true, message: 'ยกเลิกการส่งกอด', hugged: false }, 200)
    }

    const { error: hugError } = await supabase
      .from('hugs')
      .insert({ post_id: postId, user_id: userId })

    if (hugError) return c.json({ error: `Database Error: ${hugError.message}` }, 500)

    // 🔔 เช็ค milestone แจ้งเตือนเจ้าของโพสต์
    const HUG_MILESTONES = [1, 5, 10, 25, 50, 100]
    const { count: hugCount } = await supabase
      .from('hugs')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (hugCount && HUG_MILESTONES.includes(hugCount)) {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (post && post.user_id !== userId) {
        await supabaseAdmin.from('notifications').insert({
          user_id: post.user_id,
          type: 'hug',
          reference_type: 'post',
          reference_id: postId,
          content_preview: `มีคนส่งกำลังใจให้โพสต์ของคุณ ${hugCount} คนแล้วนะ 💖`,
        })
      }
    }

    return c.json({ success: true, message: 'ส่งกอดให้กำลังใจแล้ว 🫂', hugged: true }, 200)
  } else {
    // สำหรับผู้ใช้ไร้นาม
    const { error } = await supabase
      .from('hugs')
      .insert({ post_id: postId })

    if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)

    // Anonymous hugs: ยังเช็ค milestone แจ้งเตือนเจ้าของโพสต์ได้
    const HUG_MILESTONES = [1, 5, 10, 25, 50, 100]
    const { count: hugCount } = await supabase
      .from('hugs')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)

    if (hugCount && HUG_MILESTONES.includes(hugCount)) {
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single()

      if (post) {
        await supabaseAdmin.from('notifications').insert({
          user_id: post.user_id,
          type: 'hug',
          reference_type: 'post',
          reference_id: postId,
          content_preview: `มีคนส่งกำลังใจให้โพสต์ของคุณ ${hugCount} คนแล้วนะ 💖`,
        })
      }
    }

    return c.json({ success: true, message: 'ส่งกอดให้กำลังใจแล้ว 🫂', hugged: true }, 200)
  }
})

// ==========================================
// 💬 5. API: ระบบคอมเมนต์ (ตอบกลับ) [อัปเดตใช้ optionalAuthMiddleware]
// ==========================================
app.post('/api/posts/:id/comments', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')

  try {
    const body = await c.req.json()

    if (!body.content || body.content.trim() === '') {
      return c.json({ error: 'กรุณากรอกข้อความให้กำลังใจ' }, 400)
    }

    // 🌟 ถ้าผู้ใช้ล็อกอินและเป็นเจ้าของโพสต์ → ใช้ alias_name เดิมของโพสต์
    let alias = body.alias_name || 'ผู้พิทักษ์ใจฟู'
    const { data: postOwner } = await supabase
      .from('posts')
      .select('user_id, alias_name')
      .eq('id', postId)
      .single()
    if (postOwner && postOwner.user_id === user.id) {
      alias = postOwner.alias_name
    }

    const insertData: any = {
      post_id: postId,
      alias_name: alias,
      content: body.content.trim(),
      user_id: user.id,
      role: user.user_metadata?.role || 'user',
    }

    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Supabase comment error:', error)
      return c.json({ error: `Database Error: ${error.message}` }, 500)
    }

    // 🔔 แจ้งเตือนเจ้าของโพสต์
    if (postOwner && postOwner.user_id !== user.id) {
      const commenterRole = user.user_metadata?.role || 'user'
      await supabaseAdmin.from('notifications').insert({
        user_id: postOwner.user_id,
        type: commenterRole === 'expert' ? 'expert_comment' : 'comment',
        reference_type: 'post',
        reference_id: postId,
        from_user_id: user.id,
        alias_name: alias,
        content_preview: body.content.trim().substring(0, 100),
      })
    }
    
    return c.json({ 
      success: true, 
      message: 'ส่งข้อความให้กำลังใจสำเร็จ ✨', 
      comment: data[0] 
    }, 201)
  } catch (err) {
    console.error('Error posting comment:', err)
    return c.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง' }, 400)
  }
})

// 🟢 API: ดึงคอมเมนต์ทั้งหมดของโพสต์ (GET /api/posts/:id/comments)
app.get('/api/posts/:id/comments', async (c) => {
  const postId = c.req.param('id')

  const { data, error } = await supabase
    .from('comments')
    .select('id, content, alias_name, created_at, user_id, role')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)

  return c.json({ 
    success: true, 
    comments: data 
  }, 200)
})



// ==========================================
// 📊 6. API: จัดการแบบประเมิน (Assessment CRUD)
// ==========================================

// 🟢 GET /api/assessments/active — ดึงแบบประเมินที่เผยแพร่แล้วทั้งหมด (ไม่ต้อง Auth, ไว้ให้ User ทำ)
app.get('/api/assessments/active', async (c) => {
  const { data: assessmentData, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('status', 'PUBLISHED')
    .order('created_at', { ascending: false })

  if (assessmentError) {
    return c.json({ success: false, error: assessmentError.message }, 500)
  }

  const assessments: any[] = []
  for (const assessment of assessmentData || []) {
    const { data: questionsData } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessment.id)
      .order('order_index', { ascending: true })

    const questionsWithChoices: any[] = []
    for (const q of questionsData || []) {
      const { data: choicesData } = await supabase
        .from('question_choices')
        .select('*')
        .eq('question_id', q.id)
        .order('order_index', { ascending: true })

      questionsWithChoices.push({
        ...q,
        type: q.type || 'RADIO',
        choices: choicesData || [],
      })
    }

    const { data: rulesData } = await supabase
      .from('interpretation_rules')
      .select('*')
      .eq('assessment_id', assessment.id)
      .order('min_score', { ascending: true })

    assessments.push({
      ...assessment,
      questions: questionsWithChoices,
      interpretation_rules: rulesData || [],
    })
  }

  if (assessments.length === 0) {
    return c.json({ success: false, error: 'ไม่พบแบบประเมิน' }, 404)
  }

  return c.json({ success: true, assessments })
})

// 🟢 GET /api/assessments — ดึงแบบประเมินทั้งหมด (Admin)
app.get('/api/assessments', authMiddleware, async (c) => {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ success: false, error: error.message }, 500)
  }

  return c.json({ success: true, assessments: data || [] })
})

// 🟢 GET /api/assessments/:id — ดึงแบบประเมินตาม ID (พร้อม questions + choices + rules)
app.get('/api/assessments/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')

  const { data: assessment, error: aError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()

  if (aError || !assessment) {
    return c.json({ success: false, error: 'ไม่พบแบบประเมิน' }, 404)
  }

  const { data: questionsData } = await supabase
    .from('assessment_questions')
    .select('*')
    .eq('assessment_id', id)
    .order('order_index', { ascending: true })

  const questionsWithChoices: any[] = []
  for (const q of questionsData || []) {
    const { data: choicesData } = await supabase
      .from('question_choices')
      .select('*')
      .eq('question_id', q.id)
      .order('order_index', { ascending: true })

    questionsWithChoices.push({
      ...q,
      type: q.type || 'RADIO',
      choices: choicesData || [],
    })
  }

  const { data: rulesData } = await supabase
    .from('interpretation_rules')
    .select('*')
    .eq('assessment_id', id)
    .order('min_score', { ascending: true })

  return c.json({
    success: true,
    assessment: {
      ...assessment,
      questions: questionsWithChoices,
      interpretation_rules: rulesData || [],
    },
  })
})

// 🟢 POST /api/assessments — สร้างแบบประเมินใหม่ (พร้อม questions + choices + rules)
app.post('/api/assessments', authMiddleware, async (c) => {
  let body: any
  let assessmentId: string | undefined

  try {
    body = await c.req.json()
    // 1. สร้าง assessment หลัก
    const { data: newAssessment, error: aError } = await supabaseAdmin
      .from('assessments')
      .insert({
        title: body.title,
        description: body.description || null,
        category: body.category || 'General Mental Health',
        cover_image_url: body.cover_image_url || null,
        estimated_time_mins: body.estimated_time_mins ?? 5,
        version: body.version ?? 1,
        type: body.type,
        status: body.status,
        scoring_method: body.scoring_method || 'TOTAL_SCORE',
        external_url: body.external_url || null,
        open_in_new_tab: body.open_in_new_tab ?? true,
      })
      .select('id')
      .single()

    if (aError || !newAssessment) throw aError
    assessmentId = newAssessment.id

    // 2. สร้าง questions
    if (body.questions && body.questions.length > 0) {
      const questionsToInsert = body.questions.map((q: any) => ({
        assessment_id: assessmentId,
        question_text: q.question_text,
        type: q.type,
        order_index: q.order_index,
        is_required: q.is_required ?? true,
        help_text: q.help_text || null,
        placeholder: q.placeholder || null,
        media_url: q.media_url || null,
      }))

      const { data: insertedQuestions, error: qError } = await supabaseAdmin
        .from('assessment_questions')
        .insert(questionsToInsert)
        .select('id, order_index')

      if (qError || !insertedQuestions) throw qError

      // 3. สร้าง choices
      const choicesToInsert: any[] = []
      for (const question of body.questions) {
        if (question.choices && question.choices.length > 0) {
          const inserted = insertedQuestions.find(
            (iq: any) => iq.order_index === question.order_index
          )
          if (!inserted) continue
          for (const choice of question.choices) {
            choicesToInsert.push({
              question_id: inserted.id,
              choice_text: choice.choice_text,
              score: choice.score,
              weight: choice.weight ?? 1.0,
              order_index: choice.order_index,
            })
          }
        }
      }

      if (choicesToInsert.length > 0) {
        const { error: cError } = await supabaseAdmin
          .from('question_choices')
          .insert(choicesToInsert)
        if (cError) throw cError
      }
    }

    // 4. สร้าง interpretation rules
    if (body.interpretation_rules && body.interpretation_rules.length > 0) {
      const rulesToInsert = body.interpretation_rules.map((r: any) => ({
        assessment_id: assessmentId,
        min_score: r.min_score,
        max_score: r.max_score,
        title: r.title,
        description: r.description || null,
        recommendation: r.recommendation || null,
        color_code: r.color_code || 'indigo',
      }))

      const { error: rError } = await supabaseAdmin
        .from('interpretation_rules')
        .insert(rulesToInsert)
      if (rError) throw rError
    }

    return c.json({ success: true, id: assessmentId }, 201)
  } catch (err: any) {
    if (assessmentId) {
      await supabaseAdmin.from('assessments').delete().eq('id', assessmentId)
    }
    return c.json({ success: false, error: err.message || 'Unknown error' }, 500)
  }
})

// 🟡 PUT /api/assessments/:id — อัปเดตข้อมูลทั่วไปของแบบประเมิน
app.put('/api/assessments/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const { error } = await supabaseAdmin
      .from('assessments')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (err: any) {
    console.error('❌ PUT assessment error:', err)
    return c.json({ success: false, error: err.message || 'Unknown error' }, 500)
  }
})

// 🟡 PATCH /api/assessments/:id/status — เปลี่ยนสถานะ (DRAFT / PUBLISHED / ARCHIVED)
app.patch('/api/assessments/:id/status', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const { error } = await supabaseAdmin
      .from('assessments')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (err: any) {
    console.error('❌ PATCH status error:', err)
    return c.json({ success: false, error: err.message || 'Unknown error' }, 500)
  }
})

// 🟡 PATCH /api/assessments/:id/toggles — อัปเดต is_active_pre / is_active_post
app.patch('/api/assessments/:id/toggles', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()

    const { error } = await supabaseAdmin
      .from('assessments')
      .update({
        is_active_pre: body.is_active_pre,
        is_active_post: body.is_active_post,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (err: any) {
    console.error('❌ PATCH toggles error:', err)
    return c.json({ success: false, error: err.message || 'Unknown error' }, 500)
  }
})

// 🔴 DELETE /api/assessments/:id — ลบแบบประเมิน (CASCADE)
app.delete('/api/assessments/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')

    const { error } = await supabaseAdmin
      .from('assessments')
      .delete()
      .eq('id', id)

    if (error) throw error

    return c.json({ success: true })
  } catch (err: any) {
    console.error('❌ DELETE assessment error:', err)
    return c.json({ success: false, error: err.message || 'Unknown error' }, 500)
  }
})


// ==========================================
// 🔔 7. API: ระบบแจ้งเตือน (Notifications)
// ==========================================

// 🟢 GET /api/notifications — ดึงรายการแจ้งเตือนของผู้ใช้
app.get('/api/notifications', authMiddleware, async (c) => {
  const user = c.get('user')

  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Fetch notifications error:', error)
    return c.json({ success: false, error: 'ไม่สามารถดึงข้อมูลแจ้งเตือนได้' }, 500)
  }

  const { count: unreadCount } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return c.json({
    success: true,
    notifications: notifications || [],
    unread_count: unreadCount || 0,
  })
})

// 🟡 PATCH /api/notifications/:id/read — อ่านแจ้งเตือนรายการเดียว
app.patch('/api/notifications/:id/read', authMiddleware, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return c.json({ success: false, error: 'ไม่สามารถอัปเดตสถานะได้' }, 500)
  }

  return c.json({ success: true })
})

// 🟡 PATCH /api/notifications/read-all — อ่านแจ้งเตือนทั้งหมด
app.patch('/api/notifications/read-all', authMiddleware, async (c) => {
  const user = c.get('user')

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    return c.json({ success: false, error: 'ไม่สามารถอัปเดตสถานะได้' }, 500)
  }

  return c.json({ success: true })
})

// ==========================================
// 📬 8. API: ระบบกล่องข้อความ (Inbox) + การ์ดฮีลใจ
// ==========================================

// 🟢 GET /api/preset-cards — ดึงรายการการ์ดฮีลใจสำเร็จรูป
app.get('/api/preset-cards', async (c) => {
  const { data, error } = await supabaseAdmin
    .from('preset_cards')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    return c.json({ success: false, error: 'ไม่สามารถดึงข้อมูลการ์ดได้' }, 500)
  }

  return c.json({ success: true, cards: data || [] })
})

// 🟢 GET /api/inbox — ดึงข้อความในกล่องของผู้ใช้
app.get('/api/inbox', authMiddleware, async (c) => {
  const user = c.get('user')

  const { data, error } = await supabaseAdmin
    .from('inbox_messages')
    .select('*')
    .eq('to_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ success: false, error: 'ไม่สามารถดึงข้อความได้' }, 500)
  }

  return c.json({ success: true, messages: data || [] })
})

// 🟡 PATCH /api/inbox/:id/read — อ่านข้อความในกล่อง
app.patch('/api/inbox/:id/read', authMiddleware, async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  const { error } = await supabaseAdmin
    .from('inbox_messages')
    .update({ is_read: true })
    .eq('id', id)
    .eq('to_user_id', user.id)

  if (error) {
    return c.json({ success: false, error: 'ไม่สามารถอัปเดตสถานะได้' }, 500)
  }

  return c.json({ success: true })
})

// 🟢 POST /api/inbox — ส่งข้อความ / การ์ดฮีลใจ
app.post('/api/inbox', authMiddleware, async (c) => {
  const sender = c.get('user')
  const body = await c.req.json()
  const { to_user_id, card_id, content } = body

  if (!to_user_id) {
    return c.json({ success: false, error: 'กรุณาระบุผู้รับ' }, 400)
  }

  if (to_user_id === sender.id) {
    return c.json({ success: false, error: 'ไม่สามารถส่งข้อความถึงตัวเองได้' }, 400)
  }

  const senderRole = sender.user_metadata?.role || 'user'
  let messageContent = ''

  if (senderRole === 'expert' || senderRole === 'admin') {
    // ผู้เชี่ยวชาญและแอดมิน: พิมพ์ข้อความอิสระ
    if (!content || content.trim() === '') {
      return c.json({ success: false, error: 'กรุณาพิมพ์ข้อความ' }, 400)
    }
    messageContent = content.trim()
  } else {
    // ผู้ใช้ทั่วไป: ส่งได้เฉพาะการ์ดสำเร็จรูป
    if (!card_id) {
      return c.json({ success: false, error: 'กรุณาเลือกการ์ดฮีลใจ' }, 400)
    }
    const { data: card } = await supabaseAdmin
      .from('preset_cards')
      .select('icon, thai_text')
      .eq('id', card_id)
      .single()

    if (!card) {
      return c.json({ success: false, error: 'ไม่พบการ์ดที่เลือก' }, 400)
    }
    messageContent = `${card.icon} ${card.thai_text}`
  }

  const { data: message, error: insertError } = await supabaseAdmin
    .from('inbox_messages')
    .insert({
      from_user_id: sender.id,
      to_user_id,
      content: messageContent,
    })
    .select()
    .single()

  if (insertError) {
    return c.json({ success: false, error: 'ไม่สามารถส่งข้อความได้' }, 500)
  }

  return c.json({ success: true, message: 'ส่งข้อความสำเร็จ 💌', data: message }, 201)
})

// ==========================================
// 🩺 9. API: ระบบยืนยันตัวตนผู้เชี่ยวชาญ (Expert Verification)
// ==========================================

// 🟢 POST /api/verify — ส่งคำขอยืนยันตัวตน (พร้อมอัปโหลดไฟล์)
app.post('/api/verify', authMiddleware, async (c) => {
  const user = c.get('user')

  try {
    // เช็คว่ามีคำขอ pending อยู่แล้วหรือไม่
    const { data: existing } = await supabaseAdmin
      .from('expert_verifications')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existing) {
      return c.json({
        success: false,
        error: 'คุณมีคำขอยืนยันตัวตนที่รอการตรวจสอบอยู่แล้ว กรุณารอแอดมินตรวจสอบ'
      }, 400)
    }

    // เช็คว่าเคยถูกอนุมัติแล้วหรือไม่
    const { data: approved } = await supabaseAdmin
      .from('expert_verifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle()

    if (approved) {
      return c.json({
        success: false,
        error: 'บัญชีของคุณได้รับการยืนยันตัวตนเป็นผู้เชี่ยวชาญแล้ว'
      }, 400)
    }

    const body = await c.req.parseBody()
    const profession = body['profession'] as string
    const licenseNumber = body['licenseNumber'] as string
    const file = body['licenseFile'] as File | undefined

    let specialties: string[] = []
    try {
      specialties = body['specialties'] ? JSON.parse(body['specialties'] as string) : []
    } catch {
      specialties = []
    }
    const affiliation = (body['affiliation'] as string) || ''
    const availability = (body['availability'] as string) || ''

    if (!profession || !licenseNumber || !file) {
      return c.json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, 400)
    }

    if (file.size > 5 * 1024 * 1024) {
      return c.json({ success: false, error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' }, 400)
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG, PDF เท่านั้น' }, 400)
    }

    // อัปโหลดไฟล์ไปยัง Storage (private bucket)
    const ext = file.name.split('.').pop() || 'jpg'
    const uniqueId = Math.random().toString(36).substring(2, 15)
    const filePath = `${user.id}/${uniqueId}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('verification-files')
      .upload(filePath, file, { contentType: file.type })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return c.json({ success: false, error: 'ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองอีกครั้ง' }, 500)
    }

    // บันทึกคำขอลงฐานข้อมูล
    const { data: record, error: insertError } = await supabaseAdmin
      .from('expert_verifications')
      .insert({
        user_id: user.id,
        profession_type: profession,
        license_number: licenseNumber,
        document_url: filePath,
        status: 'pending',
        specialties,
        affiliation,
        availability,
      })
      .select()
      .single()

    if (insertError) {
      console.error('DB insert error:', insertError)
      return c.json({ success: false, error: 'ไม่สามารถบันทึกคำขอได้ กรุณาลองอีกครั้ง' }, 500)
    }

    return c.json({
      success: true,
      message: 'ส่งคำขอยืนยันตัวตนเรียบร้อยแล้ว แอดมินจะตรวจสอบภายใน 1-3 วันทำการ',
      data: record,
    }, 201)
  } catch (err) {
    console.error('Verify error:', err)
    return c.json({ success: false, error: 'เกิดข้อผิดพลาดในระบบ กรุณาลองอีกครั้ง' }, 500)
  }
})

// 🟢 GET /api/admin/verifications — ดึงรายการคำขอยืนยันตัวตนทั้งหมด (Admin)
app.get('/api/admin/verifications', authMiddleware, async (c) => {
  const user = c.get('user')
  const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'

  if (!isAdmin) {
    return c.json({ success: false, error: 'Forbidden: เฉพาะแอดมินเท่านั้น' }, 403)
  }

  const { data: records, error } = await supabaseAdmin
    .from('expert_verifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch verifications error:', error)
    return c.json({ success: false, error: 'ไม่สามารถดึงข้อมูลคำขอได้' }, 500)
  }

  // สร้าง signed URL สำหรับไฟล์เอกสาร (private bucket)
  const recordsWithUrls = await Promise.all((records || []).map(async (record: any) => {
    let signedUrl: string | null = null
    if (record.document_url) {
      const { data } = await supabaseAdmin.storage
        .from('verification-files')
        .createSignedUrl(record.document_url, 3600)
      signedUrl = data?.signedUrl || null
    }
    return { ...record, signed_document_url: signedUrl }
  }))

  return c.json({ success: true, verifications: recordsWithUrls })
})

// 🟡 PATCH /api/admin/verifications/:id — อนุมัติ / ปฏิเสธ / ถอนยศ (Admin)
app.patch('/api/admin/verifications/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'

  if (!isAdmin) {
    return c.json({ success: false, error: 'Forbidden: เฉพาะแอดมินเท่านั้น' }, 403)
  }

  const id = c.req.param('id')
  const body = await c.req.json()
  const { status, rejection_reason } = body

  if (!status || !['approved', 'rejected', 'revoked'].includes(status)) {
    return c.json({ success: false, error: 'สถานะต้องเป็น approved, rejected หรือ revoked เท่านั้น' }, 400)
  }

  if (status === 'rejected' && !rejection_reason) {
    return c.json({ success: false, error: 'กรุณาระบุเหตุผลในการปฏิเสธ' }, 400)
  }

  try {
    const { data: record, error: fetchError } = await supabaseAdmin
      .from('expert_verifications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !record) {
      return c.json({ success: false, error: 'ไม่พบคำขอยืนยันตัวตนนี้' }, 404)
    }

    const { error: updateError } = await supabaseAdmin
      .from('expert_verifications')
      .update({
        status,
        rejection_reason: rejection_reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    const targetUserId = record.user_id

    if (status === 'approved') {
      const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { role: 'expert' },
      })
      if (roleError) {
        console.error('Failed to update user role:', roleError)
      }
    }

    if (status === 'revoked') {
      const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        user_metadata: { role: 'user' },
      })
      if (roleError) {
        console.error('Failed to revoke user role:', roleError)
      }

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', targetUserId)
      if (profileError) {
        console.error('Failed to update profile role:', profileError)
      }
    }

    // 🔔 แจ้งเตือนผู้ใช้เกี่ยวกับสถานะคำขอ
    const notifMessages: Record<string, string> = {
      approved: '🎉 คำขออนุมัติผู้เชี่ยวชาญของคุณได้รับการอนุมัติแล้ว! ตอนนี้คุณสามารถใช้ตรา 🩺 ได้แล้ว',
      rejected: rejection_reason
        ? `❌ คำขอของคุณไม่ผ่านการอนุมัติ เหตุผล: ${rejection_reason}`
        : '❌ คำขอของคุณไม่ผ่านการอนุมัติ',
      revoked: '🔄 ยศผู้เชี่ยวชาญของคุณถูกถอนโดยแอดมิน',
    }
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      type: 'system',
      reference_type: 'verification',
      reference_id: id,
      content_preview: notifMessages[status] || '',
    })

    return c.json({
      success: true,
      message:
        status === 'approved' ? '✅ อนุมัติคำขอเรียบร้อยแล้ว ผู้ใช้ได้รับการยกระดับเป็นผู้เชี่ยวชาญ' :
        status === 'rejected' ? '❌ ปฏิเสธคำขอเรียบร้อยแล้ว' :
        '🔄 ถอนยศผู้เชี่ยวชาญเรียบร้อยแล้ว ผู้ใช้กลับสู่สถานะผู้ใช้ทั่วไป',
    })
  } catch (err) {
    console.error('Update verification error:', err)
    return c.json({ success: false, error: 'เกิดข้อผิดพลาดกรุณาลองอีกครั้ง' }, 500)
  }
})

// ==========================================
// 👤 10. API: ระบบโปรไฟล์สาธารณะ (Friend Profile)
// ==========================================

// 🟢 GET /api/user/:id — ดึงโปรไฟล์สาธารณะของผู้ใช้ (ไม่ต้อง Auth)
app.get('/api/user/:id', async (c) => {
  const targetId = c.req.param('id')

  try {
    // 1. ดึง user metadata
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(targetId)
    if (authError || !authUser) {
      return c.json({ success: false, error: 'ไม่พบผู้ใช้' }, 404)
    }

    const metadata = authUser.user.user_metadata || {}
    const nickname = metadata.nickname || 'ผู้ใช้งาน'
    const role = metadata.role || 'user'

    // 2. ดึง avatar
    const { data: avatar } = await supabaseAdmin
      .from('user_avatars')
      .select('avatar_type, avatar_value, is_approved')
      .eq('user_id', targetId)
      .maybeSingle()

    let avatarValue: string | null = null
    if (avatar) {
      if (avatar.avatar_type === 'expert_upload' && avatar.is_approved) {
        avatarValue = `${supabaseUrl}/storage/v1/object/public/${avatar.avatar_value}`
      } else if (avatar.avatar_type !== 'expert_upload') {
        avatarValue = avatar.avatar_value
      }
    }

    // 3. ดึง last post
    const { data: lastPost } = await supabase
      .from('posts')
      .select('content, emotion, created_at')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const formattedLastPost = lastPost ? {
      content: lastPost.content.length > 100
        ? lastPost.content.substring(0, 100) + '...'
        : lastPost.content,
      emotion: lastPost.emotion,
      created_at: lastPost.created_at,
    } : null

    // 4. ดึง expert info
    let expertInfo = null
    if (role === 'expert') {
      const { data: exp } = await supabaseAdmin
        .from('expert_verifications')
        .select('profession_type, specialties, affiliation, availability')
        .eq('user_id', targetId)
        .eq('status', 'approved')
        .maybeSingle()

      if (exp) {
        expertInfo = {
          profession_type: exp.profession_type,
          profession_label: PROFESSION_LABELS[exp.profession_type] || exp.profession_type,
          affiliation: exp.affiliation || null,
          specialties: exp.specialties || [],
          specialty_labels: (exp.specialties || []).map(
            (s: string) => SPECIALTY_LABELS[s] || s
          ),
          availability: exp.availability || null,
          is_verified: true,
        }
      }
    }

    return c.json({
      success: true,
      profile: {
        id: targetId,
        nickname,
        role,
        avatar: avatarValue,
        created_at: authUser.user.created_at,
        last_post: formattedLastPost,
        ...(expertInfo ? { expert_info: expertInfo } : {}),
      }
    })
  } catch (err) {
    console.error('Error fetching user profile:', err)
    return c.json({ success: false, error: 'เกิดข้อผิดพลาด' }, 500)
  }
})

// 🟢 GET /api/user/:id/posts — ดึงโพสต์ทั้งหมดของผู้ใช้ (ไม่ต้อง Auth)
app.get('/api/user/:id/posts', async (c) => {
  const targetId = c.req.param('id')

  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      emotion,
      alias_name,
      poster_role,
      created_at,
      hugs (count),
      comments (count)
    `)
    .eq('user_id', targetId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return c.json({ success: false, error: error.message }, 500)
  }

  return c.json({
    success: true,
    posts: (data || []).map((p: any) => ({
      id: p.id,
      content: p.content,
      emotion: p.emotion,
      alias_name: p.alias_name,
      poster_role: p.poster_role,
      created_at: p.created_at,
      hug_count: p.hugs?.[0]?.count || 0,
      comment_count: p.comments?.[0]?.count || 0,
    }))
  })
})

// 🟡 PUT /api/user/avatar — อัปเดต avatar preset (emoji)
app.put('/api/user/avatar', authMiddleware, async (c) => {
  const user = c.get('user')
  const { avatar_value } = await c.req.json()

  if (!avatar_value || typeof avatar_value !== 'string') {
    return c.json({ success: false, error: 'กรุณาระบุ avatar_value' }, 400)
  }

  const { error } = await supabaseAdmin
    .from('user_avatars')
    .upsert({
      user_id: user.id,
      avatar_type: 'emoji',
      avatar_value,
      is_approved: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Avatar upsert error:', error)
    return c.json({ success: false, error: 'ไม่สามารถอัปเดต Avatar ได้' }, 500)
  }

  return c.json({ success: true, avatar_value })
})

// 🟢 POST /api/user/avatar/upload — อัปโหลดรูป avatar (เฉพาะ expert)
app.post('/api/user/avatar/upload', authMiddleware, async (c) => {
  const user = c.get('user')
  const role = user.user_metadata?.role

  if (role !== 'expert') {
    return c.json({ success: false, error: 'เฉพาะผู้เชี่ยวชาญเท่านั้นที่อัปโหลดรูปโปรไฟล์ได้' }, 403)
  }

  const body = await c.req.parseBody()
  const file = body['file'] as File | undefined

  if (!file) {
    return c.json({ success: false, error: 'กรุณาเลือกรูปภาพ' }, 400)
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น' }, 400)
  }

  if (file.size > 5 * 1024 * 1024) {
    return c.json({ success: false, error: 'ไฟล์ต้องมีขนาดไม่เกิน 5MB' }, 400)
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = `expert-avatars/${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('expert-avatars')
    .upload(filePath, file, { contentType: file.type })

  if (uploadError) {
    console.error('Avatar upload error:', uploadError)
    return c.json({ success: false, error: 'อัปโหลดไม่สำเร็จ กรุณาลองอีกครั้ง' }, 500)
  }

  const { error: upsertError } = await supabaseAdmin
    .from('user_avatars')
    .upsert({
      user_id: user.id,
      avatar_type: 'expert_upload',
      avatar_value: filePath,
      is_approved: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (upsertError) {
    console.error('Avatar upsert error:', upsertError)
    return c.json({ success: false, error: 'บันทึก Avatar ไม่สำเร็จ' }, 500)
  }

  return c.json({ success: true, message: 'ส่งรูปโปรไฟล์ให้แอดมินตรวจสอบแล้ว' })
})

// ==========================================
// 🖼️ 11. API: Admin — ตรวจสอบรูป Avatar ผู้เชี่ยวชาญ
// ==========================================

// 🟢 GET /api/admin/avatars/pending — ดึงรายการ avatar ที่รออนุมัติ (Admin)
app.get('/api/admin/avatars/pending', authMiddleware, async (c) => {
  const user = c.get('user')
  const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'
  if (!isAdmin) return c.json({ success: false, error: 'Forbidden' }, 403)

  const { data, error } = await supabaseAdmin
    .from('user_avatars')
    .select('*')
    .eq('avatar_type', 'expert_upload')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  if (error) return c.json({ success: false, error: error.message }, 500)

  const result = await Promise.all((data || []).map(async (a: any) => {
    const url = a.avatar_value
      ? `${supabaseUrl}/storage/v1/object/public/${a.avatar_value}`
      : null
    return { ...a, avatar_url: url }
  }))

  return c.json({ success: true, avatars: result })
})

// 🟡 PATCH /api/admin/avatars/:id/approve — อนุมัติ / ปฏิเสธ avatar (Admin)
app.patch('/api/admin/avatars/:user_id/approve', authMiddleware, async (c) => {
  const user = c.get('user')
  const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'
  if (!isAdmin) return c.json({ success: false, error: 'Forbidden' }, 403)

  const targetUserId = c.req.param('user_id')
  const { approved } = await c.req.json()

  const { error } = await supabaseAdmin
    .from('user_avatars')
    .update({ is_approved: !!approved, updated_at: new Date().toISOString() })
    .eq('user_id', targetUserId)

  if (error) return c.json({ success: false, error: error.message }, 500)

  return c.json({ success: true, message: approved ? 'อนุมัติ Avatar แล้ว' : 'ปฏิเสธ Avatar แล้ว' })
})

// 🧪 Route สำหรับทดสอบ SUPABASE_SERVICE_KEY
app.get('/api/test-admin', async (c) => {
  try {
    // ทดลอง Query ตาราง assessments ผ่าน supabaseAdmin
    const { data, error, count } = await supabaseAdmin
      .from('assessments')
      .select('*', { count: 'exact' })
      .limit(1);

    if (error) {
      return c.json({
        success: false,
        message: '❌ Key หรือการเชื่อมต่อมีปัญหา',
        error: error.message
      }, 400);
    }

    return c.json({
      success: true,
      message: '✅ SUPABASE_SERVICE_KEY ใช้งานได้ปกติ! (Bypass RLS เรียบร้อย)',
      total_assessments: count,
      sample_data: data
    });
  } catch (err: any) {
    return c.json({
      success: false,
      message: '❌ เกิดข้อผิดพลาดใน Server',
      error: err.message
    }, 500);
  }
});


const port = 3000
console.log(`🚀 API Server is running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })