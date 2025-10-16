import React, { useState, useRef } from 'react'
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
  Phone,
  Pill,
  X,
  Download,
  Filter,
  FileText,
  Stethoscope,
  DollarSign,
  Eye,
  ClipboardList,
  CreditCard
} from 'lucide-react'
import { appointmentsAPI, medicalRecordsAPI } from '../services/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

const PatientAppointments = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMedicineRecord, setSelectedMedicineRecord] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showMedicineModal, setShowMedicineModal] = useState(false)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const receiptRef = useRef()

  // Fetch appointments and medical records
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

  // Filter appointments for current patient
  const allAppointments = appointmentsData?.data?.data?.appointments || 
                         appointmentsData?.data?.appointments || []

  const patientAppointments = allAppointments.filter(apt => {
    const aptPatientId = apt.patientId?._id || apt.patientId
    return aptPatientId?.toString() === user?._id?.toString()
  })

  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || []

  // Map medicine records by appointmentId
  const medicineRecordMap = {}
  medicalRecords
    .filter(record => record.recordType === 'medicine' && record.appointmentId)
    .forEach(record => {
      medicineRecordMap[record.appointmentId] = record
    })

  // Filter appointments based on search and status
  const filteredAppointments = patientAppointments.filter(apt => {
    const matchesSearch = 
      (apt.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.appointmentType || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: patientAppointments.length,
    upcoming: patientAppointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length,
    completed: patientAppointments.filter(apt => apt.status === 'completed').length,
    hasMedicine: patientAppointments.filter(apt => medicineRecordMap[apt._id]).length
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
      case 'scheduled': return <Clock className="h-3 w-3" />
      case 'confirmed': return <CheckCircle className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'cancelled': return <AlertCircle className="h-3 w-3" />
      case 'no_show': return <AlertCircle className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancel(appointmentId)
        toast.success('Appointment cancelled successfully')
        refetchAppointments()
      } catch (error) {
        toast.error('Failed to cancel appointment')
      }
    }
  }

  const handleViewMedicine = (record) => {
    setSelectedMedicineRecord(record)
    setShowMedicineModal(true)
  }

  const handleViewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
  }

  const handleDownloadReceipt = () => {
    try {
      const doc = new jsPDF()
      const appointment = patientAppointments.find(a => a._id === selectedMedicineRecord.appointmentId)
      const fee = appointment?.consultationFee || '0.00'

      // Header
      doc.setFontSize(18)
      doc.text('MediCare Clinic', 105, 20, { align: 'center' })
      doc.setFontSize(10)
      doc.text('123 Health Street, Colombo, Sri Lanka', 105, 26, { align: 'center' })
      doc.text('Phone: +94 11 234 5678', 105, 32, { align: 'center' })

      // Patient & Doctor
      doc.setFontSize(12)
      doc.text('Patient:', 14, 45)
      doc.text(`${user?.firstName} ${user?.lastName}`, 50, 45)
      
      doc.text('Doctor:', 14, 52)
      doc.text(
        `Dr. ${selectedMedicineRecord.doctorId?.firstName} ${selectedMedicineRecord.doctorId?.lastName}`,
        50, 52
      )

      // Financial Section
      doc.setFontSize(14)
      doc.text('Financial Details', 14, 65)
      doc.setFontSize(11)
      doc.text('Consultation Fee:', 14, 75)
      doc.text(`$${fee}`, 180, 75, { align: 'right' })
      doc.text('Total Paid:', 14, 82)
      doc.text(`$${fee}`, 180, 82, { align: 'right' })
      doc.text('Status:', 14, 89)
      doc.text('Paid', 180, 89, { align: 'right' })

      // Medications
      let yPos = 100
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

      // Footer
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

  const isLoading = loadingAppointments || loadingRecords

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (appointmentsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Appointments</h3>
          <p className="text-gray-600 mb-6">
            {appointmentsError.response?.data?.message || 'Failed to load appointments.'}
          </p>
          <button 
            onClick={() => refetchAppointments()} 
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600 mt-2">Manage your appointments and medical records</p>
          </div>
          <button 
            onClick={() => window.location.href = '/doctors'}
            className="mt-4 lg:mt-0 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/25 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Book New Appointment
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcoming}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Medicine Records</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.hasMedicine}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <Pill className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appointments by doctor, reason, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold flex items-center shadow-lg hover:shadow-blue-500/25">
              <Filter className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Appointment History
              </h2>
              <span className="text-sm text-gray-600">
                {filteredAppointments.length} appointments found
              </span>
            </div>
          </div>
          
          {filteredAppointments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => {
                const medicineRecord = medicineRecordMap[appointment._id]
                return (
                  <div key={appointment._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Dr. {appointment.doctorName}
                              </h3>
                              <p className="text-blue-600 font-medium">
                                {appointment.doctorSpecialization}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1 capitalize">{appointment.status.replace('_', ' ')}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-3 text-blue-500" />
                              <span>{formatDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-3 text-green-500" />
                              <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-3 text-red-500" />
                              <span>{appointment.location || 'N/A'} • Room {appointment.room || 'TBD'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <DollarSign className="h-4 w-4 mr-3 text-purple-500" />
                              <span>${appointment.consultationFee || '0.00'}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center text-sm text-gray-600">
                              <Stethoscope className="h-4 w-4 mr-3 text-gray-400" />
                              <span><strong>Type:</strong> {appointment.appointmentType}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-3 text-gray-400" />
                              <span><strong>Reason:</strong> {appointment.reason}</span>
                            </div>
                            {appointment.symptoms && appointment.symptoms.length > 0 && (
                              <div className="flex items-start text-sm text-gray-600">
                                <AlertCircle className="h-4 w-4 mr-3 text-yellow-500 mt-0.5" />
                                <span><strong>Symptoms:</strong> {appointment.symptoms.join(', ')}</span>
                              </div>
                            )}
                          </div>
                          
                          {appointment.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Doctor's Notes:</strong> {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-2 min-w-[200px]">
                        {medicineRecord && (
                          <button
                            onClick={() => handleViewMedicine(medicineRecord)}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                          >
                            <Pill className="h-4 w-4 mr-2" />
                            View Medicine
                          </button>
                        )}
                        
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelAppointment(appointment._id)}
                            className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                          >
                            Cancel Appointment
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleViewAppointmentDetails(appointment)}
                          className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No appointments found' : 'No appointments yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Book your first appointment to get started with our healthcare services'
                }
              </p>
              <button 
                onClick={() => window.location.href = '/doctors'}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/25 flex items-center mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Book Your First Appointment
              </button>
            </div>
          )}
        </div>

        {/* Appointment Details Modal */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
                  <p className="text-gray-600 mt-1">Complete appointment information</p>
                </div>
                <button 
                  onClick={() => setShowAppointmentModal(false)} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Dr. {selectedAppointment.doctorName}
                    </h3>
                    <p className="text-blue-600 font-medium">{selectedAppointment.doctorSpecialization}</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(selectedAppointment.status)}`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-1 capitalize">{selectedAppointment.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Date & Time</h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{formatDate(selectedAppointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-green-500" />
                          <span>{formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-red-500" />
                        <span>{selectedAppointment.location || 'Main Clinic'}</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">Room {selectedAppointment.room || 'TBD'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Financial</h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Consultation Fee: ${selectedAppointment.consultationFee || '0.00'}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Appointment Type</h4>
                      <div className="flex items-center text-sm text-gray-600">
                        <Stethoscope className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedAppointment.appointmentType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Reason for Visit</h4>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{selectedAppointment.reason}</p>
                  </div>

                  {selectedAppointment.symptoms && selectedAppointment.symptoms.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Reported Symptoms</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.symptoms.map((symptom, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAppointment.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Doctor's Notes</h4>
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-blue-800">{selectedAppointment.notes}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medicine Record Link */}
                {medicineRecordMap[selectedAppointment._id] && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900">Medicine Record Available</h4>
                        <p className="text-green-700 text-sm">View prescribed medications and treatment plan</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAppointmentModal(false)
                          handleViewMedicine(medicineRecordMap[selectedAppointment._id])
                        }}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        <Pill className="h-4 w-4 mr-2" />
                        View Medicine
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowAppointmentModal(false)} 
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Medicine Receipt Modal */}
        {showMedicineModal && selectedMedicineRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Medicine Receipt</h2>
                  <p className="text-gray-600 mt-1">Prescription and medical details</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleDownloadReceipt}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => setShowMedicineModal(false)} 
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div ref={receiptRef} className="p-8 space-y-8 bg-white">
                {/* Clinic Header */}
                <div className="text-center border-b pb-6 mb-6">
                  <h1 className="text-3xl font-bold text-gray-900">MediCare Clinic</h1>
                  <p className="text-gray-600 mt-2">123 Health Street, Colombo, Sri Lanka</p>
                  <p className="text-gray-600">Phone: +94 11 234 5678</p>
                </div>

                {/* Patient & Doctor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Patient Information</h3>
                    <p className="text-gray-700">{user?.firstName} {user?.lastName}</p>
                    <p className="text-gray-600 text-sm">Patient ID: {user?._id?.slice(-8)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Doctor Information</h3>
                    <p className="text-gray-700">
                      Dr. {selectedMedicineRecord.doctorId?.firstName} {selectedMedicineRecord.doctorId?.lastName}
                    </p>
                    <p className="text-gray-600 text-sm">{selectedMedicineRecord.doctorId?.specialization}</p>
                  </div>
                </div>

                {/* Financial Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Consultation Fee:</span>
                      <span className="font-semibold text-gray-900">
                        ${(() => {
                          const apt = patientAppointments.find(a => a._id === selectedMedicineRecord.appointmentId)
                          return apt?.consultationFee || '0.00'
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="font-semibold text-gray-900">Total Paid:</span>
                      <span className="font-bold text-lg text-gray-900">
                        ${(() => {
                          const apt = patientAppointments.find(a => a._id === selectedMedicineRecord.appointmentId)
                          return apt?.consultationFee || '0.00'
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Payment Status:</span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Paid
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical Details */}
                {selectedMedicineRecord.diagnosis && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Diagnosis</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Main Problem:</span>
                        <p className="text-gray-900 mt-1">{selectedMedicineRecord.diagnosis.mainProblem}</p>
                      </div>
                      {selectedMedicineRecord.diagnosis.symptoms?.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Symptoms:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedMedicineRecord.diagnosis.symptoms.map((symptom, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800 border border-yellow-200">
                                {symptom}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedMedicineRecord.treatment?.medications?.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Prescribed Medications</h3>
                    <div className="space-y-4">
                      {selectedMedicineRecord.treatment.medications.map((med, i) => (
                        <div key={i} className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Pill className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{med.name}</h4>
                            <p className="text-gray-700">{med.dosage}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {med.frequency} for {med.duration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center text-sm text-gray-500 pt-6 border-t">
                  <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                  <p className="mt-1">Thank you for choosing MediCare Clinic!</p>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200">
                <button 
                  onClick={() => setShowMedicineModal(false)} 
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientAppointments