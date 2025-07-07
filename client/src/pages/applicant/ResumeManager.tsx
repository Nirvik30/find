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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Download,
  Eye,
  Upload,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  Share2,
  Save,
  Copy,
  Check,
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

interface Resume {
  id: string;
  name: string;
  template: string;
  lastModified: string;
  isDefault: boolean;
  status: 'draft' | 'published' | 'archived';
  downloadCount: number;
  viewCount: number;
}

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    website: string;
    linkedin: string;
    github: string;
  };
  experience: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    startDate: string;
    endDate: string;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
}

export default function ResumeManager() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'edit' | 'preview'>('list');
  const [templates] = useState([
    { id: 'modern', name: 'Modern Professional', preview: '/templates/modern.png' },
    { id: 'classic', name: 'Classic Traditional', preview: '/templates/classic.png' },
    { id: 'creative', name: 'Creative Design', preview: '/templates/creative.png' },
    { id: 'minimal', name: 'Minimal Clean', preview: '/templates/minimal.png' }
  ]);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/resumes');
      const resumesFromApi = response.data.data.resumes;
      
      // Map the backend data to frontend format
      const mappedResumes = resumesFromApi.map((resume: any) => ({
        id: resume._id,
        name: resume.name,
        template: resume.template,
        lastModified: resume.updatedAt ? new Date(resume.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isDefault: resume.isDefault,
        status: resume.status,
        downloadCount: resume.downloadCount,
        viewCount: resume.viewCount
      }));
      
      setResumes(mappedResumes);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      setLoading(false);
    }
  };

  const createNewResume = () => {
    // Keep the initial creation in state
    const newResume = {
      id: 'temp-' + Date.now().toString(),
      name: 'New Resume',
      template: 'modern',
      lastModified: new Date().toISOString().split('T')[0],
      isDefault: false,
      status: 'draft',
      downloadCount: 0,
      viewCount: 0
    };
    
    setSelectedResume(newResume);
    // Initialize with the basic user info
    setResumeData({
      personalInfo: {
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        location: '',
        title: '',
        summary: '',
        website: '',
        linkedin: '',
        github: ''
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      certifications: []
    });
    setActiveView('edit');
  };

  const editResume = async (resume: Resume) => {
    try {
      setSelectedResume(resume);
      setLoading(true);
      
      // Fetch the actual resume data from the backend
      const response = await api.get(`/resumes/${resume.id}`);
      const resumeFromApi = response.data.data.resume;
      
      // Set the resume data from the API
      setResumeData({
        personalInfo: {
          name: resumeFromApi.personalInfo?.name || user?.name || '',
          email: resumeFromApi.personalInfo?.email || user?.email || '',
          phone: resumeFromApi.personalInfo?.phone || '',
          location: resumeFromApi.personalInfo?.location || '',
          title: resumeFromApi.personalInfo?.title || '',
          summary: resumeFromApi.personalInfo?.summary || '',
          website: resumeFromApi.personalInfo?.website || '',
          linkedin: resumeFromApi.personalInfo?.linkedin || '',
          github: resumeFromApi.personalInfo?.github || ''
        },
        experience: resumeFromApi.experience || [],
        education: resumeFromApi.education || [],
        skills: resumeFromApi.skills || [],
        projects: resumeFromApi.projects || [],
        certifications: resumeFromApi.certifications || []
      });
      
      setActiveView('edit');
      setLoading(false);
    } catch (error) {
      console.error('Error loading resume:', error);
      setLoading(false);
    }
  };

  const duplicateResume = (resume: Resume) => {
    const duplicated: Resume = {
      ...resume,
      id: Date.now().toString(),
      name: `${resume.name} (Copy)`,
      lastModified: new Date().toISOString().split('T')[0],
      isDefault: false,
      status: 'draft',
      downloadCount: 0,
      viewCount: 0
    };
    setResumes([duplicated, ...resumes]);
  };

  const deleteResume = async (resumeId: string) => {
    try {
      await api.delete(`/resumes/${resumeId}`);
      setResumes(resumes.filter(r => r.id !== resumeId));
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const setDefaultResume = async (resumeId: string) => {
    try {
      await api.patch(`/resumes/${resumeId}/default`);
      setResumes(resumes.map(r => ({
        ...r,
        isDefault: r.id === resumeId
      })));
    } catch (error) {
      console.error('Error setting default resume:', error);
    }
  };

  const downloadResume = async (resume: Resume, format: 'pdf' | 'docx') => {
    try {
      // First increment the download count
      await api.patch(`/resumes/${resume.id}/download`);
      
      // In a real implementation, you'd need a server endpoint that generates the PDF/DOCX
      // For now, we'll just update the download count
      setResumes(resumes.map(r => 
        r.id === resume.id 
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      ));
      
      // Mock download (in production, this would be a real file download)
      alert(`Resume ${format.toUpperCase()} would be downloaded here`);
    } catch (error) {
      console.error(`Error downloading resume as ${format}:`, error);
    }
  };

  const previewResume = async (resume: Resume) => {
    try {
      setSelectedResume(resume);
      setLoading(true);
      
      // Fetch the actual resume data for preview
      const response = await api.get(`/resumes/${resume.id}`);
      const resumeFromApi = response.data.data.resume;
      
      setResumeData({
        personalInfo: {
          name: resumeFromApi.personalInfo?.name || 'Name not provided',
          email: resumeFromApi.personalInfo?.email || 'Email not provided',
          phone: resumeFromApi.personalInfo?.phone || '',
          location: resumeFromApi.personalInfo?.location || '',
          title: resumeFromApi.personalInfo?.title || 'Title not provided',
          summary: resumeFromApi.personalInfo?.summary || 'Summary not provided',
          website: resumeFromApi.personalInfo?.website || '',
          linkedin: resumeFromApi.personalInfo?.linkedin || '',
          github: resumeFromApi.personalInfo?.github || ''
        },
        experience: resumeFromApi.experience || [],
        education: resumeFromApi.education || [],
        skills: resumeFromApi.skills || [],
        projects: resumeFromApi.projects || [],
        certifications: resumeFromApi.certifications || []
      });
      
      // Update view count
      setResumes(resumes.map(r => 
        r.id === resume.id 
          ? { ...r, viewCount: r.viewCount + 1 }
          : r
      ));
      
      setActiveView('preview');
      setLoading(false);
    } catch (error) {
      console.error('Error loading resume for preview:', error);
      setLoading(false);
    }
  };

  const saveResume = async () => {
    if (!resumeData || !selectedResume) return;
    
    try {
      setSaving(true);
      
      const resumePayload = {
        ...resumeData,
        name: selectedResume.name,
        template: selectedResume.template,
        isDefault: selectedResume.isDefault,
        status: selectedResume.status
      };
      
      let response;
      // Check if this is a new resume or an update
      if (selectedResume.id.startsWith('temp-')) {
        // Creating a new resume
        response = await api.post('/resumes', resumePayload);
        // Replace the temp ID with the real one from the server
        setSelectedResume({
          ...selectedResume,
          id: response.data.data.resume._id
        });
      } else {
        // Updating existing resume
        response = await api.patch(`/resumes/${selectedResume.id}`, resumePayload);
      }
      
      // Refresh the resumes list to show the updated data
      await fetchResumes();
      setSaving(false);
      setActiveView('list');
    } catch (error) {
      console.error('Error saving resume:', error);
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading resumes...</p>
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
                <Link to="/applicant/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {activeView === 'list' ? 'Resume Manager' : 
                   activeView === 'edit' ? 'Edit Resume' : 'Preview Resume'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {activeView === 'list' ? 'Create and manage your professional resumes' :
                   activeView === 'edit' ? 'Customize your resume content and design' :
                   'Preview how your resume will look'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              {activeView === 'list' && (
                <Button onClick={createNewResume}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Resume
                </Button>
              )}
              {activeView === 'edit' && (
                <Button onClick={saveResume} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Resume
                    </>
                  )}
                </Button>
              )}
              {activeView === 'preview' && selectedResume && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => downloadResume(selectedResume, 'pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => downloadResume(selectedResume, 'docx')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    DOCX
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Resume List View */}
        {activeView === 'list' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{resumes.length}</p>
                    <p className="text-sm text-muted-foreground">Total Resumes</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {resumes.filter(r => r.status === 'published').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {resumes.reduce((sum, r) => sum + r.downloadCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Downloads</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-500">
                      {resumes.reduce((sum, r) => sum + r.viewCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Views</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resume Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume) => (
                <Card key={resume.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-foreground mb-1">
                          {resume.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline"
                            className={getStatusColor(resume.status)}
                          >
                            {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
                          </Badge>
                          {resume.isDefault && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Template: {templates.find(t => t.id === resume.template)?.name}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Downloads</p>
                          <p className="font-semibold text-foreground">{resume.downloadCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Views</p>
                          <p className="font-semibold text-foreground">{resume.viewCount}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Modified {new Date(resume.lastModified).toLocaleDateString()}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => previewResume(resume)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => editResume(resume)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>

                      <div className="flex gap-1 pt-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => duplicateResume(resume)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => downloadResume(resume, 'pdf')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        {!resume.isDefault && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setDefaultResume(resume.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteResume(resume.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Resume Card */}
              <Card className="border-dashed border-2 hover:shadow-md transition-shadow cursor-pointer" onClick={createNewResume}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Create New Resume</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Start building a new professional resume
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Edit View */}
        {activeView === 'edit' && resumeData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Resume Content
                  </CardTitle>
                  <CardDescription>
                    Fill in your information to build your resume
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Info Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={resumeData.personalInfo.name}
                          onChange={(e) => setResumeData(prev => prev ? {
                            ...prev,
                            personalInfo: { ...prev.personalInfo, name: e.target.value }
                          } : prev)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="title">Professional Title</Label>
                        <Input
                          id="title"
                          value={resumeData.personalInfo.title}
                          onChange={(e) => setResumeData(prev => prev ? {
                            ...prev,
                            personalInfo: { ...prev.personalInfo, title: e.target.value }
                          } : prev)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <textarea
                        id="summary"
                        rows={4}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => setResumeData(prev => prev ? {
                          ...prev,
                          personalInfo: { ...prev.personalInfo, summary: e.target.value }
                        } : prev)}
                      />
                    </div>
                  </div>

                  {/* Template Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Choose Template</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`border-2 rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedResume?.template === template.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedResume(prev => prev ? {
                            ...prev,
                            template: template.id
                          } : prev)}
                        >
                          <div className="aspect-[3/4] bg-muted rounded mb-2 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-center">{template.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] border border-border rounded-lg bg-white p-4 text-black text-xs overflow-hidden">
                    <div className="space-y-2">
                      <h1 className="text-lg font-bold">{resumeData.personalInfo.name || 'Your Name'}</h1>
                      <p className="text-sm font-medium">{resumeData.personalInfo.title || 'Your Title'}</p>
                      <div className="border-t pt-2">
                        <p className="text-xs">{resumeData.personalInfo.summary || 'Your professional summary will appear here...'}</p>
                      </div>
                      {resumeData.experience.length > 0 && (
                        <div className="border-t pt-2">
                          <h2 className="text-sm font-bold mb-1">Experience</h2>
                          {resumeData.experience.slice(0, 2).map((exp, index) => (
                            <div key={index} className="mb-2">
                              <p className="text-xs font-medium">{exp.position}</p>
                              <p className="text-xs text-gray-600">{exp.company}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {resumeData.skills.length > 0 && (
                        <div className="border-t pt-2">
                          <h2 className="text-sm font-bold mb-1">Skills</h2>
                          {resumeData.skills.slice(0, 2).map((skillGroup, index) => (
                            <p key={index} className="text-xs text-gray-600 mb-1">
                              {skillGroup.category}: {skillGroup.items.slice(0, 3).join(', ')}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setActiveView('preview')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Full Preview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Preview View */}
        {activeView === 'preview' && selectedResume && resumeData && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedResume.name}</CardTitle>
                    <CardDescription>
                      Template: {templates.find(t => t.id === selectedResume.template)?.name}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveView('edit')}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-[3/4] border border-border rounded-lg bg-white p-8 text-black overflow-auto">
                  {/* Use actual resume data instead of hardcoded data */}
                  <div className="space-y-6">
                    <div className="text-center border-b pb-4">
                      <h1 className="text-3xl font-bold mb-2">{resumeData.personalInfo.name}</h1>
                      <p className="text-xl text-gray-600 mb-2">{resumeData.personalInfo.title}</p>
                      <p className="text-sm text-gray-500">
                        {resumeData.personalInfo.email} • {resumeData.personalInfo.phone} • {resumeData.personalInfo.location}
                      </p>
                    </div>

                    {resumeData.personalInfo.summary && (
                      <div>
                        <h2 className="text-xl font-bold mb-3 text-gray-800">Professional Summary</h2>
                        <p className="text-gray-700 leading-relaxed">
                          {resumeData.personalInfo.summary}
                        </p>
                      </div>
                    )}

                    {resumeData.experience.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold mb-3 text-gray-800">Experience</h2>
                        <div className="space-y-4">
                          {resumeData.experience.map((exp, index) => (
                            <div key={index}>
                              <h3 className="text-lg font-semibold">{exp.position}</h3>
                              <p className="text-gray-600 mb-1">
                                {exp.company} • {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                              </p>
                              <p className="text-gray-700 text-sm mb-2">{exp.description}</p>
                              {exp.achievements.length > 0 && (
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                  {exp.achievements.map((achievement, i) => (
                                    <li key={i}>{achievement}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.skills.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold mb-3 text-gray-800">Skills</h2>
                        <div className="grid grid-cols-2 gap-4">
                          {resumeData.skills.map((skillGroup, index) => (
                            <div key={index}>
                              <h4 className="font-semibold mb-2">{skillGroup.category}</h4>
                              <p className="text-sm text-gray-700">{skillGroup.items.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.education.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold mb-3 text-gray-800">Education</h2>
                        {resumeData.education.map((edu, index) => (
                          <div key={index}>
                            <h3 className="text-lg font-semibold">{edu.degree} in {edu.field}</h3>
                            <p className="text-gray-600">
                              {edu.institution} • {edu.startDate} - {edu.endDate}
                              {edu.gpa && ` • GPA: ${edu.gpa}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {resumeData.projects.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold mb-3 text-gray-800">Projects</h2>
                        <div className="space-y-3">
                          {resumeData.projects.map((project, index) => (
                            <div key={index}>
                              <h3 className="text-lg font-semibold">{project.name}</h3>
                              <p className="text-gray-700 text-sm mb-1">{project.description}</p>
                              <p className="text-gray-600 text-xs">
                                Technologies: {project.technologies.join(', ')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.certifications.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold mb-3 text-gray-800">Certifications</h2>
                        <div className="space-y-2">
                          {resumeData.certifications.map((cert, index) => (
                            <div key={index}>
                              <h3 className="font-semibold">{cert.name}</h3>
                              <p className="text-gray-600 text-sm">{cert.issuer} • {cert.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}