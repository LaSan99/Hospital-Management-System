import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { 
  Calendar, 
  Plus, 
  Search, 
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  MapPin,
  Phone
} from 'lucide-react'
import { appointmentsAPI } from '../services/api'
import toast from 'react-hot-toast'

const PatientAppointments = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data: appointmentsData, isLoading, error, refetch } = useQuery(
    'patient-appointments',
    () => appointmentsAPI.getAll(),
    { enabled: true }
  )

  // Debug logging
  console.log('Appointments Data:', appointmentsData)
  console.log('Current User:', user)
  
  const appointments = appointmentsData?.data?.data?.appointments || 
                       appointmentsData?.data?.appointments || 
                       []
  
  console.log('Parsed Appointments:', appointments)
  console.log('Appointments count:', appointments.length)
  
  // Backend already filters by patient ID, so we use all appointments directly
  // Filter by search term and status only
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.appointmentType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'badge-info'
      case 'confirmed':
        return 'badge-success'
      case 'completed':
        return 'badge-success'
      case 'cancelled':
        return 'badge-danger'
      case 'no_show':
        return 'badge-warning'
      default:
        return 'badge-warning'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      case 'no_show':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancel(appointmentId)
        toast.success('Appointment cancelled successfully')
        refetch()
      } catch (error) {
        toast.error('Failed to cancel appointment')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8" />
      </div>
    )
  }

  if (error) {
    console.error('Error loading appointments:', error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
        <p className="text-red-600">
          {error.response?.data?.message || 'Failed to load appointments. Please try again.'}
        </p>
        <button onClick={() => refetch()} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-600">Manage your appointments and schedule new ones</p>
        </div>
        <button 
          onClick={() => window.location.href = '/doctors'}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </button>
      </div>

      {/* Debug Info (Remove in production) */}
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-xs">
        <p><strong>Debug Info:</strong></p>
        <p>Total appointments from API: {appointments.length}</p>
        <p>After search/status filter: {filteredAppointments.length}</p>
        <p>Current user ID: {user?._id || 'Not loaded'}</p>
        <p>Current user role: {user?.role || 'Not loaded'}</p>
        <p>API Response structure: {appointmentsData ? 'Loaded' : 'Not loaded'}</p>
        <p>Search term: "{searchTerm}"</p>
        <p>Status filter: {filterStatus}</p>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select w-full sm:w-auto"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Appointments ({filteredAppointments.length})
          </h2>
        </div>
        
        {filteredAppointments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="px-6 py-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          Dr. {appointment.doctorName}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({appointment.doctorSpecialization})
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {appointment.location} • Room {appointment.room || 'TBD'}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          ${appointment.consultationFee || 'Free'}
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Type:</span> {appointment.appointmentType}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {appointment.reason}
                        </p>
                        {appointment.symptoms && appointment.symptoms.length > 0 && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Symptoms:</span> {appointment.symptoms.join(', ')}
                          </p>
                        )}
                      </div>
                      
                      {appointment.notes && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <span className={`badge ${getStatusColor(appointment.status)} inline-flex items-center`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status.replace('_', ' ')}</span>
                      </span>
                      
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          className="btn btn-outline btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                      
                      {appointment.status === 'confirmed' && appointment.checkedIn && (
                        <span className="badge badge-success inline-flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Checked In
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No appointments found' : 'No appointments yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Book your first appointment to get started'
              }
            </p>
            <button 
              onClick={() => window.location.href = '/doctors'}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientAppointments
