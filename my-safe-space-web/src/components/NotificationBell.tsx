import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

interface Notification {
  id: string;
  type: 'comment' | 'expert_comment' | 'hug' | 'system';
  reference_type: string;
  reference_id: string;
  from_user_id: string | null;
  alias_name: string | null;
  content_preview: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  comment: '💬',
  expert_comment: '🩺',
  hug: '💖',
  system: '🛡️',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const markAllReadAtRef = useRef(0);
  const fetchStartedAtRef = useRef(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    fetchStartedAtRef.current = Date.now();
    try {
      const res = await api.get('/api/notifications');
      if (fetchStartedAtRef.current < markAllReadAtRef.current) return;
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unread_count);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      markAllReadAtRef.current = Date.now();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = ref.current?.getBoundingClientRect();
    const isDesktop = window.innerWidth >= 768;
    const width = isDesktop ? 384 : Math.min(320, window.innerWidth - 16);
    let left = rect ? rect.right - width : 8;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    const top = rect ? rect.bottom + 8 : 64;
    setPopupPos({ left, top, width });
    setOpen(true);
  };

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      handleMarkAllRead();
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleNotificationClick = (n: Notification) => {
    setOpen(false);

    const targetPath = getNotificationLink(n);
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  const getNotificationLink = (n: Notification): string | null => {
    if (n.reference_type === 'post') return `/post/${n.reference_id}`;
    if (n.reference_type === 'verification') return '/profile';
    return null;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'เมื่อกี้';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ชม.ที่แล้ว`;
    return d.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2.5 bg-owl-soft hover:bg-owl-mint rounded-full transition-colors text-owl-pressed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 0-4.496 0Z" clipRule="evenodd" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && popupPos && (
        <div
          className="fixed bg-white rounded-2xl shadow-xl border border-hairline z-[100] overflow-hidden animate-fadeIn"
          style={{ left: popupPos.left, top: popupPos.top, width: popupPos.width }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
            <h3 className="font-feather font-extrabold text-ink text-sm">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-owl hover:text-owl-pressed font-bold">
                อ่านทั้งหมด
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-body-soft text-sm font-medium">ไม่มีการแจ้งเตือน</div>
            ) : (
              notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`cursor-pointer block px-4 py-3 hover:bg-owl-soft/30 transition-colors border-b border-hairline last:border-0 ${!n.is_read ? 'bg-owl-soft/50 border-l-4 border-l-owl' : ''}`}
                  >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-ink font-bold' : 'text-body-strong'}`}>
                        {n.content_preview}
                      </p>
                      <p className="text-xs text-body-soft mt-1">{formatTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <span className="inline-flex items-center gap-1 mt-1 shrink-0">
                        <span className="w-2 h-2 bg-owl rounded-full" />
                        <span className="text-[10px] font-bold text-owl">ใหม่</span>
                      </span>
                    )}
                  </div>
                  </div>
                ))
              )}
          </div>
        </div>
      )}
    </div>
  );
}
