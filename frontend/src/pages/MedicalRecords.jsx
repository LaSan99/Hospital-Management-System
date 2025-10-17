import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  User, 
  Calendar, 
  Stethoscope, 
  Pill, 
  Activity,
  Eye,
  Edit,
  HeartPulse,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Users,
  UserCheck,
  LineChart,
  Mail,
  Download
} from 'lucide-react'
import jsPDF from 'jspdf'
import { medicalRecordsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const MedicalRecords = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Fetch medical records data
  const { data: medicalRecordsData, isLoading, error } = useQuery(
    'medical-records',
    () => medicalRecordsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  console.log('Medical Records Data:', medicalRecordsData)
  console.log('Medical Records Error:', error)

  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || 
                         []
  
  console.log('Parsed Medical Records:', medicalRecords)
  console.log('Medical Records Count:', medicalRecords.length)

  // Filter medical records based on search term and type
  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = 
      record.patientId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctorId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.doctorId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.mainProblem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recordType?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !typeFilter || record.recordType === typeFilter
    
    return matchesSearch && matchesType
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const generateMedicalRecordsReportPDF = () => {
    try {
      console.log('Starting Medical Records PDF generation...')
      console.log('Medical Records data:', medicalRecords)
      
      // Check if medical records data exists
      if (!medicalRecords || medicalRecords.length === 0) {
        console.warn('No medical records data available')
        alert('No medical records data available for report generation')
        return
      }
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20
      
      console.log('PDF document created successfully')

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Records Report', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Summary
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Medical Records: ${medicalRecords.length}`, 20, yPosition)
      yPosition += 6
      doc.text(`Completed Records: ${medicalRecords.filter(r => r.status === 'completed').length}`, 20, yPosition)
      yPosition += 6
      doc.text(`Pending Records: ${medicalRecords.filter(r => r.status === 'pending').length}`, 20, yPosition)
      yPosition += 6
      doc.text(`In Progress Records: ${medicalRecords.filter(r => r.status === 'in_progress').length}`, 20, yPosition)
      yPosition += 15

      // Record Types summary
      const recordTypes = [...new Set(medicalRecords.map(record => record.recordType).filter(Boolean))]
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Record Types', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Record Types: ${recordTypes.length}`, 20, yPosition)
      yPosition += 6
      recordTypes.forEach(type => {
        const count = medicalRecords.filter(r => r.recordType === type).length
        doc.text(`• ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}: ${count} record${count > 1 ? 's' : ''}`, 25, yPosition)
        yPosition += 5
      })
      yPosition += 10

      // Medical Records Details
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Medical Records Details', 20, yPosition)
      yPosition += 10

      medicalRecords.forEach((record, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 100) {
          doc.addPage()
          yPosition = 20
        }

        // Record header
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${record.recordType?.charAt(0).toUpperCase() + record.recordType?.slice(1).replace('_', ' ') || 'Medical Record'}`, 20, yPosition)
        yPosition += 8

        // Record details
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        const details = [
          `Record ID: ${record._id}`,
          `Patient: ${record.patientName || 'Unknown Patient'}`,
          `Doctor: ${record.doctorName || 'Unknown Doctor'}`,
          `Record Type: ${record.recordType || 'Not specified'}`,
          `Status: ${record.status || 'Not specified'}`,
          `Created Date: ${formatDate(record.createdAt)}`,
        ]

        if (record.diagnosis) {
          details.push(`Diagnosis: ${record.diagnosis}`)
        }
        if (record.treatment) {
          details.push(`Treatment: ${record.treatment}`)
        }
        if (record.medications && record.medications.length > 0) {
          details.push(`Medications: ${record.medications.join(', ')}`)
        }
        if (record.notes) {
          details.push(`Notes: ${record.notes}`)
        }
        if (record.vitalSigns) {
          details.push(`Vital Signs: ${JSON.stringify(record.vitalSigns)}`)
        }

        details.forEach(detail => {
          if (yPosition > pageHeight - 20) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(detail, 25, yPosition)
          yPosition += 5
        })

        yPosition += 10
      })

      // Footer
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
        doc.text('MediCare Hospital Management System', 20, pageHeight - 10)
      }

      // Download the PDF
      console.log('Attempting to save PDF...')
      doc.save(`medical-records-report-${new Date().toISOString().split('T')[0]}.pdf`)
      console.log('PDF saved successfully!')
      alert('Medical Records report PDF downloaded successfully!')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + error.message)
    }
  }

  const getTypeOptions = () => {
    const types = [...new Set(medicalRecords.map(record => record.recordType))]
    return types.map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Medical Records</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load medical records. Please try again.'}
          </p>
        </div>
      </div>
    )
  }

  // Enhanced UI Components
  const WelcomeBanner = ({ medicalRecords = [], generateMedicalRecordsReportPDF }) => {
    const completedRecords = medicalRecords.filter(r => r.status === 'completed').length
    const draftRecords = medicalRecords.filter(r => r.status === 'draft').length
    const uniquePatients = new Set(medicalRecords.map(r => r.patientId?._id)).size

    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left content area */}
          <div className="p-8 lg:p-10 flex-1">
            <div className="flex items-center mb-6">
              <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Medical Records System
                </h1>
                <p className="text-blue-100 text-lg">
                  Comprehensive medical documentation and patient care management
                </p>
              </div>
            </div>
            
            <p className="text-blue-100/90 mb-8 max-w-2xl text-lg leading-relaxed">
              Manage patient medical records, track diagnoses, treatments, and maintain 
              comprehensive healthcare documentation with our secure, professional medical records platform.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <HealthMetric
                icon={<FileText size={20} className="text-blue-400" />}
                label="Total Records"
                value={medicalRecords.length}
                status="normal"
              />
              <HealthMetric
                icon={<CheckCircle size={20} className="text-green-400" />}
                label="Completed"
                value={completedRecords}
                status="normal"
              />
              <HealthMetric
                icon={<Users size={20} className="text-purple-400" />}
                label="Patients"
                value={uniquePatients}
                status="normal"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  try {
                    console.log('Generating medical records report PDF')
                    generateMedicalRecordsReportPDF()
                  } catch (error) {
                    console.error('Error generating medical records report:', error)
                  }
                }}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center"
              >
                <Download size={18} className="mr-2" />
                Download Reports
              </button>
            </div>
          </div>
          
          {/* Right visualization area */}
          <div className="lg:w-96 bg-white/10 backdrop-blur-sm p-8 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <FileText size={48} className="text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <p className="text-white font-semibold text-lg mb-2">System Status</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-blue-100 font-medium">All Systems Operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const HealthMetric = ({ icon, label, value, status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'good': return 'text-green-400'
        case 'warning': return 'text-yellow-400'
        case 'critical': return 'text-red-400'
        default: return 'text-blue-400'
      }
    }

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-xl bg-white/10 ${getStatusColor()}`}>
            {icon}
          </div>
        </div>
        <div className="text-white">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-blue-100 text-sm font-medium">{label}</p>
        </div>
      </div>
    )
  }

  const SearchAndFiltersSection = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medical records by patient, doctor, diagnosis..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 min-w-[150px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {getTypeOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl font-semibold text-gray-700 transition-colors flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>
    </div>
  )

  const ResultsCountSection = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
        Showing <span className="font-semibold text-gray-900">{filteredRecords.length}</span> of{' '}
        <span className="font-semibold text-gray-900">{medicalRecords.length}</span> medical records
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <TrendingUp className="h-4 w-4" />
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  )

  const MedicalRecordsListSection = () => (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-2xl mr-4 shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {typeFilter ? `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Records` : 'All Medical Records'}
              </h2>
              <p className="text-gray-600 mt-1">
                {typeFilter 
                  ? `Showing ${typeFilter} medical records` 
                  : 'Comprehensive medical documentation and patient care records'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{filteredRecords.length}</div>
              <div className="text-sm text-gray-500">Records Found</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {filteredRecords.length === 0 ? (
        <EmptyStateSection />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Patient</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Doctor</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Diagnosis</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Medications</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRecords.map((record) => (
                <EnhancedMedicalRecordRow key={record._id} record={record} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const EnhancedMedicalRecordRow = ({ record }) => (
    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
            <User className="h-7 w-7 text-blue-600" />
          </div>
          <div className="ml-5">
            <div className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {record.patientId?.firstName} {record.patientId?.lastName}
            </div>
            <div className="text-sm text-gray-500 flex items-center mt-1">
              <Mail className="h-3 w-3 mr-1" />
              {record.patientId?.email}
            </div>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
          Dr. {record.doctorId?.firstName} {record.doctorId?.lastName}
        </div>
        <div className="text-sm text-gray-500 flex items-center mt-1">
          <Stethoscope className="h-3 w-3 mr-1" />
          {record.doctorId?.specialization}
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 capitalize shadow-sm">
          {record.recordType?.replace('_', ' ')}
        </span>
      </td>
      <td className="px-8 py-6">
        <div className="text-base font-bold text-gray-900 max-w-xs group-hover:text-gray-700 transition-colors">
          {record.diagnosis?.mainProblem || 'N/A'}
        </div>
        {record.diagnosis?.symptoms && record.diagnosis.symptoms.length > 0 && (
          <div className="text-sm text-gray-500 mt-2 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {record.diagnosis.symptoms.slice(0, 2).join(', ')}
            {record.diagnosis.symptoms.length > 2 && ` +${record.diagnosis.symptoms.length - 2} more`}
          </div>
        )}
      </td>
      <td className="px-8 py-6">
        {record.treatment?.medications && record.treatment.medications.length > 0 ? (
          <div className="text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors">
            <div className="flex items-center">
              <Pill className="h-4 w-4 mr-2" />
              {record.treatment.medications[0].name}
            </div>
            {record.treatment.medications.length > 1 && (
              <div className="text-sm text-gray-500 mt-1">
                +{record.treatment.medications.length - 1} more medications
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-500 flex items-center">
            <Pill className="h-4 w-4 mr-2" />
            None prescribed
          </span>
        )}
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <div className="text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
          {formatDate(record.createdAt)}
        </div>
        <div className="text-sm text-gray-500 flex items-center mt-1">
          <Clock className="h-3 w-3 mr-1" />
          {new Date(record.createdAt).toLocaleTimeString()}
        </div>
      </td>
      <td className="px-8 py-6 whitespace-nowrap">
        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getStatusColor(record.status)}`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            record.status === 'completed' ? 'bg-green-500' : 
            record.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
          }`}></div>
          {record.status}
        </span>
      </td>
    </tr>
  )

  const EmptyStateSection = () => (
    <div className="p-12">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No medical records found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {searchTerm || typeFilter 
            ? 'Try adjusting your search criteria to find the records you\'re looking for.' 
            : 'Get started by creating your first medical record to begin documenting patient care.'
          }
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <WelcomeBanner medicalRecords={medicalRecords} generateMedicalRecordsReportPDF={generateMedicalRecordsReportPDF} />
          <SearchAndFiltersSection />
          <ResultsCountSection />
          <MedicalRecordsListSection />
        </div>
      </div>
    </div>
  )
}

export default MedicalRecords
