import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { 
  Eye, 
  EyeOff, 
  User, 
  Lock, 
  Heart, 
  Activity, 
  Stethoscope, 
  Clipboard, 
  PlusCircle,
  Shield,
  Building,
  Calendar,
  Users,
  Award,
  Clock,
  Smartphone
} from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        toast.success('Login successful!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 100)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Hospital features for the right panel
  const features = [
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure & HIPAA Compliant",
      description: "Your medical data is protected with enterprise-grade security"
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Smart Scheduling",
      description: "Book appointments and manage your healthcare calendar"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Expert Medical Team",
      description: "Access to 200+ board-certified specialists"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "Telemedicine Ready",
      description: "Virtual consultations with your healthcare providers"
    }
  ]

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Left Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Hospital Branding */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MediCare+</h1>
                <p className="text-blue-200 text-sm">Hospital Management System</p>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-blue-100">
                Sign in to your medical dashboard
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-300">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-blue-100">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-blue-200 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-300">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Remember Me & Submit */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-white/5 border-blue-300/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-blue-100">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-blue-300/20"></div>
              <div className="px-3 text-sm text-blue-200">or</div>
              <div className="flex-1 border-t border-blue-300/20"></div>
            </div>

           

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-blue-200">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-blue-300 hover:text-white transition-colors"
                >
                  Register now
                </Link>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-blue-300/70 flex items-center justify-center">
              <Shield className="h-3 w-3 mr-1" />
              HIPAA Compliant • Enterprise Security • 24/7 Monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Hospital Information */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border-l border-white/10">
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-2xl">
            {/* Hospital Stats */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">MediCare+ Hospital</h1>
                  <p className="text-blue-100 text-lg">Advanced Healthcare Management</p>
                </div>
              </div>
              
              
            </div>

            {/* Features */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Why Choose Our System?</h3>
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group hover:bg-white/5 p-3 rounded-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{feature.title}</h4>
                    <p className="text-blue-100 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="mt-12 p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Dr. Sarah Johnson</div>
                  <div className="text-blue-200 text-sm">Chief Medical Officer</div>
                </div>
              </div>
              <p className="text-blue-100 italic">
                "Our hospital management system has transformed patient care with its intuitive interface and robust features. Join thousands of healthcare professionals who trust our platform."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Features Panel */}
      <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-blue-600 to-cyan-700 z-40 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <Stethoscope className="h-8 w-8 text-white" />
            <h2 className="text-xl font-bold text-white">MediCare+ Features</h2>
          </div>
          <button className="text-white" onClick={() => {/* Close function */}}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-blue-100 text-sm">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Login
