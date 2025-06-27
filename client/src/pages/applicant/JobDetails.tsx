import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Building2,
  Clock,
  DollarSign,
  BookmarkIcon,
  ArrowLeft,
  Users,
  Calendar,
  Share2,
  ExternalLink,
  CheckCircle,
  Star,
  AlertTriangle,
  Send,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface JobDetails {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  companySize: string;
  industry: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
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
  saved: boolean;
  applied: boolean;
  matchScore: number;
  companyRating: number;
  companyReviews: number;
  remote: boolean;
  urgent: boolean;
}

interface CompanyInfo {
  about: string;
  website: string;
  founded: string;
  employees: string;
  headquarters: string;
  culture: string[];
}

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchJobDetails(id);
    }
  }, [id]);

  const fetchJobDetails = async (jobId: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setJob({
          id: jobId,
          title: 'Senior Frontend Developer',
          company: 'TechCorp Innovation',
          companySize: '1000-5000 employees',
          industry: 'Technology',
          location: 'San Francisco, CA',
          type: 'Full-time',
          experience: '3-5 years',
          salary: '$120,000 - $160,000',
          description: `We are looking for a passionate Senior Frontend Developer to join our growing team and help build cutting-edge web applications that serve millions of users worldwide.

As a Senior Frontend Developer at TechCorp Innovation, you'll be working with the latest technologies including React, TypeScript, and modern CSS frameworks to create exceptional user experiences. You'll collaborate with our design and backend teams to deliver high-quality, scalable solutions.

This is an excellent opportunity for someone who wants to make a significant impact in a fast-growing company while working on challenging and meaningful projects.`,
          responsibilities: [
            'Develop and maintain high-quality web applications using React and TypeScript',
            'Collaborate with UX/UI designers to implement pixel-perfect designs',
            'Write clean, maintainable, and well-documented code',
            'Participate in code reviews and provide constructive feedback',
            'Optimize applications for maximum performance and scalability',
            'Mentor junior developers and contribute to team knowledge sharing',
            'Stay up-to-date with the latest frontend technologies and best practices',
            'Work closely with backend teams to integrate APIs and services'
          ],
          requirements: [
            '5+ years of experience in frontend development',
            'Expert knowledge of React.js and TypeScript',
            'Strong understanding of HTML5, CSS3, and modern JavaScript (ES6+)',
            'Experience with state management libraries (Redux, Zustand, etc.)',
            'Familiarity with modern build tools (Webpack, Vite, etc.)',
            'Knowledge of responsive design and cross-browser compatibility',
            'Experience with version control systems (Git)',
            'Strong problem-solving skills and attention to detail',
            'Excellent communication and teamwork abilities',
            'Bachelor\'s degree in Computer Science or related field (preferred)'
          ],
          benefits: [
            'Competitive salary and equity package',
            'Comprehensive health, dental, and vision insurance',
            'Flexible work arrangements and remote work options',
            '401(k) with company matching',
            'Unlimited PTO policy',
            'Professional development budget ($2,000/year)',
            'Top-tier equipment and home office setup allowance',
            'Catered meals and snacks in the office',
            'Gym membership reimbursement',
            'Annual team retreats and company events'
          ],
          skills: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Node.js', 'GraphQL', 'REST APIs', 'Git'],
          postedDate: '2024-01-15',
          applicationDeadline: '2024-02-15',
          applicants: 45,
          saved: false,
          applied: false,
          matchScore: 95,
          companyRating: 4.6,
          companyReviews: 234,
          remote: true,
          urgent: true
        });

        setCompany({
          about: 'TechCorp Innovation is a leading technology company focused on building innovative solutions that transform how people work and live. Founded in 2015, we\'ve grown from a small startup to a company serving millions of users worldwide.',
          website: 'https://techcorp.com',
          founded: '2015',
          employees: '1000-5000',
          headquarters: 'San Francisco, CA',
          culture: ['Innovation', 'Collaboration', 'Work-Life Balance', 'Diversity & Inclusion', 'Continuous Learning']
        });

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching job details:', error);
      setLoading(false);
    }
  };

  const toggleSaveJob = () => {
    if (job) {
      setJob({ ...job, saved: !job.saved });
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
      // Show toast notification here
    }
  };

  const applyToJob = async () => {
    try {
      setApplying(true);
      // TODO: Implement actual application logic
      setTimeout(() => {
        if (job) {
          setJob({ ...job, applied: true });
        }
        setApplying(false);
        // Show success notification
      }, 2000);
    } catch (error) {
      console.error('Error applying to job:', error);
      setApplying(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    if (score >= 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Expired';
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    return `${diffInDays} days left`;
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Job Not Found</h1>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/applicant/jobs')}>
            Browse Other Jobs
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
              <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
                  {job.urgent && (
                    <Badge variant="destructive" className="text-xs">
                      URGENT
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{job.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>{job.companyRating} ({job.companyReviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <ThemeToggle />
              <Button variant="outline" onClick={shareJob}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline"
                onClick={toggleSaveJob}
                className={job.saved ? 'text-primary' : ''}
              >
                <BookmarkIcon className={`h-4 w-4 mr-2 ${job.saved ? 'fill-current' : ''}`} />
                {job.saved ? 'Saved' : 'Save'}
              </Button>
              {job.applied ? (
                <Button disabled className="bg-green-500">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applied
                </Button>
              ) : (
                <Button onClick={applyToJob} disabled={applying}>
                  {applying ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                      Applying...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Apply Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            <div className="flex gap-1 mb-6 border-b border-border">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'requirements', label: 'Requirements' },
                { id: 'company', label: 'Company' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Job Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray dark:prose-invert max-w-none">
                      {job.description.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-foreground mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Responsibilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Key Responsibilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Benefits & Perks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {job.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-6">
                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Requirements & Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-foreground">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Required Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'company' && company && (
              <div className="space-y-6">
                {/* Company Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      About {job.company}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground mb-4">{company.about}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Founded</p>
                        <p className="font-semibold text-foreground">{company.founded}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Company Size</p>
                        <p className="font-semibold text-foreground">{company.employees}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Headquarters</p>
                        <p className="font-semibold text-foreground">{company.headquarters}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Industry</p>
                        <p className="font-semibold text-foreground">{job.industry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Culture */}
                <Card>
                  <CardHeader>
                    <CardTitle>Company Culture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {company.culture.map((value, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Company Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Learn More</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button variant="outline" asChild>
                        <a href={company.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Company Website
                        </a>
                      </Button>
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View All Jobs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-8">
              {/* Job Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Job Type</p>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {job.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        {job.experience}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Salary Range</p>
                    <p className="text-lg font-semibold text-foreground">{job.salary}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-semibold text-foreground">{job.location}</p>
                    {job.remote && (
                      <Badge variant="outline" className="mt-1 bg-purple-500/10 text-purple-500 border-purple-500/20">
                        Remote OK
                      </Badge>
                    )}
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
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-500">Application Deadline:</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">
                        {formatDeadline(job.applicationDeadline)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Match Score */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Match</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className={`text-3xl font-bold ${getMatchScoreColor(job.matchScore)}`}>
                      {job.matchScore}%
                    </div>
                    <p className="text-sm text-muted-foreground">Match Score</p>
                  </div>
                  <Progress value={job.matchScore} className="mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Based on your skills and experience
                  </p>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/applicant/profile">
                      Improve Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Apply */}
              {!job.applied && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-foreground mb-2">Ready to Apply?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Don't miss out on this opportunity
                      </p>
                      <Button onClick={applyToJob} disabled={applying} className="w-full">
                        {applying ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                            Applying...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Apply Now
                          </>
                        )}
                      </Button>
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
                        <p className="text-sm text-muted-foreground">{similarJob.company}</p>
                        <Badge variant="outline" className="mt-1 text-xs bg-green-500/10 text-green-500 border-green-500/20">
                          {similarJob.match}% match
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link to="/applicant/jobs">
                      View More Jobs
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}