# TravelBuddy
TravelBuddy is a feature-rich travel companion web application designed to help users find matching travel partners, manage personalized travel plans, and chat in real time — all from a single platform.

It combines a responsive front-end interface with a robust real-time Node.js backend powered by MongoDB, ensuring a seamless travel planning and social experience.
---------------------------------------------------------------------------------------------------------------------Features
-> User Authentication — Secure user registration and login with JWT-based sessions
-> Create Travel Plans — Users can log trip details including destination, dates, and duration
-> View Travel History — Review and manage past travel plans, sorted by creation date
-> Travel Partner Matching — Match with potential travel partners based on overlapping destinations and schedules
-> Send & Manage Requests — Send, cancel, accept or reject travel companion requests
-> Profile Picture Uploads — Upload and persist profile images with upload/delete options
-> Live Chat — Real-time messaging between matched users using Socket.IO
-> Chat History — MongoDB-stored messages with timestamps and per-user soft deletion
-> Live Notifications — Real-time updates on request status via Socket events
-> RESTful APIs — Well-structured endpoints for frontend/backend extensibility
-> MongoDB Integration — User, chat, request, and travel plan models fully integrated
---------------------------------------------------------------------------------------------------------------------
Tech Stack

Frontend
-> HTML5, CSS3, JavaScript 
-> Responsive UI with Flexbox and custom styles
-> Socket.IO client-side for live messaging

Backend
-> Node.js with Express.js
-> RESTful API design
-> JWT for authentication
-> bcrypt for secure password hashing
-> Socket.IO for real-time communication
-> Multer for image uploads

Database
-> MongoDB with Mongoose ORM
   Users
   Travel Plans
   Requests
   Messages
---------------------------------------------------------------------------------------------------------------------
Prerequisites
Make sure you have the following installed:

Node.js (v14+)

npm

MongoDB (Local instance or remote URI)
---------------------------------------------------------------------------------------------------------------------
Testing Workflow
1) Register via register.html.
2) Log in and update your profile in profile.html.
3) Plan your trip using choosepartner.html.
4) Match with a partner via partnerdetails.html.
5) Send a request and manage it in requests.html.
6) Start chatting using chat.html.
7) Go to history.html to review previously accepted trips and travel interactions.
8) Logout via logout.html.
