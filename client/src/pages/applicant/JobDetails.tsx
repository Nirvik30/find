import { useState, useEffect, useRef } from 'react';
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
  FileText,
  Upload,
  X
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
  type: 'uploaded' | 'created';
  isDefault: boolean;
  fileName?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  file: File;
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails(id);
      fetchResumes();
    }
  }, [id]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      
      // First get applications to check if user has already applied
      const applicationsResponse = await api.get('/applications/my-applications');
      const applications = applicationsResponse.data.data.applications;
      const appliedToThisJob = applications.some((app: any) => app.jobId._id === jobId);
      
      // Get saved jobs to check if this job is saved
      let isSaved = false;
      try {
        const savedResponse = await api.get('/users/saved-jobs');
        const savedJobs = savedResponse.data.data.savedJobs;
        isSaved = savedJobs.some((job: any) => job._id === jobId);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
      
      // Now get job details
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
        saved: isSaved,
        applied: appliedToThisJob
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
        type: resume.type || 'created',
        isDefault: resume.isDefault,
        fileName: resume.fileName
      })));
    } catch (error) {
      console.error('Error fetching resumes:', error);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    // Clear existing files - we only want one resume
    setUploadedFiles([]);
    
    // Get the first file only (single resume)
    const file = files[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload PDF or Word documents only');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    // Add the file to state
    setUploadedFiles([{
      id: Date.now().toString(),
      name: file.name,
      file
    }]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleApplicationSubmit = async () => {
    if (!job || (uploadedFiles.length === 0) || applying) return;
    
    try {
      setApplying(true);
      
      const formData = new FormData();
      formData.append('coverLetter', coverLetter || 'I am interested in this position.');
      
      // Add uploaded files
      uploadedFiles.forEach((uploadedFile) => {
        formData.append('documents', uploadedFile.file);
      });
      
      // Submit application
      await api.post(`/applications/${job.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update local state to reflect application was successful
      setJob({ ...job, applied: true, applicants: job.applicants + 1 });
      setShowApplicationDialog(false);
      setApplying(false);
      
      // Reset form
      setCoverLetter('');
      setUploadedFiles([]);
      
      alert('Application submitted successfully!');
    } catch (error: any) {
      console.error('Error applying to job:', error);
      setApplying(false);
      
      const errorMessage = error.response?.data?.message || 'Failed to apply for job';
      alert(errorMessage);
    }
  };

  const openApplicationDialog = () => {
    if (resumes.length === 0 && uploadedFiles.length === 0) {
      alert('Please create a resume or upload documents before applying');
      navigate('/applicant/resumes');
      return;
    }
    
    // Set default resume if available
    const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
    if (defaultResume) {
      setSelectedResumeId(defaultResume.id);
    }
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

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
                <CardTitle>Job Overview</CardTitle>
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
                          Your application has been submitted successfully.
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
                        <DialogContent className="sm:max-w-[600px] bg-background border border-border">
                          <DialogHeader>
                            <DialogTitle className="text-xl">Apply for {job.title}</DialogTitle>
                            <DialogDescription className="text-base">
                              Submit your application for this position at {job.company}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Upload Resume */}
                            <div className="space-y-2">
                              <Label htmlFor="resume" className="text-sm font-medium">Upload Resume *</Label>
                              <div className="border-2 border-dashed border-border rounded-lg p-4 bg-background">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full"
                                  size="sm"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Resume
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                  PDF or Word documents, max 5MB
                                </p>
                              </div>
                              
                              {/* Uploaded Files List */}
                              {uploadedFiles.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <Label className="text-sm font-medium">Uploaded Resume:</Label>
                                  {uploadedFiles.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-foreground">{file.name}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeUploadedFile(file.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Cover Letter */}
                            <div className="space-y-2">
                              <Label htmlFor="coverLetter" className="text-sm font-medium">Additional Message (Optional)</Label>
                              <Textarea
                                id="coverLetter"
                                placeholder="Write a brief message about why you're interested in this position..."
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                rows={4}
                                className="resize-none bg-background"
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setShowApplicationDialog(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleApplicationSubmit}
                                disabled={uploadedFiles.length === 0 || applying}
                                className="flex-1"
                              >
                                {applying ? (
                                  <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Application
                                  </>
                                )}
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
          </div>
        </div>
      </div>
    </div>
  );
}