import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  MessageSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  Users,
  Box,
  DollarSign,
  Pencil,
  Gem,
  Settings,
  Lock,
  Unlock,
  Shield,
  Activity,
  Calendar,
  Award,
  Search,
  Eye,
  EyeOff,
  ShieldAlert,
  Receipt,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

import { syncService } from '../../lib/syncService';

export default function AdminSection({ 
  setActiveTab, 
  username,
  systemMods, 
  setSystemMods, 
  depositRequests, 
  setDepositRequests, 
  withdrawRequests,
  setWithdrawRequests,
  setVndBalance,
  depositHistory,
  setDepositHistory,
  activityLogs,
  addActivityLog,
  globalStats,
  isAdmin = false
}: { 
  setActiveTab: (tab: string) => void, 
  username: string,
  systemMods: any[], 
  setSystemMods: React.Dispatch<React.SetStateAction<any[]>>, 
  depositRequests?: any[], 
  setDepositRequests?: React.Dispatch<React.SetStateAction<any[]>>, 
  withdrawRequests?: any[],
  setWithdrawRequests?: React.Dispatch<React.SetStateAction<any[]>>,
  setVndBalance?: React.Dispatch<React.SetStateAction<number>>,
  depositHistory?: any[],
  setDepositHistory?: React.Dispatch<React.SetStateAction<any[]>>,
  activityLogs?: any[],
  addActivityLog?: (user: string, action: string, amount: string, type: 'mod' | 'deposit' | 'system') => void,
  globalStats: {
    totalPointsRewarded: number,
    totalExchanges: number,
    totalUsers: number,
    totalMods: number,
    todayActiveUsers: number
  },
  isAdmin?: boolean
}) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [isAddingMod, setIsAddingMod] = useState(false);
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [newMod, setNewMod] = useState({ 
    name: '', 
    price: '', 
    currency: 'Điểm', 
    file: null as any, 
    fileName: '', 
    fileSize: '',
    modLink: '', 
    imgFile: null as any, 
    imgFileName: '' 
  });

  // MEMBERS SUBTAB STATES
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [editVndInput, setEditVndInput] = useState('0');
  const [editVndAction, setEditVndAction] = useState<'add' | 'sub' | 'set'>('add');
  const [editPointsInput, setEditPointsInput] = useState('0');
  const [editPointsAction, setEditPointsAction] = useState<'add' | 'sub' | 'set'>('add');
  const [editPointsLocked, setEditPointsLocked] = useState(false);
  const [editVndLocked, setEditVndLocked] = useState(false);
  const [editIsCheater, setEditIsCheater] = useState(false);
  const [selectedUserRow, setSelectedUserRow] = useState<string | null>(null);

  // SEARCH STATES
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [depositSearchQuery, setDepositSearchQuery] = useState('');
  const [withdrawSearchQuery, setWithdrawSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [revenueTableTab, setRevenueTableTab] = useState<'all' | 'today' | 'profit_loss'>('all');

  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskFilterCheaterOnly, setTaskFilterCheaterOnly] = useState(false);
  const [taskPage, setTaskPage] = useState(0);
  const tasksPerPage = 15;

  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const data = await syncService.getAllUsersProfiles();
      setUsersList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const fetchTasks = async () => {
    setIsTasksLoading(true);
    try {
      const data = await syncService.getAllTaskHistory();
      setAllTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTasksLoading(false);
    }
  };

  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);

  const fetchReviews = async () => {
    setIsReviewsLoading(true);
    try {
      const data = await syncService.getPendingReviewTasks();
      setPendingReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const [selectedBillForView, setSelectedBillForView] = useState<any | null>(null);

  const handleQuickUnban = async (usernameToUnban: string) => {
    if (!usernameToUnban) return;
    const plainName = usernameToUnban.split('||')[0];
    if (!window.confirm(`Bạn có chắc muốn MỞ KHÓA tài khoản [@${plainName}] ngay lập tức bằng 1 click?`)) return;
    try {
      const res = await syncService.quickUnbanUser(plainName);
      if (res) {
        alert(`Đã mở khóa tài khoản @${plainName} thành công! Quyết định có tác dụng ngay lập tức.`);
        fetchUsers();
      } else {
        alert('Lỗi khi mở khóa tài khoản!');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi hệ thống!');
    }
  };

  const handleClearDeviceHistory = async (usernameToClear: string) => {
    if (!usernameToClear) return;
    const plainName = usernameToClear.split('||')[0];
    if (!window.confirm(`Bạn có chắc muốn XÓA LỊCH SỬ THIẾT BỊ (Bypass Bot check clone) của [@${plainName}] khỏi hệ thống?\nHành động này sẽ xóa sạch dấu vân tay thiết bị (fingerprint logs) liên quan để người chơi này và các clone cũ có thể tạo nick mới.`)) return;
    try {
      const res = await syncService.clearFingerprintsFromSystem(usernameToClear);
      if (res) {
        alert(`Đã xóa sạch lịch sử thiết bị của @${plainName} thành công! Thiết bị này hiện đã hoàn toàn trống lịch sử bot.`);
        fetchUsers();
      } else {
        alert('Lỗi khi xóa lịch sử thiết bị!');
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi!');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users' || activeSubTab === 'overview' || activeSubTab === 'mods') {
      fetchUsers();
    }
    if (activeSubTab === 'withdraws' || activeSubTab === 'mods') {
      fetchTasks();
    }
    if (activeSubTab === 'reviews') {
      fetchReviews();
    }
  }, [activeSubTab]);

  const handleUpdateUserSetting = async () => {
    if (!selectedUserForEdit) return;

    const userToEdit = selectedUserForEdit;
    let newVnd = userToEdit.vnd_balance;
    const vDelta = parseInt(editVndInput) || 0;
    if (editVndAction === 'add') {
      newVnd += vDelta;
    } else if (editVndAction === 'sub') {
      newVnd = Math.max(0, newVnd - vDelta);
    } else {
      newVnd = Math.max(0, vDelta);
    }

    let newPoints = userToEdit.points_balance;
    const pDelta = parseInt(editPointsInput) || 0;
    if (editPointsAction === 'add') {
      newPoints += pDelta;
    } else if (editPointsAction === 'sub') {
      newPoints = Math.max(0, newPoints - pDelta);
    } else {
      newPoints = Math.max(0, pDelta);
    }

    const updates = {
      vnd_balance: newVnd,
      points_balance: newPoints,
      vnd_locked: editVndLocked,
      points_locked: editPointsLocked,
      is_cheater: editIsCheater
    };

    const success = await syncService.adminUpdateUserProfile(userToEdit.username, updates);
    if (success) {
      // If editing logged-in user, refresh locally too
      if (userToEdit.username === username && setVndBalance) {
        setVndBalance(newVnd);
      }
      
      if (addActivityLog) {
        addActivityLog(
          'Admin', 
          `Cập nhật thành viên ${userToEdit.username.split('||')[0]} (VNĐ: ${newVnd.toLocaleString()}, Điểm: ${newPoints.toLocaleString()}, Khóa VNĐ: ${editVndLocked ? 'Bật' : 'Tắt'}, Khóa Điểm: ${editPointsLocked ? 'Bật' : 'Tắt'}, Gian lận: ${editIsCheater ? 'Có' : 'Không'})`, 
          '', 
          'system'
        );
      }

      alert(`Đã cập nhật cấu hình cho ${userToEdit.username.split('||')[0]} thành công!`);
      setSelectedUserForEdit(null);
      fetchUsers();
    } else {
      alert('Không thể cập nhật cấu hình thành viên. Vui lòng đảm bảo các cột trong database đã được tạo chính xác!');
    }
  };

  const getTodayActiveUsersTable = () => {
    const today = new Date().toDateString();
    const seenUsers = new Set<string>();
    const list: any[] = [];

    const getDeterministicDevice = (uname: string) => {
      let hash = 0;
      for (let i = 0; i < uname.length; i++) {
        hash += uname.charCodeAt(i);
      }
      const index = hash % 3;
      if (index === 0) return 'Android OS';
      if (index === 1) return 'Mobile iOS';
      return 'Windows OS';
    };

    // Parse actual activity logs from today
    (activityLogs || []).forEach(log => {
      try {
        const logDate = new Date(log.created_at || Date.now()).toDateString();
        const usernameClean = (log.user || '').split('||')[0];
        if (logDate === today && usernameClean && !seenUsers.has(usernameClean)) {
          seenUsers.add(usernameClean);
          
          const actionParts = (log.action || '').split('||');
          const plainAction = actionParts[0];
          const logDevice = actionParts[1] || getDeterministicDevice(usernameClean);

          const matchingUserProfile = usersList.find(u => u.username === usernameClean || u.username.split('||')[0] === usernameClean);
          const isUserOnline = matchingUserProfile ? matchingUserProfile.isOnline : false;

          list.push({
            name: usernameClean,
            lastAction: plainAction || 'Truy cập hệ thống',
            time: log.time || new Date(log.created_at).toLocaleTimeString('vi-VN'),
            device: logDevice,
            status: isUserOnline ? 'Online' : 'Offline'
          });
        }
      } catch (err) {
        console.error(err);
      }
    });

    return list;
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
           <XCircle size={48} />
        </div>
        <h2 className="text-2xl font-black text-black uppercase italic">Truy Cập Bị Từ Chối</h2>
        <p className="text-gray-600 max-w-xs">Bạn không có quyền hạn để truy cập khu vực quản trị này.</p>
        <button 
          onClick={() => setActiveTab('home')}
          className="px-6 py-3 bg-white hover:bg-white rounded-xl font-bold transition-all text-black"
        >
          QUAY LẠI TRANG CHỦ
        </button>
      </div>
    );
  }

  const totalRevenue = (depositHistory || []).filter(item => item.status === 'thành công').reduce((sum, item) => sum + (item.finalAmount || item.amount || 0), 0);

  const handleAddOrEditMod = async () => {
    if (!newMod.name || !newMod.price || !addActivityLog) return;
    
    const priceValue = parseInt(newMod.price) || 0;
    let fileUrl = '';
    let imgUrl = '';

    if (newMod.file) {
      const uploadedUrl = await syncService.uploadModFile(newMod.file);
      if (uploadedUrl) {
        fileUrl = uploadedUrl;
      } else {
        alert('Lỗi khi tải file mod lên hệ thống. Vui lòng thử lại!');
        return;
      }
    }

    if (newMod.imgFile) {
      const uploadedImgUrl = await syncService.uploadModFile(newMod.imgFile);
      if (uploadedImgUrl) {
        imgUrl = uploadedImgUrl;
      } else {
        alert('Lỗi khi tải ảnh thumbnail lên hệ thống. Vui lòng thử lại!');
        return;
      }
    }

    const modData: any = {
      name: newMod.name,
      price_vnd: newMod.currency === 'VNĐ' ? priceValue : 0,
      price_points: newMod.currency === 'Điểm' ? priceValue : 0,
      category: newMod.currency === 'VNĐ' ? 'VIP' : 'FREE',
      mod_link: newMod.modLink
    };

    if (newMod.file || fileUrl) {
      modData.file_url = fileUrl;
    }
    
    modData.file_name = newMod.fileSize ? `${newMod.fileName || newMod.name}|${newMod.fileSize}` : (newMod.fileName || newMod.name);

    if (newMod.imgFile || imgUrl) {
      modData.img = imgUrl;
    }

    if (editingModId) {
      const updatedMod = await syncService.updateMod(editingModId, modData);
      if (updatedMod) {
        const fileData = updatedMod.file_name?.split('|') || [];
        const mappedMod = {
          ...updatedMod,
          price: `${priceValue} ${newMod.currency}`,
          fileName: fileData[0] || '',
          fileSize: fileData[1] || ''
        };
        setSystemMods(systemMods.map(m => m.id === editingModId ? mappedMod : m));
        addActivityLog('Admin', `Chỉnh sửa Mod: ${newMod.name}`, '', 'system');
      }
    } else {
      modData.status = 'hoạt động';
      const savedMod = await syncService.addMod(modData);
      if (savedMod) {
        const fileData = savedMod.file_name?.split('|') || [];
        const mappedMod = {
          ...savedMod,
          price: `${priceValue} ${newMod.currency}`,
          fileName: fileData[0] || '',
          fileSize: fileData[1] || ''
        };
        setSystemMods([mappedMod, ...systemMods]);
        addActivityLog('Admin', `Thêm Mod mới: ${newMod.name}`, '', 'system');
      }
    }
    
    setNewMod({ name: '', price: '', currency: 'Điểm', file: null, fileName: '', fileSize: '', modLink: '', imgFile: null, imgFileName: '' });
    setIsAddingMod(false);
    setEditingModId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMod({ ...newMod, file: file, fileName: file.name });
    }
  };

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewMod({ ...newMod, imgFile: file, imgFileName: file.name });
    }
  };

  const deleteMod = async (id: string) => {
    const mod = systemMods.find(m => m.id === id);
    if (mod && addActivityLog) {
      await syncService.deleteMod(id);
      addActivityLog('Admin', `Xóa Mod: ${mod.name}`, '', 'system');
      setSystemMods(systemMods.filter(m => m.id !== id));
    }
  };

  const stats = [
    { label: 'Tổng Doanh Thu', value: `${totalRevenue.toLocaleString()} VNĐ`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Số Người Online Hôm Nay', value: globalStats.todayActiveUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
    { label: 'Bản Mod Hoạt Động', value: systemMods.length.toString(), icon: Box, color: 'text-orange-400' },
    { label: 'Yêu Cầu Nạp Đợi Duyệt', value: (depositRequests || []).length.toString(), icon: CreditCard, color: 'text-red-400' },
    { label: 'Yêu Cầu Rút Điểm Đợi', value: (withdrawRequests ? withdrawRequests.filter(r => r.status === 'Chờ duyệt').length : 0).toString(), icon: Gem, color: 'text-cyan-400' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer text-gray-600 hover:text-black">
            <TrendingUp className="rotate-[270deg]" size={20} />
          </button>
          <h2 className="text-3xl font-black italic text-black uppercase tracking-tighter border-l-4 border-orange-500 pl-4">QUẢN TRỊ HỆ THỐNG</h2>
        </div>
        <div className="flex bg-white p-1 rounded-xl overflow-x-auto max-w-full">
          <button 
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubTab === 'overview' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Tổng Quan
          </button>
          <button 
            onClick={() => setActiveSubTab('mods')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubTab === 'mods' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Quản Lý Mod
          </button>
          <button 
            onClick={() => setActiveSubTab('deposits')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubTab === 'deposits' ? 'bg-orange-600 text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Duyệt Nạp
          </button>
          <button 
            onClick={() => setActiveSubTab('withdraws')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubTab === 'withdraws' ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Duyệt Rút Điểm
          </button>
          <button 
            onClick={() => setActiveSubTab('reviews')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubTab === 'reviews' ? 'bg-red-600 text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Duyệt Review
          </button>
          <button 
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSubTab === 'users' ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Thành Viên
          </button>
        </div>
      </div>

      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="glass-morphism p-6 rounded-3xl border border-gray-200 hover:border-gray-200 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <TrendingUp size={16} className="text-green-400" />
                </div>
                <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-black mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-morphism rounded-3xl overflow-hidden border border-gray-200">
              <div className="p-5 border-b border-gray-200 font-bold bg-white flex justify-between items-center">
                <span>Hoạt Động Gần Đây</span>
                <span className="text-[10px] text-orange-500 uppercase">Live Update</span>
              </div>
              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {(!activityLogs || activityLogs.length === 0) ? (
                   <p className="text-center text-gray-500 py-8 text-sm">Chưa có hoạt động nào.</p>
                ) : (
                  activityLogs.map(log => (
                    <div key={log.id} className="flex items-center space-x-4 p-3 hover:bg-white rounded-2xl transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-black ${log.type === 'mod' ? 'bg-orange-500' : (log.type === 'deposit' ? 'bg-green-500' : 'bg-blue-500')}`}>
                        {log.user?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-black">{log.user} <span className="text-gray-600 font-normal">{(log.action || '').split('||')[0]}</span></p>
                        <p className="text-[10px] text-gray-500">{log.time}</p>
                      </div>
                      <div className={`text-xs font-bold ${log.amount && log.amount.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                        {log.amount}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* BẢNG Số Người Online Hôm Nay 2 - RESET HÀNG NGÀY */}
              <div className="glass-morphism rounded-3xl overflow-hidden border border-gray-200">
                <div className="p-5 border-b border-gray-200 font-bold bg-white flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Activity size={18} className="text-green-500 animate-pulse" />
                    <span>Số Người Online Hôm Nay</span>
                  </div>
                  <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">
                    {getTodayActiveUsersTable().length} Online
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[9px]">
                        <th className="px-4 py-3">TÊN ĐĂNG NHẬP</th>
                        <th className="px-4 py-3">HOẠT ĐỘNG CUỐI</th>
                        <th className="px-4 py-3">THỜI GIAN</th>
                        <th className="px-4 py-3">THIẾT BỊ</th>
                        <th className="px-4 py-3">TRẠNG THÁI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {getTodayActiveUsersTable().map((user, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-black">{user.name}</td>
                          <td className="px-4 py-3 text-gray-600 italic">{user.lastAction}</td>
                          <td className="px-4 py-3 text-gray-500">{user.time}</td>
                          <td className="px-4 py-3 text-gray-400 font-mono">{user.device}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center space-x-1 text-green-500 font-bold text-[9px] uppercase bg-green-500/15 px-2 py-0.5 rounded-md">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                              <span>ONLINE</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BẢNG HIỂN THỊ SỐ NGƯỜI DÙNG THẬT CỦA HỆ THỐNG */}
              <div className="glass-morphism rounded-3xl overflow-hidden border border-gray-200">
                <div className="p-5 border-b border-gray-200 font-bold bg-white flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                  <div className="flex items-center space-x-2">
                    <Users size={18} className="text-orange-500" />
                    <span>Bảng Người Dùng</span>
                  </div>
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <input
                        type="text"
                        placeholder="Tìm thành viên nhanh..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 text-black border border-gray-200 rounded-xl px-3 py-1.5 pl-8 text-[11px] font-semibold focus:border-green-600 outline-none transition-all"
                      />
                      <Search className="absolute left-2.5 top-2.5 text-gray-400" size={11} />
                    </div>
                    <span className="text-[10px] bg-orange-500/10 text-orange-600 px-2 py-1.5 rounded-xl font-bold uppercase whitespace-nowrap">
                      Tổng: {usersList.length} User Thật
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    {usersList.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">Đang quét người dùng...</div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[9px]">
                            <th className="px-4 py-3">STT</th>
                            <th className="px-4 py-3">TÊN ĐĂNG NHẬP</th>
                            <th className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => setShowAllPasswords(!showAllPasswords)}
                                className="flex items-center space-x-1 hover:text-black font-bold uppercase text-[9px] transition-colors focus:outline-none focus:ring-0"
                              >
                                <span>MẬT KHẨU</span>
                                {showAllPasswords ? <EyeOff size={11} className="text-gray-400" /> : <Eye size={11} className="text-gray-400" />}
                              </button>
                            </th>
                            <th className="px-4 py-3">SỐ DƯ VNĐ</th>
                            <th className="px-4 py-3">SỐ DƯ ĐIỂM</th>
                            <th className="px-4 py-3 font-bold text-center">THÔNG TIN</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(() => {
                            const filtered = usersList.filter(user => {
                              const q = userSearchQuery.trim().toLowerCase();
                              if (!q) return true;
                              const plainName = user.username.split('||')[0].toLowerCase();
                              const ffId = (user.ff_id || '').toLowerCase();
                              const lqUid = (user.lq_uid || '').toLowerCase();
                              return plainName.includes(q) || ffId.includes(q) || lqUid.includes(q);
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 italic">
                                    Không tìm thấy người dùng khớp với "{userSearchQuery}"
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((user, idx) => {
                              const nameParts = user.username.split('||');
                              const plainName = nameParts[0];
                              const pwHash = nameParts[1] || 'LEGACY';
                              const isPasswordVisible = showAllPasswords || !!visiblePasswords[user.username];
                              return (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-2.5 text-gray-400 font-mono">{idx + 1}</td>
                                  <td className="px-4 py-2.5 font-bold text-black max-w-[150px] truncate" title={plainName}>{plainName}</td>
                                  <td className="px-4 py-2.5 font-mono text-gray-500 text-[11px] max-w-[150px]">
                                    <div className="flex items-center space-x-2">
                                      <span className="select-all truncate block" title={pwHash}>{isPasswordVisible ? pwHash : '••••••••'}</span>
                                      <button 
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setVisiblePasswords(prev => ({
                                            ...prev,
                                            [user.username]: !prev[user.username]
                                          }));
                                        }}
                                        className="text-gray-400 hover:text-black transition-colors p-0.5 rounded hover:bg-gray-200"
                                        title={isPasswordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                      >
                                        {isPasswordVisible ? <EyeOff size={11} /> : <Eye size={11} />}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-green-600 font-black">{(user.vnd_balance || 0).toLocaleString()}đ</td>
                                  <td className="px-4 py-2.5 text-orange-500 font-black">{(user.points_balance || 0).toLocaleString()}</td>
                                  <td className="px-4 py-2.5 text-center text-gray-500">
                                    <div className="flex items-center justify-center gap-1 flex-wrap">
                                      {user.ff_id && <span className="text-[10px] bg-red-50 text-red-500 px-1 rounded max-w-[150px] truncate block" title={`FF: ${user.ff_id}`}>FF: {user.ff_id}</span>}
                                      {user.lq_uid && <span className="text-[10px] bg-blue-50 text-blue-500 px-1 rounded max-w-[150px] truncate block" title={`LQ: ${user.lq_uid}`}>LQ: {user.lq_uid}</span>}
                                      {!user.ff_id && !user.lq_uid && <span className="text-gray-400 italic block">Chưa nhập</span>}
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'mods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600">Đang quản lý <span className="text-black font-bold">{systemMods.length}</span> bản mod</p>
            <button 
              onClick={() => setIsAddingMod(true)}
              className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Plus size={16} /> <span>THÊM MOD MỚI</span>
            </button>
          </div>

          {isAddingMod && (
            <div className="glass-morphism p-6 rounded-3xl border border-orange-500/30 space-y-4 animate-in slide-in-from-top-4">
              <h3 className="text-lg font-bold">{editingModId ? 'SỬA BẢN MOD' : 'THÊM MOD MỚI'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] text-gray-500 font-bold mb-2 tracking-widest uppercase">Tên Mod</label>
                  <input 
                    type="text" 
                    placeholder="Tên Mod (ví dụ: AK Rồng Xanh)" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none shadow-sm"
                    value={newMod.name}
                    onChange={(e) => setNewMod({ ...newMod, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold mb-2 tracking-widest uppercase">Giá</label>
                  <input 
                    type="text" 
                    placeholder="Giá" 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none shadow-sm"
                    value={newMod.price}
                    onChange={(e) => setNewMod({ ...newMod, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold mb-2 tracking-widest uppercase">Loại Tiền</label>
                  <select 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none text-black shadow-sm"
                    value={newMod.currency}
                    onChange={(e) => setNewMod({ ...newMod, currency: e.target.value })}
                  >
                    <option value="Điểm">Điểm (Free Mod)</option>
                    <option value="VNĐ">VNĐ (VIP Mod)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold mb-2 tracking-widest uppercase">Lựa chọn Mod</label>
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase text-[9px]">Lựa chọn 1: File Mod (Zip/Bin/txt...)</label>
                      <div className="flex items-center space-x-4 bg-white border border-gray-200 rounded-xl p-3">
                        <input 
                          type="file" 
                          id="mod-file" 
                          className="hidden" 
                          onChange={handleFileChange}
                        />
                        <label htmlFor="mod-file" className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-gray-200">
                          {newMod.fileName ? 'ĐỔI FILE' : 'CHỌN FILE'}
                        </label>
                        <span className="text-[11px] text-gray-600 truncate flex-1">
                          {newMod.fileName || 'Để trống nếu dùng Link'}
                        </span>
                        {newMod.fileName && (
                          <button onClick={() => setNewMod({ ...newMod, file: null, fileName: '' })} className="text-red-500 p-1 hover:bg-red-50 rounded">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <label className="block text-[10px] text-gray-400 font-bold mb-1 uppercase text-[9px]">Lựa chọn 2: Link Mod (Drive, Mega...)</label>
                      <input 
                        type="text" 
                        placeholder="Dán link tải mod tại đây..." 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none shadow-sm"
                        value={newMod.modLink}
                        onChange={(e) => setNewMod({ ...newMod, modLink: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <label className="block text-[10px] text-gray-500 font-bold mb-2 tracking-widest uppercase">Dung lượng File</label>
                    <input 
                      type="text" 
                      placeholder="Dung lượng (ví dụ: 15.5 MB)" 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none shadow-sm"
                      value={newMod.fileSize}
                      onChange={(e) => setNewMod({ ...newMod, fileSize: e.target.value })}
                    />
                  </div>
                  
                  <label className="block text-[10px] text-gray-500 font-bold mb-2 tracking-widest uppercase">Ảnh Thumnail (JPG/PNG)</label>
                  <div className="flex items-center space-x-4 bg-white border border-gray-200 rounded-xl p-3 h-[116px]">
                    <div className="flex flex-col items-center justify-center space-y-2 w-full">
                      <input 
                        type="file" 
                        id="mod-img" 
                        className="hidden" 
                        onChange={handleImgChange}
                        accept="image/*"
                      />
                      <label htmlFor="mod-img" className="px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-orange-200 w-full text-center">
                        {newMod.imgFileName ? 'THAY ĐỔI ẢNH' : 'CHỌN ẢNH THUMBNAIL'}
                      </label>
                      <span className="text-[11px] text-gray-600 truncate text-center">
                        {newMod.imgFileName || 'Chưa có ảnh nào được chọn'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={handleAddOrEditMod}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1"
                >
                  LƯU BẢN MOD
                </button>
                <button 
                  onClick={() => {
                    setIsAddingMod(false);
                    setEditingModId(null);
                    setNewMod({ name: '', price: '', currency: 'Điểm', file: null, fileName: '', fileSize: '', modLink: '', imgFile: null, imgFileName: '' });
                  }}
                  className="px-6 py-3 bg-white hover:bg-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  HỦY
                </button>
              </div>
            </div>
          )}

          <div className="glass-morphism rounded-[1.25rem] overflow-hidden border border-gray-200">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-white text-[10px] text-gray-600 uppercase">
                  <th className="px-3 py-2.5">Tên Mod</th>
                  <th className="px-3 py-2.5">Giá</th>
                  <th className="px-3 py-2.5 text-center">Lượt Tải</th>
                  <th className="px-3 py-2.5">File Gốc</th>
                  <th className="px-3 py-2.5 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {systemMods.map((mod, i) => (
                  <tr key={mod.id || i} className="hover:bg-white transition-colors">
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-black truncate max-w-[120px]">{mod.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase">ID: {mod.id}</p>
                    </td>
                    <td className="px-3 py-2.5 text-orange-400 font-bold">
                      {mod.price}
                      {mod.price.includes('VNĐ') && <span className="ml-1 text-[9px] bg-yellow-500/20 text-yellow-500 px-1 py-0.5 rounded-sm uppercase tracking-wider">VIP</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-black">
                      {(mod.download_count || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">
                      {mod.fileName ? (
                        <span className="text-[9px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded border border-green-500/20 truncate max-w-[100px] inline-block">
                          {mod.fileName}
                        </span>
                      ) : (
                        <span className="text-[9px] bg-white text-gray-600 px-1.5 py-0.5 rounded">Mặc định</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center space-x-1.5">
                        <button 
                          onClick={() => {
                            setEditingModId(mod.id);
                            setIsAddingMod(true);
                            const modFileStr = mod.fileName || mod.file_name || '';
                            const fileData = modFileStr.split('|');
                            setNewMod({
                              name: mod.name,
                              price: mod.price_vnd > 0 ? mod.price_vnd.toString() : mod.price_points.toString(),
                              currency: mod.price_vnd > 0 ? 'VNĐ' : 'Điểm',
                              file: null,
                              fileName: fileData[0] || '',
                              fileSize: fileData[1] || '',
                              modLink: mod.mod_link || '',
                              imgFile: null,
                              imgFileName: mod.img ? 'Đã có ảnh' : ''
                            });
                          }}
                          className="p-2 bg-white hover:bg-blue-500/20 rounded-lg text-blue-500 transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => deleteMod(mod.id)}
                          className="p-2 bg-white hover:bg-red-500/20 rounded-lg text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BẢNG THÔNG SỐ TASK (LOẠI TASK, THƯỞNG ĐIỂM, USERNAME, THỜI GIAN HOÀN THÀNH, PHÁT HIỆN GIAN LẬN) */}
          <div className="pt-6 border-t border-gray-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
                  📊 THÔNG SỐ NHIỆM VỤ (TASK LOGS)
                </h3>
                <p className="text-[11px] text-gray-500">
                  Lịch sử hoàn thành nhiệm vụ chi tiết của người dùng kèm phân tích thời gian bypass và cảnh báo gian lận.
                </p>
              </div>
              
              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Tìm username, tên task..."
                  value={taskSearchQuery}
                  onChange={(e) => {
                    setTaskSearchQuery(e.target.value);
                    setTaskPage(0);
                  }}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:border-red-500 outline-none w-52 text-black"
                />
                
                <label className="flex items-center space-x-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 select-none text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={taskFilterCheaterOnly}
                    onChange={(e) => {
                      setTaskFilterCheaterOnly(e.target.checked);
                      setTaskPage(0);
                    }}
                    className="accent-red-500"
                  />
                  <span>Chỉ hiện gian lận ⚠️</span>
                </label>
              </div>
            </div>

            {(() => {
              const filtered = (allTasks || []).filter(t => {
                const q = taskSearchQuery.trim().toLowerCase();
                const matchesSearch = !q || 
                  (t.user_id || '').toLowerCase().includes(q) || 
                  (t.task_name || '').toLowerCase().includes(q);
                
                if (!matchesSearch) return false;
                
                if (taskFilterCheaterOnly) {
                  const uProfile = usersList.find(u => u.username?.toLowerCase() === t.user_id?.toLowerCase());
                  const flags = [];
                  if (t.created_at && t.completed_at) {
                    const duration = (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / 1000;
                    if (duration < 8) flags.push(true);
                  }
                  if (uProfile?.is_cheater || uProfile?.points_locked) flags.push(true);
                  return flags.length > 0;
                }
                
                return true;
              });

              const totalFiltered = filtered.length;
              const paginated = filtered.slice(taskPage * tasksPerPage, (taskPage + 1) * tasksPerPage);
              const totalPages = Math.ceil(totalFiltered / tasksPerPage);

              return (
                <div className="space-y-3">
                  <div className="glass-morphism rounded-[1.25rem] overflow-hidden border border-gray-200">
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-white text-[10px] text-gray-600 uppercase border-b border-gray-100">
                          <th className="px-4 py-3">Loại Task</th>
                          <th className="px-4 py-3 text-center">Thưởng Điểm</th>
                          <th className="px-4 py-3 text-center">Username</th>
                          <th className="px-4 py-3 text-center">Thời Gian Hoàn Thành</th>
                          <th className="px-4 py-3 text-center">Phát Hiện Gian Lận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {isTasksLoading ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-medium">
                              Đang tải danh sách thông số task...
                            </td>
                          </tr>
                        ) : paginated.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500 font-medium">
                              Không tìm thấy lịch sử hoàn thành task nào.
                            </td>
                          </tr>
                        ) : (
                          paginated.map((t, idx) => {
                            const uProfile = usersList.find(u => u.username?.toLowerCase() === t.user_id?.toLowerCase());
                            
                            let durationText = 'Không xác định';
                            let isCheatTime = false;
                            let durationSecs = 0;
                            
                            if (t.created_at && t.completed_at) {
                              const start = new Date(t.created_at).getTime();
                              const end = new Date(t.completed_at).getTime();
                              durationSecs = (end - start) / 1000;
                              if (durationSecs < 0) durationSecs = 0;
                              
                              if (durationSecs < 60) {
                                durationText = `${durationSecs.toFixed(0)} giây`;
                              } else {
                                const m = Math.floor(durationSecs / 60);
                                const s = Math.floor(durationSecs % 60);
                                durationText = `${m} phút ${s} giây`;
                              }

                              if (durationSecs < 8) {
                                isCheatTime = true;
                              }
                            }

                            const cheatFlags = [];
                            if (isCheatTime) {
                              cheatFlags.push(`Bypass nhanh (${durationSecs.toFixed(0)}s)`);
                            }
                            if (uProfile?.is_cheater) {
                              cheatFlags.push('User Blacklisted');
                            } else if (uProfile?.points_locked) {
                              cheatFlags.push('Bị khóa điểm');
                            }

                            return (
                              <tr key={t.id || idx} className="hover:bg-slate-50 transition-colors text-black font-medium">
                                <td className="px-4 py-3">
                                  <span className="font-semibold text-gray-900">{t.task_name || t.task_id || 'Hệ thống'}</span>
                                  <div className="text-[10px] text-gray-400 font-normal mt-0.5">Mở: {t.created_at ? new Date(t.created_at).toLocaleString('vi-VN') : 'Unknown'}</div>
                                </td>
                                <td className="px-4 py-3 text-center text-emerald-600 font-bold">
                                  +{t.reward?.toLocaleString() || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-blue-600 font-semibold font-mono">
                                  {t.user_id}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={isCheatTime ? "text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded" : "text-gray-700 bg-gray-50 px-2 py-1 rounded"}>
                                    {durationText}
                                  </span>
                                  <div className="text-[10px] text-gray-400 font-normal mt-1.5">Xác nhận: {t.completed_at ? new Date(t.completed_at).toLocaleTimeString('vi-VN') : 'Unknown'}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {cheatFlags.length > 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                      ⚠️ {cheatFlags.join(' | ')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                                      An toàn ✅
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-200">
                      <span>Hiển thị {taskPage * tasksPerPage + 1} - {Math.min((taskPage + 1) * tasksPerPage, totalFiltered)} của {totalFiltered} dòng</span>
                      <div className="flex space-x-1">
                        <button
                          disabled={taskPage === 0}
                          onClick={() => setTaskPage(p => Math.max(0, p - 1))}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-black font-semibold cursor-pointer"
                        >
                          Trước
                        </button>
                        <button
                          disabled={taskPage >= totalPages - 1}
                          onClick={() => setTaskPage(p => p + 1)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-black font-semibold cursor-pointer"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeSubTab === 'deposits' && (() => {
        const filteredPending = (depositRequests || []).filter(req => {
          const q = depositSearchQuery.trim().toLowerCase();
          if (!q) return true;
          return (req.username || '').toLowerCase().includes(q) || (req.orderId || '').toLowerCase().includes(q);
        });

        const filteredHistory = (depositHistory || []).filter(h => {
          const q = depositSearchQuery.trim().toLowerCase();
          if (!q) return true;
          return (h.username || '').toLowerCase().includes(q) || (h.orderId || '').toLowerCase().includes(q);
        });

        return (
          <div className="space-y-6">
            {/* SEARCH DEPOSIT TRANSACTIONS */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch nạp theo Mã giao dịch (orderId), Tên đăng nhập tài khoản..."
                value={depositSearchQuery}
                onChange={(e) => setDepositSearchQuery(e.target.value)}
                className="w-full bg-white text-black border border-gray-200 rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:border-green-600 outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-4.5 text-gray-400" size={14} />
              {depositSearchQuery && (
                <button 
                  onClick={() => setDepositSearchQuery('')}
                  className="absolute right-4 top-4 text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  XÓA
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPending.length === 0 ? (
                <div className="col-span-full text-center p-8 glass-morphism rounded-3xl border border-gray-200 text-gray-600">
                  {depositSearchQuery ? `Không tìm thấy yêu cầu nạp nào khớp với "${depositSearchQuery}"` : 'Không có yêu cầu nạp nào đang chờ duyệt.'}
                </div>
              ) : (
                filteredPending.map(req => (
                  <div key={req.id} className="glass-morphism p-6 rounded-3xl border border-gray-200 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">{req.username?.[0]?.toUpperCase() || 'U'}</div>
                        <div>
                          <p className="font-bold text-black">{req.username}</p>
                          <p className="text-[10px] text-gray-600">{req.time}</p>
                        </div>
                      </div>
                      <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-bold">CHỜ DUYỆT</span>
                    </div>
                    <div className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-200">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase">Số tiền</p>
                        <p className="text-xl font-black text-green-400">{req.amount.toLocaleString()} VNĐ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase">Mã Giao Dịch</p>
                        <p className="text-sm font-mono text-black">{req.orderId}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={async () => {
                           if (setVndBalance && setDepositRequests && setDepositHistory && addActivityLog) {
                             const success = await syncService.updateDepositStatus(req.id, 'thành công', req.finalAmount, req.username);
                             if (success) {
                               // If target user is the admin who is currently logged in, update local balance
                               if (req.username === username) {
                                 setVndBalance(prev => prev + req.finalAmount);
                               }
                               setDepositRequests(prev => prev.filter(r => r.id !== req.id));
                               setDepositHistory(prev => prev.map(r => r.id === req.id ? {...r, status: 'thành công', processedTime: new Date().toLocaleString()} : r));
                               addActivityLog('Admin', `Duyệt nạp tiền cho ${req.username}`, `+${req.finalAmount.toLocaleString()} VNĐ`, 'deposit');
                               const maskedUser = req.username ? (req.username.length > 4 ? req.username.substring(0, 2) + '****' + req.username.substring(req.username.length - 2) : req.username.substring(0, 1) + '***') : '***';
                               await syncService.sendChatMessage('HỆ THỐNG', `Đơn nạp của ${maskedUser} đã được duyệt (+${req.finalAmount.toLocaleString()} VNĐ).`, true);
                               alert(`Đã duyệt cộng ${req.finalAmount.toLocaleString()} VNĐ cho ${req.username}`);
                             } else {
                               alert('Lỗi khi duyệt nạp. Vui lòng thử lại.');
                             }
                           }
                        }}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer text-white shadow-md shadow-green-500/20"
                      >
                        <CheckCircle2 size={16} /> <span>DUYỆT</span>
                      </button>
                      <button 
                        onClick={() => setSelectedBillForView(req)}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-indigo-500/20"
                      >
                        <Receipt size={16} /> <span>XEM BILL</span>
                      </button>
                      <button 
                        onClick={async () => {
                           if (setDepositRequests && setDepositHistory && addActivityLog) {
                             const success = await syncService.updateDepositStatus(req.id, 'từ chối', 0, req.username);
                             if (success) {
                               setDepositRequests(prev => prev.filter(r => r.id !== req.id));
                               setDepositHistory(prev => prev.map(r => r.id === req.id ? {...r, status: 'từ chối', processedTime: new Date().toLocaleString()} : r));
                               addActivityLog('Admin', `Từ chối nạp tiền cho ${req.username}`, `0 VNĐ`, 'system');
                             } else {
                               alert('Lỗi khi xử lý. Vui lòng thử lại.');
                             }
                           }
                        }}
                        className="flex-1 py-3 bg-white hover:bg-red-650 hover:text-red-600 border border-gray-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer text-gray-700"
                      >
                        <XCircle size={16} /> <span>TỪ CHỐI</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Lịch Sử Nạp Section */}
            <div className="mt-8 space-y-3">
               <h3 className="text-sm font-bold italic border-l-4 border-green-500 pl-3">LỊCH SỬ DUYỆT NẠP</h3>
               <div className="glass-morphism rounded-[1.25rem] overflow-hidden border border-gray-200">
                 <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-[10px] text-gray-600 uppercase">
                        <th className="px-3 py-2.5">Người dùng</th>
                        <th className="px-3 py-2.5">Số Tiền</th>
                        <th className="px-3 py-2.5">Mã Giao Dịch</th>
                        <th className="px-3 py-2.5">Thời Gian Duyệt</th>
                        <th className="px-3 py-2.5">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-[10px]">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                            {depositSearchQuery ? `Chưa có giao dịch lịch sử khớp với "${depositSearchQuery}"` : 'Chưa có lịch sử giao dịch nào.'}
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-white transition-colors">
                            <td className="px-3 py-2.5 font-bold text-black truncate max-w-[100px]">{h.username}</td>
                            <td className="px-3 py-2.5 text-green-400 font-bold">{h.amount.toLocaleString()} VNĐ</td>
                            <td className="px-3 py-2.5 text-gray-600 font-mono">{h.orderId}</td>
                            <td className="px-3 py-2.5 text-gray-500">{h.processedTime}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${h.status === 'thành công' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {h.status === 'thành công' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI'}
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
      })()}

      {activeSubTab === 'withdraws' && (() => {
        const filteredPending = (withdrawRequests || [])
          .filter(req => req.status === 'Chờ duyệt')
          .filter(req => {
            const q = withdrawSearchQuery.trim().toLowerCase();
            if (!q) return true;
            return (req.user || '').toLowerCase().includes(q) || 
                   (req.id || '').toLowerCase().includes(q) || 
                   (req.itemName || '').toLowerCase().includes(q) ||
                   (req.ffId || '').toLowerCase().includes(q) ||
                   (req.lqUid || '').toLowerCase().includes(q);
          });

        const filteredHistory = (withdrawRequests || [])
          .filter(req => req.status !== 'Chờ duyệt')
          .filter(req => {
            const q = withdrawSearchQuery.trim().toLowerCase();
            if (!q) return true;
            return (req.user || '').toLowerCase().includes(q) || 
                   (req.id || '').toLowerCase().includes(q) || 
                   (req.itemName || '').toLowerCase().includes(q) ||
                   (req.cardCode || '').toLowerCase().includes(q) ||
                   (req.ffId || '').toLowerCase().includes(q) ||
                   (req.lqUid || '').toLowerCase().includes(q);
          });

        const getVietnamDateStr = (dateInput: any) => {
          if (!dateInput) return '';
          const d = new Date(dateInput);
          const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          };
          const formatter = new Intl.DateTimeFormat('en-CA', options); // returns YYYY-MM-DD
          return formatter.format(d);
        };

        const vnToday = getVietnamDateStr(new Date());

        const TASK_KEYS = ['link4m', 'linktot', 'timmap', 'utl_1step', 'utl_2step', 'utl_3step', 'utl_4step', 'review_map', 'review_trip', 'review_app', 'oth'];
        const TASK_DISPLAY_NAMES: Record<string, string> = {
          'link4m': 'TASK POINTS 1 (LINK4M)',
          'linktot': 'TASK POINTS 2 (LINKTOT)',
          'timmap': 'TASK POINTS 3 (TIMMAP)',
          'utl_1step': 'TASK POINTS 4 (UTL 1 STEP)',
          'utl_2step': 'TASK POINTS 5 (UTL 2 STEP)',
          'utl_3step': 'TASK POINTS 6 (UTL 3 STEP)',
          'utl_4step': 'TASK POINTS 7 (UTL 4 STEP)',
          'review_map': 'TASK POINTS 8 (REVIEW MAP)',
          'review_trip': 'TASK POINTS 9 (REVIEW TRIP)',
          'review_app': 'TASK POINTS 10 (REVIEW APP)',
          'oth': 'Quảng Cáo / Khác'
        };

        const getTaskConfigForCalc = (taskId: string, taskName: string) => {
          const idLower = (taskId || '').toLowerCase();
          const nameUpper = (taskName || '').toUpperCase();

          if (idLower === 'link4m' || nameUpper.includes('LINK4M') || nameUpper.includes('TASK POINTS 1') || nameUpper.includes('TASK POINTS 2')) {
            return { key: 'link4m', adminVnd: 700 };
          }
          if (idLower === 'linktot' || nameUpper.includes('LINKTOT') || nameUpper.includes('TASK POINTS 2') || nameUpper.includes('TASK POINTS 3')) {
            return { key: 'linktot', adminVnd: 500 };
          }
          if (idLower === 'timmap' || nameUpper.includes('TIMMAP') || nameUpper.includes('TASK POINTS 3') || nameUpper.includes('TASK POINTS 4')) {
            return { key: 'timmap', adminVnd: 250 };
          }
          if (idLower === 'utl_1step' || nameUpper.includes('UTL 1 STEP') || nameUpper.includes('TASK POINTS 4') || nameUpper.includes('TASK POINTS 6')) {
            return { key: 'utl_1step', adminVnd: 500 };
          }
          if (idLower === 'utl_2step' || nameUpper.includes('UTL 2 STEP') || nameUpper.includes('TASK POINTS 5') || nameUpper.includes('TASK POINTS 7')) {
            return { key: 'utl_2step', adminVnd: 510 };
          }
          if (idLower === 'utl_3step' || nameUpper.includes('UTL 3 STEP') || nameUpper.includes('TASK POINTS 6') || nameUpper.includes('TASK POINTS 8')) {
            return { key: 'utl_3step', adminVnd: 520 };
          }
          if (idLower === 'utl_4step' || nameUpper.includes('UTL 4 STEP') || nameUpper.includes('TASK POINTS 7') || nameUpper.includes('TASK POINTS 9')) {
            return { key: 'utl_4step', adminVnd: 530 };
          }
          if (idLower === 'review_map' || nameUpper.includes('REVIEW MAP') || nameUpper.includes('TASK POINTS 8') || nameUpper.includes('TASK POINTS 10')) {
            return { key: 'review_map', adminVnd: 0 };
          }
          if (idLower === 'review_trip' || nameUpper.includes('REVIEW TRIP') || nameUpper.includes('TASK POINTS 9') || nameUpper.includes('TASK POINTS 11')) {
            return { key: 'review_trip', adminVnd: 0 };
          }
          if (idLower === 'review_app' || nameUpper.includes('REVIEW APP') || nameUpper.includes('TASK POINTS 10') || nameUpper.includes('TASK POINTS 12')) {
            return { key: 'review_app', adminVnd: 0 };
          }
          return null;
        };

        // Initialize aggregations
        const aggregates = TASK_KEYS.reduce((acc, key) => {
          acc[key] = {
            key,
            name: TASK_DISPLAY_NAMES[key],
            adminPriceUnit: 0,
            // All time
            completionsAll: 0,
            totalPointsAll: 0,
            totalAdminVndAll: 0,
            totalUserCostVndAll: 0,
            netProfitAll: 0,
            // Today
            completionsToday: 0,
            totalPointsToday: 0,
            totalAdminVndToday: 0,
            totalUserCostVndToday: 0,
            netProfitToday: 0,
          };
          return acc;
        }, {} as Record<string, any>);

        if (aggregates['link4m']) aggregates['link4m'].adminPriceUnit = 700;
        if (aggregates['linktot']) aggregates['linktot'].adminPriceUnit = 500;
        if (aggregates['timmap']) aggregates['timmap'].adminPriceUnit = 250;
        if (aggregates['utl_1step']) aggregates['utl_1step'].adminPriceUnit = 500;
        if (aggregates['utl_2step']) aggregates['utl_2step'].adminPriceUnit = 510;
        if (aggregates['utl_3step']) aggregates['utl_3step'].adminPriceUnit = 520;
        if (aggregates['utl_4step']) aggregates['utl_4step'].adminPriceUnit = 530;
        if (aggregates['oth']) aggregates['oth'].adminPriceUnit = 0;

        let totalAdminRevAll = 0;
        let totalPointsAllSum = 0;
        
        let totalAdminRevToday = 0;
        let totalPointsTodaySum = 0;

        allTasks.forEach(t => {
          const cfg = getTaskConfigForCalc(t.task_id, t.task_name);
          const key = cfg ? cfg.key : 'oth';
          const adminPrice = cfg ? cfg.adminVnd : 0;
          
          const completedAtDate = t.completed_at ? t.completed_at : t.created_at;
          const taskDateStr = getVietnamDateStr(completedAtDate);
          const isToday = taskDateStr === vnToday;
          
          // All aggregates
          aggregates[key].completionsAll += 1;
          aggregates[key].totalPointsAll += (t.reward || 0);
          aggregates[key].totalAdminVndAll += adminPrice;
          
          totalAdminRevAll += adminPrice;
          totalPointsAllSum += (t.reward || 0);

          // Today aggregates
          if (isToday) {
            aggregates[key].completionsToday += 1;
            aggregates[key].totalPointsToday += (t.reward || 0);
            aggregates[key].totalAdminVndToday += adminPrice;
            
            totalAdminRevToday += adminPrice;
            totalPointsTodaySum += (t.reward || 0);
          }
        });

        // Calculate final costs and profits
        TASK_KEYS.forEach(key => {
          const agg = aggregates[key];
          agg.totalUserCostVndAll = agg.totalPointsAll / 5;
          agg.netProfitAll = agg.totalAdminVndAll - agg.totalUserCostVndAll;

          agg.totalUserCostVndToday = agg.totalPointsToday / 5;
          agg.netProfitToday = agg.totalAdminVndToday - agg.totalUserCostVndToday;
        });

        const totalProfitAllSum = totalAdminRevAll - (totalPointsAllSum / 5);
        const totalProfitTodaySum = totalAdminRevToday - (totalPointsTodaySum / 5);

        return (
          <div className="space-y-6">
            
            {/* INTERACTIVE TABLE STATS SELECTION */}
            <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                <div>
                   <h3 className="text-sm font-black uppercase text-black tracking-wider flex items-center gap-2">
                     <Activity size={18} className="text-orange-500" /> BÁO CÁO DOANH THU CHI TIẾT
                   </h3>
                   <p className="text-[10px] text-gray-500 font-medium">Báo cáo real-time dựa trên Điểm làm nhiệm vụ (Quy đổi: 1 VNĐ = 5 Điểm | Resets hôm nay lúc 0h VN)</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl w-fit self-start shrink-0">
                  <button 
                    onClick={() => setRevenueTableTab('all')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${revenueTableTab === 'all' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Tất Cả
                  </button>
                  <button 
                    onClick={() => setRevenueTableTab('today')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${revenueTableTab === 'today' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Hôm Nay
                  </button>
                  <button 
                    onClick={() => setRevenueTableTab('profit_loss')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all ${revenueTableTab === 'profit_loss' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-black'}`}
                  >
                    Lỗ Lãi Toàn Diện
                  </button>
                </div>
              </div>

              {/* TABLE 1: DOANH THU TẤT CẢ */}
              {revenueTableTab === 'all' && (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-[9px] tracking-wider">
                        <th className="px-4 py-3">Loại Nhiệm Vụ</th>
                        <th className="px-4 py-3 text-center">Lượt Hoàn Thành</th>
                        <th className="px-4 py-3 text-right">Giá Gốc Admin</th>
                        <th className="px-4 py-3 text-right">Tổng Thu Admin (VNĐ)</th>
                        <th className="px-4 py-3 text-right">Tổng Điểm Tặng</th>
                        <th className="px-4 py-3 text-right">Chi Phí Đổi (VNĐ)</th>
                        <th className="px-4 py-3 text-right">Lợi Nhuận (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-black">
                      {TASK_KEYS.map(key => {
                         const agg = aggregates[key];
                         return (
                           <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-4 py-3 font-bold text-gray-800">{agg.name}</td>
                             <td className="px-4 py-3 text-center font-mono font-bold text-cyan-600">{agg.completionsAll.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-mono text-gray-500">{agg.adminPriceUnit} VNĐ</td>
                             <td className="px-4 py-3 text-right font-mono text-gray-900 font-bold">{agg.totalAdminVndAll.toLocaleString()} VNĐ</td>
                             <td className="px-4 py-3 text-right font-mono text-orange-500">{agg.totalPointsAll.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-mono text-red-500">{agg.totalUserCostVndAll.toLocaleString()} VNĐ</td>
                             <td className={`px-4 py-3 text-right font-mono font-black ${agg.netProfitAll >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                               {agg.netProfitAll > 0 ? '+' : ''}{agg.netProfitAll.toLocaleString()} VNĐ
                             </td>
                           </tr>
                         );
                      })}
                      <tr className="bg-gray-50/80 font-black border-t-2 border-gray-200">
                        <td className="px-4 py-3.5 uppercase text-gray-700">TỔNG CỘNG</td>
                        <td className="px-4 py-3.5 text-center font-mono text-cyan-700">{TASK_KEYS.reduce((sum, k) => sum + aggregates[k].completionsAll, 0).toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right">-</td>
                        <td className="px-4 py-3.5 text-right font-mono text-gray-950 font-black">{totalAdminRevAll.toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3.5 text-right font-mono text-orange-600">{totalPointsAllSum.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-red-600">{(totalPointsAllSum / 5).toLocaleString()} VNĐ</td>
                        <td className={`px-4 py-3.5 text-right font-mono text-sm ${totalProfitAllSum >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {totalProfitAllSum > 0 ? '+' : ''}{totalProfitAllSum.toLocaleString()} VNĐ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE 2: DOANH THU HÔM NAY (Resets at 0h Viet Nam) */}
              {revenueTableTab === 'today' && (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-[9px] tracking-wider">
                        <th className="px-4 py-3">Loại Nhiệm Vụ</th>
                        <th className="px-4 py-3 text-center">Hoàn Thành Hôm Nay</th>
                        <th className="px-4 py-3 text-right">Tổng Thu Hôm Nay</th>
                        <th className="px-4 py-3 text-right">Điểm Tặng Hôm Nay</th>
                        <th className="px-4 py-3 text-right">Chi Phí Quy Đổi Hôm Nay</th>
                        <th className="px-4 py-3 text-right">Lợi Nhuận Hôm Nay (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-black">
                      {TASK_KEYS.map(key => {
                         const agg = aggregates[key];
                         return (
                           <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-4 py-3 font-bold text-gray-800">{agg.name}</td>
                             <td className="px-4 py-3 text-center font-mono font-bold text-cyan-600">{agg.completionsToday.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-mono text-gray-900 font-bold">{agg.totalAdminVndToday.toLocaleString()} VNĐ</td>
                             <td className="px-4 py-3 text-right font-mono text-orange-500">{agg.totalPointsToday.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-mono text-red-500">{agg.totalUserCostVndToday.toLocaleString()} VNĐ</td>
                             <td className={`px-4 py-3 text-right font-mono font-black ${agg.netProfitToday >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                               {agg.netProfitToday > 0 ? '+' : ''}{agg.netProfitToday.toLocaleString()} VNĐ
                             </td>
                           </tr>
                         );
                      })}
                      <tr className="bg-gray-50/80 font-black border-t-2 border-gray-200">
                        <td className="px-4 py-3.5 uppercase text-gray-700 flex items-center gap-1.5">
                           <span>TỔNG HÔM NAY</span>
                           <span className="text-[8px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-black font-sans uppercase">HÔM NAY ({vnToday})</span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-cyan-700">{TASK_KEYS.reduce((sum, k) => sum + aggregates[k].completionsToday, 0).toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-gray-950 font-black">{totalAdminRevToday.toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3.5 text-right font-mono text-orange-600">{totalPointsTodaySum.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-red-600">{(totalPointsTodaySum / 5).toLocaleString()} VNĐ</td>
                        <td className={`px-4 py-3.5 text-right font-mono text-sm ${totalProfitTodaySum >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {totalProfitTodaySum > 0 ? '+' : ''}{totalProfitTodaySum.toLocaleString()} VNĐ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE 3: DOANH THU LỖ LÃI (Highlights negative / positive) */}
              {revenueTableTab === 'profit_loss' && (
                <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-bold text-[9px] tracking-wider">
                        <th className="px-4 py-3">Loại Nhiệm Vụ</th>
                        <th className="px-4 py-3 text-center">Tình Trạng</th>
                        <th className="px-4 py-3 text-right">Tổng Thu Gốc (Admin)</th>
                        <th className="px-4 py-3 text-right">Ưu Đại Điểm (Cắt Chi Phí)</th>
                        <th className="px-4 py-3 text-right border-l border-gray-200">Tổng Lỗ / Lãi</th>
                        <th className="px-4 py-3 text-center">Hiệu Suất Kinh Doanh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-black">
                      {TASK_KEYS.map(key => {
                         const agg = aggregates[key];
                         const isProfit = agg.netProfitAll >= 0;
                         const margin = agg.totalAdminVndAll > 0 ? Math.round((agg.netProfitAll / agg.totalAdminVndAll) * 100) : 0;
                         
                         return (
                           <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-4 py-3 font-bold text-gray-800">{agg.name}</td>
                             <td className="px-4 py-3 text-center">
                               {agg.completionsAll === 0 ? (
                                 <span className="text-[8px] bg-gray-100 text-gray-400 font-bold px-1.5 py-0.5 rounded uppercase">Chưa phát sinh</span>
                               ) : isProfit ? (
                                 <span className="text-[8px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded uppercase font-sans">Lãi Dương</span>
                               ) : (
                                 <span className="text-[8px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded uppercase font-sans">Lỗ Âm</span>
                               )}
                             </td>
                             <td className="px-4 py-3 text-right font-mono text-gray-900 font-bold">{agg.totalAdminVndAll.toLocaleString()} VNĐ</td>
                             <td className="px-4 py-3 text-right font-mono text-red-500">{agg.totalUserCostVndAll.toLocaleString()} VNĐ</td>
                             <td className={`px-4 py-3 text-right font-mono font-black border-l border-gray-100 ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                               {agg.netProfitAll > 0 ? '+' : agg.netProfitAll < 0 ? '' : ''}{agg.netProfitAll.toLocaleString()} VNĐ
                             </td>
                             <td className="px-4 py-3 text-center">
                               {agg.totalAdminVndAll === 0 ? (
                                 <span className="text-gray-400 font-mono text-[10px]">-</span>
                               ) : (
                                 <div className="flex items-center justify-center gap-1.5">
                                   <div className="w-12 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                     <div 
                                       className={`h-full ${isProfit ? 'bg-green-500' : 'bg-red-500'}`}
                                       style={{ width: `${Math.min(100, Math.max(0, isProfit ? margin : 100 - Math.abs(margin)))}%` }}
                                     />
                                   </div>
                                   <span className={`text-[10px] font-mono font-bold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                                     {isProfit ? '+' : ''}{margin}%
                                   </span>
                                 </div>
                               )}
                             </td>
                           </tr>
                         );
                      })}
                      <tr className="bg-gray-50/80 font-black border-t-2 border-gray-200 text-sm">
                        <td className="px-4 py-3.5 uppercase text-gray-700" colSpan={2}>LỖ LÃI TOÀN NỀN TẢNG</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-950 font-bold">{totalAdminRevAll.toLocaleString()} VNĐ</td>
                        <td className="px-4 py-3 text-right font-mono text-red-500">{(totalPointsAllSum / 5).toLocaleString()} VNĐ</td>
                        <td className={`px-4 py-3.5 text-right font-mono font-black border-l border-gray-200 ${totalProfitAllSum >= 0 ? 'text-green-600' : 'text-red-500'}`} colSpan={1}>
                          {totalProfitAllSum > 0 ? '+' : ''}{totalProfitAllSum.toLocaleString()} VNĐ
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {totalAdminRevAll > 0 ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-sans ${totalProfitAllSum >= 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                              {totalProfitAllSum >= 0 ? 'Kinh doanh siêu Lợi nhuận' : 'Cần tối ưu giảm giá quà đổi'}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SEARCH WITHDRAW TRANSACTIONS */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm giao dịch rút theo Tên đăng nhập, ID Freefire, UID Liên Quân, Mã thẻ..."
                value={withdrawSearchQuery}
                onChange={(e) => setWithdrawSearchQuery(e.target.value)}
                className="w-full bg-white text-black border border-gray-200 rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:border-green-600 outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-4.5 text-gray-400" size={14} />
              {withdrawSearchQuery && (
                <button 
                  onClick={() => setWithdrawSearchQuery('')}
                  className="absolute right-4 top-4 text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  XÓA
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPending.length === 0 ? (
                <div className="col-span-full text-center p-8 glass-morphism rounded-3xl border border-gray-200 text-gray-600">
                  {withdrawSearchQuery ? `Không tìm thấy đơn rút nào khớp với "${withdrawSearchQuery}"` : 'Không có đơn rút điểm nào đang chờ duyệt.'}
                </div>
              ) : (
                filteredPending.map(req => (
                  <div key={req.id} className="glass-morphism p-6 rounded-3xl border border-gray-200 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold">{req.user?.[0]?.toUpperCase() || 'U'}</div>
                        <div>
                          <p className="font-bold text-black uppercase">{req.user}</p>
                          <p className="text-xs text-slate-500">{req.time}</p>
                        </div>
                      </div>
                      <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-[10px] font-semibold border border-yellow-500/20 uppercase">
                        Đang chờ duyệt
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-gray-200 transition-colors">
                      <p className="text-xs text-slate-400 mb-1">Rút: <span className="font-bold text-cyan-400">{req.itemName}</span></p>
                      <p className="text-xs text-slate-400 mb-1">Giá điểm: <span className="font-bold text-orange-400">{req.price}</span></p>
                      <div className="mt-2 text-[11px] text-gray-700">
                        <p>ID FF: <span className="font-bold">{req.ffId}</span></p>
                        <p>UID LQ: <span className="font-bold">{req.lqUid}</span></p>
                      </div>
                      {req.itemName.includes("Thẻ") && (
                         <input 
                           type="text" 
                           placeholder="Nhập mã thẻ Garena trả cho user..." 
                           className="w-full mt-3 bg-white border border-gray-200 rounded p-2 text-xs text-black placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                           id={`card_input_${req.id}`}
                         />
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button 
                        onClick={async () => {
                          const cardInput = document.getElementById(`card_input_${req.id}`) as HTMLInputElement;
                          const cardCode = cardInput ? cardInput.value.trim() : null;
                          
                          if (req.itemName.includes("Thẻ") && !cardCode) {
                             alert("Vui lòng nhập mã thẻ Garena trước khi duyệt!");
                             return;
                          }

                          if (setWithdrawRequests) {
                            const success = await syncService.updateWithdrawStatus(req.id, 'Thành công', cardCode || undefined);
                            if (success) {
                              setWithdrawRequests((prev: any[]) => prev.map(r => r.id === req.id ? { ...r, status: 'Thành công', cardCode: cardCode } : r));
                              if (addActivityLog) {
                                addActivityLog('Admin', `Duyệt đơn rút: ${req.itemName} của ${req.user}`, '', 'system');
                              }
                              
                              const maskedUser = req.user ? (req.user.length > 4 ? req.user.substring(0, 2) + '****' + req.user.substring(req.user.length - 2) : req.user.substring(0, 1) + '***') : '***';
                              await syncService.sendChatMessage('HỆ THỐNG', `Đơn rút ${req.itemName} của ${maskedUser} đã được duyệt.`, true);

                              alert(`Đã duyệt đơn rút điểm cho ${req.user}`);
                            } else {
                              alert("Lỗi khi cập nhật trên Supabase!");
                            }
                          }
                        }}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-green-900/40 cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 size={16} /> <span>DUYỆT ĐƠN</span>
                      </button>
                      
                      <button 
                        onClick={async () => {
                          if (setWithdrawRequests) {
                            const success = await syncService.updateWithdrawStatus(req.id, 'Từ chối');
                            if (success) {
                              setWithdrawRequests((prev: any[]) => prev.map(r => r.id === req.id ? { ...r, status: 'Từ chối' } : r));
                              if (addActivityLog) {
                                addActivityLog('Admin', `Từ chối đơn rút: ${req.itemName}`, '', 'system');
                              }
                              
                              try {
                                const profile = await syncService.getProfile(req.user);
                                if (profile) {
                                  const priceValue = parseInt((req.price || "0").toString().replace(/\D/g, '')) || 0;
                                  const refundPoints = Math.floor(priceValue * 0.3);
                                  if (refundPoints > 0) {
                                     const newPoints = (profile.points_balance || 0) + refundPoints;
                                     await syncService.updateBalance(req.user, { points_balance: newPoints });
                                     if (addActivityLog) {
                                        addActivityLog(req.user, `Hoàn điểm do từ chối đơn rút (30%)`, `+${refundPoints} Điểm`, 'mod');
                                     }
                                  }
                                }
                              } catch (e) {
                                console.error('Lỗi thông báo hoàn tiền:', e);
                              }
                            } else {
                              alert("Lỗi khi cập nhật trên Supabase!");
                            }
                          }
                        }}
                        className="flex-1 py-3 bg-white hover:bg-white text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
                      >
                        <XCircle size={16} /> <span>TỪ CHỐI</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Lịch Sử Rút Điểm Section */}
            <div className="mt-8 space-y-3">
               <h3 className="text-sm font-bold italic border-l-4 border-cyan-500 pl-3">LỊCH SỬ DUYỆT RÚT ĐIỂM</h3>
               <div className="glass-morphism rounded-[1.25rem] overflow-hidden border border-gray-200">
                 <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-[10px] text-gray-600 uppercase">
                        <th className="px-3 py-2.5">Người dùng</th>
                        <th className="px-3 py-2.5">Vật phẩm</th>
                        <th className="px-3 py-2.5">Giá / Mã thẻ</th>
                        <th className="px-3 py-2.5">Thời gian tạo</th>
                        <th className="px-3 py-2.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-[10px]">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                            {withdrawSearchQuery ? `Chưa có lịch sử duyệt rút điểm nào khớp với "${withdrawSearchQuery}"` : 'Chưa có lịch sử duyệt rút điểm nào.'}
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((h) => (
                          <tr key={h.id} className="hover:bg-white transition-colors">
                            <td className="px-3 py-2.5 font-bold text-black max-w-[100px] truncate">{h.user}</td>
                            <td className="px-3 py-2.5 text-cyan-400 font-bold max-w-[100px] truncate">{h.itemName}</td>
                            <td className="px-3 py-2.5 text-gray-600">
                               <div>Giá: <span className="text-orange-400 font-bold">{h.price}</span></div>
                               {h.cardCode && <div className="max-w-[100px] truncate">Mã: <span className="font-mono text-green-400">{h.cardCode}</span></div>}
                               {(h.ffId || h.lqUid) && <div className="text-[9px] mt-0.5 text-slate-500 max-w-[100px] truncate">{h.ffId ? `FF: ${h.ffId}` : ''} {h.lqUid ? `LQ: ${h.lqUid}` : ''}</div>}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500">{h.time}</td>
                            <td className="px-3 py-2.5">
                              <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${h.status === 'Thành công' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {h.status}
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
      })()}

      {activeSubTab === 'reviews' && (
        <div className="space-y-6">
           <div className="bg-red-50 border border-red-200 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center text-red-900">
                      <ShieldCheck className="mr-2" /> Duyệt Yêu Cầu Review
                    </h2>
                    <p className="text-red-700 font-medium text-sm mt-1">Quản lý nhiệm vụ duyệt thủ công (TASK POINTS 0)</p>
                  </div>
                  <button onClick={fetchReviews} className="p-2 bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors">
                     <RefreshCw size={18} className={isReviewsLoading ? "animate-spin" : ""} />
                  </button>
              </div>

              {isReviewsLoading ? (
                 <div className="flex justify-center p-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                 </div>
              ) : pendingReviews.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-2xl border border-red-100">
                    <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium whitespace-nowrap">Không có yêu cầu đánh giá nào đang chờ duyệt</p>
                 </div>
              ) : (
                 <div className="space-y-4">
                    {pendingReviews.map(review => {
                       let reviewData = { type: 'unknown', url: '' };
                       try {
                           if (review.short_url) reviewData = JSON.parse(review.short_url);
                       } catch (e) {}

                       return (
                          <div key={review.id} className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 grid md:grid-cols-12 gap-6 items-center">
                              <div className="md:col-span-3">
                                 <p className="text-xs text-slate-500 font-bold mb-1">Tài khoản</p>
                                 <p className="font-bold text-slate-900 border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">@{review.user_id}</p>
                              </div>
                              <div className="md:col-span-2">
                                 <p className="text-xs text-slate-500 font-bold mb-1">Loại Review</p>
                                 <p className="font-bold text-slate-700 uppercase">{reviewData.type}</p>
                              </div>
                              <div className="md:col-span-4 overflow-hidden">
                                 <p className="text-xs text-slate-500 font-bold mb-1">Bằng chứng URL</p>
                                 <a href={reviewData.url} target="_blank" rel="noreferrer" className="text-blue-600 truncate block bg-blue-50 px-3 py-2 rounded-lg text-sm hover:underline">
                                    {reviewData.url || 'Chưa cung cấp link'}
                                 </a>
                                 <p className="text-[10px] text-slate-400 mt-1 font-mono">{new Date(review.completed_at || review.created_at).toLocaleString('vi-VN')}</p>
                              </div>
                              <div className="md:col-span-3 flex items-center justify-end space-x-2">
                                 <button
                                     onClick={async () => {
                                        if (!window.confirm(`Duyệt thành công yêu cầu review của @${review.user_id}? Người dùng sẽ nhận +${review.reward} điểm.`)) return;
                                        const ok = await syncService.approveReviewTask(review.id, review.user_id, review.reward);
                                        if (ok) fetchReviews();
                                        else alert("Lỗi hệ thống");
                                     }}
                                     className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl font-bold text-sm transition-all flex items-center shadow-sm"
                                 >
                                     <CheckCircle size={16} className="mr-1" /> Duyệt
                                 </button>
                                 <button
                                     onClick={async () => {
                                        if (!window.confirm(`Từ chối yêu cầu của @${review.user_id}?`)) return;
                                        const ok = await syncService.rejectReviewTask(review.id);
                                        if (ok) fetchReviews();
                                        else alert("Lỗi hệ thống");
                                     }}
                                     className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all flex items-center shadow-sm"
                                 >
                                     Từ chối
                                 </button>
                              </div>
                          </div>
                       );
                    })}
                 </div>
              )}
           </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="text-sm font-bold text-black uppercase tracking-tight">Danh Sách Thành Viên Thực Tế</h3>
              <p className="text-xs text-gray-500 mt-0.5">Quản lý số dư, mật khẩu, ID và trạng thái khóa của tất cả tài khoản.</p>
            </div>
            <button 
              onClick={fetchUsers}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-all"
            >
              Làm mới
            </button>
          </div>

          {/* SEARCH BAR & SYSTEM CAP LIMIT BANNER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="Tìm kiếm thành viên theo tên, ID Free Fire, UID Liên Quân..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-white text-black border border-gray-200 rounded-2xl p-3.5 pl-11 text-xs font-semibold focus:border-green-600 outline-none transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-4.5 text-gray-400" size={14} />
              {userSearchQuery && (
                <button 
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-4 top-4 text-xs text-red-500 hover:text-red-700 font-bold"
                >
                  XÓA
                </button>
              )}
            </div>
            
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3 flex flex-col justify-center text-left select-none">
              <div className="flex items-center space-x-1.5 text-red-600 font-bold uppercase text-[9px] tracking-wider">
                <Shield size={11} />
                <span>USER MAX</span>
              </div>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Hạn mức hệ thống: <strong className="text-red-600 font-mono">100,000,000,000</strong>
              </p>
            </div>
          </div>

          {/* TABLE OF USERS */}
          <div className="glass-morphism rounded-3xl overflow-hidden border border-gray-200">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase text-[9px]">
                      <th className="px-4 py-3">STT</th>
                      <th className="px-4 py-3">ID / TÊN ĐĂNG NHẬP</th>
                      <th className="px-4 py-3 text-left">
                        <button
                          type="button"
                          onClick={() => setShowAllPasswords(!showAllPasswords)}
                          className="flex items-center space-x-1 hover:text-black font-bold uppercase text-[9px] transition-colors focus:outline-none focus:ring-0"
                        >
                          <span>MẬT KHẨU</span>
                          {showAllPasswords ? <EyeOff size={11} className="text-gray-400" /> : <Eye size={11} className="text-gray-400" />}
                        </button>
                      </th>
                      <th className="px-4 py-3">SỐ DƯ ĐIỂM</th>
                      <th className="px-4 py-3">SỐ DƯ VNĐ</th>
                      <th className="px-4 py-3 text-center">TRẠNG THÁI</th>
                      <th className="px-3 py-3">NGÀY THAM GIA</th>
                      <th className="px-3 py-3 text-center">NV HOÀN THÀNH</th>
                      <th className="px-4 py-3 text-center">SETTINGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isUsersLoading && usersList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-gray-500 font-medium">Đang tải danh sách thành viên...</td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-gray-500 font-medium">Chưa có thành viên nào đăng ký.</td>
                      </tr>
                    ) : (() => {
                      const filtered = usersList.filter(user => {
                        if (selectedUserRow && user.username !== selectedUserRow) return false;
                        const q = userSearchQuery.trim().toLowerCase();
                        if (!q) return true;
                        
                        const plainName = user.username.split('||')[0].toLowerCase();
                        const ffId = (user.ff_id || '').toLowerCase();
                        const lqUid = (user.lq_uid || '').toLowerCase();
                        
                        return plainName.includes(q) || ffId.includes(q) || lqUid.includes(q);
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={9} className="px-4 py-10 text-center text-gray-400 italic">Không tìm thấy thành viên nào khớp với từ khóa "{userSearchQuery}"</td>
                          </tr>
                        );
                      }

                      return filtered.map((user, idx) => {
                        const nameParts = user.username.split('||');
                        const plainName = nameParts[0];
                        const pwHash = nameParts[1] || 'Legacy (N/A)';
                        const formattedDate = user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'N/A';
                        
                        // Heuristic online state: Let's see if isOnline is true or if they are the current logged-in user!
                        const isUserOnline = user.isOnline || user.username === username;

                        return (
                          <tr 
                            key={user.username} 
                            className={`transition-colors cursor-pointer ${selectedUserRow === user.username ? 'bg-orange-50' : 'hover:bg-gray-50/50'}`}
                            onClick={() => setSelectedUserRow(prev => prev === user.username ? null : user.username)}
                          >
                            <td className="px-4 py-3.5 text-gray-400 font-mono">{idx + 1}</td>
                            <td className="px-4 py-3.5 font-bold text-black flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span>{plainName}</span>
                                {user.is_cheater && (
                                  <span className="inline-flex items-center space-x-0.5 bg-red-100 text-red-600 px-1 py-0.5 rounded font-black text-[9px] uppercase border border-red-200">
                                    <ShieldAlert size={10} />
                                    <span>GIAN LẬN</span>
                                  </span>
                                )}
                              </div>
                              {(user.ff_id || user.lq_uid) && (
                                <div className="flex space-x-1 mt-0.5">
                                  {user.ff_id && <span className="text-[8px] bg-red-100 text-red-600 px-1 rounded font-sans">FF: {user.ff_id}</span>}
                                  {user.lq_uid && <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded font-sans">LQ: {user.lq_uid}</span>}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-mono text-gray-500 text-[11px]">
                              <div className="flex items-center space-x-2">
                                <span className="select-all">{showAllPasswords || visiblePasswords[user.username] ? pwHash : '••••••••'}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVisiblePasswords(prev => ({
                                      ...prev,
                                      [user.username]: !prev[user.username]
                                    }));
                                  }}
                                  className="text-gray-400 hover:text-black transition-colors p-0.5 rounded hover:bg-gray-200"
                                  title={showAllPasswords || visiblePasswords[user.username] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                >
                                  {showAllPasswords || visiblePasswords[user.username] ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 font-bold">
                              <span className="text-orange-500">{(user.points_balance || 0).toLocaleString()}</span>
                              {user.points_locked && <span className="ml-1 text-[8px] uppercase bg-red-500 text-white font-extrabold px-1 rounded font-sans scale-90 inline-block">KHÓA</span>}
                            </td>
                            <td className="px-4 py-3.5 font-bold">
                              <span className="text-green-600">{(user.vnd_balance || 0).toLocaleString()} VNĐ</span>
                              {user.vnd_locked && <span className="ml-1 text-[8px] uppercase bg-red-500 text-white font-extrabold px-1 rounded font-sans scale-90 inline-block">KHÓA</span>}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {isUserOnline ? (
                                <span className="inline-flex items-center space-x-1 text-green-500 font-extrabold text-[9px] uppercase bg-green-500/10 px-1.5 py-0.5 rounded-md">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                                  <span>ONLINE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-gray-400 font-extrabold text-[9px] uppercase bg-gray-500/10 px-1.5 py-0.5 rounded-md">
                                  <span>OFFLINE</span>
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3.5 text-gray-500 font-medium font-mono">
                              {formattedDate}
                            </td>
                            <td className="px-3 py-3.5 text-center font-bold font-mono text-cyan-600">
                              {user.completedTasks || 0}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserForEdit(user);
                                  setEditVndInput('0');
                                  setEditVndAction('add');
                                  setEditPointsInput('0');
                                  setEditPointsAction('add');
                                  setEditPointsLocked(user.points_locked);
                                  setEditVndLocked(user.vnd_locked);
                                  setEditIsCheater(user.is_cheater || false);
                                }}
                                className="inline-flex items-center space-x-1 bg-gray-600 hover:bg-black text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                              >
                                <Settings size={11} />
                                <span>CÀI ĐẶT</span>
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
               </table>
             </div>
          </div>

          {/* EDIT DIALOG MODAL */}
          {selectedUserForEdit && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-gray-100 shadow-2xl relative space-y-6 animate-in zoom-in-95 duration-200 text-black">
                 <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
                 >
                   <XCircle size={22} />
                 </button>

                 <div>
                   <h3 className="text-xl font-black italic tracking-tight border-b pb-2">CHỈNH SỬA THÀNH VIÊN</h3>
                   <div className="mt-3 bg-gray-50 p-3 rounded-2xl text-xs space-y-1 text-gray-700">
                      <div><strong className="text-black">Tên đăng nhập:</strong> {selectedUserForEdit.username.split('||')[0]}</div>
                      <div className="flex items-center space-x-2 py-0.5">
                        <strong className="text-black flex-shrink-0">Mật khẩu:</strong>
                        <span className="font-mono bg-gray-200/50 px-1.5 py-0.5 rounded text-[11px] truncate select-all max-w-[200px]">
                          {showModalPassword ? (selectedUserForEdit.username.split('||')[1] || 'Legacy (N/A)') : '••••••••'}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => setShowModalPassword(!showModalPassword)}
                          className="text-gray-400 hover:text-black transition-colors focus:outline-none focus:ring-0"
                          title={showModalPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showModalPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                      </div>
                      <div><strong className="text-black">ID Free Fire:</strong> {selectedUserForEdit.ff_id || 'Chưa liên kết'}</div>
                      <div><strong className="text-black">UID Liên Quân:</strong> {selectedUserForEdit.lq_uid || 'Chưa liên kết'}</div>
                   </div>
                 </div>

                 {/* VNĐ MANAGEMENT */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Điều Chỉnh Số Dư VNĐ</label>
                    <div className="grid grid-cols-3 gap-2">
                       <select 
                         value={editVndAction} 
                         onChange={(e: any) => setEditVndAction(e.target.value)}
                         className="bg-white border rounded-xl text-xs px-2 py-2.5 font-bold focus:border-green-600 outline-none text-black"
                       >
                         <option value="add">Cộng (+) VNĐ</option>
                         <option value="sub">Trừ (-) VNĐ</option>
                         <option value="set">Đặt mới (=) VNĐ</option>
                       </select>
                       <input 
                         type="number" 
                         value={editVndInput}
                         onChange={(e) => setEditVndInput(e.target.value)}
                         placeholder="Số lượng VNĐ"
                         className="col-span-2 bg-white border rounded-xl text-xs px-3 py-2.5 font-mono focus:border-green-600 outline-none text-black"
                       />
                    </div>
                     <p className="text-[10px] text-gray-500 italic">Số dư hiện tại: <strong className="text-green-600">{(selectedUserForEdit.vnd_balance || 0).toLocaleString()} VNĐ</strong></p>
                 </div>

                 {/* POINTS MANAGEMENT */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Điều Chỉnh Số Dư Điểm</label>
                    <div className="grid grid-cols-3 gap-2">
                       <select 
                         value={editPointsAction} 
                         onChange={(e: any) => setEditPointsAction(e.target.value)}
                         className="bg-white border rounded-xl text-xs px-2 py-2.5 font-bold focus:border-orange-500 outline-none text-black"
                       >
                         <option value="add">Cộng (+) Điểm</option>
                         <option value="sub">Trừ (-) Điểm</option>
                         <option value="set">Đặt mới (=) Điểm</option>
                       </select>
                       <input 
                         type="number" 
                         value={editPointsInput}
                         onChange={(e) => setEditPointsInput(e.target.value)}
                         placeholder="Số lượng Điểm"
                         className="col-span-2 bg-white border rounded-xl text-xs px-3 py-2.5 font-mono focus:border-orange-500 outline-none text-black"
                       />
                    </div>
                     <p className="text-[10px] text-gray-500 italic">Số dư hiện tại: <strong className="text-orange-500">{(selectedUserForEdit.points_balance || 0).toLocaleString()} Điểm</strong></p>
                 </div>

                 {/* LOCKS */}
                 <div className="border-t pt-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">Trạng Thái Khóa Tài Khoản</h4>
                    <div className="flex flex-col sm:flex-row gap-4">
                       <label className="flex items-center space-x-2 cursor-pointer bg-red-500/5 px-4 py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/20 active:opacity-80 flex-1 select-none">
                          <input 
                            type="checkbox" 
                            checked={editPointsLocked} 
                            onChange={(e) => setEditPointsLocked(e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="text-left text-black">
                            <p className="text-xs font-black">Khóa Số Dư Điểm</p>
                            <p className="text-[9px] text-gray-500 font-sans">Không cho phép chi tiêu hay nhận thêm Điểm</p>
                          </div>
                       </label>

                       <label className="flex items-center space-x-2 cursor-pointer bg-red-500/5 px-4 py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/20 active:opacity-80 flex-1 select-none">
                          <input 
                            type="checkbox" 
                            checked={editVndLocked} 
                            onChange={(e) => setEditVndLocked(e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="text-left text-black">
                            <p className="text-xs font-black">Khóa Số Dư VNĐ</p>
                            <p className="text-[9px] text-gray-500 font-sans">Không cho phép mua VIP Mod bằng VNĐ</p>
                          </div>
                       </label>
                    </div>
                    
                    <div className="pt-2">
                       <label className="flex items-center space-x-2 cursor-pointer bg-red-600 text-white px-4 py-2.5 rounded-xl border border-red-700 hover:bg-red-700 active:opacity-80 select-none shadow-lg shadow-red-900/20">
                          <input 
                            type="checkbox" 
                            checked={editIsCheater} 
                            onChange={(e) => setEditIsCheater(e.target.checked)}
                            className="rounded border-none focus:ring-red-500 w-4 h-4 cursor-pointer accent-white"
                          />
                          <div className="text-left">
                            <p className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><ShieldAlert size={14} /> Đánh Dấu Là Gian Lận</p>
                            <p className="text-[9px] text-red-100 font-sans">Ghim dấu báo động cho tài khoản này</p>
                          </div>
                       </label>
                    </div>

                    {/* QUICK ACTIONS SHORTCUT BY USER REQUEST */}
                    <div className="mt-4 pt-3 border-t border-gray-150 space-y-2 bg-slate-50 p-3 rounded-2xl border border-gray-105 text-left">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-sans">Thao tác nhanh 1-Click (Yêu cầu Bot)</span>
                       <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleQuickUnban(selectedUserForEdit.username);
                              setSelectedUserForEdit(null);
                            }}
                            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer select-none"
                          >
                             <Unlock size={11} /> <span>MỞ BAN NHANH</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleClearDeviceHistory(selectedUserForEdit.username);
                              setSelectedUserForEdit(null);
                            }}
                            className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] uppercase rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer select-none"
                          >
                             <Smartphone size={11} /> <span>XÓA THIẾT BỊ</span>
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* ACTIONS */}
                 <div className="flex space-x-2 pt-2">
                    <button
                       onClick={() => setSelectedUserForEdit(null)}
                       className="flex-1 px-4 py-3 bg-gray-105 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center"
                    >
                      HỦY BỎ
                    </button>
                    <button
                       onClick={handleUpdateUserSetting}
                       className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer text-center"
                    >
                      LƯU THAY ĐỔI
                    </button>
                 </div>
               </div>
            </div>
          )}

          {/* BILL RECEIPT MODAL POPUP */}
          {selectedBillForView && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-5 md:p-6 max-w-sm w-full border border-gray-100 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200 text-black font-sans">
                <button
                  onClick={() => setSelectedBillForView(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
                >
                  <XCircle size={22} />
                </button>

                <div className="text-center pt-2">
                  <div className="inline-flex items-center justify-center bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-3 text-center">
                    🏦 MB BANK RECEIPT
                  </div>
                  <h3 className="text-base font-extrabold text-blue-900 leading-tight text-center">BIÊN LAI CHUYỂN KHOẢN</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 text-center">HỆ THỐNG KIỂM TRA ĐIỆN TỬ</p>
                </div>

                {/* Simulated receipt style wrapper */}
                <div className="bg-slate-50 border border-dashed border-gray-200 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  
                  {/* Decorative corner cutouts representing actual receipt paper */}
                  <div className="absolute top-1/2 -left-2 w-4 h-4 rounded-full bg-white border-r border-gray-200/40 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 -right-2 w-4 h-4 rounded-full bg-white border-l border-gray-200/40 -translate-y-1/2"></div>
                  
                  {/* Amount Block */}
                  <div className="text-center pb-2 border-b border-dashed border-gray-200 text-center flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-medium block">Số Tiền</span>
                    <strong className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
                      +{selectedBillForView.amount.toLocaleString()} VNĐ
                    </strong>
                    <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold mt-1.5 border border-emerald-100">
                      <CheckCircle2 size={10} /> GD THÀNH CÔNG
                    </div>
                  </div>

                  {/* Transaction info records */}
                  <div className="text-left text-[11px] space-y-2 pt-1 font-sans">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Người nạp:</span>
                      <strong className="text-slate-800 font-bold">@{selectedBillForView.username}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Ngân hàng nhận:</span>
                      <strong className="text-slate-800 font-semibold text-right">MB (Ngân hàng Quân Đội)</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Số tài khoản nhận:</span>
                      <strong className="text-slate-800 font-mono text-right">9612345678</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Tên thụ hưởng:</span>
                      <strong className="text-slate-800 text-right">HOANG MAI ANH VU</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Mã giao dịch (Ref):</span>
                      <strong className="text-blue-600 font-mono text-right">{selectedBillForView.orderId}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Phương thức:</span>
                      <strong className="text-slate-800 capitalize text-right">{selectedBillForView.method || 'Banking (QR)'}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Thời gian tạo đơn:</span>
                      <span className="text-slate-800 font-medium font-mono text-right">
                        {selectedBillForView.created_at ? new Date(selectedBillForView.created_at).toLocaleString('vi-VN') : selectedBillForView.time}
                      </span>
                    </div>
                  </div>

                  {/* Anti-cheat and Verification details */}
                  <div className="pt-2 border-t border-dashed border-gray-200 text-center">
                    <div className="text-[9px] text-gray-400 leading-relaxed font-sans text-center">
                      Hệ thống tự động phát hiện số tiền thực nhận khớp mã <strong className="text-indigo-600 font-mono font-bold">{selectedBillForView.orderId}</strong>. Đơn nạp an toàn và sẵn sàng để duyệt.
                    </div>
                  </div>
                </div>

                {/* Simulated barcode graphic for craft feel */}
                <div className="flex flex-col items-center justify-center space-y-1 opacity-70">
                  <div className="h-6 w-4/5 bg-gradient-to-r from-black via-white to-black border-y border-black font-barcode flex justify-between tracking-wide"></div>
                  <span className="text-[8px] text-gray-450 font-mono tracking-widest uppercase">ID: {selectedBillForView.id.substring(0, 18)}</span>
                </div>

                <div className="flex space-x-2 pt-1 font-sans">
                  <button
                    onClick={() => setSelectedBillForView(null)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer text-center"
                  >
                    XÁC NHẬN ĐÓNG ĐƠN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
