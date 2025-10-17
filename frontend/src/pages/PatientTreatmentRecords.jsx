import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { medicalRecordsAPI } from '../services/api'
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pill, 
  Stethoscope, 
  FileText,
  ChevronDown,
  Zap,
  Heart,
  Activity,
  User,
  Download,
  Share2,
  Eye
} from 'lucide-react'

const PatientTreatmentRecords = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery(
    'treatment-records',
    () => medicalRecordsAPI.getByPatient(user?._id),
    { enabled: !!user?._id }
  )

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState />
  
  const treatments = (data?.data?.medicalRecords || data?.data?.data?.medicalRecords || [])
    .filter(record => record.recordType === 'treatment')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (treatments.length === 0) return <EmptyState />

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl mb-6">
            <Stethoscope className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4 bg-gradient-to-br from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            My Treatment Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Track your medical treatments, monitor progress, and stay informed about your health journey
          </p>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Treatments</p>
                  <p className="text-3xl font-bold text-gray-900">{treatments.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {treatments.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {treatments.filter(t => new Date(t.createdAt) < new Date()).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Treatment Timeline */}
        <div className="relative">
          {/* Vertical Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-indigo-400 rounded-full transform -translate-x-1/2 hidden lg:block"></div>
          
          <div className="space-y-8 lg:space-y-12">
            {treatments.map((record, index) => (
              <TreatmentStep 
                key={record._id} 
                record={record} 
                stepNumber={treatments.length - index}
                isLast={index === treatments.length - 1}
                isFirst={index === 0}
                totalSteps={treatments.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const TreatmentStep = ({ record, stepNumber, isLast, isFirst, totalSteps }) => {
  const [isExpanded, setIsExpanded] = useState(isFirst)
  const now = new Date()
  const recordDate = new Date(record.createdAt)
  const isPast = recordDate < now
  const isToday = recordDate.toDateString() === now.toDateString()
  const isFuture = recordDate > now

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const getStatusConfig = () => {
    if (isFuture) {
      return {
        text: 'Upcoming',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        gradient: 'from-purple-500 to-purple-600',
        icon: <Clock className="h-4 w-4" />,
        indicatorColor: 'bg-purple-500',
        bannerColor: 'purple'
      }
    }
    if (isToday) {
      return {
        text: 'Active',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        gradient: 'from-blue-500 to-blue-600',
        icon: <Zap className="h-4 w-4" />,
        indicatorColor: 'bg-blue-500',
        bannerColor: 'blue'
      }
    }
    return {
      text: 'Completed',
      color: 'bg-green-100 text-green-800 border-green-200',
      gradient: 'from-green-500 to-green-600',
      icon: <CheckCircle className="h-4 w-4" />,
      indicatorColor: 'bg-green-500',
      bannerColor: 'green'
    }
  }

  const status = getStatusConfig()

  return (
    <div className={`relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border transition-all duration-500 hover:shadow-2xl ${
      isExpanded ? 'ring-2 ring-opacity-20' : 'hover:scale-[1.02]'
    } ${
      isPast ? 'ring-green-500 border-green-100' : 
      isToday ? 'ring-blue-500 border-blue-100' : 
      'ring-purple-500 border-purple-100'
    }`}>
      
      {/* Step Header */}
      <div 
        className="flex items-start p-8 cursor-pointer transition-all duration-300 hover:bg-gray-50/50 rounded-3xl"
        onClick={toggleExpand}
      >
        {/* Enhanced Step Indicator */}
        <div className="flex flex-col items-center mr-6 relative">
          <div className="relative group">
            <div className={`w-16 h-16 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-2xl bg-gradient-to-br ${status.gradient} transform group-hover:scale-110 transition-all duration-300`}>
              {isPast ? <CheckCircle className="h-6 w-6" /> : stepNumber}
            </div>
            {/* Status dot */}
            <div className={`absolute -top-1 -right-1 w-5 h-5 ${status.indicatorColor} border-2 border-white rounded-full shadow-lg`}></div>
            {/* Progress ring for future steps */}
            {isFuture && (
              <div className="absolute inset-0 rounded-2xl border-2 border-purple-300 animate-pulse"></div>
            )}
          </div>
          
          {/* Connection line */}
          {!isLast && (
            <div className={`w-1 h-16 mt-4 rounded-full bg-gradient-to-b ${
              isPast ? 'from-green-400 to-green-200' :
              'from-gray-300 to-gray-200'
            }`}></div>
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-br from-gray-800 to-gray-900 bg-clip-text text-transparent">
                Treatment Plan #{totalSteps - stepNumber + 1}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${status.color} flex items-center space-x-2`}>
                  {status.icon}
                  <span>{status.text}</span>
                </span>
                {record.diagnosis?.mainProblem && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200">
                    {record.diagnosis.mainProblem}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {recordDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {isToday && ' • Today'}
                </span>
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-lg mb-4 leading-relaxed">
            {getTreatmentSummary(record)}
          </p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              {record.treatment?.medications?.length > 0 && (
                <span className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <Pill className="h-4 w-4 text-blue-600" />
                  <span>{record.treatment.medications.length} medication(s)</span>
                </span>
              )}
              {Array.isArray(record.treatment?.procedures) && record.treatment.procedures.length > 0 && (
                <span className="flex items-center space-x-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                  <Stethoscope className="h-4 w-4 text-purple-600" />
                  <span>{record.treatment.procedures.length} procedure(s)</span>
                </span>
              )}
              {isPast && (
                <span className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg text-green-700 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 transform hover:scale-110">
                <Share2 className="h-5 w-5 text-gray-500" />
              </button>
              <div className={`transform transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <ChevronDown className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="px-8 pb-8 ml-24 border-t border-gray-100 pt-8 space-y-8 animate-fade-in">
          {/* Enhanced Status Banner */}
          <div className={`rounded-2xl p-6 border-l-4 bg-gradient-to-r ${
            status.bannerColor === 'green' ? 'from-green-50 to-emerald-50 border-green-400' :
            status.bannerColor === 'blue' ? 'from-blue-50 to-cyan-50 border-blue-400' :
            'from-purple-50 to-violet-50 border-purple-400'
          }`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                status.bannerColor === 'green' ? 'bg-green-100' :
                status.bannerColor === 'blue' ? 'bg-blue-100' :
                'bg-purple-100'
              }`}>
                {status.icon}
              </div>
              <div>
                <h4 className={`text-xl font-bold ${
                  status.bannerColor === 'green' ? 'text-green-900' :
                  status.bannerColor === 'blue' ? 'text-blue-900' :
                  'text-purple-900'
                }`}>
                  {isPast ? 'Treatment Completed' : isToday ? 'Active Treatment' : 'Upcoming Treatment'}
                </h4>
                <p className={`mt-1 ${
                  status.bannerColor === 'green' ? 'text-green-700' :
                  status.bannerColor === 'blue' ? 'text-blue-700' :
                  'text-purple-700'
                }`}>
                  {isPast 
                    ? `This treatment plan was successfully completed on ${recordDate.toLocaleDateString()}`
                    : isToday
                    ? 'Follow this treatment plan as prescribed by your doctor'
                    : 'This treatment plan is scheduled for the future'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Medications Section */}
          {record.treatment?.medications?.length > 0 && (
            <TreatmentSection 
              icon={<Pill className="h-6 w-6" />}
              title="Medications"
              type="medications"
              items={record.treatment.medications}
              isPast={isPast}
            />
          )}

          {/* Procedures Section */}
          {Array.isArray(record.treatment?.procedures) && record.treatment.procedures.length > 0 && (
            <TreatmentSection 
              icon={<Stethoscope className="h-6 w-6" />}
              title="Procedures"
              type="procedures" 
              items={record.treatment.procedures}
              isPast={isPast}
            />
          )}

          {/* Recommendations Section */}
          {Array.isArray(record.treatment?.recommendations) && record.treatment.recommendations.length > 0 && (
            <TreatmentSection 
              icon={<FileText className="h-6 w-6" />}
              title="Recommendations"
              type="recommendations"
              items={record.treatment.recommendations}
              isPast={isPast}
            />
          )}

          {/* Enhanced Doctor Notes */}
          {record.doctorNotes && (
            <div className={`rounded-2xl p-6 border-l-4 bg-gradient-to-r ${
              isPast ? 'from-green-50 to-emerald-50 border-green-400' :
              isToday ? 'from-blue-50 to-cyan-50 border-blue-400' :
              'from-purple-50 to-violet-50 border-purple-400'
            }`}>
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                  <User className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">Doctor's Notes</h4>
                  <p className="text-gray-700 leading-relaxed text-lg">{record.doctorNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Completion Status */}
          {isPast && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
              <div className="flex items-center space-x-3 text-green-700 mb-4 sm:mb-0">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold text-lg">Treatment successfully completed</span>
              </div>
              <button className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-all duration-200 transform hover:scale-105 font-medium">
                View Follow-up Details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const TreatmentSection = ({ icon, title, type, items, isPast }) => {
  const renderItems = () => {
    switch (type) {
      case 'medications':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {items.map((med, i) => (
              <div key={i} className={`rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                isPast 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
                  : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold text-gray-900 text-xl">{med.name}</span>
                  <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                    isPast 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {med.dosage}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-gray-600 mb-4">
                  <span className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{med.frequency}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{med.duration}</span>
                  </span>
                </div>
                {med.instructions && (
                  <div className="text-gray-600 border-t border-gray-200 pt-4">
                    <strong className="text-gray-900">Instructions:</strong> {med.instructions}
                  </div>
                )}
                {isPast && (
                  <div className="flex items-center mt-4 text-green-600 text-sm font-medium">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completed course
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      
      case 'procedures':
      case 'recommendations':
        return (
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-start p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200">
                {isPast ? (
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
                <span className={`text-lg ${isPast ? 'text-green-800' : 'text-gray-700'}`}>{item}</span>
              </div>
            ))}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
          isPast ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
        <div>
          <h4 className="text-2xl font-bold text-gray-900">{title}</h4>
          {isPast && (
            <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
              Completed
            </span>
          )}
        </div>
      </div>
      {renderItems()}
    </div>
  )
}

const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Loading Your Treatment Journey</h3>
      <p className="text-gray-600 text-lg">Please wait while we fetch your medical information</p>
    </div>
  </div>
)

const ErrorState = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-10 w-10 text-red-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Records</h3>
      <p className="text-gray-600 text-lg mb-6">There was an error fetching your treatment information</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
      >
        Try Again
      </button>
    </div>
  </div>
)

const EmptyState = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Heart className="h-12 w-12 text-blue-600" />
      </div>
      <h3 className="text-3xl font-bold text-gray-900 mb-4">No Treatment Records Yet</h3>
      <p className="text-gray-600 text-lg mb-8 leading-relaxed">
        Your treatment plans will appear here once prescribed by your doctor. 
        Check back after your next medical appointment to track your health journey.
      </p>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <p className="text-gray-700 mb-3 font-medium">📅 Schedule your next appointment</p>
        <button 
          onClick={() => navigate('/book-appointment')}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
        >
          Book Appointment
        </button>
      </div>
    </div>
  </div>
)

// Helper function to generate treatment summary
const getTreatmentSummary = (record) => {
  const parts = []
  
  if (record.treatment?.medications?.length > 0) {
    parts.push(`${record.treatment.medications.length} medication(s)`)
  }
  
  if (Array.isArray(record.treatment?.procedures) && record.treatment.procedures.length > 0) {
    parts.push(`${record.treatment.procedures.length} procedure(s)`)
  }
  
  if (Array.isArray(record.treatment?.recommendations) && record.treatment.recommendations.length > 0) {
    parts.push(`${record.treatment.recommendations.length} recommendation(s)`)
  }
  
  return parts.join(' • ') || 'Comprehensive treatment plan with detailed instructions'
}

export default PatientTreatmentRecords