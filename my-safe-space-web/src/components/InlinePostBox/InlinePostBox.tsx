import { useState, useRef } from 'react';
import { usePostComposer } from '../PostComposer/usePostComposer';
import { SafetyModal } from '../SafetyModal';
import { Icon } from '../Icon';

const QUICK_EMOTIONS = [
  { label: 'สดใส', icon: '😊' },
  { label: 'ผ่อนคลาย', icon: '🍃' },
  { label: 'กังวล', icon: '😥' },
  { label: 'เศร้า', icon: '🌧️' },
  { label: 'โกรธ', icon: '😡' },
  { label: 'เหงา', icon: '🥺' },
];

export function InlinePostBox({ onPost }: { onPost?: () => void }) {
  const {
    content, setContent,
    selectedEmotion, setSelectedEmotion,
    isLoading, error, successMsg,
    showSafetyModal, setShowSafetyModal,
    EMOTIONS, handleClear, handleSubmit, handleProceedPost,
  } = usePostComposer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmotions, setShowEmotions] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaFocus = () => setIsExpanded(true);

  const handleSubmitWithReset = (e: React.FormEvent) => {
    handleSubmit(e);
    if (!error && !showSafetyModal && successMsg) {
      setContent('');
      setIsExpanded(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (onPost) onPost();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-hairline p-4 mb-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-owl-soft flex items-center justify-center text-ink-deep">
          <Icon name={isAnonymous ? 'user-round' : 'user'} size={18} className="text-owl-pressed" />
        </div>
        <div className="flex-1">
          <form onSubmit={handleSubmitWithReset} className="space-y-3">
            <textarea
              ref={textareaRef}
              className="w-full border-none bg-transparent text-body-strong placeholder-body-soft text-sm resize-none outline-none overflow-hidden"
              style={{ minHeight: '40px', maxHeight: '120px' }}
              placeholder="เกิดอะไรขึ้นในใจคุณตอนนี้... เขียนระบายลงในลานสายลมได้เลย"
              value={content}
              onChange={handleTextChange}
              onFocus={handleTextareaFocus}
              maxLength={1000}
              disabled={isLoading}
            />

            {isExpanded && (
              <div className="space-y-3 animate-fadeIn">
                {error && (
                  <div className="p-3 bg-cardinal/10 text-cardinal rounded-xl border border-cardinal/30 text-sm">{error}</div>
                )}
                {successMsg && (
                  <div className="p-3 bg-owl-soft text-owl-pressed rounded-xl border border-owl-mint text-sm animate-pulse">{successMsg}</div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_EMOTIONS.map((emo) => (
                    <button
                      key={emo.label}
                      type="button"
                      onClick={() => setSelectedEmotion(emo.icon)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        selectedEmotion === emo.icon
                          ? 'bg-owl-soft text-owl-pressed border border-owl-mint'
                          : 'bg-body-soft/10 text-body-muted border border-hairline hover:bg-owl-soft/40'
                      }`}
                    >
                      {emo.icon} {emo.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowEmotions(!showEmotions)}
                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-body-muted border border-hairline hover:bg-owl-soft/40"
                  >
                    {showEmotions ? 'ซ่อน' : 'อารมณ์ทั้งหมด'}
                  </button>
                </div>

                {showEmotions && (
                  <div className="flex flex-wrap gap-1.5 animate-fadeIn">
                    {EMOTIONS.map((emo) => (
                      <button
                        key={emo.label}
                        type="button"
                        onClick={() => { setSelectedEmotion(emo.icon); setShowEmotions(false); }}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                          selectedEmotion === emo.icon
                            ? 'bg-owl-soft text-owl-pressed border border-owl-mint'
                            : 'bg-body-soft/10 text-body-muted border border-hairline hover:bg-owl-soft/40'
                        }`}
                      >
                        {emo.icon} {emo.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        isAnonymous
                          ? 'bg-owl-soft text-owl-pressed border border-owl-mint'
                          : 'bg-white text-body-muted border border-hairline'
                      }`}
                    >
                      <Icon name={isAnonymous ? 'lock' : 'user'} size={13} />
                      {isAnonymous ? 'ไม่ระบุนาม' : 'แสดงนาม'}
                    </button>
                    <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-owl-soft text-body-soft transition-colors" title="แนบรูปภาพ">
                      <Icon name="camera" size={16} />
                    </button>
                    <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-owl-soft text-body-soft transition-colors" title="อีโมจิ">
                      <Icon name="smile" size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isLoading || !content.trim()}
                      className="px-4 py-2 text-sm font-bold text-body-muted hover:text-body-strong transition-colors disabled:opacity-40"
                    >
                      ล้าง
                    </button>
                    <button
                      type="submit"
                      disabled={!content.trim() || isLoading}
                      className={`px-5 py-2 rounded-full text-sm font-bold text-white transition-all shadow-lip-sm ${
                        content.trim()
                          ? 'bg-owl hover:bg-owl-pressed active:translate-y-0.5 active:shadow-none'
                          : 'bg-body-soft/50 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'กำลังส่ง...' : 'โพสต์ระบายใจ'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <SafetyModal isOpen={showSafetyModal} onClose={() => setShowSafetyModal(false)} onProceed={handleProceedPost} />
    </div>
  );
}