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
  CreditCard
} from 'lucide-react'
import { appointmentsAPI, medicalRecordsAPI } from '../services/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const PatientAppointments = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedMedicineRecord, setSelectedMedicineRecord] = useState(null)
  const [showMedicineModal, setShowMedicineModal] = useState(false)
  const receiptRef = useRef()

  // Fetch ALL appointments (backend should ideally filter by patient, but we'll double-check)
  const { data: appointmentsData, isLoading: loadingAppointments, error: appointmentsError, refetch: refetchAppointments } = useQuery(
    'patient-appointments',
    () => appointmentsAPI.getAll(),
    { enabled: !!user }
  )

  // Fetch medical records for this patient
  const { data: medicalRecordsData, isLoading: loadingRecords } = useQuery(
    'patient-medical-records',
    () => medicalRecordsAPI.getByPatient(user?._id),
    { enabled: !!user?._id }
  )

  // 🔥 CRITICAL: Filter appointments to ONLY those belonging to the current patient
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

  const filteredAppointments = patientAppointments.filter(apt => {
    const matchesSearch = 
      (apt.doctorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.appointmentType || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'badge-info'
      case 'confirmed': return 'badge-success'
      case 'completed': return 'badge-success'
      case 'cancelled': return 'badge-danger'
      case 'no_show': return 'badge-warning'
      default: return 'badge-warning'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'confirmed': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      case 'no_show': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8" />
      </div>
    )
  }

  if (appointmentsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Appointments</h3>
        <p className="text-red-600">
          {appointmentsError.response?.data?.message || 'Failed to load appointments.'}
        </p>
        <button onClick={() => refetchAppointments()} className="btn btn-primary mt-4">
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
          <p className="text-gray-600">Manage your appointments and view medicine records</p>
        </div>
        <button 
          onClick={() => window.location.href = '/doctors'}
          className="btn btn-primary"
        >
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
            {filteredAppointments.map((appointment) => {
              const medicineRecord = medicineRecordMap[appointment._id]
              return (
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
                            {appointment.location || 'N/A'} • Room {appointment.room || 'TBD'}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            Fee: ${appointment.consultationFee || '0.00'}
                          </div>
                          <div className="flex items-center text-sm">
                            <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                            <span className={appointment.paymentStatus ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                              {appointment.paymentStatus ? 'Paid' : 'Unpaid'}
                            </span>
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
                    
                    <div className="mt-4 lg:mt-0 lg:ml-4 flex flex-col gap-2">
                      <span className={`badge ${getStatusColor(appointment.status)} inline-flex items-center`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status.replace('_', ' ')}</span>
                      </span>
                      
                      {!appointment.paymentStatus && (
                        <button
                          onClick={() => window.location.href = `/payment?appointmentId=${appointment._id}`}
                          className="btn btn-primary btn-sm flex items-center"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Now
                        </button>
                      )}
                      
                      {medicineRecord && (
                        <button
                          onClick={() => handleViewMedicine(medicineRecord)}
                          className="btn btn-outline btn-sm flex items-center"
                          title="View Medicine Record"
                        >
                          <Pill className="h-4 w-4 mr-1" />
                          View Medicine
                        </button>
                      )}
                      
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          className="btn btn-outline btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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

      {/* Medicine Receipt Modal */}
      {showMedicineModal && selectedMedicineRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Medicine Receipt</h2>
              <div className="flex gap-2">
                <button 
                  onClick={handleDownloadReceipt}
                  className="btn btn-outline btn-sm flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </button>
                <button 
                  onClick={() => setShowMedicineModal(false)} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div ref={receiptRef} className="p-6 space-y-6 bg-white">
              {/* Clinic Header */}
              <div className="text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold text-gray-900">MediCare Clinic</h1>
                <p className="text-gray-600">123 Health Street, Colombo, Sri Lanka</p>
                <p className="text-gray-600">Phone: +94 11 234 5678</p>
              </div>

              {/* Patient & Doctor */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-medium text-gray-900">Patient</h3>
                  <p className="text-gray-700">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Doctor</h3>
                  <p className="text-gray-700">
                    Dr. {selectedMedicineRecord.doctorId?.firstName} {selectedMedicineRecord.doctorId?.lastName}
                  </p>
                </div>
              </div>

              {/* Financial Section */}
              <div className="border rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Consultation Fee:</span>
                    <span className="font-medium">
                      ${(() => {
                        const apt = patientAppointments.find(a => a._id === selectedMedicineRecord.appointmentId)
                        return apt?.consultationFee || '0.00'
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Total Paid:</span>
                    <span>
                      ${(() => {
                        const apt = patientAppointments.find(a => a._id === selectedMedicineRecord.appointmentId)
                        return apt?.consultationFee || '0.00'
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Status:</span>
                    <span>Paid</span>
                  </div>
                </div>
              </div>

              {/* Medical Details */}
              {selectedMedicineRecord.diagnosis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnosis</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><span className="font-medium">Problem:</span> {selectedMedicineRecord.diagnosis.mainProblem}</p>
                    {selectedMedicineRecord.diagnosis.symptoms?.length > 0 && (
                      <p className="mt-1"><span className="font-medium">Symptoms:</span> {selectedMedicineRecord.diagnosis.symptoms.join(', ')}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedMedicineRecord.treatment?.medications?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Medications</h3>
                  <div className="space-y-2">
                    {selectedMedicineRecord.treatment.medications.map((med, i) => (
                      <div key={i} className="border rounded p-3">
                        <p className="font-medium">{med.name} — {med.dosage}</p>
                        <p className="text-sm text-gray-600">{med.frequency} for {med.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center text-sm text-gray-500 pt-6 border-t">
                <p>Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t">
              <button onClick={() => setShowMedicineModal(false)} className="btn btn-outline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientAppointments