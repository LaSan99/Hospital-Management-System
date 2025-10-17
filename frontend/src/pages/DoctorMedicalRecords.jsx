import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, Plus, Search, User, Calendar, Stethoscope, Pill, Activity,
  X, Save, Eye, CheckCircle, Filter, Download, MoreVertical,
  Heart, Thermometer, Scale, Ruler, Clock, AlertCircle
} from 'lucide-react'
import { medicalRecordsAPI, appointmentsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const DoctorMedicalRecords = () => {
  const { user } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeRecord, setActiveRecord] = useState(null)
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentId: '',
    recordType: 'consultation',
    diagnosis: { mainProblem: '', symptoms: '', notes: '' },
    treatment: { medications: [], procedures: '', recommendations: '' },
    vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
    followUp: { nextAppointment: '', instructions: '', warningSigns: '' },
    doctorNotes: '',
    patientComplaints: ''
  })
  const [currentMedication, setCurrentMedication] = useState({
    name: '', dosage: '', frequency: '', duration: '', instructions: ''
  })

  // Fetch medical records
  const { data: medicalRecordsData, isLoading, error } = useQuery(
    'doctor-medical-records',
    () => medicalRecordsAPI.getAll()
  )

  // Fetch completed appointments
  const { data: appointmentsData } = useQuery(
    'completed-appointments',
    () => appointmentsAPI.getAll(),
    {
      enabled: showCreateModal,
      select: (data) => {
        const appointments = data?.data?.data?.appointments || data?.data?.appointments || []
        return appointments.filter(apt => apt.status === 'completed')
      }
    }
  )

  // Handle navigation state from DoctorAppointments page
  useEffect(() => {
    if (location.state?.appointmentId && location.state?.patientId) {
      setShowCreateModal(true)
      setFormData(prev => ({
        ...prev,
        appointmentId: location.state.appointmentId,
        patientId: location.state.patientId
      }))
      // Clear the state after using it
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Create medical record mutation
  const createRecordMutation = useMutation(
    (recordData) => medicalRecordsAPI.create(recordData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('doctor-medical-records')
        toast.success('Medical record created successfully')
        setShowCreateModal(false)
        resetForm()
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create medical record')
      }
    }
  )

  const medicalRecords = medicalRecordsData?.data?.data?.medicalRecords || 
                         medicalRecordsData?.data?.medicalRecords || []

  const filteredRecords = medicalRecords.filter(record => {
    const matchesSearch = 
      record.patientId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.patientId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.mainProblem?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || record.recordType === typeFilter
    const matchesStatus = !statusFilter || record.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const resetForm = () => {
    setFormData({
      patientId: '', appointmentId: '', recordType: 'consultation',
      diagnosis: { mainProblem: '', symptoms: '', notes: '' },
      treatment: { medications: [], procedures: '', recommendations: '' },
      vitalSigns: { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
      followUp: { nextAppointment: '', instructions: '', warningSigns: '' },
      doctorNotes: '', patientComplaints: ''
    })
    setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
  }

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleAddMedication = () => {
    if (currentMedication.name && currentMedication.dosage) {
      setFormData(prev => ({
        ...prev,
        treatment: {
          ...prev.treatment,
          medications: [...prev.treatment.medications, currentMedication]
        }
      }))
      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
      toast.success('Medication added')
    } else {
      toast.error('Please fill in medication name and dosage')
    }
  }

  const handleRemoveMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      treatment: {
        ...prev.treatment,
        medications: prev.treatment.medications.filter((_, i) => i !== index)
      }
    }))
    toast.success('Medication removed')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.patientId || !formData.recordType) {
      toast.error('Please select a patient and record type')
      return
    }

    const submitData = {
      ...formData,
      diagnosis: {
        ...formData.diagnosis,
        symptoms: formData.diagnosis.symptoms ? formData.diagnosis.symptoms.split(',').map(s => s.trim()) : []
      },
      treatment: {
        ...formData.treatment,
        procedures: formData.treatment.procedures ? formData.treatment.procedures.split(',').map(s => s.trim()) : [],
        recommendations: formData.treatment.recommendations ? formData.treatment.recommendations.split(',').map(s => s.trim()) : []
      },
      followUp: {
        ...formData.followUp,
        warningSigns: formData.followUp.warningSigns ? formData.followUp.warningSigns.split(',').map(s => s.trim()) : []
      }
    }

    createRecordMutation.mutate(submitData)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const getRecordTypeColor = (type) => {
    const colors = {
      consultation: 'blue',
      diagnosis: 'orange',
      treatment: 'green',
      follow_up: 'purple'
    }
    return colors[type] || 'gray'
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      completed: 'blue',
      pending: 'orange',
      cancelled: 'red'
    }
    return colors[status] || 'gray'
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Records</h3>
          <p className="text-red-600 mb-4">{error.response?.data?.message || 'Failed to load medical records.'}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                <p className="text-gray-600">Create and manage patient medical records</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Record</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, diagnosis, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
                  <select 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)} 
                    className="form-select rounded-lg w-full"
                  >
                    <option value="">All Types</option>
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="treatment">Treatment</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)} 
                    className="form-select rounded-lg w-full"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{medicalRecords.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalRecords.filter(r => r.recordType === 'consultation').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalRecords.filter(r => {
                    const recordDate = new Date(r.createdAt)
                    const now = new Date()
                    return recordDate.getMonth() === now.getMonth() && 
                           recordDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicalRecords.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Patient Records</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredRecords.length} records found
            </span>
          </div>
          
          {filteredRecords.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div key={record._id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`h-14 w-14 rounded-xl bg-${getRecordTypeColor(record.recordType)}-100 flex items-center justify-center`}>
                        <FileText className={`h-6 w-6 text-${getRecordTypeColor(record.recordType)}-600`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {record.patientId?.firstName} {record.patientId?.lastName}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${getRecordTypeColor(record.recordType)}-100 text-${getRecordTypeColor(record.recordType)}-800 capitalize`}>
                              {record.recordType?.replace('_', ' ')}
                            </span>
                            {record.status && (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(record.status)}-100 text-${getStatusColor(record.status)}-800 capitalize`}>
                                {record.status}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {formatDate(record.createdAt)}
                          </div>
                          {record.diagnosis?.mainProblem && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="truncate">{record.diagnosis.mainProblem}</span>
                            </div>
                          )}
                          {record.vitalSigns && (
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {record.vitalSigns.bloodPressure && (
                                <span className="flex items-center">
                                  <Activity className="h-4 w-4 mr-1 text-gray-400" />
                                  {record.vitalSigns.bloodPressure}
                                </span>
                              )}
                              {record.vitalSigns.heartRate && (
                                <span className="flex items-center">
                                  <Heart className="h-4 w-4 mr-1 text-gray-400" />
                                  {record.vitalSigns.heartRate} bpm
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {record.doctorNotes && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {record.doctorNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setActiveRecord(activeRecord?._id === record._id ? null : record)}
                        className="btn btn-outline btn-sm"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="btn btn-outline btn-sm">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {activeRecord?._id === record._id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Diagnosis Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Diagnosis</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="font-medium">Main Problem:</span> {record.diagnosis?.mainProblem || 'N/A'}</p>
                            <p><span className="font-medium">Symptoms:</span> {record.diagnosis?.symptoms?.join(', ') || 'N/A'}</p>
                            <p><span className="font-medium">Notes:</span> {record.diagnosis?.notes || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Treatment Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Treatment</h4>
                          <div className="space-y-2 text-sm">
                            {record.treatment?.medications?.length > 0 ? (
                              <div>
                                <p className="font-medium mb-1">Medications:</p>
                                {record.treatment.medications.map((med, idx) => (
                                  <div key={idx} className="ml-2 text-gray-600">
                                    {med.name} - {med.dosage} ({med.frequency})
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p>No medications prescribed</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || typeFilter || statusFilter ? 'No matching records found' : 'No medical records yet'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || typeFilter || statusFilter 
                  ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                  : 'Start by creating your first medical record for a patient.'
                }
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create New Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Medical Record</h2>
                <p className="text-sm text-gray-600 mt-1">Fill in the patient's medical information</p>
              </div>
              <button 
                onClick={() => { setShowCreateModal(false); resetForm(); }} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Appointment *
                  </label>
                  <select
                    value={formData.appointmentId}
                    onChange={(e) => {
                      const apt = appointmentsData?.find(a => a._id === e.target.value)
                      setFormData(prev => ({
                        ...prev,
                        appointmentId: e.target.value,
                        patientId: apt?.patientId?._id || apt?.patientId || '',
                        patientComplaints: apt?.reason || ''
                      }))
                    }}
                    required
                    className="form-select rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select an appointment...</option>
                    {appointmentsData?.map(apt => (
                      <option key={apt._id} value={apt._id}>
                        {apt.patientName} - {formatDate(apt.appointmentDate)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Type *
                  </label>
                  <select 
                    value={formData.recordType} 
                    onChange={(e) => handleInputChange(null, 'recordType', e.target.value)} 
                    required 
                    className="form-select rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="treatment">Treatment</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Vital Signs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Blood Pressure</label>
                    <input 
                      type="text" 
                      value={formData.vitalSigns.bloodPressure} 
                      onChange={(e) => handleInputChange('vitalSigns', 'bloodPressure', e.target.value)} 
                      placeholder="120/80" 
                      className="form-input rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Heart Rate</label>
                    <input 
                      type="number" 
                      value={formData.vitalSigns.heartRate} 
                      onChange={(e) => handleInputChange('vitalSigns', 'heartRate', e.target.value)} 
                      placeholder="72" 
                      className="form-input rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Temperature</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.vitalSigns.temperature} 
                      onChange={(e) => handleInputChange('vitalSigns', 'temperature', e.target.value)} 
                      placeholder="98.6" 
                      className="form-input rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.vitalSigns.weight} 
                      onChange={(e) => handleInputChange('vitalSigns', 'weight', e.target.value)} 
                      placeholder="70" 
                      className="form-input rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={formData.vitalSigns.height} 
                      onChange={(e) => handleInputChange('vitalSigns', 'height', e.target.value)} 
                      placeholder="175" 
                      className="form-input rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Stethoscope className="h-5 w-5 mr-2 text-orange-600" />
                  Diagnosis
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Problem</label>
                    <input 
                      type="text" 
                      value={formData.diagnosis.mainProblem} 
                      onChange={(e) => handleInputChange('diagnosis', 'mainProblem', e.target.value)} 
                      placeholder="Primary diagnosis or main concern" 
                      className="form-input rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms</label>
                    <input 
                      type="text" 
                      value={formData.diagnosis.symptoms} 
                      onChange={(e) => handleInputChange('diagnosis', 'symptoms', e.target.value)} 
                      placeholder="Fever, headache, cough (comma-separated)" 
                      className="form-input rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis Notes</label>
                    <textarea 
                      value={formData.diagnosis.notes} 
                      onChange={(e) => handleInputChange('diagnosis', 'notes', e.target.value)} 
                      rows={3} 
                      placeholder="Additional observations and clinical findings..." 
                      className="form-textarea rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Pill className="h-5 w-5 mr-2 text-green-600" />
                  Medications
                </h3>
                {formData.treatment.medications.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <h4 className="font-medium text-gray-700">Current Medications</h4>
                    {formData.treatment.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border rounded-lg p-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-600">
                            {med.dosage} • {med.frequency} • {med.duration}
                            {med.instructions && ` • ${med.instructions}`}
                          </p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMedication(index)} 
                          className="text-red-500 hover:text-red-700 ml-4"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-medium text-gray-700 mb-3">Add New Medication</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input 
                      type="text" 
                      value={currentMedication.name} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))} 
                      placeholder="Medication name" 
                      className="form-input rounded-lg text-sm"
                    />
                    <input 
                      type="text" 
                      value={currentMedication.dosage} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))} 
                      placeholder="Dosage (e.g., 500mg)" 
                      className="form-input rounded-lg text-sm"
                    />
                    <input 
                      type="text" 
                      value={currentMedication.frequency} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))} 
                      placeholder="Frequency (e.g., Twice daily)" 
                      className="form-input rounded-lg text-sm"
                    />
                    <input 
                      type="text" 
                      value={currentMedication.duration} 
                      onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))} 
                      placeholder="Duration (e.g., 7 days)" 
                      className="form-input rounded-lg text-sm"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={currentMedication.instructions} 
                    onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))} 
                    placeholder="Special instructions" 
                    className="form-input rounded-lg text-sm w-full mb-3"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddMedication} 
                    className="btn btn-success btn-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Medication
                  </button>
                </div>
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor's Notes
                </label>
                <textarea 
                  value={formData.doctorNotes} 
                  onChange={(e) => handleInputChange(null, 'doctorNotes', e.target.value)} 
                  rows={4} 
                  placeholder="Enter clinical observations, treatment rationale, and any additional notes..." 
                  className="form-textarea rounded-lg"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button 
                  type="button" 
                  onClick={() => { setShowCreateModal(false); resetForm(); }} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createRecordMutation.isLoading} 
                  className="btn btn-primary"
                >
                  {createRecordMutation.isLoading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorMedicalRecords