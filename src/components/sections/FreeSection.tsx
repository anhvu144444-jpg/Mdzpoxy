import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, ArrowUpRight, Loader2, Info } from 'lucide-react';
import { motion } from 'motion/react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { syncService, TaskConfig } from '../../lib/syncService';

const fpPromise = FingerprintJS.load();

export default function FreeSection({ setActiveTab, setPointsBalance, showModal, username }: { 
    setActiveTab: (tab: string) => void, 
    setPointsBalance?: React.Dispatch<React.SetStateAction<number>>, 
    showModal?: (title: string, msg: string, icon?: any, type?: 'info' | 'confirm' | 'action', onAction?: (() => void) | null, actionLabel?: string) => void,
    username: string
}) {
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [fingerprint, setFingerprint] = useState<string>('');

  // Dữ liệu nhiệm vụ mặc định
  const DEFAULT_TASKS: TaskConfig[] = [
    { id: 'layma', name: 'TASK POINTS 1', reward: 1000, api_url: 'https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=de2c099a8fd17d1cc6c7068209e5fa5d&format=json&url=', max_views: 2, auto: true, is_hot: true, status: 'hoạt động' },
    { id: 'link4m', name: 'TASK POINTS 2', reward: 1000, api_url: 'https://link4m.co/api-shorten/v2?api=6a1135a08ac8591acf160a78&url=', max_views: 2, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'linktot', name: 'TASK POINTS 3', reward: 1000, api_url: 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url', max_views: 4, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'bbmkts', name: 'TASK POINTS 5', reward: 1000, api_url: 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 1, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_1step', name: 'TASK POINTS 6', reward: 1000, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=', max_views: 1234, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_2step', name: 'TASK POINTS 7', reward: 1050, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=4&url=', max_views: 4567, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_3step', name: 'TASK POINTS 8', reward: 1100, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=3&url=', max_views: 78910, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_4step', name: 'TASK POINTS 9', reward: 1150, api_url: 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=5&url=', max_views: 11121314, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'ads_qc', name: 'TASK POINT 10', reward: 0.0000000000000000005, api_url: 'https://socialconventcontext.com/r5qq3q89gz?key=b04168125e1c482ac46f605cad3f081e', max_views: 151617181920, auto: true, is_hot: false, status: 'hoạt động' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      // Fetch History
      const histData = await syncService.getTaskHistory(username);
      setHistory(histData);

      // Fetch Tasks from DB
      const taskData = await syncService.getTaskConfigs();
      
      // Merge database task configurations with the mandated DEFAULT_TASKS to normalize names, rewards, and views limits
      const mappedTasks = DEFAULT_TASKS.map(defTask => {
        const dbTask = taskData.find(t => t.id === defTask.id);
        if (dbTask) {
          return {
            ...dbTask,
            name: defTask.name,
            reward: defTask.reward,
            api_url: defTask.api_url,
            max_views: defTask.max_views,
          };
        }
        return defTask;
      });
      
      // Sắp xếp các nhiệm vụ TASK POINTS 1 lên đầu, sau đó đến HOT
      const sortedTasks = [...mappedTasks].sort((a, b) => {
        const aIsLayMa = a.id === 'layma' || a.name.toUpperCase().includes('LAYMA') || a.name.toUpperCase().includes('TASK POINTS 1');
        const bIsLayMa = b.id === 'layma' || b.name.toUpperCase().includes('LAYMA') || b.name.toUpperCase().includes('TASK POINTS 1');
        
        if (aIsLayMa && !bIsLayMa) return -1;
        if (!aIsLayMa && bIsLayMa) return 1;
        
        if (a.is_hot && !b.is_hot) return -1;
        if (!a.is_hot && b.is_hot) return 1;
        return 0;
      });

      setTasks(sortedTasks);
    }
    
    if (username) fetchData();
    
    // Get Fingerprint
    fpPromise
      .then(fp => fp.get())
      .then(result => {
        setFingerprint(result.visitorId);
      });
  }, [username]);

  const getTodayTaskCountPerTask = (taskId: string) => {
    const getVNTodayStart = () => {
      const now = new Date();
      // VN is UTC+7. We find the start of the day in VN time.
      const vnTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
      vnTime.setHours(0, 0, 0, 0);
      
      // We need to compare it with the timestamp from database
      // The database created_at is usually ISO string (UTC)
      // So we convert the beginning of VN day back to a standard timestamp
      const vnStartLocal = new Date(vnTime.toLocaleString("en-US", {timeZone: "UTC"})); // This is wrong logic
      
      // Better way:
      const vnNow = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(now);
      
      return vnNow;
    };

    const todayVN = getVNTodayStart();
    
    return history.filter(h => {
      if (h.status !== 'Hoàn thành') return false;
      if (h.task_id !== taskId) return false;
      
      const hDate = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(h.completed_at || h.created_at || h.timestamp));
      
      return hDate === todayVN;
    }).length;
  };

  const getTotalTodayTasks = () => {
    const now = new Date();
    const todayVN = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(now);

    return history.filter(h => {
      if (h.status !== 'Hoàn thành') return false;
      
      const hDate = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(h.completed_at || h.created_at || h.timestamp));
      
      return hDate === todayVN;
    }).length;
  };

  const todayTaskCount = getTotalTodayTasks();

  const getLaymaCompletedToday = () => {
    const now = new Date();
    const todayVN = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(now);

    return history.filter(h => {
      const isLayma = h.task_id === 'layma' || (h.taskName && h.taskName.toUpperCase().includes('LAYMA')) || (h.task_id && h.task_id.toUpperCase().includes('LAYMA'));
      if (!isLayma || h.status !== 'Hoàn thành') return false;
      
      const hDate = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date(h.completed_at || h.created_at || h.timestamp));
      
      return hDate === todayVN;
    }).length;
  };

  const laymaCompletedToday = getLaymaCompletedToday();
  const isUnlocked = laymaCompletedToday >= 2;
  const DAILY_LIMIT = 2207;

  const handleDoTask = async (task: any) => {
    if (!username) return;
    
    // Check per-task limit
    const taskCount = getTodayTaskCountPerTask(task.id);
    if (taskCount >= (task.max_views || task.maxViews || 0)) {
      showModal?.("Thông báo", "Bạn đã hết lượt làm nhiệm vụ này hôm nay!");
      return;
    }

    // Check global daily turn limit
    if (todayTaskCount >= DAILY_LIMIT) { 
      showModal?.("Giới hạn hằng ngày", "Bạn đã đạt giới hạn lượt làm nhiệm vụ mỗi ngày. Hãy quay lại vào ngày mai!");
      return;
    }

    setLoadingTask(task.id);
    
    const safeJson = async (res: Response) => {
      const text = await res.text();
      try {
        return text ? JSON.parse(text) : null;
      } catch (e) {
        console.error("JSON Parse Error. Data received:", text.substring(0, 500));
        // Nếu trả về HTML (thường là trang lỗi 404/500 của server hoặc proxy)
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
           throw new Error("Máy chủ đang bảo trì hoặc gặp lỗi hệ thống (HTML Error).");
        }
        throw new Error("Dữ liệu từ máy chủ không hợp lệ (Không phải JSON): " + text.substring(0, 50));
      }
    };
    
    try {
      showModal?.("Tiến trình", `Đang khởi tạo phiên làm việc cho ${task.name}...`, Loader2);

      // 1. TẠO SESSION ID TỪ BACKEND
      console.log("Creating session for user:", username, "task:", task.id);
      const sessionId = 'MDZ' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const userUuid = await syncService.getUserUuid(username);

      await syncService.createTaskSession({
          id: sessionId,
          user_id: username,
          task_id: task.id,
          task_name: task.name,
          reward: task.reward < 1 ? 0 : task.reward,
          status: 'Đang làm'
      });

      // 2. GẮN VÀO LINK DESTINATION ĐỂ CUNG CẤP CHO NHÀ CUNG CẤP URL SHORTENER
      const destinationUrl = `${window.location.origin}/#verify?code=${sessionId}&uuid=${userUuid}`;
      
      const apiRequestUrl = task.api_url + encodeURIComponent(destinationUrl);
      
      showModal?.("Đang lấy Link", `Hệ thống ${task.name} đang xử lý truy cập của bạn...`, Loader2);
      
      let responseText = "";
      try {
        const r1 = await fetch(apiRequestUrl);
        if (r1.ok) {
          responseText = await r1.text();
        } else {
          throw new Error("Direct fetch failed");
        }
      } catch (err) {
        try {
          const r2 = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(apiRequestUrl)}`);
          if (r2.ok) {
            responseText = await r2.text();
          } else {
            throw new Error("Proxy 1 failed");
          }
        } catch (err2) {
          try {
            const r3 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiRequestUrl)}`);
            if (r3.ok) {
              const data = await r3.json();
              responseText = data.contents;
            } else {
              throw new Error("Proxy 2 failed");
            }
          } catch (err3) {
            throw new Error("Lấy link thất bại do lỗi mạng hoặc CORS. Máy chủ tạo link từ chối kết nối.");
          }
        }
      }

      responseText = (responseText || "").trim();
      if (!responseText) throw new Error("API returned empty response.");

      let result;
      
      // Parse result
      if (responseText.startsWith('http') && !responseText.includes('<') && !responseText.includes('{')) {
        result = { status: "success", shortenedUrl: responseText };
      } else {
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          const urlMatch = responseText.match(/https?:\/\/[^\s"']+/);
          const scriptMatch = responseText.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
          
          if (scriptMatch && scriptMatch[1]) {
            let extractedUrl = scriptMatch[1];
            if (extractedUrl.startsWith('/')) extractedUrl = "https://linktot.net" + extractedUrl;
            result = { status: "success", shortenedUrl: extractedUrl };
          } else if (urlMatch && urlMatch[0]) {
            result = { status: "success", shortenedUrl: urlMatch[0] };
          } else {
            throw new Error("API trả về định dạng dữ liệu không hợp lệ.");
          }
        }
      }
      
      let link = 
        result.shortenedUrl || 
        result.url || 
        result.bbmktsUrl || 
        result.short_url ||
        result.data?.short_url ||
        result.data?.url ||
        result.result; 

      if (!link && result.html) {
        const urlMatch = result.html.match(/https?:\/\/[^\s"']+/);
        if (urlMatch) link = urlMatch[0];
      }

      const isSuccess = (result.status === "success" || result.success === true || !!link);

      if (isSuccess && link) {
        // HIỂN THỊ MODAL CUỐI CÙNG TRUNG TÂM
        showModal?.(
          "Sẵn sàng!", 
          `Nhiệm vụ ${task.name} đã sẵn sàng. Hãy hoàn thành để nhận ngay +${task.id === 'ads_qc' ? '0.0000000000000000005' : task.reward} điểm!`, 
          ExternalLink, 
          'action', 
          () => window.open(link, "_blank"), 
          "MỞ LINK NHIỆM VỤ"
        );
        
        // Refresh local history
        const histData = await syncService.getTaskHistory(username);
        if (histData) setHistory(histData);
      } else {
        throw new Error(result.message || result.error || JSON.stringify(result) || "API Error");
      }
    } catch (error: any) {
      console.error("Lỗi tạo link:", error);
      showModal?.("Lỗi phát sinh", error.message || "Không thể kết nối API. Thử lại sau!");
    } finally {
      setLoadingTask(null);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="text-orange-500" size={28} />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-black">TASK POINTS</h2>
        </div>
        
        {!isUnlocked && (
          <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
             <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white shrink-0 font-black text-sm">
              {laymaCompletedToday}/2
            </div>
            <p className="text-[10px] font-bold text-orange-400 uppercase leading-tight">
              Hoàn thành 2 nhiệm vụ TASK POINTS 1<br />để mở khóa tất cả nhiệm vụ!
            </p>
          </div>
        )}
      </div>



      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5">
        {/* Tasks */}
        {tasks.map((task) => {
          const isLayMa = task.id === 'layma' || task.name.toUpperCase().includes('LAYMA') || task.name.toUpperCase().includes('TASK POINTS 1');
          const isLocked = !isLayMa && !isUnlocked;
          
          return (
            <div key={task.id} className={`glass-morphism rounded-[1.5rem] p-4 flex flex-col justify-between border ${isLocked ? 'border-gray-200 bg-white opacity-60' : (task.is_hot ? 'border-orange-500/30 bg-orange-500/5' : 'border-black')} relative hover:shadow-md transition-shadow group overflow-hidden`}>
              {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
                   <div className="bg-white p-2 rounded-full mb-2 text-slate-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                   </div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 text-center">Bị Khoá</p>
                </div>
              )}
              
              {task.is_hot && !isLocked && (
                 <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-[12px] shadow-lg z-10 animate-pulse">
                   HOT 🔥
                 </div>
              )}
              <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-black shrink-0 shadow-lg border ${task.is_hot ? 'bg-orange-600 border-orange-500' : 'bg-white border-gray-200'}`}>
                    <ExternalLink size={18} className={task.is_hot ? 'text-black' : 'text-orange-500'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-black text-base uppercase tracking-tight truncate">{task.name}</h3>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Nhiệm vụ</div>
                  </div>
                </div>

                <div className={`rounded-[12px] p-3 flex items-center justify-between mb-3 border ${task.is_hot ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.is_hot ? 'text-orange-400' : 'text-emerald-500'}`}>Thưởng</span>
                  <div className="flex items-end flex-col min-w-0">
                    <span className={`font-black text-sm truncate ${task.is_hot ? 'text-orange-400' : 'text-emerald-400'}`}>+{task.id === 'ads_qc' ? '0.0000000000000000005' : task.reward} Điểm</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white rounded-[12px] p-2.5 border border-black flex flex-col justify-center">
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hạn mức</div>
                    <div className="font-bold text-black text-xs truncate">{getTodayTaskCountPerTask(task.id)}/{task.max_views}</div>
                  </div>
                  <div className="bg-orange-500/5 rounded-[12px] p-2.5 border border-orange-500/10 flex flex-col justify-center">
                    <div className="text-[8px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Duyệt</div>
                    <div className="font-bold text-orange-400 text-xs uppercase truncate">{task.auto ? 'Tự động' : 'Thủ công'}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-4 text-rose-400 bg-rose-500/5 p-2 rounded-[12px] border border-rose-500/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-rose-500 shrink-0"></div>
                    <span className="text-[8px] font-bold uppercase tracking-wider truncate">Cấm VPN / Proxy / Hack ID</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (isLocked) {
                    showModal?.("Thông báo", "Bạn cần hoàn thành nhiệm vụ TASK POINTS 1 để mở khóa!");
                    return;
                  }
                  handleDoTask(task);
                }}
                disabled={loadingTask === task.id || (!isLocked && getTodayTaskCountPerTask(task.id) >= task.max_views) || todayTaskCount >= DAILY_LIMIT}
                className={`w-full py-2.5 rounded-[12px] mt-auto font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg cursor-pointer relative overflow-hidden
                  ${isLocked 
                    ? 'bg-white text-slate-600 shadow-none grayscale cursor-not-allowed'
                    : (getTodayTaskCountPerTask(task.id) >= task.max_views || todayTaskCount >= DAILY_LIMIT
                        ? 'bg-white text-slate-500 shadow-none cursor-not-allowed border border-black' 
                        : (task.is_hot ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-950/40' : 'bg-white hover:bg-white text-black border border-gray-200 shadow-black/40'))}`}
              >
                {/* Recharging / Loading effect when limit reached */}
                {!isLocked && (getTodayTaskCountPerTask(task.id) >= task.max_views || todayTaskCount >= DAILY_LIMIT) && (
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent z-0"
                  />
                )}

                <span className="relative z-10 flex items-center gap-1.5 truncate text-[11px] sm:text-xs">
                  {isLocked ? (
                    <>ĐANG BỊ KHÓA <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></>
                  ) : (
                    loadingTask === task.id ? (
                      <><Loader2 size={14} className="animate-spin" /> ĐANG TẠO LINK...</>
                    ) : (
                      (getTodayTaskCountPerTask(task.id) >= task.max_views || todayTaskCount >= DAILY_LIMIT) ? (
                        <>{todayTaskCount >= DAILY_LIMIT ? 'ĐẠT GIỚI HẠN' : 'HẾT LƯỢT'} <Loader2 size={12} className="animate-spin opacity-50" /></>
                      ) : (
                        <>{task.is_hot ? '🔥 ' : ''}LÀM NHIỆM VỤ <ArrowUpRight size={14} /></>
                      )
                    )
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="glass-morphism rounded-[1.25rem] border border-black overflow-hidden mt-6">
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between font-bold text-black text-sm">
          <h3>Lịch sử nhiệm vụ</h3>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium text-right leading-tight hidden sm:block">Lịch sử sẽ được reset khi lượt làm nhiệm vụ được reset</span>
        </div>
        <div className="overflow-x-auto max-h-96 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-full text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-3 py-2.5">Thời gian</th>
                <th className="px-3 py-2.5">Nhiệm vụ</th>
                <th className="px-3 py-2.5">Thưởng</th>
                <th className="px-3 py-2.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
               {history.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-3 py-8 text-center text-slate-500 italic">Chưa có hoạt động nào được ghi lại.</td>
                 </tr>
               ) : (
                 history.map((record, idx) => (
                   <tr key={idx} className="hover:bg-white">
                     <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{new Date(record.timestamp || record.created_at).toLocaleString('vi-VN')}</td>
                     <td className="px-3 py-2.5 font-bold text-gray-900 truncate max-w-[120px] sm:max-w-xs">{record.taskName || record.task_name}</td>
                    <td className="px-3 py-2.5 font-bold text-emerald-400">+{record.task_id === 'ads_qc' || record.task_name === 'TASK POINT 13 - ADS QC' ? '0.0000000000000000005' : record.reward.toLocaleString()} Điểm</td>
                     <td className="px-3 py-2.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase 
                           ${record.status === 'Hoàn thành' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                             record.status === 'Từ chối' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                           {record.status}
                        </span>
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

