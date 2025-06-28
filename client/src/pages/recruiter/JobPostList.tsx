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
  Briefcase,
  Clock,
  Calendar,
  PlusCircle,
  Filter,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  status: 'draft' | 'active' | 'closed' | 'filled';
  isUrgent: boolean;
  postedDate: string;
  updatedDate: string;
  applications: number;
  views: number;
  daysRemaining?: number;
  applicationDeadline?: string;
}

export default function JobPostList() {
  const { user } = useAuth();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchJobPosts();
  }, []);
  
  const fetchJobPosts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setJobPosts([
          {
            id: '1',
            title: 'Senior Frontend Developer',
            company: user?.companyName || 'TechCorp',
            location: 'San Francisco, CA',
            type: 'Full-time',
            experience: '3-5 years',
            salary: '$120,000 - $160,000',
            status: 'active',
            isUrgent: true,
            postedDate: '2024-03-25T09:00:00',
            updatedDate: '2024-03-25T09:00:00',
            applications: 47,
            views: 325,
            daysRemaining: 15,
            applicationDeadline: '2024-05-30'
          },
          {
            id: '2',
            title: 'UI/UX Designer',
            company: user?.companyName || 'TechCorp',
            location: 'Remote',
            type: 'Full-time',
            experience: '2-4 years',
            salary: '$90,000 - $120,000',
            status: 'active',
            isUrgent: false,
            postedDate: '2024-03-28T11:30:00',
            updatedDate: '2024-03-28T11:30:00',
            applications: 32,
            views: 218,
            daysRemaining: 18,
            applicationDeadline: '2024-05-15'
          },
          {
            id: '3',
            title: 'React Developer',
            company: user?.companyName || 'TechCorp',
            location: 'New York, NY',
            type: 'Full-time',
            experience: '1-3 years',
            salary: '$80,000 - $110,000',
            status: 'draft',
            isUrgent: false,
            postedDate: '2024-04-01T10:15:00',
            updatedDate: '2024-04-01T10:15:00',
            applications: 0,
            views: 0
          },
          {
            id: '4',
            title: 'Backend Developer',
            company: user?.companyName || 'TechCorp',
            location: 'Chicago, IL',
            type: 'Full-time',
            experience: '3+ years',
            salary: '$100,000 - $130,000',
            status: 'filled',
            isUrgent: false,
            postedDate: '2024-03-15T14:00:00',
            updatedDate: '2024-04-10T09:30:00',
            applications: 35,
            views: 290
          },
          {
            id: '5',
            title: 'DevOps Engineer',
            company: user?.companyName || 'TechCorp',
            location: 'Austin, TX',
            type: 'Full-time',
            experience: '2+ years',
            salary: '$95,000 - $125,000',
            status: 'closed',
            isUrgent: false,
            postedDate: '2024-04-05T09:45:00',
            updatedDate: '2024-04-20T11:20:00',
            applications: 10,
            views: 87
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching job posts:', error);
      setLoading(false);
    }
  };
  
  const getStatusColor = (status: string) => {
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'filled':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const deleteJobPost = (id: string) => {
    // TODO: Replace with actual API call
    setJobPosts(jobPosts.filter(job => job.id !== id));
  };
  
  const filteredJobs = jobPosts.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      case 'applications':
        return b.applications - a.applications;
      case 'views':
        return b.views - a.views;
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading job posts...</p>
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
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/recruiter/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Job Postings</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your job listings
                </p>
              </div>
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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-3xl font-bold text-foreground">
                    {jobPosts.length}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold text-green-500">
                    {jobPosts.filter(job => job.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {jobPosts.filter(job => job.status === 'draft').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Apps</p>
                  <p className="text-3xl font-bold text-primary">
                    {jobPosts.reduce((sum, job) => sum + job.applications, 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search job postings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="applications">Most Applications</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
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

          <p className="text-muted-foreground">
            {sortedJobs.length} job post{sortedJobs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Job Posts List */}
        <div className="space-y-4">
          {sortedJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {job.title}
                      </h3>
                      <Badge 
                        variant="outline"
                        className={getStatusColor(job.status)}
                      >
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                      {job.isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          URGENT
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                      </div>
                      {job.daysRemaining !== undefined && job.status === 'active' && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{job.daysRemaining} days remaining</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center hidden md:block">
                      <p className="text-lg font-semibold text-foreground">{job.applications}</p>
                      <p className="text-xs text-muted-foreground">Applications</p>
                    </div>
                    <div className="text-center hidden md:block">
                      <p className="text-lg font-semibold text-foreground">{job.views}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/recruiter/job-post/${job.id}/preview`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/recruiter/job-post/${job.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteJobPost(job.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/recruiter/applications?jobId=${job.id}`}>
                          View Applicants
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedJobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No job posts found</h3>
                <p className="text-muted-foreground mb-4">
                  {jobPosts.length === 0 
                    ? "You haven't created any job postings yet" 
                    : "Try adjusting your search criteria or filters"}
                </p>
                <Button asChild>
                  <Link to="/recruiter/job-post/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Your First Job Post
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