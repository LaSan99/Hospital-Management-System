import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  FileText, Plus, Search, User, Calendar, Stethoscope, Pill, Activity,
  X, Save, Eye, CheckCircle
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
  const [showCreateModal, setShowCreateModal] = useState(false)
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
    return matchesSearch && matchesType
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

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Medical Records</h3>
        <p className="text-red-600">{error.response?.data?.message || 'Failed to load medical records.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600">Create and manage patient medical records</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Record
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-select w-full sm:w-auto">
            <option value="">All Types</option>
            <option value="consultation">Consultation</option>
            <option value="diagnosis">Diagnosis</option>
            <option value="treatment">Treatment</option>
            <option value="follow_up">Follow-up</option>
          </select>
        </div>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Records ({filteredRecords.length})</h2>
        </div>
        
        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <div key={record._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {record.patientId?.firstName} {record.patientId?.lastName}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {record.recordType?.replace('_', ' ')}
                        </span>
                        {record.status === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(record.createdAt)}
                        </div>
                        {record.diagnosis?.mainProblem && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Stethoscope className="h-4 w-4 mr-2 text-gray-400" />
                            {record.diagnosis.mainProblem}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || typeFilter ? 'No records found' : 'No medical records yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || typeFilter ? 'Try adjusting your search' : 'Create your first medical record'}
            </p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Record
            </button>
          </div>
        )}
      </div>

      {/* Create Record Modal - Simplified */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-900">Create Medical Record</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Appointment *</label>
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
                    className="form-select"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Record Type *</label>
                  <select value={formData.recordType} onChange={(e) => handleInputChange(null, 'recordType', e.target.value)} required className="form-select">
                    <option value="consultation">Consultation</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="treatment">Treatment</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
              </div>

              {/* Vital Signs */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <input type="text" value={formData.vitalSigns.bloodPressure} onChange={(e) => handleInputChange('vitalSigns', 'bloodPressure', e.target.value)} placeholder="BP: 120/80" className="form-input" />
                  <input type="number" value={formData.vitalSigns.heartRate} onChange={(e) => handleInputChange('vitalSigns', 'heartRate', e.target.value)} placeholder="HR (bpm)" className="form-input" />
                  <input type="number" step="0.1" value={formData.vitalSigns.temperature} onChange={(e) => handleInputChange('vitalSigns', 'temperature', e.target.value)} placeholder="Temp (°F)" className="form-input" />
                  <input type="number" step="0.1" value={formData.vitalSigns.weight} onChange={(e) => handleInputChange('vitalSigns', 'weight', e.target.value)} placeholder="Weight (kg)" className="form-input" />
                  <input type="number" step="0.1" value={formData.vitalSigns.height} onChange={(e) => handleInputChange('vitalSigns', 'height', e.target.value)} placeholder="Height (cm)" className="form-input" />
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Diagnosis</h3>
                <div className="space-y-3">
                  <input type="text" value={formData.diagnosis.mainProblem} onChange={(e) => handleInputChange('diagnosis', 'mainProblem', e.target.value)} placeholder="Main Problem" className="form-input" />
                  <input type="text" value={formData.diagnosis.symptoms} onChange={(e) => handleInputChange('diagnosis', 'symptoms', e.target.value)} placeholder="Symptoms (comma-separated)" className="form-input" />
                  <textarea value={formData.diagnosis.notes} onChange={(e) => handleInputChange('diagnosis', 'notes', e.target.value)} rows={2} placeholder="Diagnosis notes..." className="form-textarea" />
                </div>
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Medications</h3>
                {formData.treatment.medications.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.treatment.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <p className="font-medium">{med.name} - {med.dosage}</p>
                          <p className="text-sm text-gray-600">{med.frequency} for {med.duration}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveMedication(index)} className="text-red-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-blue-50 p-3 rounded space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={currentMedication.name} onChange={(e) => setCurrentMedication(prev => ({ ...prev, name: e.target.value }))} placeholder="Name" className="form-input" />
                    <input type="text" value={currentMedication.dosage} onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))} placeholder="Dosage" className="form-input" />
                    <input type="text" value={currentMedication.frequency} onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))} placeholder="Frequency" className="form-input" />
                    <input type="text" value={currentMedication.duration} onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))} placeholder="Duration" className="form-input" />
                  </div>
                  <button type="button" onClick={handleAddMedication} className="btn btn-sm btn-primary">
                    <Plus className="h-4 w-4 mr-1" />Add
                  </button>
                </div>
              </div>

              {/* Doctor Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor's Notes</label>
                <textarea value={formData.doctorNotes} onChange={(e) => handleInputChange(null, 'doctorNotes', e.target.value)} rows={3} placeholder="Additional notes..." className="form-textarea" />
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn btn-outline">Cancel</button>
                <button type="submit" disabled={createRecordMutation.isLoading} className="btn btn-primary">
                  {createRecordMutation.isLoading ? <><LoadingSpinner /><span className="ml-2">Creating...</span></> : <><Save className="h-4 w-4 mr-2" />Create Record</>}
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
