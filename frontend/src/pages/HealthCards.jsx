import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  QrCode, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Save, 
  Clock, 
  Check, 
  XCircle,
  Activity,
  TrendingUp,
  Users,
  UserCheck,
  LineChart,
  HeartPulse,
  Shield,
  Eye,
  Edit
} from 'lucide-react'
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
  const [showCardDetailsModal, setShowCardDetailsModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
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

  // Block/Unblock card mutation
  const toggleCardStatusMutation = useMutation(
    ({ cardId, status }) => {
      if (status === 'blocked') {
        return healthCardsAPI.block(cardId, 'Blocked by admin')
      } else {
        return healthCardsAPI.unblock(cardId)
      }
    },
    {
      onMutate: async ({ cardId, status }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries('health-cards')
        
        // Snapshot the previous value
        const previousCards = queryClient.getQueryData('health-cards')
        
        // Optimistically update the cache
        queryClient.setQueryData('health-cards', (old) => {
          if (!old) return old
          
          const updateCard = (cards) => {
            return cards.map(card => 
              card._id === cardId 
                ? { ...card, status }
                : card
            )
          }
          
          // Handle different response structures
          if (old.data?.data?.healthCards) {
            return {
              ...old,
              data: {
                ...old.data,
                data: {
                  ...old.data.data,
                  healthCards: updateCard(old.data.data.healthCards)
                }
              }
            }
          } else if (old.data?.healthCards) {
            return {
              ...old,
              data: {
                ...old.data,
                healthCards: updateCard(old.data.healthCards)
              }
            }
          }
          
          return old
        })
        
        // Update selected card if it's the one being modified
        if (selectedCard && selectedCard._id === cardId) {
          setSelectedCard(prev => ({
            ...prev,
            status
          }))
        }
        
        return { previousCards }
      },
      onSuccess: async (response, variables) => {
        console.log('Health card status update successful:', response.data)
        const action = variables.status === 'blocked' ? 'blocked' : 'unblocked'
        toast.success(`Health card ${action} successfully`)
        
        // Force a refetch to ensure we have the latest data from server
        await queryClient.invalidateQueries('health-cards')
        
        // Also refetch the data immediately
        await queryClient.refetchQueries('health-cards')
      },
      onError: (error, variables, context) => {
        console.error('Health card status update failed:', error)
        
        // Revert the optimistic update on error
        if (context?.previousCards) {
          queryClient.setQueryData('health-cards', context.previousCards)
        }
        
        // Revert selected card status
        if (selectedCard && selectedCard._id === variables.cardId) {
          setSelectedCard(prev => ({
            ...prev,
            status: prev.status === 'blocked' ? 'active' : 'blocked'
          }))
        }
        
        toast.error(error.response?.data?.message || 'Failed to update card status')
      },
      onSettled: () => {
        // Always refetch after error or success to ensure consistency
        queryClient.invalidateQueries('health-cards')
        
        // Also refetch the specific card if we have it selected
        if (selectedCard) {
          queryClient.invalidateQueries(['health-cards', selectedCard._id])
        }
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

  const handleViewCardDetails = (card) => {
    setSelectedCard(card)
    setShowCardDetailsModal(true)
  }

  const handleToggleCardStatus = (card) => {
    const newStatus = card.status === 'blocked' ? 'active' : 'blocked'
    const action = newStatus === 'blocked' ? 'block' : 'unblock'
    const patientName = card.patientName || 'this patient'
    
    if (window.confirm(`Are you sure you want to ${action} the health card for ${patientName}?`)) {
      toggleCardStatusMutation.mutate({ cardId: card._id, status: newStatus })
    }
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

  // Enhanced UI Components
  const WelcomeBanner = ({ healthCards = [], requests = [] }) => {
    const activeCards = healthCards.filter(c => c.status === 'active').length
    const expiredCards = healthCards.filter(c => c.status === 'expired').length
    const pendingRequests = requests.filter(r => r.status === 'pending').length

    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Left content area */}
          <div className="p-8 lg:p-10 flex-1">
            <div className="flex items-center mb-6">
              <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
                <CreditCard size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Health Cards System
                </h1>
                <p className="text-blue-100 text-lg">
                  Digital health card management and patient identification
                </p>
              </div>
            </div>
            
            <p className="text-blue-100/90 mb-8 max-w-2xl text-lg leading-relaxed">
              Manage digital health cards, process patient requests, and maintain 
              comprehensive health identification system with our secure, professional health card platform.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <HealthMetric
                icon={<CreditCard size={20} className="text-blue-400" />}
                label="Total Cards"
                value={healthCards.length}
                status="normal"
              />
              <HealthMetric
                icon={<CheckCircle size={20} className="text-green-400" />}
                label="Active Cards"
                value={activeCards}
                status="normal"
              />
              <HealthMetric
                icon={<Clock size={20} className="text-yellow-400" />}
                label="Pending Requests"
                value={pendingRequests}
                status="normal"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => {
                  try {
                    console.log('Navigating to health card reports')
                    // navigate('/health-card-reports') // Uncomment when route is available
                  } catch (error) {
                    console.error('Error navigating to health card reports:', error)
                  }
                }}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center"
              >
                <Activity size={18} className="mr-2" />
                View Reports
              </button>
            </div>
          </div>
          
          {/* Right visualization area */}
          <div className="lg:w-96 bg-white/10 backdrop-blur-sm p-8 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white rounded-full"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white rounded-full"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <div className="w-32 h-32 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                  <CreditCard size={48} className="text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <p className="text-white font-semibold text-lg mb-2">System Status</p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-blue-100 font-medium">All Systems Operational</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const HealthMetric = ({ icon, label, value, status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'good': return 'text-green-400'
        case 'warning': return 'text-yellow-400'
        case 'critical': return 'text-red-400'
        default: return 'text-blue-400'
      }
    }

    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-xl bg-white/10 ${getStatusColor()}`}>
            {icon}
          </div>
        </div>
        <div className="text-white">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-blue-100 text-sm font-medium">{label}</p>
        </div>
      </div>
    )
  }

  const EnhancedTabsSection = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-8 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${
              activeTab === 'cards'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Health Cards ({healthCards.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-8 py-4 text-sm font-semibold border-b-2 transition-all duration-300 ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Requests ({pendingRequests.length})
            </div>
          </button>
        </nav>
      </div>
    </div>
  )

  const SearchAndFiltersSection = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search health cards by patient name, card number, or email..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="blocked">Blocked</option>
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl font-semibold text-gray-700 transition-colors flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5 mr-2" />
            Issue Card
          </button>
        </div>
      </div>
    </div>
  )

  const ResultsCountSection = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
        Showing <span className="font-semibold text-gray-900">{filteredCards.length}</span> of{' '}
        <span className="font-semibold text-gray-900">{healthCards.length}</span> health cards
      </div>
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <TrendingUp className="h-4 w-4" />
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  )

  const EnhancedHealthCard = ({ card }) => (
    <div className="relative group cursor-pointer" onClick={() => handleViewCardDetails(card)}>
      {/* Bank Card Style Design */}
      <div className={`relative w-full h-48 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-3xl ${
        card.status === 'active' 
          ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800' 
          : card.status === 'expired' 
          ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
          : 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600'
      }`}>
        
        {/* Card Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-white rounded-full -translate-x-8 -translate-y-8"></div>
        </div>

        {/* Card Content */}
        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
          {/* Top Section */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium opacity-90">HEALTH CARD</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                  card.status === 'active' ? 'bg-green-500/30 text-green-100' :
                  card.status === 'expired' ? 'bg-red-500/30 text-red-100' :
                  'bg-yellow-500/30 text-yellow-100'
                }`}>
                  {card.status.toUpperCase()}
                </span>
                {isExpiringSoon(card.expiryDate) && !isExpired(card.expiryDate) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-orange-500/30 text-orange-100">
                    EXPIRING SOON
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                <QrCode className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Middle Section - Card Number */}
          <div className="text-center">
            <div className="text-2xl font-bold tracking-wider mb-2">
              {card.cardNumber || 'HC-' + card._id.slice(-8).toUpperCase()}
            </div>
            <div className="text-sm opacity-80">Digital Health Card</div>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-end">
            <div>
              <div className="text-xs opacity-70 mb-1">PATIENT NAME</div>
              <div className="text-sm font-semibold truncate max-w-32">
                {card.patientName || 'Unknown Patient'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-70 mb-1">EXPIRES</div>
              <div className="text-sm font-semibold">
                {new Date(card.expiryDate).toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  year: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <span className="text-white font-semibold text-sm">Click to view details</span>
          </div>
        </div>
      </div>

      {/* Card Info Below */}
      <div className="mt-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate">{card.patientName}</h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(card.status)}`}>
            {card.status}
          </span>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-2 text-gray-400" />
            <span>Expires: {formatDate(card.expiryDate)}</span>
          </div>
          {card.bloodType && (
            <div className="flex items-center">
              <HeartPulse className="h-3 w-3 mr-2 text-gray-400" />
              <span>Blood Type: {card.bloodType}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const EmptyStateSection = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <CreditCard className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No health cards found</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {searchTerm || statusFilter 
            ? 'Try adjusting your search criteria to find the health cards you\'re looking for.' 
            : 'No health cards have been issued yet. Get started by issuing your first health card.'
          }
        </p>
        {!searchTerm && !statusFilter && (
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Issue Card
          </button>
        )}
      </div>
    </div>
  )

  const EnhancedRequestsSection = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-2xl mr-4 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Health Card Requests ({requests.length})
              </h2>
              <p className="text-gray-600 mt-1">
                Review and process patient health card requests
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{pendingRequests.length}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-12">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Clock className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Patient health card requests will appear here when they submit applications.
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {requests.map((request) => (
            <EnhancedRequestRow key={request._id} request={request} />
          ))}
        </div>
      )}
    </div>
  )

  const EnhancedRequestRow = ({ request }) => (
    <div className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-6 flex-1">
          <div className={`flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow ${
            request.status === 'pending' ? 'bg-gradient-to-br from-yellow-100 to-orange-100' :
            request.status === 'approved' ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 
            'bg-gradient-to-br from-red-100 to-rose-100'
          }`}>
            {request.status === 'pending' && <Clock className="h-7 w-7 text-yellow-600" />}
            {request.status === 'approved' && <CheckCircle className="h-7 w-7 text-green-600" />}
            {request.status === 'rejected' && <XCircle className="h-7 w-7 text-red-600" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {request.patientName}
              </h3>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getRequestStatusColor(request.status)}`}>
                {request.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <p><strong>Email:</strong> {request.patientEmail}</p>
                {request.patientPhone && <p><strong>Phone:</strong> {request.patientPhone}</p>}
                {request.bloodType && <p><strong>Blood Type:</strong> {request.bloodType}</p>}
                <p><strong>Requested:</strong> {formatDate(request.createdAt)}</p>
              </div>
              
              {request.allergies && request.allergies.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Allergies:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.allergies.map((allergy, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {request.emergencyContact && request.emergencyContact.name && (
                <div className="md:col-span-2 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-700 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    Emergency Contact:
                  </p>
                  <p className="font-medium">{request.emergencyContact.name} - {request.emergencyContact.phone}</p>
                  <p className="text-sm">{request.emergencyContact.relationship}</p>
                </div>
              )}
              
              {request.status === 'rejected' && request.rejectionReason && (
                <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="font-semibold text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-red-700">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {request.status === 'pending' && (
          <div className="flex space-x-3 ml-6">
            <button
              onClick={() => handleApprove(request)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={approveRequestMutation.isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </button>
            <button
              onClick={() => handleReject(request._id)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              disabled={rejectRequestMutation.isLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <WelcomeBanner healthCards={healthCards} requests={requests} />
          <EnhancedTabsSection />
          <SearchAndFiltersSection />
          
          {activeTab === 'cards' ? (
            <>
              <ResultsCountSection />
              {filteredCards.length === 0 ? (
                <EmptyStateSection />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCards.map((card) => (
                    <EnhancedHealthCard key={card._id} card={card} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EnhancedRequestsSection />
          )}

          {/* Approve Request Modal */}
          {showApproveModal && selectedRequest && (
            <div className="fixed inset-0 backdrop-blur-md bg-white/10 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Approve Health Card Request</h2>
                  <button onClick={() => { setShowApproveModal(false); setSelectedRequest(null); setExpiryDate(''); }} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleApproveSubmit} className="p-6 space-y-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Approving request for <strong>{selectedRequest.patientName}</strong>
                    </p>
                    
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Card Expiry Date *
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Typically set to 1-5 years from today
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button 
                      type="button" 
                      onClick={() => { setShowApproveModal(false); setSelectedRequest(null); setExpiryDate(''); }} 
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={approveRequestMutation.isLoading} 
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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

          {/* Card Details Modal */}
          {showCardDetailsModal && selectedCard && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
                {/* Enhanced Header */}
                <div className={`px-8 py-6 text-white relative overflow-hidden ${
                  selectedCard.status === 'active' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700' 
                    : selectedCard.status === 'expired' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                }`}>
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
                  </div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
                        <CreditCard className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Health Card Details</h2>
                        <p className="text-white/80 mt-1">Complete information and management</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setShowCardDetailsModal(false); setSelectedCard(null); }} 
                      className="text-white/80 hover:text-white p-3 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
                  <div className="p-8 space-y-8">
                    {/* Card Preview Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-gray-600 p-2 rounded-xl mr-3">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Card Preview</h3>
                      </div>
                      
                      {/* Bank Card Style Preview */}
                      <div className={`relative w-full h-48 rounded-2xl shadow-2xl overflow-hidden ${
                        selectedCard.status === 'active' 
                          ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800' 
                          : selectedCard.status === 'expired' 
                          ? 'bg-gradient-to-br from-red-500 via-red-600 to-red-700'
                          : 'bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600'
                      }`}>
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-12 -translate-x-12"></div>
                        </div>
                        <div className="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                  <CreditCard className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium opacity-90">HEALTH CARD</span>
                              </div>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                                selectedCard.status === 'active' ? 'bg-green-500/30 text-green-100' :
                                selectedCard.status === 'expired' ? 'bg-red-500/30 text-red-100' :
                                'bg-yellow-500/30 text-yellow-100'
                              }`}>
                                {selectedCard.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                              <QrCode className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold tracking-wider mb-2">
                              {selectedCard.cardNumber || 'HC-' + selectedCard._id.slice(-8).toUpperCase()}
                            </div>
                            <div className="text-sm opacity-80">Digital Health Card</div>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-xs opacity-70 mb-1">PATIENT NAME</div>
                              <div className="text-sm font-semibold">
                                {selectedCard.patientName || 'Unknown Patient'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs opacity-70 mb-1">EXPIRES</div>
                              <div className="text-sm font-semibold">
                                {new Date(selectedCard.expiryDate).toLocaleDateString('en-US', { 
                                  month: '2-digit', 
                                  year: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patient detaile Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-600 p-2 rounded-xl mr-3">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Patient Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="font-semibold text-gray-900">{selectedCard.patientName}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-900">{selectedCard.patientEmail || 'Not provided'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Card Number</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="font-mono font-semibold text-gray-900">
                              {selectedCard.cardNumber || 'HC-' + selectedCard._id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedCard.status)}`}>
                              {selectedCard.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Medical Information Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-600 p-2 rounded-xl mr-3">
                          <HeartPulse className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Medical Information</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Blood Type</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-900">{selectedCard.bloodType || 'Not specified'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Date</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-900">{formatDate(selectedCard.issueDate)}</p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-900">{formatDate(selectedCard.expiryDate)}</p>
                            {isExpiringSoon(selectedCard.expiryDate) && !isExpired(selectedCard.expiryDate) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 mt-2">
                                Expiring Soon
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Days Until Expiry</label>
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-900">
                              {isExpired(selectedCard.expiryDate) 
                                ? 'Expired' 
                                : Math.ceil((new Date(selectedCard.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) + ' days'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Allergies Section */}
                    {selectedCard.allergies && selectedCard.allergies.length > 0 && (
                      <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
                        <div className="flex items-center mb-4">
                          <div className="bg-red-600 p-2 rounded-xl mr-3">
                            <AlertTriangle className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Known Allergies</h3>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex flex-wrap gap-2">
                            {selectedCard.allergies.map((allergy, index) => (
                              <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Emergency Contacts  */}
                    {selectedCard.emergencyContact && selectedCard.emergencyContact.name && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center mb-4">
                          <div className="bg-purple-600 p-2 rounded-xl mr-3">
                            <Shield className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Emergency Contact</h3>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Name</label>
                              <p className="text-gray-900">{selectedCard.emergencyContact.name}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                              <p className="text-gray-900">{selectedCard.emergencyContact.phone}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Relationship</label>
                              <p className="text-gray-900">{selectedCard.emergencyContact.relationship}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button 
                        onClick={() => { setShowCardDetailsModal(false); setSelectedCard(null); }} 
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                      >
                        Close
                      </button>
                      <button 
                        onClick={() => handleToggleCardStatus(selectedCard)}
                        disabled={toggleCardStatusMutation.isLoading || selectedCard.status === 'expired'}
                        className={`px-6 py-3 rounded-xl font-semibold transition-colors flex items-center ${
                          selectedCard.status === 'blocked'
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : selectedCard.status === 'expired'
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {toggleCardStatusMutation.isLoading ? (
                          <>
                            <LoadingSpinner />
                            <span className="ml-2">Processing...</span>
                          </>
                        ) : (
                          <>
                            {selectedCard.status === 'blocked' ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Unblock Card
                              </>
                            ) : selectedCard.status === 'expired' ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cannot Block Expired Card
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Block Card
                              </>
                            )}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Health Card Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
                {/* Enhanced Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white rounded-full"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full"></div>
                  </div>
                  <div className="relative z-10 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
                        <CreditCard className="h-8 w-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Issue Health Card</h2>
                        <p className="text-blue-100 mt-1">Create a new digital health card for patient</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setShowCreateModal(false); resetForm(); }} 
                      className="text-white/80 hover:text-white p-3 rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
                  <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Patient Selection Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-600 p-2 rounded-xl mr-3">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Patient Information</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Select Patient *
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <select
                            value={formData.patientId}
                            onChange={(e) => handleInputChange(null, 'patientId', e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 text-gray-900 font-medium"
                          >
                            <option value="">Choose a patient from the list...</option>
                            {patients.map(patient => (
                              <option key={patient._id} value={patient._id}>
                                {patient.firstName} {patient.lastName} - {patient.email}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-sm text-gray-500 mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Only registered patients can receive health cards
                        </p>
                      </div>
                    </div>

                    {/* Card Details Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-600 p-2 rounded-xl mr-3">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Card Details</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Expiry Date */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Card Expiry Date *
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="date"
                              value={formData.expiryDate}
                              onChange={(e) => handleInputChange(null, 'expiryDate', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-gray-900 font-medium"
                            />
                          </div>
                          <p className="text-sm text-gray-500 mt-2 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Recommended: 1-5 years from today
                          </p>
                        </div>

                        {/* Blood Type */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Blood Type
                          </label>
                          <div className="relative">
                            <HeartPulse className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                              value={formData.bloodType}
                              onChange={(e) => handleInputChange(null, 'bloodType', e.target.value)}
                              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-gray-900 font-medium"
                            >
                              <option value="">Select blood type...</option>
                              <option value="A+">A+ (A Positive)</option>
                              <option value="A-">A- (A Negative)</option>
                              <option value="B+">B+ (B Positive)</option>
                              <option value="B-">B- (B Negative)</option>
                              <option value="AB+">AB+ (AB Positive)</option>
                              <option value="AB-">AB- (AB Negative)</option>
                              <option value="O+">O+ (O Positive)</option>
                              <option value="O-">O- (O Negative)</option>
                            </select>
                          </div>
                          <p className="text-sm text-gray-500 mt-2 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Important for emergency situations
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Medical Information Section */}
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-red-600 p-2 rounded-xl mr-3">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Medical Information</h3>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Known Allergies
                        </label>
                        <div className="relative">
                          <AlertTriangle className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                          <textarea
                            value={formData.allergies}
                            onChange={(e) => handleInputChange(null, 'allergies', e.target.value)}
                            placeholder="Enter allergies separated by commas (e.g., Penicillin, Peanuts, Latex, Shellfish)"
                            rows={3}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 text-gray-900 font-medium resize-none"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Separate multiple allergies with commas
                        </p>
                      </div>
                    </div>

                    {/* Emergency Contact Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-purple-600 p-2 rounded-xl mr-3">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Emergency Contact</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Contact Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={formData.emergencyContact.name}
                              onChange={(e) => handleInputChange('emergencyContact', 'name', e.target.value)}
                              placeholder="Full name"
                              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-gray-900 font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Phone Number
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">📞</span>
                            <input
                              type="tel"
                              value={formData.emergencyContact.phone}
                              onChange={(e) => handleInputChange('emergencyContact', 'phone', e.target.value)}
                              placeholder="+1 (555) 123-4567"
                              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-gray-900 font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Relationship
                          </label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={formData.emergencyContact.relationship}
                              onChange={(e) => handleInputChange('emergencyContact', 'relationship', e.target.value)}
                              placeholder="e.g., Spouse, Parent, Sibling"
                              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-gray-900 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3 flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        This contact will be notified in case of medical emergencies
                      </p>
                    </div>

                    {/* Preview Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-gray-600 p-2 rounded-xl mr-3">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Card Preview</h3>
                      </div>
                      <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                              <CreditCard className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">Health Card #HC-{formData.patientId ? formData.patientId.slice(-6).toUpperCase() : 'XXXXXX'}</p>
                              <p className="text-sm text-gray-500">Digital Health Card</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Expires</p>
                            <p className="font-semibold text-gray-900">{formData.expiryDate || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Patient</p>
                            <p className="font-semibold text-gray-900">
                              {formData.patientId ? 
                                patients.find(p => p._id === formData.patientId)?.firstName + ' ' + 
                                patients.find(p => p._id === formData.patientId)?.lastName : 
                                'Not selected'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Blood Type</p>
                            <p className="font-semibold text-gray-900">{formData.bloodType || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <button 
                        type="button" 
                        onClick={() => { setShowCreateModal(false); resetForm(); }} 
                        className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300 flex items-center border-2 border-gray-200 hover:border-gray-300"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={createCardMutation.isLoading} 
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {createCardMutation.isLoading ? (
                          <>
                            <LoadingSpinner />
                            <span className="ml-2">Issuing Card...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5 mr-2" />
                            Issue Health Card
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HealthCards
