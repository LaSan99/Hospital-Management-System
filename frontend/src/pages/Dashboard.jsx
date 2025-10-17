import React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Plus,
  Mail,
  MapPin,
  Heart,
  Shield,
  Star,
  TrendingUp,
  Eye,
  ChevronRight
} from 'lucide-react'
import { appointmentsAPI, patientsAPI, doctorsAPI, medicalRecordsAPI, healthCardsAPI } from '../services/api'

const Dashboard = () => {
  const { user, isAdmin, isDoctor, isStaff, isPatient } = useAuth()
  const navigate = useNavigate()

  // Fetch data based on user role
  const { data: appointmentsData } = useQuery(
    'appointments',
    () => appointmentsAPI.getAll(),
    { enabled: true }
  )

  const { data: patientsData } = useQuery(
    'patients',
    () => patientsAPI.getAll(),
    { enabled: isAdmin || isStaff }
  )

  const { data: doctorsData } = useQuery(
    'doctors',
    () => doctorsAPI.getAll(),
    { enabled: true }
  )

  const { data: medicalRecordsData } = useQuery(
    'medical-records',
    () => medicalRecordsAPI.getAll(),
    { enabled: isAdmin || isStaff || isDoctor }
  )

  const { data: healthCardsData } = useQuery(
    'health-cards',
    () => healthCardsAPI.getAll(),
    { enabled: isAdmin || isStaff }
  )

  const appointments = appointmentsData?.data?.data?.appointments || 
                       appointmentsData?.data?.appointments || 
                       []
  const patients = patientsData?.data?.data?.patients || 
                   patientsData?.data?.patients || 
                   []
  const doctors = doctorsData?.data?.data?.doctors || 
                  doctorsData?.data?.doctors || 
                  []
  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || 
                         []
  const healthCards = healthCardsData?.data?.data?.healthCards || 
                      healthCardsData?.data?.healthCards || 
                      []

  // Filter appointments based on user role
  const userAppointments = isPatient 
    ? appointments.filter(apt => apt.patientId._id === user._id)
    : isDoctor
    ? appointments.filter(apt => apt.doctorId._id === user._id)
    : appointments

  // Get today's appointments
  const today = new Date().toISOString().split('T')[0]
  const todayAppointments = userAppointments.filter(apt => 
    apt.appointmentDate.split('T')[0] === today
  )

  // Get upcoming appointments (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const upcomingAppointments = userAppointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate)
    return aptDate > new Date() && aptDate <= nextWeek
  })

  const stats = [
    {
      name: 'Today\'s Appointments',
      value: todayAppointments.length,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      trend: '+12%',
      description: 'From yesterday'
    },
    {
      name: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      trend: '+5%',
      description: 'This week'
    },
    ...(isAdmin || isStaff ? [{
      name: 'Total Patients',
      value: patients.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      trend: '+8%',
      description: 'This month'
    }] : []),
    ...(isAdmin || isStaff ? [{
      name: 'Total Doctors',
      value: doctors.length,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      trend: '+3%',
      description: 'This month'
    }] : []),
    ...(isAdmin || isStaff || isDoctor ? [{
      name: 'Medical Records',
      value: medicalRecords.length,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-500',
      trend: '+15%',
      description: 'This month'
    }] : []),
    ...(isAdmin || isStaff ? [{
      name: 'Health Cards',
      value: healthCards.length,
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-500',
      trend: '+6%',
      description: 'Active cards'
    }] : [])
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <WelcomeBanner user={user} navigate={navigate} />
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              <p className="text-gray-600 mt-1">Welcome to your healthcare management dashboard</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Last updated: Just now</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <DashboardCards stats={stats} />
        </div>


        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TodayAppointmentsSection 
            todayAppointments={todayAppointments}
            getStatusColor={getStatusColor}
            isPatient={isPatient}
            navigate={navigate}
          />
          <UpcomingAppointmentsSection 
            upcomingAppointments={upcomingAppointments}
            getStatusColor={getStatusColor}
            isPatient={isPatient}
            navigate={navigate}
          />
        </div>

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

// Enhanced Welcome Banner
const WelcomeBanner = ({ user, navigate }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left content area */}
        <div className="p-8 lg:p-10 flex-1">
          <div className="flex items-center mb-6">
            <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, {user?.firstName}!
        </h1>
              <p className="text-blue-100 text-lg">
                Here's what's happening in your {user?.role} dashboard
              </p>
            </div>
          </div>
          
          <p className="text-blue-100/90 mb-8 max-w-2xl text-lg leading-relaxed">
            Monitor system metrics, manage appointments, and access administrative 
            services all in one secure, professional platform designed for healthcare excellence.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <HealthMetric
              icon={<HeartPulse size={20} className="text-rose-400" />}
              label="System Health"
              value="Excellent"
              status="normal"
            />
            <HealthMetric
              icon={<LineChart size={20} className="text-blue-400" />}
              label="Performance"
              value="98.5%"
              status="normal"
            />
            <HealthMetric
              icon={<ShieldCheck size={20} className="text-green-400" />}
              label="Security Status"
              value="Secure"
              status="normal"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                try {
                  console.log('Navigating to profile')
                  navigate('/profile')
                } catch (error) {
                  console.error('Error navigating to profile:', error)
                }
              }}
              className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center"
            >
              System Settings
              <Eye size={18} className="ml-2" />
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
                <Activity size={48} className="text-blue-600" />
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
  const statusColors = {
    normal: 'text-green-400',
    warning: 'text-amber-400',
    alert: 'text-red-400',
  }
  
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
      <div className="flex items-center mb-2">
        <div className="bg-white/20 p-2 rounded-lg mr-3">
          {icon}
        </div>
        <span className="text-blue-100 text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white text-xl font-bold">{value}</span>
        <span className={`text-xs font-semibold ${statusColors[status]} bg-white/20 px-2 py-1 rounded-full`}>
          {status === 'normal' ? 'Normal' : status === 'warning' ? 'Warning' : 'Alert'}
        </span>
      </div>
    </div>
  )
}

// Enhanced Dashboard Cards
const DashboardCards = ({ stats }) => {
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
          <div
            key={stat.name}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <p className="text-gray-600 text-sm font-medium mb-1">{stat.name}</p>
                <p className="font-bold text-3xl text-gray-900 mb-1">
                  {stat.value}
                </p>
              <div className="flex items-center">
                  <TrendingUp size={14} className="text-green-500 mr-1" />
                  <span className="text-green-600 text-sm font-medium mr-2">{stat.trend}</span>
                  <span className="text-gray-500 text-xs">{stat.description}</span>
                </div>
              </div>
              <div
                className={`${stat.bgColor} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${stat.bgColor} h-2 rounded-full transition-all duration-1000`}
                  style={{ width: `${Math.min(100, (stat.value / 50) * 100)}%` }}
                ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
  )
}

// Enhanced Today's Appointments Section
const TodayAppointmentsSection = ({ todayAppointments, getStatusColor, isPatient, navigate }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 p-3 rounded-xl mr-4">
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">
              Today's Appointments
            </h2>
            <p className="text-gray-500 text-sm">
              Scheduled appointments for today
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-blue-50 text-blue-700 py-2 px-4 rounded-full font-semibold text-sm">
            {todayAppointments.length} scheduled
          </span>
          <button 
            onClick={() => {
              try {
                console.log('Navigating to appointments from today header')
                navigate('/appointments')
              } catch (error) {
                console.error('Error navigating to appointments:', error)
              }
            }}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
          >
            <Eye size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {todayAppointments.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {todayAppointments.map((appointment) => (
            <div key={appointment._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-300 group hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                    <p className="font-semibold text-gray-900">
                        {isPatient 
                          ? `Dr. ${appointment.doctorName}`
                          : `${appointment.patientName}`
                        }
                      </p>
                    <p className="text-gray-600 text-sm">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                    <p className="text-gray-500 text-xs mt-1">
                      {appointment.department || 'General Consultation'}
                      </p>
                    </div>
                  </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.checkedIn && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-blue-50/50 rounded-xl">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Calendar className="text-white" size={32} />
          </div>
          <p className="font-semibold text-gray-800 mb-2 text-lg">No appointments today</p>
          <p className="text-gray-500 mb-6 text-center max-w-sm">
            All clear! No scheduled appointments for today. Enjoy your day!
          </p>
          <button 
            onClick={() => {
              try {
                console.log('Navigating to appointments from today section')
                navigate('/appointments')
              } catch (error) {
                console.error('Error navigating to appointments:', error)
              }
            }}
            className="flex items-center bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={18} className="mr-2" />
            View All Appointments
          </button>
        </div>
      )}
    </div>
  )
}

// Enhanced Upcoming Appointments Section
const UpcomingAppointmentsSection = ({ upcomingAppointments, getStatusColor, isPatient, navigate }) => {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-3 rounded-xl mr-4">
            <Clock className="text-green-600" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-xl text-gray-900">
              Upcoming Appointments
            </h2>
            <p className="text-gray-500 text-sm">
              Next 7 days appointments
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-green-50 text-green-700 py-2 px-4 rounded-full font-semibold text-sm">
            {upcomingAppointments.length} upcoming
          </span>
          <button 
            onClick={() => {
              try {
                console.log('Navigating to appointments from upcoming header')
                navigate('/appointments')
              } catch (error) {
                console.error('Error navigating to appointments:', error)
              }
            }}
            className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
          >
            <Eye size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
      
      {upcomingAppointments.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {upcomingAppointments.slice(0, 6).map((appointment) => (
            <div key={appointment._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-all duration-300 group hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                    <p className="font-semibold text-gray-900">
                        {isPatient 
                          ? `Dr. ${appointment.doctorName}`
                          : `${appointment.patientName}`
                        }
                      </p>
                    <p className="text-gray-600 text-sm">
                      {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })} at {appointment.startTime}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Room {appointment.roomNumber || 'TBD'}
                      </p>
                    </div>
                  </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                </div>
                </div>
              </div>
            ))}
          </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-green-50/50 rounded-xl">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Clock className="text-white" size={32} />
          </div>
          <p className="font-semibold text-gray-800 mb-2 text-lg">No upcoming appointments</p>
          <p className="text-gray-500 mb-6 text-center max-w-sm">
            No appointments scheduled for the next 7 days. Stay prepared for new schedules!
          </p>
          <button 
            onClick={() => {
              try {
                console.log('Navigating to book appointment from upcoming section')
                navigate('/book-appointment')
              } catch (error) {
                console.error('Error navigating to book appointment:', error)
              }
            }}
            className="flex items-center bg-green-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus size={18} className="mr-2" />
            Schedule New Appointment
          </button>
        </div>
      )}
    </div>
  )
}


export default Dashboard