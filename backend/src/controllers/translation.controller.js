import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/user.model.js";
import Message from "../models/message.model.js"; // Added Message model

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const translateMessage = async (req, res) => {
  try {
    const { text, targetLanguage, messageId } = req.body; // Added messageId
    const userId = req.user._id;

    if (!text || !targetLanguage) {
      return res.status(400).json({ message: "Text and target language are required" });
    }

    // If messageId is provided, check if translation already exists in database
    if (messageId) {
      const message = await Message.findById(messageId);
      if (message && message.translations.has(targetLanguage)) {
        // Return cached translation without consuming API quota
        return res.status(200).json({
          originalText: text,
          translatedText: message.translations.get(targetLanguage),
          targetLanguage,
          cached: true, // Indicate this was from cache
          remainingTranslations: await getRemainingTranslations(userId)
        });
      }
    }

    // Check user's daily translation limit
    const user = await User.findById(userId);
    const today = new Date().toDateString();
    
    // Reset count if it's a new day
    if (user.lastTranslationDate !== today) {
      user.dailyTranslationCount = 0;
      user.lastTranslationDate = today;
    }

    // Check if user has exceeded daily limit (15 translations per day)
    if (user.dailyTranslationCount >= 15) {
      return res.status(429).json({ 
        message: "Daily translation limit exceeded. You can translate up to 15 messages per day.",
        limitExceeded: true 
      });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    // Create translation prompt
    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text, nothing else: "${text}"`;

    // Generate translation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    // Increment user's daily translation count (only for new translations)
    user.dailyTranslationCount += 1;
    await user.save();

    // Store translation in database if messageId is provided
    if (messageId) {
      const message = await Message.findById(messageId);
      if (message) {
        message.translations.set(targetLanguage, translatedText);
        await message.save();
      }
    }

    res.status(200).json({
      originalText: text,
      translatedText,
      targetLanguage,
      cached: false, // Indicate this was a new translation
      remainingTranslations: 15 - user.dailyTranslationCount
    });

  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ message: "Translation failed. Please try again." });
  }
};

// Helper function to get remaining translations
const getRemainingTranslations = async (userId) => {
  const user = await User.findById(userId);
  const today = new Date().toDateString();
  
  if (user.lastTranslationDate !== today) {
    return 15; // Full quota for new day
  }
  
  return 15 - user.dailyTranslationCount;
};

export const getUserTranslationStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const today = new Date().toDateString();
    
    // Reset count if it's a new day
    if (user.lastTranslationDate !== today) {
      user.dailyTranslationCount = 0;
      user.lastTranslationDate = today;
      await user.save();
    }

    res.status(200).json({
      dailyTranslationCount: user.dailyTranslationCount,
      remainingTranslations: 15 - user.dailyTranslationCount,
      translationEnabled: user.translationEnabled || false,
      preferredLanguage: user.preferredLanguage || 'English'
    });

  } catch (error) {
    console.error("Error fetching translation stats:", error);
    res.status(500).json({ message: "Failed to fetch translation stats" });
  }
};

export const updateTranslationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { translationEnabled, preferredLanguage } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        translationEnabled: translationEnabled !== undefined ? translationEnabled : undefined,
        preferredLanguage: preferredLanguage || undefined
      },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: "Translation settings updated successfully",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error updating translation settings:", error);
    res.status(500).json({ message: "Failed to update translation settings" });
  }
};

// New endpoint to get cached translations for multiple messages
export const getCachedTranslations = async (req, res) => {
  try {
    const { messageIds, targetLanguage } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || !targetLanguage) {
      return res.status(400).json({ message: "Message IDs array and target language are required" });
    }

    const messages = await Message.find({ _id: { $in: messageIds } });
    const cachedTranslations = {};

    messages.forEach(message => {
      if (message.translations.has(targetLanguage)) {
        cachedTranslations[message._id] = message.translations.get(targetLanguage);
      }
    });

    res.status(200).json({ cachedTranslations });

  } catch (error) {
    console.error("Error getting cached translations:", error);
    res.status(500).json({ message: "Failed to get cached translations" });
  }
};