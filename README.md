# Chatty

Chatty is a MERN (MongoDB, Express, React, Node.js) based real-time chat application. It allows users to communicate seamlessly with features like user authentication, real-time messaging, and more.

## Features

- User authentication (Sign up, Login, Logout)
- Real-time messaging using WebSockets
- Responsive design for all devices
- User profile management
- Theme customization with up to 32 different color options available in settings

## Tech Stack

- **Frontend**: React,Javascript, Tailwind CSS, DaisyUI, Zustand, react-media-recorder 
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO

## Future Improvements

Here are some features planned for future implementation:

- Implement a video calling feature for enhanced communication.✅
    - done but need improvement in :
        - when a user send the joining link to oppsite user , then autmotically the joing invitation link send twice.
        - The Call room layout for mobile is not setup correctly.
        -  In chatContainer ther should be one tap runing while a user inside video call room ,so that if user by change leave the pageb without ending the call , then user should able to join the with continue botton and if the user want to cencl the call the should clicl on end button inside chatContainer 
- Integrate AI suggestions using Google API for smarter interactions.
    - Language translation & localization
    - Smart suggestions & auto‑completion
    - Taling with Vapi
- Add a payment gateway to enable premium AI suggestion features.
- Add a "Forgot Password" recovery link for user accounts. ✅
- Display the last message from a user at the top of the sidebar for better conversation tracking.
- Introduce a message delete and edit option after sending, similar to WhatsApp.✅
- Enable voice message sending functionality, inspired by WhatsApp.✅

