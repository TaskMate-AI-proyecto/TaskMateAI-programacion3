import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TasksPage } from './pages/TasksPage'

export default function App() {
  return <Routes><Route element={<AppShell />}><Route index element={<DashboardPage />} /><Route path="tasks" element={<TasksPage />} /></Route><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route path="*" element={<Navigate replace to="/" />} /></Routes>
}
