import { Navigate, Route, Routes } from 'react-router-dom'
import {
  HomeRedirect,
  ProtectedLayout,
  PublicOnlyLayout,
} from './components/RouteGuards.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import AddDevicePage from './pages/AddDevicePage.jsx'
import DeviceDetailPage from './pages/DeviceDetailPage.jsx'
import DevicesPage from './pages/DevicesPage.jsx'
import FuelPage from './pages/FuelPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicOnlyLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/devices/novo" element={<AddDevicePage />} />
          <Route path="/devices/:idDevice" element={<DeviceDetailPage />} />
          <Route
            path="/devices/:idDevice/combustivel"
            element={<FuelPage />}
          />
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
