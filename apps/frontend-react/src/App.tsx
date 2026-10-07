import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute'
import { DashboardPage } from './pages/DashboardPage'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return <Routes><Route element={<PublicOnlyRoute />}><Route path="login" element={<Login />} /><Route path="register" element={<Register />} /></Route><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="dashboard" element={<DashboardPage />} /><Route path="tasks" element={<TasksPage />} /></Route></Route><Route path="/" element={<Navigate replace to="/dashboard" />} /><Route path="*" element={<Navigate replace to="/dashboard" />} /></Routes>
}
