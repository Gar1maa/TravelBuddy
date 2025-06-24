# 🌍 TravelBuddy

**TravelBuddy** is a feature-rich travel companion web application designed to help users find matching travel partners, manage personalized travel plans, and chat in real-time — all from a single platform.

It combines a responsive front-end interface with a real-time Node.js backend and MongoDB integration to provide a seamless travel planning and social experience.

---

## 🚀 Features

- **🔐 User Authentication** — Secure registration and login with JWT-based sessions
- **🧳 Create Travel Plans** — Add destination, dates, and duration
- **📜 Travel History** — View past travel plans sorted by creation date
- **🤝 Partner Matching** — Match with users based on overlapping travel details
- **📤 Manage Requests** — Send, cancel, accept, and reject travel requests
- **🖼️ Profile Uploads** — Upload/delete profile images (Multer-based)
- **💬 Live Chat** — Real-time messaging via Socket.IO
- **🕒 Chat History** — MongoDB-stored messages with timestamps & soft deletion
- **🔔 Live Notifications** — Real-time updates for request events
- **🧩 RESTful APIs** — Modular, scalable backend endpoints
- **🗄️ MongoDB Integration** — Mongoose models for Users, Chats, Requests & Plans

---

## 🛠️ Tech Stack

### 🌐 Frontend
- HTML5, CSS3, JavaScript
- Responsive UI using Flexbox
- Socket.IO (Client)

### 🧠 Backend
- Node.js with Express.js
- RESTful API structure
- JWT for auth
- bcrypt for password hashing
- Multer for image uploads
- Socket.IO for real-time messaging

### 💾 Database
- MongoDB with Mongoose ORM  
  - `Users`  
  - `TravelPlans`  
  - `Requests`  
  - `Messages`

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (Local or Remote URI)

---

## 🧪 Testing Workflow

1. 🔐 **Register** via `register.html`
2. 👤 **Log in & update profile** via `profile.html`
3. 🗓️ **Plan your trip** via `choosepartner.html`
4. 🔍 **Find a match** via `partnerdetails.html`
5. 🤝 **Send & manage requests** via `requests.html`
6. 💬 **Chat live** via `chat.html`
7. 🕘 **View travel history** via `history.html`
8. 🚪 **Logout** via `logout.html`

---

## 📂 Project Structure

```bash
TravelBuddy/
├── public/
│   ├── css/
│   ├── js/
│   └── html/
├── routes/
│   ├── auth.js
│   ├── plans.js
│   ├── requests.js
│   └── chat.js
├── models/
│   ├── User.js
│   ├── TravelPlan.js
│   ├── Request.js
│   └── Message.js
├── controllers/
├── uploads/         # profile pictures
├── .env             # environment variables
├── server.js        # main backend entry point
└── README.md
Installation
git clone https://github.com/Gar1maa/TravelBuddy.git
cd TravelBuddy
npm install

Set Environment Variables
Create a .env file in the root and add:
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

Run the App
npm start

Contributing
Contributions are welcome! Feel free to fork this repo and open a pull request with enhancements or fixes.

 License
This project is open-source and free to use.

About
TravelBuddy was built to make travel more social, personalized, and enjoyable. From planning to chatting — it's all in one place.

 Connect
 Developer: Garima
 Project Link: 


