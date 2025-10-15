import React from 'react'
import { useQuery } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { appointmentsAPI, patientsAPI, doctorsAPI, medicalRecordsAPI, healthCardsAPI } from '../services/api'

const Dashboard = () => {
  const { user, isAdmin, isDoctor, isStaff, isPatient } = useAuth()

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

  console.log('Dashboard Data:')
  console.log('Appointments:', appointmentsData)
  console.log('Patients:', patientsData)
  console.log('Doctors:', doctorsData)
  console.log('Medical Records:', medicalRecordsData)
  console.log('Health Cards:', healthCardsData)

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

  console.log('Parsed Counts:')
  console.log('Appointments:', appointments.length)
  console.log('Patients:', patients.length)
  console.log('Doctors:', doctors.length)
  console.log('Medical Records:', medicalRecords.length)
  console.log('Health Cards:', healthCards.length)

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
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    ...(isAdmin || isStaff ? [{
      name: 'Total Patients',
      value: patients.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }] : []),
    ...(isAdmin || isStaff ? [{
      name: 'Total Doctors',
      value: doctors.length,
      icon: UserCheck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }] : []),
    ...(isAdmin || isStaff || isDoctor ? [{
      name: 'Medical Records',
      value: medicalRecords.length,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }] : []),
    ...(isAdmin || isStaff ? [{
      name: 'Health Cards',
      value: healthCards.length,
      icon: CreditCard,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    }] : [])
  ]

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening in your {user?.role} dashboard today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Today's Appointments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {todayAppointments.map((appointment) => (
              <div key={appointment._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isPatient 
                          ? `Dr. ${appointment.doctorName}`
                          : `${appointment.patientName}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.startTime} - {appointment.endTime}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.appointmentType} • {appointment.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                    {appointment.checkedIn && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <div key={appointment._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {isPatient 
                          ? `Dr. ${appointment.doctorName}`
                          : `${appointment.patientName}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.appointmentType} • {appointment.reason}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Calendar className="h-6 w-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900">Book Appointment</p>
            <p className="text-sm text-gray-500">Schedule a new appointment</p>
          </button>
          
          {isPatient && (
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <CreditCard className="h-6 w-6 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">View Health Card</p>
              <p className="text-sm text-gray-500">Check your digital health card</p>
            </button>
          )}
          
          {(isAdmin || isStaff || isDoctor) && (
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <FileText className="h-6 w-6 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">Medical Records</p>
              <p className="text-sm text-gray-500">View patient records</p>
            </button>
          )}
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <UserCheck className="h-6 w-6 text-orange-600 mb-2" />
            <p className="font-medium text-gray-900">Find Doctors</p>
            <p className="text-sm text-gray-500">Browse available doctors</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
