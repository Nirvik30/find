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
  Briefcase,
  Users,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api'; // Adjust the import based on your project structure

interface Job {
  id: string;
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
  applicants: number;
  saved: boolean;
}

export default function JobBrowse() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (locationFilter) params.location = locationFilter;
      if (typeFilter && typeFilter !== 'all') params.type = typeFilter;
      if (experienceFilter && experienceFilter !== 'all') params.experience = experienceFilter;
      
      console.log('Fetching jobs with params:', params);
      
      const response = await api.get('/jobs', { params });
      console.log('Jobs API response:', response.data);
      
      const jobsData = response.data.data.jobs;
      
      // Map the backend data to frontend format
      const mappedJobs = jobsData.map((job: any) => ({
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        experience: job.experience,
        salary: job.salary || 'Salary not specified',
        description: job.description,
        requirements: job.requirements || [],
        benefits: job.benefits || [],
        postedDate: job.postedDate,
        applicants: job.applications || 0,
        saved: false // This should come from user's saved jobs
      }));
      
      console.log('Mapped jobs:', mappedJobs);
      setJobs(mappedJobs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const toggleSaveJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, saved: !job.saved } : job
    ));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      job.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesType = !typeFilter || typeFilter === 'all' || job.type === typeFilter;
    
    const matchesExperience = !experienceFilter || experienceFilter === 'all' || 
      job.experience.toLowerCase().includes(experienceFilter.toLowerCase()) ||
      (experienceFilter === '0-1' && (job.experience.includes('0-1') || job.experience.toLowerCase().includes('entry'))) ||
      (experienceFilter === '1-3' && (job.experience.includes('1-3') || job.experience.toLowerCase().includes('junior'))) ||
      (experienceFilter === '3-5' && (job.experience.includes('3-5') || job.experience.toLowerCase().includes('mid'))) ||
      (experienceFilter === '5+' && (job.experience.includes('5+') || job.experience.toLowerCase().includes('senior')));

    return matchesSearch && matchesLocation && matchesType && matchesExperience;
  });

  useEffect(() => {
    console.log('Filters changed:', { searchTerm, locationFilter, typeFilter, experienceFilter });
    console.log('Filtered jobs count:', filteredJobs.length);
  }, [searchTerm, locationFilter, typeFilter, experienceFilter, filteredJobs.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
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
              <h1 className="text-3xl font-bold text-foreground">Browse Jobs</h1>
              <p className="text-muted-foreground mt-1">
                Discover your next career opportunity
              </p>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button 
                asChild
              >
                <Link to="/applicant/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  console.log('Filter button clicked, current showFilters:', showFilters);
                  setShowFilters(!showFilters);
                  console.log('Setting showFilters to:', !showFilters);
                  
                  // Force a re-render after a small delay
                  setTimeout(() => {
                    console.log('After timeout, showFilters is:', showFilters);
                  }, 100);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters {showFilters ? '(Hide)' : '(Show)'}
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <Input
                    placeholder="Enter location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Job Type</label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Experience</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="0-1">Entry Level</SelectItem>
                      <SelectItem value="1-3">Junior</SelectItem>
                      <SelectItem value="3-5">Mid Level</SelectItem>
                      <SelectItem value="5+">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setLocationFilter('');
                      setTypeFilter('all');
                      setExperienceFilter('all');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Count - Enhanced */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
              {(searchTerm || locationFilter || typeFilter || experienceFilter) && (
                <span className="ml-2 text-primary">
                  (filtered from {jobs.length} total)
                </span>
              )}
            </p>
            
            {/* Active Filters Display */}
            {(searchTerm || locationFilter || (typeFilter && typeFilter !== 'all') || (experienceFilter && experienceFilter !== 'all')) && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: {searchTerm}
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {locationFilter && (
                  <Badge variant="secondary" className="text-xs">
                    Location: {locationFilter}
                    <button 
                      onClick={() => setLocationFilter('')}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {typeFilter && typeFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {typeFilter}
                    <button 
                      onClick={() => setTypeFilter('all')}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {experienceFilter && experienceFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Experience: {experienceFilter}
                    <button 
                      onClick={() => setExperienceFilter('all')}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-foreground hover:text-primary cursor-pointer">
                        {job.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSaveJob(job.id)}
                        className={`${job.saved ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
                      >
                        <BookmarkIcon className={`h-5 w-5 ${job.saved ? 'fill-current' : ''}`} />
                      </Button>
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
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {job.type}
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {job.experience}
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
                          <Users className="h-4 w-4" />
                          <span>{job.applicants} applicants</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          asChild
                        >
                          <Link to={`/applicant/jobs/${job.id}`}>
                            View Details
                          </Link>
                        </Button>
                        <Button>
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredJobs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('');
                    setTypeFilter('');
                    setExperienceFilter('');
                  }}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}