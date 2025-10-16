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
  Stethoscope,
  CreditCard,
  ChevronDown,
  MoreVertical,
  Edit3,
  TrendingUp
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
      case 'scheduled': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20'
      case 'confirmed': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
      case 'completed': return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
      case 'cancelled': return 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
      case 'no_show': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      default: return 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-3.5 w-3.5" />
      case 'confirmed': return <CheckCircle className="h-3.5 w-3.5" />
      case 'completed': return <Check className="h-3.5 w-3.5" />
      case 'cancelled': return <XCircle className="h-3.5 w-3.5" />
      case 'no_show': return <AlertCircle className="h-3.5 w-3.5" />
      default: return <Clock className="h-3.5 w-3.5" />
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
    
    if (!user?._id) {
      toast.error('Doctor not authenticated. Please log in again.')
      return
    }

    if (!formData.patientId || !formData.appointmentId) {
      toast.error('Patient or appointment information is missing')
      return
    }

    if (formData.recordType === 'medicine' && formData.treatment.medications.length === 0) {
      toast.error('At least one medication is required for medicine records')
      return
    }

    const submitData = {
      doctorId: user._id,
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
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Appointments</h3>
        <p className="text-red-600">
          {error.response?.data?.message || 'Failed to load appointments. Please try again.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Appointments</h1>
          <p className="text-gray-600 mt-1">Manage and update your patient appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <TrendingUp className="h-3 w-3 mr-1" />
                <span>All time</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-5 border border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Scheduled</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.scheduled}</p>
              <div className="flex items-center mt-2 text-xs text-blue-600">
                <Activity className="h-3 w-3 mr-1" />
                <span>Pending</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-sm p-5 border border-emerald-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">Confirmed</p>
              <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.confirmed}</p>
              <div className="flex items-center mt-2 text-xs text-emerald-600">
                <Activity className="h-3 w-3 mr-1" />
                <span>Ready</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl shadow-sm p-5 border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-700 uppercase tracking-wide">Completed</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completed}</p>
              <div className="flex items-center mt-2 text-xs text-slate-600">
                <Check className="h-3 w-3 mr-1" />
                <span>Done</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <Check className="h-6 w-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm p-5 border border-red-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Cancelled</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.cancelled}</p>
              <div className="flex items-center mt-2 text-xs text-red-600">
                <XCircle className="h-3 w-3 mr-1" />
                <span>Inactive</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, reason, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Enhanced Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Appointments ({filteredAppointments.length})
          </h2>
        </div>
        
        {filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-sm">
                              {appointment.patientName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{appointment.patientName}</div>
                          <div className="text-xs text-gray-500">{appointment.patientEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatDate(appointment.appointmentDate)}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20">
                        {appointment.appointmentType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{appointment.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        appointment.paymentStatus 
                          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
                          : 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20'
                      }`}>
                        <CreditCard className="h-3 w-3 mr-1.5" />
                        {appointment.paymentStatus ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1.5 capitalize">{appointment.status?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {appointment.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleOpenMedicineModal(appointment._id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Add Medicine Record"
                            >
                              <Pill className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate('/medical-records', { state: { appointmentId: appointment._id, patientId: appointment.patientId?._id } })}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Add Full Medical Record"
                            >
                              <Stethoscope className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <div className="relative group">
                          <select
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                            className="appearance-none text-xs font-medium border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-colors cursor-pointer"
                            disabled={updateStatusMutation.isLoading}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="no_show">No Show</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No appointments found' : 'No appointments yet'}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Appointments will appear here when patients book with you'
              }
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                <p className="text-sm text-gray-600 mt-1">Review patient and appointment information</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedAppointment.patientName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedAppointment.patientEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedAppointment.patientPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                  Appointment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Date</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDate(selectedAppointment.appointmentDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Time</p>
                    <p className="text-sm font-semibold text-gray-900">{formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Type</p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                      {selectedAppointment.appointmentType?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(selectedAppointment.status)}`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-1.5 capitalize">{selectedAppointment.status?.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Consultation Fee</p>
                    <p className="text-sm font-semibold text-gray-900">${selectedAppointment.consultationFee || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Reason for Visit</p>
                    <p className="text-sm text-gray-900 bg-white rounded-lg p-3 border border-green-200">{selectedAppointment.reason}</p>
                  </div>
                  {selectedAppointment.symptoms?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Symptoms</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.symptoms.map((symptom, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Additional Notes</p>
                      <p className="text-sm text-gray-900 bg-white rounded-lg p-3 border border-green-200">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment._id, 'confirmed')
                      setShowDetailsModal(false)
                    }}
                    className="inline-flex items-center px-4 py-2.5 border border-emerald-300 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={selectedAppointment.status === 'confirmed'}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Appointment
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment._id, 'completed')
                      setShowDetailsModal(false)
                    }}
                    className="inline-flex items-center px-4 py-2.5 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={selectedAppointment.status === 'completed'}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment._id, 'cancelled')
                      setShowDetailsModal(false)
                    }}
                    className="inline-flex items-center px-4 py-2.5 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    disabled={selectedAppointment.status === 'cancelled'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Appointment
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Medicine Modal */}
      {showMedicineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Medicine Record</h2>
                <p className="text-sm text-gray-600 mt-1">Document patient treatment and medications</p>
              </div>
              <button 
                onClick={() => { setShowMedicineModal(false); resetForm(); }} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitMedicine} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Vital Signs */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Pressure</label>
                    <input 
                      type="text" 
                      value={formData.vitalSigns.bloodPressure} 
                      onChange={(e) => handleInputChange('vitalSigns', 'bloodPressure', e.target.value)} 
                      placeholder="120/80" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Heart Rate</label>
                    <input 
                      type="number" 
                      value={formData.vitalSigns.heartRate} 
                      onChange={(e) => handleInputChange('vitalSigns', 'heartRate', e.target.value)} 
                      placeholder="72 bpm" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.vitalSigns.temperature} 
                      onChange={(e) => handleInputChange('vitalSigns', 'temperature', e.target.value)} 
                      placeholder="98.6°F" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.vitalSigns.weight} 
                      onChange={(e) => handleInputChange('vitalSigns', 'weight', e.target.value)} 
                      placeholder="70" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.vitalSigns.height} 
                      onChange={(e) => handleInputChange('vitalSigns', 'height', e.target.value)} 
                      placeholder="170" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Diagnosis
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Main Problem</label>
                    <input 
                      type="text" 
                      value={formData.diagnosis.mainProblem} 
                      onChange={(e) => handleInputChange('diagnosis', 'mainProblem', e.target.value)} 
                      placeholder="Primary diagnosis" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Symptoms (comma-separated)</label>
                    <input 
                      type="text" 
                      value={formData.diagnosis.symptoms} 
                      onChange={(e) => handleInputChange('diagnosis', 'symptoms', e.target.value)} 
                      placeholder="fever, headache, fatigue" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis Notes</label>
                    <textarea 
                      value={formData.diagnosis.notes} 
                      onChange={(e) => handleInputChange('diagnosis', 'notes', e.target.value)} 
                      rows={3} 
                      placeholder="Additional diagnostic information..." 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-purple-600" />
                  Medications {formData.treatment.medications.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {formData.treatment.medications.length}
                    </span>
                  )}
                </h3>
                
                {formData.treatment.medications.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {formData.treatment.medications.map((med, index) => (
                      <div key={index} className="flex items-start justify-between bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                              {index + 1}
                            </span>
                            <p className="font-semibold text-gray-900">{med.name}</p>
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 ml-8">
                            {med.frequency} • {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-xs text-gray-500 ml-8 mt-1 italic">{med.instructions}</p>
                          )}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMedication(index)} 
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-3"
                          title="Remove medication"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-white p-4 rounded-lg border-2 border-dashed border-purple-300">
                  <p className="text-sm font-medium text-gray-700 mb-3">Add New Medication</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name *</label>
                        <input 
                          type="text" 
                          value={currentMedication.name} 
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))} 
                          placeholder="e.g., Amoxicillin" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Dosage *</label>
                        <input 
                          type="text" 
                          value={currentMedication.dosage} 
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))} 
                          placeholder="e.g., 500mg" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                        <input 
                          type="text" 
                          value={currentMedication.frequency} 
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))} 
                          placeholder="e.g., 3 times daily" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duration</label>
                        <input 
                          type="text" 
                          value={currentMedication.duration} 
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))} 
                          placeholder="e.g., 7 days" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Instructions (optional)</label>
                      <textarea 
                        value={currentMedication.instructions} 
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))} 
                        rows={2} 
                        placeholder="e.g., Take after meals with water" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddMedication} 
                      className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Medication to List
                    </button>
                  </div>
                </div>
              </div>

              {/* Doctor Notes */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Edit3 className="h-5 w-5 mr-2 text-amber-600" />
                  Doctor's Notes
                </h3>
                <textarea 
                  value={formData.doctorNotes} 
                  onChange={(e) => handleInputChange(null, 'doctorNotes', e.target.value)} 
                  rows={4} 
                  placeholder="Additional observations, recommendations, or important notes..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none" 
                />
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => { setShowMedicineModal(false); resetForm(); }} 
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMedicalRecordMutation.isLoading} 
                  className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all"
                >
                  {createMedicalRecordMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Creating Record...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> 
                      Save Medicine Record
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

export default DoctorAppointments