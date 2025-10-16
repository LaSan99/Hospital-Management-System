import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Heart, 
  Activity, 
  Stethoscope, 
  Clipboard, 
  PlusCircle, 
  Lock,
  Shield,
  Building,
  Users,
  Award,
  Clock,
  Smartphone,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await registerUser(data)
      if (result.success) {
        toast.success('Registration successful!')
        navigate('/dashboard')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Registration benefits
  const benefits = [
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Easy Appointment Booking",
      description: "Schedule appointments with specialists in seconds"
    },
    {
      icon: <Clipboard className="h-5 w-5" />,
      title: "Digital Health Records",
      description: "Access your medical history anytime, anywhere"
    },
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Telemedicine Ready",
      description: "Virtual consultations with healthcare providers"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure & Private",
      description: "HIPAA compliant data protection"
    }
  ]

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: 'bg-gray-300', text: '' }
    if (password.length < 6) return { strength: 25, color: 'bg-red-500', text: 'Weak' }
    if (password.length < 8) return { strength: 50, color: 'bg-yellow-500', text: 'Fair' }
    if (password.length < 10) return { strength: 75, color: 'bg-blue-500', text: 'Good' }
    return { strength: 100, color: 'bg-green-500', text: 'Strong' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Left Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-2xl">
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

          {/* Registration Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Create Your Account
              </h2>
              <p className="text-blue-100">
                Join thousands of patients in our healthcare network
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters'
                        }
                      })}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="John"
                    />
                  </div>
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-300">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('lastName', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters'
                        }
                      })}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="Doe"
                    />
                  </div>
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-300">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[\+]?[1-9][\d]{0,15}$/,
                          message: 'Invalid phone number'
                        }
                      })}
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="+1234567890"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-300">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      {...register('dateOfBirth', {
                        required: 'Date of birth is required'
                      })}
                      type="date"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-300">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Gender *
                  </label>
                  <select
                    {...register('gender', {
                      required: 'Gender is required'
                    })}
                    className="w-full px-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800 text-white">Select gender</option>
                    <option value="male" className="bg-gray-800 text-white">Male</option>
                    <option value="female" className="bg-gray-800 text-white">Female</option>
                    <option value="other" className="bg-gray-800 text-white">Other</option>
                    <option value="prefer-not-to-say" className="bg-gray-800 text-white">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-300">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Account Type
                </label>
                <input
                  {...register('role', {
                    required: 'Role is required'
                  })}
                  type="hidden"
                  value="patient"
                />
                <div className="w-full px-4 py-3 bg-blue-600/20 border border-blue-400/30 rounded-xl text-white text-center">
                  <div className="flex items-center justify-center">
                    <User className="h-5 w-5 mr-2 text-blue-300" />
                    <span className="font-medium">Patient Account</span>
                    <CheckCircle className="h-4 w-4 ml-2 text-green-400" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-blue-200 text-center">
                  Public registration is available for patients. Medical staff accounts require administrative approval.
                </p>
              </div>

              {/* Password Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-blue-300" />
                      </div>
                      <input
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Create a password"
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
                      <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      type="password"
                      className="w-full px-4 py-3 bg-white/5 border border-blue-300/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-300">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-blue-200">
                      <span>Password strength</span>
                      <span className={passwordStrength.text === 'Weak' ? 'text-red-400' : 
                                       passwordStrength.text === 'Fair' ? 'text-yellow-400' : 
                                       passwordStrength.text === 'Good' ? 'text-blue-400' : 'text-green-400'}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  {...register('terms', {
                    required: 'You must accept the terms and conditions'
                  })}
                  type="checkbox"
                  className="w-4 h-4 mt-1 text-blue-600 bg-white/5 border-blue-300/20 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label className="text-sm text-blue-100">
                  I agree to the{' '}
                  <a href="#" className="text-blue-300 hover:text-blue-200 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-300 hover:text-blue-200 underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-300">{errors.terms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Patient Account
                  </div>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-blue-200">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-300 hover:text-white transition-colors"
                >
                  Sign in here
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

      {/* Right Panel - Registration Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border-l border-white/10">
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-2xl">
            {/* Hospital Introduction */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Building className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Join MediCare+</h1>
                  <p className="text-blue-100 text-lg">Your Health, Our Priority</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white mb-1">200+</div>
                  <div className="text-blue-100 text-sm">Medical Experts</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white mb-1">24/7</div>
                  <div className="text-blue-100 text-sm">Care Available</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white mb-1">99%</div>
                  <div className="text-blue-100 text-sm">Patient Satisfaction</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white mb-1">15min</div>
                  <div className="text-blue-100 text-sm">Avg. Response Time</div>
                </div>
              </div>
            </div>

            {/* Registration Benefits */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-6">Why Register With Us?</h3>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 group hover:bg-white/5 p-4 rounded-xl transition-all duration-300">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                    <p className="text-blue-100 text-sm">{benefit.description}</p>
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
                  <div className="text-white font-semibold">Sarah Johnson</div>
                  <div className="text-blue-200 text-sm">Patient since 2022</div>
                </div>
              </div>
              <p className="text-blue-100 italic">
                "The registration process was seamless, and the patient portal has made managing my healthcare so much easier. I can book appointments and access my records anytime!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register