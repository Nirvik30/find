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
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  Calendar,
  LineChart,
  TrendingUp,
  MessageCircle,
  Bell,
  AlertCircle,
  FileText,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  interviewsScheduled: number;
  offersSent: number;
  filled: number;
}

interface RecentApplication {
  id: string;
  applicantName: string;
  applicantAvatar?: string;
  jobTitle: string;
  appliedDate: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected';
}

interface JobPostingStats {
  id: string;
  title: string;
  datePosted: string;
  applications: number;
  views: number;
  status: 'active' | 'draft' | 'closed' | 'filled';
  daysRemaining?: number;
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    interviewsScheduled: 0,
    offersSent: 0,
    filled: 0
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPostingStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch recruiter's jobs
      const jobsResponse = await api.get('/jobs/recruiter/dashboard');
      const jobs = jobsResponse.data.data.jobs;
      
      // Fetch all applications for recruiter's jobs
      const applicationsResponse = await api.get('/applications/candidates');
      const applications = applicationsResponse.data.data.candidates;
      
      // Calculate stats from real data
      const stats: DashboardStats = {
        activeJobs: jobs.filter((job: any) => job.status === 'active').length,
        totalApplications: applications.length,
        newApplications: applications.filter((app: any) => {
          const appliedDate = new Date(app.appliedDate);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          return appliedDate >= threeDaysAgo;
        }).length,
        interviewsScheduled: applications.filter((app: any) => app.status === 'interview').length,
        offersSent: applications.filter((app: any) => app.status === 'offer').length,
        filled: jobs.filter((job: any) => job.status === 'filled').length
      };
      
      setStats(stats);
      
      // Set recent applications (last 5)
      const recentApps = applications.slice(0, 5).map((app: any) => ({
        id: app.id,
        applicantName: app.name,
        applicantAvatar: app.avatar,
        jobTitle: app.jobTitle,
        appliedDate: app.appliedDate,
        status: app.status
      }));
      
      setRecentApplications(recentApps);
      
      // Set job postings stats
      const jobStats = jobs.slice(0, 5).map((job: any) => {
        const postedDate = new Date(job.postedDate);
        const now = new Date();
        const daysAgo = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: job._id,
          title: job.title,
          datePosted: job.postedDate,
          applications: job.applications || 0,
          views: job.views || 0,
          status: job.status,
          daysRemaining: job.status === 'active' && job.applicationDeadline ? 
            Math.max(0, Math.floor((new Date(job.applicationDeadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 
            undefined
        };
      });
      
      setJobPostings(jobStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewing':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer':
        return <FileText className="h-4 w-4 text-orange-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'reviewing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'interview':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'offer':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'accepted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };
  
  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'filled':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
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
              <h1 className="text-3xl font-bold text-foreground">Recruiter Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your job postings and candidates
              </p>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button asChild>
                <Link to="/recruiter/job-post/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Post New Job
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.activeJobs}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats.totalApplications}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {stats.newApplications}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Interviews</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {stats.interviewsScheduled}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Offers</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {stats.offersSent}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Filled</p>
                  <p className="text-3xl font-bold text-green-500">
                    {stats.filled}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Applications
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/recruiter/applications">
                      View All
                    </Link>
                  </Button>
                </div>
                <CardDescription>
                  Latest candidates who applied
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.length > 0 ? (
                    recentApplications.map((application) => (
                      <Link 
                        key={application.id}
                        to={`/recruiter/applications?candidateId=${application.id}`}
                        className="block p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {application.applicantAvatar ? (
                              <img 
                                src={application.applicantAvatar} 
                                alt={application.applicantName}
                                className="w-10 h-10 rounded-full object-cover" 
                              />
                            ) : (
                              <Users className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-foreground text-sm">
                                {application.applicantName}
                              </h4>
                              <Badge 
                                variant="outline"
                                className={getStatusColor(application.status)}
                              >
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-primary mb-1">
                              {application.jobTitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied {new Date(application.appliedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No applications yet</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-4"
                  asChild
                >
                  <Link to="/recruiter/applications">
                    Manage All Applications
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Job Postings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Job Postings
                  </CardTitle>
                  <CardDescription>
                    Overview of your active job listings
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/recruiter/job-posts">
                    Manage All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobPostings.length > 0 ? (
                    jobPostings.map((job) => (
                      <div 
                        key={job.id}
                        className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-foreground">
                                {job.title}
                              </h4>
                              <Badge 
                                variant="outline"
                                className={getJobStatusColor(job.status)}
                              >
                                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {new Date(job.datePosted).toLocaleDateString()}</span>
                              </div>
                              {job.daysRemaining !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{job.daysRemaining} days remaining</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="text-center">
                              <p className="text-sm font-semibold text-foreground">{job.applications}</p>
                              <p className="text-xs text-muted-foreground">Applications</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-semibold text-foreground">{job.views}</p>
                              <p className="text-xs text-muted-foreground">Views</p>
                            </div>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/recruiter/job-posts/${job.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No job postings yet</p>
                      <Button asChild>
                        <Link to="/recruiter/job-post/new">
                          Create Your First Job Post
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto flex-col p-6 gap-2" asChild>
              <Link to="/recruiter/job-post/new">
                <PlusCircle className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Post New Job</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col p-6 gap-2" asChild>
              <Link to="/recruiter/applications">
                <Users className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">View Candidates</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col p-6 gap-2" asChild>
              <Link to="/recruiter/messages">
                <MessageCircle className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Messages</span>
              </Link>
            </Button>
            
            <Button variant="outline" className="h-auto flex-col p-6 gap-2" asChild>
              <Link to="/recruiter/analytics">
                <TrendingUp className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Analytics</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}