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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Globe,
  Github,
  Linkedin,
  Upload,
  Save,
  ArrowLeft,
  Plus,
  X,
  Edit3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface ProfileData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    bio: string;
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
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }[];
  skills: string[];
  preferences: {
    jobType: string[];
    salaryMin: string;
    salaryMax: string;
    remoteWork: boolean;
    travelWillingness: string;
  };
}

export default function ProfileManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [newSkill, setNewSkill] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(65);

  const [profile, setProfile] = useState<ProfileData>({
    personalInfo: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      location: '',
      title: '',
      bio: '',
      website: '',
      linkedin: '',
      github: ''
    },
    experience: [],
    education: [],
    skills: [],
    preferences: {
      jobType: [],
      salaryMin: '',
      salaryMax: '',
      remoteWork: false,
      travelWillingness: 'none'
    }
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setProfile({
          personalInfo: {
            name: user?.name || 'John Doe',
            email: user?.email || 'john@example.com',
            phone: '+1 (555) 123-4567',
            location: 'San Francisco, CA',
            title: 'Senior Frontend Developer',
            bio: 'Passionate developer with 5+ years of experience in React and TypeScript. Love building user-friendly applications.',
            website: 'https://johndoe.dev',
            linkedin: 'https://linkedin.com/in/johndoe',
            github: 'https://github.com/johndoe'
          },
          experience: [
            {
              id: '1',
              company: 'TechCorp Inc.',
              position: 'Senior Frontend Developer',
              startDate: '2022-01',
              endDate: '',
              current: true,
              description: 'Leading frontend development for web applications using React, TypeScript, and modern tools.'
            },
            {
              id: '2',
              company: 'StartupXYZ',
              position: 'Frontend Developer',
              startDate: '2020-06',
              endDate: '2021-12',
              current: false,
              description: 'Developed responsive web applications and collaborated with design team.'
            }
          ],
          education: [
            {
              id: '1',
              institution: 'University of California',
              degree: 'Bachelor of Science',
              field: 'Computer Science',
              startDate: '2016-09',
              endDate: '2020-05',
              current: false
            }
          ],
          skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'Git', 'AWS'],
          preferences: {
            jobType: ['Full-time', 'Remote'],
            salaryMin: '120000',
            salaryMax: '180000',
            remoteWork: true,
            travelWillingness: 'occasionally'
          }
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setSaving(false);
        // Show success message
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: ''
    };
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: string, field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Edit3 },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ];

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
                <h1 className="text-3xl font-bold text-foreground">Profile Management</h1>
                <p className="text-muted-foreground mt-1">
                  Keep your profile updated to attract better opportunities
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Profile Completion */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Profile Completion</span>
              <span className="text-sm text-muted-foreground">{profileCompletion}%</span>
            </div>
            <Progress value={profileCompletion} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Personal Information */}
            {activeTab === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.personalInfo.name}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.personalInfo.email}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, email: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profile.personalInfo.phone}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={profile.personalInfo.location}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, location: e.target.value }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Senior Frontend Developer"
                      value={profile.personalInfo.title}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, title: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      rows={4}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
                      placeholder="Tell us about yourself..."
                      value={profile.personalInfo.bio}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, bio: e.target.value }
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={profile.personalInfo.website}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, website: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={profile.personalInfo.linkedin}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="github">GitHub</Label>
                      <Input
                        id="github"
                        placeholder="https://github.com/username"
                        value={profile.personalInfo.github}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          personalInfo: { ...prev.personalInfo, github: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {activeTab === 'experience' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        Work Experience
                      </CardTitle>
                      <CardDescription>
                        Add your professional experience and achievements
                      </CardDescription>
                    </div>
                    <Button onClick={addExperience} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profile.experience.map((exp, index) => (
                    <div key={exp.id} className="border border-border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Experience {index + 1}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <Label>Position</Label>
                          <Input
                            value={exp.position}
                            onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                            placeholder="Job title"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            disabled={exp.current}
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <input
                            type="checkbox"
                            id={`current-${exp.id}`}
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)}
                            className="rounded"
                          />
                          <Label htmlFor={`current-${exp.id}`}>Current role</Label>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <textarea
                          rows={3}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                          placeholder="Describe your role and achievements..."
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {activeTab === 'skills' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    Skills & Technologies
                  </CardTitle>
                  <CardDescription>
                    Add your technical skills and expertise
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill (e.g., React, Python, etc.)"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button onClick={addSkill}>Add</Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {profile.skills.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">
                      No skills added yet. Add your first skill above!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Job Preferences */}
            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Job Preferences
                  </CardTitle>
                  <CardDescription>
                    Set your job search preferences and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Preferred Job Types</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote'].map((type) => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={profile.preferences.jobType.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfile(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    jobType: [...prev.preferences.jobType, type]
                                  }
                                }));
                              } else {
                                setProfile(prev => ({
                                  ...prev,
                                  preferences: {
                                    ...prev.preferences,
                                    jobType: prev.preferences.jobType.filter(t => t !== type)
                                  }
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salaryMin">Minimum Salary ($)</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={profile.preferences.salaryMin}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, salaryMin: e.target.value }
                        }))}
                        placeholder="80000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salaryMax">Maximum Salary ($)</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={profile.preferences.salaryMax}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, salaryMax: e.target.value }
                        }))}
                        placeholder="150000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Travel Willingness</Label>
                    <Select
                      value={profile.preferences.travelWillingness}
                      onValueChange={(value) => setProfile(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, travelWillingness: value }
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No travel</SelectItem>
                        <SelectItem value="occasionally">Occasionally (1-2 times/month)</SelectItem>
                        <SelectItem value="frequently">Frequently (Weekly)</SelectItem>
                        <SelectItem value="extensive">Extensive travel (50%+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remoteWork"
                      checked={profile.preferences.remoteWork}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, remoteWork: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <Label htmlFor="remoteWork">Open to remote work</Label>
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