import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  X, 
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Eye,
  ToggleLeft,
  ToggleRight,
  Shield,
  Award,
  TrendingUp,
  Users,
  MoreVertical,
  BadgeCheck
} from 'lucide-react'
import { doctorsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const Doctors = () => {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    specialization: '',
    licenseNumber: '',
    experience: '',
    consultationFee: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })

  // Fetch doctors data
  const { data: doctorsData, isLoading, error } = useQuery(
    'doctors',
    () => doctorsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  // Create doctor mutation
  const createDoctorMutation = useMutation(
    (doctorData) => doctorsAPI.create(doctorData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctors')
        setShowAddDoctorModal(false)
        setNewDoctor({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          dateOfBirth: '',
          gender: 'male',
          specialization: '',
          licenseNumber: '',
          experience: '',
          consultationFee: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          }
        })
      },
      onError: (error) => {
        console.error('Error creating doctor:', error)
      }
    }
  )

  // Toggle doctor availability mutation
  const toggleAvailabilityMutation = useMutation(
    ({ doctorId, isAvailable }) => doctorsAPI.updateAvailability(doctorId, isAvailable),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctors')
      },
      onError: (error) => {
        console.error('Error toggling doctor availability:', error)
      }
    }
  )

  // Toggle doctor account status mutation (admin only)
  const toggleStatusMutation = useMutation(
    ({ doctorId, isActive }) => doctorsAPI.update(doctorId, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctors')
      },
      onError: (error) => {
        console.error('Error toggling doctor status:', error)
      }
    }
  )

  const handleToggleAvailability = (doctorId, currentAvailability) => {
    if (window.confirm(`Are you sure you want to mark this doctor as ${currentAvailability ? 'unavailable' : 'available'}?`)) {
      toggleAvailabilityMutation.mutate({ doctorId, isAvailable: !currentAvailability })
    }
  }

  const handleToggleStatus = (doctorId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this doctor's account?`)) {
      toggleStatusMutation.mutate({ doctorId, isActive: !currentStatus })
    }
  }

  const doctors = doctorsData?.data?.data?.doctors || 
                  doctorsData?.data?.doctors || 
                  []

  // Get unique specializations for filter
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))]

  // Filter doctors based on search term and specialization
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization
    
    return matchesSearch && matchesSpecialization
  })

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const formatExperience = (experience) => {
    if (!experience) return 'Experience not specified'
    return `${experience} year${experience > 1 ? 's' : ''} experience`
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setNewDoctor(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setNewDoctor(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createDoctorMutation.mutate(newDoctor)
  }

  const resetForm = () => {
    setNewDoctor({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      specialization: '',
      licenseNumber: '',
      experience: '',
      consultationFee: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    })
    setShowAddDoctorModal(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Doctors</h3>
            <p className="text-gray-600 mb-4">
              {error.response?.data?.message || 'Failed to load doctors. Please try again.'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Team</h1>
              <p className="text-gray-600 mt-2">Browse and manage our healthcare professionals</p>
            </div>
            {isAdmin && (
              <button 
                className="mt-4 lg:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/25 flex items-center"
                onClick={() => setShowAddDoctorModal(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Doctor
              </button>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{doctors.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {doctors.filter(d => d.isAvailable).length}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Specializations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{specializations.length}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Experience</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {doctors.length > 0 
                    ? Math.round(doctors.reduce((acc, doc) => acc + (parseInt(doc.experience) || 0), 0) / doctors.length)
                    : 0
                  }+ yrs
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors by name, specialization, or email..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
            >
              <option value="">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
              <Filter className="h-5 w-5 mr-2 text-gray-600" />
              More Filters
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredDoctors.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{doctors.length}</span> doctors
          </p>
        </div>

        {/* Doctors Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || selectedSpecialization 
                ? 'No doctors match your search criteria. Try adjusting your filters.' 
                : 'No doctors are currently registered in the system.'
              }
            </p>
            {(searchTerm || selectedSpecialization) && (
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedSpecialization('')
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div key={doctor._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                {/* Doctor Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                          {getInitials(doctor.firstName, doctor.lastName)}
                        </div>
                        {doctor.isAvailable && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-blue-600 font-medium">{doctor.specialization || 'General Practice'}</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">4.8 • {formatExperience(doctor.experience)}</span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span>{doctor.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="truncate">
                      {doctor.address?.city && doctor.address?.state 
                        ? `${doctor.address.city}, ${doctor.address.state}`
                        : 'Location not specified'
                      }
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="h-4 w-4 mr-3 text-gray-400" />
                    <span>Consultation: ${doctor.consultationFee || 'Not set'}</span>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        doctor.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doctor.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        doctor.isActive 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors" title="View Profile">
                        <Eye className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button className="p-2 text-gray-400 hover:text-green-600 transition-colors" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleAvailability(doctor._id, doctor.isAvailable)}
                            className={`p-2 transition-colors ${
                              doctor.isAvailable 
                                ? 'text-green-600 hover:text-yellow-600' 
                                : 'text-yellow-600 hover:text-green-600'
                            }`}
                            title={doctor.isAvailable ? 'Set Unavailable' : 'Set Available'}
                            disabled={toggleAvailabilityMutation.isLoading}
                          >
                            {doctor.isAvailable ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Doctor Modal */}
        {showAddDoctorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Doctor</h2>
                  <p className="text-gray-600 mt-1">Register a new healthcare professional</p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={newDoctor.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={newDoctor.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newDoctor.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="doctor@hospital.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newDoctor.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="+1234567890"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization *
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={newDoctor.specialization}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Cardiology, Neurology"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number *
                      </label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={newDoctor.licenseNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Medical license number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience (years) *
                      </label>
                      <input
                        type="number"
                        name="experience"
                        value={newDoctor.experience}
                        onChange={handleInputChange}
                        required
                        min="0"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Years of experience"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consultation Fee ($)
                      </label>
                      <input
                        type="number"
                        name="consultationFee"
                        value={newDoctor.consultationFee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Consultation fee"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDoctorMutation.isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createDoctorMutation.isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Creating Doctor...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Create Doctor Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Doctors