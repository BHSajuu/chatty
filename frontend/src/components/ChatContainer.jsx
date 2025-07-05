import { useEffect, useRef, useState } from "react";
import { formatMessageTime } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useTranslationStore } from "../store/useTranslationStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { Check, Pencil, Trash2, X, Languages } from "lucide-react";
import CustomAudioPlayer from "./CustomAudioPlayer";
import Linkify from "react-linkify";
import ConfirmationModal from "./ConfirmationModal";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editMessageText,
    conversationOpenedAt, // Track when conversation was opened
    isNewMessage, // Helper to check if message is new
  } = useChatStore();
  const { authUser } = useAuthStore();
  
  // Translation store
  const { 
    translationEnabled, 
    preferredLanguage, 
    translateMessage, 
    isTranslating,
    getCachedTranslations,
    translationCache
  } = useTranslationStore();
  
  const messageEndRef = useRef(null);

  const [hover, setHover] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentLink, setCurrentLink] = useState("");
  
  // Translation state for each message
  const [translatedMessages, setTranslatedMessages] = useState({});
  const [translatingMessageId, setTranslatingMessageId] = useState(null);
  
  // Track which messages have been processed for translation
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [
    selectedUser._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load cached translations for existing messages when conversation opens
  useEffect(() => {
    if (translationEnabled && messages.length > 0 && preferredLanguage !== "English") {
      loadCachedTranslationsForExistingMessages();
    }
  }, [messages.length, translationEnabled, preferredLanguage, selectedUser._id]);

  // Auto-translate only NEW incoming messages (messages that arrive after conversation was opened)
  useEffect(() => {
    if (!translationEnabled || preferredLanguage === "English") return;

    // Process only messages that:
    // 1. Are from other users (not current user)
    // 2. Have text content
    // 3. Are NEW (arrived after conversation was opened)
    // 4. Haven't been processed yet
    messages.forEach((message, index) => {
      const isFromOtherUser = message.senderId !== authUser._id;
      const hasText = message.text;
      const isNewMsg = isNewMessage(index);
      const notProcessedYet = !processedMessageIds.has(message._id);
      const notAlreadyTranslated = !translatedMessages[message._id];

      if (isFromOtherUser && hasText && isNewMsg && notProcessedYet && notAlreadyTranslated) {
        console.log(`🔄 Auto-translating NEW message: "${message.text}" (Message ID: ${message._id})`);
        handleTranslateMessage(message._id, message.text, true); // true indicates auto-translation
        
        // Mark as processed to avoid re-processing
        setProcessedMessageIds(prev => new Set([...prev, message._id]));
      }
    });
  }, [messages, translationEnabled, preferredLanguage, authUser._id]);

  // Load cached translations from database for existing messages (not new ones)
  const loadCachedTranslationsForExistingMessages = async () => {
    const existingMessageIds = messages
      .filter((msg, index) => {
        // Only load cached translations for existing messages (not new ones)
        return msg.senderId !== authUser._id && 
               msg.text && 
               !isNewMessage(index); // Only existing messages, not new ones
      })
      .map(msg => msg._id);
    
    if (existingMessageIds.length === 0) return;

    console.log(`📥 Loading cached translations for ${existingMessageIds.length} existing messages`);

    try {
      const cachedTranslations = await getCachedTranslations(existingMessageIds, preferredLanguage);
      
      // Update local state with cached translations
      const newTranslatedMessages = { ...translatedMessages };
      Object.entries(cachedTranslations).forEach(([messageId, translation]) => {
        newTranslatedMessages[messageId] = translation;
        console.log(`✅ Loaded cached translation for message ${messageId}: "${translation}"`);
      });
      
      setTranslatedMessages(newTranslatedMessages);
    } catch (error) {
      console.error("Failed to load cached translations:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
      // Remove from translated messages state
      const newTranslatedMessages = { ...translatedMessages };
      delete newTranslatedMessages[messageId];
      setTranslatedMessages(newTranslatedMessages);
      
      // Remove from processed messages
      setProcessedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleEditMessage = async (messageId, text) => {
    try {
      await editMessageText(messageId, text);
      setEditingMessageId(null);
      setEditedText("");
      
      // Clear translation for edited message since content changed
      const newTranslatedMessages = { ...translatedMessages };
      delete newTranslatedMessages[messageId];
      setTranslatedMessages(newTranslatedMessages);
      
      // Remove from processed messages so it can be re-translated if needed
      setProcessedMessageIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  // Handle manual or automatic translation of a specific message
  const handleTranslateMessage = async (messageId, text, isAutoTranslation = false) => {
    if (!text || translatedMessages[messageId]) return;
    
    // Check cache first
    const cacheKey = `${messageId}-${preferredLanguage}`;
    if (translationCache.has(cacheKey)) {
      setTranslatedMessages(prev => ({
        ...prev,
        [messageId]: translationCache.get(cacheKey)
      }));
      console.log(`💾 Using cached translation for message ${messageId}`);
      return;
    }
    
    setTranslatingMessageId(messageId);
    
    if (isAutoTranslation) {
      console.log(`🤖 Auto-translating message: "${text}" to ${preferredLanguage}`);
    } else {
      console.log(`👆 Manual translation requested for: "${text}" to ${preferredLanguage}`);
    }
    
    const translatedText = await translateMessage(text, preferredLanguage, messageId);
    
    if (translatedText) {
      setTranslatedMessages(prev => ({
        ...prev,
        [messageId]: translatedText
      }));
      console.log(`✅ Translation completed: "${text}" → "${translatedText}"`);
    }
    
    setTranslatingMessageId(null);
  };

  const openJoinModal = (link) => {
    setCurrentLink(link);
    setModalOpen(true);
  };

  const handleJoin = () => {
    window.open(currentLink, "_blank");
    setModalOpen(false);
  };

  // Reset processed messages when switching conversations
  useEffect(() => {
    setProcessedMessageIds(new Set());
    setTranslatedMessages({});
  }, [selectedUser._id]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto md:my-0">
      <ChatHeader />
      <div className="flex-1 overflow-y-scroll pt-8 pb-20 md:mb-0 px-4 md:p-4 space-y-4 md:relative">
        {messages.map((message, idx) => (
          <div
            key={`${message._id}-${idx}`}
            onMouseEnter={() => setHover(message._id)}
            onMouseLeave={() => setHover(false)}
            className={`relative chat hover:cursor-pointer ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            {hover === message._id && (
              <div
                className={`absolute ${
                  message.senderId === authUser._id
                    ? "right-0 top-1"
                    : "left-0"
                } flex items-center`}
              >
                <div className="flex gap-2">
                  {/* Translation button - only show for messages from other users and if translation is enabled */}
                  {message.senderId !== authUser._id && translationEnabled && message.text && (
                    <Languages
                      className={`w-5 h-5 cursor-pointer hover:scale-110 transition-transform ${
                        translatedMessages[message._id] ? 'text-green-500' : 'text-blue-500'
                      } ${translatingMessageId === message._id ? 'animate-spin' : ''}`}
                      onClick={() => handleTranslateMessage(message._id, message.text, false)} // Manual translation
                      title={translatedMessages[message._id] ? 'Translated' : 'Translate message'}
                    />
                  )}
                  
                  {message.senderId === authUser._id && (
                    <Pencil
                      className="w-5 h-5 text-blue-500 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => {
                        setEditingMessageId(message._id);
                        setEditedText(message.text);
                      }}
                    />
                  )}
                  <Trash2
                    className="w-5 h-5 text-red-500 cursor-pointer hover:scale-110 transition-transform"
                    onClick={() => handleDeleteMessage(message._id)}
                  />
                </div>
              </div>
            )}

            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              {/* Debug indicator for new messages */}
              {isNewMessage(idx) && (
                <span className="text-xs bg-green-500 text-white px-1 rounded ml-2">NEW</span>
              )}
            </div>

            <div className="chat-bubble w-[220px] lg:w-auto flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="lg:w-auto sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.audio && (
                <div className="mt-2 mr-3 w-full max-w-[300px]">
                  <CustomAudioPlayer src={message.audio} />
                </div>
              )}

              {editingMessageId === message._id ? (
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="input input-bordered rounded-lg px-2 py-1 w-full"
                  />
                  <div className="flex gap-12">
                    <Check
                      onClick={() =>
                        handleEditMessage(message._id, editedText)
                      }
                      className="text-blue-500 hover:scale-120 transform-transition ease-in-out"
                    />
                    <X
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditedText("");
                      }}
                      className="text-red-500 hover:scale-120 transform-transition ease-in-out"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {/* Show translated text if available, otherwise show original */}
                  <Linkify
                    componentDecorator={(href, text, key) => {
                      const isCallLink = href.includes("/call/");
                      return isCallLink ? (
                        <button
                          key={key}
                          className="text-blue-500 hover:cursor-pointer btn-link p-0 m-0 bg-transparent"
                          onClick={(e) => {
                            e.preventDefault();
                            openJoinModal(href);
                          }}
                        >
                          click to join
                        </button>
                      ) : (
                        <a
                          key={key}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:cursor-pointer"
                        >
                          {text}
                        </a>
                      );
                    }}
                  >
                    <p>
                      {translatedMessages[message._id] || message.text}
                    </p>
                  </Linkify>
                  
                  {/* Show translation indicator */}
                  {translatedMessages[message._id] && (
                    <div className="text-xs opacity-60 mt-1 flex items-center gap-1">
                      <Languages className="w-3 h-3" />
                      <span>Translated to {preferredLanguage}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </div>

      <MessageInput />

      <ConfirmationModal
        isOpen={modalOpen}
        link={currentLink}
        onClose={() => setModalOpen(false)}
        onJoin={handleJoin}
      />
    </div>
  );
};

export default ChatContainer;