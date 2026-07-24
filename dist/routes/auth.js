import { Hono } from 'hono';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
const auth = new Hono();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const fallbackNicknames = [
    'ผู้พิทักษ์ใจฟู',
    'ก้อนเมฆโอบอุ่น',
    'สายลมแสนดี',
    'ดาวส่องแสงใจ',
    'แมวน้อยคอยซัพพอร์ต',
    'ต้นไม้ฮีลใจ',
    'ชานมหวานน้อย'
];
// 🟢 POST /api/auth/register
auth.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password } = body;
        if (!email || !password) {
            return c.json({ error: 'กรุณาระบุอีเมลและรหัสผ่าน' }, 400);
        }
        // 1. สุ่มนามแฝงใจฟู (ผ่าน Gemini หรือ Local Fallback)
        let nickname = '';
        const prompt = 'สร้างนามแฝงภาษาไทยสั้นๆ 1 ชื่อ ที่ให้อารมณ์อบอุ่น ปลอดภัย ฮีลใจ (ตอบเฉพาะชื่อ ไม่ต้องใส่เครื่องหมายอัญประกาศหรือคำอธิบายเพิ่มเติม)';
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-lite',
                contents: prompt,
            });
            nickname = response.text?.trim() || fallbackNicknames[0];
        }
        catch (err) {
            console.warn('⚠️ AI Quota Exceeded. Using Local Fallback Nickname.');
            const randomIndex = Math.floor(Math.random() * fallbackNicknames.length);
            nickname = fallbackNicknames[randomIndex];
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
        });
        if (error) {
            return c.json({ success: false, error: error.message }, 400);
        }
        return c.json({
            success: true,
            message: '🎉 สมัครสมาชิกสำเร็จ!',
            user: data.user,
            assignedNickname: nickname
        }, 200);
    }
    catch (err) {
        return c.json({ error: 'รูปแบบข้อมูลไม่ถูกต้อง กรุณาส่งเป็น JSON' }, 400);
    }
});
// 🟢 POST /api/auth/login
auth.post('/login', async (c) => {
    const body = await c.req.json();
    const { email, password } = body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error)
        return c.json({ success: false, error: error.message }, 401);
    return c.json({
        success: true,
        message: '🔓 ล็อกอินสำเร็จ!',
        access_token: data.session?.access_token
    });
});
export default auth;
// 🧪 API สำหรับทดสอบระบบสุ่มชื่อ (GET /api/auth/test-nickname)
auth.get('/test-nickname', async (c) => {
    let nickname = '';
    let source = '';
    const prompt = 'สร้างนามแฝงภาษาไทยสั้นๆ 1 ชื่อ ที่ให้อารมณ์อบอุ่น ปลอดภัย ฮีลใจ (ตอบเฉพาะชื่อ ไม่ต้องใส่เครื่องหมายอัญประกาศหรือคำอธิบายเพิ่มเติม)';
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt,
        });
        nickname = response.text?.trim() || fallbackNicknames[0];
        source = 'Google Gemini AI 🤖';
    }
    catch (err) {
        const randomIndex = Math.floor(Math.random() * fallbackNicknames.length);
        nickname = fallbackNicknames[randomIndex];
        source = 'Local Fallback Pool 🛡️';
    }
    return c.json({
        success: true,
        source: source,
        nickname: nickname
    });
});
