import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Shield, Lock, Mail, User, Building, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  role: 'admin' | 'interviewer' | 'candidate' | 'observer' | ''
  securityLevel: 'basic' | 'elevated' | 'high' | 'top_secret' | ''
  organizationId: string
  department: string
  phoneNumber: string
  preferredLanguage: string
  timezone: string
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: '',
    securityLevel: '',
    organizationId: '',
    department: '',
    phoneNumber: '',
    preferredLanguage: 'en',
    timezone: 'UTC'
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  
  const { signUp, user, resendVerificationEmail } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const validateStep = (step: number) => {
    const newErrors: Partial<FormData> = {}
    
    if (step === 1) {
      if (!formData.email) {
        newErrors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number'
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
      
      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required'
      }
    }
    
    if (step === 2) {
      if (!formData.role) {
        newErrors.role = 'Please select a role'
      }
      
      if (!formData.securityLevel) {
        newErrors.securityLevel = 'Please select a security level'
      }
      
      if (!formData.organizationId) {
        newErrors.organizationId = 'Organization is required'
      }
      
      if (!formData.department) {
        newErrors.department = 'Department is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(2)) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        username: formData.email.split('@')[0],
        role: formData.role === 'admin' ? 'administrator' : formData.role === 'interviewer' ? 'selector' : formData.role as any,
        security_clearance: formData.securityLevel === 'basic' ? 'public' : formData.securityLevel === 'elevated' ? 'restricted' : formData.securityLevel === 'high' ? 'confidential' : 'secret',
        department: formData.department,
        phone: formData.phoneNumber
      })
      
      if (!error) {
        setUserEmail(formData.email)
        setRegistrationComplete(true)
        toast.success('Account created successfully! Please check your email to verify your account.')
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(true)
    try {
      await resendVerificationEmail(userEmail)
    } catch (error) {
      console.error('Resend email error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const }
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="hidden lg:block space-y-8"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-3 rounded-2xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">DRDO Interview AI</h1>
                <p className="text-gray-600">Join the Future of Recruitment</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                Create Your
                <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Secure Account
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Join defense organizations worldwide in revolutionizing their 
                interview processes with AI-powered assessments.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">Government-grade security & compliance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">AI-powered candidate evaluation</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">Immersive 3D interview environments</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-gray-700">Real-time analytics & reporting</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Registration Form */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
            {/* Progress Indicator */}
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className={`flex items-center space-x-2 ${
                  currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Account</span>
                </div>
                <div className={`w-16 h-1 rounded-full ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
                <div className={`flex items-center space-x-2 ${
                  currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Profile</span>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentStep === 1 ? 'Create Account' : 'Complete Profile'}
              </h2>
              <p className="text-gray-600">
                {currentStep === 1 
                  ? 'Enter your basic information to get started'
                  : 'Set up your role and organization details'
                }
              </p>
            </motion.div>

            {/* Registration Success State */}
            {registrationComplete ? (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                className="text-center space-y-6"
              >
                <div className="flex justify-center mb-6">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Mail className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Check Your Email!
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    We've sent a verification link to{' '}
                    <span className="font-semibold text-blue-600">{userEmail}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Click the link in your email to verify your account and complete the registration process.
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">What's next?</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1 text-left">
                    <li>• Check your email inbox (and spam folder)</li>
                    <li>• Click the verification link</li>
                    <li>• Return to sign in to your account</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Didn't receive the email?
                  </p>
                  <Button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-12 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </Button>
                  
                  <Link
                    to="/login"
                    className="block w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center"
                  >
                    Go to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
            <form onSubmit={currentStep === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <motion.div
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateFormData('fullName', e.target.value)}
                        className={`pl-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.fullName && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.fullName}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className={`pl-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className={`pl-10 pr-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.password}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        className={`pl-10 pr-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.confirmPassword}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Profile Information */}
              {currentStep === 2 && (
                <motion.div
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                        <SelectTrigger className={`h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="interviewer">Interviewer</SelectItem>
                          <SelectItem value="candidate">Candidate</SelectItem>
                          <SelectItem value="observer">Observer</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.role}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Security Level</Label>
                      <Select value={formData.securityLevel} onValueChange={(value) => updateFormData('securityLevel', value)}>
                        <SelectTrigger className={`h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.securityLevel ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="elevated">Elevated</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="top_secret">Top Secret</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.securityLevel && (
                        <div className="flex items-center space-x-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.securityLevel}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organizationId" className="text-sm font-medium text-gray-700">
                      Organization
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="organizationId"
                        type="text"
                        value={formData.organizationId}
                        onChange={(e) => updateFormData('organizationId', e.target.value)}
                        className={`pl-10 h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                          errors.organizationId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                        placeholder="Enter organization name"
                      />
                    </div>
                    {errors.organizationId && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.organizationId}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      Department
                    </Label>
                    <Input
                      id="department"
                      type="text"
                      value={formData.department}
                      onChange={(e) => updateFormData('department', e.target.value)}
                      className={`h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${
                        errors.department ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="Enter department"
                    />
                    {errors.department && (
                      <div className="flex items-center space-x-1 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.department}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => updateFormData('phoneNumber', e.target.value)}
                      className="h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </form>
            )}

            <motion.div variants={itemVariants} className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Your data is protected with enterprise-grade security</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register