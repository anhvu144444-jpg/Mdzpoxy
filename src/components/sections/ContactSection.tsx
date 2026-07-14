import { UserCheck, Youtube, Facebook, Send, Headset } from 'lucide-react';

export default function ContactSection({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <section className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-4xl font-black italic gradient-text uppercase tracking-tighter">LIÊN HỆ & HỖ TRỢ</h2>
                <p className="text-gray-600 mt-2">Kết nối với chúng tôi qua các kênh truyền thông chính thức</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Admin Contact */}
                <div className="glass-morphism p-8 rounded-3xl border border-gray-200 flex items-center space-x-6 hover:border-orange-500 transition-all group cursor-pointer">
                    <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center text-4xl text-orange-500 group-hover:scale-110 transition-transform">
                        <UserCheck size={40} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">ADMIN MDZPX</h4>
                        <p className="text-sm text-gray-600 mb-3">Hỗ trợ nạp lỗi, mất tài khoản 24/7</p>
                        <a href="https://zalo.me/0337117930" className="inline-block px-4 py-2 bg-orange-600 rounded-lg text-xs font-bold uppercase hover:bg-orange-700 transition-colors">Nhắn tin ngay</a>
                    </div>
                </div>

                {/* YouTube */}
                <div className="glass-morphism p-8 rounded-3xl border border-gray-200 flex items-center space-x-6 hover:border-red-500 transition-all group cursor-pointer">
                    <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center text-4xl text-red-500 group-hover:scale-110 transition-transform">
                        <Youtube size={40} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">KÊNH YOUTUBE</h4>
                        <p className="text-sm text-gray-600 mb-3">Hướng dẫn cài đặt & Review Mod mới</p>
                        <a href="https://www.youtube.com/@modzpoxy09" className="inline-block px-4 py-2 bg-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-700 transition-colors">Đăng ký ngay</a>
                    </div>
                </div>

                {/* Chat Group */}
                <div 
                  onClick={() => setActiveTab('contact')}
                  className="glass-morphism p-8 rounded-3xl border border-gray-200 flex items-center space-x-6 hover:border-blue-400 transition-all group cursor-pointer"
                >
                    <div className="w-20 h-20 bg-blue-400/10 rounded-2xl flex items-center justify-center text-4xl text-blue-400 group-hover:scale-110 transition-transform">
                        <Send size={40} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">NHÓM CHAT</h4>
                        <p className="text-sm text-gray-600 mb-3">Giao lưu, chia sẻ kinh nghiệm leo rank</p>
                        <button className="inline-block px-4 py-2 bg-blue-500 rounded-lg text-xs font-bold uppercase hover:bg-blue-600 transition-colors cursor-pointer text-white">Tham gia nhóm</button>
                    </div>
                </div>

                {/* Facebook Group */}
                <div className="glass-morphism p-8 rounded-3xl border border-gray-200 flex items-center space-x-6 hover:border-blue-600 transition-all group cursor-pointer">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-2xl flex items-center justify-center text-4xl text-blue-600 group-hover:scale-110 transition-transform">
                        <Facebook size={40} />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">TELEGRAM</h4>
                        <p className="text-sm text-gray-600 mb-3">GRUOP TELE HƠN 100K USER</p>
                        <a href="https://t.me/mdzpx36" className="inline-block px-4 py-2 bg-blue-700 rounded-lg text-xs font-bold uppercase hover:bg-blue-800 transition-colors">Vào Group</a>
                    </div>
                </div>
            </div>
            
            <div className="text-center pt-8">
               <button 
                onClick={() => setActiveTab('home')}
                className="text-gray-500 hover:text-black transition-colors text-sm underline underline-offset-4 cursor-pointer"
               >
                 Quay lại trang chủ
               </button>
            </div>
        </div>
    </section>
  );
}
