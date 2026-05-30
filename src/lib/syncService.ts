import { supabase } from './supabase';

export interface UserProfile {
  username: string;
  uuid?: string;
  vnd_balance: number;
  points_balance: number;
  ff_id?: string;
  lq_uid?: string;
  points_locked?: boolean;
  vnd_locked?: boolean;
  is_admin?: boolean;
}

export interface SystemMod {
  id: string;
  name: string;
  price?: string; // UI friendly price
  price_vnd: number;
  price_points: number;
  category: string;
  status: string;
  file_url?: string;
  file_name?: string;
  img?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user: string;
  action: string;
  amount: string;
  type: 'mod' | 'deposit' | 'system';
  created_at: string;
}

export interface TaskHistory {
  id: string;
  user_id: string;
  task_id: string;
  task_name: string;
  reward: number;
  status: 'Đang chờ' | 'Hoàn thành' | 'Từ chối' | 'Đang làm' | 'Hết hạn' | 'Đã hủy';
  short_url?: string;
  created_at: string;
  completed_at?: string;
}

export interface DepositRequest {
  id: string;
  username: string;
  order_id: string;
  amount: number;
  final_amount: number;
  method: 'bank' | 'card';
  status: 'đang chờ' | 'thành công' | 'từ chối';
  created_at: string;
}

export interface TaskConfig {
  id: string;
  name: string;
  reward: number;
  api_url: string;
  max_views: number;
  auto: boolean;
  is_hot?: boolean;
  status: string;
}

  export interface WithdrawRequest {
    id: string;
    user: string;
    item_name: string;
    price: string;
    ff_id?: string;
    lq_uid?: string;
    card_code?: string;
    status: 'Chờ duyệt' | 'Thành công' | 'Từ chối';
    created_at: string;
  }
  
  export const syncService = {
  // USER PROFILES
  async getProfile(username: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
    if (!data) return null;

    // Overlay fallback lock state from localStorage
    try {
      const stored = localStorage.getItem('supabase_fallback_locks');
      if (stored) {
        const localLocks = JSON.parse(stored);
        const fallback = localLocks[username] || {};
        return {
          ...data,
          points_locked: data.points_locked !== undefined ? data.points_locked : (fallback.points_locked || false),
          vnd_locked: data.vnd_locked !== undefined ? data.vnd_locked : (fallback.vnd_locked || false)
        };
      }
    } catch (e) {
      console.warn('Fallback lock reader error:', e);
    }
    return data;
  },

  async createProfile(username: string, email?: string, password?: string): Promise<UserProfile | null> {
    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .upsert([{ username }], { onConflict: 'username' })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating/syncing profile:', error);
      return null;
    }

    if (profileData && password) {
      // Create credential entry
      const { error: credError } = await supabase
        .from('user_credentials')
        .insert([{ 
          uuid: profileData.uuid, 
          username: username,
          email: email || null,
          password: password 
        }]);
      
      if (credError) {
        console.error('Error creating user credentials:', credError);
      }
    }

    return profileData;
  },

  async updateBalance(username: string, updates: Partial<Pick<UserProfile, 'vnd_balance' | 'points_balance'>>) {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('username', username);
    
    if (error) console.error('Error updating balance:', error);
  },

  async updateProfileGameIds(username: string, ff_id?: string, lq_uid?: string) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ ff_id, lq_uid })
      .eq('username', username);
    
    if (error) console.error('Error updating game IDs:', error);
  },

  async getPaymentInfo(username: string) {
    const { data } = await supabase
      .from('user_payment_info')
      .select('bank_info, zalopay_info')
      .eq('username', username)
      .single();
    return data || { bank_info: null, zalopay_info: null };
  },

  async savePaymentInfo(username: string, bankInfo: string, zaloInfo: string) {
    const { error } = await supabase
      .from('user_payment_info')
      .upsert([{ 
        username: username, 
        bank_info: bankInfo, 
        zalopay_info: zaloInfo 
      }], { onConflict: 'username' });
    if (error) console.error('Error saving payment info:', error);
  },

  async getUserUuid(username: string): Promise<string> {
    const profile = await this.getProfile(username);
    if (profile?.uuid) {
      return profile.uuid;
    }
    // polyfill crypto.randomUUID fallback
    const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    const newUuid = generateUUID();
    const { error } = await supabase
      .from('user_profiles')
      .update({ uuid: newUuid })
      .eq('username', username);
    if (error) console.error('Error generating uuid:', error);
    return newUuid;
  },

  // ADMIN - MANAGE USERS
  async getAllUsersProfiles() {
    let allProfiles: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let fallbackNeeded = false;
    
    while (true) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (error) {
        if (error.code === '42703' || error.message?.includes('created_at')) {
          fallbackNeeded = true;
          break;
        }
        console.error('Error fetching profiles page:', page, error);
        break;
      }
      
      if (!data || data.length === 0) {
        break;
      }
      
      allProfiles.push(...data);
      if (data.length < pageSize) {
        break;
      }
      page++;
    }
    
    if (fallbackNeeded) {
      allProfiles = [];
      page = 0;
      while (true) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('username', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);
          
        if (error) {
          console.error('Error fetching fallback profiles page:', page, error);
          break;
        }
        
        if (!data || data.length === 0) {
          break;
        }
        
        allProfiles.push(...data);
        if (data.length < pageSize) {
          break;
        }
        page++;
      }
    }
    
    const profiles = allProfiles;

    const completedTasksCount: Record<string, number> = {};
    let taskPage = 0;
    while (true) {
      const { data: tasks, error: taskError } = await supabase
        .from('task_history')
        .select('user_id, status')
        .eq('status', 'Hoàn thành')
        .range(taskPage * pageSize, (taskPage + 1) * pageSize - 1);
        
      if (taskError || !tasks || tasks.length === 0) {
        break;
      }
      
      tasks.forEach(t => {
        if (t.user_id) {
          completedTasksCount[t.user_id] = (completedTasksCount[t.user_id] || 0) + 1;
        }
      });
      
      if (tasks.length < pageSize) {
        break;
      }
      taskPage++;
    }

    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('user, action, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    const activeUsers = new Set<string>();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    
    if (recentLogs) {
      const userLatestLog: Record<string, { action: string; time: number }> = {};
      
      for (let i = recentLogs.length - 1; i >= 0; i--) {
        const l = recentLogs[i];
        if (l.user) {
          const logDate = new Date(l.created_at).getTime();
          userLatestLog[l.user] = { action: l.action || '', time: logDate };
        }
      }
      
      Object.entries(userLatestLog).forEach(([user, latest]) => {
        const plainAction = latest.action.split('||')[0].toLowerCase();
        const isOfflineAction = 
          plainAction.includes('thoát') || 
          plainAction.includes('đăng xuất') || 
          plainAction.includes('logout') || 
          plainAction.includes('exit');
          
        const isRecent = (Date.now() - latest.time) < 10 * 60 * 1000;
        
        if (!isOfflineAction && isRecent) {
          activeUsers.add(user);
        }
      });
    }

    let localLocks: Record<string, { points_locked?: boolean, vnd_locked?: boolean }> = {};
    try {
      const stored = localStorage.getItem('supabase_fallback_locks');
      if (stored) {
        localLocks = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading fallback locks from localStorage:', e);
    }

    return (profiles || []).map(p => {
      const fallback = localLocks[p.username] || {};
      return {
        username: p.username,
        vnd_balance: p.vnd_balance || 0,
        points_balance: p.points_balance || 0,
        ff_id: p.ff_id,
        lq_uid: p.lq_uid,
        points_locked: p.points_locked !== undefined ? p.points_locked : (fallback.points_locked || false),
        vnd_locked: p.vnd_locked !== undefined ? p.vnd_locked : (fallback.vnd_locked || false),
        created_at: p.created_at,
        completedTasks: completedTasksCount[p.username] || 0,
        isOnline: activeUsers.has(p.username)
      };
    });
  },

  async adminUpdateUserProfile(username: string, updates: { vnd_balance?: number, points_balance?: number, points_locked?: boolean, vnd_locked?: boolean }) {
    // 1. Persist the lock states to LocalStorage fallback first
    try {
      const stored = localStorage.getItem('supabase_fallback_locks') || '{}';
      const locks = JSON.parse(stored);
      locks[username] = {
        points_locked: updates.points_locked !== undefined ? updates.points_locked : (locks[username]?.points_locked || false),
        vnd_locked: updates.vnd_locked !== undefined ? updates.vnd_locked : (locks[username]?.vnd_locked || false)
      };
      localStorage.setItem('supabase_fallback_locks', JSON.stringify(locks));
    } catch (e) {
      console.warn('LocalStorage locks set fail:', e);
    }

    // 2. Try the full update first
    let result = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('username', username)
      .select()
      .single();
    
    // 3. If there is a missing column error or cache schema drift (e.g. PGRST204 or 'points_locked' not cached)
    if (result.error && (
      result.error.code === 'PGRST204' || 
      result.error.message?.includes('points_locked') || 
      result.error.message?.includes('vnd_locked') ||
      result.error.message?.includes('column')
    )) {
      console.warn('Database schema drift detected. Removing missing lock columns and retrying balance update.', result.error);
      
      const safeUpdates = {
        vnd_balance: updates.vnd_balance,
        points_balance: updates.points_balance
      };
      
      const retryResult = await supabase
        .from('user_profiles')
        .update(safeUpdates)
        .eq('username', username)
        .select()
        .single();
        
      if (retryResult.error) {
        console.error('Error in retry admin updating profile:', retryResult.error);
        return null;
      }
      
      // Merge retryResult data with fallback lock data to pretend everything went perfect!
      if (retryResult.data) {
        return {
          ...retryResult.data,
          points_locked: updates.points_locked,
          vnd_locked: updates.vnd_locked
        };
      }
    }
    
    if (result.error) {
      console.error('Error admin updating profile:', result.error);
      return null;
    }
    return result.data;
  },

  // MODS
  async getMods(): Promise<SystemMod[]> {
    const { data, error } = await supabase
      .from('system_mods')
      .select('*')
      .eq('status', 'hoạt động')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching mods:', error);
      return [];
    }

    return (data || []).map(m => ({
      id: m.id,
      name: m.name,
      price: m.category === 'VIP' ? `${m.price_vnd} VNĐ` : `${m.price_points} Điểm`,
      price_vnd: m.price_vnd,
      price_points: m.price_points,
      category: m.category,
      status: m.status,
      file_url: m.file_url,
      file_name: m.file_name,
      img: m.img
    }));
  },

  // CHAT
  async getChatMessages(): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) console.error('Error fetching chat:', error);
    return data || [];
  },

  async sendChatMessage(sender: string, content: string, isAdmin: boolean = false) {
    const { error } = await supabase
      .from('chat_messages')
      .insert([{ sender, content, is_admin: isAdmin }]);
    
    if (error) console.error('Error sending message:', error);
  },

  // LOGS
  async getLogs(): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) console.error('Error fetching logs:', error);
    return data || [];
  },

  async addLog(log: Omit<ActivityLog, 'id' | 'created_at'>) {
    const { error } = await supabase
      .from('activity_logs')
      .insert([log]);
    
    if (error) console.error('Error adding log:', error);
  },

  // ADMIN MODS
  async uploadModFile(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const bucketName = 'files';
      const filePath = `mods/${fileName}`;

      let { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('does not exist')) {
          console.error('Bucket not found:', uploadError);
          alert(`Lỗi Storage: Không tìm thấy Bucket '${bucketName}' trên Supabase. \n\nVui lòng copy nội dung file setup.sql mới nhất và chạy lại trong Supabase SQL Editor. Hoặc tự tạo bucket '${bucketName}' trong Storage của Supabase Dashboard.`);
          return null;
        }

        console.error('Detailed Upload Error:', uploadError);
        alert(`Lỗi khi tải file lên: ${uploadError.message}`);
        return null;
      }

      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      return null;
    }
  },

  async addMod(mod: Omit<SystemMod, 'id'>): Promise<SystemMod | null> {
    let { data, error } = await supabase
      .from('system_mods')
      .insert([mod])
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('Could not find the \'img\' column')) {
         console.warn('Column img missing on system_mods table. Falling back to inserting without img.');
         const modFallback = { ...mod };
         delete modFallback.img;
         
         const retry = await supabase
           .from('system_mods')
           .insert([modFallback])
           .select()
           .single();
           
         data = retry.data;
         error = retry.error;
         
         if (!error) {
           alert('Mod đã được thêm nhưng do bảng system_mods thiếu cột "img" nên ảnh chưa được lưu. Vui lòng chạy lệnh SQL sau trong Supabase Editor để kích hoạt tính năng lưu ảnh: ALTER TABLE system_mods ADD COLUMN img TEXT;');
         }
      }
      
      if (error) {
        console.error('Error adding mod:', error);
        return null;
      }
    }
    return data;
  },

  async updateMod(id: string, updates: Partial<Omit<SystemMod, 'id'>>): Promise<SystemMod | null> {
    const { data, error } = await supabase
      .from('system_mods')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating mod:', error);
      return null;
    }
    return data;
  },

  async deleteMod(id: string) {
    const { error } = await supabase
      .from('system_mods')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Error deleting mod:', error);
  },

  // TASKS
  async getTaskHistory(username: string): Promise<TaskHistory[]> {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabase
      .from('task_history')
      .update({ status: 'Đã hủy' })
      .eq('user_id', username)
      .eq('status', 'Đang làm')
      .lt('created_at', fifteenMinsAgo);

    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('user_id', username)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching task history:', error);
    return data || [];
  },

  async getTaskSession(sessionId: string): Promise<TaskHistory | null> {
    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching task session:', error);
      return null;
    }
    return data;
  },

  async createTaskSession(session: Omit<TaskHistory, 'completed_at' | 'created_at'>) {
    const { error } = await supabase
      .from('task_history')
      .insert([session]);
    
    if (error) console.error('Error creating task session:', error);
  },

  async updateTaskStatus(sessionId: string, status: TaskHistory['status']) {
    const updates: any = { status };
    if (status === 'Hoàn thành') {
      updates.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('task_history')
      .update(updates)
      .eq('id', sessionId);
    
    if (error) console.error('Error updating task status:', error);
  },

  async getTaskConfigs(): Promise<TaskConfig[]> {
    const { data, error } = await supabase
      .from('task_configs')
      .select('*')
      .eq('status', 'hoạt động');
    
    if (error) console.error('Error fetching task configs:', error);
    return data || [];
  },

  // WITHDRAWALS
  async getWithdrawRequests(username?: string): Promise<WithdrawRequest[]> {
    let query = supabase.from('withdraw_requests').select('*');
    if (username) {
      query = query.eq('user', username);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching withdraw requests:', error);
    return data || [];
  },

  async createWithdrawRequest(request: Omit<WithdrawRequest, 'id' | 'created_at' | 'status'>) {
    const { error } = await supabase
      .from('withdraw_requests')
      .insert([request]);
    
    if (error) console.error('Error creating withdraw request:', error);
  },

  async updateWithdrawStatus(requestId: string, status: 'Thành công' | 'Từ chối', cardCode?: string) {
    const updates: any = { status };
    if (cardCode) updates.card_code = cardCode;

    const { error } = await supabase
      .from('withdraw_requests')
      .update(updates)
      .eq('id', requestId);
    
    if (error) {
      console.error('Error updating withdraw request:', error);
      return false;
    }
    return true;
  },

  // DEPOSITS
  async getDepositRequests(username?: string): Promise<DepositRequest[]> {
    let query = supabase.from('deposit_requests').select('*');
    if (username) {
      query = query.eq('username', username);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching deposit requests:', error);
    return data || [];
  },

  async createDepositRequest(request: Omit<DepositRequest, 'id' | 'created_at'>) {
    const { error } = await supabase
      .from('deposit_requests')
      .insert([request]);
    
    if (error) console.error('Error creating deposit request:', error);
  },

  async updateDepositStatus(requestId: string, status: 'thành công' | 'từ chối', amount: number, targetUser: string) {
    // 1. Update request status
    const { error: requestError } = await supabase
      .from('deposit_requests')
      .update({ status })
      .eq('id', requestId);
    
    if (requestError) {
      console.error('Error updating deposit request:', requestError);
      return false;
    }

    // 2. If successful, update user balance
    if (status === 'thành công') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('vnd_balance')
        .eq('username', targetUser)
        .single();
      
      if (profile) {
        const newBalance = (profile.vnd_balance || 0) + amount;
        await supabase
          .from('user_profiles')
          .update({ vnd_balance: newBalance })
          .eq('username', targetUser);
      }
    }

    return true;
  },

  // EXCHANGE HISTORY
  async getExchangeHistory(username: string) {
    const { data, error } = await supabase
      .from('exchange_history')
      .select('*')
      .eq('user_id', username)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching exchange history:', error);
    return data || [];
  },

  async recordExchange(username: string, modId: string, modName: string, price: string) {
    const { error } = await supabase
      .from('exchange_history')
      .insert([{ user_id: username, mod_id: modId, mod_name: modName, price }]);
    
    if (error) console.error('Error recording exchange:', error);
  },

  // GLOBAL STATS
  async getGlobalStats() {
    try {
      // 1. Total Points Rewarded (from task_history)
      const { data: rewardedData, error: rewardedError } = await supabase
        .from('task_history')
        .select('reward')
        .eq('status', 'Hoàn thành');
      
      const totalPointsRewarded = rewardedData?.reduce((sum, item) => sum + (item.reward || 0), 0) || 0;

      // 2. Total Exchanged (from exchange_history)
      const { count: exchangeCount, error: exchangeError } = await supabase
        .from('exchange_history')
        .select('*', { count: 'exact', head: true });

      // 3. Total Users
      const { count: userCount, error: userError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // 4. Total Mods
      const { count: modCount, error: modError } = await supabase
        .from('system_mods')
        .select('*', { count: 'exact', head: true });

      // 5. Today Active Users (unique users in activity_logs since 00:00 Vietnam time)
      const now = new Date();
      const vnOffset = 7 * 60 * 60 * 1000; // GMT+7
      const nowVN = new Date(now.getTime() + vnOffset);
      nowVN.setUTCHours(0, 0, 0, 0);
      const startOfVNDayInUTC = new Date(nowVN.getTime() - vnOffset);

      const { data: activeLogsData, error: activeLogsError } = await supabase
        .from('activity_logs')
        .select('user')
        .gte('created_at', startOfVNDayInUTC.toISOString());
      
      const uniqueUsersToday = new Set(activeLogsData?.map(l => l.user) || []);

      return {
        totalPointsRewarded,
        totalExchanges: exchangeCount || 0,
        totalUsers: userCount || 0,
        totalMods: modCount || 0,
        todayActiveUsers: uniqueUsersToday.size
      };
    } catch (e) {
      console.error('Error fetching global stats:', e);
      return {
        totalPointsRewarded: 0,
        totalExchanges: 0,
        totalUsers: 0,
        totalMods: 0
      };
    }
  }
};
