import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  UserCheck, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin,
  Phone,
  Mail,
  BookOpen
} from 'lucide-react'
import { doctorsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const PatientDoctors = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')

  // Fetch doctors data
  const { data: doctorsData, isLoading, error } = useQuery(
    'doctors',
    () => doctorsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  const doctors = doctorsData?.data?.data?.doctors || doctorsData?.data?.doctors || doctorsData?.data || []

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

  const handleBookAppointment = (doctor) => {
    navigate(`/book-appointment?doctorId=${doctor._id}`, {
      state: { doctorId: doctor._id }
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
          <p className="text-gray-600">Browse available doctors and book appointments</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {getInitials(doctor.firstName, doctor.lastName)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{doctor.specialization || 'General Practice'}</p>
                  <p className="text-sm text-gray-500">{formatExperience(doctor.experience)}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>License: {doctor.licenseNumber || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Fee: ${doctor.consultationFee || 'Not specified'}</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{doctor.phone}</span>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                )}
                {doctor.address && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">
                      {doctor.address.city}, {doctor.address.state}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(Math.random() * 3) + 3
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">
                      ({Math.floor(Math.random() * 50) + 20})
                    </span>
                  </div>
                </div>
                {doctor.isAvailable !== false ? (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBookAppointment(doctor)}
                  >
                    <BookOpen className="h-4 w-4 mr-1" />
                    Book Appointment
                  </button>
                ) : (
                  <span className="text-sm text-yellow-600 font-medium">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default PatientDoctors
