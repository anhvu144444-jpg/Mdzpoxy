import express from "express";
import path from "path";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

async function startServer() {
  const app = express();
  app.set("trust proxy", true); // Trust proxy for rate limiting behind reverse proxies (like Nginx, Cloud Run)
  const PORT = 3000;

  // Tăng cường bảo mật với Helmet (ẩn header Express, setup các Header bảo mật cơ bản)
  app.use(helmet({
    contentSecurityPolicy: false, // Tắt CSP để tránh block Vite dev server trong lúc code
    crossOriginEmbedderPolicy: false,
  }));

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

  // Áp dụng giới hạn tỷ lệ cho tất cả các đường dẫn bắt đầu bằng /api
  app.use("/api", limiter);

  app.all("*", (req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  app.use(cors());
  app.use(express.json());

  // In-memory session store (In production, use Supabase or Redis)
  const taskSessions: Record<string, any> = {};

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.all("/api/*", (req, res, next) => {
    console.log(`[API LOG] ${req.method} ${req.url}`);
    next();
  });

  app.post("/api/tasks/generate-session", (req, res) => {
    console.log("POST /api/tasks/generate-session", req.body);
    try {
      const { userId, taskId, taskName, reward, auto, fingerprint } = req.body;
      
      if (!userId || !taskId) {
        return res.status(400).json({ error: "Thiếu thông tin người dùng hoặc nhiệm vụ" });
      }

      const sessionId = Math.random().toString(36).substring(2, 11);
      
      taskSessions[sessionId] = {
        userId,
        taskId,
        taskName,
        reward,
        auto,
        fingerprint,
        status: 'Đang làm',
        createdAt: new Date().toISOString()
      };

      console.log("Session Created:", sessionId);
      res.json({ sessionId });
    } catch (error) {
      console.error("Generate session error:", error);
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

  app.post("/api/tasks/update-session-url", (req, res) => {
    const { sessionId, shortUrl } = req.body;
    if (taskSessions[sessionId]) {
      taskSessions[sessionId].shortUrl = shortUrl;
      res.json({ status: 'success' });
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  });

  app.post("/api/tasks/verify-session", (req, res) => {
    const { sessionId, uuid } = req.body;
    const session = taskSessions[sessionId];
    
    if (session && session.userId === uuid && session.status === 'Đang làm') {
      const now = new Date().getTime();
      const createdAt = new Date(session.createdAt).getTime();
      const diffMinutes = (now - createdAt) / (1000 * 60);

      if (diffMinutes > 15) {
        session.status = 'Hết hạn';
        return res.status(400).json({ error: 'Phiên làm việc đã hết hạn (tối đa 15 phút).' });
      }

      res.json({ status: 'valid' });
    } else {
      res.status(400).json({ error: 'Phiên làm việc không hợp lệ hoặc đã hết hạn.' });
    }
  });

  app.post("/api/tasks/complete-session", (req, res) => {
    const { sessionId, uuid } = req.body;
    const session = taskSessions[sessionId];
    
    if (session && session.userId === uuid && session.status === 'Đang làm') {
      const now = new Date().getTime();
      const createdAt = new Date(session.createdAt).getTime();
      const diffMinutes = (now - createdAt) / (1000 * 60);

      if (diffMinutes < 1) {
        return res.status(400).json({ error: 'Bạn hoàn thành nhiệm vụ quá nhanh. Vui lòng đợi ít nhất 1 phút.' });
      }

      if (diffMinutes > 15) {
        session.status = 'Hết hạn';
        return res.status(400).json({ error: 'Phiên làm việc đã hết hạn (tối đa 15 phút).' });
      }

      session.status = 'Hoàn thành';
      session.completedAt = new Date().toISOString();
      res.json({ status: 'success' });
    } else {
      res.status(400).json({ error: 'Không thể hoàn thành phiên này (Không tìm thấy hoặc đã hết hạn).' });
    }
  });

  app.get("/api/tasks/history", (req, res) => {
    const { uuid } = req.query;
    const history = Object.entries(taskSessions)
      .filter(([_, s]) => s.userId === uuid)
      .map(([id, s]) => ({
        id,
        task_id: s.taskId,
        task_name: s.taskName,
        reward: s.reward,
        status: s.status === 'Hoàn thành' ? 'Hoàn thành' : (s.status === 'Hết hạn' ? 'Hết hạn' : (s.status === 'Đang làm' ? 'Đang chờ' : 'Từ chối')),
        timestamp: s.createdAt
      }));
    
    res.json({ history });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Đảm bảo các route /api KHÔNG bị rơi vào fallback SPA
    app.get('*', (req, res) => {
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
