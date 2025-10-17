import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  UserCheck, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  DollarSign, 
  X, 
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Eye,
  ToggleLeft,
  ToggleRight,
  Shield,
  Award,
  TrendingUp,
  Users,
  MoreVertical,
  BadgeCheck,
  Activity,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Edit,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'
import jsPDF from 'jspdf'
import { doctorsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const Doctors = () => {
  const { isAdmin, user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  
  // Debug: Log admin status
  console.log('User:', user)
  console.log('Is Admin:', isAdmin)
  console.log('User Role:', user?.role)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialization, setSelectedSpecialization] = useState('')
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
    specialization: '',
    licenseNumber: '',
    experience: '',
    consultationFee: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  })

  // Fetch doctors data
  const { data: doctorsData, isLoading, error } = useQuery(
    'doctors',
    () => doctorsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  // Create doctor mutation
  const createDoctorMutation = useMutation(
    (doctorData) => doctorsAPI.create(doctorData),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('doctors')
        toast.success('Doctor account created successfully!')
        setShowAddDoctorModal(false)
        setNewDoctor({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          phone: '',
          dateOfBirth: '',
          gender: 'male',
          specialization: '',
          licenseNumber: '',
          experience: '',
          consultationFee: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          }
        })
      },
      onError: (error) => {
        console.error('Error creating doctor:', error)
        toast.error(error.response?.data?.message || 'Failed to create doctor account')
      }
    }
  )

  // Toggle doctor availability mutation
  const toggleAvailabilityMutation = useMutation(
    ({ doctorId, isAvailable }) => doctorsAPI.updateAvailability(doctorId, isAvailable),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('doctors')
        toast.success(response.data?.message || 'Availability updated successfully')
      },
      onError: (error) => {
        console.error('Error toggling doctor availability:', error)
        toast.error(error.response?.data?.message || 'Failed to update availability')
      }
    }
  )

  // Toggle doctor account status mutation (admin only)
  const toggleStatusMutation = useMutation(
    ({ doctorId, isActive }) => doctorsAPI.update(doctorId, { isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctors')
        toast.success('Doctor status updated successfully')
      },
      onError: (error) => {
        console.error('Error toggling doctor status:', error)
        toast.error(error.response?.data?.message || 'Failed to update doctor status')
      }
    }
  )

  const handleToggleAvailability = (doctorId, currentAvailability) => {
    if (window.confirm(`Are you sure you want to mark this doctor as ${currentAvailability ? 'unavailable' : 'available'}?`)) {
      toggleAvailabilityMutation.mutate({ doctorId, isAvailable: !currentAvailability })
    }
  }

  const handleToggleStatus = (doctorId, currentStatus) => {
    if (window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this doctor's account?`)) {
      toggleStatusMutation.mutate({ doctorId, isActive: !currentStatus })
    }
  }

  const doctors = doctorsData?.data?.data?.doctors || 
                  doctorsData?.data?.doctors || 
                  []

  // Get unique specializations for filter
  const specializations = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))]

  // Filter doctors based on search term and specialization
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization
    
    return matchesSearch && matchesSpecialization
  })

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const formatExperience = (experience) => {
    if (!experience) return 'Experience not specified'
    return `${experience} year${experience > 1 ? 's' : ''} experience`
  }

  const generateDoctorReportPDF = () => {
    try {
      console.log('Starting PDF generation...')
      console.log('Doctors data:', doctors)
      
      // Check if doctors data exists
      if (!doctors || doctors.length === 0) {
        console.warn('No doctors data available')
        toast.error('No doctors data available for report generation')
        return
      }
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20
      
      console.log('PDF document created successfully')

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Management Report', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Summary
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Summary', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Doctors: ${doctors.length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Available Doctors: ${doctors.filter(d => d.isAvailable).length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Unavailable Doctors: ${doctors.filter(d => !d.isAvailable).length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Active Doctors: ${doctors.filter(d => d.isActive).length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Inactive Doctors: ${doctors.filter(d => !d.isActive).length}`, 20, yPosition)
    yPosition += 15

    // Specializations summary
    const specializations = [...new Set(doctors.map(doctor => doctor.specialization).filter(Boolean))]
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Specializations', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Specializations: ${specializations.length}`, 20, yPosition)
    yPosition += 6
    specializations.forEach(spec => {
      const count = doctors.filter(d => d.specialization === spec).length
      doc.text(`• ${spec}: ${count} doctor${count > 1 ? 's' : ''}`, 25, yPosition)
      yPosition += 5
    })
    yPosition += 10

    // Doctor Details
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Doctor Details', 20, yPosition)
    yPosition += 10

    doctors.forEach((doctor, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = 20
      }

      // Doctor header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`, 20, yPosition)
      yPosition += 8

      // Doctor details
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      const details = [
        `Doctor ID: ${doctor._id}`,
        `Email: ${doctor.email}`,
        `Phone: ${doctor.phone || 'Not provided'}`,
        `Date of Birth: ${formatDate(doctor.dateOfBirth)}`,
        `Age: ${getAge(doctor.dateOfBirth)}`,
        `Gender: ${doctor.gender || 'Not specified'}`,
        `Specialization: ${doctor.specialization || 'General Practice'}`,
        `License Number: ${doctor.licenseNumber || 'Not provided'}`,
        `Experience: ${formatExperience(doctor.experience)}`,
        `Consultation Fee: $${doctor.consultationFee || '0'}`,
        `Status: ${doctor.isActive ? 'Active' : 'Inactive'}`,
        `Availability: ${doctor.isAvailable ? 'Available' : 'Unavailable'}`,
      ]

      if (doctor.address) {
        details.push(`Address: ${doctor.address.street || ''}, ${doctor.address.city || ''}, ${doctor.address.state || ''}, ${doctor.address.zipCode || ''}`)
      }

      details.forEach(detail => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(detail, 25, yPosition)
        yPosition += 5
      })

      yPosition += 10
    })

    // Footer
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' })
      doc.text('MediCare Hospital Management System', 20, pageHeight - 10)
    }

      // Download the PDF
      console.log('Attempting to save PDF...')
      doc.save(`doctor-report-${new Date().toISOString().split('T')[0]}.pdf`)
      console.log('PDF saved successfully!')
      toast.success('Doctor report PDF downloaded successfully!')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF: ' + error.message)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setNewDoctor(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setNewDoctor(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    createDoctorMutation.mutate(newDoctor)
  }

  const resetForm = () => {
    setNewDoctor({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male',
      specialization: '',
      licenseNumber: '',
      experience: '',
      consultationFee: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    })
    setShowAddDoctorModal(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Doctors</h3>
            <p className="text-gray-600 mb-4">
            {error.response?.data?.message || 'Failed to load doctors. Please try again.'}
          </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        <WelcomeBanner navigate={navigate} doctors={doctors} specializations={specializations} generateDoctorReportPDF={generateDoctorReportPDF} />
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
        <div>
              <h2 className="text-2xl font-bold text-gray-900">Doctor Management</h2>
              <p className="text-gray-600 mt-1">Comprehensive doctor database and management system</p>
        </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Total: {doctors.length} doctors</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
      </div>


      {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                  placeholder="Search doctors by name, specialization, or email..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
              className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
            <button className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center">
              <Filter className="h-5 w-5 mr-2 text-gray-600" />
            More Filters
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowAddDoctorModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Doctor
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredDoctors.length}</span> of{' '}
            <span className="font-semibold text-gray-900">{doctors.length}</span> doctors
          </p>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || selectedSpecialization 
                ? 'No doctors match your search criteria. Try adjusting your filters.' 
                : 'No doctors are currently registered in the system.'
              }
            </p>
            {(searchTerm || selectedSpecialization) && (
              <button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedSpecialization('')
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <EnhancedDoctorCard 
                key={doctor._id} 
                doctor={doctor} 
                navigate={navigate}
                getInitials={getInitials}
                formatExperience={formatExperience}
                isAdmin={isAdmin}
                handleToggleAvailability={handleToggleAvailability}
                handleToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Add New Doctor</h2>
                  <p className="text-gray-600 mt-1">Register a new healthcare professional</p>
                </div>
              <button
                onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={newDoctor.firstName}
                    onChange={handleInputChange}
                    required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Enter first name"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={newDoctor.lastName}
                    onChange={handleInputChange}
                    required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Enter last name"
                  />
                    </div>
                </div>
              </div>

                {/* Personal Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={newDoctor.dateOfBirth}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={newDoctor.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-blue-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newDoctor.email}
                    onChange={handleInputChange}
                    required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="doctor@hospital.com"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newDoctor.phone}
                    onChange={handleInputChange}
                    required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="+1234567890"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={newDoctor.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                </div>
              </div>

                {/* Professional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-blue-600" />
                    Professional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    value={newDoctor.specialization}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Cardiology, Neurology"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={newDoctor.licenseNumber}
                    onChange={handleInputChange}
                    required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Medical license number"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience (years) *
                  </label>
                  <input
                    type="number"
                    name="experience"
                    value={newDoctor.experience}
                    onChange={handleInputChange}
                    required
                    min="0"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Years of experience"
                  />
                </div>
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee ($)
                </label>
                <input
                  type="number"
                  name="consultationFee"
                  value={newDoctor.consultationFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="Consultation fee"
                />
              </div>
                </div>
              </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createDoctorMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                        <span className="ml-2">Creating Doctor...</span>
                    </>
                  ) : (
                    <>
                        <Save className="h-5 w-5 mr-2" />
                        Create Doctor Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

// Enhanced Welcome Banner
const WelcomeBanner = ({ navigate, doctors = [], specializations = [], generateDoctorReportPDF }) => {
  const availableDoctors = doctors.filter(d => d.isAvailable).length
  const avgExperience = doctors.length > 0 
    ? Math.round(doctors.reduce((acc, doc) => acc + (parseInt(doc.experience) || 0), 0) / doctors.length)
    : 0

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left content area */}
        <div className="p-8 lg:p-10 flex-1">
          <div className="flex items-center mb-6">
            <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
              <UserCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Doctor Management System
              </h1>
              <p className="text-blue-100 text-lg">
                Comprehensive doctor database and healthcare management
              </p>
            </div>
          </div>
          
          <p className="text-blue-100/90 mb-8 max-w-2xl text-lg leading-relaxed">
            Manage doctor profiles, track specializations, and maintain comprehensive 
            healthcare professional data with our secure, professional doctor management platform.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <HealthMetric
              icon={<Users size={20} className="text-blue-400" />}
              label="Total Doctors"
              value={doctors.length}
              status="normal"
            />
            <HealthMetric
              icon={<UserCheck size={20} className="text-green-400" />}
              label="Available Today"
              value={availableDoctors}
              status="normal"
            />
            <HealthMetric
              icon={<Award size={20} className="text-purple-400" />}
              label="Specializations"
              value={specializations.length}
              status="normal"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                try {
                  console.log('Generating doctor report PDF')
                  toast.success('Generating doctor report PDF...')
                  generateDoctorReportPDF()
                } catch (error) {
                  console.error('Error generating doctor report:', error)
                  toast.error('Error generating doctor report: ' + error.message)
                }
              }}
              className="bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex items-center"
            >
              <Download size={18} className="mr-2" />
              Download Reports
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
                <UserCheck size={48} className="text-blue-600" />
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

// Enhanced Search and Filters Section
const SearchAndFiltersSection = ({ searchTerm, setSearchTerm, selectedSpecialization, setSelectedSpecialization, specializations, navigate, isAdmin, setShowAddDoctorModal }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors by name, specialization, or email..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          <button className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-xl font-semibold text-gray-700 transition-colors flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
          {isAdmin && (
            <button 
              onClick={() => setShowAddDoctorModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Doctor
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Results Count Section
const ResultsCountSection = ({ filteredDoctors }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <p className="text-gray-600">
        Showing <span className="font-semibold text-gray-900">{filteredDoctors.length}</span> doctors
      </p>
    </div>
  )
}

// Enhanced Doctors Grid Section
const DoctorsGridSection = ({ filteredDoctors, searchTerm, selectedSpecialization, navigate, getInitials, formatExperience, isAdmin, handleToggleAvailability, handleToggleStatus }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Doctor Directory
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {filteredDoctors.length} {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found
                {searchTerm && (
                  <span className="ml-2 text-blue-600 font-medium">
                    for "{searchTerm}"
                  </span>
                )}
                {selectedSpecialization && (
                  <span className="ml-2 text-blue-600 font-medium">
                    in "{selectedSpecialization}"
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 font-medium">Live Data</span>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-200">
              <span className="text-blue-600 font-bold text-lg">
                {filteredDoctors.length}
              </span>
              <span className="text-gray-500 text-sm ml-1">total</span>
            </div>
            <button 
              onClick={() => {
                try {
                  console.log('Refreshing doctor list')
                  window.location.reload()
                } catch (error) {
                  console.error('Error refreshing doctor list:', error)
                }
              }}
              className="bg-white hover:bg-gray-50 p-3 rounded-xl transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md"
              title="Refresh doctor list"
            >
              <Activity size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      {filteredDoctors.length === 0 ? (
        <EmptyStateSection searchTerm={searchTerm} selectedSpecialization={selectedSpecialization} navigate={navigate} />
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <EnhancedDoctorCard 
                key={doctor._id} 
                doctor={doctor} 
                navigate={navigate}
                getInitials={getInitials}
                formatExperience={formatExperience}
                isAdmin={isAdmin}
                handleToggleAvailability={handleToggleAvailability}
                handleToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Doctor Card - Matching Patient Directory Style
const EnhancedDoctorCard = ({ doctor, navigate, getInitials, formatExperience, isAdmin, handleToggleAvailability, handleToggleStatus }) => {
  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden">
      {/* Card Header with Gradient */}
      <div className={`h-2 ${doctor.isAvailable ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}></div>
      
      <div className="p-6">
        {/* Doctor Avatar and Basic Info */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-blue-600 font-bold text-xl">
                {getInitials(doctor.firstName, doctor.lastName)}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              doctor.isAvailable ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${doctor.isAvailable ? 'bg-green-100' : 'bg-red-100'}`}></div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                Dr. {doctor.firstName} {doctor.lastName}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                doctor.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {doctor.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Award className="h-4 w-4 mr-1 text-gray-400" />
                {doctor.specialization || 'General Practice'}
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {formatExperience(doctor.experience)}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Mail className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
            <span className="truncate">{doctor.email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Phone className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
            <span>{doctor.phone || 'Not provided'}</span>
          </div>
          {doctor.address && (
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <MapPin className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{doctor.address.city}, {doctor.address.state}</span>
            </div>
          )}
        </div>

               {/* Action Buttons - Hidden for Admin */}
               {!isAdmin && (
                 <div className="flex space-x-3">
                   <button 
                     onClick={() => {
                       try {
                         console.log('Viewing doctor profile:', doctor._id)
                         // navigate(`/doctors/${doctor._id}`) // Disabled for now
                       } catch (error) {
                         console.error('Error viewing doctor profile:', error)
                       }
                     }}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group/btn"
                   >
                     <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                     View Profile
                   </button>
                   <button 
                     onClick={() => {
                       try {
                         console.log('Editing doctor:', doctor._id)
                         // navigate(`/doctors/${doctor._id}/edit`) // Disabled for now
                       } catch (error) {
                         console.error('Error editing doctor:', error)
                       }
                     }}
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group/btn"
                   >
                     <Edit className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                     Edit
                   </button>
                 </div>
               )}

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Doctor ID: {doctor._id.slice(-6)}</span>
            <span>Fee: ${doctor.consultationFee || '0'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Empty State
const EmptyStateSection = ({ searchTerm, selectedSpecialization, navigate }) => {
  return (
    <div className="p-8">
      <div className="text-center py-16">
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
            <UserCheck className="h-16 w-16 text-blue-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Search className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {searchTerm || selectedSpecialization ? 'No doctors found' : 'No doctors in database'}
        </h3>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
          {searchTerm || selectedSpecialization
            ? 'We couldn\'t find any doctors matching your search criteria. Try adjusting your search terms or filters to find the doctor you\'re looking for.'
            : 'No doctors are currently registered in the system. Contact your administrator to add doctors to the database.'
          }
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {(searchTerm || selectedSpecialization) && (
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
            >
              <Search className="h-5 w-5 mr-2" />
              Clear Search
            </button>
          )}
        </div>
        
        {!searchTerm && !selectedSpecialization && (
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">System Information</h4>
            </div>
            <p className="text-blue-700 text-sm">
              The doctor database is currently empty. Contact your system administrator 
              to add doctors to the system and start managing healthcare professionals.
            </p>
          </div>
        )}

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

export default Doctors