import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { UserCheck, Plus, Search, Filter, Star, Clock, DollarSign, X, Save } from 'lucide-react'
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

  console.log('Doctors Data:', doctorsData)
  console.log('Doctors Error:', error)

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
  
  console.log('Parsed Doctors:', doctors)
  console.log('Doctors Count:', doctors.length)

  // Get unique specializations for filter
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))]

  // Filter doctors based on search term and specialization
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization
    
    return matchesSearch && matchesSpecialization
  })

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
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
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Doctors</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load doctors. Please try again.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600">Browse and manage doctors</p>
        </div>
        {isAdmin && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddDoctorModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="form-select"
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredDoctors.length} of {doctors.length} doctors
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || selectedSpecialization 
                ? 'Try adjusting your search criteria' 
                : 'No doctors are currently available'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Availability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {getInitials(doctor.firstName, doctor.lastName)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{doctor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.specialization || 'General Practice'}</div>
                      <div className="text-sm text-gray-500">License: {doctor.licenseNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{doctor.phone || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{doctor.address?.city || 'N/A'}, {doctor.address?.state || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatExperience(doctor.experience)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${doctor.consultationFee || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doctor.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {doctor.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doctor.isActive 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {doctor.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                        {isAdmin && (
                          <>
                            <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                            <button 
                              onClick={() => handleToggleAvailability(doctor._id, doctor.isAvailable)}
                              className={`${
                                doctor.isAvailable 
                                  ? 'text-yellow-600 hover:text-yellow-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              disabled={toggleAvailabilityMutation.isLoading}
                            >
                              {doctor.isAvailable ? 'Set Unavailable' : 'Set Available'}
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(doctor._id, doctor.isActive)}
                              className={`${
                                doctor.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-blue-600 hover:text-blue-900'
                              }`}
                              disabled={toggleStatusMutation.isLoading}
                            >
                              {doctor.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Add New Doctor</h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={newDoctor.firstName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={newDoctor.lastName}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newDoctor.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newDoctor.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newDoctor.phone}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={newDoctor.dateOfBirth}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={newDoctor.gender}
                    onChange={handleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={newDoctor.specialization}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Cardiology, Neurology"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={newDoctor.licenseNumber}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (years) *
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={newDoctor.experience}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee ($)
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={newDoctor.consultationFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={newDoctor.address.street}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={newDoctor.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={newDoctor.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={newDoctor.address.zipCode}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="address.country"
                      value={newDoctor.address.country}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isLoading}
                  className="btn btn-primary"
                >
                  {createDoctorMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Doctor
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Doctors
