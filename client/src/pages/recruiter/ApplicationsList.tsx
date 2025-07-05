import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
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
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageCircle,
  Phone,
  Video,
  ArrowLeft,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Star,
  StarOff,
  Download,
  Briefcase
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

// Types
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location: string;
  matchScore: number;
  starred: boolean;
  status: 'pending' | 'reviewing' | 'interview' | 'offer' | 'accepted' | 'rejected';
  appliedDate: string;
  lastActivity?: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  jobId: string;
  jobTitle: string;
  company: string;
  jobMatch: number;
  skills: string[];
  experience: string;
  education: string;
  notes?: string[];
  interviews?: Interview[];
}

interface Interview {
  id: string;
  candidateId: string;
  type: 'phone' | 'video' | 'in-person';
  date: string;
  duration: number; // minutes
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'canceled' | 'no-show';
  feedback?: string;
  rating?: number;
}

export default function ApplicationsList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<{ id: string; title: string; applications: number }[]>([]);

  useEffect(() => {
    // Get jobId from URL if it exists
    const jobIdFromUrl = searchParams.get('jobId');
    if (jobIdFromUrl) {
      setJobFilter(jobIdFromUrl);
    }
    
    fetchCandidates();
    fetchJobs();
  }, [searchParams]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: any = {};
      if (jobFilter) params.jobId = jobFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/applications/candidates', { params });
      setCandidates(response.data.data.candidates);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/recruiter/dashboard');
      const jobsList = response.data.data.jobs.map((job: any) => ({
        id: job._id,
        title: job.title,
        applications: job.applications
      }));
      setJobs(jobsList);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const toggleStarCandidate = (id: string) => {
    setCandidates(prev => 
      prev.map(candidate => 
        candidate.id === id 
          ? { ...candidate, starred: !candidate.starred } 
          : candidate
      )
    );
  };

  const updateCandidateStatus = async (applicationId: string, status: string) => {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      // Update the local state to reflect the change
      setCandidates(
        candidates.map((candidate) =>
          candidate.id === applicationId ? { ...candidate, status } : candidate
        )
      );
    } catch (error) {
      console.error('Error updating application status:', error);
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

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4 text-blue-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-purple-500" />;
      case 'in-person':
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatInterviewTime = (date: string, duration: number) => {
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const options: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };
    
    return `${startTime.toLocaleTimeString([], options)} - ${endTime.toLocaleTimeString([], options)}`;
  };

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = !searchTerm || 
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJob = !jobFilter || candidate.jobId === jobFilter;
    const matchesStatus = !statusFilter || candidate.status === statusFilter;
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      matchesDate = new Date(candidate.appliedDate).toDateString() === today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchesDate = new Date(candidate.appliedDate) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchesDate = new Date(candidate.appliedDate) >= monthAgo;
    }
    
    return matchesSearch && matchesJob && matchesStatus && matchesDate;
  });
  
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
    } else if (sortBy === 'match') {
      return b.matchScore - a.matchScore;
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'activity') {
      const aActivity = a.lastActivity || a.appliedDate;
      const bActivity = b.lastActivity || b.appliedDate;
      return new Date(bActivity).getTime() - new Date(aActivity).getTime();
    }
    return 0;
  });

  // Group candidates by status for kanban view
  const groupedCandidates = {
    pending: sortedCandidates.filter(c => c.status === 'pending'),
    reviewing: sortedCandidates.filter(c => c.status === 'reviewing'),
    interview: sortedCandidates.filter(c => c.status === 'interview'),
    offer: sortedCandidates.filter(c => c.status === 'offer'),
    accepted: sortedCandidates.filter(c => c.status === 'accepted'),
    rejected: sortedCandidates.filter(c => c.status === 'rejected')
  };

  const candidateCard = (candidate: Candidate) => (
    <div
      key={candidate.id}
      className={`p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer ${
        selectedCandidate?.id === candidate.id ? 'bg-accent border-primary' : ''
      }`}
      onClick={() => setSelectedCandidate(candidate)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {candidate.avatar ? (
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground text-sm">{candidate.name}</h4>
            <button onClick={(e) => {
              e.stopPropagation();
              toggleStarCandidate(candidate.id);
            }}>
              {candidate.starred ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-1 my-1">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              {candidate.matchScore}% Match
            </Badge>
            <Badge variant="outline" className="text-xs">
              {candidate.jobTitle}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{new Date(candidate.appliedDate).toLocaleDateString()}</span>
            {candidate.lastActivity && (
              <span>Last activity: {new Date(candidate.lastActivity).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/recruiter/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Applications</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your candidate pipeline
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}>
                {viewMode === 'list' ? 'Kanban View' : 'List View'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search candidates by name, email, or job..."
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
                  <SelectItem value="match">Match Score</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="activity">Recent Activity</SelectItem>
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
                <label className="block text-sm font-medium text-foreground mb-2">Job Position</label>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Jobs</SelectItem>
                    {jobs.map(job => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} ({job.applications})
                      </SelectItem>
                    ))}
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Applied</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Past Week</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setJobFilter('');
                    setStatusFilter('');
                    setDateFilter('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          <p className="text-muted-foreground">
            {filteredCandidates.length} applicant{filteredCandidates.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Kanban Board View */}
        {viewMode === 'kanban' && (
          <div className="flex overflow-x-auto pb-4 space-x-4">
            {/* Column: Pending */}
            <div className="flex-shrink-0 w-[300px]">
              <div className="bg-card rounded-lg border border-border p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-foreground">Pending</h3>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    {groupedCandidates.pending.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedCandidates.pending.map(candidate => candidateCard(candidate))}
                  {groupedCandidates.pending.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No pending applications
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column: Reviewing */}
            <div className="flex-shrink-0 w-[300px]">
              <div className="bg-card rounded-lg border border-border p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-foreground">Reviewing</h3>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                    {groupedCandidates.reviewing.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedCandidates.reviewing.map(candidate => candidateCard(candidate))}
                  {groupedCandidates.reviewing.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No applications under review
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column: Interview */}
            <div className="flex-shrink-0 w-[300px]">
              <div className="bg-card rounded-lg border border-border p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-foreground">Interview</h3>
                  </div>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                    {groupedCandidates.interview.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedCandidates.interview.map(candidate => candidateCard(candidate))}
                  {groupedCandidates.interview.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No interviews scheduled
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column: Offer */}
            <div className="flex-shrink-0 w-[300px]">
              <div className="bg-card rounded-lg border border-border p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-foreground">Offer</h3>
                  </div>
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                    {groupedCandidates.offer.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedCandidates.offer.map(candidate => candidateCard(candidate))}
                  {groupedCandidates.offer.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No offers extended
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column: Accepted */}
            <div className="flex-shrink-0 w-[300px]">
              <div className="bg-card rounded-lg border border-border p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">Accepted</h3>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {groupedCandidates.accepted.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedCandidates.accepted.map(candidate => candidateCard(candidate))}
                  {groupedCandidates.accepted.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No accepted offers
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column: Rejected */}
            <div className="flex-shrink-0 w-[300px]">
              <div className="bg-card rounded-lg border border-border p-4 h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-foreground">Rejected</h3>
                  </div>
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    {groupedCandidates.rejected.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {groupedCandidates.rejected.map(candidate => candidateCard(candidate))}
                  {groupedCandidates.rejected.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No rejected applications
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: List of Candidates */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Candidates</CardTitle>
                  <CardDescription>
                    {filteredCandidates.length} applicant{filteredCandidates.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredCandidates.length > 0 ? (
                      filteredCandidates.map(candidate => candidateCard(candidate))
                    ) : (
                      <div className="text-center py-6">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No candidates found</h3>
                        <p className="text-muted-foreground mb-4">
                          Try adjusting your search criteria or filters
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('');
                            setJobFilter('');
                            setStatusFilter('');
                            setDateFilter('');
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel: Candidate Details */}
            <div className="lg:col-span-2">
              {selectedCandidate ? (
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {selectedCandidate.avatar ? (
                          <img
                            src={selectedCandidate.avatar}
                            alt={selectedCandidate.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{selectedCandidate.name}</CardTitle>
                          <button onClick={() => toggleStarCandidate(selectedCandidate.id)}>
                            {selectedCandidate.starred ? (
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            ) : (
                              <StarOff className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={getStatusColor(selectedCandidate.status)}
                          >
                            {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {selectedCandidate.matchScore}% Match
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Select 
                      value={selectedCandidate.status}
                      onValueChange={(value: any) => updateCandidateStatus(selectedCandidate.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Contact Info & Basic Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                        <div className="space-y-2">
                          <p className="text-sm"><span className="font-medium">Email:</span> {selectedCandidate.email}</p>
                          {selectedCandidate.phone && (
                            <p className="text-sm"><span className="font-medium">Phone:</span> {selectedCandidate.phone}</p>
                          )}
                          <p className="text-sm"><span className="font-medium">Location:</span> {selectedCandidate.location}</p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Application Details</h3>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium">Applied for:</span> {selectedCandidate.jobTitle}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Applied on:</span> {new Date(selectedCandidate.appliedDate).toLocaleDateString()}
                          </p>
                          {selectedCandidate.lastActivity && (
                            <p className="text-sm">
                              <span className="font-medium">Last Activity:</span> {new Date(selectedCandidate.lastActivity).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resume & Cover Letter */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Documents</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.resumeUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-2" />
                              View Resume
                            </a>
                          </Button>
                        )}
                        {selectedCandidate.coverLetterUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={selectedCandidate.coverLetterUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-2" />
                              View Cover Letter
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download All
                        </Button>
                      </div>
                    </div>

                    {/* Skills & Experience */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Skills & Experience</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Skills</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCandidate.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Experience</p>
                          <p className="text-sm">{selectedCandidate.experience}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Education</p>
                          <p className="text-sm">{selectedCandidate.education}</p>
                        </div>
                      </div>
                    </div>

                    {/* Interviews */}
                    {selectedCandidate.interviews && selectedCandidate.interviews.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Interviews</h3>
                        <div className="space-y-3">
                          {selectedCandidate.interviews.map(interview => (
                            <div 
                              key={interview.id}
                              className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getInterviewTypeIcon(interview.type)}
                                  <span className="text-sm font-medium">
                                    {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)} Interview
                                  </span>
                                </div>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    interview.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    interview.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                    interview.status === 'canceled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                  }
                                >
                                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{new Date(interview.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{formatInterviewTime(interview.date, interview.duration)}</span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                Interviewers: {interview.interviewers.join(', ')}
                              </div>
                              {interview.feedback && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium">Feedback:</p>
                                  <p className="text-muted-foreground">{interview.feedback}</p>
                                </div>
                              )}
                              {interview.rating && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-sm font-medium">Rating:</span>
                                  <div className="flex">
                                    {Array.from({ length: interview.rating }).map((_, i) => (
                                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    ))}
                                    {Array.from({ length: 5 - interview.rating }).map((_, i) => (
                                      <Star key={i} className="h-4 w-4 text-muted-foreground" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedCandidate.notes && selectedCandidate.notes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Notes</h3>
                        <div className="space-y-2">
                          {selectedCandidate.notes.map((note, index) => (
                            <div key={index} className="p-3 rounded-lg border border-border bg-accent/30">
                              <p className="text-sm">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      <Button variant="outline" asChild>
                        <Link to={`/recruiter/messages?candidateId=${selectedCandidate.id}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message Candidate
                        </Link>
                      </Button>
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Select a candidate</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Click on any candidate from the list to view their details, resume, and manage their application.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {filteredCandidates.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No candidates found</h3>
              <p className="text-muted-foreground mb-4">
                {candidates.length === 0 
                  ? "You haven't received any applications yet" 
                  : "Try adjusting your search criteria or filters"}
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setJobFilter('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}