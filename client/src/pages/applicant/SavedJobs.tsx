import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import api from '@/lib/api';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  description?: string;
  requirements: string[];
  postedDate: string;
  savedDate: string;
  applicants: number;
  status: 'active' | 'expired' | 'filled';
  applicationDeadline?: string;
  isUrgent: boolean;
  matchScore: number;
  skills?: string[];
  jobId?: string; // The actual job ID
}

export default function SavedJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
      
      const response = await api.get('/users/saved-jobs');
      console.log('Saved jobs response:', response.data);
      
      if (!response?.data?.data?.savedJobs) {
        setSavedJobs([]);
        setLoading(false);
        return;
      }
      
      const jobs = response.data.data.savedJobs.map((job: any) => ({
        id: job._id || '',
        jobId: job._id || '',
        title: job.title || 'Unknown Position',
        company: job.company || 'Unknown Company',
        location: job.location || 'Remote',
        type: job.type || 'Full-time',
        salary: job.salary || 'Salary not specified',
        experience: job.experience || 'Not specified',
        description: job.description || '',
        requirements: job.requirements || [],
        postedDate: job.postedDate || new Date().toISOString(),
        savedDate: job.savedDate || new Date().toISOString(),
        applicants: job.applications || 0,
        status: job.status || 'active',
        applicationDeadline: job.applicationDeadline,
        isUrgent: job.isUrgent || false,
        matchScore: Math.floor(Math.random() * 30) + 70, // Generate random match score for demo
        skills: job.skills || []
      }));
      
      setSavedJobs(jobs);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching saved jobs:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load saved jobs';
      setError(errorMessage);
      setSavedJobs([]);
      setLoading(false);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        // Redirect to login if you have authentication context
        // logout();
      }
    }
  };

  const removeSavedJob = async (jobId: string) => {
    try {
      await api.delete(`/users/saved-jobs/${jobId}`);
      setSavedJobs(savedJobs.filter(job => job.id !== jobId));
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    } catch (error) {
      console.error('Error removing saved job:', error);
      alert('Failed to remove job from saved jobs');
    }
  };

  const removeMultipleSavedJobs = async () => {
    if (!confirm(`Remove ${selectedJobs.length} selected jobs from saved jobs?`)) {
      return;
    }
    
    try {
      // Use Promise.all to remove multiple jobs
      await Promise.all(
        selectedJobs.map(jobId => api.delete(`/users/saved-jobs/${jobId}`))
      );
      
      setSavedJobs(savedJobs.filter(job => !selectedJobs.includes(job.id)));
      setSelectedJobs([]);
    } catch (error) {
      console.error('Error removing multiple saved jobs:', error);
      alert('Failed to remove some jobs from saved jobs');
    }
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

  const applyToJob = async (job: SavedJob) => {
    try {
      // First get user's resumes
      const resumesResponse = await api.get('/resumes');
      
      if (!resumesResponse?.data?.data?.resumes || resumesResponse.data.data.resumes.length === 0) {
        alert('Please create a resume first before applying');
        navigate('/applicant/resumes');
        return;
      }
      
      // For now, let's use the default resume or the first one
      const resumes = resumesResponse.data.data.resumes;
      const defaultResume = resumes.find((r: any) => r.isDefault) || resumes[0];
      
      // Apply with the selected resume
      await api.post(`/applications/${job.jobId}`, {
        resumeId: defaultResume._id,
        coverLetter: 'I am interested in this position and would like to apply.'
      });
      
      // Mark as applied in the UI
      alert(`Applied to ${job.title} successfully!`);
      
      // Navigate to the applications page
      navigate('/applicant/applications');
    } catch (error: any) {
      console.error('Error applying to job:', error);
      alert(error.response?.data?.message || 'Failed to apply for job');
    }
  };

  const shareJob = (job: SavedJob) => {
    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.company}`,
        text: `Check out this job opportunity: ${job.title} at ${job.company}`,
        url: window.location.origin + `/applicant/jobs/${job.id}`
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = window.location.origin + `/applicant/jobs/${job.id}`;
      prompt('Copy this link to share the job:', shareUrl);
    }
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
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesType = !typeFilter || job.type === typeFilter;
    
    const matchesStatus = !statusFilter || job.status === statusFilter;
    
    return matchesSearch && matchesLocation && matchesType && matchesStatus;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'saved-date':
        return new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime();
      case 'match-score':
        return b.matchScore - a.matchScore;
      case 'salary':
        // Simple salary comparison (not accurate for ranges/text)
        const aNum = parseInt(a.salary.replace(/[^0-9]/g, '')) || 0;
        const bNum = parseInt(b.salary.replace(/[^0-9]/g, '')) || 0;
        return bNum - aNum;
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Saved Jobs</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchSavedJobs()}>Try Again</Button>
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
              <div className="flex gap-2">
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
          {sortedJobs.map((job) => (
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            asChild
                          >
                            <Link to={`/applicant/jobs/${job.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
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