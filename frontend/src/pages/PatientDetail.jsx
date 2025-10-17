import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  HeartPulse, 
  FileText, 
  Activity,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { patientsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const PatientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  // Fetch patient data
  const { data: patientData, isLoading, error } = useQuery(
    ['patient', id],
    () => patientsAPI.getById(id),
    {
      enabled: !!id,
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  const patient = patientData?.data?.data?.patient || patientData?.data?.patient

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-xl mr-4">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-800">Error Loading Patient</h3>
                <p className="text-red-600 mt-1">Unable to fetch patient data</p>
              </div>
            </div>
            <p className="text-red-600 mb-6">
              {error.response?.data?.message || 'Failed to load patient details. Please try again.'}
            </p>
            <button 
              onClick={() => navigate('/patients')}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-xl mr-4">
                <AlertCircle className="text-yellow-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-800">Patient Not Found</h3>
                <p className="text-yellow-600 mt-1">The requested patient could not be found</p>
              </div>
            </div>
            <p className="text-yellow-600 mb-6">
              The patient with ID "{id}" does not exist or has been removed from the system.
            </p>
            <button 
              onClick={() => navigate('/patients')}
              className="bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-700 transition-colors"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/patients')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Patients
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-start space-x-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg">
                  <span className="text-blue-600 font-bold text-2xl">
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${
                  patient.isActive ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${patient.isActive ? 'bg-green-100' : 'bg-red-100'}`}></div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {patient.firstName} {patient.lastName}
                    </h1>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        patient.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.isActive ? 'Active Patient' : 'Inactive Patient'}
                      </span>
                      <span className="text-gray-500 text-sm">
                        Patient ID: {patient._id.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <span>Age: {getAge(patient.dateOfBirth)} years</span>
                  </div>
                  {patient.bloodType && (
                    <div className="flex items-center text-gray-600">
                      <HeartPulse className="h-5 w-5 mr-3 text-gray-400" />
                      <span>Blood Type: {patient.bloodType}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-xl mr-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{patient.email}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{patient.phone}</p>
                </div>
              </div>
              
              {patient.address && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {patient.address.street && `${patient.address.street}, `}
                      {patient.address.city}, {patient.address.state}
                      {patient.address.zipCode && ` ${patient.address.zipCode}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-xl mr-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">{formatDate(patient.dateOfBirth)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <User className="h-5 w-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">{patient.gender || 'Not specified'}</p>
                </div>
              </div>
              
              {patient.bloodType && (
                <div className="flex items-center">
                  <HeartPulse className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Blood Type</p>
                    <p className="font-medium text-gray-900">{patient.bloodType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-xl mr-4">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">System Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-semibold text-gray-900">{formatDate(patient.createdAt || patient.dateOfBirth)}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Status</p>
              <p className={`font-semibold ${patient.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {patient.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-semibold text-gray-900">{formatDate(patient.updatedAt || patient.createdAt || patient.dateOfBirth)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm py-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 mb-2">
            <span>© 2024 MediCare Hospital Management System</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>All rights reserved</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>v2.4.1</span>
          </div>
          <p className="text-gray-400">Secure • Reliable • Professional Healthcare Management</p>
        </footer>
      </div>
    </div>
  )
}

export default PatientDetail
