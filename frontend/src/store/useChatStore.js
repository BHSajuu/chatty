import toast from "react-hot-toast";
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  
  // Track when conversation was opened for translation purposes
  conversationOpenedAt: null,
  lastMessageCountWhenOpened: 0,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ 
        messages: res.data,
        // Track when conversation was opened and how many messages existed
        conversationOpenedAt: new Date(),
        lastMessageCountWhenOpened: res.data.length
      });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => {
    set({ 
      selectedUser,
      // Reset conversation tracking when switching users
      conversationOpenedAt: null,
      lastMessageCountWhenOpened: 0
    });
  },

  deleteMessage: async (messageId) =>{
    try {
      const res = await axiosInstance.delete(`/messages/delete/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((message) => message._id !== messageId),
      }));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
      
    }
  },

  editMessageText: async (messageId, text)=>{
    try {
      const res = await axiosInstance.patch(`/messages/edit/${messageId}`, {text} );
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId ? { ...message, text:  res.data.editedmsg.text  } : message
        ),
      }));
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  clearChat: async (receiverId, senderId) => {
    try {
      const res = await axiosInstance.delete(`/messages/clear`, {
        headers: { 'Content-Type': 'application/json' },
        data: { senderId, receiverId }
      });
      set({
        messages: get().messages.filter(msg =>
          !(
            (msg.sender === senderId && msg.receiver === receiverId) ||
            (msg.sender === receiverId && msg.receiver === senderId)
          )
        )
      });
  
      toast.success(`Deleted ${res.data.deletedCount} messages`)
      await get().getMessages(receiverId)   
    } catch (error) {
      toast.error(error.response.data.error);
      
    }
  },

  // Helper function to check if a message is "new" (arrived after conversation was opened)
  isNewMessage: (messageIndex) => {
    const { lastMessageCountWhenOpened } = get();
    return messageIndex >= lastMessageCountWhenOpened;
  },

  // Helper function to get only new messages that need translation
  getNewMessagesForTranslation: () => {
    const { messages, lastMessageCountWhenOpened } = get();
    return messages.slice(lastMessageCountWhenOpened);
  }
}));