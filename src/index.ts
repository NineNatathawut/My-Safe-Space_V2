import 'dotenv/config';

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { createClient } from '@supabase/supabase-js'

import authRouter from './routes/auth.js'

type Variables = {
  user: any
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

// 🟢 API: ดึงข้อมูลผู้ใช้ปัจจุบัน (GET /api/auth/me)
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')

  const isAdmin = user.email === 'admin@banpakjai.com' || user.user_metadata?.role === 'admin'
  const nickname = user.user_metadata?.nickname || 'ผู้ใช้งาน'

  return c.json({
    success: true,
    user: {
      email: user.email,
      nickname: nickname,
      role: isAdmin ? 'admin' : 'user',
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



// ==========================================
// 📊 6. API: จัดการแบบประเมิน (Assessment CRUD)
// ==========================================

// 🟢 GET /api/assessments/active — ดึงแบบประเมินที่เผยแพร่แล้ว (ไม่ต้อง Auth, ไว้ให้ User ทำ)
app.get('/api/assessments/active', async (c) => {
  const { data: assessmentData, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('status', 'PUBLISHED')
    .eq('type', 'INTERNAL')
    .order('created_at', { ascending: false })
    .limit(1)

  if (assessmentError || !assessmentData || assessmentData.length === 0) {
    return c.json({ success: false, error: assessmentError?.message || 'ไม่พบแบบประเมิน' }, 404)
  }

  const assessment = assessmentData[0]

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

  return c.json({
    success: true,
    assessment: {
      ...assessment,
      questions: questionsWithChoices,
      interpretation_rules: rulesData || [],
    },
  })
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