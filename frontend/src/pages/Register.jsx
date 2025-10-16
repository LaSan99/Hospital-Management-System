import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, UserPlus, User, Mail, Phone, Calendar, MapPin, Heart, Activity, Stethoscope, Clipboard, PlusCircle, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register: registerUser, isAdmin } = useAuth()
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

  // Array of medical icons for animation
  const medicalIcons = [
    <Heart size={24} />,
    <Activity size={24} />,
    <Stethoscope size={24} />,
    <Clipboard size={24} />,
    <PlusCircle size={24} />,
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
      {/* Hospital-themed Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504439468489-c8920d796a29?q=80&w=3271&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>
      
      {/* Medical Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm-20-18c9.941 0 18 8.059 18 18s-8.059 18-18 18S-8 39.941-8 30s8.059-18 18-18z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        ></div>
      </div>
      
      {/* Floating Medical Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute text-blue-200 opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            {medicalIcons[i % medicalIcons.length]}
          </div>
        ))}
      </div>
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{
          animationDelay: '2s',
        }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse"
        style={{
          animationDelay: '4s',
        }}
      ></div>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Hospital Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Stethoscope size={32} className="text-blue-700" />
            </div>
          </div>
          
          {/* Register Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Create Account
              </h1>
              <p className="text-blue-100 text-sm">
                Join our healthcare network
              </p>
            </div>
            
            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-blue-100 mb-1">
                      First Name
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 ${
                          errors.firstName ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                        }`}
                        placeholder="John"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-300">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-blue-100 mb-1">
                      Last Name
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 ${
                          errors.lastName ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                        }`}
                        placeholder="Doe"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-300">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-blue-100 mb-1">
                    Email Address
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
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 ${
                        errors.email ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      }`}
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-blue-100 mb-1">
                    Phone Number
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
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 ${
                        errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      }`}
                      placeholder="+1234567890"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-300">{errors.phone.message}</p>
                  )}
                </div>

                {/* Date of Birth and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-blue-100 mb-1">
                      Date of Birth
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
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white ${
                          errors.dateOfBirth ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-300">{errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-blue-100 mb-1">
                      Gender
                    </label>
                    <select
                      {...register('gender', {
                        required: 'Gender is required'
                      })}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white ${
                        errors.gender ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      }`}
                    >
                      <option value="" className="bg-gray-800 text-white">Select gender</option>
                      <option value="male" className="bg-gray-800 text-white">Male</option>
                      <option value="female" className="bg-gray-800 text-white">Female</option>
                      <option value="other" className="bg-gray-800 text-white">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-300">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                {/* Role Field */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-blue-100 mb-1">
                    I am a
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        // Set role to patient
                        const event = { target: { value: 'patient' } }
                        register('role').onChange(event)
                      }}
                      className={`px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 text-sm font-medium ${
                        errors.role 
                          ? 'border-red-400 focus:ring-red-400' 
                          : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      } ${
                        watch('role') === 'patient'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white/10 backdrop-blur-sm text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      Doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Set role to patient
                        const event = { target: { value: 'patient' } }
                        register('role').onChange(event)
                      }}
                      className={`px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 text-sm font-medium ${
                        errors.role 
                          ? 'border-red-400 focus:ring-red-400' 
                          : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      } ${
                        watch('role') === 'patient'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white/10 backdrop-blur-sm text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      Nurse
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Set role to patient
                        const event = { target: { value: 'patient' } }
                        register('role').onChange(event)
                      }}
                      className={`px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 text-sm font-medium ${
                        errors.role 
                          ? 'border-red-400 focus:ring-red-400' 
                          : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      } ${
                        watch('role') === 'patient'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white/10 backdrop-blur-sm text-blue-200 hover:bg-white/20'
                      }`}
                    >
                      Patient
                    </button>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-300">{errors.role.message}</p>
                  )}
                  {!isAdmin && (
                    <p className="mt-2 text-sm text-blue-200">
                      Only patients can register here. Doctors and staff must be added by administrators.
                    </p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-1">
                      Password
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
                        className={`w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 ${
                          errors.password ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                        }`}
                        placeholder="••••••••"
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
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100 mb-1">
                      Confirm Password
                    </label>
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      type="password"
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 ${
                        errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : 'border-blue-300/30 focus:ring-blue-400 focus:border-blue-400'
                      }`}
                      placeholder="••••••••"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-300">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    <span>+ Create Account</span>
                  </div>
                )}
              </button>
            </form>
            
            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-blue-200">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-blue-300 hover:text-blue-200 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          
          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-blue-300/70 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Secure Medical Registration | HIPAA Compliant
            </p>
          </div>
        </div>
      </div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>
      
      {/* Custom Animation Keyframes */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
          100% {
            transform: translateY(0px) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}

export default Register
