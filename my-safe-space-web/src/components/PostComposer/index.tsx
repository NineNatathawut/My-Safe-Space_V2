import { useState, useEffect } from 'react';
import { PostComposerModal } from './PostComposerModal';
import { PostComposerFull } from './PostComposerFull';

interface PostComposerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostComposer({ isOpen, onClose }: PostComposerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!isOpen) return null;

  return isMobile
    ? <PostComposerFull onClose={onClose} />
    : <PostComposerModal onClose={onClose} />;
}