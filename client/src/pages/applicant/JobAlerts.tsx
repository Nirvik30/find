import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Bell,
  Search,
  Plus,
  Filter,
  Trash2,
  Edit,
  BellRing,
  Clock,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Briefcase,
  DollarSign,
  X,
  CheckCircle,
  AlertCircle,
  Zap,
  Settings,
  GraduationCap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface JobAlert {
  id: string;
  name: string;
  keywords: string[];
  locations: string[];
  jobTypes: string[];
  experienceLevels: string[];
  minSalary?: number;
  frequency: 'daily' | 'weekly' | 'instant';
  notificationMethod: 'email' | 'push' | 'both';
  active: boolean;
  createdAt: string;
  lastSent?: string;
  jobCount?: number;
}

interface NewAlertForm {
  name: string;
  keywords: string;
  locations: string;
  jobTypes: string[];
  experienceLevels: string[];
  minSalary: string;
  frequency: 'daily' | 'weekly' | 'instant';
  notificationMethod: 'email' | 'push' | 'both';
}

export default function JobAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [alertToEdit, setAlertToEdit] = useState<JobAlert | null>(null);
  
  const [newAlert, setNewAlert] = useState<NewAlertForm>({
    name: '',
    keywords: '',
    locations: '',
    jobTypes: ['Full-time'],
    experienceLevels: [],
    minSalary: '',
    frequency: 'daily',
    notificationMethod: 'email',
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setAlerts([
          {
            id: '1',
            name: 'React Developer',
            keywords: ['React', 'Frontend', 'JavaScript'],
            locations: ['Remote', 'San Francisco, CA'],
            jobTypes: ['Full-time', 'Contract'],
            experienceLevels: ['Mid Level', 'Senior'],
            minSalary: 95000,
            frequency: 'daily',
            notificationMethod: 'email',
            active: true,
            createdAt: '2024-01-10',
            lastSent: '2024-01-25',
            jobCount: 7
          },
          {
            id: '2',
            name: 'UI/UX Designer',
            keywords: ['UI', 'UX', 'Figma', 'Design'],
            locations: ['New York, NY'],
            jobTypes: ['Full-time'],
            experienceLevels: ['Junior', 'Mid Level'],
            minSalary: 80000,
            frequency: 'weekly',
            notificationMethod: 'both',
            active: true,
            createdAt: '2024-01-12',
            lastSent: '2024-01-22',
            jobCount: 3
          },
          {
            id: '3',
            name: 'Full Stack Developer',
            keywords: ['Full Stack', 'Node.js', 'JavaScript', 'React'],
            locations: ['Remote'],
            jobTypes: ['Full-time', 'Contract'],
            experienceLevels: ['Mid Level'],
            frequency: 'instant',
            notificationMethod: 'push',
            active: false,
            createdAt: '2024-01-05',
            lastSent: '2024-01-20',
            jobCount: 0
          },
          {
            id: '4',
            name: 'Software Engineer',
            keywords: ['Software Engineer', 'Backend', 'Java', 'Spring'],
            locations: ['Austin, TX', 'Dallas, TX'],
            jobTypes: ['Full-time'],
            experienceLevels: ['Senior'],
            minSalary: 120000,
            frequency: 'daily',
            notificationMethod: 'email',
            active: true,
            createdAt: '2024-01-15',
            lastSent: '2024-01-25',
            jobCount: 12
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const createAlert = () => {
    // Convert form fields to JobAlert structure
    const keywordsArray = newAlert.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
      
    const locationsArray = newAlert.locations
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const alert: JobAlert = {
      id: `alert-${Date.now()}`,
      name: newAlert.name,
      keywords: keywordsArray,
      locations: locationsArray,
      jobTypes: newAlert.jobTypes,
      experienceLevels: newAlert.experienceLevels,
      minSalary: newAlert.minSalary ? parseInt(newAlert.minSalary) : undefined,
      frequency: newAlert.frequency,
      notificationMethod: newAlert.notificationMethod,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
      jobCount: 0
    };

    setAlerts([alert, ...alerts]);
    resetNewAlertForm();
  };

  const updateAlert = () => {
    if (!alertToEdit) return;
    
    setAlerts(alerts.map(alert => 
      alert.id === alertToEdit.id ? alertToEdit : alert
    ));
    
    setAlertToEdit(null);
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const toggleAlertStatus = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };

  const resetNewAlertForm = () => {
    setNewAlert({
      name: '',
      keywords: '',
      locations: '',
      jobTypes: ['Full-time'],
      experienceLevels: [],
      minSalary: '',
      frequency: 'daily',
      notificationMethod: 'email'
    });
  };

  const prepareAlertForEdit = (alert: JobAlert) => {
    setAlertToEdit(alert);
  };

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case 'instant':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'daily':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'weekly':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'instant':
        return 'Instant';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      default:
        return frequency;
    }
  };

  const getNotificationIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      case 'both':
        return <BellRing className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      !searchTerm || 
      alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())) ||
      alert.locations.some(location => location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && alert.active) || 
      (statusFilter === 'inactive' && !alert.active);
    
    const matchesFrequency = 
      frequencyFilter === 'all' || 
      alert.frequency === frequencyFilter;
    
    return matchesSearch && matchesStatus && matchesFrequency;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading job alerts...</p>
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
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/applicant/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Job Alerts</h1>
                <p className="text-muted-foreground mt-1">
                  Get notified when new jobs match your criteria
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ThemeToggle />
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Job Alert</DialogTitle>
                    <DialogDescription>
                      Set up notifications for new jobs matching your criteria
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="alert-name">Alert Name</Label>
                      <Input
                        id="alert-name"
                        value={newAlert.name}
                        onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                        placeholder="e.g. Senior React Developer"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="keywords">Keywords</Label>
                      <Input
                        id="keywords"
                        value={newAlert.keywords}
                        onChange={(e) => setNewAlert({ ...newAlert, keywords: e.target.value })}
                        placeholder="React, Frontend, JavaScript (comma separated)"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Jobs will match if they contain any of these keywords
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="locations">Locations</Label>
                      <Input
                        id="locations"
                        value={newAlert.locations}
                        onChange={(e) => setNewAlert({ ...newAlert, locations: e.target.value })}
                        placeholder="Remote, New York, San Francisco (comma separated)"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Job Types</Label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {['Full-time', 'Part-time', 'Contract', 'Remote'].map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`jobType-${type}`}
                              checked={newAlert.jobTypes.includes(type)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewAlert({
                                    ...newAlert,
                                    jobTypes: [...newAlert.jobTypes, type]
                                  });
                                } else {
                                  setNewAlert({
                                    ...newAlert,
                                    jobTypes: newAlert.jobTypes.filter(t => t !== type)
                                  });
                                }
                              }}
                            />
                            <label 
                              htmlFor={`jobType-${type}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Experience Levels</Label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {['Entry Level', 'Junior', 'Mid Level', 'Senior'].map((level) => (
                          <div key={level} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`expLevel-${level}`}
                              checked={newAlert.experienceLevels.includes(level)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewAlert({
                                    ...newAlert,
                                    experienceLevels: [...newAlert.experienceLevels, level]
                                  });
                                } else {
                                  setNewAlert({
                                    ...newAlert,
                                    experienceLevels: newAlert.experienceLevels.filter(l => l !== level)
                                  });
                                }
                              }}
                            />
                            <label 
                              htmlFor={`expLevel-${level}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {level}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="min-salary">Minimum Salary (Optional)</Label>
                      <Input
                        id="min-salary"
                        value={newAlert.minSalary}
                        onChange={(e) => setNewAlert({ ...newAlert, minSalary: e.target.value })}
                        placeholder="e.g. 100000"
                        className="mt-1"
                        type="number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frequency">Alert Frequency</Label>
                        <Select 
                          value={newAlert.frequency}
                          onValueChange={(value: 'daily' | 'weekly' | 'instant') => setNewAlert({ ...newAlert, frequency: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">Instant</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notification-method">Notification Method</Label>
                        <Select 
                          value={newAlert.notificationMethod}
                          onValueChange={(value: 'email' | 'push' | 'both') => setNewAlert({ ...newAlert, notificationMethod: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="push">Push</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={createAlert}
                      disabled={!newAlert.name || !newAlert.keywords || newAlert.jobTypes.length === 0}
                    >
                      Create Alert
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search alerts by name, keyword, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select 
                    value={statusFilter} 
                    onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Frequency</label>
                  <Select 
                    value={frequencyFilter} 
                    onValueChange={setFrequencyFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All frequencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Frequencies</SelectItem>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter('all');
                      setFrequencyFilter('all');
                      setSearchTerm('');
                    }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-4">
              <p className="text-muted-foreground">
                {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Alert Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{alert.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={getFrequencyBadge(alert.frequency)}
                          >
                            {getFrequencyLabel(alert.frequency)}
                          </Badge>
                          <Badge variant={alert.active ? "outline" : "secondary"}>
                            {alert.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Alert</DialogTitle>
                            </DialogHeader>
                            {/* Edit Alert form */}
                            <div className="py-4">
                              <Label>Alert Name</Label>
                              <Input 
                                value={alertToEdit?.name || ''}
                                onChange={(e) => alertToEdit && setAlertToEdit({
                                  ...alertToEdit,
                                  name: e.target.value
                                })}
                                className="mb-4 mt-1"
                              />
                              
                              {/* Add other edit fields as needed */}
                              
                              <div className="flex justify-between mt-4">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setAlertToEdit(null)}
                                >
                                  Cancel
                                </Button>
                                <Button onClick={updateAlert}>
                                  Save Changes
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => deleteAlert(alert.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Keywords */}
                    {alert.keywords.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Keywords:</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.keywords.map((keyword, index) => (
                            <Badge key={index} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Locations */}
                    {alert.locations.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Locations:</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.locations.map((location, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Types & Experience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Job Types:</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.jobTypes.map((type, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {alert.experienceLevels.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Experience:</p>
                          <div className="flex flex-wrap gap-2">
                            {alert.experienceLevels.map((level, index) => (
                              <Badge key={index} variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                {level}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Salary */}
                    {alert.minSalary && (
                      <div className="mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Minimum Salary: ${alert.minSalary.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Alert Details */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                      {alert.lastSent && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Last sent: {new Date(alert.lastSent).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        {getNotificationIcon(alert.notificationMethod)}
                        <span>
                          {alert.notificationMethod === 'email' ? 'Email' : 
                           alert.notificationMethod === 'push' ? 'Push' : 
                           'Email & Push'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Panel */}
                  <div className="md:w-64 flex flex-col gap-4">
                    <Card className="bg-muted/30">
                      <CardContent className="pt-4 pb-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-foreground">{alert.jobCount ?? 0}</p>
                          <p className="text-xs text-muted-foreground">Matching Jobs</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Button 
                      variant="outline" 
                      asChild
                    >
                      <Link to={`/applicant/jobs?source=alert&id=${alert.id}`}>
                        <Search className="h-4 w-4 mr-2" />
                        View Matching Jobs
                      </Link>
                    </Button>

                    <Button
                      variant={alert.active ? "destructive" : "default"}
                      onClick={() => toggleAlertStatus(alert.id)}
                    >
                      {alert.active ? (
                        <>
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Pause Alert
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Activate Alert
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="border-dashed"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAlerts.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {alerts.length === 0 ? 'No job alerts set up yet' : 'No job alerts match your filters'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {alerts.length === 0 
                    ? "Create your first job alert to get notified about new opportunities"
                    : "Try adjusting your search criteria or filters"}
                </p>
                {alerts.length === 0 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Alert
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      {/* Same content as the create alert dialog above */}
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                    onClick={() => {
                      setStatusFilter('all');
                      setFrequencyFilter('all');
                      setSearchTerm('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="container mx-auto px-6 py-8">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Tips for Effective Job Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Be Specific
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use specific job titles and skills to get more relevant matches.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Multiple Alerts
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create separate alerts for different job types or locations.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Regular Updates
                </h3>
                <p className="text-sm text-muted-foreground">
                  Review and update your alerts to improve match quality.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}