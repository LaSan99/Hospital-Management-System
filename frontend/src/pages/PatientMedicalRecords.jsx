import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Calendar,
  UserCheck,
  Activity,
  Pill,
  TestTube,
  Heart,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Download,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  MapPin,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { medicalRecordsAPI } from '../services/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'

const PatientMedicalRecords = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { data: medicalRecordsData, isLoading, error } = useQuery(
    'patient-medical-records',
    () => medicalRecordsAPI.getByPatient(user?._id),
    { 
      enabled: !!user?._id,
      retry: 1
    }
  )

  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || 
                         []
  
  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = 
      record.diagnosis?.mainProblem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctorId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctorId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || record.recordType === filterType
    
    return matchesSearch && matchesType
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle View Details
  const handleViewDetails = (record) => {
    setSelectedRecord(record)
    setShowDetailsModal(true)
  }

  // Handle Download Record
  const handleDownloadRecord = (record) => {
    try {
      const doc = new jsPDF()
      
      // Header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Medical Record', 105, 15, { align: 'center' })
      doc.setFontSize(10)
      doc.text('MediCare Clinic - Confidential Medical Document', 105, 22, { align: 'center' })

      doc.setTextColor(0, 0, 0)
      
      let yPos = 40
      
      // Patient Information
      doc.setFontSize(12)
      doc.text('Patient Information', 14, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.text(`Name: ${user?.firstName} ${user?.lastName}`, 14, yPos)
      yPos += 6
      doc.text(`Record Date: ${formatDate(record.createdAt)}`, 14, yPos)
      yPos += 10

      // Doctor Information
      doc.setFontSize(12)
      doc.text('Doctor Information', 14, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.text(`Doctor: Dr. ${record.doctorId?.firstName} ${record.doctorId?.lastName}`, 14, yPos)
      yPos += 6
      doc.text(`Specialization: ${record.doctorId?.specialization || 'General Practice'}`, 14, yPos)
      yPos += 10

      // Diagnosis
      if (record.diagnosis) {
        doc.setFontSize(12)
        doc.text('Diagnosis', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        doc.text(`Main Problem: ${record.diagnosis.mainProblem}`, 14, yPos)
        yPos += 6
        
        if (record.diagnosis.symptoms && record.diagnosis.symptoms.length > 0) {
          doc.text('Symptoms:', 14, yPos)
          yPos += 6
          record.diagnosis.symptoms.forEach(symptom => {
            doc.text(`• ${symptom}`, 20, yPos)
            yPos += 5
          })
        }
        
        if (record.diagnosis.notes) {
          yPos += 3
          doc.text(`Notes: ${record.diagnosis.notes}`, 14, yPos)
          yPos += 8
        } else {
          yPos += 5
        }
      }

      // Medications
      if (record.treatment?.medications?.length > 0) {
        doc.setFontSize(12)
        doc.text('Prescribed Medications', 14, yPos)
        yPos += 8
        doc.setFontSize(10)
        
        record.treatment.medications.forEach((med, index) => {
          doc.text(`${med.name} - ${med.dosage}`, 14, yPos)
          yPos += 5
          doc.text(`${med.frequency} for ${med.duration}`, 20, yPos)
          yPos += 5
          if (med.instructions) {
            doc.text(`Instructions: ${med.instructions}`, 20, yPos)
            yPos += 5
          }
          yPos += 3
        })
        yPos += 2
      }

      // Footer
      doc.setFontSize(8)
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' })
      doc.text('This is a confidential medical document - Handle with care', 105, 285, { align: 'center' })

      doc.save(`medical_record_${record._id}.pdf`)
      toast.success('Medical record downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to download medical record')
    }
  }

  // Handle Export All
  const handleExportAll = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export')
      return
    }

    try {
      // Create a simple CSV export for all records
      const headers = ['Date', 'Doctor', 'Diagnosis', 'Record Type']
      const csvData = filteredRecords.map(record => [
        formatDate(record.createdAt),
        `Dr. ${record.doctorId?.firstName} ${record.doctorId?.lastName}`,
        record.diagnosis?.mainProblem || 'N/A',
        record.recordType
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medical_records_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${filteredRecords.length} medical records`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export records')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your medical records...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Records</h3>
          <p className="text-gray-600 mb-6">
            {error.response?.data?.message || 'Failed to load medical records.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                  <p className="text-gray-600 text-sm">Your complete health history in one place</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/book-appointment')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm hover:shadow-md text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<FileText className="h-5 w-5 text-blue-600" />}
            label="Total Records"
            value={medicalRecords.length}
            description="Medical documents"
            color="blue"
          />
          <StatCard
            icon={<Activity className="h-5 w-5 text-green-600" />}
            label="Active Issues"
            value={medicalRecords.filter(r => r.recordType === 'diagnosis').length}
            description="Current conditions"
            color="green"
          />
          <StatCard
            icon={<Pill className="h-5 w-5 text-purple-600" />}
            label="Medications"
            value={medicalRecords.reduce((acc, record) => acc + (record.treatment?.medications?.length || 0), 0)}
            description="Active prescriptions"
            color="purple"
          />
          <StatCard
            icon={<Shield className="h-5 w-5 text-amber-600" />}
            label="Privacy"
            value="Protected"
            description="HIPAA compliant"
            color="amber"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by condition, doctor, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
                {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            </div>
          </div>
          
          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All Records' },
                  { value: 'consultation', label: 'Consultations' },
                  { value: 'diagnosis', label: 'Diagnoses' },
                  { value: 'treatment', label: 'Treatments' },
                  { value: 'follow_up', label: 'Follow-ups' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors text-sm ${
                      filterType === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {medicalRecords.length} medical records
          </div>
          {filteredRecords.length > 0 && (
            <button 
              onClick={handleExportAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              <Download className="h-3 w-3 mr-1" />
              Export All
            </button>
          )}
        </div>

        {/* Medical Records List */}
        {filteredRecords.length > 0 ? (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <MedicalRecordCard
                key={record._id}
                record={record}
                formatDate={formatDate}
                onViewDetails={() => handleViewDetails(record)}
                onDownloadRecord={() => handleDownloadRecord(record)}
              />
            ))}
          </div>
        ) : (
          <NoRecordsFound searchTerm={searchTerm} filterType={filterType} navigate={navigate} />
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <DetailsModal 
          record={selectedRecord}
          formatDate={formatDate}
          onClose={() => setShowDetailsModal(false)}
        />
      )}
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon, label, value, description, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    amber: 'bg-amber-50 border-amber-200'
  }

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${colorClasses[color]} hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-600">{label}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  )
}

// No Records Found Component
const NoRecordsFound = ({ searchTerm, filterType, navigate }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {searchTerm || filterType !== 'all' ? 'No records found' : 'No medical records yet'}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          {searchTerm || filterType !== 'all' 
            ? 'Try adjusting your search or filter criteria'
            : 'Your medical records will appear here after your appointments'
          }
        </p>
        <button 
          onClick={() => navigate('/book-appointment')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center text-sm"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Book First Appointment
        </button>
      </div>
    </div>
  )
}

// Medical Record Card Component
const MedicalRecordCard = ({ record, formatDate, onViewDetails, onDownloadRecord }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRecordTypeConfig = (type) => {
    const configs = {
      consultation: { color: 'bg-blue-100 text-blue-800', icon: <UserCheck className="h-3 w-3" /> },
      diagnosis: { color: 'bg-red-100 text-red-800', icon: <Activity className="h-3 w-3" /> },
      treatment: { color: 'bg-green-100 text-green-800', icon: <Pill className="h-3 w-3" /> },
      follow_up: { color: 'bg-purple-100 text-purple-800', icon: <Calendar className="h-3 w-3" /> }
    }
    return configs[type] || configs.consultation
  }

  const typeConfig = getRecordTypeConfig(record.recordType)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {record.diagnosis?.mainProblem || 'Medical Consultation'}
              </h3>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-xs text-gray-600 flex items-center truncate">
                  <UserCheck className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">Dr. {record.doctorId?.firstName} {record.doctorId?.lastName}</span>
                </p>
                <p className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  {formatDate(record.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
              {typeConfig.icon}
              <span className="ml-1 capitalize">{record.recordType.replace('_', ' ')}</span>
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 w-7 rounded border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-4">
          {/* Diagnosis Section */}
          {record.diagnosis && (
            <Section 
              icon={<Activity className="h-4 w-4 text-red-500" />}
              title="Diagnosis"
              color="red"
            >
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">Main Problem</p>
                  <p className="text-gray-900 text-sm">{record.diagnosis.mainProblem}</p>
                </div>
                {record.diagnosis.symptoms && record.diagnosis.symptoms.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Symptoms</p>
                    <div className="flex flex-wrap gap-1">
                      {record.diagnosis.symptoms.map((symptom, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {record.diagnosis.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-700">Notes</p>
                    <p className="text-gray-600 text-sm">{record.diagnosis.notes}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Medications Section */}
          {record.treatment?.medications?.length > 0 && (
            <Section 
              icon={<Pill className="h-4 w-4 text-green-500" />}
              title="Medications"
              color="green"
            >
              <div className="space-y-3">
                {record.treatment.medications.map((medication, index) => (
                  <div key={index} className="flex items-start justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">{medication.name}</p>
                        <p className="text-xs text-gray-600">{medication.dosage}</p>
                      </div>
                      <p className="text-xs text-gray-600">
                        {medication.frequency} • {medication.duration}
                      </p>
                      {medication.instructions && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Instructions:</span> {medication.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Vital Signs Section */}
          {record.vitalSigns && (
            <Section 
              icon={<Heart className="h-4 w-4 text-blue-500" />}
              title="Vital Signs"
              color="blue"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {record.vitalSigns.bloodPressure && (
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-500">Blood Pressure</p>
                    <p className="font-semibold text-gray-900 text-sm">{record.vitalSigns.bloodPressure}</p>
                  </div>
                )}
                {record.vitalSigns.heartRate && (
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="font-semibold text-gray-900 text-sm">{record.vitalSigns.heartRate} bpm</p>
                  </div>
                )}
                {record.vitalSigns.temperature && (
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="font-semibold text-gray-900 text-sm">{record.vitalSigns.temperature}°F</p>
                  </div>
                )}
                {record.vitalSigns.weight && (
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="font-semibold text-gray-900 text-sm">{record.vitalSigns.weight} kg</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Follow-up Section */}
          {record.followUp && (
            <Section 
              icon={<Calendar className="h-4 w-4 text-purple-500" />}
              title="Follow-up"
              color="purple"
            >
              <div className="space-y-2">
                {record.followUp.nextAppointment && (
                  <div>
                    <p className="text-xs font-medium text-gray-700">Next Appointment</p>
                    <p className="text-gray-900 text-sm">{formatDate(record.followUp.nextAppointment)}</p>
                  </div>
                )}
                {record.followUp.instructions && (
                  <div>
                    <p className="text-xs font-medium text-gray-700">Instructions</p>
                    <p className="text-gray-600 text-sm">{record.followUp.instructions}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Doctor Notes Section */}
          {record.doctorNotes && (
            <Section 
              icon={<FileText className="h-4 w-4 text-gray-500" />}
              title="Doctor's Notes"
              color="gray"
            >
              <p className="text-gray-700 text-sm">{record.doctorNotes}</p>
            </Section>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
            <button 
              onClick={onDownloadRecord}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors flex items-center text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </button>
            <button 
              onClick={onViewDetails}
              className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View Details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Section Component for organized content
const Section = ({ icon, title, color, children }) => {
  const colorClasses = {
    red: 'border-red-200',
    green: 'border-green-200',
    blue: 'border-blue-200',
    purple: 'border-purple-200',
    gray: 'border-gray-200'
  }

  return (
    <div className={`border-l-2 ${colorClasses[color]} pl-3`}>
      <div className="flex items-center mb-2">
        {icon}
        <h4 className="text-xs font-semibold text-gray-900 ml-2">{title}</h4>
      </div>
      {children}
    </div>
  )
}

// Details Modal Component
const DetailsModal = ({ record, formatDate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Medical Record Details</h2>
            <p className="text-gray-600 text-sm mt-1">
              {formatDate(record.createdAt)} • Dr. {record.doctorId?.firstName} {record.doctorId?.lastName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Display all record details in an organized way */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Patient Information</h3>
              {/* Add patient details here */}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Medical Details</h3>
              {/* Add medical details here */}
            </div>
          </div>
          
          {/* You can expand this modal with more detailed information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              This is the detailed view of the medical record. You can add more comprehensive information here.
            </p>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PatientMedicalRecords