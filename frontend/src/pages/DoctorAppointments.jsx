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
  Users,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Trash2,
  Sparkles,
  Edit3,
  Download
} from 'lucide-react'
import { appointmentsAPI, medicalRecordsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

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
  const [activeTab, setActiveTab] = useState('upcoming')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

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

  // Generate PDF report function
  const generateAppointmentsReport = () => {
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Doctor Appointments Report', 20, 30)
      
      // Doctor info
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Doctor: Dr. ${user?.firstName} ${user?.lastName}`, 20, 45)
      doc.text(`Specialization: ${user?.specialization || 'General Practice'}`, 20, 55)
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, 65)
      
      // Statistics
      const totalAppointments = appointments.length
      const completedAppointments = appointments.filter(apt => apt.status === 'completed').length
      const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length
      const upcomingAppointments = appointments.filter(apt => ['scheduled', 'confirmed'].includes(apt.status)).length
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary Statistics', 20, 85)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Appointments: ${totalAppointments}`, 20, 100)
      doc.text(`Completed: ${completedAppointments}`, 20, 110)
      doc.text(`Cancelled: ${cancelledAppointments}`, 20, 120)
      doc.text(`Upcoming: ${upcomingAppointments}`, 20, 130)
      
      // Appointments table
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Appointments List', 20, 150)
      
      // Table headers
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('Date', 20, 165)
      doc.text('Time', 50, 165)
      doc.text('Patient', 80, 165)
      doc.text('Type', 130, 165)
      doc.text('Status', 160, 165)
      doc.text('Fee', 190, 165)
      
      // Table data
      doc.setFont('helvetica', 'normal')
      let yPosition = 175
      
      appointments.slice(0, 20).forEach((appointment, index) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        
        const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString()
        const timeSlot = `${appointment.startTime} - ${appointment.endTime}`
        const patientName = appointment.patientName || 'Unknown'
        const appointmentType = appointment.appointmentType || 'Consultation'
        const status = appointment.status || 'Unknown'
        const fee = appointment.consultationFee || 'N/A'
        
        doc.text(appointmentDate, 20, yPosition)
        doc.text(timeSlot, 50, yPosition)
        doc.text(patientName.length > 15 ? patientName.substring(0, 15) + '...' : patientName, 80, yPosition)
        doc.text(appointmentType, 130, yPosition)
        doc.text(status, 160, yPosition)
        doc.text(`$${fee}`, 190, yPosition)
        
        yPosition += 8
      })
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10)
        doc.text(`Generated on ${new Date().toLocaleString()}`, 120, doc.internal.pageSize.height - 10)
      }
      
      // Save the PDF
      const fileName = `Doctor_Appointments_Report_${user?.firstName}_${user?.lastName}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      toast.success('Appointments report downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate report')
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.appointmentType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const upcomingAppointments = filteredAppointments.filter(apt => 
    ['scheduled', 'confirmed'].includes(apt.status)
  )
  const completedAppointments = filteredAppointments.filter(apt => 
    apt.status === 'completed'
  )

  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : 
                             activeTab === 'completed' ? completedAppointments : 
                             filteredAppointments

  const stats = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    total: appointments.length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-200'
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
      case 'completed': return 'bg-gray-500/10 text-gray-600 border-gray-200'
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200'
      case 'no_show': return 'bg-amber-500/10 text-amber-600 border-amber-200'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-200'
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
      toast.success('Medication added to list')
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
    toast.success('Medication removed')
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

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading your appointments...</p>
      </div>
    </div>
  )

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Appointments</h3>
          <p className="text-red-600 mb-4">
            {error.response?.data?.message || 'Failed to load appointments. Please try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                My Appointments
              </h1>
            </div>
            <p className="text-gray-600 text-lg">Manage and update your patient appointments</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
            <div className="relative group">
              <button className="inline-flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:shadow-md hover:border-gray-300 transition-all duration-200 shadow-sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter & Sort
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
            </div>
            <button 
              onClick={generateAppointmentsReport}
              className="inline-flex items-center px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { 
              label: 'Total Appointments', 
              value: stats.total, 
              icon: Calendar, 
              color: 'gray',
              gradient: 'from-gray-500 to-gray-600'
            },
            { 
              label: 'Scheduled', 
              value: stats.scheduled, 
              icon: Clock, 
              color: 'blue',
              gradient: 'from-blue-500 to-cyan-500'
            },
            { 
              label: 'Confirmed', 
              value: stats.confirmed, 
              icon: CheckCircle, 
              color: 'emerald',
              gradient: 'from-emerald-500 to-green-500'
            },
            { 
              label: 'Completed', 
              value: stats.completed, 
              icon: Check, 
              color: 'gray',
              gradient: 'from-gray-400 to-gray-500'
            },
            { 
              label: 'Cancelled', 
              value: stats.cancelled, 
              icon: XCircle, 
              color: 'red',
              gradient: 'from-red-500 to-pink-500'
            }
          ].map((stat, index) => (
            <div 
              key={stat.label}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <div className={`w-2 h-2 bg-${stat.color}-500 rounded-full mr-2`}></div>
                    <span className="text-xs text-gray-500">Live updates</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Search and Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients, reasons, or appointment types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 focus:bg-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none px-4 py-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer"
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

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mt-6 -mx-6 px-6">
            {[
              { id: 'upcoming', label: 'Upcoming', count: upcomingAppointments.length },
              { id: 'completed', label: 'Completed', count: completedAppointments.length },
              { id: 'all', label: 'All Appointments', count: filteredAppointments.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card View for Appointments */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayAppointments.map((appointment) => (
              <div 
                key={appointment._id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:scale-105 group overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-sm">
                          {appointment.patientName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                        <p className="text-sm text-gray-500">{appointment.patientEmail}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1.5 capitalize">{appointment.status?.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Appointment Type</p>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {appointment.appointmentType?.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                    <p className="text-sm text-gray-900 line-clamp-2">{appointment.reason}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Payment</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
                        appointment.paymentStatus 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <CreditCard className="h-3 w-3 mr-1.5" />
                        {appointment.paymentStatus ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    
                    {appointment.consultationFee && (
                      <div className="text-right">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fee</p>
                        <p className="text-sm font-semibold text-gray-900">Rs. {appointment.consultationFee}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer - Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => handleViewDetails(appointment)}
                        className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {/* Add Medicine Button with Highlight */}
                      {appointment.status === 'completed' && (
                        <button
                          onClick={() => handleOpenMedicineModal(appointment._id)}
                          className="p-2.5 text-purple-600 bg-purple-50 border border-purple-200 rounded-xl transition-all duration-200 hover:bg-purple-100 hover:border-purple-300 hover:shadow-md flex items-center gap-1.5 relative group/medicine"
                          title="Add Medicine Record"
                        >
                          <Pill className="h-4 w-4" />
                          <span className="text-xs font-medium">Medicine</span>
                          {/* Highlight dot */}
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                        className="appearance-none text-xs font-medium border border-gray-300 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-all duration-200 cursor-pointer bg-white"
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {activeTab === 'upcoming' ? 'Upcoming Appointments' : 
                   activeTab === 'completed' ? 'Completed Appointments' : 
                   'All Appointments'} 
                  <span className="text-sm font-normal text-gray-500 bg-white px-2 py-1 rounded-full border">
                    {displayAppointments.length}
                  </span>
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="h-4 w-4" />
                  Auto-refreshing every 30 seconds
                </div>
              </div>
            </div>
            
            {displayAppointments.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {displayAppointments.map((appointment) => (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50/50 transition-all duration-200 group">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Patient Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-sm">
                              {appointment.patientName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {appointment.status === 'confirmed' && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1.5 capitalize">{appointment.status?.replace('_', ' ')}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{appointment.patientEmail}</p>
                          <p className="text-sm text-gray-500 mt-1">{appointment.reason}</p>
                        </div>
                      </div>

                      {/* Appointment Details */}
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                      </div>

                      {/* Type and Payment */}
                      <div className="flex flex-col gap-2 min-w-[150px]">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {appointment.appointmentType?.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                          appointment.paymentStatus 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <CreditCard className="h-3 w-3 mr-1.5" />
                          {appointment.paymentStatus ? 'Paid' : 'Pending'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-blue-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {/* Add Medicine Button with Highlight */}
                        {appointment.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleOpenMedicineModal(appointment._id)}
                              className="p-2.5 text-purple-600 bg-purple-50 border border-purple-200 rounded-xl transition-all duration-200 hover:bg-purple-100 hover:border-purple-300 hover:shadow-md flex items-center gap-1.5 relative group/medicine"
                              title="Add Medicine Record"
                            >
                              <Pill className="h-4 w-4" />
                              <span className="text-xs font-medium">Medicine</span>
                              {/* Highlight dot */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                            </button>
                            
                            <button
                              onClick={() => navigate('/medical-records', { state: { appointmentId: appointment._id, patientId: appointment.patientId?._id } })}
                              className="p-2.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-indigo-200"
                              title="Add Full Medical Record"
                            >
                              <Stethoscope className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        
                        <div className="relative">
                          <select
                            value={appointment.status}
                            onChange={(e) => handleStatusChange(appointment._id, e.target.value)}
                            className="appearance-none text-xs font-medium border border-gray-300 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 transition-all duration-200 cursor-pointer bg-white"
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                  <Calendar className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No appointments found' : 'No appointments yet'}
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Appointments will appear here when patients book with you'
                  }
                </p>
                {(searchTerm || filterStatus !== 'all') && (
                  <button
                    onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center p-8 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                <p className="text-gray-600 mt-1">Review patient and appointment information</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-2xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
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

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
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
                    <p className="text-sm font-semibold text-gray-900">Rs. {selectedAppointment.consultationFee || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center p-8 border-b bg-gradient-to-r from-purple-50 to-pink-50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add Medical Record</h2>
                <p className="text-gray-600 mt-1">Document patient treatment and medications</p>
              </div>
              <button 
                onClick={() => { setShowMedicineModal(false); resetForm(); }} 
                className="p-3 text-gray-400 hover:text-gray-600 hover:bg-white rounded-2xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitMedicine} className="p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Patient Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Complaints</label>
                    <textarea
                      value={formData.patientComplaints}
                      onChange={(e) => handleInputChange(null, 'patientComplaints', e.target.value)}
                      rows={3}
                      placeholder="Describe patient's complaints..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Pressure</label>
                    <input
                      type="text"
                      value={formData.vitalSigns.bloodPressure}
                      onChange={(e) => handleInputChange('vitalSigns', 'bloodPressure', e.target.value)}
                      placeholder="120/80"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heart Rate</label>
                    <input
                      type="number"
                      value={formData.vitalSigns.heartRate}
                      onChange={(e) => handleInputChange('vitalSigns', 'heartRate', e.target.value)}
                      placeholder="72 bpm"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.temperature}
                      onChange={(e) => handleInputChange('vitalSigns', 'temperature', e.target.value)}
                      placeholder="98.6°F"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.weight}
                      onChange={(e) => handleInputChange('vitalSigns', 'weight', e.target.value)}
                      placeholder="70"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitalSigns.height}
                      onChange={(e) => handleInputChange('vitalSigns', 'height', e.target.value)}
                      placeholder="170"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Diagnosis
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Problem</label>
                    <input
                      type="text"
                      value={formData.diagnosis.mainProblem}
                      onChange={(e) => handleInputChange('diagnosis', 'mainProblem', e.target.value)}
                      placeholder="Primary diagnosis"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.diagnosis.symptoms}
                      onChange={(e) => handleInputChange('diagnosis', 'symptoms', e.target.value)}
                      placeholder="fever, headache, fatigue"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Notes</label>
                    <textarea
                      value={formData.diagnosis.notes}
                      onChange={(e) => handleInputChange('diagnosis', 'notes', e.target.value)}
                      rows={3}
                      placeholder="Additional diagnostic information..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-purple-600" />
                  Medications
                  {formData.treatment.medications.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {formData.treatment.medications.length}
                    </span>
                  )}
                </h3>
                
                {/* Current Medications List */}
                {formData.treatment.medications.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Current Medications:</h4>
                    {formData.treatment.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg border border-purple-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                              {index + 1}
                            </span>
                            <p className="font-semibold text-gray-900">{med.name}</p>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                              {med.dosage}
                            </span>
                          </div>
                          <div className="ml-9 text-sm text-gray-600">
                            <p><strong>Frequency:</strong> {med.frequency}</p>
                            <p><strong>Duration:</strong> {med.duration}</p>
                            {med.instructions && (
                              <p><strong>Instructions:</strong> {med.instructions}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
                          title="Remove medication"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Medication Form */}
                <div className="bg-white p-6 rounded-lg border-2 border-dashed border-purple-300">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Medication</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name *</label>
                        <input
                          type="text"
                          value={currentMedication.name}
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Amoxicillin"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dosage *</label>
                        <input
                          type="text"
                          value={currentMedication.dosage}
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                          placeholder="e.g., 500mg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                        <input
                          type="text"
                          value={currentMedication.frequency}
                          onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
                          placeholder="e.g., 3 times daily"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instructions (optional)</label>
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
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Medication to List
                    </button>
                  </div>
                </div>
              </div>

              {/* Treatment & Procedures */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-cyan-600" />
                  Treatment & Procedures
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Procedures (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.treatment.procedures}
                      onChange={(e) => handleInputChange('treatment', 'procedures', e.target.value)}
                      placeholder="blood test, x-ray, physical therapy"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
                    <textarea
                      value={formData.treatment.recommendations}
                      onChange={(e) => handleInputChange('treatment', 'recommendations', e.target.value)}
                      rows={3}
                      placeholder="Lifestyle changes, follow-up tests, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Follow-up */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-amber-600" />
                  Follow-up Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Next Appointment</label>
                    <input
                      type="date"
                      value={formData.followUp.nextAppointment}
                      onChange={(e) => handleInputChange('followUp', 'nextAppointment', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                    <textarea
                      value={formData.followUp.instructions}
                      onChange={(e) => handleInputChange('followUp', 'instructions', e.target.value)}
                      rows={2}
                      placeholder="Follow-up instructions for the patient"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Warning Signs (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.followUp.warningSigns}
                      onChange={(e) => handleInputChange('followUp', 'warningSigns', e.target.value)}
                      placeholder="fever above 101°F, severe pain, difficulty breathing"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Doctor's Notes */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Edit3 className="h-5 w-5 mr-2 text-gray-600" />
                  Doctor's Notes
                </h3>
                <textarea
                  value={formData.doctorNotes}
                  onChange={(e) => handleInputChange(null, 'doctorNotes', e.target.value)}
                  rows={4}
                  placeholder="Additional observations, recommendations, or important notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                />
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => { setShowMedicineModal(false); resetForm(); }}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMedicalRecordMutation.isLoading}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {createMedicalRecordMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Creating Record...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Medical Record
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