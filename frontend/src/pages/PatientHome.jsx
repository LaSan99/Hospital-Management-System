import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Calendar, 
  UserCheck, 
  CreditCard, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Shield,
  Star,
  ChevronRight,
  ChevronLeft,
  Plus,
  Download,
  Share2,
  ArrowRight,
  Play,
  Award,
  Users,
  TrendingUp,
  ShieldCheck,
  Eye,
  Edit,
  MoreVertical,
  Bell,
  Search,
  Filter,
  BarChart3,
  Stethoscope,
  Pill,
  Microscope,
  Trash2
} from 'lucide-react'
import { appointmentsAPI, doctorsAPI, healthCardsAPI } from '../services/api'
import toast from 'react-hot-toast'

const PatientHome = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // Image slides data
  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2050&q=80",
      title: "World-Class Healthcare",
      subtitle: "Experience excellence in medical care with our state-of-the-art facilities",
      cta: "Book Appointment",
      badge: "24/7 Emergency Care"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2032&q=80",
      title: "Advanced Technology",
      subtitle: "Cutting-edge medical technology for accurate diagnosis and treatment",
      cta: "Our Services",
      badge: "AI-Powered Diagnostics"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1551076805-e1869033e561?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2032&q=80",
      title: "Expert Medical Team",
      subtitle: "Board-certified specialists dedicated to your health and wellbeing",
      cta: "Meet Our Doctors",
      badge: "200+ Specialists"
    }
  ]

  // Auto slide rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  // Fetch patient data
  const { data: appointmentsData } = useQuery(
    'patient-appointments',
    () => appointmentsAPI.getAll(),
    { enabled: true }
  )

  const { data: doctorsData } = useQuery(
    'doctors',
    () => doctorsAPI.getAll(),
    { enabled: true }
  )

  const { data: healthCardData } = useQuery(
    'patient-health-card',
    () => healthCardsAPI.getByPatient(user?._id),
    { 
      enabled: !!user?._id,
      retry: false
    }
  )

  const { data: requestData } = useQuery(
    'my-health-card-request',
    () => healthCardsAPI.getMyRequest(),
    {
      enabled: !!user,
      retry: 1
    }
  )

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation(
    (appointmentId) => appointmentsAPI.delete(appointmentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patient-appointments')
        toast.success('Appointment deleted successfully')
        setDeleteConfirmId(null)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete appointment')
        setDeleteConfirmId(null)
      }
    }
  )

  const appointments = appointmentsData?.data?.appointments || []
  const doctors = doctorsData?.data?.doctors || []
  const healthCard = healthCardData?.data?.data?.healthCard || 
                     healthCardData?.data?.healthCard
  const request = requestData?.data?.data?.request || requestData?.data?.request

  // Filter patient's appointments
  const patientAppointments = appointments.filter(apt => 
    apt.patientId._id === user?._id
  )


  // Get today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = patientAppointments.filter(apt => 
    apt.appointmentDate.split('T')[0] === today
  )

  // Get upcoming appointments (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingAppointments = patientAppointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate)
    return aptDate > new Date() && aptDate <= nextWeek
  })

  // Get recent appointments (last 5)
  const recentAppointments = patientAppointments
    .filter(apt => new Date(apt.appointmentDate) < new Date())
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
    .slice(0, 3)

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-3 w-3" />
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'cancelled':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const handleDeleteAppointment = (appointmentId) => {
    setDeleteConfirmId(appointmentId)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteAppointmentMutation.mutate(deleteConfirmId)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  // Medical departments data
  const departments = [
    { name: 'Cardiology', icon: Heart, color: 'red', doctors: 12 },
    { name: 'Neurology', icon: Activity, color: 'purple', doctors: 8 },
    { name: 'Orthopedics', icon: Users, color: 'blue', doctors: 15 },
    { name: 'Pediatrics', icon: Stethoscope, color: 'green', doctors: 10 }
  ]

  // Health metrics data
  const healthMetrics = [
    { name: 'Blood Pressure', value: '120/80', status: 'normal', trend: 'stable' },
    { name: 'Heart Rate', value: '72 bpm', status: 'normal', trend: 'stable' },
    { name: 'Blood Sugar', value: '98 mg/dL', status: 'normal', trend: 'improving' },
    { name: 'Cholesterol', value: '180 mg/dL', status: 'borderline', trend: 'monitoring' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      

      {/* Hero Slider */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
            
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="text-white max-w-2xl">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-sm font-medium mb-6">
                  {slide.badge}
                </span>
                <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-xl lg:text-2xl mb-8 text-gray-200 leading-relaxed">
                  {slide.subtitle}
                </p>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      if (slide.cta === 'Book Appointment') {
                        navigate('/book-appointment')
                      } else if (slide.cta === 'Our Services') {
                        navigate('/doctors')
                      } else if (slide.cta === 'Meet Our Doctors') {
                        navigate('/doctors')
                      }
                    }}
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors flex items-center"
                  >
                    {slide.cta}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </button>
                  <button className="border border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-colors flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Watch Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slider Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Hospital Stats */}
      <div className="bg-white py-16 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">200+</div>
              <div className="text-gray-600">Expert Doctors</div>
            </div>
            <div className="text-center">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">50K+</div>
              <div className="text-gray-600">Patients Treated</div>
            </div>
            <div className="text-center">
              <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">25+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">99%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome and Quick Stats */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, <span className="text-blue-600"> {user?.firstName}!</span>
              </h1>
              <p className="text-gray-600">
                Here's your medical dashboard overview for today
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search records..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{todayAppointments.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>On schedule</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming This Week</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{upcomingAppointments.length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Next 7 days
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Doctors</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{doctors.length}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Specialists online
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Health Card</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {healthCard ? 'Active' : 'Not Issued'}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Shield className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {healthCard ? 'Valid' : 'Contact admin'}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Appointments & Health Metrics */}
          <div className="xl:col-span-2 space-y-8">
            {/* Today's Appointments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                  <button 
                    onClick={() => navigate('/appointments')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Dr. {appointment.doctorName}</h3>
                            <p className="text-sm text-gray-600">
                              {appointment.startTime} - {appointment.endTime}
                            </p>
                            <p className="text-sm text-gray-500">{appointment.appointmentType}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-1 capitalize">{appointment.status}</span>
                          </span>
                          {appointment.status === 'cancelled' && (
                            <button 
                              onClick={() => handleDeleteAppointment(appointment._id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Delete appointment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
                    <p className="text-gray-500 mb-4">You're all caught up!</p>
                    <button 
                      onClick={() => navigate('/book-appointment')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Health Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Health Metrics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {healthMetrics.map((metric, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          metric.status === 'normal' ? 'bg-green-100 text-green-800' :
                          metric.status === 'borderline' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {metric.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                        <div className={`flex items-center text-sm ${
                          metric.trend === 'improving' ? 'text-green-600' :
                          metric.trend === 'stable' ? 'text-blue-600' :
                          'text-yellow-600'
                        }`}>
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {metric.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Health Card & Quick Actions */}
          <div className="space-y-8">
            {/* Health Card Status */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Health Card</h2>
              </div>
              <div className="p-6">
                {healthCard ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-5 text-white">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-blue-100 text-sm">Card Number</p>
                          <p className="text-xl font-mono font-bold">{healthCard.cardNumber}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          healthCard.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {healthCard.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <p className="text-blue-100">Blood Type</p>
                          <p className="font-semibold">{healthCard.bloodType || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-blue-100">Expires</p>
                          <p className="font-semibold">
                            {new Date(healthCard.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button 
                        onClick={() => navigate('/health-cards')}
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200 flex items-center justify-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </button>
                      <button 
                        onClick={() => navigate('/health-cards')}
                        className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Card</h3>
                    {request ? (
                      <div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {request.status === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                          Request {request.status}
                        </div>
                        <p className="text-gray-500 mb-4 text-sm">
                          {request.status === 'pending' && 'Your request is being reviewed by admin.'}
                          {request.status === 'approved' && 'Your health card has been issued!'}
                          {request.status === 'rejected' && 'Your request was rejected. You can submit a new one.'}
                        </p>
                        <button 
                          onClick={() => navigate('/health-cards')}
                          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 w-full"
                        >
                          {request.status === 'rejected' ? 'Request Again' : 'View Status'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-500 mb-4 text-sm">
                          Request your digital health card to access medical services.
                        </p>
                        <button 
                          onClick={() => navigate('/health-cards')}
                          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 w-full flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Request Health Card
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Medical Departments */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Medical Departments</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${dept.color}-50`}>
                          <dept.icon className={`h-5 w-5 text-${dept.color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dept.name}</p>
                          <p className="text-sm text-gray-500">{dept.doctors} doctors</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => navigate('/book-appointment')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Calendar className="h-5 w-5 mr-3" />
                    Book New Appointment
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => navigate('/doctors')}
                      className="bg-gray-50 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Find Doctors
                    </button>
                    <button 
                      onClick={() => navigate('/appointments')}
                      className="bg-gray-50 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      My Appointments
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => navigate('/medical-records')}
                      className="bg-gray-50 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Medical Records
                    </button>
                    <button 
                      onClick={() => navigate('/health-cards')}
                      className="bg-gray-50 text-gray-700 p-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Health Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Recent Activity */}
        
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Appointment</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete this cancelled appointment? 
              This action cannot be undone and the appointment will be removed from your records.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteAppointmentMutation.isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center"
              >
                {deleteAppointmentMutation.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientHome