import express from "express";
import { 
  translateMessage, 
  getUserTranslationStats, 
  updateTranslationSettings,
  getCachedTranslations // Added new endpoint
} from "../controllers/translation.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/translate", protectRoute, translateMessage);
router.get("/stats", protectRoute, getUserTranslationStats);
router.put("/settings", protectRoute, updateTranslationSettings);
router.post("/cached", protectRoute, getCachedTranslations); // New endpoint for batch cached translations

export default router;