import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin,
  Activity,
  HeartPulse,
  LineChart,
  ShieldCheck,
  Eye,
  Edit,
  UserCheck,
  TrendingUp,
  Clock,
  Download,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react'
import jsPDF from 'jspdf'
import { patientsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, patient: null })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch patients data
  const { data: patientsData, isLoading, error } = useQuery(
    'patients',
    () => patientsAPI.getAll(),
    {
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  console.log('Patients Data:', patientsData)
  console.log('Patients Error:', error)

  const patients = patientsData?.data?.data?.patients || 
                   patientsData?.data?.patients || 
                   []

  // Deactivate patient mutation (soft delete)
  const deactivatePatientMutation = useMutation(
    (patientId) => patientsAPI.delete(patientId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients')
        setDeleteModal({ isOpen: false, patient: null })
      },
      onError: (error) => {
        console.error('Deactivate patient error:', error)
        alert(error.response?.data?.message || 'Failed to deactivate patient')
      }
    }
  )

  // Permanent delete patient mutation (hard delete)
  const permanentDeletePatientMutation = useMutation(
    (patientId) => patientsAPI.permanentDelete(patientId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients')
        setDeleteModal({ isOpen: false, patient: null })
      },
      onError: (error) => {
        console.error('Permanent delete patient error:', error)
        alert(error.response?.data?.message || 'Failed to permanently delete patient')
      }
    }
  )

  const handleDeletePatient = (patient) => {
    setDeleteModal({ isOpen: true, patient })
  }

  const confirmDeactivate = () => {
    if (deleteModal.patient) {
      deactivatePatientMutation.mutate(deleteModal.patient._id)
    }
  }

  const confirmPermanentDelete = () => {
    if (deleteModal.patient) {
      permanentDeletePatientMutation.mutate(deleteModal.patient._id)
    }
  }

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, patient: null })
  }
  
  console.log('Parsed Patients:', patients)
  console.log('Patients Count:', patients.length)

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const generatePatientReportPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient Management Report', pageWidth / 2, yPosition, { align: 'center' })
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
    doc.text(`Total Patients: ${patients.length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Active Patients: ${patients.filter(p => p.isActive).length}`, 20, yPosition)
    yPosition += 6
    doc.text(`Inactive Patients: ${patients.filter(p => !p.isActive).length}`, 20, yPosition)
    yPosition += 15

    // Patient Details
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Patient Details', 20, yPosition)
    yPosition += 10

    patients.forEach((patient, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      // Patient header
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${patient.firstName} ${patient.lastName}`, 20, yPosition)
      yPosition += 8

      // Patient details
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      const details = [
        `Patient ID: ${patient._id}`,
        `Email: ${patient.email}`,
        `Phone: ${patient.phone}`,
        `Date of Birth: ${formatDate(patient.dateOfBirth)}`,
        `Age: ${getAge(patient.dateOfBirth)}`,
        `Status: ${patient.isActive ? 'Active' : 'Inactive'}`,
        `Blood Type: ${patient.bloodType || 'Not specified'}`,
      ]

      if (patient.address) {
        details.push(`Address: ${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''}, ${patient.address.zipCode || ''}`)
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
    doc.save(`patient-report-${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const getAge = (dateOfBirth) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 p-3 rounded-xl mr-4">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-800">Error Loading Patients</h3>
                <p className="text-red-600 mt-1">Unable to fetch patient data</p>
              </div>
            </div>
            <p className="text-red-600 mb-6">
            {error.response?.data?.message || 'Failed to load patients. Please try again.'}
          </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
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
        <WelcomeBanner navigate={navigate} patients={patients} generatePatientReportPDF={generatePatientReportPDF} />
        
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
              <p className="text-gray-600 mt-1">Comprehensive patient database and management system</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Total: {patients.length} patients</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <SearchAndFiltersSection 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          navigate={navigate} 
        />

        <PatientsListSection 
          filteredPatients={filteredPatients} 
          searchTerm={searchTerm}
          navigate={navigate}
          getInitials={getInitials}
          formatDate={formatDate}
          onDeletePatient={handleDeletePatient}
        />

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <DeleteConfirmationModal
            patient={deleteModal.patient}
            onDeactivate={confirmDeactivate}
            onPermanentDelete={confirmPermanentDelete}
            onCancel={cancelDelete}
            isDeactivating={deactivatePatientMutation.isLoading}
            isPermanentDeleting={permanentDeletePatientMutation.isLoading}
          />
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

// Enhanced Welcome Banner
const WelcomeBanner = ({ navigate, patients = [], generatePatientReportPDF }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left content area */}
        <div className="p-8 lg:p-10 flex-1">
          <div className="flex items-center mb-6">
            <div className="bg-white/20 p-3 rounded-2xl mr-4 backdrop-blur-sm">
              <Users size={24} className="text-white" />
            </div>
        <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Patient Management System
              </h1>
              <p className="text-blue-100 text-lg">
                Comprehensive patient database and healthcare management
              </p>
            </div>
          </div>
          
          <p className="text-blue-100/90 mb-8 max-w-2xl text-lg leading-relaxed">
            Manage patient records, track medical history, and maintain comprehensive 
            healthcare data with our secure, professional patient management platform.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <HealthMetric
              icon={<Users size={20} className="text-blue-400" />}
              label="Total Patients"
              value={patients.length}
              status="normal"
            />
            <HealthMetric
              icon={<UserCheck size={20} className="text-green-400" />}
              label="Active Patients"
              value={patients.filter(p => p.isActive).length}
              status="normal"
            />
            <HealthMetric
              icon={<Clock size={20} className="text-orange-400" />}
              label="Inactive Patients"
              value={patients.filter(p => !p.isActive).length}
              status="normal"
            />
        </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => {
                try {
                  console.log('Generating patient report PDF')
                  generatePatientReportPDF()
                } catch (error) {
                  console.error('Error generating patient report:', error)
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
                <Users size={48} className="text-blue-600" />
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

// Patient Statistics Cards
const PatientStats = ({ patients }) => {
  const activePatients = patients.filter(p => p.isActive).length
  const inactivePatients = patients.filter(p => !p.isActive).length
  const totalPatients = patients.length

  const stats = [
    {
      name: 'Total Patients',
      value: totalPatients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      trend: '+12%',
      description: 'This month'
    },
    {
      name: 'Active Patients',
      value: activePatients,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      trend: '+8%',
      description: 'Currently active'
    },
    {
      name: 'Inactive Patients',
      value: inactivePatients,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      trend: '-2%',
      description: 'Require attention'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

// Enhanced Search and Filters Section
const SearchAndFiltersSection = ({ searchTerm, setSearchTerm, navigate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
              placeholder="Search patients by name, email, or phone..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        <div className="flex gap-3">
          <button className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-xl font-semibold text-gray-700 transition-colors flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>
      </div>
  )
}

// Enhanced Patients List Section
const PatientsListSection = ({ filteredPatients, searchTerm, navigate, getInitials, formatDate, onDeletePatient }) => {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Patient Directory
          </h2>
              <p className="text-gray-600 text-sm mt-1">
                {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
                {searchTerm && (
                  <span className="ml-2 text-blue-600 font-medium">
                    for "{searchTerm}"
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
                {filteredPatients.length}
              </span>
              <span className="text-gray-500 text-sm ml-1">total</span>
            </div>
            <button 
              onClick={() => {
                try {
                  console.log('Refreshing patient list')
                  window.location.reload()
                } catch (error) {
                  console.error('Error refreshing patient list:', error)
                }
              }}
              className="bg-white hover:bg-gray-50 p-3 rounded-xl transition-all duration-200 shadow-sm border border-gray-200 hover:shadow-md"
              title="Refresh patient list"
            >
              <Activity size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
        </div>
        
        {filteredPatients.length === 0 ? (
        <EmptyStateSection searchTerm={searchTerm} navigate={navigate} />
      ) : (
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <EnhancedPatientCard 
                key={patient._id} 
                patient={patient} 
                navigate={navigate}
                getInitials={getInitials}
                formatDate={formatDate}
                onDeletePatient={onDeletePatient}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Patient Card - Grid Layout
const EnhancedPatientCard = ({ patient, navigate, getInitials, formatDate, onDeletePatient }) => {
  const getAge = (dateOfBirth) => {
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
      <div className={`h-2 ${patient.isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}></div>
      
          <div className="p-6">
        {/* Patient Avatar and Basic Info */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-blue-600 font-bold text-xl">
                {getInitials(patient.firstName, patient.lastName)}
              </span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              patient.isActive ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${patient.isActive ? 'bg-green-100' : 'bg-red-100'}`}></div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {patient.firstName} {patient.lastName}
              </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                patient.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {patient.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                Age {getAge(patient.dateOfBirth)}
              </span>
              {patient.bloodType && (
                <span className="flex items-center">
                  <HeartPulse className="h-4 w-4 mr-1 text-gray-400" />
                  {patient.bloodType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Mail className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
            <span className="truncate">{patient.email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <Phone className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
            <span>{patient.phone}</span>
          </div>
          {patient.address && (
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <MapPin className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
              <span className="truncate">{patient.address.city}, {patient.address.state}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => {
              try {
                console.log('Viewing patient details:', patient._id)
                navigate(`/patients/${patient._id}`)
              } catch (error) {
                console.error('Error viewing patient details:', error)
              }
            }}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group/btn"
          >
            <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
            View Details
          </button>
          <button 
            onClick={() => {
              try {
                console.log('Deleting patient:', patient._id)
                onDeletePatient(patient)
              } catch (error) {
                console.error('Error deleting patient:', error)
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group/btn"
            title="Delete Patient"
          >
            <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Patient ID: {patient._id.slice(-6)}</span>
            <span>Added: {formatDate(patient.createdAt || patient.dateOfBirth)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Keep the old PatientCard for backward compatibility if needed
const PatientCard = ({ patient, navigate, getInitials, formatDate }) => {
  return (
    <div className="px-6 py-6 hover:bg-gray-50/50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-blue-600 font-bold text-lg">
                          {getInitials(patient.firstName, patient.lastName)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          patient.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {patient.email}
                        </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {patient.phone}
                        </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Born {formatDate(patient.dateOfBirth)}
                      </div>
                      {patient.address && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {patient.address.city}, {patient.address.state}
                        </div>
                      )}
            </div>
            
                      {patient.bloodType && (
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Blood Type: {patient.bloodType}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              try {
                console.log('Viewing patient details:', patient._id)
                navigate(`/patients/${patient._id}`)
              } catch (error) {
                console.error('Error viewing patient details:', error)
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
  )
}

// Enhanced Empty State
const EmptyStateSection = ({ searchTerm, navigate }) => {
  return (
    <div className="p-8">
      <div className="text-center py-16">
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
            <Users className="h-16 w-16 text-blue-400" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Search className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {searchTerm ? 'No patients found' : 'No patients in database'}
        </h3>
        <p className="text-gray-500 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
          {searchTerm 
            ? 'We couldn\'t find any patients matching your search criteria. Try adjusting your search terms or filters to find the patient you\'re looking for.'
            : 'No patients are currently registered in the system. Contact your administrator to add patients to the database.'
          }
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {searchTerm && (
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
            >
              <Search className="h-5 w-5 mr-2" />
              Clear Search
            </button>
          )}
        </div>
        
        {!searchTerm && (
          <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-200 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900">System Information</h4>
            </div>
            <p className="text-blue-700 text-sm">
              The patient database is currently empty. Contact your system administrator 
              to add patients to the system and start managing healthcare records.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ patient, onDeactivate, onPermanentDelete, onCancel, isDeactivating, isPermanentDeleting }) => {
  const isProcessing = isDeactivating || isPermanentDeleting
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Patient Account</h3>
            </div>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4 text-lg font-semibold">
              Choose how to delete this patient account:
            </p>
            
            {/* Patient Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold">
                    {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{patient.email}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p className="flex items-center">
                  <Phone className="h-3 w-3 mr-2" />
                  {patient.phone}
                </p>
              </div>
            </div>

            {/* Delete Options */}
            <div className="space-y-3 mt-4">
              {/* Deactivate Option */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg flex-shrink-0">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-orange-900 font-semibold mb-1">Deactivate Account (Soft Delete)</p>
                    <p className="text-orange-700 text-sm mb-3">
                      Temporarily disable the account. Can be reactivated later. Patient data is preserved.
                    </p>
                    <button
                      onClick={onDeactivate}
                      disabled={isProcessing}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isDeactivating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deactivating...
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          Deactivate Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Permanent Delete Option */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-900 font-semibold mb-1">Permanent Delete (Hard Delete)</p>
                    <p className="text-red-700 text-sm mb-3">
                      Permanently remove all patient data from the database. This action cannot be undone!
                    </p>
                    <button
                      onClick={onPermanentDelete}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isPermanentDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting Permanently...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Patients
