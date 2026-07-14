import { useState, useEffect } from 'react';
import { Wallet, Landmark, Smartphone, CreditCard, AlertCircle } from 'lucide-react';
import { syncService } from '../../lib/syncService';

export default function PullMoneySection({ handleExchange, pointsBalance, withdrawRequests, username }: { handleExchange: (item: string, price: string) => void, pointsBalance: number, withdrawRequests: any[], username: string }) {
  const [activeMethod, setActiveMethod] = useState<'bank' | 'zalopay' | 'the-cao'>('bank');
  
  // States for Bank
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isBankSaved, setIsBankSaved] = useState(false);

  // States for ZaloPay
  const [zaloName, setZaloName] = useState('');
  const [zaloPhone, setZaloPhone] = useState('');
  const [isZaloSaved, setIsZaloSaved] = useState(false);

  // States for Thẻ Cào
  const [telecom, setTelecom] = useState('VIETTEL');

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  useEffect(() => {
    const loadPaymentInfo = async () => {
      if (!username) return;
      const { bank_info, zalopay_info } = await syncService.getPaymentInfo(username);
      
      if (bank_info) {
        const parts = bank_info.split('|||');
        if (parts.length >= 3) {
           setBankName(parts[0]);
           setAccountNumber(parts[1]);
           setAccountName(parts[2]);
           setIsBankSaved(true);
        }
      }
      
      if (zalopay_info) {
        const parts = zalopay_info.split('|||');
        if (parts.length >= 2) {
           setZaloPhone(parts[0]);
           setZaloName(parts[1]);
           setIsZaloSaved(true);
        }
      }
    };
    loadPaymentInfo();
  }, [username]);

  const handleSaveBank = async () => {
    if (!bankName || !accountName || !accountNumber) return alert("Vui lòng nhập đủ thông tin");
    setIsBankSaved(true);
    const bankStr = `${bankName}|||${accountNumber}|||${accountName}`;
    const zaloStr = isZaloSaved && zaloPhone && zaloName ? `${zaloPhone}|||${zaloName}` : '';
    await syncService.savePaymentInfo(username, bankStr, zaloStr);
  };

  const handleSaveZalo = async () => {
    if (!zaloName || !zaloPhone) return alert("Vui lòng nhập đủ thông tin");
    setIsZaloSaved(true);
    const bankStr = isBankSaved && bankName && accountNumber && accountName ? `${bankName}|||${accountNumber}|||${accountName}` : '';
    const zaloStr = `${zaloPhone}|||${zaloName}`;
    await syncService.savePaymentInfo(username, bankStr, zaloStr);
  };

  const amounts = [10000, 15000, 30000, 50000, 100000, 200000, 500000, 1000000, 1500000];

  const totalWithdrawn = withdrawRequests.reduce((acc: number, curr: any) => {
    if (curr.status === 'Từ chối') return acc;
    
    const nameToMatch = curr.item_name || curr.itemName || curr.item || '';
    const match = nameToMatch.match(/([\d\.]+)\s*(đ|VNĐ)/i);
    let val = 0;
    
    if (match) {
       val = parseInt(match[1].replace(/\./g, ''), 10);
    } else {
       val = parseInt(curr.price?.toString().replace(/[^\d]/g, '') || '0', 10);
       val = Math.floor(val / 5);
    }
    return acc + val;
  }, 0);

  const handleWithdraw = () => {
    if (!selectedAmount) return;
    
    let itemName = '';
    const pointsCost = selectedAmount * 5; 

    if (activeMethod === 'bank') {
      if (!isBankSaved) return alert('Vui lòng lưu thông tin ngân hàng trước khi rút');
      itemName = `Rút ${selectedAmount.toLocaleString('vi-VN')}đ Ngân Hàng (${bankName} - ${accountNumber} - ${accountName})`;
    } else if (activeMethod === 'zalopay') {
      if (!isZaloSaved) return alert('Vui lòng lưu thông tin ZaloPay trước khi rút');
      itemName = `Rút ${selectedAmount.toLocaleString('vi-VN')}đ ZaloPay (${zaloName} - ${zaloPhone})`;
    } else if (activeMethod === 'the-cao') {
      itemName = `Thẻ ${telecom} ${selectedAmount.toLocaleString('vi-VN')}đ`;
    }

    handleExchange(itemName, `${pointsCost.toLocaleString('vi-VN')} Điểm`);
  };

  return (
    <section className="p-4 md:p-6 animate-in fade-in duration-300 max-w-7xl mx-auto space-y-6 text-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <Wallet className="text-blue-600" size={24} />
        <h1 className="text-xl font-bold uppercase">Ví Tiền</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Balances */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f172a] rounded-2xl p-6 text-white shadow-md">
            <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Số Dư Hiện Tại</p>
            <div className="flex items-center gap-2 font-black text-3xl sm:text-4xl tracking-tight text-emerald-400">
              {pointsBalance.toLocaleString('vi-VN')}
              <span className="text-2xl">🔥</span>
            </div>
          </div>
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-md">
            <p className="text-xs font-semibold text-blue-200 mb-1 uppercase tracking-wider">Số Dư Đã Rút</p>
            <div className="flex items-end font-black text-3xl sm:text-4xl tracking-tight">
               {totalWithdrawn.toLocaleString('vi-VN')} <span className="text-sm sm:text-base font-bold ml-1 mb-1 sm:mb-2 text-blue-200">đ</span>
            </div>
          </div>
        </div>

        {/* Right Column: Methods & Form */}
        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Phương Thức Rút</p>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setActiveMethod('bank')} 
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all bg-white ${activeMethod === 'bank' ? 'border-blue-500 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}
            >
              <Landmark size={24} className={activeMethod === 'bank' ? 'text-blue-500' : 'text-blue-400'} />
              <span className="text-[10px] font-bold uppercase">Ngân Hàng</span>
            </button>
            <button 
              onClick={() => setActiveMethod('zalopay')} 
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all bg-white ${activeMethod === 'zalopay' ? 'border-blue-500 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}
            >
              <Smartphone size={24} className={activeMethod === 'zalopay' ? 'text-blue-500' : 'text-blue-400'} />
              <span className="text-[10px] font-bold uppercase">ZaloPay</span>
            </button>
            <button 
              onClick={() => setActiveMethod('the-cao')} 
              className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all bg-white ${activeMethod === 'the-cao' ? 'border-blue-500 text-blue-600 shadow-sm' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}
            >
              <CreditCard size={24} className={activeMethod === 'the-cao' ? 'text-red-500' : 'text-red-400'} />
              <span className="text-[10px] font-bold uppercase text-red-600">Thẻ Cào</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {activeMethod === 'bank' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-sm font-black uppercase text-black tracking-wider mb-4 border-l-4 border-blue-500 pl-3">Rút Bank</h2>
            
            {!isBankSaved ? (
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Tên ngân hàng" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium uppercase"
                />
                <input 
                  type="text" 
                  placeholder="Tên chủ tài khoản" 
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium uppercase"
                />
                <input 
                  type="text" 
                  placeholder="Số tài khoản" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                />
                <button 
                  onClick={handleSaveBank}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md mt-2 text-sm"
                >
                  LƯU LẠI
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm border border-blue-200">
                     <Landmark size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 uppercase">{bankName}</h3>
                    <p className="text-sm font-medium text-blue-700">{accountNumber} • {accountName.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBankSaved(false)}
                  className="shrink-0 px-4 py-2 border-2 border-blue-200 hover:border-blue-500 text-blue-600 font-bold rounded-lg text-xs transition-colors bg-white"
                >
                  SỬA
                </button>
              </div>
            )}
          </div>
        )}

        {activeMethod === 'zalopay' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-sm font-black uppercase text-black tracking-wider mb-4 border-l-4 border-blue-500 pl-3">Rút ZaloPay</h2>
            
            {!isZaloSaved ? (
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Họ và Tên" 
                  value={zaloName}
                  onChange={(e) => setZaloName(e.target.value)}
                  className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium uppercase"
                />
                <input 
                  type="text" 
                  placeholder="Số Điện Thoại" 
                  value={zaloPhone}
                  onChange={(e) => setZaloPhone(e.target.value)}
                  className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
                />
                <button 
                  onClick={handleSaveZalo}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md mt-2 text-sm"
                >
                  LƯU LẠI
                </button>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-2 shadow-sm border border-blue-200">
                     <Smartphone size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 uppercase">ZaloPay</h3>
                    <p className="text-sm font-medium text-blue-700">{zaloPhone} • {zaloName.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsZaloSaved(false)}
                  className="shrink-0 px-4 py-2 border-2 border-blue-200 hover:border-blue-500 text-blue-600 font-bold rounded-lg text-xs transition-colors bg-white"
                >
                  SỬA
                </button>
              </div>
            )}
          </div>
        )}

        {activeMethod === 'the-cao' && (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-sm font-black uppercase text-black tracking-wider mb-4 border-l-4 border-red-500 pl-3">Rút Thẻ Cào/Game</h2>
            <div className="space-y-3">
              <select 
                value={telecom}
                onChange={(e) => setTelecom(e.target.value)}
                className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm font-bold uppercase appearance-none"
              >
                <option value="VIETTEL">VIETTEL</option>
                <option value="VINAPHONE">VINAPHONE</option>
                <option value="MOBIFONE">MOBIFONE</option>
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Amount Selector */}
        <div className="space-y-4 pt-2">
          <p className="text-xs font-semibold text-gray-600 pl-1">Chọn số tiền:</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {amounts.map(amt => (
              <button 
                key={amt}
                onClick={() => setSelectedAmount(amt)}
                className={`py-3 px-3 rounded-[12px] text-xs font-bold transition-all border-2 flex flex-col items-center justify-center gap-1 ${selectedAmount === amt ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 text-gray-700 hover:border-blue-200'}`}
              >
                <span className={selectedAmount === amt ? 'text-blue-700' : 'text-gray-900'}>{amt.toLocaleString('vi-VN')} đ</span>
                <span className={`text-[10px] ${selectedAmount === amt ? 'text-orange-600' : 'text-orange-500'}`}>{(amt * 5).toLocaleString('vi-VN')} Đ</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Display */}
        {selectedAmount && (
           <div className="p-4 bg-gray-50 rounded-xl text-sm font-bold text-gray-800 border flex items-center justify-between">
             <span className="text-gray-900">Thực nhận: {selectedAmount.toLocaleString('vi-VN')} đ</span>
             <span className="text-orange-500">Tiêu hao: {(selectedAmount * 5).toLocaleString('vi-VN')} Điểm</span>
           </div>
        )}
        {!selectedAmount && (
           <div className="p-4 bg-gray-50 rounded-xl text-sm font-bold text-gray-400 border flex items-center">
             Chưa chọn số tiền
           </div>
        )}

        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-xs text-red-600 font-medium">
           <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
           <p>
              Nhập thông tin sai hoặc gian lận sẽ bị khấu trừ 70% số dư điểm.
           </p>
        </div>

        <button 
          onClick={handleWithdraw}
          className="w-full bg-[#0f172a] hover:bg-black text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-black/10 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedAmount || (activeMethod === 'bank' && !isBankSaved) || (activeMethod === 'zalopay' && !isZaloSaved)}
        >
          XÁC NHẬN RÚT
        </button>
        <div className="text-center">
           <button className="text-xs text-gray-400 hover:text-gray-600 font-medium">Đóng</button>
        </div>
      </div>

      {/* History Section Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between">
         <h2 className="text-sm font-black uppercase text-black tracking-wider">Lịch Sử Rút Thưởng</h2>
         <button className="text-xs font-bold text-red-500 hover:text-red-600 uppercase transition-colors">Xóa tất cả</button>
      </div>

    </section>
  );
}

