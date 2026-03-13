import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUserSchema, insertScheduleSchema, insertAssessmentSchema } from "@shared/schema";
import session from "express-session";
import { seedDatabase } from "./seed";
import pgSession from "connect-pg-simple";

const PgStore = pgSession(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      store: new PgStore({ conString: process.env.DATABASE_URL, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "mengaji-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 },
    })
  );

  await seedDatabase();

  const requireAuth = (req: any, res: any, next: any) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  const requireRole = (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes((req.session as any).role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      if (!user || user.password !== data.password || user.role !== data.role) {
        return res.status(401).json({ message: "Username atau password salah" });
      }
      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/users", requireAuth, async (req, res) => {
    const role = req.query.role as string;
    if (role) {
      const u = await storage.getUsersByRole(role);
      res.json(u.map(({ password, ...rest }) => rest));
    } else {
      const students = await storage.getUsersByRole("mahasiswa");
      const instructors = await storage.getUsersByRole("instruktur");
      res.json([...students, ...instructors].map(({ password, ...rest }) => rest));
    }
  });

  app.post("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.get("/api/payments", requireAuth, async (req, res) => {
    const studentId = req.query.studentId as string;
    if (studentId) {
      res.json(await storage.getPaymentsByStudent(studentId));
    } else {
      res.json(await storage.getAllPayments());
    }
  });

  app.post("/api/payments", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/payments/:id", requireAuth, async (req, res) => {
    try {
      const payment = await storage.updatePayment(req.params.id, req.body);
      if (!payment) return res.status(404).json({ message: "Payment not found" });
      res.json(payment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/schedules", requireAuth, async (req, res) => {
    const studentId = req.query.studentId as string;
    const instructorId = req.query.instructorId as string;
    if (studentId) {
      res.json(await storage.getSchedulesByStudent(studentId));
    } else if (instructorId) {
      res.json(await storage.getSchedulesByInstructor(instructorId));
    } else {
      res.json(await storage.getAllSchedules());
    }
  });

  app.post("/api/schedules", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const schedule = await storage.createSchedule(req.body);
      res.json(schedule);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/schedules/:id", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const schedule = await storage.updateSchedule(req.params.id, req.body);
      if (!schedule) return res.status(404).json({ message: "Schedule not found" });
      res.json(schedule);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/schedules/:id", requireAuth, requireRole("admin"), async (req, res) => {
    await storage.deleteSchedule(req.params.id);
    res.json({ message: "Deleted" });
  });

  app.get("/api/assessments", requireAuth, async (req, res) => {
    const studentId = req.query.studentId as string;
    const instructorId = req.query.instructorId as string;
    if (studentId) {
      const a = await storage.getAssessmentByStudent(studentId);
      res.json(a ? [a] : []);
    } else if (instructorId) {
      res.json(await storage.getAssessmentsByInstructor(instructorId));
    } else {
      res.json(await storage.getAllAssessments());
    }
  });

  app.post("/api/assessments", requireAuth, requireRole("instruktur", "admin"), async (req, res) => {
    try {
      const assessment = await storage.createAssessment(req.body);
      res.json(assessment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/assessments/:id", requireAuth, requireRole("instruktur", "admin"), async (req, res) => {
    try {
      const assessment = await storage.updateAssessment(req.params.id, req.body);
      if (!assessment) return res.status(404).json({ message: "Assessment not found" });
      res.json(assessment);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/settings", requireAuth, requireRole("admin"), async (_req, res) => {
    const s = await storage.getSettings();
    res.json(s || {});
  });

  app.patch("/api/settings", requireAuth, requireRole("admin"), async (req, res) => {
    try {
      const s = await storage.updateSettings(req.body);
      res.json(s);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  return httpServer;
}
