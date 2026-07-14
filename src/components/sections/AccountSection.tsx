import { useState, useEffect } from 'react';
import { UserCircle, Save, CheckCircle2, Coins, Gem, CreditCard, History, Edit2, ArrowRightLeft, Sparkles } from 'lucide-react';
import { syncService } from '../../lib/syncService';

export default function AccountSection({ 
  username,
  exchangeHistory = [],
  depositHistory = [],
  withdrawRequests = [],
  vndBalance = 0,
  pointsBalance = 0,
  setVndBalance,
  setPointsBalance,
  showModal,
  addActivityLog
}: { 
  username: string,
  exchangeHistory?: any[],
  depositHistory?: any[],
  withdrawRequests?: any[],
  vndBalance?: number,
  pointsBalance?: number,
  setVndBalance?: (val: number) => void,
  setPointsBalance?: (val: number) => void,
  showModal?: (title: string, msg: string, icon?: any, type?: 'info' | 'confirm' | 'action', onAction?: (() => void) | null, actionLabel?: string) => void,
  addActivityLog?: (user: string, action: string, amount: string, type: 'mod' | 'deposit' | 'system') => void
}) {
  const [ffId, setFfId] = useState('');
  const [lqUid, setLqUid] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [historyTab, setHistoryTab] = useState<'mod' | 'deposit' | 'withdraw'>('withdraw');

  // Converter states
  const [exchangeVnd, setExchangeVnd] = useState<number | ''>('');
  const [isExchanging, setIsExchanging] = useState(false);

  useEffect(() => {
    const fetchGameIds = async () => {
        const profile = await syncService.getProfile(username);
        if (profile) {
            if (profile.ff_id) setFfId(profile.ff_id);
            if (profile.lq_uid) setLqUid(profile.lq_uid);
            if (profile.ff_id || profile.lq_uid) {
                setIsEditing(false);
            }
        }
    };
    fetchGameIds();
  }, [username]);

  const handleSave = async () => {
    await syncService.updateProfileGameIds(username, ffId, lqUid);
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
    }, 1000);
  };

  const handleConvertVndToPoints = async () => {
    if (!exchangeVnd || Number(exchangeVnd) <= 0) {
      showModal?.("Thông báo", "Vui lòng nhập số VNĐ hợp lệ cần chuyển đổi!");
      return;
    }
    const vndToExchange = Math.floor(Number(exchangeVnd));
    if (vndToExchange > vndBalance) {
      showModal?.("Số dư không đủ", `Số dư ví chính không đủ để đổi. Hiện có ${vndBalance.toLocaleString()} VNĐ.`);
      return;
    }

    setIsExchanging(true);
    try {
      const addedPoints = vndToExchange * 5;
      const newVnd = vndBalance - vndToExchange;
      const newPoints = pointsBalance + addedPoints;

      // Update full-stack database entries
      await syncService.updateBalance(username, {
        vnd_balance: newVnd,
        points_balance: newPoints
      });

      // Write activity log
      if (addActivityLog) {
         addActivityLog(
           username, 
           `Quy đổi số dư sang Điểm: ${vndToExchange.toLocaleString()} VNĐ`, 
           `+${addedPoints.toLocaleString()} Điểm`, 
           'deposit'
         );
      }

      // Update local states
      setVndBalance?.(newVnd);
      setPointsBalance?.(newPoints);
      
      setExchangeVnd('');
      showModal?.("Thành công!", `Đã quy đổi ${vndToExchange.toLocaleString()} VNĐ sang +${addedPoints.toLocaleString()} Điểm nhiệm vụ thành công (tỷ lệ 1 VNĐ = 5 Điểm)!`, CheckCircle2);
    } catch (err: any) {
      showModal?.("Thất bại", err.message || "Lỗi quy đổi, thử lại sau!");
    } finally {
      setIsExchanging(false);
    }
  };

  return (
    <section className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold uppercase border-l-4 border-green-400 pl-3 flex items-center gap-2">
          <UserCircle className="text-green-400" size={24} />
          THÔNG TIN TÀI KHOẢN VÀ VÍ
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`bg-white backdrop-blur-md rounded-[1.25rem] border border-black flex transition-all duration-300 ${!isEditing ? 'p-4 items-center justify-between' : 'p-5 flex-col justify-between'}`}>
          {!isEditing ? (
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2 text-black min-w-0">
                <CheckCircle2 className="text-green-500 flex-shrink-0" size={18} />
                <span className="text-xs font-bold truncate">
                  Đã thêm thông tin game: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{ffId || 'Chưa liên kết'}</span> / <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{lqUid || 'Chưa liên kết'}</span>
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-black text-xs font-bold py-1.5 px-3 rounded-lg border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer whitespace-nowrap"
              >
                <Edit2 size={12} />
                Sửa
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-bold uppercase text-black mb-3 border-b border-gray-200 pb-2">CHỈNH SỬA THÔNG TIN</h3>
                <p className="text-gray-600 mb-4 text-xs">
                  Vui lòng nhập chính xác thông tin để hệ thống duyệt đơn rút điểm.
                </p>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">ID Nhận KC (Free Fire)</label>
                    <input 
                      type="text"
                      value={ffId}
                      onChange={(e) => setFfId(e.target.value)}
                      placeholder="Nhập ID FF..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">UID / Tên NV (Liên Quân)</label>
                    <input 
                      type="text"
                      value={lqUid}
                      onChange={(e) => setLqUid(e.target.value)}
                      placeholder="Nhập UID/Tên LQ..."
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-black placeholder:text-gray-600 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-black text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-[0.98] mt-5"
              >
                {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {isSaved ? 'Đã Lưu Thông Tin' : 'Lưu Thông Tin'}
              </button>
            </>
          )}
        </div>

        <div className="space-y-4 flex flex-col">
          {/* VNĐ Wallet */}
          <div className="glass-morphism p-5 rounded-[1.25rem] flex flex-col justify-between items-center relative overflow-hidden border border-green-500/30">
              <div className="absolute top-0 right-0 px-2 py-1 bg-green-500/20 text-green-500 rounded-bl-xl text-[9px] font-bold tracking-wider">
                SỐ DƯ CHÍNH
              </div>
              <div className="flex w-full items-center justify-between mt-1">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-500/10 rounded-xl text-green-500 text-xl">
                        <Coins size={24} />
                    </div>
                    <div>
                        <p className="text-gray-600 text-xs">VNĐ (Mua VIP Store)</p>
                        <h2 className="text-2xl font-bold text-black">{vndBalance?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">VNĐ</span></h2>
                    </div>
                </div>
              </div>
          </div>

          {/* Điểm Wallet */}
          <div className="glass-morphism p-5 rounded-[1.25rem] flex flex-col justify-between items-center relative overflow-hidden border border-orange-500/30">
              <div className="absolute top-0 right-0 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-bl-xl text-[9px] font-bold tracking-wider">
                SỐ DƯ ĐIỂM
              </div>
              <div className="flex w-full items-center justify-between mt-1">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500 text-xl">
                        <Coins size={24} />
                    </div>
                    <div>
                        <p className="text-gray-600 text-xs">Điểm (Đổi Mod Free)</p>
                        <h2 className="text-2xl font-bold text-black">{pointsBalance?.toLocaleString() || 0} <span className="text-sm font-normal text-gray-500">Điểm</span></h2>
                    </div>
                </div>
              </div>
          </div>

          {/* QUY ĐỔI VNĐ SANG ĐIỂM (1:5) */}
          <div className="glass-morphism p-5 rounded-[1.25rem] border border-black flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-yellow-500/5 via-amber-500/5 to-amber-500/10">
              <div className="absolute top-0 right-0 px-2.5 py-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-black rounded-bl-xl text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
                <Sparkles size={10} className="animate-spin" /> QUY ĐỔI 1:5
              </div>
              
              <div className="mt-1 space-y-3.5">
                  <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-yellow-400 text-black rounded-xl text-lg font-black shrink-0">
                          <ArrowRightLeft size={18} />
                      </div>
                      <div>
                          <h4 className="text-sm font-black text-black leading-tight uppercase">QUY ĐỔI VNĐ SANG ĐIỂM</h4>
                          <p className="text-[10px] text-gray-500 font-bold">Quy đổi số dư chính sang điểm làm nhiệm vụ</p>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <div className="relative">
                          <input 
                            type="number"
                            value={exchangeVnd}
                            onChange={(e) => setExchangeVnd(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            placeholder="Nhập số VNĐ muốn quy đổi..."
                            className="w-full bg-white border border-black rounded-xl pl-3 pr-16 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black transition-all font-bold"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500">
                              VNĐ
                          </div>
                      </div>

                      {/* Real-time preview */}
                      {exchangeVnd !== '' && exchangeVnd > 0 && (
                          <div className="bg-yellow-400/10 border border-yellow-500/30 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-top-1">
                              <span className="text-[10px] font-bold text-amber-700 uppercase">Điểm nhận tương đương</span>
                              <span className="text-sm font-black text-amber-600 font-mono">
                                  +{(Number(exchangeVnd) * 5).toLocaleString()} Điểm
                              </span>
                          </div>
                      )}
                  </div>

                  <button
                    onClick={handleConvertVndToPoints}
                    disabled={isExchanging}
                    className="w-full h-10 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black text-xs font-black rounded-xl border border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    {isExchanging ? 'Đang Xử Lý Quy Đổi...' : 'XÁC NHẬN CHUYỂN ĐỔI'}
                  </button>
              </div>
          </div>
        </div>
      </div>

      <div className="glass-morphism rounded-[1.25rem] overflow-hidden mt-6">
            <div className="p-3 px-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3 bg-white text-sm font-bold">
               <span>Lịch Sử Giao Dịch</span>
               <div className="flex bg-white p-1 rounded-xl overflow-x-auto max-w-full">
                 <button 
                  onClick={() => setHistoryTab('withdraw')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${historyTab === 'withdraw' ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:text-black'}`}
                 >
                   <Gem size={12} /> <span>RÚT ĐIỂM</span>
                 </button>
                 <button 
                  onClick={() => setHistoryTab('deposit')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${historyTab === 'deposit' ? 'bg-purple-600 text-white' : 'text-gray-600 hover:text-black'}`}
                 >
                   <CreditCard size={12} /> <span>NẠP TIỀN</span>
                 </button>
                 <button 
                  onClick={() => setHistoryTab('mod')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-2 whitespace-nowrap ${historyTab === 'mod' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-black'}`}
                 >
                   <History size={12} /> <span>ĐỔI MOD</span>
                 </button>
               </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-white text-[10px] text-gray-600 uppercase">
                            <th className="px-3 py-2.5">Thời gian</th>
                            <th className="px-3 py-2.5">Nội dung</th>
                            <th className="px-3 py-2.5">Giá trị</th>
                            <th className="px-3 py-2.5">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                        {historyTab === 'mod' && (
                          exchangeHistory?.length === 0 ? (
                              <tr>
                                  <td colSpan={4} className="px-3 py-6 text-center text-gray-500 italic">
                                      Chưa có giao dịch đổi Mod nào...
                                  </td>
                              </tr>
                          ) : (
                              exchangeHistory?.map((history) => (
                                  <tr key={history.id} className="hover:bg-white transition-colors">
                                      <td className="px-3 py-2.5 font-mono text-[10px] text-gray-600">{history.time}</td>
                                      <td className="px-3 py-2.5">
                                          <p className="font-bold text-black uppercase truncate max-w-[120px] sm:max-w-xs">{history.itemName}</p>
                                      </td>
                                      <td className="px-3 py-2.5 text-red-400 font-bold">-{history.price}</td>
                                      <td className="px-3 py-2.5">
                                          <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-green-500/20">
                                              {history.status}
                                          </span>
                                      </td>
                                  </tr>
                              ))
                          )
                        )}
                        {historyTab === 'deposit' && (
                          depositHistory?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 italic">
                                    Chưa có giao dịch nạp tiền nào...
                                </td>
                            </tr>
                          ) : (
                            depositHistory?.map((history) => (
                                <tr key={history.id} className="hover:bg-white transition-colors">
                                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-600">{history.time}</td>
                                    <td className="px-3 py-2.5">
                                        <p className="font-bold text-black uppercase truncate max-w-[120px] sm:max-w-xs">{history.method === 'bank' ? 'Ngân hàng' : 'Thẻ cào'}</p>
                                    </td>
                                    <td className="px-3 py-2.5 text-green-400 font-bold">+{history.amount?.toLocaleString()} VNĐ</td>
                                    <td className="px-3 py-2.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${history.status === 'thành công' ? 'bg-green-500/10 text-green-500 border-green-500/20' : (history.status === 'từ chối' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20')}`}>
                                            {history.status?.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                          )
                        )}
                        {historyTab === 'withdraw' && (
                          withdrawRequests?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 italic">
                                    Chưa có đơn rút điểm nào...
                                </td>
                            </tr>
                          ) : (
                            withdrawRequests?.map((history) => (
                                <tr key={history.id} className="hover:bg-white transition-colors">
                                    <td className="px-3 py-2.5 font-mono text-[10px] text-gray-600">{history.time}</td>
                                    <td className="px-3 py-2.5">
                                        <p className="font-bold text-black uppercase truncate max-w-[120px] sm:max-w-xs">{history.itemName}</p>
                                    </td>
                                    <td className="px-3 py-2.5 text-cyan-400 font-bold">-{history.price}</td>
                                    <td className="px-3 py-2.5">
                                        {history.status === 'Thành công' && history.cardCode ? (
                                           <div className="flex items-center gap-1.5">
                                              <span className="bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded text-[9px] font-semibold border border-green-500/20">ĐÃ DUYỆT</span>
                                              <button onClick={() => {
                                                  navigator.clipboard.writeText(history.cardCode);
                                                  alert("Đã Copy thẻ: " + history.cardCode);
                                              }} className="px-1.5 py-0.5 bg-white hover:bg-white rounded text-[9px] transition-colors flex items-center text-black">XEM THẺ</button>
                                           </div>
                                        ) : (
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${history.status === 'Thành công' ? 'bg-green-500/10 text-green-500 border-green-500/20' : (history.status === 'Từ chối' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20')}`}>
                                              {history.status?.toUpperCase() || 'CHỜ DUYỆT'}
                                          </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                          )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </section>
  );
}

