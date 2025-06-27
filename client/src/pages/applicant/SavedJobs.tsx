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
  BookmarkIcon,
  Filter,
  ArrowLeft,
  Eye,
  ExternalLink,
  Calendar,
  Users,
  Trash2,
  Share2,
  AlertCircle,
  Briefcase,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SavedJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  savedDate: string;
  applicants: number;
  companyLogo?: string;
  isUrgent: boolean;
  matchScore: number;
  status: 'active' | 'expired' | 'filled';
  applicationDeadline?: string;
}

export default function SavedJobs() {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('saved-date');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setSavedJobs([
          {
            id: '1',
            jobId: 'job1',
            title: 'Senior Frontend Developer',
            company: 'TechCorp Innovation',
            location: 'San Francisco, CA',
            type: 'Full-time',
            experience: '3-5 years',
            salary: '$120,000 - $160,000',
            description: 'We are looking for a passionate Senior Frontend Developer to join our growing team and help build cutting-edge web applications.',
            requirements: ['React.js', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
            benefits: ['Health Insurance', 'Remote Work', '401k', 'Flexible Hours', 'Stock Options'],
            postedDate: '2024-01-15',
            savedDate: '2024-01-16',
            applicants: 45,
            isUrgent: true,
            matchScore: 95,
            status: 'active',
            applicationDeadline: '2024-02-15'
          },
          {
            id: '2',
            jobId: 'job2',
            title: 'React Native Developer',
            company: 'StartupXYZ',
            location: 'Remote',
            type: 'Full-time',
            experience: '2-4 years',
            salary: '$90,000 - $130,000',
            description: 'Join our mobile team to build cutting-edge applications that will be used by millions of users worldwide.',
            requirements: ['React Native', 'JavaScript', 'iOS/Android', 'Redux', 'Firebase'],
            benefits: ['Stock Options', 'Remote Work', 'Learning Budget', 'Flexible Schedule'],
            postedDate: '2024-01-12',
            savedDate: '2024-01-14',
            applicants: 23,
            isUrgent: false,
            matchScore: 88,
            status: 'active',
            applicationDeadline: '2024-02-12'
          },
          {
            id: '3',
            jobId: 'job3',
            title: 'Full Stack Engineer',
            company: 'Digital Solutions Inc',
            location: 'New York, NY',
            type: 'Full-time',
            experience: '1-3 years',
            salary: '$85,000 - $110,000',
            description: 'Opportunity to work on both frontend and backend technologies in a fast-paced startup environment.',
            requirements: ['JavaScript', 'Python', 'SQL', 'AWS', 'Docker'],
            benefits: ['Health Insurance', 'Dental', 'Vision', 'PTO', 'Professional Development'],
            postedDate: '2024-01-10',
            savedDate: '2024-01-11',
            applicants: 67,
            isUrgent: false,
            matchScore: 82,
            status: 'active'
          },
          {
            id: '4',
            jobId: 'job4',
            title: 'Frontend Developer',
            company: 'Creative Agency',
            location: 'Los Angeles, CA',
            type: 'Contract',
            experience: '1-2 years',
            salary: '$70,000 - $95,000',
            description: 'Contract position working on exciting creative projects for various clients in the entertainment industry.',
            requirements: ['React', 'CSS', 'JavaScript', 'Figma', 'WordPress'],
            benefits: ['Flexible Hours', 'Creative Environment', 'Networking Opportunities'],
            postedDate: '2024-01-05',
            savedDate: '2024-01-08',
            applicants: 34,
            isUrgent: false,
            matchScore: 75,
            status: 'expired'
          },
          {
            id: '5',
            jobId: 'job5',
            title: 'Lead React Developer',
            company: 'Enterprise Corp',
            location: 'Seattle, WA',
            type: 'Full-time',
            experience: '5+ years',
            salary: '$140,000 - $180,000',
            description: 'Lead a team of developers while working on enterprise-level applications used by Fortune 500 companies.',
            requirements: ['React', 'TypeScript', 'Leadership', 'Microservices', 'Kubernetes'],
            benefits: ['Executive Benefits', 'Stock Options', 'Bonus', 'Sabbatical', 'Education Fund'],
            postedDate: '2024-01-01',
            savedDate: '2024-01-03',
            applicants: 156,
            isUrgent: false,
            matchScore: 92,
            status: 'filled'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching saved jobs:', error);
      setLoading(false);
    }
  };

  const removeSavedJob = (jobId: string) => {
    setSavedJobs(savedJobs.filter(job => job.id !== jobId));
    setSelectedJobs(selectedJobs.filter(id => id !== jobId));
  };

  const removeMultipleSavedJobs = () => {
    setSavedJobs(savedJobs.filter(job => !selectedJobs.includes(job.id)));
    setSelectedJobs([]);
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const selectAllJobs = () => {
    setSelectedJobs(filteredJobs.map(job => job.id));
  };

  const clearSelection = () => {
    setSelectedJobs([]);
  };

  const applyToJob = (job: SavedJob) => {
    // TODO: Implement apply functionality
    console.log('Applying to job:', job.title);
  };

  const shareJob = (job: SavedJob) => {
    // TODO: Implement share functionality
    console.log('Sharing job:', job.title);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'expired':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'filled':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    if (score >= 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const filteredJobs = savedJobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = !typeFilter || job.type === typeFilter;
    const matchesStatus = !statusFilter || job.status === statusFilter;
    
    return matchesSearch && matchesLocation && matchesType && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'saved-date':
        return new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime();
      case 'match-score':
        return b.matchScore - a.matchScore;
      case 'salary':
        const aSalary = parseInt(a.salary.replace(/[^0-9]/g, ''));
        const bSalary = parseInt(b.salary.replace(/[^0-9]/g, ''));
        return bSalary - aSalary;
      case 'posted-date':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      default:
        return 0;
    }
  });

  const statusCounts = {
    total: savedJobs.length,
    active: savedJobs.filter(job => job.status === 'active').length,
    expired: savedJobs.filter(job => job.status === 'expired').length,
    filled: savedJobs.filter(job => job.status === 'filled').length,
    urgent: savedJobs.filter(job => job.isUrgent && job.status === 'active').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading saved jobs...</p>
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
                <h1 className="text-3xl font-bold text-foreground">Saved Jobs</h1>
                <p className="text-muted-foreground mt-1">
                  Your bookmarked job opportunities
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              {selectedJobs.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={removeMultipleSavedJobs}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected ({selectedJobs.length})
                </Button>
              )}
              <Button asChild>
                <Link to="/applicant/jobs">
                  <Search className="h-4 w-4 mr-2" />
                  Browse More Jobs
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{statusCounts.total}</p>
                  <p className="text-xs text-muted-foreground">Total Saved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{statusCounts.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{statusCounts.urgent}</p>
                  <p className="text-xs text-muted-foreground">Urgent</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{statusCounts.expired}</p>
                  <p className="text-xs text-muted-foreground">Expired</p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-500">{statusCounts.filled}</p>
                  <p className="text-xs text-muted-foreground">Filled</p>
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
                  placeholder="Search saved jobs by title or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved-date">Recently Saved</SelectItem>
                  <SelectItem value="match-score">Match Score</SelectItem>
                  <SelectItem value="salary">Salary (High to Low)</SelectItem>
                  <SelectItem value="posted-date">Recently Posted</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                  <Input
                    placeholder="Enter location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Job Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Types</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLocationFilter('');
                      setTypeFilter('');
                      setStatusFilter('');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Selection Controls */}
            {filteredJobs.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</span>
                  {selectedJobs.length > 0 && (
                    <span className="text-primary">{selectedJobs.length} selected</span>
                  )}
                </div>
                {filteredJobs.length > 0 && (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={selectedJobs.length === filteredJobs.length ? clearSelection : selectAllJobs}
                    >
                      {selectedJobs.length === filteredJobs.length ? 'Clear All' : 'Select All'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* Selection Checkbox */}
                  <div className="flex items-start pt-1">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => toggleJobSelection(job.id)}
                      className="rounded border-border"
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-foreground hover:text-primary cursor-pointer">
                            {job.title}
                          </h3>
                          {job.isUrgent && (
                            <Badge variant="destructive" className="text-xs">
                              URGENT
                            </Badge>
                          )}
                          <Badge 
                            variant="outline"
                            className={getStatusColor(job.status)}
                          >
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{job.salary}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{job.applicants} applicants</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {job.type}
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            {job.experience}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`${getMatchScoreColor(job.matchScore)} border-current/20`}
                          >
                            {job.matchScore}% match
                          </Badge>
                          {job.requirements.slice(0, 3).map((req, index) => (
                            <Badge key={index} variant="outline">
                              {req}
                            </Badge>
                          ))}
                          {job.requirements.length > 3 && (
                            <Badge variant="outline">
                              +{job.requirements.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookmarkIcon className="h-4 w-4" />
                              <span>Saved {new Date(job.savedDate).toLocaleDateString()}</span>
                            </div>
                            {job.applicationDeadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Deadline {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2 ml-4 min-w-[120px]">
                        {job.status === 'active' && (
                          <Button 
                            size="sm"
                            onClick={() => applyToJob(job)}
                          >
                            Apply Now
                          </Button>
                        )}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => shareJob(job)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeSavedJob(job.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Deadline Warning */}
                    {job.applicationDeadline && new Date(job.applicationDeadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && job.status === 'active' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-500">Application Deadline Soon:</span>
                        </div>
                        <p className="text-sm text-foreground mt-1">
                          Applications close on {new Date(job.applicationDeadline).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <BookmarkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {savedJobs.length === 0 ? 'No saved jobs yet' : 'No jobs match your filters'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {savedJobs.length === 0
                    ? "Start browsing jobs and save the ones you're interested in!"
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