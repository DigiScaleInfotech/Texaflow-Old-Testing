import { Router } from "express";
import { LocationController } from "../controllers/location.controller";

const router = Router();

// Register routes with controller methods
router.get("/states", (req, res) => LocationController.getStates(req, res));
router.get("/districts/:state", (req, res) =>
  LocationController.getDistricts(req, res)
);
router.get("/subdistricts/:state/:district", (req, res) =>
  LocationController.getSubDistricts(req, res)
);
router.get("/villages/:state/:district/:subDistrictIndex", (req, res) =>
  LocationController.getVillages(req, res)
);

export default router;
