import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, ArrowUpRight, Loader2, Info, HelpCircle } from 'lucide-react';
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
  const [tick, setTick] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  const [isEventActive, setIsEventActive] = useState(false);

  const getOldReward = (taskId: string, currentReward: number) => {
    if (taskId === 'review_0') return 5000;
    if (taskId === 'layma') return 1500;
    if (taskId === 'link4m') return 1000;
    if (taskId === 'linktot') return 1000;
    if (taskId === 'timmap') return 500;
    if (taskId === 'bbmkts') return 500;
    if (taskId === 'utl_1step') return 1000;
    if (taskId === 'utl_2step') return 1050;
    if (taskId === 'utl_3step') return 1100;
    if (taskId === 'utl_4step') return 1150;
    return Math.ceil(currentReward * 0.7);
  };

  const getActualReward = (taskId: string, baseReward: number) => {
    if (isEventActive) return baseReward;
    return getOldReward(taskId, baseReward);
  };

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const active = currentHour >= 10 && currentHour < 19;
      
      if (isEventActive !== active) {
        setIsEventActive(active);
      }

      let targetTime = new Date(now);
      if (active) {
        targetTime.setHours(19, 0, 0, 0); // End of event today
      } else {
        if (currentHour >= 19) {
          targetTime.setDate(targetTime.getDate() + 1); // Start of event tomorrow
        }
        targetTime.setHours(10, 0, 0, 0); // Start of event today/tomorrow
      }

      const diffMs = targetTime.getTime() - now.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      
      const pad = (num: number) => num.toString().padStart(2, '0');
      setTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isEventActive]);

  const getTaskCooldownSeconds = (taskId: string) => {
    if (taskId !== 'ads_qc') return 0;
    
    const lastAdsTask = history.find(h => h.task_id === 'ads_qc');
    if (!lastAdsTask) return 0;
    
    const lastTime = new Date(lastAdsTask.timestamp || lastAdsTask.created_at).getTime();
    const now = new Date().getTime();
    
    const diff = now - lastTime;
    if (diff < 60000) {
        return Math.ceil((60000 - diff) / 1000);
    }
    
    return 0;
  };

  // Dữ liệu nhiệm vụ mặc định
  const DEFAULT_TASKS: TaskConfig[] = [
    { id: 'review_0', name: 'REVIEW - TASK POINTS 0', reward: 10000, api_url: 'https://linktot.net/api_rv_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 9999, auto: false, is_hot: true, status: 'hoạt động' },
    { id: 'link4m', name: 'TASK POINTS 1', reward: 1500, api_url: 'https://link4m.co/api-shorten/v2?api=68208afab6b8fc60542289b6&url=', max_views: 2, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'linktot', name: 'TASK POINTS 2', reward: 1500, api_url: 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 4, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'timmap', name: 'TASK POINTS 3', reward: 750, api_url: 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', max_views: 2, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_1step', name: 'TASK POINTS 4', reward: 1500, api_url: 'https://uptolink.vip/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=', max_views: 1234, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_2step', name: 'TASK POINTS 5', reward: 1050, api_url: 'https://uptolink.vip/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=4&url=', max_views: 4567, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_3step', name: 'TASK POINTS 6', reward: 1100, api_url: 'https://uptolink.vip/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=', max_views: 78910, auto: true, is_hot: false, status: 'hoạt động' },
    { id: 'utl_4step', name: 'TASK POINTS 7', reward: 1150, api_url: 'https://uptolink.vip/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=5&url=', max_views: 11121314, auto: true, is_hot: false, status: 'hoạt động' }
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
        const aIsReview = a.id === 'review_0';
        const bIsReview = b.id === 'review_0';

        if (aIsReview && !bIsReview) return -1;
        if (!aIsReview && bIsReview) return 1;

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
  const isUnlocked = true;
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
          reward: getActualReward(task.id, task.reward) < 1 ? 0 : getActualReward(task.id, task.reward),
          status: 'Đang làm'
      });

      // 2. GẮN VÀO LINK DESTINATION ĐỂ CUNG CẤP CHO NHÀ CUNG CẤP URL SHORTENER
      const isReviewTask = task.id === 'review_0';
      const destPath = isReviewTask ? '#verify-review' : '#verify';
      const destinationUrl = `${window.location.origin}/${destPath}?code=${sessionId}&uuid=${userUuid}`;
      
      let baseApiUrl = (task.api_url || "").trim();
      let link = "";
      let isSuccess = false;
      let result: any = null;
      
      if (!baseApiUrl) {
         link = destinationUrl;
         isSuccess = true;
      } else {
         if (baseApiUrl.endsWith('&url')) {
            baseApiUrl += '=';
         } else if (!baseApiUrl.endsWith('=')) {
            baseApiUrl += '&url=';
         }
         baseApiUrl = baseApiUrl.replace('&&', '&').replace('?&', '?');
         
         let apiRequestUrl = baseApiUrl + encodeURIComponent(destinationUrl);
         
         if (apiRequestUrl.includes('api_timmap_pt') || apiRequestUrl.includes('api_rv_pt')) {
             apiRequestUrl += `&url_phu=${encodeURIComponent(destinationUrl)}`;
         }
         
         showModal?.("Đang lấy Link", `Hệ thống ${task.name} đang xử lý truy cập của bạn...`, Loader2);
         
         let responseText = "";
         try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const p1 = fetch(apiRequestUrl, { signal: controller.signal })
              .then(r => r.ok ? r.text() : Promise.reject("D1"));
              
            const p2 = fetch('/api/tasks/get-link', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ url: apiRequestUrl }),
                 signal: controller.signal
              }).then(r => r.ok ? r.json() : Promise.reject("D2"))
                .then(d => d.success ? d.text : Promise.reject("D2.1"));
                
            const p3 = fetch(`https://cors.eu.org/${apiRequestUrl}`, { signal: controller.signal })
              .then(r => r.ok ? r.text() : Promise.reject("D3"));
              
            const p4 = fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiRequestUrl)}`, { signal: controller.signal })
              .then(r => r.ok ? r.json() : Promise.reject("D4"))
              .then(d => d.contents || Promise.reject("D4.1"));

            responseText = await Promise.any([p1, p2, p3, p4]);
            clearTimeout(timeoutId);
         } catch (error) {
            console.error("Link fetch errors:", error);
            throw new Error("Lấy link thất bại do máy chủ proxy từ chối kết nối.");
         }

         responseText = (responseText || "").trim();

         result = null;
         
         if (!responseText) {
            if (apiRequestUrl.includes('socialconventcontext.com')) {
               result = { status: "success", shortenedUrl: apiRequestUrl };
            } else {
               throw new Error("Thất bại. Điểm đến không phản hồi hoặc trả về dữ liệu rỗng (Empty response).");
            }
         } else if (responseText.startsWith('http') && !responseText.includes('<') && !responseText.includes('{')) {
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
         
         link = 
           result.shortenedUrl || 
           result.url || 
           result.bbmktsUrl || 
           result.short_url ||
           result.data?.short_url ||
           result.data?.url ||
           result.url_review ||
           result.result; 

         if (!link && result.html) {
           const urlMatch = result.html.match(/https?:\/\/[^\s"']+/);
           if (urlMatch) link = urlMatch[0];
         }

         // Ensure https:// is perfectly extracted from string
         if (typeof link === 'string') {
            link = link.replace(/["']/g, "").trim();
            const finalMatch = link.match(/https?:\/\/[^\s"']+/);
            if (finalMatch) {
               link = finalMatch[0];
            }
         }

         isSuccess = (result.status === "success" || result.success === true || !!link);
         
         if (!isSuccess) {
            throw new Error(result.message || result.error || JSON.stringify(result) || "API Error");
         }
      }

      if (isSuccess && link) {
        // HIỂN THỊ MODAL CUỐI CÙNG TRUNG TÂM
        showModal?.(
          "Sẵn sàng!", 
          `Nhiệm vụ ${task.name} đã sẵn sàng.\n\n🔗 Website Đích:\n${link}`, 
          ExternalLink, 
          'action', 
          () => window.open(link, "_blank"), 
          "MỞ LINK"
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
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="text-orange-500" size={28} />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-black">
             TASK POINTS
          </h2>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
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
          <button
            title="Hướng dẫn làm nhiệm vụ"
            onClick={() => showModal?.('Hướng dẫn làm nhiệm vụ', '1. Bấm vào một nhiệm vụ để mở link.\n2. Thực hiện các yêu cầu trên trang web đó (tìm kiếm từ khóa, cuộn trang lấy mã...).\n3. Hoàn thành để nhận điểm tự động vào tài khoản.\n\nTASK POINTS 0 - REVIEW:\nNẾU KHÔNG CÓ NHIỆM VỤ HÃY TẠO LINK LIÊN TỤC TRONG 30S SẼ CÓ MÃ.', Info)}
            className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer shadow-sm ml-auto"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>



      {/* TIME-LIMITED REWARD BOOST EVENT CARD */}
      <div className={`rounded-3xl p-5 md:p-6 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 ${isEventActive ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500' : 'bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400'}`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black text-[10px] font-black uppercase tracking-widest ${isEventActive ? 'text-orange-600 animate-pulse' : 'text-slate-600'}`}>
            {isEventActive ? '💥 Sự Kiện Đang Diễn Ra' : '⏳ Sắp Diễn Ra'}
          </div>
          <h3 className="text-xl md:text-2xl font-black italic tracking-tight uppercase leading-none text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
            HỘI CHỢ ĐỔI ĐIỂM - TĂNG THƯỞNG GIỜ VÀNG
          </h3>
          <p className="text-xs font-bold text-white/95 max-w-xl">
            {isEventActive 
               ? "Tất cả phần thưởng nhiệm vụ đã được tăng từ 10h sáng đến 19h tối hàng ngày. Hãy nhanh tay tham gia tích lũy thêm điểm thưởng!" 
               : "Sự kiện nhân điểm thưởng sẽ được kích hoạt vào 10:00 sáng đến 19:00 tối hàng ngày. Hãy chuẩn bị tham gia!"}
          </p>
        </div>

        <div className="relative z-10 bg-black/40 border border-white/20 p-4 rounded-2xl text-center md:text-right min-w-[150px] flex-shrink-0 animate-in zoom-in-95 leading-none">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 leading-none ${isEventActive ? 'text-yellow-300' : 'text-slate-300'}`}>
            {isEventActive ? 'KẾT THÚC SAU' : 'BẮT ĐẦU SAU'}
          </p>
          <span className="font-mono text-xl sm:text-2xl font-black text-white drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] tracking-widest">
            {timeLeft || '00:00:00'}
          </span>
          <p className="text-[9px] text-white/60 font-semibold uppercase tracking-wider mt-1.5">TỰ ĐỘNG CHUYỂN HOÁ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 md:gap-5">
        {/* Tasks */}
        {tasks.map((task) => {
          const isLayMa = task.id === 'layma' || task.name.toUpperCase().includes('LAYMA') || task.name.toUpperCase().includes('TASK POINTS 1');
          const isLocked = !isLayMa && !isUnlocked;
          
          return (
            <div key={task.id} className={`glass-morphism rounded-[1.5rem] p-4 flex flex-col justify-between border ${isLocked ? 'border-gray-200 bg-white opacity-60' : (task.id === 'review_0' ? 'border-red-500 bg-red-50 relative' : (task.is_hot ? 'border-orange-500/30 bg-orange-500/5' : 'border-black'))} relative hover:shadow-md transition-shadow group overflow-hidden`}>
              {task.id === 'review_0' && !isLocked && (
                 <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-[pulse_2s_ease-in-out_infinite]" />
              )}
              {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
                   <div className="bg-white p-2 rounded-full mb-2 text-slate-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                   </div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 text-center">Bị Khoá</p>
                </div>
              )}
              
              {task.id === 'review_0' && !isLocked && (
                 <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-[12px] shadow-lg z-10 animate-pulse">
                   TASK POINTS ĐẶC BIỆT 🔥
                 </div>
              )}
              
              {task.is_hot && task.id !== 'review_0' && !isLocked && (
                 <div className="absolute top-0 right-0 bg-orange-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-[12px] shadow-lg z-10 animate-pulse">
                   HOT 🔥
                 </div>
              )}
              <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
              
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-black shrink-0 shadow-lg border ${task.id === 'review_0' ? 'bg-red-600 border-red-500 text-white' : (task.is_hot ? 'bg-orange-600 border-orange-500' : 'bg-white border-gray-200')}`}>
                    <ExternalLink size={18} className={task.id === 'review_0' ? 'text-white' : (task.is_hot ? 'text-black' : 'text-orange-500')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className={`font-black text-base uppercase tracking-tight truncate ${task.id === 'review_0' ? 'text-red-700 font-extrabold' : 'text-black'}`}>{task.name}</h3>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Nhiệm vụ</div>
                  </div>
                </div>

                <div className={`rounded-[12px] p-3 flex items-center justify-between mb-3 border ${task.id === 'review_0' ? 'bg-red-500/10 border-red-500/20' : (task.is_hot ? 'bg-orange-500/10 border-orange-500/20' : 'bg-emerald-500/10 border-emerald-500/20')}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${task.id === 'review_0' ? 'text-red-600' : (task.is_hot ? 'text-orange-400' : 'text-emerald-500')}`}>Thưởng</span>
                  <div className="flex items-end flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isEventActive && getOldReward(task.id, task.reward) > 0 && task.id !== 'ads_qc' && (
                        <span className="text-gray-400 line-through text-[11px] font-semibold">
                          {getOldReward(task.id, task.reward).toLocaleString()} Điểm
                        </span>
                      )}
                      <span className={`font-black text-xs sm:text-sm truncate ${task.id === 'review_0' ? 'text-red-600 font-extrabold pb-0.5' : (task.is_hot ? 'text-orange-500' : 'text-emerald-500')}`}>
                        +{task.id === 'ads_qc' ? '0.00005' : getActualReward(task.id, task.reward).toLocaleString()} Điểm
                      </span>
                    </div>
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
                  if (getTaskCooldownSeconds(task.id) > 0) return;
                  handleDoTask(task);
                }}
                disabled={loadingTask === task.id || (!isLocked && getTodayTaskCountPerTask(task.id) >= task.max_views) || todayTaskCount >= DAILY_LIMIT || getTaskCooldownSeconds(task.id) > 0}
                className={`w-full py-2.5 rounded-[12px] mt-auto font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg cursor-pointer relative overflow-hidden
                  ${isLocked 
                    ? 'bg-white text-slate-600 shadow-none grayscale cursor-not-allowed'
                    : (getTodayTaskCountPerTask(task.id) >= task.max_views || todayTaskCount >= DAILY_LIMIT || getTaskCooldownSeconds(task.id) > 0
                        ? 'bg-white text-slate-500 shadow-none cursor-not-allowed border border-black' 
                        : (task.id === 'review_0' ? 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-red-900/40 border-none' : (task.is_hot ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-950/40' : 'bg-white hover:bg-white text-black border border-gray-200 shadow-black/40')))}`}
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
                      ) : getTaskCooldownSeconds(task.id) > 0 ? (
                        <>ĐỢI {getTaskCooldownSeconds(task.id)}S <Loader2 size={12} className="animate-spin opacity-50" /></>
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
            <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-3 py-2.5">Thời gian</th>
                <th className="px-3 py-2.5">Nhiệm vụ</th>
                <th className="px-3 py-2.5">Thưởng</th>
                <th className="px-3 py-2.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-white">
               {history.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-3 py-8 text-center text-slate-500 italic">Chưa có hoạt động nào được ghi lại.</td>
                 </tr>
               ) : (
                 history.map((record, idx) => (
                   <tr key={idx} className="hover:bg-gray-50/50">
                     <td className="px-3 py-2.5 text-[10px] font-mono text-slate-500">{new Date(record.timestamp || record.created_at).toLocaleString('vi-VN')}</td>
                     <td className="px-3 py-2.5 font-bold text-gray-900 truncate max-w-[120px] sm:max-w-xs">{record.taskName || record.task_name}</td>
                     <td className="px-3 py-2.5 font-bold text-emerald-400">+{record.task_id === 'ads_qc' || (record.task_name && record.task_name.toUpperCase().includes('ADS QC')) ? '0.00005' : record.reward?.toLocaleString()} Điểm</td>
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

