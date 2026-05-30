import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Home,
  ShoppingCart,
  Gift,
  ArrowRightLeft,
  Wallet,
  Landmark,
  Users,
  History,
  Menu,
  Coins,
  Facebook,
  Youtube,
  Send,
  Info,
  HelpCircle,
  Crown,
  Contact as ContactIcon,
  ShieldCheck,
  Headset,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  ShieldQuestion,
  Headphones,
  FileText,
  Search,
  Bell,
  Gem,
  UserCircle,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Routes, Route, useLocation } from 'react-router-dom';

import HomeSection from './components/sections/HomeSection';
import DepositSection from './components/sections/DepositSection';
import FreeSection from './components/sections/FreeSection';
import CurrencyExchangeSection from './components/sections/CurrencyExchangeSection';
import AccountSection from './components/sections/AccountSection';
import ExchangeSection from './components/sections/ExchangeSection';
import StoreSection from './components/sections/StoreSection';
import ContactSection from './components/sections/ContactSection';
import PullMoneySection from './components/sections/PullMoneySection';
import AdminSection from './components/sections/AdminSection';
import VerifyTaskSection from './components/sections/VerifyTaskSection';
import ChatWidget from './components/ChatWidget';

const NAV_ITEMS = [
  { id: 'home', label: 'Home Page', icon: Home, color: 'text-green-500' },
  { id: 'store', label: 'Store Vip', icon: Crown, color: 'text-green-500 font-bold' },
  { id: 'exchange', label: 'Store Free', icon: ArrowRightLeft, color: 'text-green-500' },
  { id: 'deposit', label: 'Add Points', icon: Wallet, color: 'text-green-500' },
  { id: 'free', label: 'Free Points', icon: Gift, color: 'text-green-500' },
  { id: 'currency', label: 'Pull ', icon: Gem, color: 'text-green-500' },
  { id: 'pull_money', label: 'Pull MoneyS', icon: Landmark, color: 'text-green-500' },
  { id: 'account', label: 'Account', icon: UserCircle, color: 'text-green-500' },
  { id: 'contact', label: 'Contact', icon: ContactIcon, color: 'text-green-500' },
  { id: 'admin', label: '🧸', icon: ShieldAlert, color: 'text-orange-600 bg-orange-600/5 font-black border border-orange-500/20' },
];

import { syncService } from './lib/syncService';
import { supabase } from './lib/supabase';

const hashPassword = (password: string) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'pw' + Math.abs(hash).toString(36);
};

export const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android OS';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'Mobile iOS';
  if (/windows/i.test(ua)) return 'Windows OS';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux OS';
  return 'Mobile Phone';
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [dbUserId, setDbUserId] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [vndBalance, setVndBalance] = useState<number>(0);
  const [pointsBalance, setPointsBalance] = useState<number>(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [systemMods, setSystemMods] = useState<any[]>([]);
  const [exchangeHistory, setExchangeHistory] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [allDepositRequests, setAllDepositRequests] = useState<any[]>([]);
  const [allWithdrawRequests, setAllWithdrawRequests] = useState<any[]>([]);
  const [allDepositHistory, setAllDepositHistory] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalPointsRewarded: 0,
    totalExchanges: 0,
    totalUsers: 0,
    totalMods: 0,
    todayActiveUsers: 0
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const location = useLocation();

  const addActivityLog = async (user: string, action: string, amount: string, type: 'mod' | 'deposit' | 'system') => {
    const currentDevice = getDeviceType();
    const actionWithDevice = action.includes('||') ? action : `${action}||${currentDevice}`;
    const newLog = { user, action: actionWithDevice, amount, type };
    await syncService.addLog(newLog);
    // Refresh logs after adding
    const logs = await syncService.getLogs();
    setActivityLogs(logs);
  };

  const [modal, setModal] = useState({ 
    isOpen: false, 
    type: 'info' as 'info' | 'confirm' | 'action',
    title: '', 
    msg: '', 
    icon: Info,
    onAction: null as (() => void) | null,
    actionLabel: '',
    data: null as any
  });

  useEffect(() => {
    const initData = async () => {
      const mods = await syncService.getMods();
      if (mods.length > 0) {
        const mappedMods = mods.map(m => ({
          ...m,
          price: m.price_vnd > 0 ? `${m.price_vnd.toLocaleString()} VNĐ` : `${m.price_points.toLocaleString()} Điểm`,
          fileName: m.file_name
        }));
        setSystemMods(mappedMods);
      }
      
      const logs = await syncService.getLogs();
      const mappedLogs = logs.map(l => ({
        ...l,
        time: new Date(l.created_at).toLocaleString('vi-VN')
      }));
      setActivityLogs(mappedLogs);

      const messages = await syncService.getChatMessages();
      const mappedMessages = messages.map(m => ({
          ...m,
          time: new Date(m.created_at).toLocaleTimeString('vi-VN'),
          isAdmin: m.is_admin
      }));
      setChatMessages(mappedMessages);

      const stats = await syncService.getGlobalStats();
      setGlobalStats(stats);
      
      setIsInitialLoading(false);
    };

    initData();

    // Set up polling for chat and logs (or ideally real-time, but polling is simpler for now)
    const interval = setInterval(async () => {
      const messages = await syncService.getChatMessages();
      const mappedMessages = messages.map(m => ({
          ...m,
          time: new Date(m.created_at).toLocaleTimeString('vi-VN'),
          isAdmin: m.is_admin
      }));
      setChatMessages(mappedMessages);

      const logs = await syncService.getLogs();
      const mappedLogs = logs.map(l => ({
        ...l,
        time: new Date(l.created_at).toLocaleString('vi-VN')
      }));
      setActivityLogs(mappedLogs);

      const stats = await syncService.getGlobalStats();
      setGlobalStats(stats);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      if (isLoggedIn && username) {
        const supabaseUrl = ((import.meta as any).env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co').replace(/\/$/, "");
        const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'placeholder';
        if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
          const url = `${supabaseUrl}/rest/v1/activity_logs`;
          const payload = JSON.stringify({
            user: username,
            action: `Thoát hệ thống||${getDeviceType()}`,
            amount: '',
            type: 'system'
          });
          
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=minimal'
            },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [isLoggedIn, username]);

  const loadUserHistories = async (dbId: string, isUserAdmin: boolean) => {
    // Fetch personal user data
    const userExchangeHistory = await syncService.getExchangeHistory(dbId);
    setExchangeHistory(userExchangeHistory.map(h => ({
        id: h.id,
        itemName: h.mod_name,
        price: h.price,
        time: new Date(h.created_at).toLocaleString('vi-VN'),
        status: 'thành công'
    })));

    const userDepositRequests = await syncService.getDepositRequests(dbId);
    setDepositRequests(userDepositRequests.filter(r => r.status === 'đang chờ').map(r => ({
        ...r,
        orderId: r.order_id,
        finalAmount: r.final_amount,
        time: new Date(r.created_at).toLocaleString('vi-VN')
    })));
    setDepositHistory(userDepositRequests.map(r => ({
        ...r,
        orderId: r.order_id,
        finalAmount: r.final_amount,
        processedTime: r.status !== 'đang chờ' ? new Date(r.created_at).toLocaleString('vi-VN') : null,
        time: new Date(r.created_at).toLocaleString('vi-VN')
    })));

    const userWithdrawRequests = await syncService.getWithdrawRequests(dbId);
    setWithdrawRequests(userWithdrawRequests.map(r => ({
        ...r,
        itemName: r.item_name,
        ffId: r.ff_id,
        lqUid: r.lq_uid,
        cardCode: r.card_code,
        status: r.status,
        time: new Date(r.created_at).toLocaleString('vi-VN')
    })));

    // For admin, fetch ALL to admin state explicitly
    if (isUserAdmin) {
      const allDeposits = await syncService.getDepositRequests(); 
      setAllDepositRequests(allDeposits.filter(r => r.status === 'đang chờ').map(r => ({
        ...r,
        orderId: r.order_id,
        finalAmount: r.final_amount,
        time: new Date(r.created_at).toLocaleString('vi-VN')
      })));
      setAllDepositHistory(allDeposits.map(r => ({
        ...r,
        orderId: r.order_id,
        finalAmount: r.final_amount,
        processedTime: r.status !== 'đang chờ' ? new Date(r.created_at).toLocaleString('vi-VN') : null,
        time: new Date(r.created_at).toLocaleString('vi-VN')
      })));

      const allWithdraws = await syncService.getWithdrawRequests();
      setAllWithdrawRequests(allWithdraws.map(r => ({
        ...r,
        itemName: r.item_name,
        ffId: r.ff_id,
        lqUid: r.lq_uid,
        cardCode: r.card_code,
        status: r.status,
        time: new Date(r.created_at).toLocaleString('vi-VN')
      })));
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').split('?')[0];
      if (hash && NAV_ITEMS.some(item => item.id === hash)) {
        setActiveTab(hash);
      } else if (hash === 'verify') {
        setActiveTab('verify');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    const checkLogin = async () => {
      const savedUsername = localStorage.getItem('mdzpx_username');
      const savedDbUserId = localStorage.getItem('mdzpx_db_userid') || savedUsername;
      if (savedUsername && savedDbUserId) {
        setUsername(savedUsername);
        setDbUserId(savedDbUserId);
        
        // Fetch real balance from DB
        const profile = await syncService.getProfile(savedDbUserId);
        let isUserAdmin = false;
        if (profile) {
          setVndBalance(profile.vnd_balance);
          setPointsBalance(profile.points_balance);
          isUserAdmin = !!profile.is_admin;
        } else {
          // Create profile if not exists
          const newProfile = await syncService.createProfile(savedDbUserId);
          if (newProfile) {
              setVndBalance(newProfile.vnd_balance);
              setPointsBalance(newProfile.points_balance);
              isUserAdmin = !!newProfile.is_admin;
          }
        }

        setIsAdmin(isUserAdmin);
        setIsLoggedIn(true);

        await loadUserHistories(savedDbUserId, isUserAdmin);
      }

    };

    checkLogin();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [location]);

  const handleAuth = async () => {
    setAuthError('');
    if (usernameInput.trim().length < 3) {
      setAuthError('Tên đăng nhập phải từ 3 ký tự trở lên');
      return;
    }
    if (authMode === 'register') {
      if (emailInput.trim().length === 0) {
        setAuthError('Vui lòng nhập email');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.trim())) {
        setAuthError('Email không hợp lệ. Ví dụ: user@gmail.com');
        return;
      }
    }
    if (passwordInput.trim().length < 4) {
      setAuthError('Mật khẩu phải từ 4 ký tự trở lên');
      return;
    }

    if (authMode === 'register' && passwordInput.trim() !== confirmPasswordInput.trim()) {
      setAuthError('Mật khẩu nhập lại không trùng khớp');
      return;
    }

    const trimmedUsername = usernameInput.trim();
    const plainPw = passwordInput.trim();
    const trimmedEmail = emailInput.trim();
    const joinedUsername = `${trimmedUsername}||${trimmedEmail}||${plainPw}`;

    let matchedDbUserId = '';
    let targetProfile: any = null;

    if (authMode === 'register') {
      // Check user_credentials table first
      const { data: existingCreds, error: checkCredError } = await supabase
        .from('user_credentials')
        .select('username')
        .ilike('username', trimmedUsername);

      // Check legacy user_profiles case-insensitively
      const { data: existingProfiles, error: checkError } = await supabase
        .from('user_profiles')
        .select('username')
        .ilike('username', `${trimmedUsername}%`);

      if (checkError) {
        console.error('Lỗi kiểm tra trùng tài khoản:', checkError);
      }

      const usernameExistsLegacy = (existingProfiles || []).some(p => {
        const pUsername = p.username.split('||')[0].toLowerCase();
        return pUsername === trimmedUsername.toLowerCase();
      });

      if ((existingCreds && existingCreds.length > 0) || usernameExistsLegacy) {
        setAuthError('Tài khoản đã tồn tại. Vui lòng đăng nhập.');
        return;
      }

      // Create new profile with clean trimmed username, and also create a credential entry
      const newProfile = await syncService.createProfile(trimmedUsername, trimmedEmail, plainPw);
      if (!newProfile) {
        setAuthError('Lỗi tạo tài khoản trên hệ thống database. Thử lại sau.');
        return;
      }
      
      setVndBalance(newProfile.vnd_balance);
      setPointsBalance(newProfile.points_balance);
      setIsAdmin(!!newProfile.is_admin);
      setDbUserId(trimmedUsername);
      localStorage.setItem('mdzpx_db_userid', trimmedUsername);
    } else {
      let isAuthorized = false;

      // 1. Check user_credentials table first
      const { data: credsByName } = await supabase
        .from('user_credentials')
        .select('*')
        .ilike('username', trimmedUsername)
        .single();
        
      const { data: credsByEmail } = await supabase
        .from('user_credentials')
        .select('*')
        .ilike('email', trimmedUsername)
        .single();
      
      const creds = credsByName || credsByEmail;

      if (creds && creds.password === plainPw) {
            isAuthorized = true;
            matchedDbUserId = creds.username;
            // Fetch profile
            const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .ilike('username', matchedDbUserId)
            .single();
            targetProfile = profile;
      }

      // 2. Fallback to Legacy Logic if not authorized
      if (!isAuthorized) {
        const { data: matchedProfiles, error: loginQueryError } = await supabase
          .from('user_profiles')
          .select('*')
          .ilike('username', `%${trimmedUsername}%`);

        if (loginQueryError) {
          console.error('Lỗi tìm tài khoản đăng nhập:', loginQueryError);
        }

        const foundProfile = (matchedProfiles || []).find(p => {
          const parts = p.username.split('||');
          const pUsername = parts[0].toLowerCase();
          const pEmail = parts.length > 2 ? parts[1].trim().toLowerCase() : '';
          return pUsername === trimmedUsername.toLowerCase() || (pEmail && pEmail === trimmedUsername.toLowerCase());
        });

        if (!foundProfile) {
          setAuthError('Tài khoản không tồn tại. Vui lòng đăng ký.');
          return;
        }

        const dbUsernameVal = foundProfile.username;
        const parts = dbUsernameVal.split('||');
        
        matchedDbUserId = dbUsernameVal;

        if (parts.length === 3) {
          const dbPassword = parts[2];
          
          if (dbPassword === plainPw) {
            isAuthorized = true;
          }
        } else if (parts.length === 2) {
          const dbPassword = parts[1];
          const pwHashLegacy = hashPassword(plainPw);
          if (dbPassword === plainPw || dbPassword === pwHashLegacy) {
            isAuthorized = true;
          }
        }
        
        targetProfile = foundProfile;
      }

      if (!isAuthorized || !targetProfile) {
        setAuthError('Thông tin đăng nhập (Tài khoản/Email/Mật khẩu) không chính xác.');
        return;
      }

      setVndBalance(targetProfile.vnd_balance);
      setPointsBalance(targetProfile.points_balance);
      setIsAdmin(!!targetProfile.is_admin);
      setDbUserId(matchedDbUserId);
      localStorage.setItem('mdzpx_db_userid', matchedDbUserId);
    }

    setUsername(trimmedUsername);
    localStorage.setItem('mdzpx_username', trimmedUsername);
    
    // Load histories AFTER determining new role/dbUserId but BEFORE setting isLoggedIn to reveal UI
    const finalDbUserId = authMode === 'register' ? trimmedUsername : (matchedDbUserId || trimmedUsername);
    const finalIsAdmin = authMode === 'register' ? false : !!targetProfile?.is_admin;
    await loadUserHistories(finalDbUserId, finalIsAdmin);
    
    setIsLoggedIn(true);

    if (authMode === 'register') {
      showModal('Đăng Ký Thành Công', `Chào mừng ${trimmedUsername} gia nhập MDZPX!`, ShieldCheck);
      addActivityLog(trimmedUsername, 'Đăng ký tài khoản', '', 'system');
    } else {
      showModal('Chào mừng!', `Chúc mừng ${trimmedUsername} đã đăng nhập thành công vào MDZPX.`, ShieldCheck);
      addActivityLog(trimmedUsername, 'Đăng nhập hệ thống', '', 'system');
    }
  };

  const handleLogout = () => {
    if (username) {
      addActivityLog(username, 'Đăng xuất hệ thống', '', 'system').catch(console.error);
    }
    localStorage.removeItem('mdzpx_username');
    localStorage.removeItem('mdzpx_db_userid');
    setUsername('');
    setDbUserId('');
    setUsernameInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setEmailInput('');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setActiveTab('home');
    setVndBalance(0);
    setPointsBalance(0);
    setExchangeHistory([]);
    setDepositRequests([]);
    setWithdrawRequests([]);
    setDepositHistory([]);
    setAllDepositRequests([]);
    setAllWithdrawRequests([]);
    setAllDepositHistory([]);
  };

  const showModal = (
    title: string, 
    msg: string, 
    icon = Info, 
    type: 'info' | 'confirm' | 'action' = 'info', 
    onAction: (() => void) | null = null,
    actionLabel: string = '',
    data: any = null
  ) => {
    setModal({ 
      isOpen: true, 
      type, 
      title, 
      msg, 
      icon, 
      onAction,
      actionLabel,
      data 
    });
  };

  const showConfirmModal = (itemName: string, price: string) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Xác Nhận Đổi Vật Phẩm',
      msg: '',
      icon: HelpCircle,
      data: {
        name: itemName,
        price: price,
        time: new Date().toLocaleString('vi-VN')
      }
    });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleConfirmPurchase = async () => {
    const itemName = modal.data?.name;
    const priceString = modal.data?.price || "0";
    const userNick = username;
    const userId = dbUserId || username;
    
    // Check balance
    const isVnd = priceString.includes('VNĐ');
    const priceValue = parseInt(priceString.replace(/\D/g, '')) || 0;

    // Fetch latest profile first to inspect lock state
    const profile = await syncService.getProfile(userId);
    if (isVnd && profile?.vnd_locked) {
      closeModal();
      setTimeout(() => showModal('Giao dịch thất bại', 'Số dư VNĐ của bạn đã bị KHÓA bởi Admin!', ShieldAlert), 100);
      return;
    }
    if (!isVnd && profile?.points_locked) {
      closeModal();
      setTimeout(() => showModal('Giao dịch thất bại', 'Số dư ĐIỂM của bạn đã bị KHÓA bởi Admin!', ShieldAlert), 100);
      return;
    }

    if (isVnd) {
      if (vndBalance < priceValue) {
        closeModal();
        setTimeout(() => showModal('Giao dịch thất bại', 'Bạn không có đủ VNĐ để mua gói Mod này. Vui lòng nạp thêm VNĐ.', ShieldAlert), 100);
        return;
      }
      const newBalance = vndBalance - priceValue;
      setVndBalance(newBalance);
      await syncService.updateBalance(userId, { vnd_balance: newBalance });
      addActivityLog(userId, `Mua VIP Mod: ${itemName}`, `-${priceValue} VNĐ`, 'mod');
    } else {
      if (pointsBalance < priceValue) {
        closeModal();
        setTimeout(() => showModal('Giao dịch thất bại', 'Bạn không đủ Điểm để đổi vật phẩm này. Vui lòng nhận thêm Điểm miễn phí.', ShieldAlert), 100);
        return;
      }
      const newBalance = pointsBalance - priceValue;
      setPointsBalance(newBalance);
      await syncService.updateBalance(userId, { points_balance: newBalance });
      addActivityLog(userId, `Đổi Free: ${itemName}`, `-${priceValue} Điểm`, 'mod');
    }

    const isCurrency = itemName?.includes("Kim Cương") || itemName?.includes("Quân Huy") || itemName?.includes("Thẻ") || itemName?.includes("Ngân Hàng") || itemName?.includes("ZaloPay");
    
    closeModal();
    
    if (isCurrency) {
       // Fetch latest profile to get ff_id and lq_uid
       const profile = await syncService.getProfile(userId);
       const ffIdFromProfile = profile?.ff_id || 'Chưa nhập';
       const lqUidFromProfile = profile?.lq_uid || 'Chưa nhập';

       const wRequest = {
        id: Date.now().toString(),
        itemName: itemName,
        price: modal.data?.price,
        time: modal.data?.time,
        status: 'Chờ duyệt',
        user: userNick,
        ffId: ffIdFromProfile,
        lqUid: lqUidFromProfile,
      };
      
      setWithdrawRequests([wRequest, ...withdrawRequests]);

      await syncService.createWithdrawRequest({
        user: userNick,
        item_name: itemName,
        price: modal.data?.price,
        ff_id: wRequest.ffId,
        lq_uid: wRequest.lqUid
      });

      const maskedUser = userNick ? (userNick.length > 4 ? userNick.substring(0, 2) + '****' + userNick.substring(userNick.length - 2) : userNick.substring(0, 1) + '***') : '***';
      await syncService.sendChatMessage('HỆ THỐNG', `Người chơi ${maskedUser} vừa rút thành công ${itemName}.`, true);

      // Create TXT file for download
      const txtContent = `HỆ THỐNG MDZPX - ĐƠN RÚT ĐIỂM
----------------------------
ID Đơn: ${wRequest.id}
Người dùng: ${userNick}
Loại nhận: ${itemName}
Giá điểm: ${modal.data?.price}
Thời gian: ${modal.data?.time}
Trạng thái: Chờ duyệt

Thông tin Tài Khoản:
- ID FF: ${wRequest.ffId}
- UID LQ: ${wRequest.lqUid}

Vui lòng chờ Admin kiểm tra và duyệt đơn. Thẻ Garena sẽ xem trong Lịch Sử Giao Dịch!`;
      
      const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DonRutDiem_${wRequest.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setTimeout(() => {
        showModal('Rút Điểm Thành Công!', `Đơn rút [${itemName}] đã được tạo. Admin sẽ xử lý sớm nhất. Theo dõi trong mục Lịch Sử giao dịch!`, CheckCircle2);
      }, 500);
      
      return;
    }

    const modItem = systemMods.find(m => m.name === itemName);
    
    const infoContent = `HỆ THỐNG MOD MDZPX\n------------------\nVật phẩm: ${itemName}\nNgười dùng: ${userNick}\nLink mod : https://mdzpx.mod/download/${itemName?.replace(/\s+/g, '-').toLowerCase()}\nTrạng thái: Hoạt động\nChúc bạn chơi game vui vẻ!`;

    closeModal();

    try {
      const zip = new JSZip();
      zip.file("ThongTinMod.txt", infoContent);
      
      if (modItem && modItem.file_url) {
        try {
          const response = await fetch(modItem.file_url);
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          zip.file(modItem.file_name || `${itemName}.mod`, blob);
        } catch (fError) {
          console.error('Error fetching mod file:', fError);
          zip.file(`${itemName}_Mod_Data.bin`, "MDZPX_ENCRYPTED_MOD_DATA_PLACEHOLDER [Error Fetching Real File]");
        }
      } else {
        zip.file(`${itemName}_Mod_Data.bin`, "MDZPX_ENCRYPTED_MOD_DATA_PLACEHOLDER");
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${itemName}_MDZPX.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const historyEntry = {
        id: Date.now().toString(),
        itemName: itemName,
        price: modal.data?.price,
        time: modal.data?.time,
        status: 'Thành công'
      };
      setExchangeHistory([historyEntry, ...exchangeHistory]);

      // RECORD IN DB
      if (modItem) {
        await syncService.recordExchange(username, modItem.id, itemName, modal.data?.price);
      }

      const maskedUser = userNick ? (userNick.length > 4 ? userNick.substring(0, 2) + '****' + userNick.substring(userNick.length - 2) : userNick.substring(0, 1) + '***') : '***';
      await syncService.sendChatMessage('HỆ THỐNG', `Người chơi ${maskedUser} vừa sở hữu thành công mod ${itemName}.`, true);

      setTimeout(() => {
        showModal('Thành Công!', `Gói mod [${itemName}] đã được nén ZIP và tải về thành công!`, CheckCircle2);
      }, 500);
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        showModal('Lỗi Tải Xuống!', `Không thể tạo file ZIP. Vui lòng thử lại!`, ShieldAlert);
      }, 500);
    }
  };

  useEffect(() => {
    document.getElementById('main-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleExchange = (itemName: string, price: string) => {
    showConfirmModal(itemName, price);
  };
  
  const handleNavClick = (id: string) => {
    setActiveTab(id);
    window.location.hash = id;
    setIsSidebarOpen(false);
  };

  if (activeTab === 'verify') {
    return (
      <VerifyTaskSection 
        setPointsBalance={setPointsBalance} 
        addActivityLog={addActivityLog} 
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-white">
        <div className="max-w-md w-full glass-morphism p-8 rounded-[2rem] border border-orange-500/30 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-orange-600 rounded-2xl mx-auto flex items-center justify-center rotate-12 shadow-lg shadow-orange-500/20">
                <ShieldCheck size={48} className="text-black -rotate-12" />
            </div>
            <div>
                <h1 className="text-3xl font-black gradient-text uppercase italic tracking-tighter">Xác Minh Danh Tính</h1>
                <p className="text-gray-600 text-sm mt-2">Vui lòng nhập thông tin để truy cập hệ thống MDZPX</p>
            </div>
            <div className="space-y-4 text-left">
                {authError && <p className="text-red-500 text-sm font-bold text-center">{authError}</p>}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">{authMode === 'register' ? 'Tên đăng nhập' : 'Tên đăng nhập / Email'}</label>
                  <input 
                      type="text" 
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder={authMode === 'register' ? 'Nhập tên đăng nhập' : 'Nhập tài khoản hoặc email'} 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:border-orange-500 outline-none transition-all font-medium text-black"
                  />
                </div>
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                    <input 
                        type="email" 
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Nhập địa chỉ email" 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 focus:border-orange-500 outline-none transition-all font-medium text-black"
                    />
                  </div>
                )}
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Mật khẩu</label>
                  <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Nhập mật khẩu" 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pr-12 focus:border-orange-500 outline-none transition-all font-medium text-black"
                      onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute bottom-0 right-0 h-[52px] px-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {authMode === 'register' && (
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">Nhập lại mật khẩu</label>
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Nhập lại mật khẩu" 
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pr-12 focus:border-orange-500 outline-none transition-all font-medium text-black"
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute bottom-0 right-0 h-[52px] px-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm py-1">
                   <label className="flex items-center text-gray-700 hover:text-black cursor-pointer select-none">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2.5 w-4 h-4 rounded border-gray-200 bg-white text-orange-500 focus:ring-orange-500 focus:ring-offset-slate-900" />
                      Ghi nhớ mật khẩu
                   </label>
                   <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); setConfirmPasswordInput(''); }} className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
                      {authMode === 'login' ? 'Tạo tài khoản mới' : 'Đã có tài khoản?'}
                   </button>
                </div>

                <button 
                    onClick={handleAuth}
                    className="w-full py-3.5 mt-2 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold transition-all shadow-lg shadow-orange-900/40 text-base flex items-center justify-center cursor-pointer text-white tracking-widest cursor-pointer"
                >
                    {authMode === 'login' ? (
                      <>VÀO HỆ THỐNG <ArrowRight size={18} className="ml-2" /></>
                    ) : (
                      <>ĐĂNG KÝ NGAY <ShieldCheck size={18} className="ml-2" /></>
                    )}
                </button>
            </div>
            <div className="pt-4 flex justify-center space-x-6 text-gray-500 text-2xl">
                <a href="#" title="Hỗ trợ Admin" className="hover:text-orange-500 transition-colors"><Headset /></a>
                <a href="#" title="Nhóm Telegram" className="hover:text-blue-400 transition-colors"><Send /></a>
                <a href="#" title="YouTube" className="hover:text-red-500 transition-colors"><Youtube /></a>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row relative bg-white text-black overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 glass-morphism transform transition-transform duration-300 md:translate-x-0 md:static flex flex-col h-full ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6">
            <h1 className="text-2xl font-extrabold tracking-tighter gradient-text italic">MDZPX</h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">Hệ thống Mod Free Fire</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 py-2 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.filter(item => item.id !== 'admin' || isAdmin).map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button 
                        key={item.id}
                        onClick={() => handleNavClick(item.id)} 
                        className={`w-full flex items-center p-3 rounded-xl transition-all cursor-pointer ${isActive ? 'nav-active' : `hover:bg-white ${item.color || ''}`}`}
                    >
                        <Icon size={20} className="mr-3" /> {item.label}
                    </button>
                );
            })}
        </nav>

        <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between p-2 bg-white rounded-lg group">
                <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20 shrink-0">
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-semibold truncate text-black">{isAdmin ? 'ADMIN MDZPX' : username}</p>
                        <div className="flex flex-col mt-0.5 space-y-0.5">
                          <p className="text-[10px] text-orange-400 font-bold flex items-center"><Coins size={10} className="mr-1" />{pointsBalance.toLocaleString()} Điểm</p>
                          <p className="text-[10px] text-green-400 font-bold flex items-center"><Wallet size={10} className="mr-1" />{vndBalance.toLocaleString()} VNĐ</p>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={() => showModal('Đăng Xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?', HelpCircle, 'confirm', handleLogout, 'ĐĂNG XUẤT', { name: username, price: 'THÀNH VIÊN', time: new Date().toLocaleString('vi-VN') })}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                  title="Đăng xuất"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      <main className="flex-1 h-full relative flex flex-col w-full max-w-full overflow-hidden">
        <header className="md:hidden glass-morphism p-4 flex justify-between items-center sticky top-0 z-30 text-black">
          <h1 className="text-xl font-bold gradient-text italic">MDZPX</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="text-2xl cursor-pointer hover:text-orange-500 transition-colors">
            <Menu />
          </button>
        </header>

        <div id="main-scroll-area" className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="flex-1">
                {activeTab === 'home' && (
                  <HomeSection 
                    setActiveTab={handleNavClick} 
                    handleExchange={handleExchange} 
                    vndBalance={vndBalance} 
                    pointsBalance={pointsBalance} 
                    systemMods={systemMods}
                    globalStats={globalStats}
                  />
                )}
                {activeTab === 'store' && <StoreSection setActiveTab={handleNavClick} handleExchange={handleExchange} systemMods={systemMods} />}
                {activeTab === 'deposit' && <DepositSection setActiveTab={handleNavClick} username={dbUserId || username} showModal={(title, msg) => showModal(title, msg, Info)} setVndBalance={setVndBalance} setDepositRequests={setDepositRequests} setDepositHistory={setDepositHistory} addActivityLog={addActivityLog} />}
                {activeTab === 'free' && <FreeSection setActiveTab={handleNavClick} setPointsBalance={setPointsBalance} showModal={showModal} username={dbUserId || username} />}
                {activeTab === 'currency' && <CurrencyExchangeSection handleExchange={handleExchange} />}
                {activeTab === 'pull_money' && <PullMoneySection handleExchange={handleExchange} pointsBalance={pointsBalance} withdrawRequests={withdrawRequests} username={dbUserId || username} />}
                {activeTab === 'account' && <AccountSection username={dbUserId || username} exchangeHistory={exchangeHistory} depositHistory={depositHistory} withdrawRequests={withdrawRequests} vndBalance={vndBalance} pointsBalance={pointsBalance} />}
                {activeTab === 'exchange' && <ExchangeSection setActiveTab={handleNavClick} handleExchange={handleExchange} systemMods={systemMods} />}
                {activeTab === 'contact' && <ContactSection setActiveTab={handleNavClick} />}
                {activeTab === 'admin' && isAdmin && (
                  <AdminSection 
                    setActiveTab={handleNavClick} 
                    username={username}
                    systemMods={systemMods} 
                    setSystemMods={setSystemMods} 
                    depositRequests={allDepositRequests} 
                    setDepositRequests={setAllDepositRequests} 
                    withdrawRequests={allWithdrawRequests}
                    setWithdrawRequests={setAllWithdrawRequests}
                    setVndBalance={setVndBalance} 
                    depositHistory={allDepositHistory}
                    setDepositHistory={setAllDepositHistory}
                    activityLogs={activityLogs}
                    addActivityLog={addActivityLog}
                    globalStats={globalStats}
                    isAdmin={isAdmin}
                  />
                )}
            </div>

            <footer className="mt-auto p-8 border-t border-gray-200 text-center text-gray-500 text-sm bg-white">
                <p>&copy; 2026 MDZPX </p>
                <div className="flex justify-center space-x-4 mt-3 mb-2">
                    <a href="#" className="hover:text-orange-500 transition-colors p-2 bg-white rounded-full hover:bg-white text-black"><Facebook size={18} /></a>
                    <a href="#" className="hover:text-orange-500 transition-colors p-2 bg-white rounded-full hover:bg-white text-black"><Youtube size={18} /></a>
                    <a href="#" className="hover:text-orange-500 transition-colors p-2 bg-white rounded-full hover:bg-white text-black"><Send size={18} /></a>
                </div>
            </footer>
        </div>

        {modal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="glass-morphism max-w-md w-full p-8 rounded-[40px] text-center space-y-6 border border-gray-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-yellow-500"></div>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <modal.icon size={36} />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black italic uppercase tracking-tight text-black leading-none">{modal.title}</h3>
                {modal.type === 'confirm' ? (
                  <div className="bg-white p-5 rounded-3xl border border-black space-y-3 text-left text-gray-900">
                     <div className="flex justify-between items-center border-b border-black pb-2">
                       <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                         {modal.title === 'Đăng Xuất' ? 'TÀI KHOẢN:' : 'TÊN MOD:'}
                       </span>
                       <span className="text-black font-bold text-sm">{modal.data?.name}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-black pb-2">
                       <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                         {modal.title === 'Đăng Xuất' ? 'CHỨC VỤ:' : 'MỨC GIÁ:'}
                       </span>
                       <span className="text-orange-500 font-bold text-sm">{modal.data?.price}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500 uppercase font-bold tracking-widest text-[10px]">
                         {modal.title === 'Đăng Xuất' ? 'THỜI GIAN THOÁT:' : 'THỜI GIAN ĐỔI:'}
                       </span>
                       <span className="text-gray-600">{modal.data?.time}</span>
                     </div>
                  </div>
                ) : (
                  <p className="text-gray-700 text-sm italic py-2">{modal.msg}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {modal.type === 'confirm' ? (
                  <>
                    <button onClick={modal.onAction || handleConfirmPurchase} className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-orange-900/40 cursor-pointer">{modal.actionLabel || 'OK (ĐỔI)'}</button>
                    <button onClick={closeModal} className="flex-1 py-4 bg-white hover:bg-white text-gray-600 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all border border-gray-200 cursor-pointer">NO (HỦY)</button>
                  </>
                ) : modal.type === 'action' ? (
                  <>
                    <button onClick={() => { modal.onAction?.(); closeModal(); }} className="flex-1 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-orange-900/40 cursor-pointer">{modal.actionLabel}</button>
                    <button onClick={closeModal} className="flex-1 py-4 bg-white hover:bg-white text-gray-600 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all border border-gray-200 cursor-pointer">HỦY</button>
                  </>
                ) : (
                  <button onClick={closeModal} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-orange-900/40 cursor-pointer">{modal.actionLabel || 'ĐÓNG'}</button>
                )}
              </div>
            </div>
          </div>
        )}
        <ChatWidget username={username} chatMessages={chatMessages} setChatMessages={setChatMessages} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
