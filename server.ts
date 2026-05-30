import express from "express";
import path from "path";
import cors from "cors";
import axios from "axios";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      const response = await axios.get(url, { timeout: 10000 }); // Add timeout
      const data = response.data;
      res.json({ 
        success: true, 
        text: typeof data === 'string' ? data : JSON.stringify(data) 
      });
    } catch (error: any) {
      console.error("Proxy error:", error.message);
      res.status(500).json({ 
        success: false, 
        error: error.response?.data || error.message 
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
