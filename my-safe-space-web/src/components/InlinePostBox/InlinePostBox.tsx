import { useState, useRef } from 'react';
import { usePostComposer } from '../PostComposer/usePostComposer';
import { SafetyModal } from '../SafetyModal';

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
      <div className="flex gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-purple-200 to-fuchsia-200 flex items-center justify-center text-lg">
          {isAnonymous ? '🧑' : '👤'}
        </div>
        <div className="flex-1">
          <form onSubmit={handleSubmitWithReset} className="space-y-3">
            <textarea
              ref={textareaRef}
              className="w-full border-none bg-transparent text-slate-800 placeholder-slate-400 text-sm resize-none outline-none overflow-hidden"
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
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">{error}</div>
                )}
                {successMsg && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm animate-pulse">{successMsg}</div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_EMOTIONS.map((emo) => (
                    <button
                      key={emo.label}
                      type="button"
                      onClick={() => setSelectedEmotion(emo.icon)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedEmotion === emo.icon
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      {emo.icon} {emo.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowEmotions(!showEmotions)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
                  >
                    {showEmotions ? '▲ ซ่อน' : '▼ อารมณ์ทั้งหมด'}
                  </button>
                </div>

                {showEmotions && (
                  <div className="flex flex-wrap gap-1.5 animate-fadeIn">
                    {EMOTIONS.map((emo) => (
                      <button
                        key={emo.label}
                        type="button"
                        onClick={() => { setSelectedEmotion(emo.icon); setShowEmotions(false); }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedEmotion === emo.icon
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isAnonymous
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-slate-50 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {isAnonymous ? '🔒 ไม่ระบุนาม' : '👤 แสดงนาม'}
                    </button>
                    <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors" title="แนบรูปภาพ">
                      📷
                    </button>
                    <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors" title="อีโมจิ">
                      😊
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={isLoading || !content.trim()}
                      className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40"
                    >
                      ล้าง
                    </button>
                    <button
                      type="submit"
                      disabled={!content.trim() || isLoading}
                      className={`px-5 py-2 rounded-full text-sm font-medium text-white transition-colors shadow-sm ${
                        content.trim()
                          ? 'bg-purple-600 hover:bg-purple-700 active:scale-[0.98]'
                          : 'bg-purple-300 cursor-not-allowed'
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