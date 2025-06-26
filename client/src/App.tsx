import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Import components
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// Import dashboard components
import ApplicantDashboard from '@/pages/applicant/ApplicantDashboard';
import JobBrowse from '@/pages/applicant/JobBrowse';
import RecruiterDashboard from '@/pages/recruiter/RecruiterDashboard';
import ProfileManagement from '@/pages/applicant/ProfileManagement';
import MyApplications from '@/pages/applicant/MyApplications';

// Create simple page components with theme toggle
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
    <div className="absolute top-4 right-4">
      <ThemeToggle />
    </div>
    <h1 className="text-4xl font-bold mb-6">Welcome to JobFinder</h1>
    <p className="text-xl max-w-md text-center mb-8 text-muted-foreground">
      Find your dream job or the perfect candidate
    </p>
    <div className="flex gap-4">
      <a href="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
        Login
      </a>
      <a href="/register" className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-primary-foreground">
        Register
      </a>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="flex justify-center items-center min-h-screen p-4 bg-background">
    <div className="absolute top-4 right-4">
      <ThemeToggle />
    </div>
    <LoginForm />
  </div>
);

const RegisterPage = () => (
  <div className="flex justify-center items-center min-h-screen p-4 bg-background">
    <div className="absolute top-4 right-4">
      <ThemeToggle />
    </div>
    <RegisterForm />
  </div>
);

const UnauthorizedPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
    <div className="absolute top-4 right-4">
      <ThemeToggle />
    </div>
    <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
    <p className="text-lg mb-6 text-muted-foreground">You don't have permission to access this page</p>
    <a href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
      Back to Home
    </a>
  </div>
);

function App() {
  return (
    <ThemeProvider>
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
              path="/applicant/jobs"
              element={
                <ProtectedRoute
                  element={<JobBrowse />}
                  allowedRoles={['applicant']}
                />
              }
            />
            <Route
  path="/applicant/profile"
  element={
    <ProtectedRoute
      element={<ProfileManagement />}
      allowedRoles={['applicant']}
    />
  }
/>
<Route
  path="/applicant/applications"
  element={
    <ProtectedRoute
      element={<MyApplications />}
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
    </ThemeProvider>
  );
}

export default App;
