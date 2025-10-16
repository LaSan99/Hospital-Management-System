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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600 capitalize">{user?.role}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {/* Availability Toggle for Doctors */}
          {user?.role === 'doctor' && (
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Availability:</span>
              <button
                onClick={handleAvailabilityToggle}
                disabled={isLoading}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isAvailable
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isAvailable ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    <span>Available</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    <span>Unavailable</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">First Name</label>
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className={`form-input ${errors.firstName ? 'error' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="form-error">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Last Name</label>
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className={`form-input ${errors.lastName ? 'error' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="form-error">{errors.lastName.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email}
                      disabled
                      className="form-input bg-gray-50"
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="form-label">Phone</label>
                  <div className="relative">
                    <input
                      {...register('phone', { required: 'Phone is required' })}
                      type="tel"
                      className={`form-input pl-10 ${errors.phone ? 'error' : ''}`}
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="form-error">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Date of Birth</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''}
                      disabled
                      className="form-input bg-gray-50"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Date of birth cannot be changed</p>
                </div>

                <div>
                  <label className="form-label">Gender</label>
                  <select
                    value={user?.gender}
                    disabled
                    className="form-select bg-gray-50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Gender cannot be changed</p>
                </div>
              </div>

              <div>
                <label className="form-label">Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    {...register('address.street')}
                    type="text"
                    placeholder="Street Address"
                    className="form-input"
                  />
                  <input
                    {...register('address.city')}
                    type="text"
                    placeholder="City"
                    className="form-input"
                  />
                  <input
                    {...register('address.state')}
                    type="text"
                    placeholder="State"
                    className="form-input"
                  />
                  <input
                    {...register('address.zipCode')}
                    type="text"
                    placeholder="ZIP Code"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="spinner h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
              <div>
                <label className="form-label">Current Password</label>
                <input
                  {...passwordForm.register('currentPassword', { required: 'Current password is required' })}
                  type="password"
                  className={`form-input ${passwordForm.formState.errors.currentPassword ? 'error' : ''}`}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="form-error">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">New Password</label>
                <input
                  {...passwordForm.register('newPassword', { 
                    required: 'New password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type="password"
                  className={`form-input ${passwordForm.formState.errors.newPassword ? 'error' : ''}`}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="form-error">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <input
                  {...passwordForm.register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === passwordForm.watch('newPassword') || 'Passwords do not match'
                  })}
                  type="password"
                  className={`form-input ${passwordForm.formState.errors.confirmPassword ? 'error' : ''}`}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="form-error">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <div className="spinner h-4 w-4 mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
