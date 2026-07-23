import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

import authRouter from './routes/auth.js'

type Variables = {
  user: any
}

const app = new Hono<{ Variables: Variables }>()

// ==========================================
// 🛡️ Middleware: CORS (อนุญาตให้ Frontend เข้าถึง Backend ได้)
// ==========================================
app.use('*', cors({
  origin: 'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
}))

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
// 📝 3. API: บันทึกข้อความระบายความรู้สึก (Posts)
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
    created_at: post.created_at,
    hug_count: post.hugs?.[0]?.count || 0,
    comment_count: post.comments?.[0]?.count || 0
  }))

  return c.json({
    success: true,
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
    } else {
      const { error } = await supabase
        .from('hugs')
        .insert({ post_id: postId, user_id: userId })
      
      if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)
      
      return c.json({ success: true, message: 'ส่งกอดให้กำลังใจแล้ว 🫂', hugged: true }, 200)
    }
  } else {
    // สำหรับผู้ใช้ไร้นาม
    const { error } = await supabase
      .from('hugs')
      .insert({ post_id: postId })
    
    if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)
    
    return c.json({ success: true, message: 'ส่งกอดให้กำลังใจแล้ว 🫂', hugged: true }, 200)
  }
})

// ==========================================
// 💬 5. API: ระบบคอมเมนต์ (ตอบกลับ) [อัปเดตใช้ optionalAuthMiddleware]
// ==========================================
app.post('/api/posts/:id/comments', optionalAuthMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('id')

  try {
    const body = await c.req.json()

    if (!body.content || body.content.trim() === '') {
      return c.json({ error: 'กรุณากรอกข้อความให้กำลังใจ' }, 400)
    }

    const insertData: any = {
      post_id: postId,
      alias_name: body.alias_name || 'ผู้พิทักษ์ใจฟู',
      content: body.content.trim()
    }

    if (user?.id) {
      insertData.user_id = user.id
    }

    const { data, error } = await supabase
      .from('comments')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Supabase comment error:', error)
      return c.json({ error: `Database Error: ${error.message}` }, 500)
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
    .select('id, content, alias_name, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: `Database Error: ${error.message}` }, 500)

  return c.json({ 
    success: true, 
    comments: data 
  }, 200)
})

const port = 3000
console.log(`🚀 API Server is running on http://localhost:${port}`)

serve({ fetch: app.fetch, port })