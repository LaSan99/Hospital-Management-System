import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Users, Plus, Search, Filter, Phone, Mail, Calendar, MapPin } from 'lucide-react'
import { patientsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch patients data
  const { data: patientsData, isLoading, error } = useQuery(
    'patients',
    () => patientsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  console.log('Patients Data:', patientsData)
  console.log('Patients Error:', error)

  const patients = patientsData?.data?.data?.patients || 
                   patientsData?.data?.patients || 
                   []
  
  console.log('Parsed Patients:', patients)
  console.log('Patients Count:', patients.length)

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Patients</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load patients. Please try again.'}
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
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600">Manage patient accounts and information</p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Patient
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
                placeholder="Search patients..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            All Patients ({filteredPatients.length})
          </h2>
        </div>
        
        {filteredPatients.length === 0 ? (
          <div className="p-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No patients found' : 'No patients found'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first patient'
                }
              </p>
              {!searchTerm && (
                <button className="btn btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <div key={patient._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {getInitials(patient.firstName, patient.lastName)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patient.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {patient.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(patient.dateOfBirth)}
                        </div>
                      </div>
                      {patient.address && (
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {patient.address.city}, {patient.address.state}
                        </div>
                      )}
                      {patient.bloodType && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Blood Type: {patient.bloodType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="btn btn-outline btn-sm">
                      View Details
                    </button>
                    <button className="btn btn-primary btn-sm">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Patients
