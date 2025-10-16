import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Calendar, 
  Search, 
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  XCircle,
  Check,
  X,
  Eye,
  Filter,
  FileText,
  Pill,
  Activity,
  Plus,
  Save,
  Stethoscope
} from 'lucide-react'
import { appointmentsAPI, medicalRecordsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const DoctorAppointments = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showMedicineModal, setShowMedicineModal] = useState(false)
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null)

  // Full form state
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    recordType: 'medicine',
    diagnosis: { mainProblem: '', symptoms: '', notes: '' },
    treatment: { medications: [], procedures: '', recommendations: '' },
    vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
    followUp: { nextAppointment: '', instructions: '', warningSigns: '' },
    doctorNotes: '',
    patientComplaints: ''
  })
  const [currentMedication, setCurrentMedication] = useState({
    name: '', dosage: '', frequency: '', duration: '', instructions: ''
  })

  const { data: appointmentsData, isLoading, error } = useQuery(
    'doctor-appointments',
    () => appointmentsAPI.getAll(),
    { 
      enabled: true,
      refetchInterval: 30000
    }
  )

  // Mutation: Update appointment status
  const updateStatusMutation = useMutation(
    ({ appointmentId, newStatus }) => {
      if (newStatus === 'cancelled') {
        return appointmentsAPI.cancel(appointmentId)
      }
      return appointmentsAPI.update(appointmentId, { status: newStatus })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctor-appointments')
        toast.success('Appointment status updated successfully')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update appointment status')
      }
    }
  )

  // Mutation: Create medical record
  const createMedicalRecordMutation = useMutation(
    (recordData) => medicalRecordsAPI.create(recordData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctor-appointments')
        toast.success('Medical record created successfully')
        setShowMedicineModal(false)
        resetForm()
      },
      onError: (error) => {
        console.error('Submission error:', error)
        toast.error(error.response?.data?.message || 'Failed to create medical record')
      }
    }
  )

  const appointments = appointmentsData?.data?.data?.appointments || 
                       appointmentsData?.data?.appointments || []

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const stats = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    total: appointments.length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'no_show': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <Check className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      case 'no_show': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleStatusChange = (appointmentId, newStatus) => {
    if (window.confirm(`Are you sure you want to change the status to "${newStatus}"?`)) {
      updateStatusMutation.mutate({ appointmentId, newStatus })
    }
  }

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const resetForm = () => {
    setFormData({
      patientId: '',
      appointmentId: '',
      recordType: 'medicine',
      diagnosis: { mainProblem: '', symptoms: '', notes: '' },
      treatment: { medications: [], procedures: '', recommendations: '' },
      vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
      followUp: { nextAppointment: '', instructions: '', warningSigns: '' },
      doctorNotes: '',
      patientComplaints: ''
    })
    setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
  }

  const handleOpenMedicineModal = (appointmentId) => {
    const appointment = appointments.find(apt => apt._id === appointmentId)
    if (!appointment) {
      toast.error('Appointment not found')
      return
    }

    const patientId = appointment.patientId?._id || appointment.patientId
    if (!patientId) {
      toast.error('Patient ID missing')
      return
    }

    setFormData({
      patientId: patientId,
      appointmentId: appointmentId,
      recordType: 'medicine',
      diagnosis: { 
        mainProblem: appointment.reason || '', 
        symptoms: Array.isArray(appointment.symptoms) ? appointment.symptoms.join(', ') : '', 
        notes: '' 
      },
      treatment: { medications: [], procedures: '', recommendations: '' },
      vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
      followUp: { nextAppointment: '', instructions: '', warningSigns: '' },
      doctorNotes: '',
      patientComplaints: appointment.reason || ''
    })

    setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
    setCurrentAppointmentId(appointmentId)
    setShowMedicineModal(true)
  }

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleAddMedication = () => {
    if (currentMedication.name && currentMedication.dosage) {
      setFormData(prev => ({
        ...prev,
        treatment: {
          ...prev.treatment,
          medications: [...prev.treatment.medications, { ...currentMedication }]
        }
      }))
      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
    } else {
      toast.error('Please fill in medication name and dosage')
    }
  }

  const handleRemoveMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: prev.treatment.medications.filter((_, i) => i !== index)
      }
    }))
  }

  const handleSubmitMedicine = (e) => {
    e.preventDefault()
    
    // Ensure doctor is authenticated
    if (!user?._id) {
      toast.error('Doctor not authenticated. Please log in again.')
      return
    }

    // Ensure patient and appointment are set
    if (!formData.patientId || !formData.appointmentId) {
      toast.error('Patient or appointment information is missing')
      return
    }

    // 🔥 CRITICAL: Require at least one medication for 'medicine' type
    if (formData.recordType === 'medicine' && formData.treatment.medications.length === 0) {
      toast.error('At least one medication is required for medicine records')
      return
    }

    // Format arrays
    const submitData = {
      doctorId: user._id, // ✅ Required by backend
      ...formData,
      diagnosis: {
        ...formData.diagnosis,
        symptoms: formData.diagnosis.symptoms 
          ? formData.diagnosis.symptoms.split(',').map(s => s.trim()).filter(Boolean) 
          : []
      },
      treatment: {
        ...formData.treatment,
        procedures: formData.treatment.procedures 
          ? formData.treatment.procedures.split(',').map(s => s.trim()).filter(Boolean) 
          : [],
        recommendations: formData.treatment.recommendations 
          ? formData.treatment.recommendations.split(',').map(s => s.trim()).filter(Boolean) 
          : []
      },
      followUp: {
        ...formData.followUp,
        warningSigns: formData.followUp.warningSigns 
          ? formData.followUp.warningSigns.split(',').map(s => s.trim()).filter(Boolean) 
          : []
      }
    }

    createMedicalRecordMutation.mutate(submitData)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
        <p className="text-red-600">
          {error.response?.data?.message || 'Failed to load appointments. Please try again.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600">Manage and update your patient appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-900">{stats.scheduled}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <Check className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-900">{stats.cancelled}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
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
                placeholder="Search by patient name, reason, or type..."
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
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Appointments ({filteredAppointments.length})
          </h2>
        </div>
        
        {filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{appointment.patientName}</div>
                          <div className="text-sm text-gray-500">{appointment.patientEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                      <div className="text-sm text-gray-500">
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 capitalize">
                        {appointment.appointmentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{appointment.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {appointment.status === 'completed' && (
                          <button
                            onClick={() => navigate('/medical-records', { state: { appointmentId: appointment._id, patientId: appointment.patientId?._id } })}
                            className="text-green-600 hover:text-green-900"
                            title="Add Medical Record"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}

                        {/* Show Medicine & Treatment buttons only if confirmed */}
                        {appointment.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleOpenMedicineModal(appointment._id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Add Medicine Record"
                            >
                              <Pill className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate('/medical-records', { state: { appointmentId: appointment._id, patientId: appointment.patientId?._id } })}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Add Full Medical Record"
                            >
                              <Stethoscope className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <select
                          value={appointment.status}
                          onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={updateStatusMutation.isLoading}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no_show">No Show</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No appointments found' : 'No appointments yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Appointments will appear here when patients book with you'
              }
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Patient Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {selectedAppointment.patientName}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedAppointment.patientEmail}</p>
                  <p className="text-sm"><strong>Phone:</strong> {selectedAppointment.patientPhone || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Appointment Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><strong>Date:</strong> {formatDate(selectedAppointment.appointmentDate)}</p>
                  <p className="text-sm"><strong>Time:</strong> {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}</p>
                  <p className="text-sm"><strong>Type:</strong> <span className="capitalize">{selectedAppointment.appointmentType?.replace('_', ' ')}</span></p>
                  <p className="text-sm"><strong>Status:</strong> 
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-1 capitalize">{selectedAppointment.status?.replace('_', ' ')}</span>
                    </span>
                  </p>
                  <p className="text-sm"><strong>Fee:</strong> ${selectedAppointment.consultationFee || 'N/A'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Medical Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reason for Visit:</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedAppointment.reason}</p>
                  </div>
                  {selectedAppointment.symptoms?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Symptoms:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedAppointment.symptoms.map((symptom, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Notes:</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment._id, 'confirmed')
                      setShowDetailsModal(false)
                    }}
                    className="btn btn-success btn-sm"
                    disabled={selectedAppointment.status === 'confirmed'}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment._id, 'completed')
                      setShowDetailsModal(false)
                    }}
                    className="btn btn-primary btn-sm"
                    disabled={selectedAppointment.status === 'completed'}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Complete
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment._id, 'cancelled')
                      setShowDetailsModal(false)
                    }}
                    className="btn btn-danger btn-sm"
                    disabled={selectedAppointment.status === 'cancelled'}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t">
              <button onClick={() => setShowDetailsModal(false)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Medicine / Medical Record Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Add Medicine Record</h2>
              <button 
                onClick={() => { setShowMedicineModal(false); resetForm(); }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitMedicine} className="p-6 space-y-6">
              {/* Vital Signs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <input 
                    type="text" 
                    value={formData.vitalSigns.bloodPressure} 
                    onChange={(e) => handleInputChange('vitalSigns', 'bloodPressure', e.target.value)} 
                    placeholder="BP: 120/80" 
                    className="form-input" 
                  />
                  <input 
                    type="number" 
                    value={formData.vitalSigns.heartRate} 
                    onChange={(e) => handleInputChange('vitalSigns', 'heartRate', e.target.value)} 
                    placeholder="HR (bpm)" 
                    className="form-input" 
                  />
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.vitalSigns.temperature} 
                    onChange={(e) => handleInputChange('vitalSigns', 'temperature', e.target.value)} 
                    placeholder="Temp (°F)" 
                    className="form-input" 
                  />
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.vitalSigns.weight} 
                    onChange={(e) => handleInputChange('vitalSigns', 'weight', e.target.value)} 
                    placeholder="Weight (kg)" 
                    className="form-input" 
                  />
                  <input 
                    type="number" 
                    step="0.1" 
                    value={formData.vitalSigns.height} 
                    onChange={(e) => handleInputChange('vitalSigns', 'height', e.target.value)} 
                    placeholder="Height (cm)" 
                    className="form-input" 
                  />
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Diagnosis</h3>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={formData.diagnosis.mainProblem} 
                    onChange={(e) => handleInputChange('diagnosis', 'mainProblem', e.target.value)} 
                    placeholder="Main Problem" 
                    className="form-input" 
                  />
                  <input 
                    type="text" 
                    value={formData.diagnosis.symptoms} 
                    onChange={(e) => handleInputChange('diagnosis', 'symptoms', e.target.value)} 
                    placeholder="Symptoms (comma-separated)" 
                    className="form-input" 
                  />
                  <textarea 
                    value={formData.diagnosis.notes} 
                    onChange={(e) => handleInputChange('diagnosis', 'notes', e.target.value)} 
                    rows={2} 
                    placeholder="Diagnosis notes..." 
                    className="form-textarea" 
                  />
                </div>
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Medications</h3>
                {formData.treatment.medications.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.treatment.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <p className="font-medium">{med.name} - {med.dosage}</p>
                          <p className="text-sm text-gray-600">{med.frequency} for {med.duration}</p>
                          {med.instructions && <p className="text-xs text-gray-500">{med.instructions}</p>}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMedication(index)} 
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-blue-50 p-3 rounded space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={currentMedication.name} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))} 
                      placeholder="Name *" 
                      className="form-input" 
                    />
                    <input 
                      type="text" 
                      value={currentMedication.dosage} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))} 
                      placeholder="Dosage *" 
                      className="form-input" 
                    />
                    <input 
                      type="text" 
                      value={currentMedication.frequency} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))} 
                      placeholder="Frequency" 
                      className="form-input" 
                    />
                    <input 
                      type="text" 
                      value={currentMedication.duration} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))} 
                      placeholder="Duration" 
                      className="form-input" 
                    />
                  </div>
                  <textarea 
                    value={currentMedication.instructions} 
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))} 
                    rows={1} 
                    placeholder="Instructions (optional)" 
                    className="form-textarea mt-2"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddMedication} 
                    className="btn btn-sm btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Medication
                  </button>
                </div>
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor's Notes</label>
                <textarea 
                  value={formData.doctorNotes} 
                  onChange={(e) => handleInputChange(null, 'doctorNotes', e.target.value)} 
                  rows={3} 
                  placeholder="Additional notes..." 
                  className="form-textarea" 
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => { setShowMedicineModal(false); resetForm(); }} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMedicalRecordMutation.isLoading} 
                  className="btn btn-primary"
                >
                  {createMedicalRecordMutation.isLoading ? (
                    <><LoadingSpinner size="sm" /><span className="ml-2">Creating...</span></>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Save Medicine Record</>
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

export default DoctorAppointments