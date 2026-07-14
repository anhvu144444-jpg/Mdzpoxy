import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.set("trust proxy", true); // Trust proxy for Vercel/Cloud Run

app.use(helmet());

// Cấu hình Rate Limiting (Giới hạn tỷ lệ API)
// Hệ thống chống DDoS chuyên nghiệp: 100 request / 10 giây, chỉ cô lập IP vi phạm
const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 giây
  max: 100, // Giới hạn 100 request cho mỗi IP
  message: { error: "Hệ thống phát hiện lưu lượng bất thường từ IP của bạn. Vui lòng chậm lại (100 request / 10s)." },
  standardHeaders: true, 
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 1. Cloudflare IP
    const cfIp = req.headers['cf-connecting-ip'];
    if (cfIp && typeof cfIp === 'string') return cfIp;
    
    // 2. X-Forwarded-For (Vercel, Nginx, Haproxy)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor && typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    
    // 3. Fallback to Express request IP
    return req.ip || 'unknown_ip';
  }
});

// Áp dụng giới hạn tỷ lệ cho toàn bộ app (tất cả route trong api/index.ts)
app.use(limiter);

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/tasks/generate-session", async (req, res) => {
  try {
    const { userId, taskId, taskName, reward, auto, fingerprint } = req.body;
    
    if (!userId || !taskId) {
      return res.status(400).json({ error: "Thiếu thông tin người dùng hoặc nhiệm vụ" });
    }

    const sessionId = Math.random().toString(36).substring(2, 11);
    
    const { error } = await supabase.from('task_sessions').insert([{
      session_id: sessionId,
      user_id: userId,
      task_id: taskId,
      task_name: taskName,
      reward,
      auto,
      fingerprint,
      status: 'Đang làm',
      created_at: new Date().toISOString()
    }]);

    if (error) {
      console.error("Lỗi khi lưu task_session vào Supabase:", error);
      return res.status(500).json({ error: "Lỗi cơ sở dữ liệu nội bộ." });
    }

    res.json({ sessionId });
  } catch (error) {
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
});

app.post("/api/tasks/get-link", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const textData = await response.text();
    let parsedData;
    try {
      parsedData = JSON.parse(textData);
    } catch (e) {
      parsedData = null;
    }
    
    res.json({ 
      success: true, 
      text: parsedData ? JSON.stringify(parsedData) : textData
    });
  } catch (error: any) {
    console.error("Proxy error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post("/api/tasks/update-session-url", async (req, res) => {
  const { sessionId, shortUrl } = req.body;
  
  const { data: session, error: fetchError } = await supabase
    .from('task_sessions')
    .select('id')
    .eq('session_id', sessionId)
    .single();

  if (session && !fetchError) {
    await supabase
      .from('task_sessions')
      .update({ short_url: shortUrl })
      .eq('session_id', sessionId);
    res.json({ status: 'success' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

app.post("/api/tasks/verify-session", async (req, res) => {
  const { sessionId, uuid } = req.body;
  
  const { data: session, error } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (session && session.user_id === uuid && session.status === 'Đang làm') {
    const now = new Date().getTime();
    const createdAt = new Date(session.created_at).getTime();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes > 15) {
      await supabase
        .from('task_sessions')
        .update({ status: 'Hết hạn' })
        .eq('session_id', sessionId);
      return res.status(400).json({ error: 'Phiên làm việc đã hết hạn (tối đa 15 phút).' });
    }

    res.json({ status: 'valid' });
  } else {
    res.status(400).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn.' });
  }
});

app.post("/api/tasks/complete-session", async (req, res) => {
  const { sessionId, uuid } = req.body;
  
  const { data: session, error } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  
  if (session && session.user_id === uuid && session.status === 'Đang làm') {
    const now = new Date().getTime();
    const createdAt = new Date(session.created_at).getTime();
    const diffMinutes = (now - createdAt) / (1000 * 60);

    if (diffMinutes < 1) {
      return res.status(400).json({ error: 'Bạn hoàn thành nhiệm vụ quá nhanh. Vui lòng đợi ít nhất 1 phút.' });
    }

    if (diffMinutes > 15) {
      await supabase
        .from('task_sessions')
        .update({ status: 'Hết hạn' })
        .eq('session_id', sessionId);
      return res.status(400).json({ error: 'Phiên làm việc đã hết hạn (tối đa 15 phút).' });
    }

    await supabase
      .from('task_sessions')
      .update({ 
        status: 'Hoàn thành',
        completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    res.json({ status: 'success' });
  } else {
    res.status(400).json({ error: 'Không thể hoàn thành phiên này (Không tìm thấy hoặc đã hết hạn).' });
  }
});

app.get("/api/tasks/history", async (req, res) => {
  const { uuid } = req.query;
  
  const { data: records, error } = await supabase
    .from('task_sessions')
    .select('*')
    .eq('user_id', uuid)
    .order('created_at', { ascending: false });

  if (error || !records) {
    return res.json({ history: [] });
  }

  const history = records.map(s => ({
    id: s.session_id,
    task_id: s.task_id,
    task_name: s.task_name,
    reward: s.reward,
    status: s.status === 'Hoàn thành' ? 'Hoàn thành' : (s.status === 'Hết hạn' ? 'Hết hạn' : (s.status === 'Đang làm' ? 'Đang chờ' : 'Từ chối')),
    timestamp: s.created_at
  }));
  
  res.json({ history });
});

export default app;
