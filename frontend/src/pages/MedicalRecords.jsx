import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { FileText, Plus, Search, Filter, User, Calendar, Stethoscope, Pill, Activity } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">Manage patient medical records</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Record
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
                placeholder="Search medical records..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {getTypeOptions().map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredRecords.length} of {medicalRecords.length} medical records
      </div>

      {/* Medical Records List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {typeFilter ? `${typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)} Records` : 'All Medical Records'}
          </h2>
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || typeFilter 
                  ? 'Try adjusting your search criteria' 
                  : 'Get started by creating your first medical record'
                }
              </p>
              {!searchTerm && !typeFilter && (
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Record
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diagnosis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medications</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.patientId?.firstName} {record.patientId?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{record.patientId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Dr. {record.doctorId?.firstName} {record.doctorId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{record.doctorId?.specialization}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {record.recordType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {record.diagnosis?.mainProblem || 'N/A'}
                      </div>
                      {record.diagnosis?.symptoms && record.diagnosis.symptoms.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {record.diagnosis.symptoms.slice(0, 2).join(', ')}
                          {record.diagnosis.symptoms.length > 2 && ` +${record.diagnosis.symptoms.length - 2} more`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.treatment?.medications && record.treatment.medications.length > 0 ? (
                        <div className="text-sm text-gray-900">
                          {record.treatment.medications[0].name}
                          {record.treatment.medications.length > 1 && (
                            <div className="text-xs text-gray-500">
                              +{record.treatment.medications.length - 1} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default MedicalRecords
