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
  Scale,
  Thermometer,
  Shield,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Download,
  Eye
} from 'lucide-react'
import { medicalRecordsAPI } from '../services/api'

const PatientMedicalRecords = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  const { data: medicalRecordsData, isLoading, error } = useQuery(
    'patient-medical-records',
    () => medicalRecordsAPI.getByPatient(user?._id),
    { 
      enabled: !!user?._id,
      retry: 1
    }
  )

  console.log('Medical Records Data:', medicalRecordsData)
  console.log('User:', user)

  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || 
                         []
  
  console.log('Parsed Medical Records:', medicalRecords)
  
  // Filter records
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
      month: 'long',
      day: 'numeric'
    })
  }

  const getRecordTypeColor = (type) => {
    switch (type) {
      case 'consultation':
        return 'badge-info'
      case 'diagnosis':
        return 'badge-warning'
      case 'treatment':
        return 'badge-success'
      case 'follow_up':
        return 'badge-info'
      default:
        return 'badge-warning'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Medical Records</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load medical records. Please try again.'}
          </p>
          <p className="text-sm text-red-500 mt-2">
            Error details: {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50">
      {/* Welcome Banner */}
      <WelcomeBanner navigate={navigate} />
      
      {/* Stats Cards */}
      <StatsCards 
        totalRecords={medicalRecords.length}
        filteredRecords={filteredRecords.length}
        recordTypes={['consultation', 'diagnosis', 'treatment', 'follow_up']}
      />
      
      {/* Search and Filters */}
      <SearchSection 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        navigate={navigate}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-6">
        Showing {filteredRecords.length} of {medicalRecords.length} medical records
      </div>

      {/* Medical Records List */}
      {filteredRecords.length > 0 ? (
        <MedicalRecordsList 
          filteredRecords={filteredRecords}
          formatDate={formatDate}
          getRecordTypeColor={getRecordTypeColor}
        />
      ) : (
        <NoRecordsFound searchTerm={searchTerm} filterType={filterType} navigate={navigate} />
      )}
    </div>
  )
}

// Component Functions
const WelcomeBanner = ({ navigate }) => {
  const handleDownloadRecords = () => {
    // In a real app, this would trigger a download of medical records
    alert('Download functionality would be implemented here')
  }

  const handleViewSummary = () => {
    // Navigate to a summary view or show a modal
    alert('Summary view would be implemented here')
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row">
        {/* Left content area */}
        <div className="p-6 md:p-8 flex-1">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <FileText size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Medical Records
            </h1>
          </div>
          <p className="text-gray-600 mb-6 max-w-lg">
            Access your complete medical history, diagnoses, treatments, and lab results in one secure location.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <HealthMetric
              icon={<Shield size={18} className="text-blue-500" />}
              label="Secure Records"
              value="HIPAA"
              status="normal"
            />
            <HealthMetric
              icon={<Clock size={18} className="text-green-500" />}
              label="Last Updated"
              value="Today"
              status="normal"
            />
            <HealthMetric
              icon={<TrendingUp size={18} className="text-purple-500" />}
              label="Health Trend"
              value="Stable"
              status="normal"
            />
          </div>
          <div className="flex space-x-3 mt-2">
            <button 
              onClick={handleDownloadRecords}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Download Records
            </button>
            <button 
              onClick={handleViewSummary}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Eye className="h-4 w-4 mr-2 inline" />
              View Summary
            </button>
          </div>
        </div>
        {/* Right visualization area */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-full md:w-1/3 p-6 flex items-center justify-center relative">
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M20,20 L80,20 L80,80 L20,80 Z"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <path
                d="M30,30 L70,30 L70,70 L30,70 Z"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <path
                d="M40,40 L60,40 L60,60 L40,60 Z"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                <FileText size={40} className="text-white" />
              </div>
            </div>
            <p className="text-blue-800 font-medium text-center">
              Your health data, securely stored
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const HealthMetric = ({ icon, label, value, status }) => {
  const statusColors = {
    normal: 'text-green-600',
    warning: 'text-amber-600',
    alert: 'text-red-600',
  }
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center mb-1">
        {icon}
        <span className="text-xs text-gray-500 ml-1.5">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-800">{value}</span>
        <span className={`text-xs font-medium ${statusColors[status]}`}>
          {status === 'normal'
            ? 'Secure'
            : status === 'warning'
              ? 'Warning'
              : 'Alert'}
        </span>
      </div>
    </div>
  )
}

const StatsCards = ({ totalRecords, filteredRecords, recordTypes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        icon={<FileText size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
        label="Total Records"
        value={totalRecords.toString()}
        subLabel="Available"
        accentColor="border-blue-500"
      />
      <StatCard
        icon={<Search size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-green-400 to-green-600"
        label="Search Results"
        value={filteredRecords.toString()}
        subLabel="Found"
        accentColor="border-green-500"
      />
      <StatCard
        icon={<Activity size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        label="Record Types"
        value={recordTypes.length.toString()}
        subLabel="Categories"
        accentColor="border-purple-500"
      />
      <StatCard
        icon={<Shield size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-orange-400 to-orange-600"
        label="Privacy"
        value="Protected"
        subLabel="HIPAA"
        valueClass="text-base"
        accentColor="border-orange-500"
      />
    </div>
  )
}

const StatCard = ({ icon, iconBg, label, value, subLabel, valueClass = 'text-3xl', accentColor }) => {
  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-md border-l-4 ${accentColor} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className={`font-bold ${valueClass} mt-1 text-gray-800`}>
            {value}
          </p>
          <p className="text-gray-400 text-xs mt-1">{subLabel}</p>
        </div>
        <div
          className={`${iconBg} w-12 h-12 rounded-lg flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

const SearchSection = ({ searchTerm, setSearchTerm, filterType, setFilterType, navigate }) => {
  const handleAddRecord = () => {
    // Navigate to book appointment to create a new medical record
    navigate('/book-appointment')
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medical records..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white"
        >
          <option value="all">All Types</option>
          <option value="consultation">Consultation</option>
          <option value="diagnosis">Diagnosis</option>
          <option value="treatment">Treatment</option>
          <option value="follow_up">Follow-up</option>
        </select>
        <button 
          onClick={handleAddRecord}
          className="flex items-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </button>
      </div>
    </div>
  )
}

const NoRecordsFound = ({ searchTerm, filterType, navigate }) => {
  const handleClearFilters = () => {
    // This would clear the search and filter state
    // Since we don't have access to the setters here, we'll navigate to refresh
    window.location.reload()
  }

  const handleBookAppointment = () => {
    navigate('/book-appointment')
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
          <FileText className="text-white" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {searchTerm || filterType !== 'all' ? 'No medical records found' : 'No medical records yet'}
        </h3>
        <p className="text-gray-500 mb-4">
          {searchTerm || filterType !== 'all' 
            ? 'Try adjusting your search or filter criteria'
            : 'Your medical records will appear here after your appointments'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {searchTerm || filterType !== 'all' ? (
            <button 
              onClick={handleClearFilters}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Search className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          ) : (
            <button 
              onClick={handleBookAppointment}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const MedicalRecordsList = ({ filteredRecords, formatDate, getRecordTypeColor }) => {
  return (
    <div className="space-y-6">
      {filteredRecords.map((record) => (
        <MedicalRecordCard
          key={record._id}
          record={record}
          formatDate={formatDate}
          getRecordTypeColor={getRecordTypeColor}
        />
      ))}
    </div>
  )
}

const MedicalRecordCard = ({ record, formatDate, getRecordTypeColor }) => {
  const handleViewDetails = () => {
    // In a real app, this would open a detailed view or modal
    alert(`Viewing details for: ${record.diagnosis?.mainProblem || 'Medical Record'}`)
  }

  const handleDownloadRecord = () => {
    // In a real app, this would download the specific record
    alert(`Downloading record: ${record.diagnosis?.mainProblem || 'Medical Record'}`)
  }

  const handleShareRecord = () => {
    // In a real app, this would open a share dialog
    alert(`Sharing record: ${record.diagnosis?.mainProblem || 'Medical Record'}`)
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {record.diagnosis?.mainProblem || 'Medical Record'}
              </h3>
              <p className="text-sm text-gray-500">
                Dr. {record.doctorId?.firstName} {record.doctorId?.lastName} • {formatDate(record.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              record.recordType === 'consultation' ? 'bg-blue-100 text-blue-800' :
              record.recordType === 'diagnosis' ? 'bg-yellow-100 text-yellow-800' :
              record.recordType === 'treatment' ? 'bg-green-100 text-green-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {record.recordType.replace('_', ' ')}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleViewDetails}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={handleDownloadRecord}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Download Record"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Diagnosis */}
                {record.diagnosis && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Activity className="h-4 w-4 mr-2 text-red-500" />
                      Diagnosis
                    </h4>
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Main Problem:</span> {record.diagnosis.mainProblem}
                      </p>
                      {record.diagnosis.symptoms && record.diagnosis.symptoms.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Symptoms:</p>
                          <ul className="text-sm text-gray-600 list-disc list-inside">
                            {record.diagnosis.symptoms.map((symptom, index) => (
                              <li key={index}>{symptom}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {record.diagnosis.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Notes:</span> {record.diagnosis.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Treatment */}
                {record.treatment && record.treatment.medications && record.treatment.medications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Pill className="h-4 w-4 mr-2 text-green-500" />
                      Medications
                    </h4>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      {record.treatment.medications.map((medication, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{medication.name}</p>
                            <p className="text-sm text-gray-600">{medication.dosage}</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {medication.frequency} • {medication.duration}
                          </p>
                          {medication.instructions && (
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">Instructions:</span> {medication.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab Results */}
                {record.labResults && record.labResults.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <TestTube className="h-4 w-4 mr-2 text-purple-500" />
                      Lab Results
                    </h4>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      {record.labResults.map((lab, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{lab.testName}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lab.status === 'normal' ? 'bg-green-100 text-green-800' : 
                      lab.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {lab.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Result: {lab.result} {lab.normalRange && `(Normal: ${lab.normalRange})`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(lab.testDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vital Signs */}
                {record.vitalSigns && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Heart className="h-4 w-4 mr-2 text-blue-500" />
                      Vital Signs
                    </h4>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {record.vitalSigns.bloodPressure && (
                          <div>
                            <p className="text-xs text-gray-500">Blood Pressure</p>
                            <p className="text-sm font-medium text-gray-900">{record.vitalSigns.bloodPressure}</p>
                          </div>
                        )}
                        {record.vitalSigns.heartRate && (
                          <div>
                            <p className="text-xs text-gray-500">Heart Rate</p>
                            <p className="text-sm font-medium text-gray-900">{record.vitalSigns.heartRate} bpm</p>
                          </div>
                        )}
                        {record.vitalSigns.temperature && (
                          <div>
                            <p className="text-xs text-gray-500">Temperature</p>
                            <p className="text-sm font-medium text-gray-900">{record.vitalSigns.temperature}°F</p>
                          </div>
                        )}
                        {record.vitalSigns.weight && (
                          <div>
                            <p className="text-xs text-gray-500">Weight</p>
                            <p className="text-sm font-medium text-gray-900">{record.vitalSigns.weight} kg</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Follow-up */}
                {record.followUp && record.followUp.nextAppointment && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                      Follow-up
                    </h4>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Next Appointment:</span> {formatDate(record.followUp.nextAppointment)}
                      </p>
                      {record.followUp.instructions && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Instructions:</span> {record.followUp.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Doctor Notes */}
                {record.doctorNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Doctor's Notes</h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-700">{record.doctorNotes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientMedicalRecords
