import { useState } from 'react';
import ModCard from '../ModCard';
import { Gem, Copy, CreditCard, AlertCircle } from 'lucide-react';

export default function CurrencyExchangeSection({ handleExchange }: { handleExchange: (item: string, price: string) => void }) {
  const [activeTab, setActiveTab] = useState<'kim-cuong' | 'quan-huy' | 'the-garena'>('kim-cuong');

  const diamondPackages = [
    { id: 'kc-1', name: '25 Kim Cương', price: '25.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-2', name: '51 Kim Cương', price: '50.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-3', name: '113 Kim Cương', price: '100.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-4', name: '283 Kim Cương', price: '250.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-5', name: '566 Kim Cương', price: '500.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-6', name: '1.132 Kim Cương', price: '1.000.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-7', name: '2.830 Kim Cương', price: '2.500.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-8', name: '5.750 Kim Cương', price: '5.000.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
    { id: 'kc-9', name: '11.500 Kim Cương', price: '10.000.000 Điểm', img: 'https://cdn11.dienmaycholon.vn/filewebdmclnew/DMCL21/Picture/News/News_expe_21386/21386.png?version=170503' },
  ];

  const quanHuyPackages = [
    { id: 'qh-1', name: '10 Quân Huy', price: '25.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-2', name: '20 Quân Huy', price: '50.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-3', name: '40 Quân Huy', price: '100.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-4', name: '102 Quân Huy', price: '250.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-5', name: '204 Quân Huy', price: '500.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-6', name: '408 Quân Huy', price: '1.000.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-7', name: '1.020 Quân Huy', price: '2.500.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-8', name: '2.090 Quân Huy', price: '5.000.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
    { id: 'qh-9', name: '4.180 Quân Huy', price: '10.000.000 Điểm', img: 'https://cdn-media.sforum.vn/storage/app/media/1image/50k-100k-duoc-bao-nhieu-quan-huy-1.jpg' },
  ];

  const garenaCardPackages = [
    { id: 'gr-1', name: 'Thẻ Garena 5.000đ', price: '25.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
    { id: 'gr-2', name: 'Thẻ Garena 10.000đ', price: '50.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
    { id: 'gr-3', name: 'Thẻ Garena 20.000đ', price: '100.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
    { id: 'gr-4', name: 'Thẻ Garena 50.000đ', price: '250.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
    { id: 'gr-5', name: 'Thẻ Garena 100.000đ', price: '500.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
    { id: 'gr-6', name: 'Thẻ Garena 200.000đ', price: '1.000.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
    { id: 'gr-7', name: 'Thẻ Garena 500.000đ', price: '2.500.000 Điểm', img: 'https://shopthe365.com/storage/userfiles/files/6b4d75d1-f05f-4f55-bdfd-6ee2add3ae62.jpg' },
  ];

  return (
    <section className="p-4 md:p-8 animate-in fade-in duration-300 relative">
      <div className="flex justify-center md:justify-end mb-6 w-full">
        <div className="bg-white backdrop-blur-md border border-black rounded-full px-3 md:px-4 py-2 flex items-center space-x-3 md:space-x-4 text-[10px] sm:text-xs font-bold shadow-lg overflow-x-auto max-w-full no-scrollbar">
          <button 
            onClick={() => setActiveTab('kim-cuong')} 
            className={`transition-colors flex items-center gap-1 whitespace-nowrap ${activeTab === 'kim-cuong' ? 'text-cyan-400' : 'text-gray-600 hover:text-cyan-300'}`}
          >
            <Gem size={14}/> KIM CƯƠNG
          </button>
          <div className="w-px h-3 bg-white"></div>
          <button 
            onClick={() => setActiveTab('quan-huy')} 
            className={`transition-colors flex items-center gap-1 whitespace-nowrap ${activeTab === 'quan-huy' ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'}`}
          >
            <Copy size={14}/> QUÂN HUY
          </button>
          <div className="w-px h-3 bg-white"></div>
          <button 
            onClick={() => setActiveTab('the-garena')} 
            className={`transition-colors flex items-center gap-1 whitespace-nowrap ${activeTab === 'the-garena' ? 'text-red-400' : 'text-gray-600 hover:text-red-300'}`}
          >
            <CreditCard size={14}/> THẺ GARENA
          </button>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-300">
        {activeTab === 'kim-cuong' && (
          <div id="kim-cuong" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold uppercase border-l-4 border-cyan-400 pl-3 flex items-center gap-2">
                <Gem className="text-cyan-400" />
                ĐỔI KIM CƯƠNG FREE FIRE
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-4">
              {diamondPackages.map((pkg) => (
                <ModCard 
                  key={pkg.id}
                  item={pkg.name} 
                  title={pkg.name} 
                  price={pkg.price} 
                  img={pkg.img} 
                  handleExchange={handleExchange} 
                />
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-left flex items-start gap-2 shadow-sm max-w-3xl mx-auto">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-blue-600" />
              <p>
                <strong className="font-bold">Chú ý:</strong> Thời gian chờ duyệt Nạp & Nhận Thẻ Garena thường xử lí từ 30 phút - 72 giờ. Quá 72h hãy liên hệ admin để được hỗ trợ lệnh rút!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'quan-huy' && (
          <div id="quan-huy" className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h2 className="text-2xl font-bold uppercase border-l-4 border-yellow-400 pl-3 flex items-center gap-2">
                 <Copy className="text-yellow-400" />
                 ĐỔI QUÂN HUY LIÊN QUÂN
               </h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-4">
               {quanHuyPackages.map((pkg) => (
                 <ModCard 
                   key={pkg.id}
                   item={pkg.name} 
                   title={pkg.name} 
                   price={pkg.price} 
                   img={pkg.img} 
                   handleExchange={handleExchange} 
                 />
               ))}
             </div>

             <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-left flex items-start gap-2 shadow-sm max-w-3xl mx-auto">
               <AlertCircle size={18} className="shrink-0 mt-0.5 text-blue-600" />
               <p>
                 <strong className="font-bold">Chú ý:</strong> Thời gian chờ duyệt Nạp & Nhận Thẻ Garena thường xử lí từ 30 phút - 72 giờ. Quá 72h hãy liên hệ admin để được hỗ trợ lệnh rút!
               </p>
             </div>
          </div>
        )}

        {activeTab === 'the-garena' && (
          <div id="the-garena" className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h2 className="text-2xl font-bold uppercase border-l-4 border-red-500 pl-3 flex items-center gap-2">
                 <CreditCard className="text-red-500" />
                 ĐỔI THẺ GARENA
               </h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-4">
               {garenaCardPackages.map((pkg) => (
                 <ModCard 
                   key={pkg.id}
                   item={pkg.name} 
                   title={pkg.name} 
                   price={pkg.price} 
                   img={pkg.img} 
                   handleExchange={handleExchange} 
                 />
               ))}
             </div>

             <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 text-left flex items-start gap-2 shadow-sm max-w-3xl mx-auto">
               <AlertCircle size={18} className="shrink-0 mt-0.5 text-blue-600" />
               <p>
                 <strong className="font-bold">Chú ý:</strong> Thời gian chờ duyệt Nạp & Nhận Thẻ Garena thường xử lí từ 30 phút - 72 giờ. Quá 72h hãy liên hệ admin để được hỗ trợ lệnh rút!
               </p>
             </div>
          </div>
        )}
      </div>
    </section>
  );
}
