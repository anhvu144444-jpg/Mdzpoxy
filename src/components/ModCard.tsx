import { HardDrive } from 'lucide-react';

export default function ModCard({ item, title, price, img, fileSize, handleExchange }: any) {
  const isVip = price && price.includes('VNĐ');
  const imageUrl = img && img.startsWith('http') 
    ? img 
    : `https://placehold.co/300x400/334155/ffffff?text=${(img || title || 'MOD').replace(/\s+/g, '+')}`;

  return (
    <div className={`glass-morphism rounded-xl overflow-hidden card-hover group border transition-all ${isVip ? 'border-yellow-500/30 hover:border-yellow-500/60' : 'border-black hover:border-orange-500/50'}`}>
        <div className="h-32 bg-white relative overflow-hidden">
            {isVip && (
              <span className="absolute top-1.5 left-1.5 z-10 text-[8px] bg-yellow-500 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-widest shadow-lg">VIP</span>
            )}
            <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {fileSize && (
              <span className="absolute bottom-1.5 right-1.5 z-10 text-[8px] bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded font-medium tracking-wide shadow-lg flex items-center">
                <HardDrive size={8} className="mr-1" /> {fileSize}
              </span>
            )}
        </div>
        <div className="p-2.5 space-y-1.5">
            <h4 className={`font-bold text-[11px] truncate ${isVip ? 'text-yellow-500' : 'text-black'}`}>{title}</h4>
            <div className="flex items-center justify-between">
                <span className={`${isVip ? 'text-yellow-400' : 'text-orange-500'} font-bold text-xs`}>{price}</span>
                <button 
                  onClick={() => handleExchange(item, price)} 
                  className={`${isVip ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-white hover:bg-orange-600'} px-2.5 py-1 rounded-md text-[9px] font-bold text-black transition-colors cursor-pointer uppercase`}
                >
                  {isVip ? 'SỞ HỮU' : 'Đổi'}
                </button>
            </div>
        </div>
    </div>
  );
}
