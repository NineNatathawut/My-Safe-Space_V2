import { useState, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { checkSensitiveKeywords } from '../../utils/sensitiveContent';

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

export function usePostComposer() {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('🙂');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [loginRequired, setLoginRequired] = useState(false);

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
        setLoginRequired(true);
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

    if (!isAuthenticated) {
      setLoginRequired(true);
      return;
    }

    if (checkSensitiveKeywords(content)) {
      setShowSafetyModal(true);
    } else {
      submitPostToBackend();
    }
  }, [content, isLoading, isAuthenticated, submitPostToBackend]);

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
    loginRequired,
    setLoginRequired,
    EMOTIONS,
    handleClear,
    handleSubmit,
    handleProceedPost,
  };
}