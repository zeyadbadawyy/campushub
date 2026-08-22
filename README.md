# 🎓 CampusHub Frontend

<p align="center">
  <img src="assets/logo.png" alt="CampusHub Logo" width="180">
</p>

<h1 align="center">CampusHub</h1>

<p align="center">
  A Modern Social Networking Platform Built For University Communities
</p>

<p align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=react-router)
![Axios](https://img.shields.io/badge/Axios-HTTP-5A29E4)
![WebSocket](https://img.shields.io/badge/WebSocket-Realtime-orange)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

</p>

<p align="center">
  <strong>React • Go • PostgreSQL • WebSockets • JWT Authentication</strong>
</p>

---

# 🚀 Overview

CampusHub is a full-stack social networking platform designed specifically for university students.

The application enables students to connect with each other, create and interact with posts, build their social network through follows and follow requests, exchange real-time messages, receive notifications, and maintain personalized profiles.

The frontend is built with React and Vite, communicating with a Go backend API and a PostgreSQL database while utilizing WebSockets to deliver a real-time user experience.

---

# 🌐 Live Demo

### Frontend

🔗 https://campushub-eta-wheat.vercel.app/

### Backend API

🔗 https://campushub-backend-1an6.onrender.com/

### Health Check

🔗 https://campushub-backend-1an6.onrender.com/health

---

# 🏗️ Architecture

```text id="y6sdm1"
User
 ↓
React Frontend (Vercel)
 ↓
REST API + WebSockets
 ↓
Go Backend (Render)
 ↓
PostgreSQL Database (Supabase)
```

---

# ✨ Features

## 🔐 Authentication

* User Registration
* User Login
* JWT Authentication
* Protected Routes
* Persistent Sessions
* Change Password

---

## 🏠 Feed System

* Create Posts
* Edit Posts
* Delete Posts
* View Feed
* Real-Time Post Updates

---

## ❤️ Social Interactions

* Like Posts
* Unlike Posts
* Comment System
* Real-Time Likes
* Real-Time Comments

---

## 👤 User Profiles

* Public User Profiles
* Profile Editing
* User Activity
* Faculty Information
* Bio Management

---

## 👥 Social Network

* Follow Users
* Unfollow Users
* Follow Requests
* Follow Request Approval
* Followers Statistics
* Following Statistics

---

## 💬 Messaging

* Direct Messaging
* Real-Time Conversations
* Read Receipts
* Typing Indicators
* Conversation Management

---

## 🔔 Notifications

* Real-Time Notifications
* Follow Notifications
* Like Notifications
* Comment Notifications
* Notification Counters
* Read Status Tracking

---

## 🌍 Presence System

* Online Status
* Offline Status
* Last Seen Tracking
* Live User Activity

---

## ⚙️ Settings

* User Preferences
* Account Settings
* Privacy Controls
* Password Management

---

# ⚡ Real-Time Features

CampusHub utilizes WebSockets to provide:

* Live Messaging
* Live Notifications
* Online User Tracking
* Typing Indicators
* Read Receipts
* Follow Request Updates
* Like Updates
* Comment Updates
* New Post Broadcasting

---

# 🛠️ Tech Stack

| Technology       | Purpose                 |
| ---------------- | ----------------------- |
| React            | Frontend Framework      |
| Vite             | Build Tool              |
| React Router DOM | Client Routing          |
| Axios            | API Communication       |
| Context API      | Global State Management |
| WebSocket API    | Real-Time Communication |
| React Icons      | UI Components           |
| Go               | Backend API             |
| PostgreSQL       | Database                |
| JWT              | Authentication          |
| Supabase         | Database Hosting        |
| Render           | Backend Hosting         |
| Vercel           | Frontend Hosting        |

---

# 📸 Application Preview

### 🔐 Authentication

![Login](assets/screenshots/login.png)

### 🏠 Feed

![Feed](assets/screenshots/feed.png)

### 👤 Profile

![Profile](assets/screenshots/profile.png)

### 💬 Messaging

![Messages](assets/screenshots/messages.png)

### 🔔 Notifications

![Notifications](assets/screenshots/notifications.png)

---

# ⚙️ Environment Variables

Create a `.env` file inside the frontend directory:

```env id="u1v3ec"
VITE_API_URL=http://localhost:8080
VITE_WS_URL=localhost:8080
```

Production Example:

```env id="j18lpi"
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=your-backend-url.com
```

---

# 🚀 Local Development

## Install Dependencies

```bash id="mwd5qk"
npm install
```

## Start Development Server

```bash id="uzw5ea"
npm run dev
```

Application runs at:

```text id="gr4sq6"
http://localhost:5173
```

---

# 🌍 Deployment

| Service  | Platform            |
| -------- | ------------------- |
| Frontend | Vercel              |
| Backend  | Render              |
| Database | Supabase PostgreSQL |

---

# 🎯 Learning Outcomes

This project demonstrates practical experience with:

* Modern React Development
* Component-Based Architecture
* Client-Side Routing
* REST API Integration
* JWT Authentication
* Real-Time WebSocket Communication
* Context API State Management
* PostgreSQL Integration
* Full-Stack Application Development
* Cloud Deployment Workflows
* Production Environment Configuration

---

# 🔮 Future Roadmap

### Planned Features

* Media Uploads
* User Avatars
* Stories System
* Group Messaging
* Dark Mode
* Push Notifications
* Mobile Application
* Advanced Search System

---

# 📈 Future Improvements

* Performance Optimization
* Progressive Web App (PWA)
* Offline Support
* Friend Recommendation Engine
* Enhanced Accessibility
* Advanced Analytics Dashboard

---

# 👨‍💻 Author

**Zeyad Badawy**

Full-Stack Developer | Software Engineer

### Links

🔗 GitHub: https://github.com/zeyadbadawyy

🔗 Repository: https://github.com/zeyadbadawyy/campushub

---

<p align="center">
  Built with ❤️ using React, Go, PostgreSQL, WebSockets, Supabase, Render, and Vercel.
</p>
