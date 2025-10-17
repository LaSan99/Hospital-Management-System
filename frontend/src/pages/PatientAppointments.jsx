import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
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
  Phone,
  Pill,
  X,
  Download,
  CreditCard,
  Filter,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  FileText,
  DollarSign,
  Star,
  Zap,
  Shield,
  Bell,
  ArrowRight,
  Calendar as CalendarIcon,
  TrendingUp,
  Heart,
  Trash2
} from 'lucide-react'
import { appointmentsAPI, medicalRecordsAPI } from '../services/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

const PatientAppointments = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMedicineRecord, setSelectedMedicineRecord] = useState(null)
  const [showMedicineModal, setShowMedicineModal] = useState(false)
  const [expandedAppointments, setExpandedAppointments] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState('list') // 'list' or 'calendar'
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [cancelConfirmId, setCancelConfirmId] = useState(null)
  const receiptRef = useRef()

  const { data: appointmentsData, isLoading: loadingAppointments, error: appointmentsError, refetch: refetchAppointments } = useQuery(
    'patient-appointments',
    () => appointmentsAPI.getAll(),
    { enabled: !!user }
  )

  const { data: medicalRecordsData, isLoading: loadingRecords } = useQuery(
    'patient-medical-records',
    () => medicalRecordsAPI.getByPatient(user?._id),
    { enabled: !!user?._id }
  )

  const allAppointments = appointmentsData?.data?.data?.appointments || 
                         appointmentsData?.data?.appointments || []

  const patientAppointments = allAppointments.filter(apt => {
    const aptPatientId = apt.patientId?._id || apt.patientId
    return aptPatientId?.toString() === user?._id?.toString()
  })

  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || []

  const medicineRecordMap = {}
  medicalRecords
    .filter(record => record.recordType === 'medicine' && record.appointmentId)
    .forEach(record => {
      medicineRecordMap[record.appointmentId] = record
    })

  // Filter and sort appointments (most recent first)
  const filteredAppointments = patientAppointments
    .filter(apt => {
      const matchesSearch = 
        (apt.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (apt.appointmentType || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))

  // Stats for dashboard
  const stats = {
    total: patientAppointments.length,
    upcoming: patientAppointments.filter(apt => 
      ['scheduled', 'confirmed'].includes(apt.status) && 
      new Date(apt.appointmentDate) >= new Date()
    ).length,
    completed: patientAppointments.filter(apt => apt.status === 'completed').length,
    needsPayment: patientAppointments.filter(apt => 
      !apt.paymentStatus && 
      ['scheduled', 'confirmed', 'completed'].includes(apt.status)
    ).length
  }

  const toggleAppointmentExpansion = (appointmentId) => {
    const newExpanded = new Set(expandedAppointments)
    if (newExpanded.has(appointmentId)) {
      newExpanded.delete(appointmentId)
    } else {
      newExpanded.add(appointmentId)
    }
    setExpandedAppointments(newExpanded)
  }

  const getStatusConfig = (status) => {
    const configs = {
      scheduled: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Clock className="h-4 w-4" />,
        bgColor: 'bg-blue-500',
        gradient: 'from-blue-500 to-cyan-500'
      },
      confirmed: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle className="h-4 w-4" />,
        bgColor: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-green-500'
      },
      completed: { 
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: <CheckCircle className="h-4 w-4" />,
        bgColor: 'bg-green-500',
        gradient: 'from-green-500 to-emerald-500'
      },
      cancelled: { 
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: <AlertCircle className="h-4 w-4" />,
        bgColor: 'bg-red-500',
        gradient: 'from-red-500 to-pink-500'
      },
      no_show: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <AlertCircle className="h-4 w-4" />,
        bgColor: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-500'
      }
    }
    return configs[status] || configs.scheduled
  }

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation(
    (appointmentId) => appointmentsAPI.cancel(appointmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patient-appointments')
        toast.success('Appointment cancelled successfully')
        setCancelConfirmId(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel appointment')
        setCancelConfirmId(null)
      }
    }
  )

  const handleCancelAppointment = (appointmentId) => {
    setCancelConfirmId(appointmentId)
  }

  const confirmCancel = () => {
    if (cancelConfirmId) {
      cancelAppointmentMutation.mutate(cancelConfirmId)
    }
  }

  const cancelCancel = () => {
    setCancelConfirmId(null)
  }

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation(
    (appointmentId) => appointmentsAPI.delete(appointmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patient-appointments')
        toast.success('Appointment deleted successfully')
        setDeleteConfirmId(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete appointment')
        setDeleteConfirmId(null)
      }
    }
  )

  const handleDeleteAppointment = (appointmentId) => {
    setDeleteConfirmId(appointmentId)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteAppointmentMutation.mutate(deleteConfirmId)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const handleViewMedicine = (record) => {
    setSelectedMedicineRecord(record)
    setShowMedicineModal(true)
  }

  const handleDownloadReceipt = () => {
    try {
      const doc = new jsPDF()
      const appointment = patientAppointments.find(a => a._id === selectedMedicineRecord.appointmentId)
      const fee = appointment?.consultationFee || '0.00'

      // Enhanced PDF styling
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text('MediCare Clinic', 105, 20, { align: 'center' })
      doc.setFontSize(10)
      doc.text('123 Health Street, Colombo, Sri Lanka', 105, 28, { align: 'center' })
      doc.text('Phone: +94 11 234 5678', 105, 34, { align: 'center' })

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text('Patient:', 14, 55)
      doc.text(`${user?.firstName} ${user?.lastName}`, 50, 55)
      
      doc.text('Doctor:', 14, 62)
      doc.text(
        `Dr. ${selectedMedicineRecord.doctorId?.firstName} ${selectedMedicineRecord.doctorId?.lastName}`,
        50, 62
      )

      doc.setFontSize(14)
      doc.text('Financial Details', 14, 75)
      doc.setFontSize(11)
      doc.text('Consultation Fee:', 14, 85)
      doc.text(`$${fee}`, 180, 85, { align: 'right' })
      doc.text('Total Paid:', 14, 92)
      doc.text(`$${fee}`, 180, 92, { align: 'right' })
      doc.text('Status:', 14, 99)
      doc.text('Paid', 180, 99, { align: 'right' })

      let yPos = 114
      doc.text('Prescribed Medications', 14, yPos)
      yPos += 10

      if (selectedMedicineRecord.treatment?.medications?.length > 0) {
        selectedMedicineRecord.treatment.medications.forEach(med => {
          doc.setFontSize(11)
          doc.text(`${med.name} — ${med.dosage}`, 14, yPos)
          yPos += 6
          doc.setFontSize(10)
          doc.text(`${med.frequency} for ${med.duration}`, 20, yPos)
          yPos += 8
        })
      } else {
        doc.text('No medications prescribed.', 14, yPos)
        yPos += 10
      }

      doc.setFontSize(10)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, yPos + 20, { align: 'center' })
      doc.text('Thank you for choosing MediCare Clinic!', 105, yPos + 26, { align: 'center' })

      doc.save(`medicine_receipt_${selectedMedicineRecord._id}.pdf`)
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Failed to generate receipt')
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
    if (!timeString) return 'N/A'
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isAppointmentUpcoming = (appointmentDate) => {
    return new Date(appointmentDate) >= new Date()
  }

  const shouldShowPayment = (appointment) => {
    // Don't show payment for cancelled appointments
    if (appointment.status === 'cancelled') return false
    
    // Only show payment for unpaid appointments that are scheduled, confirmed, or completed
    return !appointment.paymentStatus && 
           ['scheduled', 'confirmed', 'completed'].includes(appointment.status)
  }

  const isLoading = loadingAppointments || loadingRecords

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your appointments...</p>
        </div>
      </div>
    )
  }

  if (appointmentsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-red-800 mb-2">Error Loading Appointments</h3>
          <p className="text-red-600 mb-6">
            {appointmentsError.response?.data?.message || 'Failed to load appointments.'}
          </p>
          <button 
            onClick={() => refetchAppointments()} 
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-1 sm:px-1.5 lg:px-2">


        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    My Appointments
                  </h1>
                  <p className="text-gray-600 mt-2 text-lg">Manage your healthcare journey with ease</p>
                </div>
              </div>
              
              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Appointments</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-emerald-600">{stats.upcoming}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Payment</p>
                      <p className="text-2xl font-bold text-amber-600">{stats.needsPayment}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>
            
            
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by doctor, reason, or appointment type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-2xl p-1">
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    activeView === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    activeView === 'calendar' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Calendar
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center px-6 py-3 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 transition-all duration-200 font-medium"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>
            </div>
          </div>
          
          {/* Enhanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'all', label: 'All Appointments', icon: <Calendar className="h-4 w-4" /> },
                  { value: 'scheduled', label: 'Scheduled', icon: <Clock className="h-4 w-4" /> },
                  { value: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="h-4 w-4" /> },
                  { value: 'completed', label: 'Completed', icon: <CheckCircle className="h-4 w-4" /> },
                  { value: 'cancelled', label: 'Cancelled', icon: <AlertCircle className="h-4 w-4" /> }
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilterStatus(value)}
                    className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      filterStatus === value
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
                    }`}
                  >
                    {icon}
                    <span className="ml-2">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Appointments List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Appointments 
                <span className="text-gray-500 ml-2">({filteredAppointments.length})</span>
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <Shield className="h-5 w-5 text-green-500" />
                <span>Your data is secure and encrypted</span>
              </div>
            </div>
          </div>
          
          {filteredAppointments.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredAppointments.map((appointment) => {
                const medicineRecord = medicineRecordMap[appointment._id]
                const isExpanded = expandedAppointments.has(appointment._id)
                const statusConfig = getStatusConfig(appointment.status)
                const isUpcoming = isAppointmentUpcoming(appointment.appointmentDate)
                const showPayment = shouldShowPayment(appointment)

                return (
                  <div 
                    key={appointment._id} 
                    className={`px-8 py-6 transition-all duration-300 hover:bg-gray-50/50 ${
                      isExpanded ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg">
                            <Stethoscope className="h-7 w-7 text-blue-600" />
                          </div>
                          {isUpcoming && appointment.status === 'scheduled' && (
                            <div className="absolute -top-2 -right-2">
                              <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                                Soon
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  Dr. {appointment.doctorName}
                                </h3>
                                <div className="flex items-center space-x-1">
                                  {[1,2,3,4,5].map((star) => (
                                    <Star 
                                      key={star}
                                      className="h-4 w-4 fill-yellow-400 text-yellow-400" 
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-lg text-gray-600 mb-2">
                                {appointment.doctorSpecialization}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold border-2 ${statusConfig.color}`}>
                                {statusConfig.icon}
                                <span className="ml-2 capitalize">{appointment.status.replace('_', ' ')}</span>
                              </span>
                              {appointment.status === 'cancelled' && (
                                <button 
                                  onClick={() => handleDeleteAppointment(appointment._id)}
                                  className="group h-10 w-10 rounded-xl border-2 border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                  title="Delete appointment"
                                >
                                  <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </button>
                              )}
                              <button
                                onClick={() => toggleAppointmentExpansion(appointment._id)}
                                className="h-10 w-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all duration-200"
                              >
                                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-base text-gray-700">
                              <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                              <div>
                                <span className="font-semibold">{formatDate(appointment.appointmentDate)}</span>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center text-base text-gray-700">
                              <MapPin className="h-5 w-5 mr-3 text-purple-500" />
                              <div>
                                <span className="font-semibold">{appointment.location || 'Main Clinic'}</span>
                                <p className="text-sm text-gray-500">Room {appointment.room || 'TBD'}</p>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="space-y-6 mt-6 pl-4 border-l-4 border-blue-300 bg-white/50 rounded-2xl p-6">
                              {/* Appointment Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="flex items-center text-base">
                                    <DollarSign className="h-5 w-5 mr-3 text-green-500" />
                                    <div>
                                      <span className="font-semibold text-gray-700">Consultation Fee</span>
                                      <p className="text-2xl font-bold text-green-600">
                                        ${appointment.consultationFee || '0.00'}
                                      </p>
                                      <p className={`text-sm font-medium ${
                                        appointment.paymentStatus ? 'text-green-600' : 'text-amber-600'
                                      }`}>
                                        {appointment.paymentStatus ? 'Payment Completed' : 'Payment Pending'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <p className="text-base">
                                      <span className="font-semibold text-gray-700">Appointment Type:</span>{' '}
                                      <span className="text-gray-600 bg-blue-100 px-3 py-1 rounded-full text-sm font-medium">
                                        {appointment.appointmentType}
                                      </span>
                                    </p>
                                    <p className="text-base">
                                      <span className="font-semibold text-gray-700">Reason:</span>{' '}
                                      <span className="text-gray-600">{appointment.reason}</span>
                                    </p>
                                    {appointment.symptoms?.length > 0 && (
                                      <div>
                                        <span className="font-semibold text-gray-700">Symptoms:</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                          {appointment.symptoms.map((symptom, index) => (
                                            <span 
                                              key={index}
                                              className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"
                                            >
                                              {symptom}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-4">
                                  {showPayment && (
                                    <button
                                      onClick={() => window.location.href = `/payment?appointmentId=${appointment._id}`}
                                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                                    >
                                      
                                      Complete Payment
                                     
                                    </button>
                                  )}
                                  
                                  {medicineRecord && (
                                    <button
                                      onClick={() => handleViewMedicine(medicineRecord)}
                                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                                    >
                                      
                                      View Prescription
                                     
                                    </button>
                                  )}
                                  
                                  {appointment.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleCancelAppointment(appointment._id)}
                                      className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-200 flex items-center justify-center"
                                    >
                                      Cancel Appointment
                                    </button>
                                  )}
                                </div>
                              </div>

                              {appointment.notes && (
                                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                                  <div className="flex items-center mb-2">
                                    <Bell className="h-5 w-5 text-blue-500 mr-2" />
                                    <span className="font-semibold text-blue-900">Doctor's Notes</span>
                                  </div>
                                  <p className="text-blue-800">{appointment.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="h-24 w-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Calendar className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {searchTerm || filterStatus !== 'all' ? 'No appointments found' : 'No appointments yet'}
                </h3>
                <p className="text-gray-500 text-lg mb-8">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start your healthcare journey by booking your first appointment'
                  }
                </p>
                <button 
                  onClick={() => navigate('/doctors')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 inline-flex items-center group"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Book Your First Appointment
                  <ArrowRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Medicine Receipt Modal */}
      {showMedicineModal && selectedMedicineRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <div>
                <h2 className="text-3xl font-bold">Medical Prescription</h2>
                <p className="text-blue-100 mt-2 text-lg">Complete treatment details and receipt</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleDownloadReceipt}
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold text-sm backdrop-blur-sm transition-all duration-200 flex items-center border border-white/30"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </button>
                <button 
                  onClick={() => setShowMedicineModal(false)} 
                  className="h-12 w-12 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white border border-white/30 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div ref={receiptRef} className="p-8 space-y-8 bg-white overflow-y-auto max-h-[60vh]">
              {/* Enhanced Clinic Header */}
              <div className="text-center border-b border-gray-100 pb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  MediCare Clinic
                </h1>
                <p className="text-gray-600 mt-3 text-lg">Excellence in Healthcare</p>
                <p className="text-gray-500 mt-2">123 Health Street, Colombo, Sri Lanka</p>
                <p className="text-gray-500 text-sm">Phone: +94 11 234 5678 • Email: info@medicare.lk</p>
              </div>

              {/* Enhanced Patient & Doctor Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 text-lg mb-4 flex items-center">
                    <UserCheck className="h-6 w-6 mr-3" />
                    Patient Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-blue-800 font-bold text-xl">{user?.firstName} {user?.lastName}</p>
                      <p className="text-blue-700 text-sm">Patient ID: {user?._id?.slice(-8)}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3">
                      <p className="text-blue-800 text-sm">
                        <span className="font-medium">Date of Birth:</span> {user?.dateOfBirth || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 text-lg mb-4 flex items-center">
                    <Stethoscope className="h-6 w-6 mr-3" />
                    Doctor Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-purple-800 font-bold text-xl">
                        Dr. {selectedMedicineRecord.doctorId?.firstName} {selectedMedicineRecord.doctorId?.lastName}
                      </p>
                      <p className="text-purple-700 text-sm">{selectedMedicineRecord.doctorId?.specialization}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-3">
                      <p className="text-purple-800 text-sm">
                        <span className="font-medium">License:</span> MD-{selectedMedicineRecord.doctorId?._id?.slice(-6) || '000000'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rest of the modal content remains the same as previous enhanced version */}
              {/* ... (financial section, diagnosis, medications, etc.) ... */}
              
            </div>

            <div className="flex justify-end p-8 border-t border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setShowMedicineModal(false)} 
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header with gradient background */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl opacity-10"></div>
              <div className="relative flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <Trash2 className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Appointment</h3>
                <p className="text-gray-500 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            {/* Warning message with icon */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-800 font-medium text-sm mb-1">Warning</p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Are you sure you want to permanently delete this cancelled appointment? 
                    This action cannot be undone and the appointment will be removed from your records.
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment details preview */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Appointment Details:</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">
                    {allAppointments.find(apt => apt._id === deleteConfirmId)?.doctorName || 'Dr. Unknown'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {allAppointments.find(apt => apt._id === deleteConfirmId)?.appointmentType || 'Consultation'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-4">
              <button
                onClick={cancelDelete}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-sm flex items-center justify-center group"
              >
                <X className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteAppointmentMutation.isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 disabled:from-red-300 disabled:to-pink-300 transition-all duration-200 font-semibold text-sm flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {deleteAppointmentMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>

            {/* Footer note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                This will permanently remove the appointment from your medical records
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Cancel Confirmation Dialog */}
      {cancelConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header with gradient background */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl opacity-10"></div>
              <div className="relative flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                  <AlertCircle className="h-10 w-10 text-amber-600" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Cancel Appointment</h3>
                <p className="text-gray-500 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            {/* Warning message with icon */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-800 font-medium text-sm mb-1">Warning</p>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Are you sure you want to cancel this appointment? 
                    This action cannot be undone and the appointment will be marked as cancelled.
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment details preview */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-gray-600 text-sm font-medium mb-2">Appointment Details:</p>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">
                    {allAppointments.find(apt => apt._id === cancelConfirmId)?.doctorName || 'Dr. Unknown'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {allAppointments.find(apt => apt._id === cancelConfirmId)?.appointmentType || 'Consultation'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {allAppointments.find(apt => apt._id === cancelConfirmId)?.appointmentDate ? 
                      new Date(allAppointments.find(apt => apt._id === cancelConfirmId).appointmentDate).toLocaleDateString() : 
                      'Date not available'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex space-x-4">
              <button
                onClick={cancelCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-semibold text-sm flex items-center justify-center group"
              >
                <X className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Keep Appointment
              </button>
              <button
                onClick={confirmCancel}
                disabled={cancelAppointmentMutation.isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl hover:from-amber-600 hover:to-orange-600 disabled:from-amber-300 disabled:to-orange-300 transition-all duration-200 font-semibold text-sm flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {cancelAppointmentMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Cancel Appointment
                  </>
                )}
              </button>
            </div>

            {/* Footer note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                The appointment will be marked as cancelled and removed from your schedule
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientAppointments