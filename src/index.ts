import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

import authRouter from './routes/auth.js'

type Variables = {
  user: any
}

const app = new Hono<{ Variables: Variables }>()

export const supabaseUrl = process.env.SUPABASE_URL!
export const supabaseKey = process.env.SUPABASE_KEY!
export const supabase = createClient(supabaseUrl, supabaseKey)

// 🟢 1. เชื่อมต่อระบบ Auth (สมัครสมาชิก / ล็อกอิน / สุ่มชื่อ AI)
// Route ทั้งหมดใน authRouter จะขึ้นต้นด้วย /api/auth
app.route('/api/auth', authRouter)


// ==========================================
// 🛡️ 2. Middleware: ด่านตรวจตั๋ว (access_token)
// ==========================================
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: จำเป็นต้องมี Token เพื่อเข้าสู่ระบบ' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    return c.json({ error: 'Unauthorized: Token ไม่ถูกต้องหรือหมดอายุ' }, 401)
  }

  c.set('user', data.user)
  await next()
}

// ==========================================
// 📝 3. API: บันทึกข้อความระบายความรู้สึก
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
      content: body.content       
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

// 🟢 API: ดึงข้อความระบายความรู้สึกทั้งหมด (GET /api/posts) [อัปเดต: เพิ่มการนับ กอด และ คอมเมนต์]
app.get('/api/posts', async (c) => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      emotion,
      alias_name,
      created_at,
      hugs (count),
      comments (count)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return c.json({ error: `Database Error: ${error.message}` }, 500)
  }

  // จัด Format ข้อมูลให้ UI ใช้งานได้ทันที (ดึงค่า count ออกมา)
  const formattedPosts = data.map((post: any) => ({
    id: post.id,
    user_id: post.user_id,
    content: post.content,
    emotion: post.emotion,
    alias_name: post.alias_name,
    created_at: post.created_at,
    hug_count: post.hugs?.[0]?.count || 0,
    comment_count: post.comments?.[0]?.count || 0
  }))

  return c.json({
    success: true,
    posts: formattedPosts
  }, 200)
})

// 🟢 API: ดึงประวัติการโพสต์ของตัวเอง (GET /api/posts/me) [อัปเดต: เพิ่มการนับ กอด และ คอมเมนต์]
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

// 🔴 API: ลบโพสต์ของตัวเอง (DELETE /api/posts/:id)
app.delete('/api/posts/:id', authMiddleware, async (c) => {
  const user = c.get('user') 
  const postId = c.req.param('id')

  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id)
    .select()

  if (error) {
    return c.json({ error: `Database Error: ${error.message}` }, 500)
  }

  if (data.length === 0) {
    return c.json({ 
      error: 'ไม่พบโพสต์ที่ต้องการลบ หรือคุณไม่มีสิทธิ์ลบโพสต์นี้' 
    }, 403)
  }
  
  return c.json({
    success: true,
    message: '🗑️ ลบข้อความออกจากพื้นที่ปลอดภัยเรียบร้อยแล้ว'
  }, 200)
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
// 🫂 4. API: ระบบส่งกอด (ให้กำลังใจ)
// ==========================================

// 🟢 API: กดส่งกอด / ยกเลิกกอด (POST /api/posts/:id/hug)
app.post('/api/posts/:id/hug', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')

  // 1. เช็กว่า User คนนี้เคยส่งกอดให้โพสต์นี้หรือยัง
  const { data: existingHug } = await supabase
    .from('hugs')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single() // ดึงมาแค่ record เดียว

  if (existingHug) {
    // 2. ถ้าเคยส่งแล้ว -> ถือเป็นการ "ยกเลิกกอด" (Unlike)
    await supabase.from('hugs').delete().eq('id', existingHug.id)
    return c.json({ success: true, message: 'ยกเลิกการส่งกอด', hugged: false }, 200)
  } else {
    // 3. ถ้ายังไม่เคย -> "บันทึกการส่งกอด" (Like)
    const { error } = await supabase
      .from('hugs')
      .insert({ post_id: postId, user_id: user.id })
    
    if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)
    
    return c.json({ success: true, message: 'ส่งกอดให้กำลังใจแล้ว 🫂', hugged: true }, 200)
  }
})


// ==========================================
// 💬 5. API: ระบบคอมเมนต์ (ตอบกลับ)
// ==========================================

// 🟢 API: สร้างคอมเมนต์ (POST /api/posts/:id/comments)
app.post('/api/posts/:id/comments', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')
  const body = await c.req.json()

  if (!body.content || body.content.trim() === '') {
    return c.json({ error: 'กรุณากรอกข้อความให้กำลังใจ' }, 400)
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      alias_name: body.alias_name || 'ผู้พิทักษ์ใจฟู', // ถ้าไม่มีชื่อส่งมา ให้ใช้ชื่อพื้นฐาน
      content: body.content
    })
    .select()

  if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)
  
  return c.json({ 
    success: true, 
    message: 'ส่งข้อความให้กำลังใจสำเร็จ ✨', 
    comment: data[0] 
  }, 201)
})

// 🟢 API: ดึงคอมเมนต์ทั้งหมดของโพสต์ (GET /api/posts/:id/comments)
app.get('/api/posts/:id/comments', async (c) => {
  const postId = c.req.param('id')

  const { data, error } = await supabase
    .from('comments')
    .select('id, content, alias_name, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true }) // เรียงจากคอมเมนต์แรกสุดไปล่าสุด

  if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)

  return c.json({ 
    success: true, 
    comments: data 
  }, 200)
})


const port = 3000
console.log(`🚀 API Server is running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })