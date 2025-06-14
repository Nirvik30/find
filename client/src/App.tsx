import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';

// Import components
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

// Create simple page components for now
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <h1 className="text-4xl font-bold mb-6">Welcome to JobFinder</h1>
    <p className="text-xl max-w-md text-center mb-8">
      Find your dream job or the perfect candidate
    </p>
    <div className="flex gap-4">
      <a href="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
        Login
      </a>
      <a href="/register" className="px-4 py-2 border border-primary text-primary rounded-md">
        Register
      </a>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <LoginForm />
  </div>
);

const RegisterPage = () => (
  <div className="flex justify-center items-center min-h-screen p-4">
    <RegisterForm />
  </div>
);

const ApplicantDashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Applicant Dashboard</h1>
    <p>Welcome to your job seeker dashboard!</p>
  </div>
);

const RecruiterDashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Recruiter Dashboard</h1>
    <p>Welcome to your recruiter dashboard!</p>
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
    <p className="text-lg mb-6">You don't have permission to access this page</p>
    <a href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
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
