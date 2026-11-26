import { Router } from "express";
import { AttendanceController } from "../controllers/attendance.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Attendance routes
router.get("/", AttendanceController.getAttendance);
router.get("/stats", AttendanceController.getAttendanceStats);
router.get("/date/:date", AttendanceController.getAttendanceByDate);
router.post("/mark", AttendanceController.markAttendance);

export default router;
