import { MotionConfig } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { SmoothScrollProvider } from './context/SmoothScrollProvider'
import { ToastProvider } from './context/ToastProvider'
import { ChatPage } from './pages/Chat'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Tasks } from './pages/Tasks'

export default function App() {
  return (
    // reducedMotion="user" desactiva las animaciones de transformación de framer-motion cuando el sistema lo pide.
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Navigate replace to="/login" />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="chat" element={<ChatPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate replace to="/login" />} />
          </Routes>
        </ToastProvider>
      </SmoothScrollProvider>
    </MotionConfig>
  )
}
