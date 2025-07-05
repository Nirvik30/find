import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building,
  Briefcase,
  MapPin,
  Globe,
  Users,
  Calendar,
  ImageIcon,
  Upload,
  PlusCircle,
  X,
  Save,
  Eye,
  Check,
  Heart,
  Award,
  Trash2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Github,
  Edit,
  Camera
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import api from '@/lib/api';

interface CompanyProfile {
  id: string;
  name: string;
  logo?: string;
  coverImage?: string;
  industry: string;
  website: string;
  location: string;
  size: string;
  founded: string;
  about: string;
  mission: string;
  culture: string[];
  benefits: Benefit[];
  socialMedia: SocialMedia;
  gallery: GalleryImage[];
  team: TeamMember[];
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface SocialMedia {
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  github?: string;
}

interface GalleryImage {
  id: string;
  url: string;
  caption: string;
}

interface TeamMember {
  id: string;
  name: string;
  title: string;
  avatar?: string;
}

export default function CompanyProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [preview, setPreview] = useState(false);
  
  const [companyData, setCompanyData] = useState<CompanyProfile>({
    id: '1',
    name: user?.companyName || 'TechCorp Innovation',
    logo: 'https://via.placeholder.com/150',
    coverImage: 'https://via.placeholder.com/1200x300',
    industry: 'Technology',
    website: 'https://techcorp.example.com',
    location: 'San Francisco, CA',
    size: '500-1000',
    founded: '2010',
    about: 'TechCorp is a leading technology company specializing in innovative software solutions for businesses. We help organizations transform their operations through cutting-edge technology.',
    mission: 'Our mission is to empower businesses with innovative technology solutions that drive growth and success.',
    culture: [
      'Innovation',
      'Collaboration',
      'Diversity',
      'Work-Life Balance',
      'Growth Mindset'
    ],
    benefits: [
      {
        id: '1',
        title: 'Health Insurance',
        description: 'Comprehensive health, dental, and vision coverage for employees and dependents.',
        icon: 'heart'
      },
      {
        id: '2',
        title: 'Remote Work',
        description: 'Flexible remote work options and hybrid work schedules.',
        icon: 'home'
      },
      {
        id: '3',
        title: 'Professional Development',
        description: 'Budget for conferences, courses, and learning resources.',
        icon: 'award'
      },
      {
        id: '4',
        title: 'Paid Time Off',
        description: 'Generous vacation policy and paid holidays.',
        icon: 'calendar'
      }
    ],
    socialMedia: {
      facebook: 'https://facebook.com/techcorp',
      twitter: 'https://twitter.com/techcorp',
      linkedin: 'https://linkedin.com/company/techcorp',
      github: 'https://github.com/techcorp'
    },
    gallery: [
      {
        id: '1',
        url: 'https://via.placeholder.com/600x400',
        caption: 'Our headquarters in San Francisco'
      },
      {
        id: '2',
        url: 'https://via.placeholder.com/600x400',
        caption: 'Team building event 2023'
      },
      {
        id: '3',
        url: 'https://via.placeholder.com/600x400',
        caption: 'Product launch celebration'
      }
    ],
    team: [
      {
        id: '1',
        name: 'Jane Smith',
        title: 'CEO',
        avatar: 'https://randomuser.me/api/portraits/women/24.jpg'
      },
      {
        id: '2',
        name: 'Michael Johnson',
        title: 'CTO',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        id: '3',
        name: 'Sarah Williams',
        title: 'Head of HR',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      }
    ]
  });

  const [newCultureItem, setNewCultureItem] = useState('');
  const [newBenefit, setNewBenefit] = useState({
    title: '',
    description: '',
    icon: 'star'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    fetchCompanyData();
  }, []);
  
  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/profile');
      setCompanyData(response.data.data.company);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching company data:', error);
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setSaving(false);
      }, 1500);
    } catch (error) {
      console.error('Error saving company data:', error);
      setSaving(false);
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!companyData.name.trim()) newErrors.name = 'Company name is required';
    if (!companyData.industry.trim()) newErrors.industry = 'Industry is required';
    if (!companyData.location.trim()) newErrors.location = 'Location is required';
    if (!companyData.about.trim()) newErrors.about = 'Company description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCompanyData(prev => ({ ...prev, logo: imageUrl }));
    }
  };
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCompanyData(prev => ({ ...prev, coverImage: imageUrl }));
    }
  };
  
  const addCultureItem = () => {
    if (!newCultureItem.trim() || companyData.culture.includes(newCultureItem.trim())) return;
    
    setCompanyData(prev => ({
      ...prev,
      culture: [...prev.culture, newCultureItem.trim()]
    }));
    setNewCultureItem('');
  };
  
  const removeCultureItem = (item: string) => {
    setCompanyData(prev => ({
      ...prev,
      culture: prev.culture.filter(i => i !== item)
    }));
  };
  
  const addBenefit = () => {
    if (!newBenefit.title.trim() || !newBenefit.description.trim()) return;
    
    const benefit = {
      id: `new-${Date.now()}`,
      title: newBenefit.title,
      description: newBenefit.description,
      icon: newBenefit.icon
    };
    
    setCompanyData(prev => ({
      ...prev,
      benefits: [...prev.benefits, benefit]
    }));
    
    setNewBenefit({
      title: '',
      description: '',
      icon: 'star'
    });
  };
  
  const removeBenefit = (id: string) => {
    setCompanyData(prev => ({
      ...prev,
      benefits: prev.benefits.filter(b => b.id !== id)
    }));
  };
  
  const addTeamMember = () => {
    const newTeamMember = {
      id: `new-${Date.now()}`,
      name: 'New Team Member',
      title: 'Position',
      avatar: undefined
    };
    
    setCompanyData(prev => ({
      ...prev,
      team: [...prev.team, newTeamMember]
    }));
  };
  
  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      team: prev.team.map(member => 
        member.id === id ? { ...member, [field]: value } : member
      )
    }));
  };
  
  const removeTeamMember = (id: string) => {
    setCompanyData(prev => ({
      ...prev,
      team: prev.team.filter(member => member.id !== id)
    }));
  };
  
  const getBenefitIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="h-5 w-5" />;
      case 'award': return <Award className="h-5 w-5" />;
      case 'users': return <Users className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Heart className="h-5 w-5" />;
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'github': return <Github className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading company profile...</p>
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
                <h1 className="text-3xl font-bold text-foreground">Company Profile</h1>
                <p className="text-muted-foreground mt-1">
                  Manage how your company appears to job seekers
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Button 
                variant="outline" 
                onClick={() => setPreview(!preview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {preview ? 'Exit Preview' : 'Preview'}
              </Button>
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
        </div>
      </div>

      {preview ? (
        /* Preview Mode - How applicants see your company */
        <div className="container mx-auto px-6 py-8">
          {/* Cover Image */}
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-8">
            <img 
              src={companyData.coverImage || 'https://via.placeholder.com/1200x300'} 
              alt={companyData.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-6 flex items-end">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-white rounded-lg overflow-hidden border-4 border-background">
                  <img 
                    src={companyData.logo || 'https://via.placeholder.com/150'} 
                    alt={companyData.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-white">
                  <h1 className="text-3xl font-bold">{companyData.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="secondary">{companyData.industry}</Badge>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{companyData.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{companyData.size} employees</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About {companyData.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-line">{companyData.about}</p>
                  
                  <div className="mt-6">
                    <h3 className="font-medium text-lg mb-2">Our Mission</h3>
                    <p className="text-foreground whitespace-pre-line">{companyData.mission}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Company Culture */}
              <Card>
                <CardHeader>
                  <CardTitle>Our Culture</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">
                    The values that define how we work and what we believe in
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {companyData.culture.map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {companyData.benefits.map((benefit) => (
                      <div key={benefit.id} className="flex gap-3">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                          {getBenefitIcon(benefit.icon)}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team */}
              <Card>
                <CardHeader>
                  <CardTitle>Our Leadership Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {companyData.team.map((member) => (
                      <div key={member.id} className="text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3">
                          {member.avatar ? (
                            <img 
                              src={member.avatar} 
                              alt={member.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-foreground">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.title}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Gallery */}
              <Card>
                <CardHeader>
                  <CardTitle>Life at {companyData.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {companyData.gallery.map((image) => (
                      <div key={image.id} className="relative rounded-lg overflow-hidden aspect-video">
                        <img 
                          src={image.url} 
                          alt={image.caption} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-black/60 p-2">
                          <p className="text-xs text-white">{image.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              {/* Company Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Website</p>
                      <a 
                        href={companyData.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline"
                      >
                        {companyData.website.replace(/(^\w+:|^)\/\//, '')}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-foreground">{companyData.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Company Size</p>
                      <p className="text-foreground">{companyData.size} employees</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="text-foreground">{companyData.founded}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect With Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(companyData.socialMedia).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a 
                          key={platform} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
                        >
                          {getSocialIcon(platform)}
                          <span className="capitalize">{platform}</span>
                        </a>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode - For recruiters to update the company profile */
        <div className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto">
              <TabsTrigger value="overview" className="py-2">Overview</TabsTrigger>
              <TabsTrigger value="culture" className="py-2">Culture</TabsTrigger>
              <TabsTrigger value="benefits" className="py-2">Benefits</TabsTrigger>
              <TabsTrigger value="team" className="py-2">Team</TabsTrigger>
              <TabsTrigger value="gallery" className="py-2">Gallery</TabsTrigger>
              <TabsTrigger value="social" className="py-2">Social</TabsTrigger>
            </TabsList>
            
            {/* Overview */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Company Information</CardTitle>
                  <CardDescription>
                    Basic details about your company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo and Cover Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <Label className="block mb-2">Company Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden border border-border">
                          {companyData.logo ? (
                            <img 
                              src={companyData.logo} 
                              alt="Company Logo" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            <Camera className="h-5 w-5 mr-1" />
                            Change
                          </button>
                          <input 
                            type="file" 
                            ref={logoInputRef} 
                            onChange={handleLogoChange}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Upload a logo (square format recommended)</p>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Logo
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block mb-2">Cover Image</Label>
                      <div className="relative h-32 bg-muted rounded-lg overflow-hidden border border-border">
                        {companyData.coverImage ? (
                          <img 
                            src={companyData.coverImage} 
                            alt="Cover Image" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Camera className="h-5 w-5 mr-1" />
                          Change
                        </button>
                        <input 
                          type="file" 
                          ref={coverInputRef} 
                          onChange={handleCoverChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 mb-2">Upload a cover image (recommended size: 1200x300)</p>
                      <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Cover
                      </Button>
                    </div>
                  </div>
                  
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input 
                        id="company-name"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input 
                          id="industry"
                          value={companyData.industry}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, industry: e.target.value }))}
                          className={errors.industry ? 'border-red-500' : ''}
                        />
                        {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
                      </div>
                      
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location"
                          value={companyData.location}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, location: e.target.value }))}
                          className={errors.location ? 'border-red-500' : ''}
                        />
                        {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input 
                          id="website"
                          value={companyData.website}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="founded">Founded Year</Label>
                        <Input 
                          id="founded"
                          value={companyData.founded}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, founded: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="size">Company Size</Label>
                      <Input 
                        id="size"
                        value={companyData.size}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, size: e.target.value }))}
                        placeholder="e.g., 50-100, 100-500, etc."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>About & Mission</CardTitle>
                  <CardDescription>
                    Describe your company and mission
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="about">About the Company</Label>
                    <Textarea 
                      id="about"
                      value={companyData.about}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, about: e.target.value }))}
                      rows={6}
                      className={errors.about ? 'border-red-500' : ''}
                    />
                    {errors.about && <p className="text-red-500 text-sm mt-1">{errors.about}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="mission">Company Mission</Label>
                    <Textarea 
                      id="mission"
                      value={companyData.mission}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, mission: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Culture */}
            <TabsContent value="culture" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Culture</CardTitle>
                  <CardDescription>
                    Define your company culture and values
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="block mb-2">Culture & Values</Label>
                    <div className="flex flex-wrap gap-2 border border-border rounded-lg p-4 mb-4">
                      {companyData.culture.map((item, index) => (
                        <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                          {item}
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 hover:bg-transparent"
                            onClick={() => removeCultureItem(item)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                      {companyData.culture.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">
                          No culture values added yet. Add your first one below.
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        value={newCultureItem}
                        onChange={(e) => setNewCultureItem(e.target.value)}
                        placeholder="Add a culture value (e.g., Innovation, Teamwork)"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCultureItem();
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        onClick={addCultureItem}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Benefits */}
            <TabsContent value="benefits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Perks</CardTitle>
                  <CardDescription>
                    Add benefits and perks offered to employees
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Existing Benefits */}
                  <div className="space-y-4">
                    {companyData.benefits.map((benefit) => (
                      <div 
                        key={benefit.id}
                        className="flex gap-3 border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center flex-shrink-0">
                          {getBenefitIcon(benefit.icon)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">{benefit.title}</h3>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                            </div>
                            <Button 
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBenefit(benefit.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {companyData.benefits.length === 0 && (
                      <div className="text-center p-6 border border-dashed border-border rounded-lg">
                        <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-foreground mb-1">No benefits added yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add your first benefit below to showcase what your company offers
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Add New Benefit */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Benefit</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="benefit-title">Benefit Title</Label>
                        <Input 
                          id="benefit-title"
                          value={newBenefit.title}
                          onChange={(e) => setNewBenefit(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Health Insurance, Remote Work"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="benefit-description">Description</Label>
                        <Textarea 
                          id="benefit-description"
                          value={newBenefit.description}
                          onChange={(e) => setNewBenefit(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe this benefit"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label className="block mb-2">Icon</Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button"
                            variant={newBenefit.icon === 'heart' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewBenefit(prev => ({ ...prev, icon: 'heart' }))}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button"
                            variant={newBenefit.icon === 'award' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewBenefit(prev => ({ ...prev, icon: 'award' }))}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button"
                            variant={newBenefit.icon === 'users' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewBenefit(prev => ({ ...prev, icon: 'users' }))}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button 
                            type="button"
                            variant={newBenefit.icon === 'calendar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setNewBenefit(prev => ({ ...prev, icon: 'calendar' }))}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        type="button"
                        onClick={addBenefit}
                        disabled={!newBenefit.title.trim() || !newBenefit.description.trim()}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Benefit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Team */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Leadership Team</CardTitle>
                  <CardDescription>
                    Showcase your company leadership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companyData.team.map((member) => (
                      <div 
                        key={member.id}
                        className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4">
                            {member.avatar ? (
                              <img 
                                src={member.avatar} 
                                alt={member.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Users className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <button 
                              type="button"
                              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                              <Camera className="h-5 w-5" />
                            </button>
                          </div>
                          
                          <Input 
                            value={member.name}
                            onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                            placeholder="Name"
                            className="mb-2 text-center"
                          />
                          
                          <Input 
                            value={member.title}
                            onChange={(e) => updateTeamMember(member.id, 'title', e.target.value)}
                            placeholder="Title/Position"
                            className="text-center mb-4"
                          />
                          
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTeamMember(member.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Team Member Card */}
                    <div 
                      className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={addTeamMember}
                    >
                      <PlusCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Add Team Member</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Gallery */}
            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Gallery</CardTitle>
                  <CardDescription>
                    Show off your office space and company events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {companyData.gallery.map((image) => (
                      <div key={image.id} className="relative rounded-lg overflow-hidden border border-border">
                        <div className="aspect-video bg-muted">
                          <img 
                            src={image.url} 
                            alt={image.caption} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <Input 
                            value={image.caption}
                            onChange={(e) => {
                              setCompanyData(prev => ({
                                ...prev,
                                gallery: prev.gallery.map(img => 
                                  img.id === image.id 
                                    ? { ...img, caption: e.target.value } 
                                    : img
                                )
                              }));
                            }}
                            placeholder="Image caption"
                            className="text-sm mb-2"
                          />
                          
                          <Button 
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 w-full"
                            onClick={() => {
                              setCompanyData(prev => ({
                                ...prev,
                                gallery: prev.gallery.filter(img => img.id !== image.id)
                              }));
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Image Card */}
                    <div 
                      className="aspect-video border border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent/30 transition-colors p-4"
                      onClick={() => {
                        setCompanyData(prev => ({
                          ...prev,
                          gallery: [...prev.gallery, {
                            id: `new-${Date.now()}`,
                            url: 'https://via.placeholder.com/600x400',
                            caption: 'New image'
                          }]
                        }));
                      }}
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-center">Upload New Image</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Social */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Profiles</CardTitle>
                  <CardDescription>
                    Connect your company social media accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <Label htmlFor="facebook" className="sr-only">Facebook</Label>
                        <Input 
                          id="facebook"
                          value={companyData.socialMedia.facebook || ''}
                          onChange={(e) => setCompanyData(prev => ({
                            ...prev,
                            socialMedia: {
                              ...prev.socialMedia,
                              facebook: e.target.value
                            }
                          }))}
                          placeholder="Facebook URL"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      <div className="flex-1">
                        <Label htmlFor="twitter" className="sr-only">Twitter</Label>
                        <Input 
                          id="twitter"
                          value={companyData.socialMedia.twitter || ''}
                          onChange={(e) => setCompanyData(prev => ({
                            ...prev,
                            socialMedia: {
                              ...prev.socialMedia,
                              twitter: e.target.value
                            }
                          }))}
                          placeholder="Twitter URL"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      <div className="flex-1">
                        <Label htmlFor="linkedin" className="sr-only">LinkedIn</Label>
                        <Input 
                          id="linkedin"
                          value={companyData.socialMedia.linkedin || ''}
                          onChange={(e) => setCompanyData(prev => ({
                            ...prev,
                            socialMedia: {
                              ...prev.socialMedia,
                              linkedin: e.target.value
                            }
                          }))}
                          placeholder="LinkedIn URL"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Instagram className="h-5 w-5 text-pink-600" />
                      <div className="flex-1">
                        <Label htmlFor="instagram" className="sr-only">Instagram</Label>
                        <Input 
                          id="instagram"
                          value={companyData.socialMedia.instagram || ''}
                          onChange={(e) => setCompanyData(prev => ({
                            ...prev,
                            socialMedia: {
                              ...prev.socialMedia,
                              instagram: e.target.value
                            }
                          }))}
                          placeholder="Instagram URL"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Github className="h-5 w-5" />
                      <div className="flex-1">
                        <Label htmlFor="github" className="sr-only">GitHub</Label>
                        <Input 
                          id="github"
                          value={companyData.socialMedia.github || ''}
                          onChange={(e) => setCompanyData(prev => ({
                            ...prev,
                            socialMedia: {
                              ...prev.socialMedia,
                              github: e.target.value
                            }
                          }))}
                          placeholder="GitHub URL"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}