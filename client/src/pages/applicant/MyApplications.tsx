import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Building2,
  DollarSign,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

// Update the Application interface to include notes
interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDate: string;
  lastUpdated: string;
  resumeName?: string;
  coverLetter?: string;
  publicNotes?: string[];
}

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/applications/my-applications');
      
      if (!response?.data?.data?.applications) {
        setApplications([]);
        setLoading(false);
        return;
      }
      
      const mappedApplications = response.data.data.applications.map((app: any) => ({
        id: app._id || '',
        jobId: app.jobId?._id || '',
        jobTitle: app.jobId?.title || 'Unknown Position',
        company: app.jobId?.company || 'Unknown Company',
        location: app.jobId?.location || 'Remote',
        salary: app.jobId?.salary || 'Salary not specified',
        type: app.jobId?.type || 'Full-time',
        status: app.status || 'pending',
        appliedDate: app.appliedDate || new Date().toISOString(),
        lastUpdated: app.lastUpdated || app.appliedDate || new Date().toISOString(),
        resumeName: app.resumeId?.name,
        coverLetter: app.coverLetter,
        publicNotes: app.publicNotes // Map publicNotes from the response
      }));
      
      setApplications(mappedApplications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load your applications. Please try again.');
      setLoading(false);
      setApplications([]);
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }
    
    try {
      await api.patch(`/applications/${applicationId}/withdraw`);
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: 'withdrawn' } : app
      ));
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application');
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
      case 'withdrawn':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'reviewing':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'offer':
        return <FileText className="h-5 w-5 text-orange-500" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'withdrawn':
        return <X className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    } else if (sortBy === 'company') {
      return a.company.localeCompare(b.company);
    }
    return 0;
  });

  // Calculate status counts for the dashboard
  const statusCounts = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    reviewing: applications.filter(app => app.status === 'reviewing').length,
    interview: applications.filter(app => app.status === 'interview').length,
    offer: applications.filter(app => app.status === 'offer').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Applications</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchApplications()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
              <p className="text-muted-foreground mt-1">
                Track your job applications and their status
              </p>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button asChild>
                <Link to="/applicant/jobs">
                  <Search className="h-4 w-4 mr-2" />
                  Browse More Jobs
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{statusCounts.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{statusCounts.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{statusCounts.reviewing}</p>
                  <p className="text-xs text-muted-foreground">Reviewing</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{statusCounts.interview}</p>
                  <p className="text-xs text-muted-foreground">Interview</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{statusCounts.offer}</p>
                  <p className="text-xs text-muted-foreground">Offer</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{statusCounts.accepted}</p>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by job title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offer">Offer</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div></div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="text-muted-foreground mt-4">
            {sortedApplications.length} application{sortedApplications.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Applications List */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {sortedApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-foreground">
                            {application.jobTitle}
                          </h3>
                          <Badge 
                            variant="outline"
                            className={getStatusColor(application.status)}
                          >
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground">{application.company}</p>
                      </div>
                      {getStatusIcon(application.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">{application.location}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Job Type</p>
                        <p className="text-sm text-muted-foreground">{application.type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Salary</p>
                        <p className="text-sm text-muted-foreground">{application.salary}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Applied {new Date(application.appliedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Updated {new Date(application.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {application.resumeName && (
                      <div className="mt-3 p-2 bg-muted/50 rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">Resume: {application.resumeName}</span>
                        </div>
                      </div>
                    )}
                    
                    {application.coverLetter && (
                      <div className="mt-3 p-3 bg-muted/30 rounded border">
                        <p className="text-sm font-medium mb-1">Your Message:</p>
                        <p className="text-sm text-muted-foreground">{application.coverLetter}</p>
                      </div>
                    )}

                    {application.publicNotes && application.publicNotes.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                        <p className="text-sm font-medium mb-1">Recruiter Feedback:</p>
                        {application.publicNotes.map((note, index) => (
                          <div key={index} className="mb-2 last:mb-0">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:min-w-[120px]">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/applicant/jobs/${application.jobId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Job
                      </Link>
                    </Button>
                    {['pending', 'reviewing'].includes(application.status) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => withdrawApplication(application.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedApplications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0 
                    ? "You haven't applied to any jobs yet. Start your job search now!"
                    : "Try adjusting your search criteria or filters"}
                </p>
                <Button asChild>
                  <Link to="/applicant/jobs">
                    Browse Jobs
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}