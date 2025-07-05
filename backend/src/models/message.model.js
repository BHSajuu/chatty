import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    audio: {
      type: String,
    },
    // Translation storage - stores multiple language versions of the same message
    translations: {
      type: Map,
      of: String,
      default: new Map()
    },
    // Original language of the message (detected or set by sender)
    originalLanguage: {
      type: String,
      default: "English"
    }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;