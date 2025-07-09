import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Building2,
  BookmarkIcon,
  Share2,
  Send,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  postedDate: string;
  applicationDeadline?: string;
  applicants: number;
  views: number;
  status: string;
  isUrgent: boolean;
  saved: boolean;
  applied: boolean;
}

interface Resume {
  id: string;
  name: string;
  template: string;
  isDefault: boolean;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    if (id) {
      fetchJobDetails(id);
      fetchResumes();
      checkApplicationStatus(id);
    }
  }, [id]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${jobId}`);
      const jobData = response.data.data.job;
      
      setJob({
        id: jobData._id,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        type: jobData.type,
        experience: jobData.experience,
        salary: jobData.salary || 'Salary not specified',
        description: jobData.description,
        responsibilities: jobData.responsibilities || [],
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || [],
        skills: jobData.skills || [],
        postedDate: jobData.postedDate,
        applicationDeadline: jobData.applicationDeadline,
        applicants: jobData.applications || 0,
        views: jobData.views || 0,
        status: jobData.status,
        isUrgent: jobData.isUrgent || false,
        saved: false,
        applied: false // Will be updated by checkApplicationStatus
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes');
      setResumes(response.data.data.resumes.map((resume: any) => ({
        id: resume._id,
        name: resume.name,
        template: resume.template,
        isDefault: resume.isDefault
      })));
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const checkApplicationStatus = async (jobId: string) => {
    try {
      const response = await api.get('/applications/my-applications');
      const appliedJobIds = response.data.data.applications.map((app: any) => app.jobId._id);
      
      // Update job applied status
      setJob(prevJob => 
        prevJob ? { ...prevJob, applied: appliedJobIds.includes(jobId) } : null
      );
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const toggleSaveJob = async () => {
    if (!job) return;
    
    try {
      if (job.saved) {
        await api.delete(`/users/saved-jobs/${job.id}`);
      } else {
        await api.post(`/users/saved-jobs/${job.id}`);
      }
      setJob({ ...job, saved: !job.saved });
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const shareJob = () => {
    if (navigator.share && job) {
      navigator.share({
        title: job.title,
        text: `Check out this job opportunity at ${job.company}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleApplicationSubmit = async () => {
    if (!job || !selectedResumeId || applying) return;
    
    try {
      setApplying(true);
      
      await api.post(`/applications/${job.id}`, {
        resumeId: selectedResumeId,
        coverLetter: coverLetter || 'I am interested in this position and would like to apply.'
      });
      
      setJob({ ...job, applied: true, applicants: job.applicants + 1 });
      setShowApplicationDialog(false);
      setApplying(false);
      
      // Reset form
      setSelectedResumeId('');
      setCoverLetter('');
      
      alert('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error applying to job:', error);
      setApplying(false);
      
      const errorMessage = error.response?.data?.message || 'Failed to apply for job';
      alert(errorMessage);
    }
  };

  const openApplicationDialog = () => {
    if (resumes.length === 0) {
      alert('Please create a resume first before applying');
      navigate('/applicant/resumes');
      return;
    }
    
    // Set default resume if available
    const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
    setSelectedResumeId(defaultResume.id);
    setShowApplicationDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/applicant/jobs">Back to Jobs</Link>
          </Button>
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
                <Link to="/applicant/jobs">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Jobs
                </Link>
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
                  {job.isUrgent && (
                    <Badge variant="destructive">URGENT</Badge>
                  )}
                  {job.applied && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Applied
                    </Badge>
                  )}
                </div>
                <p className="text-xl text-muted-foreground">{job.company}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={toggleSaveJob}>
                <BookmarkIcon className={`h-4 w-4 mr-2 ${job.saved ? 'fill-current' : ''}`} />
                {job.saved ? 'Saved' : 'Save Job'}
              </Button>
              <Button variant="outline" onClick={shareJob}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Job Overview</CardTitle>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-semibold text-foreground">{job.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold text-foreground">{job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Salary</p>
                      <p className="font-semibold text-foreground">{job.salary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-semibold text-foreground">{job.experience}</p>
                    </div>
                  </div>
                </div>

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

                {job.applicationDeadline && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-500">Application Deadline:</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      Applications close on {new Date(job.applicationDeadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{job.description}</p>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <span className="text-foreground">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <span className="text-foreground">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Button */}
            {user?.role === 'applicant' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {job.applied ? (
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Application Submitted</h3>
                        <p className="text-muted-foreground mb-4">
                          Your application has been submitted successfully. We'll notify you of any updates.
                        </p>
                        <Button variant="outline" asChild className="w-full">
                          <Link to="/applicant/applications">
                            View My Applications
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={openApplicationDialog}
                            disabled={job.status !== 'active'}
                          >
                            {job.status !== 'active' ? (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Job No Longer Available
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Apply Now
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Apply for {job.title}</DialogTitle>
                            <DialogDescription>
                              Submit your application for this position at {job.company}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="resume">Select Resume</Label>
                              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a resume" />
                                </SelectTrigger>
                                <SelectContent>
                                  {resumes.map((resume) => (
                                    <SelectItem key={resume.id} value={resume.id}>
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        {resume.name}
                                        {resume.isDefault && (
                                          <Badge variant="secondary" className="text-xs">Default</Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="coverLetter">Cover Letter</Label>
                              <Textarea
                                id="coverLetter"
                                placeholder="Write a brief cover letter explaining why you're interested in this position..."
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setShowApplicationDialog(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleApplicationSubmit}
                                disabled={!selectedResumeId || applying}
                                className="flex-1"
                              >
                                {applying ? 'Submitting...' : 'Submit Application'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: 'Frontend Engineer', company: 'StartupXYZ', match: 87 },
                    { title: 'React Developer', company: 'TechFlow', match: 82 },
                    { title: 'UI Developer', company: 'DesignCorp', match: 79 }
                  ].map((similarJob, index) => (
                    <div key={index} className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                      <h4 className="font-semibold text-foreground text-sm">{similarJob.title}</h4>
                      <p className="text-muted-foreground text-xs">{similarJob.company}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">Match:</span>
                        <Badge variant="outline" className="text-xs">
                          {similarJob.match}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}