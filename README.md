# Chatty

Chatty is a MERN (MongoDB, Express, React, Node.js) based real-time chat application. It allows users to communicate seamlessly with features like user authentication, real-time messaging, and more.

## Features

- User authentication (Sign up, Login, Logout)
- Real-time messaging using WebSockets
- Responsive design for all devices
- User profile management
- Theme customization with up to 32 different color options available in settings

## Tech Stack

- **Frontend**: React,Javascript, Tailwind CSS, DaisyUI, Zustand
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO

## Future Improvements

Here are some features planned for future implementation:

- Implement a video calling feature for enhanced communication.
- Integrate AI suggestions using Google API for smarter interactions.
- Add a payment gateway to enable premium AI suggestion features.
- Add a "Forgot Password" recovery link for user accounts. ✅
- Display the last message from a user at the top of the sidebar for better conversation tracking.
- Introduce a message delete and edit option after sending, similar to WhatsApp.✅
- Enable voice message sending functionality, inspired by WhatsApp.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/BHSajuu/chatty.git
   cd chatty
   ```

2. Install dependencies for both client and server:

   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   ```

3. Create a `.env` file in the `server` directory and add the following:

   ```
       MONGODB_URL=
       PORT=
       JWT_SECRET=
       CLOUDINARY_CLOUD_NAME=
       CLOUDINARY_API_KEY=
       CLOUDINARY_API_SECRET=
       NODE_ENV=
   ```

4. Start the development servers:

   ```bash
   # In one terminal
   cd frontend
   npm run dev

   # In another terminal
   cd backend
   npm run dev
   ```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.
