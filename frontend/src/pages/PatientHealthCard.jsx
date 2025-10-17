import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  User, 
  Phone, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  X,
  Save,
  Shield,
  Heart,
  Zap,
  MapPin
} from 'lucide-react'
import { healthCardsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const PatientHealthCard = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [formData, setFormData] = useState({
    bloodType: '',
    allergies: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  // Fetch patient's health card
  const { data: healthCardData, isLoading: loadingCard } = useQuery(
    ['health-card', user?._id],
    () => healthCardsAPI.getByPatient(user?._id),
    {
      enabled: !!user?._id,
      retry: 1,
      onError: (error) => {
        if (error.response?.status !== 404) {
          console.error('Error fetching health card:', error)
        }
      }
    }
  )

  // Fetch patient's health card request
  const { data: requestData, isLoading: loadingRequest } = useQuery(
    'my-health-card-request',
    () => healthCardsAPI.getMyRequest(),
    {
      enabled: !!user,
      retry: 1
    }
  )

  // Create health card request mutation
  const createRequestMutation = useMutation(
    (requestData) => healthCardsAPI.createRequest(requestData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-health-card-request')
        toast.success('Health card request submitted successfully!', {
          icon: '✅',
          style: {
            background: '#10B981',
            color: 'white',
          }
        })
        setShowRequestModal(false)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit request', {
          icon: '❌',
        })
      }
    }
  )

  const healthCard = healthCardData?.data?.data?.healthCard || healthCardData?.data?.healthCard
  const request = requestData?.data?.data?.request || requestData?.data?.request

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />
      case 'expired':
        return <X className="h-4 w-4" />
      case 'blocked':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getRequestStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <X className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const resetForm = () => {
    setFormData({
      bloodType: '',
      allergies: '',
      emergencyContact: { name: '', phone: '', relationship: '' }
    })
  }

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(a => a) : []
    }

    createRequestMutation.mutate(submitData)
  }

  if (loadingCard || loadingRequest) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-2">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-br from-blue-600 to-blue-800 bg-clip-text text-transparent">
          My Health Card
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Your digital medical identity card for quick access to essential health information
        </p>
      </div>

      {/* Health Card Display - Enhanced Design */}
      {healthCard ? (
        <div className="max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl shadow-2xl p-8 text-white transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-blue-200" />
                  <h2 className="text-3xl font-bold">Health Card</h2>
                </div>
                <p className="text-blue-100 text-lg">Digital Medical ID</p>
              </div>
              <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                healthCard.status === 'active' ? 'bg-green-500/20 text-green-100 border border-green-400/30' : 
                healthCard.status === 'expired' ? 'bg-red-500/20 text-red-100 border border-red-400/30' : 
                'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
              }`}>
                {getStatusIcon(healthCard.status)}
                <span>{healthCard.status.toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                <p className="text-blue-100 text-sm font-medium mb-2">Card Number</p>
                <p className="text-4xl font-mono font-bold tracking-wider bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  {healthCard.cardNumber}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Patient Name</p>
                      <p className="font-semibold text-lg">{healthCard.patientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Blood Type</p>
                      <p className="font-semibold text-lg">{healthCard.bloodType || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Issue Date</p>
                      <p className="font-semibold text-lg">{formatDate(healthCard.issueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-blue-200" />
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Expiry Date</p>
                      <p className="font-semibold text-lg">{formatDate(healthCard.expiryDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health Card Details - Enhanced */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Contact Information</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Email</span>
                  <span className="text-gray-900 font-semibold">{healthCard.patientEmail}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600 font-medium">Phone</span>
                  <span className="text-gray-900 font-semibold">{healthCard.patientPhone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Medical Information</h3>
              </div>
              
              <div className="space-y-4">
                {healthCard.allergies && healthCard.allergies.length > 0 ? (
                  <div>
                    <p className="text-gray-600 font-medium mb-3">Allergies</p>
                    <div className="flex flex-wrap gap-2">
                      {healthCard.allergies.map((allergy, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1.5" />
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No allergies recorded</p>
                )}

                {healthCard.emergencyContact && healthCard.emergencyContact.name && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-gray-600 font-medium mb-3">Emergency Contact</p>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{healthCard.emergencyContact.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{healthCard.emergencyContact.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="capitalize">{healthCard.emergencyContact.relationship}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Card State - Enhanced */
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Health Card Found</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              You don't have an active health card. Request one to access your digital medical identity and emergency information.
            </p>
            {!request || request.status === 'rejected' ? (
              <button 
                onClick={() => setShowRequestModal(true)} 
                className="btn btn-primary btn-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Request Health Card
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Request Status - Enhanced */}
      {request && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex items-start space-x-6">
              <div className={`flex-shrink-0 h-16 w-16 rounded-2xl flex items-center justify-center ${
                request.status === 'pending' ? 'bg-yellow-100 border border-yellow-200' :
                request.status === 'approved' ? 'bg-green-100 border border-green-200' : 
                'bg-red-100 border border-red-200'
              }`}>
                {getRequestStatusIcon(request.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">Request Status</h3>
                  <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {getRequestStatusIcon(request.status)}
                    <span>{request.status.toUpperCase()}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 text-lg">
                  Submitted on <span className="font-semibold text-gray-900">{formatDate(request.createdAt)}</span>
                </p>

                {request.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-yellow-800 font-medium">
                      Your request is being reviewed by our administration team. You will receive a notification once processed.
                    </p>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-800 font-medium text-lg">
                      🎉 Your request has been approved! Your health card is now active and ready to use.
                    </p>
                  </div>
                )}

                {request.status === 'rejected' && (
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-medium text-lg mb-3">
                        Your request was not approved at this time.
                      </p>
                      {request.rejectionReason && (
                        <div className="bg-white rounded-lg p-3 border border-red-300">
                          <p className="text-red-700">
                            <strong className="font-semibold">Reason:</strong> {request.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowRequestModal(true)} 
                      className="btn btn-primary bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Submit New Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform animate-scale-in">
            <div className="flex justify-between items-center p-8 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Request Health Card</h2>
              </div>
              <button 
                onClick={() => { setShowRequestModal(false); resetForm(); }} 
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Blood Type */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Blood Type</span>
                </label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange(null, 'bloodType', e.target.value)}
                  className="form-select-lg w-full"
                >
                  <option value="">Select your blood type...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Allergies</span>
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange(null, 'allergies', e.target.value)}
                  placeholder="Penicillin, Peanuts, Latex, etc."
                  className="form-input-lg w-full"
                />
                <p className="text-sm text-gray-500 mt-3">
                  Enter known allergies separated by commas. Leave blank if you have no known allergies.
                </p>
              </div>

              {/* Emergency Contact */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-3">
                  <User className="h-5 w-5 text-blue-500" />
                  <span>Emergency Contact</span>
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                    placeholder="Full name of emergency contact"
                    className="form-input-lg w-full"
                  />
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                    placeholder="Phone number with country code"
                    className="form-input-lg w-full"
                  />
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                    placeholder="Relationship (e.g., Spouse, Parent, Sibling)"
                    className="form-input-lg w-full"
                  />
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-semibold text-blue-900 mb-2">Important Information</p>
                    <p className="text-blue-800">
                      Your health card request will be carefully reviewed by our medical administration team. 
                      This process typically takes 1-2 business days. You'll be notified via email once your 
                      request is processed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => { setShowRequestModal(false); resetForm(); }} 
                  className="btn btn-outline btn-lg px-8"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createRequestMutation.isLoading} 
                  className="btn btn-primary btn-lg bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-8 transform hover:scale-105 transition-all duration-200"
                >
                  {createRequestMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-3">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-3" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientHealthCard