import React from 'react'
import { useQuery } from 'react-query'
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
  Star
} from 'lucide-react'
import { appointmentsAPI, doctorsAPI, healthCardsAPI } from '../services/api'

const PatientHome = () => {
  const { user } = useAuth()

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

  const { data: healthCardData, error: healthCardError } = useQuery(
    'patient-health-card',
    () => healthCardsAPI.getByPatient(user?._id),
    { 
      enabled: !!user?._id,
      retry: false,
      onError: (error) => {
        // Don't show error for 404 - just means no health card exists yet
        if (error.response?.status !== 404) {
          console.error('Health card fetch error:', error)
        }
      }
    }
  )

  console.log('Health Card Data:', healthCardData)
  console.log('Health Card Error:', healthCardError)
  console.log('User ID:', user?._id)

  const appointments = appointmentsData?.data?.appointments || []
  const doctors = doctorsData?.data?.doctors || []
  const healthCard = healthCardData?.data?.data?.healthCard || 
                     healthCardData?.data?.healthCard
  
  console.log('Parsed Health Card:', healthCard)

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
    .slice(0, 5)

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'badge-info'
      case 'confirmed':
        return 'badge-success'
      case 'completed':
        return 'badge-success'
      case 'cancelled':
        return 'badge-danger'
      default:
        return 'badge-warning'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 shadow-2xl mb-8">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative px-8 py-12 sm:px-12 sm:py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                      Welcome back, {user?.firstName}! 👋
                    </h1>
                    <p className="text-blue-100 text-lg sm:text-xl">
                      Your health dashboard is ready
                    </p>
                  </div>
                </div>
                <p className="text-blue-100/90 text-base sm:text-lg max-w-2xl leading-relaxed">
                  Stay on top of your appointments, health information, and medical records all in one place.
                </p>
              </div>
              <div className="hidden lg:block lg:ml-8">
                <div className="h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-bounce-gentle">
                  <Heart className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/5"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5"></div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Today's Appointments</p>
                    <p className="text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Scheduled</div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Upcoming</p>
                    <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Next 7 days</div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                    <UserCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Available Doctors</p>
                    <p className="text-3xl font-bold text-gray-900">{doctors.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Specialists</div>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Health Card</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {healthCard ? 'Active' : 'Not Issued'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {healthCard ? 'Valid' : 'Pending'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Today's Appointments */}
          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10"></div>
            <div className="relative">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <div className="p-2 rounded-lg bg-blue-100 mr-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    Today's Appointments
                  </h2>
                  <div className="text-sm text-gray-500">
                    {todayAppointments.length} scheduled
                  </div>
                </div>
              </div>
              <div className="p-6">
                {todayAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {todayAppointments.map((appointment) => (
                      <div key={appointment._id} className="group/item relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 p-5 border border-gray-200/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex items-center justify-center">
                                <UserCheck className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-semibold text-gray-900 mb-1">
                                Dr. {appointment.doctorName}
                              </p>
                              <p className="text-sm text-gray-600 mb-1">
                                {appointment.startTime} - {appointment.endTime}
                              </p>
                              <p className="text-sm text-gray-500">
                                {appointment.appointmentType} • {appointment.reason}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`badge ${getStatusColor(appointment.status)}`}>
                              {getStatusIcon(appointment.status)}
                              <span className="ml-1 capitalize">{appointment.status}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments today</h3>
                    <p className="text-gray-500 mb-4">You're all set! Enjoy your day.</p>
                    <button 
                      onClick={() => window.location.href = '/doctors'}
                      className="btn btn-primary btn-sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Health Card Status */}
          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10"></div>
            <div className="relative">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <div className="p-2 rounded-lg bg-green-100 mr-3">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    Digital Health Card
                  </h2>
                  <div className="text-sm text-gray-500">
                    {healthCard ? 'Active' : 'Not issued'}
                  </div>
                </div>
              </div>
              <div className="p-6">
                {healthCard ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl border border-green-200/50">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Card Number</p>
                        <p className="text-lg font-mono font-semibold text-gray-900">{healthCard.cardNumber}</p>
                      </div>
                      <span className={`badge ${healthCard.status === 'active' && new Date(healthCard.expiryDate) > new Date() ? 'badge-success' : 'badge-danger'}`}>
                        {healthCard.status === 'active' && new Date(healthCard.expiryDate) > new Date() ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Blood Type</p>
                        <p className="text-base font-semibold text-gray-900">{healthCard.bloodType || 'Not specified'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Expires</p>
                        <p className="text-base font-semibold text-gray-900">
                          {new Date(healthCard.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Allergies */}
                    {healthCard.allergies && healthCard.allergies.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <p className="text-sm font-medium text-red-700 mb-2">⚠️ Allergies</p>
                        <div className="flex flex-wrap gap-2">
                          {healthCard.allergies.map((allergy, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Emergency Contact */}
                    {healthCard.emergencyContact && healthCard.emergencyContact.name && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-sm font-medium text-blue-700 mb-2">Emergency Contact</p>
                        <div className="space-y-1">
                          <p className="text-sm text-blue-900"><strong>{healthCard.emergencyContact.name}</strong></p>
                          <p className="text-sm text-blue-800">{healthCard.emergencyContact.phone}</p>
                          <p className="text-xs text-blue-600">{healthCard.emergencyContact.relationship}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button className="btn btn-primary w-full">
                        <CreditCard className="h-4 w-4 mr-2" />
                        View Full Health Card
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
                      <CreditCard className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Card</h3>
                    <p className="text-gray-500 mb-6">Contact the hospital to issue your digital health card.</p>
                    <button className="btn btn-primary">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Request Health Card
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10"></div>
            <div className="relative">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <div className="p-2 rounded-lg bg-green-100 mr-3">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    Upcoming Appointments
                  </h2>
                  <div className="text-sm text-gray-500">
                    {upcomingAppointments.length} scheduled
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment._id} className="px-6 py-5 hover:bg-gray-50/50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg flex items-center justify-center">
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900 mb-1">
                            Dr. {appointment.doctorName}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.appointmentType} • {appointment.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`badge ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1 capitalize">{appointment.status}</span>
                        </span>
                        <button className="btn btn-outline btn-sm">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-medium transition-all duration-300 mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10"></div>
          <div className="relative p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
              <p className="text-gray-600">Access your most important features</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <button 
                onClick={() => window.location.href = '/doctors'}
                className="group/action relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 rounded-2xl hover:from-blue-100 hover:to-blue-200/50 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg mb-4 group-hover/action:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Book Appointment</p>
                  <p className="text-sm text-gray-600">Schedule with a doctor</p>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/doctors'}
                className="group/action relative overflow-hidden p-6 bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50 rounded-2xl hover:from-green-100 hover:to-green-200/50 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg mb-4 group-hover/action:scale-110 transition-transform duration-300">
                    <UserCheck className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Find Doctors</p>
                  <p className="text-sm text-gray-600">Browse specialists</p>
                </div>
              </button>
              
              <button className="group/action relative overflow-hidden p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50 rounded-2xl hover:from-purple-100 hover:to-purple-200/50 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg mb-4 group-hover/action:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Medical Records</p>
                  <p className="text-sm text-gray-600">View your records</p>
                </div>
              </button>
              
              <button className="group/action relative overflow-hidden p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200/50 rounded-2xl hover:from-orange-100 hover:to-orange-200/50 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg mb-4 group-hover/action:scale-110 transition-transform duration-300">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Emergency</p>
                  <p className="text-sm text-gray-600">Contact hospital</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50 shadow-soft hover:shadow-medium transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10"></div>
          <div className="relative p-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-red-900 mb-3">Emergency Contact</h3>
                <p className="text-red-700 text-lg mb-6 leading-relaxed">
                  In case of medical emergency, please contact the hospital immediately.
                </p>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center p-4 bg-white/50 rounded-xl border border-red-200/50">
                    <Phone className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                      <p className="text-red-900 font-semibold text-lg">Emergency Hotline</p>
                      <p className="text-red-800 font-mono text-xl">+1-800-HELP</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-white/50 rounded-xl border border-red-200/50">
                    <Mail className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                      <p className="text-red-900 font-semibold text-lg">Email</p>
                      <p className="text-red-800 text-lg">emergency@hospital.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientHome
