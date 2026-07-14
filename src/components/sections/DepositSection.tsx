import React, { useState, useRef } from 'react';
import { Landmark, CreditCard, ArrowLeft, Copy, CheckCircle2, Upload, Loader2, ImagePlus, AlertCircle, Coins, History, Gem, Download } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { supabase } from '../../lib/supabase';
import { syncService } from '../../lib/syncService';

const AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export default function DepositSection({ 
  setActiveTab, 
  username, 
  showModal, 
  setVndBalance, 
  setDepositRequests, 
  setDepositHistory,
  addActivityLog
}: { 
  setActiveTab: (tab: string) => void, 
  username: string, 
  showModal?: (title: string, msg: string) => void, 
  setVndBalance?: React.Dispatch<React.SetStateAction<number>>, 
  setDepositRequests?: React.Dispatch<React.SetStateAction<any[]>>, 
  setDepositHistory?: React.Dispatch<React.SetStateAction<any[]>>, 
  addActivityLog?: (user: string, action: string, amount: string, type: 'mod' | 'deposit' | 'system') => void
}) {
  const [method, setMethod] = useState<'bank' | 'card'>('bank');
  const [amount, setAmount] = useState<number>(50000);
  
  const [step, setStep] = useState<1 | 2>(1);
  const [orderDetails, setOrderDetails] = useState<{orderId: string, finalAmount: number} | null>(null);
  const [copied, setCopied] = useState(false);

  // States for Bill scanning
  const [scanStatus, setScanStatus] = useState<'idle' | 'verifying' | 'success' | 'manual' | 'error'>('idle');
  const [scanError, setScanError] = useState('');
  const [billImage, setBillImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const finalAmount = method === 'bank' 
    ? amount + (amount * 0.05) 
    : amount - (amount * 0.25);

  const handleConfirm = () => {
    if (!username.trim()) {
      showModal ? showModal('Cần Đăng Nhập', 'Vui lòng đăng nhập để có ID Game/Tên hiển thị!') : alert('Vui lòng đăng nhập để có ID Game/Tên hiển thị!');
      return;
    }

    if (method === 'card') {
      showModal ? showModal('Bảo Trì', 'Hệ thống thẻ cào đang bảo trì, vui lòng sử dụng Ngân hàng!') : alert('Hệ thống thẻ cào đang bảo trì, vui lòng sử dụng Ngân hàng!');
      return;
    }

    const newOrderId = `N${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderDetails({
      orderId: newOrderId,
      finalAmount: finalAmount
    });
    setStep(2);
    setScanStatus('idle');
    setBillImage(null);
    setScanError('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBillImage(url);
      setScanStatus('verifying');
      setScanError('');
      
      try {
        const { data: { text } } = await Tesseract.recognize(file, 'vie+eng');
        
        let isValid = true;
        const missing = [];

        // Normalize text to ignore special chars, spaces, and case
        const normalizedText = text.toUpperCase().replace(/\s+/g, '');
        const amountStr = amount.toString();
        const accountStr = "9612345678";
        const accountNameStr = "HOANGMAIANHVU";
        
        const cleanUsername = username.split('||')[0];
        const transferContentRaw = `MDZPX ${orderDetails?.orderId} ${cleanUsername}`;
        const contentStr = transferContentRaw.toUpperCase().replace(/\s+/g, '');

        if (!normalizedText.includes(contentStr)) {
            isValid = false;
            missing.push('Nội dung chuyển');
        }

        if (!normalizedText.includes(amountStr)) {
            isValid = false;
            missing.push('Số tiền nạp');
        }

        if (!normalizedText.includes(accountStr)) {
            isValid = false;
            missing.push('Số tài khoản nhận');
        }

        if (!normalizedText.includes(accountNameStr)) {
            isValid = false;
            missing.push('Tên người nhận');
        }

        const hasBankKeywords = normalizedText.includes('THÀNHCÔNG') || normalizedText.includes('SUCCESS');
        if (!hasBankKeywords) {
            isValid = false;
            missing.push('Trạng thái Thành Công');
        }

        if (isValid) {
            setScanStatus('success');
        } else {
            setScanError('Bill thiếu/sai thông tin: ' + missing.join(', '));
            handleManualVerification();
        }

      } catch (err) {
         console.error(err);
         setScanError('Hệ thống AI không thể đọc được ảnh. Đã chuyển duyệt thủ công.');
         handleManualVerification();
      }
    }
  };

  const handleManualVerification = async () => {
    setScanStatus('manual');
    if (setDepositRequests && orderDetails) {
        // CALL DB SYNC
        await syncService.createDepositRequest({
          username: username,
          order_id: orderDetails.orderId,
          amount: amount,
          final_amount: orderDetails.finalAmount,
          method: method,
          status: 'đang chờ'
        });

        setDepositRequests(prev => [
            {
                id: Date.now().toString(),
                username: username,
                time: new Date().toLocaleString(),
                amount: amount,
                finalAmount: orderDetails.finalAmount,
                orderId: orderDetails.orderId,
                status: 'đang chờ'
            },
            ...prev
        ]);
        if (setDepositHistory) {
            setDepositHistory(prev => [
                {
                    id: Date.now().toString(),
                    username: username,
                    time: new Date().toLocaleString(),
                    amount: amount,
                    finalAmount: orderDetails.finalAmount,
                    orderId: orderDetails.orderId,
                    status: 'đang chờ'
                },
                ...prev
            ]);
        }
        if (addActivityLog) {
          addActivityLog(username.split('||')[0], `Gửi yêu cầu nạp thủ công: ${orderDetails.orderId}`, `${amount.toLocaleString()} VNĐ`, 'deposit');
        }
    }
  };

  if (step === 2 && orderDetails) {
    // Generate VietQR URL
    const cleanUsername = username.split('||')[0];
    const transferContent = `MDZPX ${orderDetails.orderId} ${cleanUsername}`;
    const qrUrl = `https://img.vietqr.io/image/mb-9612345678-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=HOANG%20MAI%20ANH%20VU`;

    return (
      <section className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
        <div className="max-w-xl mx-auto space-y-6">
            <button onClick={() => setStep(1)} className="flex items-center text-gray-600 hover:text-black transition-colors cursor-pointer">
              <ArrowLeft size={16} className="mr-2" /> Quay lại
            </button>
            <div className="text-center">
                <h2 className="text-2xl font-bold uppercase text-green-400">CHUYỂN KHOẢN THANH TOÁN</h2>
                <p className="text-gray-600 mt-2 text-sm">Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới</p>
            </div>

            <div className="glass-morphism p-5 md:p-6 rounded-[1.25rem] border border-green-500/30 flex flex-col items-center">
                <div className="bg-white p-2 rounded-xl mb-4">
                   <img src={qrUrl} alt="Mã QR Thanh Toán" className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-lg" />
                </div>

                <div className="w-full space-y-3 mb-5">
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Ngân hàng</p>
                    <p className="font-bold text-sm text-black">MBV Bank</p>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl border border-gray-200 flex justify-between items-center group">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Số tài khoản</p>
                      <p className="font-bold text-green-400 text-base">9612345678</p>
                    </div>
                    <button onClick={() => copyToClipboard('9612345678')} className="p-1.5 bg-white hover:bg-white rounded-lg text-gray-700 transition-colors cursor-pointer">
                      {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-yellow-500/50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-0.5 flex items-center">Nội dung chuyển <span className="ml-1 text-red-500 text-[8px]">(Bắt buộc)</span></p>
                      <p className="font-bold text-sm text-black uppercase">{transferContent}</p>
                    </div>
                    <button onClick={() => copyToClipboard(transferContent)} className="p-1.5 bg-white hover:bg-white rounded-lg text-gray-700 transition-colors cursor-pointer">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* XÁC MINH THANH TOÁN */}
                <div className="w-full border-t border-gray-200 pt-4">
                   <h3 className="text-base font-bold text-black text-center mb-3 uppercase">Phương Thức Xác Minh</h3>
                   
                   {scanStatus === 'idle' && (
                     <div className="space-y-3 transition-all duration-300">
                       <input 
                         type="file" 
                         accept="image/*" 
                         className="hidden" 
                         ref={fileInputRef}
                         onChange={handleImageUpload}
                       />
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500 rounded-xl flex items-center justify-center font-bold text-xs text-blue-400 transition-colors shadow-lg shadow-blue-900/20 cursor-pointer"
                       >
                         <ImagePlus size={16} className="mr-2" />
                         TẢI ẢNH BILL LÊN (AUTO DUYỆT 5s)
                       </button>
                       <p className="text-[9px] text-gray-600 text-center italic mt-1.5">Hệ thống sẽ check bill tự động (Trạng thái: Thành công, đúng STK, Số tiền, Nội dung)</p>
                     </div>
                   )}

                   {scanStatus === 'verifying' && (
                     <div className="flex flex-col items-center py-8 space-y-4 animate-in fade-in zoom-in duration-300">
                       <Loader2 size={48} className="text-blue-500 animate-spin" />
                       <p className="text-sm font-bold text-blue-400 animate-pulse">Hệ thống AI đang check bill chuyển khoản...</p>
                       {billImage && <img src={billImage} alt="Bill Preview" className="w-32 h-auto rounded border border-gray-200 opacity-50 mt-4" />}
                     </div>
                   )}

                   {scanStatus === 'success' && (
                     <div className="flex flex-col items-center py-6 bg-green-500/10 border border-green-500/30 rounded-xl animate-in fade-in zoom-in duration-300">
                       <CheckCircle2 size={48} className="text-green-500 mb-3" />
                       <h4 className="text-green-400 font-bold text-lg">Bill Hợp Lệ!</h4>
                       <p className="text-xs text-green-300/70 mt-1 mb-4 text-center px-4">Khớp 100%: Số tiền, Stk, Nội dung, Tên người nhận.</p>
                       <button onClick={async () => { 
                         if (setVndBalance && orderDetails) {
                           setVndBalance(prev => prev + orderDetails.finalAmount);
                           // Create a COMPLETED deposit request record
                           await syncService.createDepositRequest({
                             username: username,
                             order_id: orderDetails.orderId,
                             amount: amount,
                             final_amount: orderDetails.finalAmount,
                             method: method,
                             status: 'đang chờ' // we update it later if it succeeds, but create it initially as đang chờ
                           });
                           
                           // Dùng syncService.updateDepositStatus để CỘNG TRỰC TIẾP VÀO SUPABASE
                           // Truy xuất requestId
                           const { data: reqData } = await supabase.from('deposit_requests').select('id').eq('order_id', orderDetails.orderId).single();
                           if (reqData) {
                             await syncService.updateDepositStatus(reqData.id, 'thành công', orderDetails.finalAmount, username);
                           }
                           
                           if (setDepositHistory) {
                               setDepositHistory(prev => [
                                   {
                                       id: Date.now().toString(),
                                       username: username,
                                       time: new Date().toLocaleString(),
                                       amount: amount,
                                       finalAmount: orderDetails.finalAmount,
                                       orderId: orderDetails.orderId,
                                       status: 'thành công'
                                   },
                                   ...prev
                               ]);
                           }
                         }
                         if (addActivityLog && orderDetails) {
                           addActivityLog(username.split('||')[0], `Nạp tiền thành công (AI Scan): ${orderDetails.orderId}`, `+${orderDetails.finalAmount.toLocaleString()} VNĐ`, 'deposit');
                         }
                         showModal ? showModal('Thành Công', 'Nạp thành công! Tiền đã được cộng vào ví của bạn.') : alert('Nạp thành công! Tiền đã được cộng vào ví.'); 
                         setActiveTab('account'); 
                       }} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm cursor-pointer shadow-lg shadow-green-900/40">XÁC NHẬN CỘNG TIỀN</button>
                     </div>
                   )}

                   {scanStatus === 'manual' && (
                     <div className="flex flex-col items-center py-6 bg-orange-500/10 border border-orange-500/30 rounded-xl animate-in fade-in zoom-in duration-300">
                       <CheckCircle2 size={48} className="text-orange-500 mb-3" />
                       <h4 className="text-orange-400 font-bold text-lg text-center px-2">Auto Duyệt Thất Bại & Đã Chuyển Thủ Công</h4>
                       <p className="text-xs text-orange-300/70 mt-1 mb-2 text-center px-4 font-bold">{scanError || 'Không thể xác thực tự động.'}</p>
                       <p className="text-xs text-slate-400 mb-4 text-center px-4 italic">Admin sẽ kiểm tra giao dịch và duyệt thủ công trong 15-30 phút.</p>
                       <button onClick={() => setActiveTab('account')} className="px-6 py-2 bg-white hover:bg-white text-black rounded-lg font-bold text-sm cursor-pointer">VỀ TRANG TÀI KHOẢN</button>
                     </div>
                   )}

                </div>
            </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 md:p-6 space-y-5 animate-in fade-in duration-300">
        <div className="max-w-2xl mx-auto space-y-5">
            <div className="text-center">
                <h2 className="text-2xl font-bold uppercase italic text-green-400">NẠP VNĐ VÀO TÀI KHOẢN</h2>
                <p className="text-gray-600 mt-1.5 text-xs">Dùng VNĐ để mua Mod VIP hoặc mua Điểm Mod Free</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setMethod('bank')}
                  className={`glass-morphism p-4 rounded-xl border-2 flex flex-col items-center transition-colors cursor-pointer ${method === 'bank' ? 'border-green-500 bg-white shadow-lg shadow-green-500/20' : 'border-transparent hover:border-gray-200 hover:bg-white'}`}
                >
                    <Landmark size={28} className={`mb-2 ${method === 'bank' ? 'text-green-500' : 'text-gray-500'}`} />
                    <span className={`font-bold text-sm text-center ${method === 'bank' ? 'text-black' : 'text-gray-600'}`}>Ngân Hàng</span>
                    <span className="text-[9px] text-green-400 mt-1 font-bold">Khuyến mãi +5%</span>
                </button>
                <button 
                  onClick={() => setMethod('card')}
                  className={`glass-morphism p-4 rounded-xl border-2 flex flex-col items-center transition-colors cursor-pointer ${method === 'card' ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/20' : 'border-transparent hover:border-gray-200 hover:bg-white'}`}
                >
                    <CreditCard size={28} className={`mb-2 ${method === 'card' ? 'text-blue-500' : 'text-gray-500'}`} />
                    <span className={`font-bold text-sm text-center ${method === 'card' ? 'text-black' : 'text-gray-600'}`}>Thẻ Cào</span>
                    <span className="text-[9px] text-red-400 mt-1 font-bold">Chiết khấu -25%</span>
                </button>
            </div>

            <div className="glass-morphism p-5 rounded-xl space-y-4 border border-gray-200">
                <div>
                    <label className="block text-xs mb-2 font-bold text-black">Chọn số tiền nạp</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {AMOUNTS.map(val => (
                        <button 
                          key={val}
                          onClick={() => setAmount(val)}
                          className={`py-2 px-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${amount === val ? 'bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white border-gray-200 text-gray-600 hover:bg-white'}`}
                        >
                          {(val / 1000).toLocaleString()}K
                        </button>
                      ))}
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${method === 'bank' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2 mb-2">
                        <span className="text-gray-600">Số tiền nạp:</span>
                        <span className="font-bold text-black">{amount.toLocaleString()} VNĐ</span>
                    </div>
                    {method === 'bank' ? (
                      <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2 mb-2">
                          <span className="text-gray-600">Khuyến mãi (5%):</span>
                          <span className="font-bold text-green-400">+{(amount * 0.05).toLocaleString()} VNĐ</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-xs border-b border-gray-200 pb-2 mb-2">
                          <span className="text-gray-600">Chiết khấu thẻ (-25%):</span>
                          <span className="font-bold text-red-400">-{(amount * 0.25).toLocaleString()} VNĐ</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-sm mt-2">
                        <span className="font-bold text-black">Thực nhận vào ví:</span>
                        <span className="font-black text-lg text-yellow-400">{finalAmount.toLocaleString()} <span className="text-xs font-normal">VNĐ</span></span>
                    </div>
                </div>

                <button 
                  onClick={handleConfirm}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-900/40 cursor-pointer text-white mt-3"
                >
                  XÁC NHẬN NẠP TIỀN
                </button>
                <div className="text-center pt-2">
                  <button 
                    onClick={() => setActiveTab('account')}
                    className="text-xs text-gray-500 hover:text-green-500 transition-colors cursor-pointer"
                  >
                    Xem lịch sử giao dịch của bạn
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-left flex items-start gap-2 shadow-sm">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-blue-600" />
                  <p>
                    <strong className="font-bold">Chú ý:</strong> Thời gian chờ duyệt Nạp & Nhận Thẻ Garena thường xử lí từ 30 phút - 72 giờ. Quá 72h hãy liên hệ admin để được hỗ trợ lệnh rút!
                  </p>
                </div>
            </div>
        </div>
    </section>
  );
}
