import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Save, 
  Key, 
  ToggleLeft, 
  ToggleRight,
  Shield,
  Activity,
  Settings,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  Heart
} from 'lucide-react'
import toast from 'react-hot-toast'
import { doctorsAPI } from '../services/api'

const Profile = () => {
  const { user, updateProfile, changePassword, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      address: user?.address || {}
    }
  })

  const passwordForm = useForm()

  const onSubmitProfile = async (data) => {
    setIsLoading(true)
    try {
      const result = await updateProfile(data)
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Profile update failed')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitPassword = async (data) => {
    setIsLoading(true)
    try {
      const result = await changePassword(data.currentPassword, data.newPassword)
      if (result.success) {
        toast.success('Password changed successfully!')
        passwordForm.reset()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error('Password change failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvailabilityToggle = async () => {
    setIsLoading(true)
    try {
      const response = await doctorsAPI.updateAvailability(user._id, !isAvailable)
      if (response.data.success) {
        setIsAvailable(!isAvailable)
        await refreshUser()
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error('Failed to update availability')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-300/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-lg text-blue-600 capitalize font-medium">{user?.role}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            
            {/* Availability Toggle for Doctors */}
            {user?.role === 'doctor' && (
              <div className="flex items-center space-x-4 animate-fade-in-right">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Availability Status</p>
                  <p className={`text-sm font-medium transition-colors duration-300 ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                    {isAvailable ? 'Available for appointments' : 'Currently unavailable'}
                  </p>
                </div>
                <button
                  onClick={handleAvailabilityToggle}
                  disabled={isLoading}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-105 ${
                    isAvailable ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-all duration-300 ${
                      isAvailable ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-6 sticky top-8 hover:shadow-2xl transition-all duration-300">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-md'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <User className={`h-5 w-5 transition-colors duration-300 ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                  <span className="font-medium">Profile Information</span>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                    activeTab === 'password'
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-md'
                      : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <Key className={`h-5 w-5 transition-colors duration-300 ${activeTab === 'password' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                  <span className="font-medium">Security & Password</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <div className="p-8">
                {activeTab === 'profile' && (
                  <div className="animate-fade-in">
                    <ProfileForm 
                      register={register}
                      handleSubmit={handleSubmit}
                      onSubmitProfile={onSubmitProfile}
                      errors={errors}
                      user={user}
                      isLoading={isLoading}
                    />
                  </div>
                )}

                {activeTab === 'password' && (
                  <div className="animate-fade-in">
                    <PasswordForm 
                      passwordForm={passwordForm}
                      onSubmitPassword={onSubmitPassword}
                      isLoading={isLoading}
                      showCurrentPassword={showCurrentPassword}
                      setShowCurrentPassword={setShowCurrentPassword}
                      showNewPassword={showNewPassword}
                      setShowNewPassword={setShowNewPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

//Implement Component Functions

const ProfileForm = ({ register, handleSubmit, onSubmitProfile, errors, user, isLoading }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-2">Personal Information</h2>
        <p className="text-gray-600">Update your personal details and contact information.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all duration-300">
          <h3 className="text-lg font-semibold text-blue-900 mb-6 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">First Name</label>
              <input
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300 ${
                  errors.firstName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.firstName.message}</p>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">Last Name</label>
              <input
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300 ${
                  errors.lastName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.lastName.message}</p>
              )}
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 text-gray-500"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              </div>
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">Phone Number</label>
              <div className="relative">
                <input
                  {...register('phone', { required: 'Phone is required' })}
                  type="tel"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300 ${
                    errors.phone ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
                  }`}
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''}
                      disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
              <p className="mt-1 text-sm text-gray-500">Date of birth cannot be changed</p>
                </div>

                <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={user?.gender}
                    disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
              <p className="mt-1 text-sm text-gray-500">Gender cannot be changed</p>
            </div>
                </div>
              </div>

        {/* Address Information */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    {...register('address.street')}
                    type="text"
                placeholder="Enter your street address"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    {...register('address.city')}
                    type="text"
                placeholder="Enter your city"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    {...register('address.state')}
                    type="text"
                placeholder="Enter your state"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    {...register('address.zipCode')}
                    type="text"
                placeholder="Enter your ZIP code"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                  />
            </div>
                </div>
              </div>

        <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
            className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
    </div>
  )
}

const PasswordForm = ({ passwordForm, onSubmitPassword, isLoading, showCurrentPassword, setShowCurrentPassword, showNewPassword, setShowNewPassword, showConfirmPassword, setShowConfirmPassword }) => {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Security & Password</h2>
        <p className="text-gray-600">Update your password to keep your account secure.</p>
      </div>

      <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-8">
        <div className="bg-gray-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
          <div className="space-y-6">
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <input
                  {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    passwordForm.formState.errors.currentPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <input
                  {...passwordForm.register('newPassword', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    passwordForm.formState.errors.newPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
              )}
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  {...passwordForm.register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === passwordForm.watch('newPassword') || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    passwordForm.formState.errors.confirmPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
              </div>

        <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
            className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </button>
              </div>
            </form>
    </div>
  )
}

export default Profile
