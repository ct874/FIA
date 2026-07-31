import { AuthProvider } from './context/AuthProvider'
import { TeacherAuthProvider } from './context/TeacherAuthProvider'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <AuthProvider>
      <TeacherAuthProvider>
        <AppRoutes />
      </TeacherAuthProvider>
    </AuthProvider>
  )
}

export default App
