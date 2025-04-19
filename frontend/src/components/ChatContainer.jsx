import { useEffect, useRef, useState } from "react";
import { formatMessageTime } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [hover, setHover] = useState(false);


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

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }
 
 const handleDeleteMessage = async (messageId) =>{
    try {
       await deleteMessage(messageId);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
 }


const handleEditMeaage = async (messageId,text)=>{
  try {
    // toast("Edit message feature is not implemented yet.");
    await editMessageText(messageId,text);
  } catch (error) {
    console.error("Failed to edit message:", error);
    
  }
}

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className=" flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message) => (
          <div
            onMouseEnter={() => setHover(message._id)}
            onMouseLeave={()=>{setHover(false)}}
            key={message._id}
            className={`relative chat hover:cursor-pointer ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={messageEndRef}>
          
           {/* Delete Icon */}
          {hover === message._id && (
            <div
              className={`absolute ${
                message.senderId === authUser._id ? "right-0 top-1" : "left-0 "
              }  flex items-center`}
            > 
             <div className="flex gap-2">
             <Pencil className="w-5 h-5 text-blue-500 cursor-pointer hover:scale-110 transition-transform"
               onClick={()=> handleEditMeaage(message._id)}
             />
              <Trash2
                className="w-5 h-5 text-red-500 cursor-pointer hover:scale-110 transition-transform"
                onClick={() => handleDeleteMessage(message._id)}
              />
             </div>
            </div>
          )}



            <div className=" chat-image avatar">
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
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
