import { usePostComposer } from './usePostComposer';
import { useAuth } from '../../contexts/AuthContext';
import { LoginRequiredCard } from './LoginRequiredCard';
import { SafetyModal } from '../SafetyModal';

interface PostComposerFullProps {
  onClose: () => void;
}

export function PostComposerFull({ onClose }: PostComposerFullProps) {
  const { isAuthenticated } = useAuth();
  const {
    content, setContent,
    selectedEmotion, setSelectedEmotion,
    isLoading, error, successMsg,
    showSafetyModal, setShowSafetyModal,
    loginRequired,
    EMOTIONS, handleClear, handleSubmit, handleProceedPost,
  } = usePostComposer();

  const showLoginCard = !isAuthenticated || loginRequired;

  return (
    <>
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-owl-soft text-body-strong transition-colors">←</button>
          <h2 className="font-feather text-base font-extrabold text-ink">พื้นที่แบ่งปันเรื่องราว</h2>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showLoginCard ? (
            <LoginRequiredCard />
          ) : (
          <>
          {successMsg && (
            <div className="mb-4 p-3 bg-owl-soft text-owl-pressed rounded-xl border border-owl-mint text-sm animate-pulse">{successMsg}</div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-cardinal/10 text-cardinal rounded-xl border border-cardinal/30 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-bold mb-3 text-body-strong">วันนี้คุณรู้สึกอย่างไร?</h3>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((emo) => (
                  <button
                    key={emo.label}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setSelectedEmotion(emo.icon)}
                    className={`flex flex-col items-center p-2.5 rounded-xl border-2 transition-all ${
                      selectedEmotion === emo.icon ? 'border-owl bg-owl-soft' : 'border-hairline hover:bg-owl-soft/40'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-xl">{emo.icon}</span>
                    <span className="text-[10px] mt-1 text-body-strong font-bold">{emo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 text-body-strong">บอกเล่าสิ่งที่อยู่ในใจ...</h3>
              <textarea
                className="input min-h-[200px] resize-none disabled:opacity-50 disabled:bg-owl-soft/30 text-sm"
                placeholder="พิมพ์เล่าเรื่องราว ประสบการณ์ หรือความรู้สึกที่เจอมาวันนี้ได้เลย พื้นที่ตรงนี้พร้อมรับฟังเสมอ..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={1000}
                disabled={isLoading}
              ></textarea>
              <div className="text-right text-xs text-body-soft mt-1">{content.length}/1000</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={handleClear} disabled={isLoading} className="btn-secondary text-sm min-h-[44px] py-2">ล้าง</button>
              <button type="submit" disabled={!content.trim() || isLoading} className="btn-primary text-sm min-h-[44px] py-2 flex items-center gap-2">
                {isLoading ? 'กำลังส่ง...' : 'แชร์เรื่องราว'}
              </button>
            </div>
          </form>

          <p className="text-[10px] text-body-soft mt-4 flex gap-1 items-start"><span>🔒</span> ความเป็นส่วนตัวของคุณสำคัญมาก — ข้อความนี้ไม่มีการบันทึกชื่อ อีเมล หรือข้อมูลส่วนตัวใดๆ</p>
          </>
          )}
        </div>
      </div>

      <SafetyModal isOpen={showSafetyModal} onClose={() => setShowSafetyModal(false)} onProceed={handleProceedPost} />
    </>
  );
}