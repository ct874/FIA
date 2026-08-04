import { LanguageProvider } from './context/LanguageProvider'
import { AuthProvider } from './context/AuthProvider'
import { TeacherAuthProvider } from './context/TeacherAuthProvider'
import { ToastProvider } from './context/ToastProvider'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <TeacherAuthProvider>
            <AppRoutes />
          </TeacherAuthProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}

export default App
