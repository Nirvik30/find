import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  BookmarkIcon,
  FileTextIcon,
  BriefcaseIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  BellRing,
  MessageCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  savedJobs: number;
  profileCompletion: number;
}

interface RecentApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDate: string;
  lastUpdated: string;
}

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  matchScore: number;
}

export default function ApplicantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
    savedJobs: 0,
    profileCompletion: 45
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch applications
      const applicationsResponse = await api.get('/applications/my-applications');
      const applications = applicationsResponse.data.data.applications;
      
      // Fetch saved jobs (you'll need to implement this endpoint)
      // const savedJobsResponse = await api.get('/users/saved-jobs');
      // const savedJobs = savedJobsResponse.data.data.savedJobs;
      
      // Calculate stats from real data
      const stats: DashboardStats = {
        totalApplications: applications.length,
        pendingApplications: applications.filter((app: any) => app.status === 'pending').length,
        acceptedApplications: applications.filter((app: any) => 
          ['accepted', 'interview', 'offer'].includes(app.status)
        ).length,
        rejectedApplications: applications.filter((app: any) => app.status === 'rejected').length,
        savedJobs: 0, // TODO: Implement saved jobs endpoint
        profileCompletion: 65 // TODO: Calculate based on user profile completeness
      };
      
      setStats(stats);
      
      // Set recent applications (last 5)
      const recentApps = applications.slice(0, 5).map((app: any) => ({
        id: app._id,
        jobId: app.jobId._id,
        jobTitle: app.jobId.title,
        company: app.jobId.company,
        status: app.status,
        appliedDate: app.appliedDate,
        lastUpdated: app.lastUpdated
      }));
      
      setRecentApplications(recentApps);
      
      // Fetch recommended jobs
      const jobsResponse = await api.get('/jobs?limit=3');
      const jobs = jobsResponse.data.data.jobs;
      
      const recommended = jobs.map((job: any) => ({
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary || 'Competitive',
        type: job.type,
        matchScore: Math.floor(Math.random() * 30) + 70 // TODO: Implement actual matching
      }));
      
      setRecommendedJobs(recommended);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'reviewing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'interview':
      case 'offer':
      case 'accepted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'reviewing':
        return <AlertCircleIcon className="h-4 w-4" />;
      case 'interview':
      case 'offer':
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <BriefcaseIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Ready to find your next opportunity?
              </p>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button variant="outline" asChild>
                <Link to="/applicant/jobs">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Jobs
                </Link>
              </Button>
              <Button asChild>
                <Link to="/applicant/profile">
                  Complete Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Completion Alert */}
        {stats.profileCompletion < 80 && (
          <Card className="mb-8 border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircleIcon className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-500 mb-1">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    A complete profile increases your chances of getting hired by 3x
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <Progress 
                      value={stats.profileCompletion} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm text-muted-foreground">
                      {stats.profileCompletion}%
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    asChild
                  >
                    <Link to="/applicant/profile">
                      Complete Now
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalApplications}
                  </p>
                </div>
                <BriefcaseIcon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {stats.pendingApplications}
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Positive</p>
                  <p className="text-3xl font-bold text-green-500">
                    {stats.acceptedApplications}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saved Jobs</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.savedJobs}
                  </p>
                </div>
                <BookmarkIcon className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Recent Applications</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/applicant/applications">
                      View All
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.length > 0 ? (
                    recentApplications.map((application) => (
                      <Link
                        key={application.id}
                        to={`/applicant/applications?focus=${application.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <BriefcaseIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {application.jobTitle}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {application.company}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied on {new Date(application.appliedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(application.status)}
                          <Badge 
                            variant="outline"
                            className={getStatusColor(application.status)}
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <BriefcaseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No applications yet</p>
                      <Button asChild>
                        <Link to="/applicant/jobs">
                          Start Applying
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Jobs */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5" />
                  Recommended Jobs
                </CardTitle>
                <CardDescription>
                  Based on your profile and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedJobs.map((job) => (
                    <Link 
                      key={job.id}
                      to={`/applicant/jobs/${job.id}`}
                      className="block p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground text-sm">
                          {job.title}
                        </h4>
                        <Badge 
                          variant="outline"
                          className="bg-green-500/10 text-green-500 border-green-500/20 text-xs"
                        >
                          {job.matchScore}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{job.company}</p>
                      <p className="text-xs text-muted-foreground mb-2">{job.location}</p>
                      <p className="text-sm text-primary mb-3">{job.salary}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="w-full text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    </Link>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  asChild
                >
                  <Link to="/applicant/jobs">
                    View More Jobs
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <Link to="/applicant/jobs" className="flex items-center gap-3">
                  <Search className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Browse Jobs</h3>
                    <p className="text-sm text-muted-foreground">Find new opportunities</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <Link to="/applicant/resumes" className="flex items-center gap-3">
                  <FileTextIcon className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Update Resume</h3>
                    <p className="text-sm text-muted-foreground">Keep your resume current</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <Link to="/applicant/saved-jobs" className="flex items-center gap-3">
                  <BookmarkIcon className="h-6 w-6 text-purple-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">Saved Jobs</h3>
                    <p className="text-sm text-muted-foreground">Review bookmarked positions</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <Link to="/applicant/messages" className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-foreground">Messages</h3>
                    <p className="text-sm text-muted-foreground">Chat with recruiters</p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notifications */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <Link to="/applicant/notifications" className="flex items-center gap-3">
              <BellRing className="h-6 w-6 text-blue-500" />
              <div>
                <h3 className="font-semibold text-foreground">Job Alerts</h3>
                <p className="text-sm text-muted-foreground">Get notified about new opportunities</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}