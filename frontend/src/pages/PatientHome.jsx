import React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
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
  Plus,
  Users,
  HeartPulse,
  LineChart,
  ShieldCheck
} from 'lucide-react'
import { appointmentsAPI, doctorsAPI, healthCardsAPI } from '../services/api'

const PatientHome = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

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
    <div className="p-6 bg-gray-50">
      <WelcomeBanner navigate={navigate} />
      <ActionCards navigate={navigate} />
      <DashboardCards 
        todayAppointments={todayAppointments.length}
        upcomingAppointments={upcomingAppointments.length}
        doctorsCount={doctors.length}
        healthCard={healthCard}
      />
      <QuickActionsSection navigate={navigate} />
      <EmergencyContactSection />
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <AppointmentsSection 
          todayAppointments={todayAppointments}
          getStatusColor={getStatusColor}
          navigate={navigate}
        />
        <HealthCardSection healthCard={healthCard} navigate={navigate} />
      </div>
      <footer className="mt-8 text-center text-gray-500 text-xs py-4">
        <p>© 2023 MediCare Hospital Management System. All rights reserved.</p>
      </footer>
    </div>
  )
}

// Component Functions

const WelcomeBanner = ({ navigate }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
      <div className="flex flex-col md:flex-row">
        {/* Left content area */}
        <div className="p-6 md:p-8 flex-1">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <Activity size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Healthcare Dashboard
            </h1>
          </div>
          <p className="text-gray-600 mb-6 max-w-lg">
            Monitor your health metrics, manage appointments, and access medical
            services all in one secure platform.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <HealthMetric
              icon={<HeartPulse size={18} className="text-rose-500" />}
              label="Heart Rate"
              value="72 bpm"
              status="normal"
            />
            <HealthMetric
              icon={<LineChart size={18} className="text-blue-500" />}
              label="Blood Pressure"
              value="120/80"
              status="normal"
            />
            <HealthMetric
              icon={<ShieldCheck size={18} className="text-green-500" />}
              label="Health Status"
              value="Good"
              status="normal"
            />
          </div>
          <div className="flex space-x-3 mt-2">
            <button 
              onClick={() => navigate('/medical-records')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              View Health Report
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              Update Metrics
            </button>
          </div>
        </div>
        {/* Right visualization area */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-full md:w-1/3 p-6 flex items-center justify-center relative">
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M0,50 Q25,0 50,50 T100,50"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <path
                d="M0,60 Q25,10 50,60 T100,60"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <path
                d="M0,70 Q25,20 50,70 T100,70"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                <HeartPulse size={40} className="text-white" />
              </div>
            </div>
            <p className="text-blue-800 font-medium text-center">
              Your health metrics are within normal range
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const HealthMetric = ({ icon, label, value, status }) => {
  const statusColors = {
    normal: 'text-green-600',
    warning: 'text-amber-600',
    alert: 'text-red-600',
  }
  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex items-center mb-1">
        {icon}
        <span className="text-xs text-gray-500 ml-1.5">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-800">{value}</span>
        <span className={`text-xs font-medium ${statusColors[status]}`}>
          {status === 'normal'
            ? 'Normal'
            : status === 'warning'
              ? 'Warning'
              : 'Alert'}
        </span>
      </div>
    </div>
  )
}

const ActionCards = ({ navigate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <ActionCard
        message="You're all set! Enjoy your day."
        buttonText="Book Appointment"
        buttonIcon={<Calendar size={16} />}
        bgColor="bg-blue-50"
        onClick={() => navigate('/book-appointment')}
      />
      <ActionCard
        message="Contact the hospital to issue your digital health card."
        buttonText="Request Health Card"
        buttonIcon={<CreditCard size={16} />}
        bgColor="bg-green-50"
        onClick={() => navigate('/health-cards')}
      />
    </div>
  )
}

const ActionCard = ({ message, buttonText, buttonIcon, bgColor, onClick }) => {
  return (
    <div className={`${bgColor} rounded-xl p-6 shadow-sm`}>
      <p className="text-gray-700 mb-4">{message}</p>
      <div className="flex justify-center">
        <button 
          onClick={onClick}
          className="flex items-center bg-white border border-gray-200 text-gray-800 rounded-lg py-2 px-4 text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
        >
          <span className="mr-2">{buttonIcon}</span>
          {buttonText}
        </button>
      </div>
    </div>
  )
}

const DashboardCards = ({ todayAppointments, upcomingAppointments, doctorsCount, healthCard }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <StatCard
        icon={<Calendar size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
        label="Today's Appointments"
        value={todayAppointments.toString()}
        subLabel="Scheduled"
        accentColor="border-blue-500"
      />
      <StatCard
        icon={<Clock size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-green-400 to-green-600"
        label="Upcoming Appointments"
        value={upcomingAppointments.toString()}
        subLabel="Next 7 days"
        accentColor="border-green-500"
      />
      <StatCard
        icon={<UserCheck size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        label="Available Doctors"
        value={doctorsCount.toString()}
        subLabel="Specialists"
        accentColor="border-purple-500"
      />
      <StatCard
        icon={<Shield size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-orange-400 to-orange-600"
        label="Health Card"
        value={healthCard ? 'Active' : 'Not Issued'}
        subLabel={healthCard ? 'Valid' : 'Pending'}
        valueClass="text-base"
        accentColor="border-orange-500"
      />
    </div>
  )
}

const StatCard = ({ icon, iconBg, label, value, subLabel, valueClass = 'text-3xl', accentColor }) => {
  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-md border-l-4 ${accentColor} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className={`font-bold ${valueClass} mt-1 text-gray-800`}>
            {value}
          </p>
          <p className="text-gray-400 text-xs mt-1">{subLabel}</p>
        </div>
        <div
          className={`${iconBg} w-12 h-12 rounded-lg flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

const AppointmentsSection = ({ todayAppointments, getStatusColor, navigate }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-80 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <Calendar className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">
              Today's Appointments
            </h2>
            <p className="text-xs text-gray-500">
              Your scheduled appointments for today
            </p>
          </div>
        </div>
        <span className="text-sm bg-blue-50 text-blue-700 py-1 px-3 rounded-full font-medium">
          {todayAppointments.length} scheduled
        </span>
      </div>
      <div className="flex flex-col items-center justify-center h-48 bg-blue-50/50 rounded-lg">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-md">
          <Calendar className="text-white" size={32} />
        </div>
        <p className="font-medium text-gray-800 mb-1">No appointments today</p>
        <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">
          You're all set! Enjoy your day or schedule a new appointment.
        </p>
        <button 
          onClick={() => navigate('/book-appointment')}
          className="flex items-center bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus size={16} className="mr-2" />
          Book Appointment
        </button>
      </div>
    </div>
  )
}

const HealthCardSection = ({ healthCard, navigate }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 h-80 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-lg mr-3">
            <CreditCard className="text-green-600" size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-lg text-gray-800">
              Digital Health Card
            </h2>
            <p className="text-xs text-gray-500">
              Your electronic health identification
            </p>
          </div>
        </div>
        <span className="text-sm bg-orange-50 text-orange-700 py-1 px-3 rounded-full font-medium">
          {healthCard ? 'Active' : 'Not issued'}
        </span>
      </div>
      <div className="flex flex-col items-center justify-center h-48 bg-green-50/50 rounded-lg">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-md">
          <CreditCard className="text-white" size={32} />
        </div>
        <p className="font-medium text-gray-800 mb-1">No Health Card</p>
        <p className="text-gray-500 text-sm mb-4 text-center max-w-xs">
          Get quick access to medical services with your digital health card.
        </p>
        <button 
          onClick={() => navigate('/health-cards')}
          className="flex items-center bg-green-600 text-white rounded-lg px-4 py-2.5 text-sm hover:bg-green-700 transition-colors shadow-md"
        >
          <Plus size={16} className="mr-2" />
          Request Health Card
        </button>
      </div>
    </div>
  )
}

const QuickActionsSection = ({ navigate }) => {
  return (
    <div className="mt-8">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
        <p className="text-gray-500 text-sm">
          Access your most important features
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          icon={<Calendar size={24} className="text-white" />}
          title="Book Appointment"
          description="Schedule with a doctor"
          bgColor="bg-blue-500"
          onClick={() => navigate('/book-appointment')}
        />
        <QuickActionCard
          icon={<Users size={24} className="text-white" />}
          title="Find Doctors"
          description="Browse specialists"
          bgColor="bg-green-500"
          onClick={() => navigate('/doctors')}
        />
        <QuickActionCard
          icon={<FileText size={24} className="text-white" />}
          title="Medical Records"
          description="View your records"
          bgColor="bg-purple-500"
          onClick={() => navigate('/medical-records')}
        />
        <QuickActionCard
          icon={<Phone size={24} className="text-white" />}
          title="Emergency"
          description="Contact hospital"
          bgColor="bg-orange-500"
          onClick={() => window.open('tel:+1-800-HELP', '_self')}
        />
      </div>
    </div>
  )
}

const QuickActionCard = ({ icon, title, description, bgColor, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center cursor-pointer"
    >
      <div
        className={`${bgColor} w-14 h-14 rounded-lg flex items-center justify-center mb-4`}
      >
        {icon}
      </div>
      <h3 className="font-medium text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  )
}

const EmergencyContactSection = () => {
  return (
    <div className="bg-red-50 rounded-xl p-6 shadow-sm mt-8 border border-red-100">
      <div className="flex items-start mb-4">
        <div className="bg-red-500 p-3 rounded-xl mr-4">
          <AlertCircle size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-700">Emergency Contact</h3>
          <p className="text-red-600">
            In case of medical emergency, please contact the hospital
            immediately.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded-lg flex items-center">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            <Phone size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Emergency Hotline
            </p>
            <p className="text-red-600 font-bold">+1-800-HELP</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg flex items-center">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            <Mail size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-red-600">emergency@hospital.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientHome
