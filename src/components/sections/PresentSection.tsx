import React, { useState, useEffect } from 'react';
import { Gift, Copy, Check, Users, ShieldAlert, Award, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { syncService } from '../../lib/syncService';

export default function PresentSection({ 
  username, 
  showModal 
}: { 
  username: string; 
  showModal?: (title: string, msg: string, icon?: any, type?: 'info' | 'confirm' | 'action') => void;
}) {
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheater, setIsCheater] = useState(false);
  const [refCode, setRefCode] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const referralLink = `${window.location.origin}/#register?ref=${refCode || '.....'}`;

  const loadData = async () => {
    setLoading(true);
    try {
      // Load user profile to check cheat/ban status
      const profile = await syncService.getProfile(username);
      if (profile) {
        setIsCheater(!!profile.is_cheater || !!profile.points_locked || !!profile.vnd_locked);
      }
      
      // Load and fetch referral code logic (random 5 digits)
      const code = await syncService.getReferralCode(username);
      setRefCode(code);
      
      // Fetch successful refer list
      const data = await syncService.getReferralsAndCommissions(username);
      setReferrals(data);
    } catch (e) {
      console.error('Error loading PresentSection data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const code = await syncService.generateReferralCode(username);
      setRefCode(code);
      if (showModal) {
        showModal("Làm mới mã thành công", `Mã giới thiệu mới gồm 5 chữ số của bạn là: ${code}`, Gift);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadData();
    }
  }, [username]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCommissions = referrals.reduce((sum, item) => sum + item.commissionEarned, 0);

  return (
    <section className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300 bg-white min-h-screen text-black">
      {/* Title */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <h2 className="text-xl font-bold uppercase border-l-4 border-amber-500 pl-3 flex items-center gap-2">
          <Gift className="text-amber-500 animate-pulse" size={24} />
          GIỚI THIỆU BẠN BÈ - NHẬN QUÀ TRỌN ĐỜI
        </h2>
        <button 
          onClick={loadData} 
          className="p-2 border border-gray-200 hover:border-black rounded-lg transition-all active:scale-95 duration-200 text-gray-500 hover:text-black cursor-pointer"
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {isCheater && (
        <div className="bg-red-50 border-2 border-red-500 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4 text-center md:text-left shadow-md">
          <ShieldAlert className="text-red-600 animate-bounce shrink-0" size={48} />
          <div>
            <h3 className="font-extrabold text-red-600 text-lg uppercase">TÀI KHOẢN ĐÃ BỊ KHÓA SỐ DƯ VĨNH VIỄN</h3>
            <p className="text-red-700 text-sm mt-1 font-medium">
              Phát hiện gian lận, dùng tài khoản clone, bot, giả lập hoặc tự giới thiệu để trục lợi điểm từ sự kiện giới thiệu bạn bè. 
              Mọi khiếu nại liên quan đến buff điểm bẩn sẽ không được giải quyết. Quyết định tự động bởi Robot AI bảo vệ 100%.
            </p>
          </div>
        </div>
      )}

      {/* Intro explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left main explanation card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="absolute right-0 bottom-0 opacity-10 font-black text-9xl transform translate-x-10 translate-y-10 select-none text-amber-500">10%</div>
          <div className="space-y-4">
            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full tracking-wider">CHƯƠNG TRÌNH ĐẠI SỨ</span>
            <h3 className="text-2xl font-black text-amber-950 tracking-tight leading-tight">CHIA SẺ LIÊN KẾT<br/>NHẬN HOA HỒNG TRỌN ĐỜI</h3>
            <p className="text-amber-900 text-sm leading-relaxed font-medium">
              Giới thiệu bạn bè của bạn tham gia làm nhiệm vụ kiếm điểm tại <strong className="text-orange-600">MDZPX</strong>. 
              Bạn sẽ nhận ngay <strong className="text-amber-600 font-extrabold">10% Hoa Hồng Điểm</strong> trọn đời từ mỗi Task points mà người bạn giới thiệu hoàn thành thành công!
            </p>
          </div>
          <div className="mt-6 border-t border-amber-200/40 pt-4 text-xs font-semibold text-amber-900 italic">
            * Nhận điểm trực tiếp không giới hạn số người, không hết hạn.
          </div>
        </div>

        {/* Right referral stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col justify-between shadow-sm hover:border-gray-200 transition-all">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
              <Users size={20} />
            </div>
            <div className="mt-4">
              <p className="text-gray-500 text-xs font-extrabold uppercase tracking-wider">ĐÃ GIỚI THIỆU</p>
              <p className="text-3xl font-black text-black mt-1 font-mono">{referrals.length.toLocaleString()}</p>
              <p className="text-gray-600 text-[10px] mt-1 font-medium">Thành viên đăng ký mới</p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-100 p-6 rounded-3xl flex flex-col justify-between shadow-sm hover:border-gray-200 transition-all">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
              <Award size={20} />
            </div>
            <div className="mt-4">
              <p className="text-gray-500 text-xs font-extrabold uppercase tracking-wider">HOA HỒNG NHẬN</p>
              <p className="text-3xl font-black text-emerald-600 mt-1 font-mono">+{totalCommissions.toLocaleString()}</p>
              <p className="text-gray-600 text-[10px] mt-1 font-medium">Điểm thưởng thụ động</p>
            </div>
          </div>
        </div>
      </div>

      {/* Copy link container card */}
      <div className="bg-white border border-gray-200 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h4 className="font-bold text-base text-gray-900">Liên Kết Giới Thiệu Của Bạn</h4>
            <p className="text-gray-500 text-xs mt-1">Copy link gửi cho bạn bè hoặc chia sẻ lên các hội nhóm mạng xã hội.</p>
          </div>
          <button
            onClick={handleRegenerateCode}
            disabled={generating}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50 align-middle"
          >
            <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
            Đổi Mã Mới (5 Chữ Số)
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center gap-2 select-all overflow-hidden min-w-0">
            <span className="text-gray-700 text-sm font-mono truncate">{referralLink}</span>
          </div>
          <button 
            onClick={handleCopy}
            className={`px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 border shadow-sm transition-all duration-200 active:scale-95 cursor-pointer text-sm tracking-wider uppercase ${
              copied 
              ? "bg-emerald-500 text-white border-emerald-500" 
              : "bg-black text-white hover:bg-gray-800 border-black"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                ĐÃ SAO CHÉP
              </>
            ) : (
              <>
                <Copy size={16} />
                SAO CHÉP LINK
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic automated system anti-cheat information card */}
      <div className="bg-orange-50 border border-orange-200 p-6 rounded-3xl space-y-3">
        <div className="flex items-center gap-2 text-orange-950">
          <AlertTriangle className="text-orange-600 shrink-0" size={24} />
          <h4 className="font-black text-base uppercase tracking-tight">HỆ THỐNG AN NINH & CHỐNG GIAN LẬN 100%</h4>
        </div>
        <div className="text-sm text-orange-900 space-y-2 leading-relaxed">
          <p className="font-bold">
            🛡️ BẢO VỆ CHỐNG CHIẾM ĐOẠT ĐIỂM (ANTI-CHEAT):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 font-medium text-xs">
            <li>Hệ thống <strong>Robot AI chống gian lận</strong> tự động kiểm tra dấu vân tay trình duyệt (Computer/Phone Browser Fingerprint), thông tin phần cứng cùng IP của từng tài khoản được giới thiệu và người giới thiệu.</li>
            <li>Nghiêm cấm hành vi <strong>tự tạo acc clone</strong>, buff bẩn chéo, đổi IP ảo, hoặc sử dụng phần mềm giả lập tự nhấp liên kết giới thiệu của bản thân.</li>
            <li>Nếu phát hiện trùng thiết bị (chung Fingerprint) có quan hệ giới thiệu ➔ <strong>Hệ thống sẽ khóa vĩnh viễn 100% số dư</strong> (cả số Điểm và số dư VNĐ) của toàn bộ các tài khoản liên đới ngay lập tức.</li>
          </ul>
        </div>
      </div>

      {/* Referral history database log table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 uppercase">MẠNG LƯỚI GIỚI THIỆU ({referrals.length})</h3>
            <p className="text-xs text-gray-500 mt-1">Lịch sử thống kê bạn bè đã mời thành công thuộc mạng lưới của bạn.</p>
          </div>
          <span className="text-[10px] uppercase font-bold text-gray-600 bg-white px-2 py-1 rounded border tracking-wider">Cập nhật thời gian thực</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center gap-2.5">
            <RefreshCw className="animate-spin text-gray-400" size={28} />
            <span className="font-semibold">Đang liên kết dữ liệu mạng lưới...</span>
          </div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <p className="font-extrabold text-gray-400 text-lg">Chưa có người giới thiệu thành công</p>
            <p className="text-xs max-w-sm mx-auto">Chia sẻ liên kết đại sứ của bạn tới bạn bè hoặc các mạng xã hội (Facebook, YouTube, Telegram) để bắt đầu nhận 10% điểm trọn đời!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-700 uppercase bg-gray-50 border-b border-gray-200 font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">BẠN BÈ</th>
                  <th scope="col" className="px-6 py-4">NGÀY THAM GIA</th>
                  <th scope="col" className="px-6 py-4 text-center">SỐ LINK HOÀN THÀNH</th>
                  <th scope="col" className="px-6 py-4 text-right">ĐÃ KIẾM CHO BẠN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {referrals.map((item, index) => {
                  const maskedName = item.referee.length > 5 
                    ? item.referee.substring(0, 2) + "****" + item.referee.substring(item.referee.length - 2)
                    : item.referee.substring(0, 1) + "***";
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900 font-bold">
                        @{maskedName}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {item.registeredAt}
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold text-gray-900">
                        {item.tasksCount} link(s)
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-bold font-mono">
                        +{item.commissionEarned.toLocaleString()} Điểm
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
