import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { CreditCard, Plus, Search, Filter, QrCode, Calendar, User, AlertTriangle, CheckCircle, X, Save, Clock, Check, XCircle } from 'lucide-react'
import { healthCardsAPI, patientsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const HealthCards = () => {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('cards') // 'cards' or 'requests'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [expiryDate, setExpiryDate] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [formData, setFormData] = useState({
    patientId: '',
    expiryDate: '',
    bloodType: '',
    allergies: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  })

  // Fetch health cards data
  const { data: healthCardsData, isLoading, error } = useQuery(
    'health-cards',
    () => healthCardsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  // Fetch health card requests
  const { data: requestsData, isLoading: loadingRequests } = useQuery(
    'health-card-requests',
    () => healthCardsAPI.getAllRequests(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  // Fetch patients for dropdown
  const { data: patientsData } = useQuery(
    'patients',
    () => patientsAPI.getAll(),
    {
      enabled: showCreateModal
    }
  )

  // Create health card mutation
  const createCardMutation = useMutation(
    (cardData) => healthCardsAPI.create(cardData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('health-cards')
        toast.success('Health card issued successfully')
        setShowCreateModal(false)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to issue health card')
      }
    }
  )

  // Approve request mutation
  const approveRequestMutation = useMutation(
    ({ id, expiryDate }) => healthCardsAPI.approveRequest(id, expiryDate),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('health-card-requests')
        queryClient.invalidateQueries('health-cards')
        toast.success('Health card request approved and card issued')
        setShowApproveModal(false)
        setSelectedRequest(null)
        setExpiryDate('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve request')
      }
    }
  )

  // Reject request mutation
  const rejectRequestMutation = useMutation(
    ({ id, rejectionReason }) => healthCardsAPI.rejectRequest(id, rejectionReason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('health-card-requests')
        toast.success('Health card request rejected')
        setRejectionReason('')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject request')
      }
    }
  )

  const healthCards = healthCardsData?.data?.data?.healthCards || 
                      healthCardsData?.data?.healthCards || 
                      []
  
  const patients = patientsData?.data?.data?.patients || 
                   patientsData?.data?.patients || 
                   []

  const requests = requestsData?.data?.data?.requests || 
                   requestsData?.data?.requests || 
                   []

  const pendingRequests = requests.filter(r => r.status === 'pending')

  // Filter health cards based on search term and status
  const filteredCards = healthCards.filter(card => {
    const matchesSearch = 
      card.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.patientEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || card.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const handleApprove = (request) => {
    setSelectedRequest(request)
    setShowApproveModal(true)
  }

  const handleReject = (requestId) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason) {
      rejectRequestMutation.mutate({ id: requestId, rejectionReason: reason })
    }
  }

  const handleApproveSubmit = (e) => {
    e.preventDefault()
    if (!expiryDate) {
      toast.error('Please select an expiry date')
      return
    }
    approveRequestMutation.mutate({ id: selectedRequest._id, expiryDate })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date()
  }

  const resetForm = () => {
    setFormData({
      patientId: '',
      expiryDate: '',
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
    
    console.log('Form submitted with data:', formData)
    
    if (!formData.patientId || !formData.expiryDate) {
      toast.error('Please select a patient and expiry date')
      return
    }

    const submitData = {
      ...formData,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(a => a) : []
    }

    console.log('Submitting health card data:', submitData)
    createCardMutation.mutate(submitData)
  }

  if (isLoading || loadingRequests) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Health Cards</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load health cards. Please try again.'}
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
          <h1 className="text-2xl font-bold text-gray-900">Health Cards</h1>
          <p className="text-gray-600">Manage digital health cards and requests</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Issue Card
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('cards')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'cards'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Health Cards ({healthCards.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Requests ({pendingRequests.length})
            </button>
          </nav>
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
                placeholder="Search health cards..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="blocked">Blocked</option>
          </select>
          <button className="btn btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'cards' ? (
        <>
          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredCards.length} of {healthCards.length} health cards
          </div>

          {/* Health Cards Grid */}
          {filteredCards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No health cards found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search criteria' 
                : 'No health cards have been issued yet'
              }
            </p>
            {!searchTerm && !statusFilter && (
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Issue Card
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <div key={card._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    card.status === 'active' ? 'bg-green-100' : 
                    card.status === 'expired' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    {getStatusIcon(card.status)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{card.cardNumber}</h3>
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                      {isExpiringSoon(card.expiryDate) && !isExpired(card.expiryDate) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Expiring Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">
                  <QrCode className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{card.patientName}</span>
                </div>
                {card.patientEmail && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">✉️</span>
                    <span className="truncate">{card.patientEmail}</span>
                  </div>
                )}
                {card.bloodType && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🩸</span>
                    <span>Blood Type: {card.bloodType}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Expires: {formatDate(card.expiryDate)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Issued: {formatDate(card.issueDate)}</span>
                </div>
              </div>

              {card.allergies && card.allergies.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Allergies:</p>
                  <div className="flex flex-wrap gap-1">
                    {card.allergies.slice(0, 3).map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        {allergy}
                      </span>
                    ))}
                    {card.allergies.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{card.allergies.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {card.emergencyContact && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Emergency Contact:</p>
                  <p className="text-sm text-gray-600">{card.emergencyContact.name}</p>
                  <p className="text-sm text-gray-600">{card.emergencyContact.phone}</p>
                  <p className="text-sm text-gray-600">{card.emergencyContact.relationship}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <button className="btn btn-outline btn-sm flex-1">
                  View Details
                </button>
                {card.status === 'active' && (
                  <button className="btn btn-outline btn-sm flex-1">
                    Block
                  </button>
                )}
                {card.status === 'blocked' && (
                  <button className="btn btn-primary btn-sm flex-1">
                    Unblock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      ) : (
        /* Requests Tab */
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Health Card Requests ({requests.length})
            </h2>
          </div>
          
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
              <p className="text-gray-500">
                Patient health card requests will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.map((request) => (
                <div key={request._id} className="px-6 py-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        request.status === 'pending' ? 'bg-yellow-100' :
                        request.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {request.status === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                        {request.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {request.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{request.patientName}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Email:</strong> {request.patientEmail}</p>
                          {request.patientPhone && <p><strong>Phone:</strong> {request.patientPhone}</p>}
                          {request.bloodType && <p><strong>Blood Type:</strong> {request.bloodType}</p>}
                          <p><strong>Requested:</strong> {formatDate(request.createdAt)}</p>
                          
                          {request.allergies && request.allergies.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-gray-700 mb-1">Allergies:</p>
                              <div className="flex flex-wrap gap-1">
                                {request.allergies.map((allergy, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {request.emergencyContact && request.emergencyContact.name && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="font-medium text-gray-700">Emergency Contact:</p>
                              <p>{request.emergencyContact.name} - {request.emergencyContact.phone}</p>
                              <p className="text-xs">{request.emergencyContact.relationship}</p>
                            </div>
                          )}
                          
                          {request.status === 'rejected' && request.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="font-medium text-red-800">Rejection Reason:</p>
                              <p className="text-red-700">{request.rejectionReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(request)}
                          className="btn btn-success btn-sm"
                          disabled={approveRequestMutation.isLoading}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request._id)}
                          className="btn btn-danger btn-sm"
                          disabled={rejectRequestMutation.isLoading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approve Request Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Approve Health Card Request</h2>
              <button onClick={() => { setShowApproveModal(false); setSelectedRequest(null); setExpiryDate(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Approving request for <strong>{selectedRequest.patientName}</strong>
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Expiry Date *
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typically set to 1-5 years from today
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => { setShowApproveModal(false); setSelectedRequest(null); setExpiryDate(''); }} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={approveRequestMutation.isLoading} 
                  className="btn btn-success"
                >
                  {approveRequestMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Approving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Issue Card
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Health Card Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Issue Health Card</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Patient Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient *</label>
                <select
                  value={formData.patientId}
                  onChange={(e) => handleInputChange(null, 'patientId', e.target.value)}
                  required
                  className="form-select"
                >
                  <option value="">Select a patient...</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.firstName} {patient.lastName} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange(null, 'expiryDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>

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

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={createCardMutation.isLoading} className="btn btn-primary">
                  {createCardMutation.isLoading ? <><LoadingSpinner /><span className="ml-2">Issuing...</span></> : <><Save className="h-4 w-4 mr-2" />Issue Card</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HealthCards
