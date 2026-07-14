import ModCard from '../ModCard';
import { ArrowRight } from 'lucide-react';

export default function StoreSection({ setActiveTab, handleExchange, systemMods }: { setActiveTab: (tab: string) => void, handleExchange: (item: string, price: string) => void, systemMods: any[] }) {
  // Simple logic: mods costing VNĐ are VIP
  const vipMods = systemMods.filter(m => m.price?.includes('VNĐ'));

  return (
    <section className="p-4 md:p-6 space-y-5 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black italic text-yellow-500 uppercase tracking-tighter border-l-4 border-yellow-500 pl-4">MDZ STORE VIP</h2>
            <button 
              onClick={() => setActiveTab('exchange')}
              className="text-xs text-gray-500 hover:text-black transition-colors cursor-pointer flex items-center"
            >
              Xem kho Mod Free <ArrowRight size={14} className="ml-1" />
            </button>
        </div>
        <p className="text-xs text-gray-600 italic">Dành riêng cho những chiến binh tinh nhuệ</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
            {vipMods.map((mod) => (
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
            {vipMods.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-3xl">
                    <p>Chưa có bản mod VIP nào (Mua bằng VNĐ)</p>
                </div>
            )}
        </div>
    </section>
  );
}
