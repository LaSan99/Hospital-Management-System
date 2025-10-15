import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Calendar, Plus, Search, Filter, Clock, CheckCircle, User, MapPin, Phone } from 'lucide-react'
import { appointmentsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../contexts/AuthContext'

const Appointments = () => {
  const { user, isAdmin, isStaff, isDoctor, isPatient } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch appointments data
  const { data: appointmentsData, isLoading, error } = useQuery(
    'appointments',
    () => appointmentsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  const appointments = appointmentsData?.data?.appointments || []

  // Filter appointments based on search term and status
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusOptions = () => {
    const statuses = [...new Set(appointments.map(apt => apt.status))]
    return statuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
    }))
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load appointments. Please try again.'}
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
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage appointments and schedules</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            {getStatusOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
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
        Showing {filteredAppointments.length} of {appointments.length} appointments
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Appointments` : 'All Appointments'}
          </h2>
        </div>
        
        {filteredAppointments.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter 
                  ? 'Try adjusting your search criteria' 
                  : 'No appointments are currently scheduled'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {isPatient 
                            ? `Dr. ${appointment.doctorName}`
                            : isDoctor
                            ? `${appointment.patientName}`
                            : `${appointment.patientName} - Dr. ${appointment.doctorName}`
                          }
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-1">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1">📋</span>
                          {appointment.appointmentType}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {appointment.reason}
                      </p>
                      {appointment.symptoms && appointment.symptoms.length > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-1">🩺</span>
                          <span>Symptoms: {appointment.symptoms.join(', ')}</span>
                        </div>
                      )}
                      {appointment.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{appointment.location} {appointment.room && `- Room ${appointment.room}`}</span>
                        </div>
                      )}
                      {appointment.consultationFee && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-1">💰</span>
                          <span>Fee: ${appointment.consultationFee}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {appointment.checkedIn && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span className="text-sm">Checked In</span>
                      </div>
                    )}
                    {(isAdmin || isStaff) && !appointment.checkedIn && appointment.status === 'scheduled' && (
                      <button className="btn btn-outline btn-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        Check In
                      </button>
                    )}
                    <button className="btn btn-outline btn-sm">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Appointments
