import { AuthProvider } from './context/AuthProvider'
import { TeacherAuthProvider } from './context/TeacherAuthProvider'
import { ToastProvider } from './context/ToastProvider'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <TeacherAuthProvider>
          <AppRoutes />
        </TeacherAuthProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
