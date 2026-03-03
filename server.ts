import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("disaster.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    lat REAL,
    lng REAL,
    area TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS volunteers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    area TEXT NOT NULL,
    status TEXT DEFAULT 'idle',
    last_lat REAL,
    last_lng REAL
  );

  CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER,
    volunteer_id INTEGER,
    status TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(report_id) REFERENCES reports(id),
    FOREIGN KEY(volunteer_id) REFERENCES volunteers(id)
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/reports", (req, res) => {
    const { type, severity, lat, lng, area, description } = req.body;
    const stmt = db.prepare("INSERT INTO reports (type, severity, lat, lng, area, description) VALUES (?, ?, ?, ?, ?, ?)");
    const result = stmt.run(type, severity || 'medium', lat, lng, area, description);
    const reportId = result.lastInsertRowid;
    
    const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId);
    
    // Notify volunteers in the same area
    io.emit("new_report", report);
    
    res.json(report);
  });

  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
    res.json(reports);
  });

  app.put("/api/reports/:id", (req, res) => {
    const { id } = req.params;
    const { type, severity, area, description, status } = req.body;
    const stmt = db.prepare("UPDATE reports SET type = ?, severity = ?, area = ?, description = ?, status = ? WHERE id = ?");
    stmt.run(type, severity, area, description, status, id);
    
    const updatedReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(id);
    io.emit("report_updated", updatedReport);
    res.json(updatedReport);
  });

  app.delete("/api/reports/:id", (req, res) => {
    const { id } = req.params;
    const reportId = parseInt(id);
    
    if (isNaN(reportId)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    try {
      db.prepare("DELETE FROM actions WHERE report_id = ?").run(reportId);
      db.prepare("DELETE FROM reports WHERE id = ?").run(reportId);
      
      io.emit("report_deleted", reportId);
      
      // Update stats
      const stats = {
        totalReports: (db.prepare("SELECT COUNT(*) as count FROM reports").get() as any).count,
        activeVolunteers: (db.prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'idle'").get() as any).count,
        completedTasks: (db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'completed'").get() as any).count
      };
      io.emit("stats_updated", stats);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  app.post("/api/volunteers/register", (req, res) => {
    const { name, phone, area } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO volunteers (name, phone, area) VALUES (?, ?, ?)");
      const result = stmt.run(name, phone, area);
      const volunteer = db.prepare("SELECT * FROM volunteers WHERE id = ?").get(result.lastInsertRowid);
      res.json(volunteer);
    } catch (e) {
      res.status(400).json({ error: "Phone number already registered" });
    }
  });

  app.post("/api/volunteers/login", (req, res) => {
    const { phone } = req.body;
    const volunteer = db.prepare("SELECT * FROM volunteers WHERE phone = ?").get(phone);
    if (volunteer) {
      res.json(volunteer);
    } else {
      res.status(404).json({ error: "Volunteer not found" });
    }
  });

  app.post("/api/actions", (req, res) => {
    const { report_id, volunteer_id, status } = req.body;
    const stmt = db.prepare("INSERT INTO actions (report_id, volunteer_id, status) VALUES (?, ?, ?)");
    stmt.run(report_id, volunteer_id, status);
    
    // Update report status
    if (status === 'accepted' || status === 'helping') {
      db.prepare("UPDATE reports SET status = 'active' WHERE id = ?").run(report_id);
      db.prepare("UPDATE volunteers SET status = 'busy' WHERE id = ?").run(volunteer_id);
      
      const updatedReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(report_id);
      io.emit("report_updated", updatedReport);
    } else if (status === 'completed') {
      // Update the report status instead of deleting it
      db.prepare("UPDATE reports SET status = 'completed' WHERE id = ?").run(report_id);
      // Free the volunteer
      db.prepare("UPDATE volunteers SET status = 'idle' WHERE id = ?").run(volunteer_id);
      
      const updatedReport = db.prepare("SELECT * FROM reports WHERE id = ?").get(report_id);
      io.emit("report_updated", updatedReport);
    }
    
    // Also notify that stats might have changed
    const stats = {
      totalReports: (db.prepare("SELECT COUNT(*) as count FROM reports").get() as any).count,
      activeVolunteers: (db.prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'idle'").get() as any).count,
      completedTasks: (db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'completed'").get() as any).count
    };
    io.emit("stats_updated", stats);
    
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const totalReports = db.prepare("SELECT COUNT(*) as count FROM reports").get() as any;
    const activeVolunteers = db.prepare("SELECT COUNT(*) as count FROM volunteers WHERE status = 'idle'").get() as any;
    const completedTasks = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'completed'").get() as any;
    
    res.json({
      totalReports: totalReports.count,
      activeVolunteers: activeVolunteers.count,
      completedTasks: completedTasks.count
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
}

startServer();
