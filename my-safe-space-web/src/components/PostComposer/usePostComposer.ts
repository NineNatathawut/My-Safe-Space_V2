import { useState, useCallback } from 'react';
import api from '../../api/axios';

const SENSITIVE_KEYWORDS = [
  'คิดสั้น', 'คิดส้น',
  'อยากตาย', 'ไม่อยากอยู่', 'อยากฆ่า',
  'ฆ่าตัว', 'จบชีวิต', 'ลาโลก',
  'ฆ่า ตต', 'ฆ่าตต', 'ตัดช่องน้อย',
  'ไม่อยากตื่น', 'ตายดีกว่า', 'ไม่อยากมีชีวิต'
];

const EMOTIONS = [
  { label: 'เศร้า', icon: '😭' },
  { label: 'กังวล', icon: '😰' },
  { label: 'โกรธ', icon: '😡' },
  { label: 'เหงา', icon: '🥺' },
  { label: 'เหนื่อย', icon: '😫' },
  { label: 'สับสน', icon: '😵‍💫' },
  { label: 'มีความหวัง', icon: '✨' },
  { label: 'โอเค', icon: '🙂' },
];

const checkSensitiveKeywords = (text: string): boolean => {
  if (!text) return false;
  const normalizedText = text.replace(/\s+/g, '').toLowerCase();
  return SENSITIVE_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.replace(/\s+/g, '').toLowerCase();
    return normalizedText.includes(normalizedKeyword);
  });
};

export function usePostComposer() {
  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('🙂');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleClear = useCallback(() => {
    setContent('');
    setError('');
    setSuccessMsg('');
  }, []);

  const submitPostToBackend = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      const aliasName = localStorage.getItem('alias_name') || 'ผู้ใช้ไร้นาม';

      if (!token) {
        setError('กรุณาเข้าสู่ระบบก่อนแชร์เรื่องราวครับ');
        setIsLoading(false);
        return;
      }

      const response = await api.post('/api/posts', {
        content,
        emotion: selectedEmotion,
        alias_name: aliasName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message || 'แชร์เรื่องราวเข้าสู่พื้นที่ปลอดภัยเรียบร้อยแล้ว 🤍');
        setContent('');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'ไม่สามารถส่งความรู้สึกได้ในขณะนี้ กรุณาลองใหม่ครับ');
    } finally {
      setIsLoading(false);
    }
  }, [content, selectedEmotion]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isLoading) return;

    if (checkSensitiveKeywords(content)) {
      setShowSafetyModal(true);
    } else {
      submitPostToBackend();
    }
  }, [content, isLoading, submitPostToBackend]);

  const handleProceedPost = useCallback(() => {
    setShowSafetyModal(false);
    submitPostToBackend();
  }, [submitPostToBackend]);

  return {
    content,
    setContent,
    selectedEmotion,
    setSelectedEmotion,
    isLoading,
    error,
    successMsg,
    showSafetyModal,
    setShowSafetyModal,
    EMOTIONS,
    handleClear,
    handleSubmit,
    handleProceedPost,
  };
}