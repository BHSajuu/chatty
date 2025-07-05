import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import User from "../models//user.model.js";
import Message from "../models/message.model.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id; // req mai user id mill rha hai q ki huma ne protectRoute middleware mai req.user ko set kiya hai
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, originalLanguage } = req.body; // Added originalLanguage
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      const resp = await cloudinary.uploader.upload(audio, { resource_type: "video" });
      audioUrl = resp.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      originalLanguage: originalLanguage || "English", // Store original language
      translations: new Map() // Initialize empty translations map
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByIdAndDelete(id);
    if (!msg) {
      return res.status(404).json({ message: "Message Not Found" });
    }
    res.status(200).json({ message: "Message Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });

  }
};

export const editMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    // When editing a message, clear all translations since the content changed
    const editedmsg = await Message.findByIdAndUpdate(
      id, 
      { 
        text,
        translations: new Map() // Clear translations when message is edited
      }, 
      { new: true }
    );

    res.status(200).json({ message: "Message Edited Successfully", editedmsg });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAllMessageById = async (req, res) => {
  try {
    const {receiverId, senderId} = req.body;
    const msg = await Message.deleteMany({
      $or:[
        {senderId: senderId, receiverId: receiverId},
        {senderId: receiverId, receiverId: senderId}
      ]
    });
    res.status(200).json({ deletedCount: msg.deletedCount });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    
  }
}

// New endpoint to store translation in database
export const storeMessageTranslation = async (req, res) => {
  try {
    const { messageId, language, translatedText } = req.body;
    
    if (!messageId || !language || !translatedText) {
      return res.status(400).json({ message: "Message ID, language, and translated text are required" });
    }

    // Find the message and update its translations
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Store the translation in the translations map
    message.translations.set(language, translatedText);
    await message.save();

    res.status(200).json({ 
      message: "Translation stored successfully",
      translatedText 
    });

  } catch (error) {
    console.error("Error storing translation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// New endpoint to get stored translation
export const getMessageTranslation = async (req, res) => {
  try {
    const { messageId, language } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    const translatedText = message.translations.get(language);
    
    if (translatedText) {
      res.status(200).json({ 
        translatedText,
        cached: true 
      });
    } else {
      res.status(404).json({ 
        message: "Translation not found for this language",
        cached: false 
      });
    }

  } catch (error) {
    console.error("Error getting translation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};