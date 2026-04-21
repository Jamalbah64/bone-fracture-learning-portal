import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { NotificationProvider } from './context/notificationContext.jsx'
import './index.css'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </StrictMode>
);
