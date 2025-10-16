import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  UserCheck, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  MapPin,
  Phone,
  Mail,
  BookOpen,
  Activity,
  HeartPulse,
  Shield,
  Users,
  Calendar,
  Award,
  GraduationCap
} from 'lucide-react'
import { doctorsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

const PatientDoctors = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')

  // Fetch doctors data
  const { data: doctorsData, isLoading, error } = useQuery(
    'doctors',
    () => doctorsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  const doctors = doctorsData?.data?.data?.doctors || doctorsData?.data?.doctors || doctorsData?.data || []

  // Get unique specializations for filter
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))]

  // Filter doctors based on search term and specialization
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization
    
    return matchesSearch && matchesSpecialization
  })

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const formatExperience = (experience) => {
    if (!experience) return 'Experience not specified'
    return `${experience} year${experience > 1 ? 's' : ''} experience`
  }

  const handleBookAppointment = (doctor) => {
    navigate(`/book-appointment?doctorId=${doctor._id}`, {
      state: { doctorId: doctor._id }
    })
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Doctors</h3>
          <p className="text-red-600">
            {error.response?.data?.message || 'Failed to load doctors. Please try again.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50">
      {/* Welcome Banner */}
      <WelcomeBanner />
      
      {/* Stats Cards */}
      <StatsCards 
        totalDoctors={doctors.length}
        filteredDoctors={filteredDoctors.length}
        specializations={specializations.length}
      />
      
      {/* Search and Filters */}
      <SearchSection 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSpecialization={selectedSpecialization}
        setSelectedSpecialization={setSelectedSpecialization}
        specializations={specializations}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-6">
        Showing {filteredDoctors.length} of {doctors.length} doctors
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <NoDoctorsFound searchTerm={searchTerm} selectedSpecialization={selectedSpecialization} />
      ) : (
        <DoctorsGrid 
          filteredDoctors={filteredDoctors}
          getInitials={getInitials}
          formatExperience={formatExperience}
          handleBookAppointment={handleBookAppointment}
        />
      )}
    </div>
  )
}

// Component Functions
const WelcomeBanner = () => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row">
        {/* Left content area */}
        <div className="p-6 md:p-8 flex-1">
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 p-2 rounded-lg mr-3">
              <UserCheck size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Find Your Doctor
            </h1>
          </div>
          <p className="text-gray-600 mb-6 max-w-lg">
            Browse our network of qualified healthcare professionals and book appointments with specialists who match your needs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <HealthMetric
              icon={<Award size={18} className="text-blue-500" />}
              label="Qualified Doctors"
              value="50+"
              status="normal"
            />
            <HealthMetric
              icon={<GraduationCap size={18} className="text-green-500" />}
              label="Specializations"
              value="15+"
              status="normal"
            />
            <HealthMetric
              icon={<Shield size={18} className="text-purple-500" />}
              label="Licensed"
              value="100%"
              status="normal"
            />
          </div>
          <div className="flex space-x-3 mt-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              View All Specializations
            </button>
            <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
              Emergency Care
            </button>
          </div>
        </div>
        {/* Right visualization area */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-full md:w-1/3 p-6 flex items-center justify-center relative">
          <div className="absolute top-0 right-0 w-full h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M20,20 Q30,10 40,20 T60,20"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <path
                d="M20,40 Q30,30 40,40 T60,40"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
              <path
                d="M20,60 Q30,50 40,60 T60,60"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                <UserCheck size={40} className="text-white" />
              </div>
            </div>
            <p className="text-blue-800 font-medium text-center">
              Expert medical care at your fingertips
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
            ? 'Verified'
            : status === 'warning'
              ? 'Warning'
              : 'Alert'}
        </span>
      </div>
    </div>
  )
}

const StatsCards = ({ totalDoctors, filteredDoctors, specializations }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        icon={<Users size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
        label="Total Doctors"
        value={totalDoctors.toString()}
        subLabel="Available"
        accentColor="border-blue-500"
      />
      <StatCard
        icon={<Search size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-green-400 to-green-600"
        label="Search Results"
        value={filteredDoctors.toString()}
        subLabel="Found"
        accentColor="border-green-500"
      />
      <StatCard
        icon={<Award size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-purple-400 to-purple-600"
        label="Specializations"
        value={specializations.toString()}
        subLabel="Categories"
        accentColor="border-purple-500"
      />
      <StatCard
        icon={<Calendar size={24} className="text-white" />}
        iconBg="bg-gradient-to-br from-orange-400 to-orange-600"
        label="Book Now"
        value="Available"
        subLabel="24/7"
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

const SearchSection = ({ searchTerm, setSearchTerm, selectedSpecialization, setSelectedSpecialization, specializations }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors by name or specialization..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white"
          value={selectedSpecialization}
          onChange={(e) => setSelectedSpecialization(e.target.value)}
        >
          <option value="">All Specializations</option>
          {specializations.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
        <button className="flex items-center px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </button>
      </div>
    </div>
  )
}

const NoDoctorsFound = ({ searchTerm, selectedSpecialization }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-md">
          <UserCheck className="text-white" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
        <p className="text-gray-500 mb-4">
          {searchTerm || selectedSpecialization 
            ? 'Try adjusting your search criteria' 
            : 'No doctors are currently available'
          }
        </p>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Search className="h-4 w-4 mr-2" />
          Clear Filters
        </button>
      </div>
    </div>
  )
}

const DoctorsGrid = ({ filteredDoctors, getInitials, formatExperience, handleBookAppointment }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDoctors.map((doctor) => (
        <DoctorCard
          key={doctor._id}
          doctor={doctor}
          getInitials={getInitials}
          formatExperience={formatExperience}
          handleBookAppointment={handleBookAppointment}
        />
      ))}
    </div>
  )
}

const DoctorCard = ({ doctor, getInitials, formatExperience, handleBookAppointment }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center space-x-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <span className="text-white font-medium text-sm">
            {getInitials(doctor.firstName, doctor.lastName)}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            Dr. {doctor.firstName} {doctor.lastName}
          </h3>
          <p className="text-sm text-blue-600 font-medium">{doctor.specialization || 'General Practice'}</p>
          <p className="text-sm text-gray-500">{formatExperience(doctor.experience)}</p>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Award className="h-4 w-4 mr-2 text-blue-500" />
          <span>License: {doctor.licenseNumber || 'Not specified'}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <DollarSign className="h-4 w-4 mr-2 text-green-500" />
          <span>Fee: ${doctor.consultationFee || 'Not specified'}</span>
        </div>
        {doctor.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2 text-purple-500" />
            <span>{doctor.phone}</span>
          </div>
        )}
        {doctor.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-2 text-orange-500" />
            <span className="truncate">{doctor.email}</span>
          </div>
        )}
        {doctor.address && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-red-500" />
            <span className="truncate">
              {doctor.address.city}, {doctor.address.state}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(Math.random() * 3) + 3
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-1 text-sm text-gray-600">
              ({Math.floor(Math.random() * 50) + 20})
            </span>
          </div>
        </div>
        {doctor.isAvailable !== false ? (
          <button 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
            onClick={() => handleBookAppointment(doctor)}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Book Now
          </button>
        ) : (
          <span className="text-sm text-yellow-600 font-medium bg-yellow-50 px-3 py-1 rounded-full">
            Unavailable
          </span>
        )}
      </div>
    </div>
  )
}

export default PatientDoctors
