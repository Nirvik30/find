import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Include Link here
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Save,
  PlusCircle,
  X,
  AlertCircle,
  Trash,
  Eye,
  Clock,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface JobPost {
  id?: string;
  title: string;
  company: string; // Auto-filled from user profile
  location: string;
  type: string;
  experience: string;
  salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  applicationDeadline: string;
  status: 'draft' | 'active' | 'closed' | 'filled';
  isUrgent: boolean;
  postedDate?: string;
  updatedDate?: string;
}

export default function JobPostForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [newSkill, setNewSkill] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Temporary storage for list items (responsibilities, requirements, benefits)
  const [newResponsibility, setNewResponsibility] = useState<string>('');
  const [newRequirement, setNewRequirement] = useState<string>('');
  const [newBenefit, setNewBenefit] = useState<string>('');
  
  const [jobPost, setJobPost] = useState<JobPost>({
    title: '',
    company: user?.companyName || '',
    location: '',
    type: 'Full-time',
    experience: '',
    salary: '',
    description: '',
    responsibilities: [],
    requirements: [],
    benefits: [],
    skills: [],
    applicationDeadline: '',
    status: 'draft',
    isUrgent: false
  });
  
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchJobPost(id);
    } else {
      setLoading(false);
    }
  }, [id]);
  
  const fetchJobPost = async (jobId: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setJobPost({
          id: jobId,
          title: 'Senior Frontend Developer',
          company: user?.companyName || 'TechCorp Innovation',
          location: 'San Francisco, CA',
          type: 'Full-time',
          experience: '3-5 years',
          salary: '$120,000 - $160,000',
          description: 'We are looking for a passionate Senior Frontend Developer to join our growing team and help build cutting-edge web applications that serve millions of users worldwide.',
          responsibilities: [
            'Develop and maintain high-quality web applications using React and TypeScript',
            'Collaborate with UX/UI designers to implement pixel-perfect designs',
            'Write clean, maintainable, and well-documented code',
            'Participate in code reviews and provide constructive feedback'
          ],
          requirements: [
            '5+ years of experience in frontend development',
            'Expert knowledge of React.js and TypeScript',
            'Strong understanding of HTML5, CSS3, and modern JavaScript (ES6+)',
            'Experience with state management libraries (Redux, Zustand, etc.)'
          ],
          benefits: [
            'Competitive salary and equity package',
            'Comprehensive health, dental, and vision insurance',
            'Flexible work arrangements and remote work options',
            'Professional development budget'
          ],
          skills: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Redux'],
          applicationDeadline: '2024-05-30',
          status: 'active',
          isUrgent: true,
          postedDate: '2024-03-15',
          updatedDate: '2024-03-15'
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching job post:', error);
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!jobPost.title.trim()) newErrors.title = 'Job title is required';
    if (!jobPost.location.trim()) newErrors.location = 'Location is required';
    if (!jobPost.experience.trim()) newErrors.experience = 'Experience level is required';
    if (!jobPost.description.trim()) newErrors.description = 'Job description is required';
    if (jobPost.responsibilities.length === 0) newErrors.responsibilities = 'At least one responsibility is required';
    if (jobPost.requirements.length === 0) newErrors.requirements = 'At least one requirement is required';
    if (jobPost.skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (!jobPost.applicationDeadline) newErrors.applicationDeadline = 'Application deadline is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async (publish: boolean = false) => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      const jobToSave = {
        ...jobPost,
        status: publish ? 'active' : jobPost.status,
        updatedDate: new Date().toISOString(),
        postedDate: jobPost.postedDate || new Date().toISOString()
      };
      
      // TODO: Replace with actual API call
      setTimeout(() => {
        console.log('Saving job post:', jobToSave);
        setSaving(false);
        navigate('/recruiter/job-posts');
      }, 1500);
    } catch (error) {
      console.error('Error saving job post:', error);
      setSaving(false);
    }
  };
  
  const handlePublish = () => {
    handleSave(true);
  };
  
  const addListItem = (type: 'responsibilities' | 'requirements' | 'benefits', value: string) => {
    if (!value.trim()) return;
    
    setJobPost(prev => ({
      ...prev,
      [type]: [...prev[type], value.trim()]
    }));
    
    switch (type) {
      case 'responsibilities':
        setNewResponsibility('');
        break;
      case 'requirements':
        setNewRequirement('');
        break;
      case 'benefits':
        setNewBenefit('');
        break;
    }
  };
  
  const removeListItem = (type: 'responsibilities' | 'requirements' | 'benefits', index: number) => {
    setJobPost(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };
  
  const addSkill = () => {
    if (!newSkill.trim() || jobPost.skills.includes(newSkill.trim())) return;
    
    setJobPost(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill.trim()]
    }));
    setNewSkill('');
  };
  
  const removeSkill = (skill: string) => {
    setJobPost(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading job post...</p>
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
                <Link to="/recruiter/job-posts">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditing ? 'Edit Job Posting' : 'Create New Job Posting'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isEditing ? 'Update your job listing' : 'Create a new job listing to attract candidates'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
              {isEditing && jobPost.status === 'draft' && (
                <Button onClick={handlePublish} disabled={saving}>
                  {saving ? 'Publishing...' : 'Publish Job'}
                </Button>
              )}
              {(!isEditing || jobPost.status === 'draft') && (
                <Button 
                  variant={isEditing ? 'outline' : 'default'}
                  onClick={() => handleSave(false)} 
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save as Draft'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className={showPreview ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>
                  Provide essential information about the job position
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input
                      id="title"
                      value={jobPost.title}
                      onChange={(e) => setJobPost(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Senior Frontend Developer"
                      className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={jobPost.location}
                        onChange={(e) => setJobPost(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., San Francisco, CA or Remote"
                        className={errors.location ? 'border-red-500' : ''}
                      />
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="type">Job Type</Label>
                      <Select
                        value={jobPost.type}
                        onValueChange={(value) => setJobPost(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience">Experience Level</Label>
                      <Input
                        id="experience"
                        value={jobPost.experience}
                        onChange={(e) => setJobPost(prev => ({ ...prev, experience: e.target.value }))}
                        placeholder="e.g., 3-5 years"
                        className={errors.experience ? 'border-red-500' : ''}
                      />
                      {errors.experience && (
                        <p className="text-red-500 text-sm mt-1">{errors.experience}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="salary">Salary Range</Label>
                      <Input
                        id="salary"
                        value={jobPost.salary}
                        onChange={(e) => setJobPost(prev => ({ ...prev, salary: e.target.value }))}
                        placeholder="e.g., $90,000 - $120,000"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline">Application Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={jobPost.applicationDeadline}
                      onChange={(e) => setJobPost(prev => ({ ...prev, applicationDeadline: e.target.value }))}
                      className={errors.applicationDeadline ? 'border-red-500' : ''}
                    />
                    {errors.applicationDeadline && (
                      <p className="text-red-500 text-sm mt-1">{errors.applicationDeadline}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={jobPost.isUrgent}
                      onCheckedChange={(checked) => 
                        setJobPost(prev => ({ ...prev, isUrgent: checked === true }))
                      }
                    />
                    <Label htmlFor="urgent">Mark as Urgent Hiring</Label>
                  </div>
                </div>
                
                {/* Description */}
                <div>
                  <Label htmlFor="description">Job Description</Label>
                  <textarea
                    id="description"
                    rows={5}
                    className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-input'} rounded-md bg-background text-foreground resize-none`}
                    value={jobPost.description}
                    onChange={(e) => setJobPost(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a detailed description of the job position..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                  )}
                </div>
                
                {/* Responsibilities */}
                <div>
                  <Label>Key Responsibilities</Label>
                  {errors.responsibilities && (
                    <p className="text-red-500 text-sm mt-1">{errors.responsibilities}</p>
                  )}
                  <div className="space-y-2 mb-3">
                    {jobPost.responsibilities.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
                        <p className="flex-1 text-sm">{item}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeListItem('responsibilities', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      placeholder="Add a responsibility..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addListItem('responsibilities', newResponsibility);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addListItem('responsibilities', newResponsibility)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Requirements */}
                <div>
                  <Label>Requirements</Label>
                  {errors.requirements && (
                    <p className="text-red-500 text-sm mt-1">{errors.requirements}</p>
                  )}
                  <div className="space-y-2 mb-3">
                    {jobPost.requirements.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
                        <p className="flex-1 text-sm">{item}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeListItem('requirements', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addListItem('requirements', newRequirement);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addListItem('requirements', newRequirement)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Benefits */}
                <div>
                  <Label>Benefits & Perks</Label>
                  <div className="space-y-2 mb-3">
                    {jobPost.benefits.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-accent/30 rounded-md">
                        <p className="flex-1 text-sm">{item}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeListItem('benefits', index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add a benefit..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addListItem('benefits', newBenefit);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addListItem('benefits', newBenefit)}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Skills */}
                <div>
                  <Label>Required Skills</Label>
                  {errors.skills && (
                    <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {jobPost.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1">
                        {skill}
                        <button
                          type="button"
                          className="ml-2"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addSkill}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Job Post Preview */}
          {showPreview && (
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    How the job listing will appear to candidates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{jobPost.title || 'Job Title'}</h3>
                        <p className="text-sm text-muted-foreground">{jobPost.company || 'Company Name'}</p>
                      </div>
                      <div className="flex gap-1">
                        {jobPost.isUrgent && (
                          <Badge variant="destructive" className="text-xs">
                            URGENT
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-500 border-green-500/20"
                        >
                          Active
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline">{jobPost.type || 'Job Type'}</Badge>
                      <Badge variant="outline">{jobPost.experience || 'Experience'}</Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {jobPost.description || 'Job description will appear here...'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(jobPost.skills.length > 0 ? jobPost.skills : ['Skill 1', 'Skill 2']).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Deadline: {jobPost.applicationDeadline ? new Date(jobPost.applicationDeadline).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>
                      Note: This is a simplified preview. The actual posting may appear differently depending on the platform and device.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}