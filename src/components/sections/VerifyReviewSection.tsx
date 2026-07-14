import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronLeft, MapPin, AppWindow, Plane, Smartphone, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { syncService } from '../../lib/syncService';
import { AdBanner, PopunderAd } from '../AdBanner';

interface VerifyReviewProps {
}

export function VerifyReviewSection({ }: VerifyReviewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targetUsername, setTargetUsername] = useState<string | null>(null);
  
  const [status, setStatus] = useState<'checking' | 'input' | 'submitting' | 'success' | 'error'>('checking');
  const [errorMSG, setErrorMSG] = useState('');
  
  const [reviewType, setReviewType] = useState<string>('');
  const [reviewUrl, setReviewUrl] = useState<string>('');
  
  useEffect(() => {
    let sid = null;
    let tuser = null;
    const urlParams = new URLSearchParams(window.location.search);
    sid = urlParams.get('code');
    tuser = urlParams.get('username') || urlParams.get('uuid');

    if (!sid || !tuser) {
      const hash = window.location.hash;
      const queryStartIndex = hash.indexOf('?');
      if (queryStartIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(queryStartIndex));
        if (!sid) sid = hashParams.get('code');
        if (!tuser) tuser = hashParams.get('username') || hashParams.get('uuid');
      }
    }

    if (tuser) tuser = tuser.replace(/\/.*$/, '').replace(/\?.*$/, '').replace(/&.*$/, '');
    
    setSessionId(sid);
    setTargetUsername(tuser);

    if (!sid || !tuser) {
      setStatus('error');
      setErrorMSG('Thiếu mã phiên làm việc. Vui lòng truy cập lại từ trang nhiệm vụ.');
      return;
    }

    const checkSession = async () => {
        try {
            const session = await syncService.getTaskSession(sid!);
            let isValid = false;
            
            if (session && session.status === 'Đang làm') {
               const actualUuid = await syncService.getUserUuid(session.user_id);
               if (
                   (actualUuid && tuser && actualUuid.toLowerCase() === tuser.toLowerCase()) || 
                   (session.user_id && tuser && session.user_id.toLowerCase() === tuser.toLowerCase())
               ) {
                   isValid = true;
               }
            }

            if (isValid && session) {
                const now = new Date().getTime();
                const createdAt = new Date(session.created_at).getTime();
                const diffMinutes = (now - createdAt) / (1000 * 60);

                if (diffMinutes > 15) {
                    await syncService.updateTaskStatus(sid!, 'Đã hủy');
                    setStatus('error');
                    setErrorMSG('Phiên làm việc đã hết hạn (tối đa 15 phút).');
                } else {
                    setStatus('input');
                }
            } else {
                setStatus('error');
                setErrorMSG('Phiên làm việc không tồn tại, đã hết hạn hoặc không khớp hệ thống.');
            }
        } catch (e) {
            setStatus('error');
            setErrorMSG('Lỗi kết nối kiểm tra dữ liệu.');
        }
    };
    
    checkSession();
  }, []);

  const reviewTypes = [
     { id: 'trip', label: 'RV TRIP', icon: Plane, color: 'text-blue-500', reward: 10000, display: '2000đ' },
     { id: 'map', label: 'RV MAP', icon: MapPin, color: 'text-green-500', reward: 5000, display: '1000đ' },
     { id: 'app', label: 'RV APP', icon: AppWindow, color: 'text-purple-500', reward: 4000, display: '800đ' },
     { id: 'download', label: 'TẢI APP', icon: Smartphone, color: 'text-orange-500', reward: 2500, display: '500đ' }
  ];

  const handleSubmit = async () => {
    if (!reviewType) {
       alert("Vui lòng chọn loại Review!");
       return;
    }
    if (!reviewUrl || reviewUrl.length < 5) {
       alert("Vui lòng điền Link bằng chứng hợp lệ!");
       return;
    }
    
    setStatus('submitting');
    try {
        const selectedType = reviewTypes.find(t => t.id === reviewType);
        const reward = selectedType ? selectedType.reward : 1000;
        
        const success = await syncService.submitReviewTask(sessionId!, reviewType, reviewUrl, reward);
        if (success) {
            setStatus('success');
            
            setTimeout(() => {
              window.location.hash = 'free';
              window.location.reload(); 
            }, 3000);
        } else {
            setStatus('error');
            setErrorMSG('Có lỗi xảy ra khi nộp yêu cầu duyệt.');
        }
    } catch {
       setStatus('error');
       setErrorMSG('Lỗi mạng khi nộp hệ thống!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <PopunderAd />
      <div className="w-full max-w-4xl flex flex-col items-center">
        <AdBanner dataKey="10288221afcf59c7fab355761ab7fa8b" width={728} height={90} />
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative my-4">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-orange-500" />
        
        <div className="p-8">
           <div className="flex items-center space-x-4 mb-8">
             <button onClick={() => window.location.hash = 'free'} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600">
                <ChevronLeft size={20} />
             </button>
             <div>
               <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gửi Bằng Chứng</h1>
               <p className="text-sm font-medium text-slate-500">Nhiệm vụ Duyệt Thủ Công</p>
             </div>
           </div>

           {status === 'checking' && (
             <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-red-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Đang kiểm tra phiên làm việc...</p>
             </div>
           )}

           {status === 'error' && (
             <div className="bg-red-50 text-red-700 p-6 rounded-2xl flex flex-col items-center space-y-4 text-center">
                 <AlertCircle size={48} className="text-red-500" />
                 <div>
                    <h3 className="font-bold text-lg mb-1">Xác thực thất bại</h3>
                    <p className="text-sm">{errorMSG}</p>
                 </div>
                 <button onClick={() => window.location.hash = 'free'} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm">
                    Quay lại
                 </button>
             </div>
           )}

           {status === 'success' && (
             <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex flex-col items-center space-y-4 text-center">
                 <CheckCircle2 size={48} className="text-emerald-500" />
                 <div>
                    <h3 className="font-bold text-lg mb-1">Gửi thành công!</h3>
                    <p className="text-sm">Yêu cầu của bạn đang được Admin duyệt thủ công. Điểm sẽ được cộng khi Admin xác nhận hoàn lệ.</p>
                 </div>
                 <p className="text-sm mt-3 animate-pulse text-emerald-600 font-medium">Đang chuyển hướng...</p>
             </div>
           )}

           {(status === 'input' || status === 'submitting') && (
             <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                   <p className="text-sm text-orange-800 font-medium leading-relaxed">
                      Xin chúc mừng bạn đã vượt qua Link xác nhận!
                      <br/>Bây giờ, vui lòng <strong>chọn thể loại</strong> và <strong>dán LINK</strong> bạn vừa nộp ở bước trước vào đây để hoàn thành.
                   </p>
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-bold text-slate-700 block">Chọn thể loại bạn đã làm</label>
                   <div className="grid grid-cols-2 gap-3">
                      {reviewTypes.map(t => (
                         <div 
                           key={t.id}
                           onClick={() => setReviewType(t.id)}
                           className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${reviewType === t.id ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                         >
                            <div className="flex items-center space-x-2">
                              <t.icon size={20} className={reviewType === t.id ? 'text-red-600' : t.color} />
                              <span className="font-bold text-sm tracking-wide">{t.label}</span>
                            </div>
                            <div className={`text-[11px] font-bold px-2 py-1 rounded-md ${reviewType === t.id ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-500'}`}>
                               +{t.reward} Điểm (={t.display})
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700 block">Link Bằng Chứng</label>
                   <input
                     type="url"
                     placeholder="https://g.page/review/..."
                     value={reviewUrl}
                     onChange={(e) => setReviewUrl(e.target.value)}
                     className="w-full bg-slate-50 border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 font-medium transition-all"
                   />
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={status === 'submitting'}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                   {status === 'submitting' ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                       <>
                         <Send size={18} />
                         <span>GỬI ADMIN XÉT DUYỆT</span>
                       </>
                   )}
                </button>
             </div>
           )}
        </div>
      </div>
      <AdBanner dataKey="a3930c4058f6ea7a4ff07710093bebcc" width={468} height={60} />
      <AdBanner dataKey="f3953ccabe0373956f3995758b9d8628" width={300} height={250} />
    </div>
  );
}
