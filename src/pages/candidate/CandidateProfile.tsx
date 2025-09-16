/**
 * Candidate Profile - Profile management and interview information for candidates
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Edit, 
  Save, 
  X, 
  Upload, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  Languages,
  Shield,
  Camera
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { Permission } from '../../lib/permissions'
import { PermissionGate } from '../../components/PermissionGate'
import { toast } from 'sonner'

interface CandidateProfile {
  id: string
  email: string
  full_name: string
  phone?: string
  address?: string
  bio?: string
  avatar_url?: string
  date_of_birth?: Date
  nationality?: string
  languages: string[]
  skills: string[]
  experience_years: number
  current_position?: string
  current_company?: string
  education: EducationEntry[]
  certifications: CertificationEntry[]
  resume_url?: string
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
  preferences: {
    preferred_locations: string[]
    salary_expectation?: number
    availability_date?: Date
    work_type: 'full_time' | 'part_time' | 'contract' | 'internship'
  }
  email_verified: boolean
  profile_completion: number
}

interface EducationEntry {
  id: string
  institution: string
  degree: string
  field_of_study: string
  start_date: Date
  end_date?: Date
  grade?: string
  description?: string
}

interface CertificationEntry {
  id: string
  name: string
  issuing_organization: string
  issue_date: Date
  expiry_date?: Date
  credential_id?: string
  credential_url?: string
}

interface Interview {
  id: string
  title: string
  position: string
  company: string
  scheduled_time: Date
  duration_minutes: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  interview_type: string
  location: 'virtual' | 'in_person'
  room_url?: string
  feedback?: string
  overall_score?: number
}

const CandidateProfile: React.FC = () => {
  const { user, userProfile, updateProfile } = useAuth()
  const { hasPermission } = usePermissions()
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    fetchCandidateData()
  }, [])

  const fetchCandidateData = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API calls
      
      // Mock candidate profile data
      const mockProfile: CandidateProfile = {
        id: user?.id || '1',
        email: userProfile?.email || 'candidate@example.com',
        full_name: userProfile?.full_name || 'John Candidate',
        phone: '+91 9876543210',
        address: 'Mumbai, Maharashtra, India',
        bio: 'Passionate software engineer with 3+ years of experience in full-stack development. Specialized in React, Node.js, and cloud technologies.',
        date_of_birth: new Date('1995-06-15'),
        nationality: 'Indian',
        languages: ['English', 'Hindi', 'Marathi'],
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB'],
        experience_years: 3,
        current_position: 'Senior Software Engineer',
        current_company: 'Tech Solutions Pvt Ltd',
        education: [
          {
            id: '1',
            institution: 'Indian Institute of Technology, Mumbai',
            degree: 'Bachelor of Technology',
            field_of_study: 'Computer Science and Engineering',
            start_date: new Date('2017-07-01'),
            end_date: new Date('2021-06-30'),
            grade: '8.5 CGPA'
          }
        ],
        certifications: [
          {
            id: '1',
            name: 'AWS Certified Solutions Architect',
            issuing_organization: 'Amazon Web Services',
            issue_date: new Date('2023-03-15'),
            expiry_date: new Date('2026-03-15'),
            credential_id: 'AWS-CSA-2023-001'
          }
        ],
        preferences: {
          preferred_locations: ['Mumbai', 'Pune', 'Bangalore'],
          salary_expectation: 1200000,
          availability_date: new Date('2024-04-01'),
          work_type: 'full_time'
        },
        email_verified: userProfile?.email_verified || false,
        profile_completion: 85
      }
      
      // Mock interview data
      const mockInterviews: Interview[] = [
        {
          id: '1',
          title: 'Technical Interview - Software Engineer',
          position: 'Software Engineer',
          company: 'DRDO',
          scheduled_time: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
          duration_minutes: 60,
          status: 'scheduled',
          interview_type: 'Technical',
          location: 'virtual',
          room_url: 'https://meet.drdo.gov.in/room/abc123'
        },
        {
          id: '2',
          title: 'HR Interview - Data Scientist',
          position: 'Data Scientist',
          company: 'DRDO',
          scheduled_time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // Last week
          duration_minutes: 45,
          status: 'completed',
          interview_type: 'Behavioral',
          location: 'virtual',
          feedback: 'Good communication skills and relevant experience.',
          overall_score: 8.2
        }
      ]
      
      setProfile(mockProfile)
      setInterviews(mockInterviews)
    } catch (error) {
      console.error('Error fetching candidate data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      if (!profile) return
      
      // TODO: Implement actual profile update API call
      console.log('Updating profile:', profile)
      
      // Update auth context if basic info changed
      if (profile.full_name !== userProfile?.full_name) {
        await updateProfile({ full_name: profile.full_name })
      }
      
      toast.success('Profile updated successfully')
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // TODO: Implement actual file upload
      console.log('Uploading avatar:', file)
      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    }
  }

  const getStatusColor = (status: Interview['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCompletionColor = (completion: number) => {
    if (completion >= 90) return 'text-green-600'
    if (completion >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
          <p className="text-gray-500">Unable to load your profile information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-500">Manage your profile and interview information</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!profile.email_verified && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Email Not Verified</span>
                </Badge>
              )}
              <Badge variant="outline" className={getCompletionColor(profile.profile_completion)}>
                {profile.profile_completion}% Complete
              </Badge>
              <PermissionGate permissions={[Permission.PROFILE_UPDATE]}>
                {editing ? (
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveProfile} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button onClick={() => setEditing(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setEditing(true)} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {profile.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                        <Camera className="h-3 w-3" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">{profile.full_name}</h3>
                  <p className="text-sm text-gray-500">{profile.current_position}</p>
                  <p className="text-sm text-gray-500">{profile.current_company}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile.address && (
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-gray-500 mb-2">Profile Completion</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${profile.profile_completion}%` }}
                      />
                    </div>
                    <div className={`text-sm font-medium mt-1 ${getCompletionColor(profile.profile_completion)}`}>
                      {profile.profile_completion}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="interviews">Interviews</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={profile.email}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profile.phone || ''}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="nationality">Nationality</Label>
                        <Input
                          id="nationality"
                          value={profile.nationality || ''}
                          onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                          disabled={!editing}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={profile.address || ''}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        disabled={!editing}
                        rows={4}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="h-5 w-5" />
                      <span>Professional Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="current_position">Current Position</Label>
                        <Input
                          id="current_position"
                          value={profile.current_position || ''}
                          onChange={(e) => setProfile({ ...profile, current_position: e.target.value })}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="current_company">Current Company</Label>
                        <Input
                          id="current_company"
                          value={profile.current_company || ''}
                          onChange={(e) => setProfile({ ...profile, current_company: e.target.value })}
                          disabled={!editing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience_years">Years of Experience</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={profile.experience_years}
                          onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                          disabled={!editing}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Languages</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.languages.map((language, index) => (
                          <Badge key={index} variant="outline">
                            <Languages className="h-3 w-3 mr-1" />
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5" />
                      <span>Education</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.education.map((edu) => (
                        <div key={edu.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                              <p className="text-sm text-gray-600">{edu.field_of_study}</p>
                              <p className="text-sm text-gray-500">{edu.institution}</p>
                              <p className="text-xs text-gray-400">
                                {edu.start_date.getFullYear()} - {edu.end_date?.getFullYear() || 'Present'}
                              </p>
                              {edu.grade && (
                                <Badge variant="outline" className="mt-2">
                                  {edu.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Certifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.certifications.map((cert) => (
                        <div key={cert.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                              <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                              <p className="text-xs text-gray-400">
                                Issued: {cert.issue_date.toLocaleDateString()}
                                {cert.expiry_date && ` • Expires: ${cert.expiry_date.toLocaleDateString()}`}
                              </p>
                              {cert.credential_id && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ID: {cert.credential_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Interviews Tab */}
              <TabsContent value="interviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>My Interviews</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {interviews.map((interview) => (
                        <div key={interview.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{interview.title}</h4>
                              <p className="text-sm text-gray-600">{interview.position} • {interview.company}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{interview.scheduled_time.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{interview.scheduled_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>{interview.duration_minutes} min</span>
                                </div>
                              </div>
                              {interview.feedback && (
                                <p className="text-sm text-gray-600 mt-2 italic">"{interview.feedback}"</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={getStatusColor(interview.status)}>
                                {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                              </Badge>
                              {interview.overall_score && (
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {interview.overall_score}/10
                                  </div>
                                  <div className="text-xs text-gray-500">Score</div>
                                </div>
                              )}
                              {interview.status === 'scheduled' && interview.room_url && (
                                <Button size="sm" onClick={() => window.open(interview.room_url, '_blank')}>
                                  Join Interview
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {interviews.length === 0 && (
                        <div className="text-center py-8">
                          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
                          <p className="text-gray-500">Your scheduled interviews will appear here.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Resume</h4>
                          <p className="text-xs text-gray-500 mb-3">Upload your latest resume (PDF, DOC)</p>
                          {profile.resume_url ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                              <Button size="sm" variant="outline">
                                <Upload className="h-4 w-4 mr-2" />
                                Replace
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Resume
                            </Button>
                          )}
                        </div>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Portfolio</h4>
                          <p className="text-xs text-gray-500 mb-3">Upload your portfolio or work samples</p>
                          <Button size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Portfolio
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                          <Input
                            id="linkedin_url"
                            value={profile.linkedin_url || ''}
                            onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                            disabled={!editing}
                            placeholder="https://linkedin.com/in/yourprofile"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="github_url">GitHub Profile</Label>
                          <Input
                            id="github_url"
                            value={profile.github_url || ''}
                            onChange={(e) => setProfile({ ...profile, github_url: e.target.value })}
                            disabled={!editing}
                            placeholder="https://github.com/yourusername"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="portfolio_url">Portfolio Website</Label>
                          <Input
                            id="portfolio_url"
                            value={profile.portfolio_url || ''}
                            onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                            disabled={!editing}
                            placeholder="https://yourportfolio.com"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateProfile