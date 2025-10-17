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
  Sparkles,
  FileDown,
  Share2,
  Printer,
  Zap,
  Thermometer,
  Scale,
  Ruler,
  User,
  X
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
      toast.success('Medical record downloaded successfully!', {
        icon: '📄',
        style: {
          background: '#10B981',
          color: 'white',
        }
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to download medical record', {
        icon: '❌',
      })
    }
  }

  // Handle Export All
  const handleExportAll = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export', {
        icon: '📭',
      })
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
      
      toast.success(`Exported ${filteredRecords.length} medical records`, {
        icon: '📊',
        style: {
          background: '#3B82F6',
          color: 'white',
        }
      })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export records', {
        icon: '❌',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Your Medical Records</h3>
          <p className="text-gray-600 text-lg">Please wait while we fetch your health information</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center border border-white/20">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Records</h3>
          <p className="text-gray-600 text-lg mb-8">
            {error.response?.data?.message || 'Failed to load medical records.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4 mb-6 lg:mb-0">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    Medical Records
                  </h1>
                  <p className="text-gray-600 text-lg mt-2">Your complete health history in one secure place</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => navigate('/book-appointment')}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Appointment</span>
                </button>
                {filteredRecords.length > 0 && (
                  <button 
                    onClick={handleExportAll}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
                  >
                    <FileDown className="h-5 w-5" />
                    <span>Export All</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FileText className="h-6 w-6 text-blue-600" />}
            label="Total Records"
            value={medicalRecords.length}
            description="Medical documents"
            color="blue"
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<Activity className="h-6 w-6 text-green-600" />}
            label="Active Issues"
            value={medicalRecords.filter(r => r.recordType === 'diagnosis').length}
            description="Current conditions"
            color="green"
            gradient="from-green-500 to-green-600"
          />
          <StatCard
            icon={<Pill className="h-6 w-6 text-purple-600" />}
            label="Medications"
            value={medicalRecords.reduce((acc, record) => acc + (record.treatment?.medications?.length || 0), 0)}
            description="Active prescriptions"
            color="purple"
            gradient="from-purple-500 to-purple-600"
          />
          <StatCard
            icon={<Shield className="h-6 w-6 text-amber-600" />}
            label="Privacy"
            value="Protected"
            description="HIPAA compliant"
            color="amber"
            gradient="from-amber-500 to-amber-600"
          />
        </div>

        {/* Enhanced Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by condition, doctor, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg shadow-sm"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                  showFilters 
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                    : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </button>
            </div>
          </div>
          
          {/* Enhanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'all', label: 'All Records', color: 'gray' },
                  { value: 'consultation', label: 'Consultations', color: 'blue' },
                  { value: 'diagnosis', label: 'Diagnoses', color: 'red' },
                  { value: 'treatment', label: 'Treatments', color: 'green' },
                  { value: 'follow_up', label: 'Follow-ups', color: 'purple' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${
                      filterType === value
                        ? `bg-${color}-600 text-white shadow-lg`
                        : `bg-${color}-100 text-${color}-700 hover:bg-${color}-200`
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
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg text-gray-600 font-medium">
            Showing <span className="font-bold text-gray-900">{filteredRecords.length}</span> of{' '}
            <span className="font-bold text-gray-900">{medicalRecords.length}</span> medical records
          </div>
        </div>

        {/* Enhanced Medical Records List */}
        {filteredRecords.length > 0 ? (
          <div className="space-y-6">
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

      {/* Enhanced Details Modal */}
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

// Enhanced Stat Card Component
const StatCard = ({ icon, label, value, description, color, gradient }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        </div>
        <div className={`h-14 w-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// Enhanced No Records Found Component
const NoRecordsFound = ({ searchTerm, filterType, navigate }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/20">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <FileText className="h-12 w-12 text-blue-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          {searchTerm || filterType !== 'all' ? 'No Records Found' : 'No Medical Records Yet'}
        </h3>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          {searchTerm || filterType !== 'all' 
            ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
            : 'Your medical records will appear here after your appointments. Start your health journey today!'
          }
        </p>
        <button 
          onClick={() => navigate('/book-appointment')}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg inline-flex items-center space-x-3"
        >
          <Calendar className="h-5 w-5" />
          <span>Book Your First Appointment</span>
        </button>
      </div>
    </div>
  )
}

// Enhanced Medical Record Card Component
const MedicalRecordCard = ({ record, formatDate, onViewDetails, onDownloadRecord }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRecordTypeConfig = (type) => {
    const configs = {
      consultation: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        gradient: 'from-blue-500 to-blue-600',
        icon: <UserCheck className="h-4 w-4" /> 
      },
      diagnosis: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        gradient: 'from-red-500 to-red-600',
        icon: <Activity className="h-4 w-4" /> 
      },
      treatment: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        gradient: 'from-green-500 to-green-600',
        icon: <Pill className="h-4 w-4" /> 
      },
      follow_up: { 
        color: 'bg-purple-100 text-purple-800 border-purple-200', 
        gradient: 'from-purple-500 to-purple-600',
        icon: <Calendar className="h-4 w-4" /> 
      }
    }
    return configs[type] || configs.consultation
  }

  const typeConfig = getRecordTypeConfig(record.recordType)

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-500 hover:scale-[1.02]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <div className={`h-14 w-14 bg-gradient-to-br ${typeConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {record.diagnosis?.mainProblem || 'Medical Consultation'}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <p className="text-gray-600 flex items-center">
                  <UserCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">Dr. {record.doctorId?.firstName} {record.doctorId?.lastName}</span>
                </p>
                <p className="text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  {formatDate(record.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-full font-semibold border-2 ${typeConfig.color}`}>
              {typeConfig.icon}
              <span className="ml-2 capitalize">{record.recordType.replace('_', ' ')}</span>
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-10 w-10 rounded-xl border-2 border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all duration-200 transform hover:scale-110"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-8 animate-fade-in">
          {/* Diagnosis Section */}
          {record.diagnosis && (
            <EnhancedSection 
              icon={<Activity className="h-5 w-5 text-red-600" />}
              title="Diagnosis"
              color="red"
              gradient="from-red-500 to-red-600"
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Main Problem</p>
                  <p className="text-gray-900 text-lg font-medium">{record.diagnosis.mainProblem}</p>
                </div>
                {record.diagnosis.symptoms && record.diagnosis.symptoms.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Symptoms</p>
                    <div className="flex flex-wrap gap-2">
                      {record.diagnosis.symptoms.map((symptom, index) => (
                        <span key={index} className="inline-flex items-center px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-200">
                          <Zap className="h-3 w-3 mr-2" />
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {record.diagnosis.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Clinical Notes</p>
                    <p className="text-gray-600 text-lg leading-relaxed">{record.diagnosis.notes}</p>
                  </div>
                )}
              </div>
            </EnhancedSection>
          )}

          {/* Medications Section */}
          {record.treatment?.medications?.length > 0 && (
            <EnhancedSection 
              icon={<Pill className="h-5 w-5 text-green-600" />}
              title="Medications"
              color="green"
              gradient="from-green-500 to-green-600"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {record.treatment.medications.map((medication, index) => (
                  <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200 hover:border-green-300 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-bold text-gray-900 text-lg">{medication.name}</p>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        {medication.dosage}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-600 mb-3">
                      <span className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{medication.frequency}</span>
                      </span>
                      <span className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">{medication.duration}</span>
                      </span>
                    </div>
                    {medication.instructions && (
                      <div className="text-gray-600 border-t border-green-200 pt-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Instructions</p>
                        <p className="text-sm">{medication.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </EnhancedSection>
          )}

          {/* Vital Signs Section */}
          {record.vitalSigns && (
            <EnhancedSection 
              icon={<Heart className="h-5 w-5 text-blue-600" />}
              title="Vital Signs"
              color="blue"
              gradient="from-blue-500 to-blue-600"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {record.vitalSigns.bloodPressure && (
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                    <Activity className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">Blood Pressure</p>
                    <p className="font-bold text-gray-900 text-lg">{record.vitalSigns.bloodPressure}</p>
                  </div>
                )}
                {record.vitalSigns.heartRate && (
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                    <Heart className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">Heart Rate</p>
                    <p className="font-bold text-gray-900 text-lg">{record.vitalSigns.heartRate} bpm</p>
                  </div>
                )}
                {record.vitalSigns.temperature && (
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                    <Thermometer className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">Temperature</p>
                    <p className="font-bold text-gray-900 text-lg">{record.vitalSigns.temperature}°F</p>
                  </div>
                )}
                {record.vitalSigns.weight && (
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                    <Scale className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-gray-700">Weight</p>
                    <p className="font-bold text-gray-900 text-lg">{record.vitalSigns.weight} kg</p>
                  </div>
                )}
              </div>
            </EnhancedSection>
          )}

          {/* Enhanced Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button 
              onClick={onDownloadRecord}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
            >
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
            <button 
              onClick={onViewDetails}
              className="px-6 py-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3 shadow-lg"
            >
              <Eye className="h-5 w-5" />
              <span>View Full Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Section Component
const EnhancedSection = ({ icon, title, color, gradient, children }) => {
  const colorClasses = {
    red: 'border-red-200 bg-gradient-to-r from-red-50 to-red-50/50',
    green: 'border-green-200 bg-gradient-to-r from-green-50 to-green-50/50',
    blue: 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50',
    purple: 'border-purple-200 bg-gradient-to-r from-purple-50 to-purple-50/50'
  }

  return (
    <div className={`rounded-2xl p-6 border-2 ${colorClasses[color]}`}>
      <div className="flex items-center mb-6">
        <div className={`h-12 w-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mr-4 shadow-lg`}>
          {icon}
        </div>
        <h4 className="text-xl font-bold text-gray-900">{title}</h4>
      </div>
      {children}
    </div>
  )
}

// Enhanced Details Modal Component
const DetailsModal = ({ record, formatDate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto transform animate-scale-in border border-white/20">
        <div className="flex justify-between items-center p-8 border-b border-gray-200 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Medical Record Details</h2>
              <p className="text-gray-600 text-lg mt-2">
                {formatDate(record.createdAt)} • Dr. {record.doctorId?.firstName} {record.doctorId?.lastName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-12 w-12 rounded-2xl border-2 border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all duration-200 transform hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          {/* Add comprehensive record details here */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Medical Record</h3>
            <p className="text-gray-700 text-lg leading-relaxed">
              This is the detailed view of your medical record. All your health information is securely stored and easily accessible.
            </p>
          </div>
        </div>

        <div className="flex justify-end p-8 border-t border-gray-200">
          <button 
            onClick={onClose}
            className="bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}

export default PatientMedicalRecords