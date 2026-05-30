-- SQL SETUP FOR MDZ STORE & FREE STORE
-- Copy and paste this into your Supabase SQL Editor

-- 1. Table for User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    username TEXT PRIMARY KEY,
    vnd_balance BIGINT DEFAULT 0,
    points_balance BIGINT DEFAULT 0,
    ff_id TEXT,
    lq_uid TEXT,
    points_locked BOOLEAN DEFAULT FALSE,
    vnd_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table for System Mods (MDZ Store Items)
CREATE TABLE IF NOT EXISTS public.system_mods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_vnd BIGINT DEFAULT 0,
    price_points BIGINT DEFAULT 0,
    category TEXT DEFAULT 'FREE', -- 'VIP' or 'FREE'
    status TEXT DEFAULT 'hoạt động',
    file_name TEXT,
    file_url TEXT,
    img TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table for Activity Logs (Nhật ký hoạt động)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user" TEXT NOT NULL,
    action TEXT NOT NULL,
    amount TEXT,
    type TEXT NOT NULL, -- 'mod', 'deposit', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table for Chat Messages (Cộng đồng)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table for Task History (Lịch sử làm nhiệm vụ Free)
CREATE TABLE IF NOT EXISTS public.task_history (
    id TEXT PRIMARY KEY, -- Session ID
    user_id TEXT REFERENCES public.user_profiles(username),
    task_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    reward BIGINT DEFAULT 0,
    status TEXT DEFAULT 'Đang chờ', -- 'Đang chờ', 'Hoàn thành', 'Từ chối'
    short_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Table for Exchange History (Lịch sử đổi Mod)
CREATE TABLE IF NOT EXISTS public.exchange_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES public.user_profiles(username),
    mod_id UUID REFERENCES public.system_mods(id) ON DELETE CASCADE,
    mod_name TEXT NOT NULL,
    price TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Table for Deposit Requests (Yêu cầu nạp tiền)
CREATE TABLE IF NOT EXISTS public.deposit_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT REFERENCES public.user_profiles(username),
    order_id TEXT NOT NULL,
    amount BIGINT NOT NULL,
    final_amount BIGINT NOT NULL,
    method TEXT DEFAULT 'bank', -- 'bank' or 'card'
    status TEXT DEFAULT 'đang chờ', -- 'đang chờ', 'thành công', 'từ chối'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table for Task Configurations (Cấu hình nhiệm vụ)
CREATE TABLE IF NOT EXISTS public.task_configs (
    id TEXT PRIMARY KEY, -- e.g., 'link4m', 'timmap'
    name TEXT NOT NULL,
    reward BIGINT NOT NULL,
    api_url TEXT NOT NULL,
    max_views INTEGER DEFAULT 1,
    auto BOOLEAN DEFAULT false,
    is_hot BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'hoạt động',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for missing tables
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;

-- Allow all for development
CREATE POLICY "Allow all on task_history" ON public.task_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exchange_history" ON public.exchange_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on deposit_requests" ON public.deposit_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on task_configs" ON public.task_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on withdraw_requests" ON public.withdraw_requests FOR ALL USING (true) WITH CHECK (true);

-- Insert initial task configurations
INSERT INTO public.task_configs (id, name, reward, api_url, max_views, auto, is_hot)
VALUES 
('link4m', 'LINK4M', 10, 'https://link4m.co/api-shorten/v2?api=68208afab6b8fc60542289b6&url=', 2, true, true),
('layma', 'LAYMA', 10, 'https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=de2c099a8fd17d1cc6c7068209e5fa5d&format=json&url=', 2, true, true),
('utl_3step', 'UTL 3 STEP', 10, 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=3&url=', 999, true, false),
('utl_2step', 'UTL 2 STEP', 10, 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=4&url=', 999, true, false),
('utl_1step', 'UTL 1 STEP', 10, 'https://uptolink.one/api?api=94eeedcdf3928b7bb78a89c19bad78274a69b830&type=2&url=', 999, true, false),
('linktot', 'LINKTOT', 10, 'https://linktot.net/JSON_QL_API.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 4, true, false),
('timmap', 'TIMMAP', 10, 'https://linktot.net/api_timmap_pt.php?token=d121d1761f207cb9bfde19c8be5111cb8d623d83e1e05053ec914728c9ea869c&url=', 2, true, false),
('bbmkts', 'BBMKTS', 10, 'https://bbmkts.com/dapi?token=d285ce6c761cc5961316783a&longurl=', 1, true, false)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    reward = EXCLUDED.reward,
    api_url = EXCLUDED.api_url,
    max_views = EXCLUDED.max_views,
    auto = EXCLUDED.auto,
    is_hot = EXCLUDED.is_hot;

-- Insert some initial sample Mods
INSERT INTO public.system_mods (name, price_vnd, price_points, category, status)
VALUES 
('MOD VIP SIÊU CẤP', 50000, 0, 'VIP', 'hoạt động'),
('MOD MIỄN PHÍ 01', 0, 1000, 'FREE', 'hoạt động'),
('MOD MIỄN PHÍ 02', 0, 2000, 'FREE', 'hoạt động');

-- 9. Table for Withdraw Requests (Rút Điểm)
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user" TEXT REFERENCES public.user_profiles(username),
    item_name TEXT NOT NULL,
    price TEXT NOT NULL,
    ff_id TEXT,
    lq_uid TEXT,
    card_code TEXT,
    status TEXT DEFAULT 'Chờ duyệt',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Storage Setup for Mod Files
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
USING ( bucket_id = 'files' );

CREATE POLICY "Allow all uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'files' );

CREATE POLICY "Allow all updates"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'files' );

CREATE POLICY "Allow all deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'files' );