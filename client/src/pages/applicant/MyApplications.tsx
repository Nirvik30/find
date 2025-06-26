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
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Filter,
  ArrowLeft,
  Eye,
  MessageCircle,
  Calendar,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'withdrawn';
  appliedDate: string;
  lastUpdated: string;
  notes?: string;
  interviewDate?: string;
  nextAction?: string;
  priority: 'high' | 'medium' | 'low';
}

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setApplications([
          {
            id: '1',
            jobId: 'job1',
            jobTitle: 'Senior Frontend Developer',
            company: 'TechCorp Innovation',
            location: 'San Francisco, CA',
            salary: '$120,000 - $160,000',
            type: 'Full-time',
            status: 'interview',
            appliedDate: '2024-01-15',
            lastUpdated: '2024-01-20',
            interviewDate: '2024-01-25',
            nextAction: 'Technical interview scheduled',
            priority: 'high'
          },
          {
            id: '2',
            jobId: 'job2',
            jobTitle: 'React Developer',
            company: 'StartupXYZ',
            location: 'Remote',
            salary: '$90,000 - $130,000',
            type: 'Full-time',
            status: 'reviewing',
            appliedDate: '2024-01-12',
            lastUpdated: '2024-01-18',
            nextAction: 'Waiting for HR review',
            priority: 'medium'
          },
          {
            id: '3',
            jobId: 'job3',
            jobTitle: 'Full Stack Engineer',
            company: 'Digital Solutions Inc',
            location: 'New York, NY',
            salary: '$85,000 - $110,000',
            type: 'Full-time',
            status: 'pending',
            appliedDate: '2024-01-10',
            lastUpdated: '2024-01-10',
            nextAction: 'Application submitted',
            priority: 'low'
          },
          {
            id: '4',
            jobId: 'job4',
            jobTitle: 'Frontend Developer',
            company: 'Creative Agency',
            location: 'Los Angeles, CA',
            salary: '$70,000 - $95,000',
            type: 'Full-time',
            status: 'rejected',
            appliedDate: '2024-01-05',
            lastUpdated: '2024-01-15',
            notes: 'Position filled internally',
            priority: 'low'
          },
          {
            id: '5',
            jobId: 'job5',
            jobTitle: 'Lead React Developer',
            company: 'Enterprise Corp',
            location: 'Seattle, WA',
            salary: '$140,000 - $180,000',
            type: 'Full-time',
            status: 'accepted',
            appliedDate: '2024-01-01',
            lastUpdated: '2024-01-22',
            nextAction: 'Start date: February 1st',
            priority: 'high'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewing':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
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
      case 'accepted':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'withdrawn':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || app.status === statusFilter;
    const matchesPriority = !priorityFilter || app.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusCounts = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    reviewing: applications.filter(app => app.status === 'reviewing').length,
    interview: applications.filter(app => app.status === 'interview').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/applicant/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your job applications
                </p>
              </div>
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
                  <p className="text-2xl font-bold text-green-500">{statusCounts.accepted}</p>
                  <p className="text-xs text-muted-foreground">Accepted</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{statusCounts.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search applications by job title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
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
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('');
                      setPriorityFilter('');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4">
            <p className="text-muted-foreground">
              {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Main Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1">
                          {application.jobTitle}
                        </h3>
                        <div className="flex items-center gap-4 text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{application.company}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{application.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{application.salary}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="outline"
                          className={getPriorityColor(application.priority)}
                        >
                          {application.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    {/* Status and Timeline */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(application.status)}
                        <Badge 
                          variant="outline"
                          className={getStatusColor(application.status)}
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {application.type}
                      </Badge>
                    </div>

                    {/* Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Applied: {new Date(application.appliedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>Updated: {new Date(application.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Next Action */}
                    {application.nextAction && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-blue-500">Next Action:</span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{application.nextAction}</p>
                      </div>
                    )}

                    {/* Interview Date */}
                    {application.interviewDate && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-purple-500">Interview Scheduled:</span>
                        </div>
                        <p className="text-sm text-foreground mt-1">
                          {new Date(application.interviewDate).toLocaleDateString()} at {new Date(application.interviewDate).toLocaleTimeString()}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {application.notes && (
                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                        </div>
                        <p className="text-sm text-foreground">{application.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      View Job
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Company Page
                    </Button>
                    {application.status === 'pending' && (
                      <Button variant="outline" size="sm" className="w-full text-red-500 hover:text-red-600">
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredApplications.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
                <p className="text-muted-foreground mb-4">
                  {applications.length === 0
                    ? "You haven't applied to any jobs yet. Start your job search now!"
                    : "Try adjusting your search criteria or filters"}
                </p>
                <Button asChild>
                  <Link to="/applicant/jobs">
                    <Search className="h-4 w-4 mr-2" />
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