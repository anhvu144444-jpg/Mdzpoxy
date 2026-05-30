import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { syncService } from '../../lib/syncService';

export default function VerifyTaskSection({ setPointsBalance, addActivityLog }: { 
    setPointsBalance?: React.Dispatch<React.SetStateAction<number>>,
    addActivityLog?: (user: string, action: string, amount: string, type: 'mod' | 'deposit' | 'system') => void
}) {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'valid' | 'error' | 'confirmed'>('checking');
  const [errorMSG, setErrorMSG] = useState('');
  
  let sessionId = searchParams.get('code');
  let targetUsername = searchParams.get('username') || searchParams.get('uuid');

  // Fallback to parsing from hash if parameters aren't found in normal search string
  if (!sessionId || !targetUsername) {
    const hash = window.location.hash;
    const queryStartIndex = hash.indexOf('?');
    if (queryStartIndex !== -1) {
      const hashParams = new URLSearchParams(hash.substring(queryStartIndex));
      if (!sessionId) sessionId = hashParams.get('code');
      if (!targetUsername) targetUsername = hashParams.get('username') || hashParams.get('uuid');
    }
  }

  if (targetUsername) targetUsername = targetUsername.replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/&.*$/, '');

  useEffect(() => {
    if (!sessionId || !targetUsername) {
      setStatus('error');
      setErrorMSG('Thiếu mã phiên làm việc. Vui lòng truy cập từ trang nhiệm vụ.');
      return;
    }

    const safeJson = async (res: Response) => {
      const text = await res.text();
      try {
        return text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("verify-session parse error for:", text.substring(0, 500));
        return { error: 'Dữ liệu máy chủ không hợp lệ.' };
      }
    };

    // Call real API
    const verify = async () => {
        try {
            if (!sessionId) {
                setStatus('error');
                setErrorMSG('Lỗi kết nối máy chủ.');
                return;
            }
            const session = await syncService.getTaskSession(sessionId);
            let isValid = false;
            if (session && session.status === 'Đang làm') {
               const actualUuid = await syncService.getUserUuid(session.user_id);
               if (actualUuid === targetUsername || session.user_id === targetUsername) {
                   isValid = true;
               }
            }

            if (isValid && session) {
                const now = new Date().getTime();
                const createdAt = new Date(session.created_at).getTime();
                const diffMinutes = (now - createdAt) / (1000 * 60);

                if (diffMinutes > 15) {
                    await syncService.updateTaskStatus(sessionId, 'Đã hủy');
                    setStatus('error');
                    setErrorMSG('Phiên làm việc đã hết hạn (tối đa 15 phút).');
                } else {
                    setStatus('valid');
                }
            } else {
                setStatus('error');
                setErrorMSG('Phiên làm việc không hợp lệ hoặc đã hết hạn.');
            }
        } catch (e) {
            setStatus('error');
            setErrorMSG('Lỗi kết nối máy chủ.');
        }
    };

    const timeout = setTimeout(verify, 2500);

    return () => clearTimeout(timeout);
  }, [sessionId, targetUsername]);

  const handleConfirm = async () => {
    try {
        const session = await syncService.getTaskSession(sessionId || '');
        let isValid = false;
        if (session && session.status === 'Đang làm') {
            const actualUuid = await syncService.getUserUuid(session.user_id);
            if (actualUuid === targetUsername || session.user_id === targetUsername) {
                isValid = true;
            }
        }
        if (isValid && session) {
            const now = new Date().getTime();
            const createdAt = new Date(session.created_at).getTime();
            const diffMinutes = (now - createdAt) / (1000 * 60);

            if (diffMinutes < 1) {
                setStatus('error');
                setErrorMSG('Bạn hoàn thành nhiệm vụ quá nhanh. Bạn sử dụng tốc độ bàn thờ à ?');
                return;
            }

            if (diffMinutes > 15) {
                await syncService.updateTaskStatus(session.id, 'Đã hủy');
                setStatus('error');
                setErrorMSG('Phiên làm việc đã hết hạn (tối đa 15 phút).');
                return;
            }

            await syncService.updateTaskStatus(session.id, 'Hoàn thành');
            setStatus('confirmed');
            
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
            });

            if (setPointsBalance) {
                setPointsBalance(prev => {
                  const n = prev + (session.reward || 0);
                  if (targetUsername) syncService.updateBalance(targetUsername, { points_balance: n });
                  return n;
                });
            }

            if (addActivityLog) {
                addActivityLog(targetUsername || 'User', `Hoàn thành nhiệm vụ ${session.task_name}`, `+${session.reward} Điểm`, 'deposit');
            }

            if (targetUsername) {
                const maskedUser = targetUsername.length > 4 ? targetUsername.substring(0, 2) + '****' + targetUsername.substring(targetUsername.length - 2) : targetUsername.substring(0, 1) + '***';
                await syncService.sendChatMessage('HỆ THỐNG', `Người chơi ${maskedUser} vừa vượt link ${session.task_name} thành công (+${session.reward} Điểm).`, true);
            }

            setTimeout(() => {
              window.location.hash = 'free';
              window.location.reload(); 
            }, 3000);
        } else {
            setStatus('error');
            setErrorMSG('Lỗi xác nhận. Không tìm thấy phiên hoặc đã hết hạn.');
        }
    } catch (e) {
        setStatus('error');
        setErrorMSG('Lỗi kết nối máy chủ.');
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-black">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500 font-black text-xl tracking-tight italic">
            <ShieldCheck size={28} />
            VERIFYHUB
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-blue-500 uppercase tracking-widest">Trang chủ</a>
            <a href="#" className="hover:text-blue-500 uppercase tracking-widest">Tin tức</a>
            <a href="#" className="hover:text-blue-500 uppercase tracking-widest">Hỗ trợ</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        
        {/* MAIN ARTICLE CONTENT */}
        <div className="space-y-6">
          <div className="glass-morphism rounded-3xl p-8 border border-gray-200 shadow-sm">
            
            {/* THE VERIFICATION COMPONENT */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-2xl text-center mb-8">
              {status === 'checking' && (
                <div className='flex flex-col items-center gap-4 py-6'>
                  <Loader2 className='animate-spin text-blue-500' size={48} />
                  <h3 className='font-black text-xl text-black'>Hệ thống đang kiểm tra bảo mật...</h3>
                  <p className="text-sm text-slate-400">Quét IP, phát hiện VPN/Proxy/Bot. Vui lòng đợi trong giây lát.</p>
                </div>
              )}
              {status === 'error' && (
                  <div className='flex flex-col items-center gap-4 py-6'>
                      <AlertCircle className='text-rose-500' size={48} />
                      <h3 className='font-black text-xl text-black'>Từ chối truy cập!</h3>
                      <p className='font-bold text-rose-500 bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20'>{errorMSG}</p>
                      <button onClick={() => window.location.hash = 'free'} className='mt-4 bg-white text-black rounded-xl px-8 py-3 font-bold uppercase tracking-widest hover:bg-white'>Quay lại Web chính</button>
                  </div>
              )}
              {status === 'valid' && (
                  <div className='flex flex-col items-center gap-4 py-6 text-black'>
                      <CheckCircle className='text-emerald-500' size={48} />
                      <h3 className='font-black text-xl tracking-tight'>Phiên làm việc hợp lệ!</h3>
                      <p className="text-sm text-slate-400 mb-2">Bạn đã có thể xác nhận hoàn thành nhiệm vụ.</p>
                      <button 
                        onClick={handleConfirm} 
                        className='bg-emerald-600 text-white hover:bg-emerald-500 rounded-2xl px-10 py-5 font-black w-full max-w-md text-lg transition-all shadow-lg shadow-emerald-900/40 uppercase tracking-widest cursor-pointer'
                      >
                        Xác Nhận Hoàn Thành
                      </button>
                  </div>
              )}
              {status === 'confirmed' && (
                  <div className='flex flex-col items-center gap-4 py-6 text-black'>
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mb-2">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className='font-black text-xl tracking-tight'>Thành công!</h3>
                      <p className="text-sm font-bold text-blue-400">Hệ thống đang chuyển hướng bạn về lại trang nhiệm vụ...</p>
                  </div>
              )}
            </div>

            <article className="prose prose-invert prose-slate max-w-none">
              <h1 className="text-3xl font-black mb-4 text-black tracking-tight">Tầm quan trọng của việc kiểm tra bảo mật truy cập</h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider mb-8">
                <FileText size={16} /> Ngày đăng: 24/10/2025
              </div>
              <p className="text-slate-400">Môi trường mạng hiện nay đang đối mặt với nhiều nguy cơ. Do sự phát triển của các công cụ ẩn danh (VPN, Proxy) và mạng botnet, việc xác thực "người dùng thật" (Proof of Human) là vô cùng quan trọng đối với các hệ thống phân phối nội dung và quảng cáo.</p>
              
              <h2 className="text-xl font-bold mt-8 mb-4 text-slate-100 italic">1. Tại sao phải cấm VPN và Proxy?</h2>
              <p className="text-slate-400">Việc sử dụng VPN nhằm che giấu địa chỉ IP thực làm ảnh hưởng tới độ chính xác của các thuật toán phân bổ lưu lượng truy cập. Trình duyệt của bạn sẽ bị phân tích sâu hơn để đảm bảo tính minh bạch.</p>
              
              <h2 className="text-xl font-bold mt-8 mb-4 text-slate-100 italic">2. Mức độ an toàn thông tin & Định danh</h2>
              <p className="text-slate-400">Chúng tôi sử dụng công nghệ định danh vân tay (Fingerprint) để nhận diện thiết bị duy nhất. Điều này giúp ngăn chặn việc chia sẻ thiết bị hoặc IP nhằm gian lận hạn mức nhiệm vụ. Hệ thống chỉ kiểm tra độ phân giải IP và mức độ rủi ro (Fraud Score) từ địa chỉ mạng của bạn.</p>
            </article>

          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-6">
          <div className="bg-white border border-gray-200 text-black p-6 rounded-3xl shadow-lg">
             <h3 className="font-black text-lg uppercase tracking-widest mb-4 italic">Hỗ trợ nhanh</h3>
             <p className="text-slate-400 text-sm mb-4 leading-relaxed">Nếu bạn gặp khó khăn trong quá trình làm nhiệm vụ, hãy báo cáo để được xử lý ngay.</p>
             <button className="w-full bg-white hover:bg-white py-3 rounded-xl font-bold text-sm transition-colors uppercase flex items-center justify-center gap-2 text-black">
               Gửi báo cáo lỗi <ChevronRight size={16}/>
             </button>
          </div>

          <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm hidden md:block">
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-right mb-2">HỆ THỐNG AN TOÀN</div>
            <div className="w-full h-[300px] bg-white rounded-xl flex flex-col items-center justify-center text-slate-500 border border-dashed border-gray-200">
               <span className="font-bold text-xs uppercase text-center px-4">ĐANG QUÉT MỨC ĐỘ RỦI RO CỦA TRÌNH DUYỆT</span>
               <div className="mt-4 w-12 h-12 rounded-full border-2 border-t-blue-500 border-gray-200 animate-spin"></div>
            </div>
          </div>
        </aside>

      </main>

      {/* FOOTER */}
      <footer className="bg-white text-slate-500 py-8 text-center text-sm border-t border-gray-200 mt-auto">
        <p className="font-bold tracking-widest">© 2026 Vuitask,online.</p>
        <p className="mt-2 text-xs opacity-50">Website được sử dụng cho mục đích xác nhận hoàn thành nhiệm vụ từ đối tác Vuitask.online.</p>
      </footer>
    </div>
  );
}
