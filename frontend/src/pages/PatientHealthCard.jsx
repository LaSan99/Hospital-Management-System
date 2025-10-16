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
  Save
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
        // Don't show error if card doesn't exist
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
        toast.success('Health card request submitted successfully')
        setShowRequestModal(false)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit request')
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'blocked':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRequestStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Health Card</h1>
        <p className="text-gray-600">View your digital health card and request a new one</p>
      </div>

      {/* Health Card Display */}
      {healthCard ? (
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-xl p-8 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Health Card</h2>
              <p className="text-blue-100">Digital Medical ID</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              healthCard.status === 'active' ? 'bg-green-500' : 
              healthCard.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'
            }`}>
              {healthCard.status.toUpperCase()}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-blue-100 text-sm">Card Number</p>
              <p className="text-2xl font-mono font-bold">{healthCard.cardNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Patient Name</p>
                <p className="font-medium">{healthCard.patientName}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Blood Type</p>
                <p className="font-medium">{healthCard.bloodType || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Issue Date</p>
                <p className="font-medium">{formatDate(healthCard.issueDate)}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Expiry Date</p>
                <p className="font-medium">{formatDate(healthCard.expiryDate)}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Card</h3>
            <p className="text-gray-500 mb-4">
              You don't have a health card yet. Request one to get started.
            </p>
            {!request || request.status === 'rejected' ? (
              <button onClick={() => setShowRequestModal(true)} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Request Health Card
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Health Card Details */}
      {healthCard && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Card Details</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Email:</strong> {healthCard.patientEmail}</p>
                <p className="text-sm"><strong>Phone:</strong> {healthCard.patientPhone || 'N/A'}</p>
              </div>
            </div>

            {healthCard.allergies && healthCard.allergies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {healthCard.allergies.map((allergy, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {healthCard.emergencyContact && healthCard.emergencyContact.name && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><strong>Name:</strong> {healthCard.emergencyContact.name}</p>
                  <p className="text-sm"><strong>Phone:</strong> {healthCard.emergencyContact.phone}</p>
                  <p className="text-sm"><strong>Relationship:</strong> {healthCard.emergencyContact.relationship}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Status */}
      {request && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Status</h2>
          
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
              request.status === 'pending' ? 'bg-yellow-100' :
              request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {request.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
              {request.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {request.status === 'rejected' && <X className="h-5 w-5 text-red-600" />}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900">Health Card Request</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                Submitted on {formatDate(request.createdAt)}
              </p>

              {request.status === 'pending' && (
                <p className="text-sm text-gray-600">
                  Your request is being reviewed by the admin. You will be notified once it's processed.
                </p>
              )}

              {request.status === 'approved' && (
                <p className="text-sm text-green-600">
                  Your request has been approved! Your health card has been issued.
                </p>
              )}

              {request.status === 'rejected' && (
                <div>
                  <p className="text-sm text-red-600 mb-2">
                    Your request was rejected.
                  </p>
                  {request.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        <strong>Reason:</strong> {request.rejectionReason}
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowRequestModal(true)} 
                    className="btn btn-primary btn-sm mt-3"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Submit New Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Request Health Card Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Request Health Card</h2>
              <button onClick={() => { setShowRequestModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Blood Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => handleInputChange(null, 'bloodType', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select blood type...</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies (comma-separated)</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange(null, 'allergies', e.target.value)}
                  placeholder="Penicillin, Peanuts, Latex"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank if you have no known allergies</p>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Emergency Contact</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.emergencyContact.name}
                    onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                    placeholder="Contact Name"
                    className="form-input"
                  />
                  <input
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                    placeholder="Contact Phone"
                    className="form-input"
                  />
                  <input
                    type="text"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                    placeholder="Relationship (e.g., Spouse, Parent)"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Request Review</p>
                    <p className="text-sm text-blue-700">
                      Your request will be reviewed by an administrator. You'll be notified once it's approved or rejected.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowRequestModal(false); resetForm(); }} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={createRequestMutation.isLoading} className="btn btn-primary">
                  {createRequestMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
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
