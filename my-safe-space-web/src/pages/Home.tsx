import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// 📝 สร้าง Interface กำหนดโครงสร้างข้อมูลโพสต์ให้ TypeScript รู้จัก
interface Post {
  id: string;
  _id?: string; // รองรับเผื่อ Backend ส่งเป็น _id มา
  content: string;
  emotion: string;
  alias_name: string;
  created_at: string;
  hug_count: number;
  comment_count: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔄 ดึงข้อมูลเมื่อเปิดหน้านี้ขึ้นมา
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/posts');
      
      if (response.data.success) {
        setPosts(response.data.posts);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError('ไม่สามารถโหลดข้อความจากลานสายลมได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  // 🫂 ฟังก์ชันสำหรับกดส่งกอด/ยกเลิกกอด (เวอร์ชันแก้ไขแล้ว)
  const handleHug = async (postId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // กำหนด Header เฉพาะเมื่อมี Token เท่านั้น
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};

      // ยิง API ไปที่ระบบกอด
      const response = await api.post(`/api/posts/${postId}/hug`, {}, config);

      if (response.data.success) {
        // อัปเดตตัวเลขกอดใน หน้าเว็บทันที
        setPosts(prevPosts => prevPosts.map(post => {
          const currentId = post.id || post._id;
          if (currentId === postId) {
            
            // Case 1: ถ้า Backend ส่ง hug_count อัปเดตล่าสุดกลับมา
            if (typeof response.data.hug_count === 'number') {
              return { ...post, hug_count: response.data.hug_count };
            }
            
            // Case 2: ถ้า Backend ส่งสถานะ hugged (true/false)
            if (typeof response.data.hugged === 'boolean') {
              return {
                ...post,
                hug_count: response.data.hugged ? post.hug_count + 1 : Math.max(0, post.hug_count - 1)
              };
            }
            
            // Case 3: ถ้าไม่มีส่งอะไรมาเลย ให้ถือว่ากดกอด成功 (+1)
            return { ...post, hug_count: post.hug_count + 1 };
          }
          return post;
        }));
      }
    } catch (err: any) {
      console.error("Error sending hug:", err?.response?.data || err.message);
      
      if (err?.response?.status === 401) {
        alert('กรุณาเข้าสู่ระบบหรือตั้งนามแฝงก่อนส่งกอดนะครับ 🤍');
      } else {
        alert('ไม่สามารถส่งกอดได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  // 📅 ฟังก์ชันแปลงวันที่ให้เป็นภาษาไทยแบบอ่านง่าย
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-16 py-8 max-w-6xl mx-auto">
      
      {/* 🌟 1. ส่วนต้อนรับ (Hero Section) */}
      <section className="text-center px-4">
        <div className="inline-block bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          🔒 พื้นที่ปลอดภัย ไม่ระบุตัวตน
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          ที่นี่คือ <span className="text-purple-600">บ้านพักใจ</span> ของคุณ
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          ระบายความรู้สึก แบ่งปันความเจ็บปวด หรือแค่อยากพิมพ์บอกใครสักคน - เราพร้อมรับฟังทุกคำ โดยไม่ตัดสิน ไม่มีการระบุตัวตน
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/venting" 
            className="px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors"
          >
            เริ่มระบายเลย
          </Link>
          <Link 
            to="/resources" 
            className="px-8 py-3 bg-white text-purple-600 font-medium rounded-full border border-purple-200 hover:bg-purple-50 transition-colors"
          >
            ค้นหาทรัพยากร
          </Link>
        </div>
        
        <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
          <span>🛡️</span> ไม่มีการบันทึกชื่อ - ไม่มีการล็อกอิน ปลอดภัย 100%
        </p>
      </section>

      {/* 🚨 2. แถบเบอร์ฉุกเฉินด่วน */}
      <section className="bg-red-50 py-6 px-4 rounded-2xl mx-4 lg:mx-0">
        <p className="text-center text-red-600 font-medium mb-4">
          ต้องการความช่วยเหลือเร่งด่วน? โทรหาผู้เชี่ยวชาญได้เลย - ฟรี ตลอด 24 ชั่วโมง
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:1323" className="bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow">
            1323 สุขภาพจิต
          </a>
          <a href="tel:1669" className="bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow">
            1669 ฉุกเฉิน
          </a>
          <a href="tel:1385" className="bg-white px-6 py-2 rounded-full text-red-600 font-bold shadow-sm hover:shadow-md transition-shadow">
            1385 ป้องกันการฆ่าตัวตาย
          </a>
        </div>
      </section>

      {/* 🍃 3. ลานสายลม (Feed ดึงข้อมูลสดจากฐานข้อมูล) */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ลานสายลม 🍃
          </h2>
          <button 
            onClick={fetchPosts}
            disabled={isLoading}
            className="text-purple-600 text-sm hover:text-purple-800 flex items-center gap-1 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'กำลังโหลด...' : '🔄 รีเฟรช'}
          </button>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl border border-red-200 text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 && !error ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">🍃</div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">ลานสายลมยังคงเงียบสงบ</h3>
            <p className="text-gray-500">เป็นคนแรกที่บอกเล่าความรู้สึกในวันนี้สิ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => {
              const activeId = post.id || post._id || '';
              return (
                <div key={activeId} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-2xl border border-gray-100 shadow-sm">
                          {post.emotion}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">{post.alias_name}</span>
                          <div className="text-xs text-gray-400">{formatDate(post.created_at)}</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-4">
                      {post.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-sm mt-auto">
                    <button
                      onClick={() => handleHug(activeId)}
                      className="flex items-center gap-1.5 text-gray-500 hover:text-pink-500 transition-colors active:scale-95 transform"
                    >
                      <span>🫂</span> กอด {post.hug_count > 0 && <span className="font-medium text-pink-500">({post.hug_count})</span>}
                    </button>

                    <Link to={`/post/${activeId}`} className="flex items-center gap-1.5 text-gray-500 hover:text-purple-600 transition-colors">
                      <span>💬</span> คอมเมนต์ {post.comment_count > 0 && <span className="font-medium text-purple-600">({post.comment_count})</span>}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ✨ 4. ทำไมต้องบ้านพักใจ? */}
      <section className="px-4">
        <h2 className="text-2xl font-bold text-center mb-10">ทำไมต้องบ้านพักใจ?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">🕊️</div>
            <h3 className="font-bold mb-2">พื้นที่ที่คุณระบายได้อย่างอิสระ</h3>
            <p className="text-gray-600 text-sm">เราออกแบบมาเพื่อให้คุณรู้สึกปลอดภัย อบอุ่น และได้รับการสนับสนุน ทุกคำที่คุณพิมพ์มีค่า</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">🕵️‍♀️</div>
            <h3 className="font-bold mb-2">ไม่ระบุตัวตน 100%</h3>
            <p className="text-gray-600 text-sm">ไม่ต้องสมัครสมาชิก ไม่มีชื่อ ไม่มีเบอร์โทร พิมพ์ระบายได้เลยทันที</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">⚖️</div>
            <h3 className="font-bold mb-2">ไม่ตัดสิน ไม่วิจารณ์</h3>
            <p className="text-gray-600 text-sm">ทุกความรู้สึกมีสิทธิ์อยู่ที่นี่ โกรธ เศร้า กลัว หรือแม้แต่ไม่รู้สึกอะไร - ก็ระบายได้</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-4">🏡</div>
            <h3 className="font-bold mb-2">บรรยากาศอบอุ่น ปลอดภัย</h3>
            <p className="text-gray-600 text-sm">ออกแบบมาเพื่อให้คุณรู้สึกเหมือนได้นั่งคุยกับเพื่อนที่ไว้ใจได้ในบ้านที่อบอุ่น</p>
          </div>

        </div>
      </section>

      {/* 💜 5. Call to Action ก่อนจบหน้า */}
      <section className="text-center px-4 bg-purple-50 py-12 rounded-2xl mx-4 lg:mx-0 border border-purple-100">
        <h2 className="text-2xl font-bold mb-4 text-purple-900">พร้อมระบายแล้วหรือยัง?</h2>
        <p className="text-purple-700 mb-8 max-w-lg mx-auto">
          ไม่ต้องกังวล ไม่มีใครรู้ว่าคุณเป็นใคร - พิมพ์ได้เลยทันที
        </p>
        <Link 
          to="/venting" 
          className="px-8 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg inline-block"
        >
          เข้าสู่ห้องระบาย
        </Link>
      </section>

    </div>
  );
}