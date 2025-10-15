import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, UserPlus, User, Mail, Phone, Calendar, MapPin } from 'lucide-react'
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the Hospital Management System
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  {...register('firstName', {
                    required: 'First name is required',
                    minLength: {
                      value: 2,
                      message: 'First name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  {...register('lastName', {
                    required: 'Last name is required',
                    minLength: {
                      value: 2,
                      message: 'Last name must be at least 2 characters'
                    }
                  })}
                  type="text"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="relative">
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  className={`form-input pl-10 ${errors.email ? 'error' : ''}`}
                  placeholder="john@example.com"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <div className="relative">
                <input
                  {...register('phone', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[\+]?[1-9][\d]{0,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  type="tel"
                  className={`form-input pl-10 ${errors.phone ? 'error' : ''}`}
                  placeholder="+1234567890"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.phone && (
                <p className="form-error">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="form-label">
                Date of Birth
              </label>
              <div className="relative">
                <input
                  {...register('dateOfBirth', {
                    required: 'Date of birth is required'
                  })}
                  type="date"
                  className={`form-input pl-10 ${errors.dateOfBirth ? 'error' : ''}`}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.dateOfBirth && (
                <p className="form-error">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="form-label">
                Gender
              </label>
              <select
                {...register('gender', {
                  required: 'Gender is required'
                })}
                className={`form-select ${errors.gender ? 'error' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="form-error">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                {...register('role', {
                  required: 'Role is required'
                })}
                className={`form-select ${errors.role ? 'error' : ''}`}
              >
                <option value="">Select role</option>
                <option value="patient">Patient</option>
                {isAdmin && (
                  <>
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                  </>
                )}
              </select>
              {errors.role && (
                <p className="form-error">{errors.role.message}</p>
              )}
              {!isAdmin && (
                <p className="text-sm text-gray-500 mt-1">
                  Only patients can register here. Doctors and staff must be added by administrators.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input pr-10 ${errors.password ? 'error' : ''}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type="password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="spinner h-4 w-4" />
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
