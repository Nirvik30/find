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
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Star,
  StarOff,
  Download,
  Briefcase,
  Mail,
  MapPin,
  Eye,
  Loader2, // Add this import
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';
import { DocumentPreview } from '@/components/DocumentPreview';
import { Switch } from "@/components/ui/switch";

// Types
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location?: string;
  matchScore: number;
  starred: boolean;
  status: string;
  appliedDate: string;
  lastActivity?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  coverLetter?: string;
  documents?: Array<{ name: string; url: string; size?: number }>;
  jobId: string;
  jobTitle: string;
  company: string;
  skills?: string[];
  experience?: string;
  education?: string;
  notes?: string[];
  notesHistory?: Array<{
    id: string;
    content: string;
    isPublic: boolean;
    createdAt: string;
    authorId?: string;
    authorName?: string;
  }>;
}

interface Job {
  id: string;
  title: string;
  applications: number;
}

export default function ApplicationsList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string } | null>(null);
  const [newNote, setNewNote] = useState<string>('');
  const [isPublicNote, setIsPublicNote] = useState<boolean>(true);
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);

  useEffect(() => {
    // Get jobId and candidateId from URL if they exist
    const jobIdFromUrl = searchParams.get('jobId');
    const candidateIdFromUrl = searchParams.get('candidateId');
    
    if (jobIdFromUrl) {
      setJobFilter(jobIdFromUrl);
    }
    
    // First load all data
    Promise.all([fetchCandidates(), fetchJobs()])
      .then(() => {
        // After data is loaded, try to select candidate from URL
        if (candidateIdFromUrl) {
          setCandidates(prevCandidates => {
            const candidate = prevCandidates.find(c => c.id === candidateIdFromUrl);
            if (candidate) {
              setSelectedCandidate(candidate);
            }
            return prevCandidates;
          });
        }
      })
      .catch(err => {
        console.error("Failed to initialize data:", err);
        setError("Failed to initialize application data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params: Record<string, string> = {};
      if (jobFilter) params.jobId = jobFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/applications/candidates', { params });
      
      if (!response?.data?.data?.candidates) {
        // Handle empty data properly
        setCandidates([]);
        setSelectedCandidate(null);
        return [];
      }
      
      // Process the candidates data
      const candidatesData = response.data.data.candidates.map((candidate: any) => ({
        id: candidate.id || '',
        name: candidate.name || 'Unknown Candidate',
        email: candidate.email || '',
        phone: candidate.phone || '',
        avatar: candidate.avatar || '',
        location: candidate.location || 'Not specified',
        matchScore: candidate.matchScore || 0,
        starred: candidate.starred || false,
        status: candidate.status || 'pending',
        appliedDate: candidate.appliedDate || new Date().toISOString(),
        lastActivity: candidate.lastActivity || candidate.appliedDate || new Date().toISOString(),
        resumeUrl: candidate.resumeUrl || '',
        coverLetter: candidate.coverLetter || '',
        documents: Array.isArray(candidate.documents) ? candidate.documents : [],
        jobId: candidate.jobId || '',
        jobTitle: candidate.jobTitle || 'Unknown Job',
        company: candidate.company || '',
        jobMatch: candidate.jobMatch || 0,
        skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        experience: candidate.experience || 'Not specified',
        education: candidate.education || 'Not specified',
        notes: Array.isArray(candidate.notes) ? candidate.notes : [],
        notesHistory: Array.isArray(candidate.notesHistory) ? candidate.notesHistory : []
      }));
      
      setCandidates(candidatesData);
      
      // If there are candidates and none selected yet, select the first one by default
      if (candidatesData.length > 0 && !selectedCandidate) {
        setSelectedCandidate(candidatesData[0]);
      }
      
      return candidatesData;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setError('Failed to load candidates. Please try again.');
      setCandidates([]);
      return [];
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/recruiter/dashboard');
      
      if (!response?.data?.data?.jobs) {
        setJobs([]);
        return [];
      }
      
      const jobsList = response.data.data.jobs.map((job: any) => ({
        id: job._id || job.id || '',
        title: job.title || 'Untitled Job',
        applications: job.applications || 0
      }));
      
      setJobs(jobsList);
      return jobsList;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      return [];
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
    
    // Update the selected candidate if it's the one that was starred
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate({
        ...selectedCandidate,
        starred: !selectedCandidate.starred
      });
    }
  };

  const updateCandidateStatus = async (applicationId: string, status: string) => {
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      
      // Update the local state to reflect the change
      setCandidates(
        candidates.map((candidate) =>
          candidate.id === applicationId ? { ...candidate, status: status as any } : candidate
        )
      );
      
      // Update the selected candidate if it's the one that was updated
      if (selectedCandidate && selectedCandidate.id === applicationId) {
        setSelectedCandidate({
          ...selectedCandidate,
          status: status as any
        });
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const addNote = async () => {
    if (!selectedCandidate || !newNote.trim()) return;
    
    try {
      setSubmittingNote(true);
      
      const response = await api.post(`/applications/${selectedCandidate.id}/notes`, {
        content: newNote.trim(),
        isPublic: isPublicNote
      });
      
      const newNoteItem = response.data.data.note;
      
      // Update local state with defensive coding
      const updatedCandidate = {
        ...selectedCandidate,
        notesHistory: [
          ...(selectedCandidate.notesHistory || []),
          newNoteItem
        ]
      };
      
      // If public, also update publicNotes array
      if (isPublicNote) {
        updatedCandidate.publicNotes = [
          ...(selectedCandidate.publicNotes || []),
          newNote.trim()
        ];
      }
      
      setSelectedCandidate(updatedCandidate);
      
      // Update in the full candidates list as well
      setCandidates(prev => 
        prev.map(candidate => 
          candidate.id === selectedCandidate.id ? updatedCandidate : candidate
        )
      );
      
      // Clear input
      setNewNote('');
      
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const getStatusColor = (status: string): string => {
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

  // Render a candidate card for the sidebar
  const renderCandidateItem = (candidate: Candidate) => {
    if (!candidate) return null; // Guard against null candidate
    
    return (
      <div
        key={candidate.id}
        className={`p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer ${
          selectedCandidate?.id === candidate.id ? 'bg-accent border-primary' : 'border-border'
        }`}
        onClick={() => setSelectedCandidate(candidate)}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground text-sm truncate">{candidate.name}</h4>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStarCandidate(candidate.id);
                }}
              >
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
              <Badge 
                variant="outline"
                className={`text-xs ${getStatusColor(candidate.status)}`}
              >
                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(candidate.appliedDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([fetchCandidates(), fetchJobs()])
      .finally(() => setLoading(false));
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
          <Button onClick={handleRefresh}>Try Again</Button>
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

        {/* Main Content: Split View with List and Details */}
        {filteredCandidates.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side: Candidates List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="space-y-2">
                {sortedCandidates.map(candidate => renderCandidateItem(candidate))}
              </div>
            </div>
            
            {/* Right Side: Candidate Details */}
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
                          <button 
                            type="button"
                            onClick={() => toggleStarCandidate(selectedCandidate.id)}
                          >
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h3>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{selectedCandidate.email}</p>
                            </div>
                            {selectedCandidate.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm">{selectedCandidate.phone}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{selectedCandidate.location}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
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
                    </div>

                    {/* Resume & Documents */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedCandidate.resumeUrl && (
                          <div className="flex gap-2 w-full">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                if (!selectedCandidate.resumeUrl) return;
                                
                                const url = selectedCandidate.resumeUrl.startsWith('http') 
                                  ? selectedCandidate.resumeUrl 
                                  : `${api.defaults.baseURL?.replace('/api', '')}${selectedCandidate.resumeUrl}`;
                                setPreviewDocument({ 
                                  url: selectedCandidate.resumeUrl, 
                                  name: selectedCandidate.resumeFileName || 'Resume.pdf' 
                                });
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview Resume
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a 
                                href={selectedCandidate.resumeUrl.startsWith('http') 
                                  ? selectedCandidate.resumeUrl 
                                  : `${api.defaults.baseURL?.replace('/api', '')}${selectedCandidate.resumeUrl}`
                                } 
                                download 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        )}
                        
                        {selectedCandidate.coverLetter && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <FileText className="h-4 w-4 mr-2" />
                                View Cover Letter
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Cover Letter</DialogTitle>
                              </DialogHeader>
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{selectedCandidate.coverLetter}</p>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        {/* Additional Documents */}
                        {selectedCandidate.documents && selectedCandidate.documents.length > 0 && (
                          <div className="sm:col-span-2 mt-2">
                            <h4 className="text-sm font-medium mb-2">Additional Documents:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {selectedCandidate.documents.map((doc, index) => (
                                <div key={index} className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => {
                                      const url = doc.url.startsWith('http') 
                                        ? doc.url 
                                        : `${api.defaults.baseURL?.replace('/api', '')}${doc.url}`;
                                      setPreviewDocument({ url: doc.url, name: doc.name || `Document-${index+1}` });
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {doc.name || `Document-${index+1}`}
                                  </Button>
                                  <Button variant="outline" size="sm" asChild>
                                    <a 
                                      href={doc.url.startsWith('http') 
                                        ? doc.url 
                                        : `${api.defaults.baseURL?.replace('/api', '')}${doc.url}`
                                    } 
                                    download 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Skills & Experience */}
                    {(selectedCandidate.skills?.length > 0 || selectedCandidate.experience || selectedCandidate.education) && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Skills & Experience</h3>
                        <div className="space-y-3">
                          {selectedCandidate.skills?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedCandidate.skills.map((skill, index) => (
                                  <Badge key={index} variant="secondary">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {selectedCandidate.experience && (
                            <div>
                              <p className="text-sm font-medium mb-1">Experience</p>
                              <p className="text-sm">{selectedCandidate.experience}</p>
                            </div>
                          )}
                          
                          {selectedCandidate.education && (
                            <div>
                              <p className="text-sm font-medium mb-1">Education</p>
                              <p className="text-sm">{selectedCandidate.education}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground">Notes & Feedback</h3>
                      
                      <Tabs defaultValue="add" className="w-full">
                        <TabsList className="grid grid-cols-2 mb-4">
                          <TabsTrigger value="add">Add Note</TabsTrigger>
                          <TabsTrigger value="history">Note History</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="add" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-note">Add a note about this candidate</Label>
                            <Textarea
                              id="new-note"
                              placeholder="Enter your feedback, interview notes, or candidate assessment..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              rows={4}
                              className="resize-none"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="public-note"
                                checked={isPublicNote}
                                onCheckedChange={setIsPublicNote}
                              />
                              <Label htmlFor="public-note" className="text-sm">
                                {isPublicNote ? "Visible to applicant" : "Private note (recruiters only)"}
                              </Label>
                            </div>
                            
                            <Button 
                              onClick={addNote} 
                              disabled={!newNote.trim() || submittingNote}
                              size="sm"
                            >
                              {submittingNote ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Saving...
                                </>
                              ) : (
                                "Add Note"
                              )}
                            </Button>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="history">
                          {selectedCandidate.notesHistory && selectedCandidate.notesHistory.length > 0 ? (
                            <div className="space-y-3">
                              {selectedCandidate.notesHistory.map((note) => (
                                <div 
                                  key={note.id} 
                                  className={`p-3 rounded-lg border ${
                                    note.isPublic 
                                      ? 'bg-green-500/10 border-green-500/30' 
                                      : 'bg-amber-500/10 border-amber-500/30'
                                  }`}
                                >
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(note.createdAt).toLocaleString()}
                                    </span>
                                    <Badge variant="outline" className={
                                      note.isPublic 
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }>
                                      {note.isPublic ? "Visible to applicant" : "Private"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                  {note.authorName && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      - {note.authorName}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">No notes have been added yet</p>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-wrap gap-2 border-t pt-6">
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
                  </CardFooter>
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
        ) : (
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

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
        <DialogContent className="sm:max-w-4xl sm:max-h-[80vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>Document Preview: {previewDocument?.name}</DialogTitle>
          </DialogHeader>
          {previewDocument && (
            <DocumentPreview url={previewDocument.url} fileName={previewDocument.name} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}