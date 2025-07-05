import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useTranslationStore = create((set, get) => ({
  // Translation settings
  translationEnabled: false,
  preferredLanguage: "English",
  dailyTranslationCount: 0,
  remainingTranslations: 15,
  isTranslating: false,

  // Cache for translations to avoid re-fetching
  translationCache: new Map(),

  // Available languages for translation
  availableLanguages: [
    "English", "Spanish", "French", "German", "Italian", "Portuguese", 
    "Russian", "Chinese", "Japanese", "Korean", "Arabic", "Hindi", 
    "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Urdu"
  ],

  // Fetch user's translation stats and settings
  getTranslationStats: async () => {
    try {
      const res = await axiosInstance.get("/translation/stats");
      set({
        dailyTranslationCount: res.data.dailyTranslationCount,
        remainingTranslations: res.data.remainingTranslations,
        translationEnabled: res.data.translationEnabled,
        preferredLanguage: res.data.preferredLanguage
      });
    } catch (error) {
      console.error("Failed to fetch translation stats:", error);
    }
  },

  // Update translation settings
  updateTranslationSettings: async (settings) => {
    try {
      const res = await axiosInstance.put("/translation/settings", settings);
      set({
        translationEnabled: settings.translationEnabled !== undefined ? settings.translationEnabled : get().translationEnabled,
        preferredLanguage: settings.preferredLanguage || get().preferredLanguage
      });
      
      // Clear cache when language preference changes
      if (settings.preferredLanguage) {
        set({ translationCache: new Map() });
      }
      
      toast.success("Translation settings updated successfully");
    } catch (error) {
      toast.error("Failed to update translation settings");
      console.error("Translation settings update error:", error);
    }
  },

  // Get cached translations for multiple messages (for existing messages only)
  getCachedTranslations: async (messageIds, targetLanguage) => {
    try {
      console.log(`🔍 Fetching cached translations for ${messageIds.length} messages in ${targetLanguage}`);
      
      const res = await axiosInstance.post("/translation/cached", {
        messageIds,
        targetLanguage
      });
      
      // Update local cache with fetched translations
      const { translationCache } = get();
      Object.entries(res.data.cachedTranslations).forEach(([messageId, translation]) => {
        translationCache.set(`${messageId}-${targetLanguage}`, translation);
      });
      
      set({ translationCache: new Map(translationCache) });
      
      console.log(`✅ Found ${Object.keys(res.data.cachedTranslations).length} cached translations`);
      return res.data.cachedTranslations;
    } catch (error) {
      console.error("Failed to get cached translations:", error);
      return {};
    }
  },

  // Translate a message with caching optimization
  translateMessage: async (text, targetLanguage, messageId = null) => {
    const { remainingTranslations, translationCache } = get();
    
    // Check local cache first
    const cacheKey = messageId ? `${messageId}-${targetLanguage}` : null;
    if (cacheKey && translationCache.has(cacheKey)) {
      console.log(`💾 Using local cache for message ${messageId}`);
      return translationCache.get(cacheKey);
    }
    
    // Check if user has remaining translations (only for new translations)
    if (remainingTranslations <= 0) {
      toast.error("Daily translation limit exceeded. You can translate up to 15 messages per day.");
      return null;
    }

    set({ isTranslating: true });
    
    try {
      console.log(`🌐 Calling Gemini API to translate: "${text}" to ${targetLanguage}`);
      
      const res = await axiosInstance.post("/translation/translate", {
        text,
        targetLanguage,
        messageId // Include messageId to check database cache and store translation
      });

      // Update remaining translations count only if it was a new translation (not cached)
      if (!res.data.cached) {
        set({
          dailyTranslationCount: get().dailyTranslationCount + 1,
          remainingTranslations: res.data.remainingTranslations
        });
        console.log(`📊 Translation quota used. Remaining: ${res.data.remainingTranslations}`);
      } else {
        console.log(`💾 Translation was cached in database, no quota consumed`);
      }

      // Store in local cache
      if (cacheKey) {
        const newCache = new Map(translationCache);
        newCache.set(cacheKey, res.data.translatedText);
        set({ translationCache: newCache });
      }

      return res.data.translatedText;
    } catch (error) {
      if (error.response?.data?.limitExceeded) {
        toast.error("Daily translation limit exceeded. You can translate up to 15 messages per day.");
      } else {
        toast.error("Translation failed. Please try again.");
      }
      console.error("Translation error:", error);
      return null;
    } finally {
      set({ isTranslating: false });
    }
  },

  // Toggle translation feature
  toggleTranslation: async () => {
    const newState = !get().translationEnabled;
    await get().updateTranslationSettings({ translationEnabled: newState });
  },

  // Set preferred language
  setPreferredLanguage: async (language) => {
    await get().updateTranslationSettings({ preferredLanguage: language });
  },

  // Clear translation cache (useful when switching languages)
  clearTranslationCache: () => {
    set({ translationCache: new Map() });
  }
}));