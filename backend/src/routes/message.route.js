import express from "express";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  deleteMessageById,
  editMessageById,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.delete("/delete/:id", protectRoute, deleteMessageById);
router.patch("/edit/:id", protectRoute, editMessageById);

export default router;
