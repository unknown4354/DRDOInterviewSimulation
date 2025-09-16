import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Mail, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired' | 'already_verified'

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [status, setStatus] = useState<VerificationStatus>('verifying')
  const [isResending, setIsResending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')
        
        if (!token || type !== 'email') {
          setStatus('error')
          setErrorMessage('Invalid verification link. Please check your email for the correct link.')
          return
        }

        // Verify the email using Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        })

        if (error) {
          console.error('Email verification error:', error)
          
          if (error.message.includes('expired')) {
            setStatus('expired')
            setErrorMessage('Verification link has expired. Please request a new one.')
          } else if (error.message.includes('already confirmed')) {
            setStatus('already_verified')
            setErrorMessage('Email is already verified. You can now sign in.')
          } else {
            setStatus('error')
            setErrorMessage(error.message || 'Failed to verify email. Please try again.')
          }
          return
        }

        if (data.user) {
          setStatus('success')
          toast.success('Email verified successfully!')
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setErrorMessage('An unexpected error occurred. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, navigate])

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        toast.error('Failed to resend verification email: ' + error.message)
      } else {
        toast.success('Verification email sent! Please check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
        return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-600" />
      case 'already_verified':
        return <CheckCircle className="h-16 w-16 text-green-600" />
      default:
        return <Mail className="h-16 w-16 text-gray-400" />
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying Your Email'
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Verification Failed'
      case 'expired':
        return 'Verification Link Expired'
      case 'already_verified':
        return 'Email Already Verified'
      default:
        return 'Email Verification'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'verifying':
        return 'Please wait while we verify your email address...'
      case 'success':
        return 'Your email has been successfully verified. You will be redirected to your dashboard shortly.'
      case 'error':
        return errorMessage || 'There was an error verifying your email. Please try again.'
      case 'expired':
        return 'Your verification link has expired. Please request a new verification email.'
      case 'already_verified':
        return 'Your email is already verified. You can now sign in to your account.'
      default:
        return 'Verifying your email address...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Status Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            {getStatusIcon()}
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            {getStatusTitle()}
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8 leading-relaxed"
          >
            {getStatusMessage()}
          </motion.p>

          {/* Resend Email Section */}
          {(status === 'expired' || status === 'error') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resend Verification Email
                </h3>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !email}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col space-y-3 mt-8"
          >
            {status === 'success' && (
              <Link
                to="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
            
            {(status === 'already_verified' || status === 'error') && (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
            
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </motion.div>
        </div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-500">
            Having trouble? Contact{' '}
            <a href="mailto:support@drdo-interview.com" className="text-blue-600 hover:underline">
              support@drdo-interview.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmailVerification