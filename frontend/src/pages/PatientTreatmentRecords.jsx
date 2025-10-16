import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { medicalRecordsAPI } from '../services/api'

const PatientTreatmentRecords = () => {
  const { user } = useAuth()

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-3">
            My Treatment Journey
          </h1>
          <p className="text-lg text-gray-600">
            Track your medical treatments and progress over time
          </p>
        </div>

        <div className="space-y-8">
          {treatments.map((record, index) => (
            <TreatmentStep 
              key={record._id} 
              record={record} 
              stepNumber={treatments.length - index}
              isLast={index === treatments.length - 1}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const TreatmentStep = ({ record, stepNumber, isLast, isFirst }) => {
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
        icon: '⏳',
        indicatorColor: 'bg-purple-500'
      }
    }
    if (isToday) {
      return {
        text: 'Today',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🔄',
        indicatorColor: 'bg-blue-500'
      }
    }
    return {
      text: 'Completed',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅',
      indicatorColor: 'bg-green-500'
    }
  }

  const status = getStatusConfig()

  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-300 ${
      isExpanded ? 'shadow-md ring-1 ring-gray-100' : 'hover:shadow-md'
    } ${isPast ? 'border-green-100' : isToday ? 'border-blue-100' : 'border-purple-100'}`}>
      
      {/* Step Header */}
      <div 
        className="flex items-start p-6 cursor-pointer transition-colors duration-200 hover:bg-gray-50 rounded-xl"
        onClick={toggleExpand}
      >
        {/* Step Indicator with Status */}
        <div className="flex flex-col items-center mr-4">
          <div className="relative">
            <div className={`w-12 h-12 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
              isPast ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/25' :
              isToday ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25' :
              'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25'
            }`}>
              {isPast ? '✓' : stepNumber}
            </div>
            {/* Status dot */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 ${status.indicatorColor} border-2 border-white rounded-full`}></div>
          </div>
          {!isLast && (
            <div className={`w-1 h-12 mt-2 rounded-full ${
              isPast ? 'bg-gradient-to-b from-green-400 to-green-200' :
              'bg-gradient-to-b from-gray-400 to-gray-200'
            }`}></div>
          )}
        </div>

        {/* Step Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-semibold text-gray-900">Treatment Plan</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                <span className="mr-1">{status.icon}</span>
                {status.text}
              </span>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {recordDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
              {isToday && ' • Today'}
            </span>
          </div>
          
          <p className="text-gray-600 mb-3">
            {getTreatmentSummary(record)}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {record.treatment?.medications?.length > 0 && (
                <span className="flex items-center">
                  💊 {record.treatment.medications.length} medication(s)
                </span>
              )}
              {Array.isArray(record.treatment?.procedures) && record.treatment.procedures.length > 0 && (
                <span className="flex items-center">
                  🔬 {record.treatment.procedures.length} procedure(s)
                </span>
              )}
              {isPast && (
                <span className="flex items-center text-green-600 font-medium">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Completed
                </span>
              )}
            </div>
            <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="px-6 pb-6 ml-16 border-t border-gray-100 pt-6 space-y-6">
          {/* Status Banner */}
          {isPast && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Treatment Completed</h4>
                  <p className="text-green-700 text-sm">This treatment plan has been successfully completed on {recordDate.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {isToday && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">Active Treatment</h4>
                  <p className="text-blue-700 text-sm">Follow this treatment plan as prescribed by your doctor</p>
                </div>
              </div>
            </div>
          )}

          {isFuture && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">Upcoming Treatment</h4>
                  <p className="text-purple-700 text-sm">This treatment plan is scheduled for the future</p>
                </div>
              </div>
            </div>
          )}

          {/* Medications Section */}
          {record.treatment?.medications?.length > 0 && (
            <TreatmentSection 
              icon="💊"
              title="Medications"
              type="medications"
              items={record.treatment.medications}
              isPast={isPast}
            />
          )}

          {/* Procedures Section */}
          {Array.isArray(record.treatment?.procedures) && record.treatment.procedures.length > 0 && (
            <TreatmentSection 
              icon="🔬"
              title="Procedures"
              type="procedures" 
              items={record.treatment.procedures}
              isPast={isPast}
            />
          )}

          {/* Recommendations Section */}
          {Array.isArray(record.treatment?.recommendations) && record.treatment.recommendations.length > 0 && (
            <TreatmentSection 
              icon="📋"
              title="Recommendations"
              type="recommendations"
              items={record.treatment.recommendations}
              isPast={isPast}
            />
          )}

          {/* Doctor Notes */}
          {record.doctorNotes && (
            <div className={`rounded-r-lg p-4 border-l-4 ${
              isPast ? 'bg-green-50 border-green-400' :
              isToday ? 'bg-blue-50 border-blue-400' :
              'bg-purple-50 border-purple-400'
            }`}>
              <div className="flex items-start">
                <span className="text-lg mr-3">👨‍⚕️</span>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Doctor's Notes</h4>
                  <p className="text-gray-700 leading-relaxed">{record.doctorNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Completion Status */}
          {isPast && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Treatment successfully completed</span>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Follow-up
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((med, i) => (
              <div key={i} className={`rounded-lg p-4 border transition-colors duration-200 ${
                isPast 
                  ? 'bg-green-50 border-green-200 hover:border-green-300' 
                  : 'bg-gray-50 border-gray-200 hover:border-blue-300'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-900 text-lg">{med.name}</span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    isPast 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {med.dosage}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {med.frequency}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {med.duration}
                  </span>
                </div>
                {med.instructions && (
                  <div className="text-sm text-gray-600 border-t border-gray-200 pt-2">
                    <strong>Instructions:</strong> {med.instructions}
                  </div>
                )}
                {isPast && (
                  <div className="flex items-center mt-2 text-green-600 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
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
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start">
                {isPast ? (
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <span className="text-blue-500 mr-3 mt-1">•</span>
                )}
                <span className={`${isPast ? 'text-green-800' : 'text-gray-700'}`}>{item}</span>
              </li>
            ))}
          </ul>
        )
      
      default:
        return null
    }
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">{icon}</span>
        <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        {isPast && (
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Completed
          </span>
        )}
      </div>
      {renderItems()}
    </div>
  )
}

const LoadingState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your treatment records</h3>
      <p className="text-gray-500">Please wait while we fetch your medical information</p>
    </div>
  </div>
)

const ErrorState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load treatment records</h3>
      <p className="text-gray-500 mb-4">There was an error fetching your medical information</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  </div>
)

const EmptyState = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">💊</span>
      </div>
      <h3 className="text-2xl font-medium text-gray-900 mb-3">No treatment records found</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        Your treatment plans will appear here once prescribed by your doctor. 
        Check back after your next medical appointment.
      </p>
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
  
  return parts.join(' • ') || 'Treatment plan details available'
}

export default PatientTreatmentRecords