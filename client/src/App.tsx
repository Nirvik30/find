import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

// Import components
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

// Import dashboard components
import ApplicantDashboard from '@/pages/applicant/ApplicantDashboard';
import RecruiterDashboard from '@/pages/recruiter/RecruiterDashboard';

// Create simple page components for now
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-950 text-white">
    <h1 className="text-4xl font-bold mb-6">Welcome to JobFinder</h1>
    <p className="text-xl max-w-md text-center mb-8 text-gray-300">
      Find your dream job or the perfect candidate
    </p>
    <div className="flex gap-4">
      <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Login
      </a>
      <a href="/register" className="px-4 py-2 border border-blue-600 text-blue-400 rounded-md hover:bg-blue-600 hover:text-white">
        Register
      </a>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="flex justify-center items-center min-h-screen p-4 bg-gray-950">
    <LoginForm />
  </div>
);

const RegisterPage = () => (
  <div className="flex justify-center items-center min-h-screen p-4 bg-gray-950">
    <RegisterForm />
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-950 text-white">
    <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
    <p className="text-lg mb-6 text-gray-300">You don't have permission to access this page</p>
    <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
      Back to Home
    </a>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          
          {/* Protected routes */}
          <Route
            path="/applicant/dashboard"
            element={
              <ProtectedRoute
                element={<ApplicantDashboard />}
                allowedRoles={['applicant']}
              />
            }
          />
          
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute
                element={<RecruiterDashboard />}
                allowedRoles={['recruiter']}
              />
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
