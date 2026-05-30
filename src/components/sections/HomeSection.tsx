import React, { useState, useEffect } from 'react';
import { Coins, PackageOpen, ArrowUp, Plus, ArrowRightLeft, CheckCircle, Users } from 'lucide-react';
import ModCard from '../ModCard';

function StatCard({ title, value, sub, icon: Icon, subIcon: SubIcon, colorClass, iconClass, subClass }: any) {
  return (
    <div className={`glass-morphism p-5 rounded-2xl border-l-4 ${colorClass} card-hover`}>
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] text-gray-600 uppercase font-bold tracking-wider">{title}</h3>
            <Icon className={iconClass} size={20} />
        </div>
        <p className="text-2xl font-black text-black">{value}</p>
        
        {sub && title === "Mod hoạt động (%)" ? (
          <div className="w-full bg-white h-1.5 rounded-full mt-2">
              <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '99.2%'}}></div>
          </div>
        ) : sub && (
          <p className={`text-[10px] mt-1 flex items-center ${subClass}`}>
            {SubIcon && title === "Số người truy cập" ? (
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
            ) : SubIcon && (
                <SubIcon size={12} className="mr-1" />
            )}
            {sub}
          </p>
        )}
    </div>
  )
}

export default function HomeSection({ 
    setActiveTab, 
    handleExchange, 
    vndBalance, 
    pointsBalance, 
    systemMods,
    globalStats
  }: { 
    setActiveTab: (tab: string) => void, 
    handleExchange: (item: string, price: string) => void,
    vndBalance: number,
    pointsBalance: number,
    systemMods: any[],
    globalStats: {
      totalPointsRewarded: number,
      totalExchanges: number,
      totalUsers: number,
      totalMods: number,
      todayActiveUsers: number
    }
  }) {
    const latestMods = systemMods.slice(0, 3);

    const formatValue = (num: number) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    };
    const [activities, setActivities] = useState([
        { user: '******88', action: 'vừa đổi', item: 'MOD PHỐI ĐỒ HOT', time: '1 phút trước' },
        { user: 'ADMIN MDZPX', action: 'vừa cập nhật', item: 'SERVER MOD #1', time: '5 phút trước' },
        { user: '******99', action: 'vừa đổi', item: 'MOD SKIN AK47', time: '12 phút trước' },
        { user: 'Hệ Thống', action: 'vừa duyệt nạp', item: 'THÀNH VIÊN MỚI', time: '15 phút trước' },
    ]);

    useEffect(() => {
        const fakeUsers = ['******88', '******99', '******23', 'Người dùng mới', 'Player***', 'Gamer***', 'ADMIN_SUPPORT', '******01', '******77'];
        const fakeActions = ['vừa đổi', 'vừa mua', 'vừa tải', 'nhận thành công'];
        const fakeItems = ['MOD PHỐI ĐỒ HOT', 'MOD HEADSHOT', 'MOD SKIN SÚNG VIP', 'MOD BẢN ĐỒ', 'ĐỔI KIM CƯƠNG', 'ĐỔI QUÂNN HUY'];
        const fakeTimes = ['vài giây trước', '1 phút trước', '2 phút trước', 'vừa xong'];

        const interval = setInterval(() => {
            const newUser = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
            const newAction = fakeActions[Math.floor(Math.random() * fakeActions.length)];
            const newItem = fakeItems[Math.floor(Math.random() * fakeItems.length)];
            const newTime = fakeTimes[Math.floor(Math.random() * fakeTimes.length)];

            setActivities(prev => {
                const newLog = { user: newUser, action: newAction, item: newItem, time: newTime };
                return [newLog, ...prev].slice(0, 5); // Keep the last 5 activities, same as image ~4
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const maskName = (name: string) => {
        if (!name) return 'User';
        const actualName = name.split('||')[0];
        if (actualName === 'Hệ Thống') return actualName;
        if (actualName.length <= 2) return actualName;
        return '*'.repeat(actualName.length - 2) + actualName.slice(-2);
    };

    return (
        <section className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
            {/* ... banner ... */}
            <div className="relative rounded-[2.5rem] overflow-hidden h-52 md:h-72 flex items-center justify-center bg-white border border-gray-200">
                <img src="https://static.vecteezy.com/system/resources/previews/020/190/457/non_2x/freefire-logo-freefire-icon-free-free-vector.jpg" alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                <div className="relative text-center space-y-3 z-10 p-6">
                    <div className="bg-orange-500/20 text-orange-500 text-[10px] font-bold px-3 py-1 rounded-full w-max mx-auto mb-2 border border-orange-500/30">HỆ THỐNG UY TÍN SỐ 1</div>
                    <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none shadow-sm text-black">THOẢ SỨC <span className="text-orange-500">MOD GAME</span></h2>
                    <p className="text-gray-700 text-sm md:text-base max-w-md mx-auto drop-shadow-md">Tất cả bản Mod đều được kiểm duyệt, an toàn 100% cho tài khoản của bạn.</p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                        <button onClick={() => setActiveTab('exchange')} className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-full font-bold transition-all pulse text-white">KHÁM PHÁ NGAY</button>
                        <button onClick={() => setActiveTab('contact')} className="px-6 py-2.5 bg-white hover:bg-white rounded-full font-bold border border-gray-200 transition-all cursor-pointer text-black"><span className="flex items-center"><ArrowRightLeft size={16} className="mr-2 text-orange-500" />HELP</span></button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* ... stat cards ... */}
                <div className="glass-morphism p-5 rounded-3xl border-b-2 border-orange-500 card-hover flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Số dư</p>
                    <div className="flex flex-col">
                        <p className="text-xl font-black text-black">{pointsBalance.toLocaleString()} <span className="text-[10px] font-normal text-orange-400">Điểm</span></p>
                        <p className="text-xl font-black text-black mt-1">{vndBalance.toLocaleString()} <span className="text-[10px] font-normal text-green-400">VNĐ</span></p>
                    </div>
                </div>
                <div className="glass-morphism p-5 rounded-3xl border-b-2 border-blue-500 card-hover">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Kho Mod</p>
                    <p className="text-2xl font-black text-black">{globalStats.totalMods}</p>
                    <p className="text-[9px] text-blue-500 mt-1 font-bold">Bản mod sẵn có</p>
                </div>
                <div className="glass-morphism p-5 rounded-3xl border-b-2 border-green-500 card-hover">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Đã quy đổi</p>
                    <p className="text-2xl font-black text-black">{formatValue(globalStats.totalPointsRewarded)}</p>
                    <p className="text-[9px] text-green-500 mt-1 font-bold">Điểm toàn hệ thống</p>
                </div>
                <div className="glass-morphism p-5 rounded-3xl border-b-2 border-yellow-500 card-hover">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Trạng thái</p>
                    <p className="text-2xl font-black text-black">100%</p>
                    <p className="text-[9px] text-yellow-500 mt-1 font-bold">Hệ thống ổn định</p>
                </div>
                <div className="glass-morphism p-5 rounded-3xl border-b-2 border-purple-500 card-hover col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Truy cập</p>
                    <p className="text-2xl font-black text-black">{globalStats.totalUsers.toLocaleString()}</p>
                    <p className="text-[9px] text-purple-500 mt-1 font-bold flex items-center"><span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> Đang trực tuyến</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
                <div className="lg:col-span-3">
                    <h3 className="text-xl font-bold mb-6 border-l-4 border-orange-500 pl-3 uppercase italic">MOD MỚI CẬP NHẬT</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {latestMods.map((mod) => (
                            <ModCard 
                                key={mod.id} 
                                item={mod.name} 
                                title={mod.name} 
                                price={mod.price} 
                                img={mod.img} 
                                handleExchange={handleExchange} 
                            />
                        ))}
                        {latestMods.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-gray-200 rounded-2xl">
                                Chưa có bản Mod nào được cập nhật.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xl font-bold mb-6 border-l-4 border-orange-500 pl-3 uppercase italic text-orange-500">HOẠT ĐỘNG</h3>
                    <div className="space-y-3">
                        {activities.map((act, i) => (
                            <div key={i} className="glass-morphism p-4 rounded-2xl border border-black flex items-center justify-between group hover:border-orange-500/30 transition-all">
                                <div className="space-y-1">
                                    <p className="text-[11px] text-black">
                                        <span className="font-black text-orange-400">{maskName(act.user)}</span> {act.action}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter truncate w-32">{act.item}</p>
                                </div>
                                <div className="text-[10px] text-gray-600 font-mono italic shrink-0">{act.time}</div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-orange-600/10 rounded-2xl border border-orange-500/20">
                        <p className="text-[10px] text-orange-500 font-black text-center animate-pulse tracking-widest uppercase">Hệ thống đang hoạt động ổn định</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
