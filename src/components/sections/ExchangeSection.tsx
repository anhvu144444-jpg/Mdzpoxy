import ModCard from '../ModCard';
import { Crown } from 'lucide-react';

export default function ExchangeSection({ setActiveTab, handleExchange, systemMods }: { setActiveTab: (tab: string) => void, handleExchange: (item: string, price: string) => void, systemMods: any[] }) {
  const freeMods = systemMods.filter(m => m.price?.includes('Điểm'));

  return (
    <section className="p-4 md:p-6 space-y-8 animate-in fade-in duration-300">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-xl font-bold uppercase italic border-l-4 border-orange-500 pl-3">KHO MOD HỆ THỐNG</h2>
          <button 
            onClick={() => setActiveTab('store')}
            className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-yellow-500 hover:text-white transition-all cursor-pointer flex items-center"
          >
            <Crown size={12} className="mr-1.5" /> GHÉ THĂM VIP STORE
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
          {freeMods.map((mod) => (
            <ModCard 
              key={mod.id}
              item={mod.name} 
              title={mod.name} 
              price={mod.price} 
              img={mod.img} 
              fileSize={mod.fileSize}
              handleExchange={handleExchange} 
            />
          ))}
          {/* If no mods, show a placeholder message */}
          {freeMods.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              <p>Hiện chưa có bản mod nào (Miễn phí) trong kho...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
