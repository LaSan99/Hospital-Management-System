import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
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
  Thermometer
} from 'lucide-react'
import { medicalRecordsAPI } from '../services/api'

const PatientMedicalRecords = () => {
  const { user } = useAuth()
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Medical Records</h1>
          <p className="text-gray-600">View your medical history and records</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search medical records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="form-select w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="consultation">Consultation</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="treatment">Treatment</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </div>
      </div>

      {/* Medical Records List */}
      <div className="space-y-6">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div key={record._id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {record.diagnosis?.mainProblem || 'Medical Record'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Dr. {record.doctorId?.firstName} {record.doctorId?.lastName} • {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${getRecordTypeColor(record.recordType)}`}>
                    {record.recordType.replace('_', ' ')}
                  </span>
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
                    <div className="bg-red-50 rounded-lg p-4">
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
                    <div className="bg-green-50 rounded-lg p-4">
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
                    <div className="bg-purple-50 rounded-lg p-4">
                      {record.labResults.map((lab, index) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{lab.testName}</p>
                            <span className={`badge ${
                              lab.status === 'normal' ? 'badge-success' : 
                              lab.status === 'abnormal' ? 'badge-warning' : 'badge-danger'
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
                    <div className="bg-blue-50 rounded-lg p-4">
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
                    <div className="bg-orange-50 rounded-lg p-4">
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
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{record.doctorNotes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || filterType !== 'all' ? 'No medical records found' : 'No medical records yet'}
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Your medical records will appear here after your appointments'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientMedicalRecords
