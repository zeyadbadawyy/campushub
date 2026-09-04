import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/avatar.css'
import App from './App.jsx'

import {
  ThemeProvider
} from "./contexts/ThemeContext";

import {
  WebSocketProvider
} from "./contexts/WebSocketContext";

import {
  AuthProvider
} from "./contexts/AuthContext";


createRoot(document.getElementById('root')).render(

  <AuthProvider>

    <WebSocketProvider>

      <ThemeProvider>

        <App />

      </ThemeProvider>

    </WebSocketProvider>

  </AuthProvider>

)