import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Eye,
  Upload,
  Plus,
  ArrowLeft,
  Edit3,
  Trash2,
  Save,
  Check,
  Calendar,
  Star,
  CloudUpload,
  X,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

interface Resume {
  id: string;
  name: string;
  type: 'uploaded' | 'created';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
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
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  skills: Array<{
    category: string;
    items: string[];
  }>;
}

export default function ResumeManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'edit' | 'preview'>('list');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/resumes');
      
      if (response.data?.data?.resumes) {
        const resumesFromApi = response.data.data.resumes;
        
        const mappedResumes = resumesFromApi.map((resume: any) => ({
          id: resume._id,
          name: resume.name,
          type: resume.type || 'created',
          fileName: resume.fileName,
          fileUrl: resume.fileUrl,
          fileSize: resume.fileSize,
          lastModified: resume.updatedAt || new Date().toISOString(),
          isDefault: resume.isDefault || false,
          status: resume.status || 'draft',
          downloadCount: resume.downloadCount || 0,
          viewCount: resume.viewCount || 0
        }));
        
        setResumes(mappedResumes);
      }
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      setError('Failed to load resumes. Please try again.');
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadFileName.trim()) {
      alert('Please provide a file name');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('name', uploadFileName.trim());
      formData.append('type', 'uploaded');
      
      await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchResumes();
      setShowUploadDialog(false);
      setUploadFileName('');
      setSelectedFile(null);
      setUploading(false);
      
      alert('Resume uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      setUploading(false);
      alert(error.response?.data?.message || 'Failed to upload resume');
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or Word document');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setUploadFileName(file.name.split('.')[0]);
      setShowUploadDialog(true);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadResume = async (resume: Resume) => {
    try {
      if (resume.type === 'uploaded' && resume.fileUrl) {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = `${api.defaults.baseURL?.replace('/api', '')}${resume.fileUrl}`;
        link.download = resume.fileName || resume.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('Download feature for created resumes will be available soon');
      }
      
      // Update download count
      await api.patch(`/resumes/${resume.id}/download`);
      setResumes(resumes.map(r => 
        r.id === resume.id 
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      ));
    } catch (error) {
      console.error('Error downloading resume:', error);
    }
  };

  const deleteResume = async (resumeId: string) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      await api.delete(`/resumes/${resumeId}`);
      setResumes(resumes.filter(r => r.id !== resumeId));
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      alert(error.response?.data?.message || 'Failed to delete resume');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Resumes</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchResumes}>Try Again</Button>
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
        onChange={onFileSelect}
        className="hidden"
      />

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
                <h1 className="text-3xl font-bold text-foreground">Resume Manager</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your professional resumes
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={triggerFileUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{resumes.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {resumes.filter(r => r.type === 'created').length}
                </p>
                <p className="text-sm text-muted-foreground">Created</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {resumes.filter(r => r.type === 'uploaded').length}
                </p>
                <p className="text-sm text-muted-foreground">Uploaded</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {resumes.filter(r => r.isDefault).length}
                </p>
                <p className="text-sm text-muted-foreground">Default</p>
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
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {resume.name}
                      </CardTitle>
                      {resume.isDefault && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline"
                        className={resume.type === 'uploaded' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}
                      >
                        {resume.type === 'uploaded' ? 'Uploaded' : 'Created'}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="bg-green-500/10 text-green-500 border-green-500/20"
                      >
                        {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
                      </Badge>
                    </div>
                    {resume.type === 'uploaded' && resume.fileSize && (
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(resume.fileSize)}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Modified {new Date(resume.lastModified).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => downloadResume(resume)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => downloadResume(resume)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteResume(resume.id)}
                      className="text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Upload Resume Card */}
          <Card className="border-dashed border-2 hover:shadow-md transition-shadow cursor-pointer" onClick={triggerFileUpload}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CloudUpload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Upload Resume</h3>
              <p className="text-sm text-muted-foreground text-center">
                Upload PDF or Word document
              </p>
            </CardContent>
          </Card>
        </div>

        {resumes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first resume to get started
              </p>
              <Button onClick={triggerFileUpload}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Provide a name for your uploaded resume
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="uploadName">Resume Name</Label>
              <Input
                id="uploadName"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="Enter resume name"
              />
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md border">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm flex-1 text-foreground">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUploadDialog(false);
                  setSelectedFile(null);
                  setUploadFileName('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleFileUpload}
                disabled={!uploadFileName.trim() || uploading}
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload Resume'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}