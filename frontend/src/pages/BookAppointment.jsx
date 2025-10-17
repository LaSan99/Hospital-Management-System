import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  Calendar,
  Clock,
  User,
  FileText,
  Activity,
  DollarSign,
  ArrowLeft,
  Save,
  X,
  Star,
  MapPin,
  Shield,
  CheckCircle,
  ChevronRight,
  Sparkles,
  Zap,
  Crown,
  TrendingUp
} from 'lucide-react'
import { doctorsAPI, appointmentsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const generateHardcodedSlots = () => {
  const slots = []
  const startHour = 9
  const endHour = 17
  const slotDuration = 30
  const lunchStart = 13
  const lunchEnd = 14

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      if (hour >= lunchStart && hour < lunchEnd) continue

      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const totalMinutes = hour * 60 + minute + slotDuration
      const endHourCalc = Math.floor(totalMinutes / 60)
      const endMinuteCalc = totalMinutes % 60
      const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`

      if (endHourCalc <= endHour) {
        const isPopular = (hour === 10 || hour === 14) && minute === 0
        const isEarly = hour <= 11
        const isPeak = hour >= 14 && hour <= 16
        slots.push({ startTime, endTime, isPopular, isEarly, isPeak })
      }
    }
  }

  return slots
}

const BookAppointment = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const doctorId = searchParams.get('doctorId') || location.state?.doctorId
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [timeFilter, setTimeFilter] = useState('all') // all, morning, afternoon
  const [bookingForm, setBookingForm] = useState({
    appointmentType: 'consultation',
    reason: '',
    symptoms: [],
    urgency: 'routine'
  })

  const { data: doctorData, isLoading: doctorLoading, error: doctorError } = useQuery(
    ['doctor', doctorId],
    () => doctorsAPI.getById(doctorId),
    {
      enabled: !!doctorId,
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  const { data: slotsData, isLoading: slotsLoading } = useQuery(
    ['doctor-availability', doctorId, selectedDate],
    () => appointmentsAPI.getAvailability(doctorId, selectedDate),
    {
      enabled: !!doctorId && !!selectedDate,
      retry: 1
    }
  )

  const createAppointmentMutation = useMutation(
    (appointmentData) => appointmentsAPI.create(appointmentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patient-appointments')
        toast.success('Appointment booked successfully!')
        navigate('/appointments')
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to book appointment')
      }
    }
  )

  const doctor = doctorData?.data?.data?.doctor || doctorData?.data?.doctor || doctorData?.data
  
  const apiSlots = slotsData?.data?.availableSlots || []
  const hardcodedSlots = generateHardcodedSlots()
  const allSlots = apiSlots.length > 0 ? apiSlots.map(slot => ({ ...slot, isPopular: false, isEarly: false, isPeak: false })) : hardcodedSlots

  // Filter slots based on time filter
  const filteredSlots = allSlots.filter(slot => {
    const hour = parseInt(slot.startTime.split(':')[0])
    if (timeFilter === 'morning') return hour < 12
    if (timeFilter === 'afternoon') return hour >= 12
    return true
  })

  // Group slots by time period for better organization
  const morningSlots = allSlots.filter(slot => parseInt(slot.startTime.split(':')[0]) < 12)
  const afternoonSlots = allSlots.filter(slot => parseInt(slot.startTime.split(':')[0]) >= 12)

  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (!doctorId) {
      toast.error('No doctor selected')
      navigate('/doctors')
    }
  }, [doctorId, navigate])

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBookingForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSymptomChange = (e) => {
    const value = e.target.value
    const symptoms = value.split(',').map(s => s.trim()).filter(s => s)
    setBookingForm(prev => ({
      ...prev,
      symptoms
    }))
  }

  const nextStep = () => {
    if (currentStep === 1 && (!selectedDate || !selectedSlot)) {
      toast.error('Please select date and time')
      return
    }
    if (currentStep === 2 && !bookingForm.reason.trim()) {
      toast.error('Please provide reason for visit')
      return
    }
    setCurrentStep(prev => prev + 1)
  }

  const prevStep = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmitBooking = (e) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedSlot || !bookingForm.reason.trim()) {
      toast.error('Please complete all required fields')
      return
    }

    const appointmentData = {
      doctorId: doctorId,
      appointmentDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      appointmentType: bookingForm.appointmentType,
      reason: bookingForm.reason,
      symptoms: bookingForm.symptoms,
      urgency: bookingForm.urgency
    }

    createAppointmentMutation.mutate(appointmentData)
  }

  const formatDisplayDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getTimePeriod = (time) => {
    const hour = parseInt(time.split(':')[0])
    return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  }

  if (doctorLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctor information...</p>
        </div>
      </div>
    )
  }

  if (doctorError || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Doctor Not Found</h3>
          <p className="text-gray-600 mb-6">
            {doctorError?.response?.data?.message || 'Failed to load doctor details.'}
          </p>
          <button 
            onClick={() => navigate('/doctors')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Back to Doctors
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/doctors')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Doctors
          </button>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Appointment</h1>
            <p className="text-gray-600">Schedule your consultation with Dr. {doctor.firstName} {doctor.lastName}</p>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6 max-w-md mx-auto">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-700">
                    {step === 1 && 'Time'}
                    {step === 2 && 'Details'}
                    {step === 3 && 'Confirm'}
                  </div>
                  {step < 3 && (
                    <div className={`mx-4 w-8 h-0.5 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Doctor Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                  <span className="text-white font-semibold text-lg">
                    {getInitials(doctor.firstName, doctor.lastName)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h3>
                <p className="text-blue-600 text-sm mb-2">{doctor.specialization || 'General Practice'}</p>
                <div className="flex items-center justify-center space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-gray-600">Experience</p>
                    <p className="font-medium text-gray-900">
                      {doctor.experience ? `${doctor.experience} years` : 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-gray-600">Consultation Fee</p>
                    <p className="font-medium text-gray-900">
                      ${doctor.consultationFee || 'Not specified'}
                    </p>
                  </div>
                </div>

                {doctor.phone && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="text-gray-600">Contact</p>
                      <p className="font-medium text-gray-900">{doctor.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium text-gray-900">License Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Step 1: Date & Time */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {selectedDate && (
                        <p className="text-sm text-gray-600 mt-2">
                          {formatDisplayDate(selectedDate)}
                        </p>
                      )}
                    </div>

                    {selectedDate && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Available Time Slots
                          </label>
                          
                          {/* Time Filter Buttons */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setTimeFilter('all')}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                timeFilter === 'all' 
                                  ? 'bg-blue-100 border-blue-500 text-blue-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              All Times
                            </button>
                            <button
                              onClick={() => setTimeFilter('morning')}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                timeFilter === 'morning' 
                                  ? 'bg-orange-100 border-orange-500 text-orange-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Morning
                            </button>
                            <button
                              onClick={() => setTimeFilter('afternoon')}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                timeFilter === 'afternoon' 
                                  ? 'bg-purple-100 border-purple-500 text-purple-700' 
                                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              Afternoon
                            </button>
                          </div>
                        </div>
                        
                        {!slotsLoading && apiSlots.length === 0 && hardcodedSlots.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center">
                              <Sparkles className="h-4 w-4 text-blue-600 mr-2" />
                              <p className="text-sm text-blue-700">
                                Showing standard clinic hours (9 AM - 5 PM)
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {slotsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                              <p className="text-gray-600 text-sm">Loading available slots...</p>
                            </div>
                          </div>
                        ) : filteredSlots.length > 0 ? (
                          <div className="space-y-6">
                            {/* Morning Slots Section */}
                            {timeFilter !== 'afternoon' && morningSlots.length > 0 && (
                              <div>
                                <div className="flex items-center mb-3">
                                  <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full mr-2"></div>
                                  <h3 className="text-sm font-semibold text-gray-700">Morning Sessions</h3>
                                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {morningSlots.length} slots
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {morningSlots.map((slot, index) => (
                                    <TimeSlotButton
                                      key={index}
                                      slot={slot}
                                      isSelected={selectedSlot?.startTime === slot.startTime}
                                      onSelect={handleSlotSelect}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Afternoon Slots Section */}
                            {timeFilter !== 'morning' && afternoonSlots.length > 0 && (
                              <div>
                                <div className="flex items-center mb-3">
                                  <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mr-2"></div>
                                  <h3 className="text-sm font-semibold text-gray-700">Afternoon Sessions</h3>
                                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {afternoonSlots.length} slots
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {afternoonSlots.map((slot, index) => (
                                    <TimeSlotButton
                                      key={index}
                                      slot={slot}
                                      isSelected={selectedSlot?.startTime === slot.startTime}
                                      onSelect={handleSlotSelect}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                            <p className="text-yellow-700 font-medium">No available slots</p>
                            <p className="text-yellow-600 text-sm mt-1">
                              Please select another date for available appointments
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Slot Summary */}
                  {selectedSlot && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-800 font-medium">Selected Time Slot</p>
                          <p className="text-green-700">
                            {formatDisplayDate(selectedDate)} at {selectedSlot.startTime} - {selectedSlot.endTime}
                          </p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={nextStep}
                      disabled={!selectedSlot}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-8 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md flex items-center"
                    >
                      Continue to Details
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Details - Same as before but cleaned up */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Appointment Type
                      </label>
                      <select
                        name="appointmentType"
                        value={bookingForm.appointmentType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="consultation">General Consultation</option>
                        <option value="follow_up">Follow-up Visit</option>
                        <option value="checkup">Routine Checkup</option>
                        <option value="emergency">Urgent Care</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Urgency Level
                      </label>
                      <select
                        name="urgency"
                        value={bookingForm.urgency}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="routine">Routine (Non-urgent)</option>
                        <option value="soon">Soon (Within week)</option>
                        <option value="urgent">Urgent (48 hours)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason for Visit *
                      </label>
                      <textarea
                        name="reason"
                        value={bookingForm.reason}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        placeholder="Please describe the reason for your appointment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Symptoms (Optional)
                      </label>
                      <input
                        type="text"
                        value={bookingForm.symptoms.join(', ')}
                        onChange={handleSymptomChange}
                        placeholder="Fever, headache, cough..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Separate symptoms with commas
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!bookingForm.reason.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review - Same as before */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Appointment</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Appointment Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Doctor:</span>
                        <span className="font-medium">Dr. {doctor.firstName} {doctor.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDisplayDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{bookingForm.appointmentType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee:</span>
                        <span className="font-medium">${doctor.consultationFee || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Reason:</p>
                      <p className="text-sm text-gray-900">{bookingForm.reason}</p>
                    </div>

                    {bookingForm.symptoms.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Symptoms:</p>
                        <div className="flex flex-wrap gap-1">
                          {bookingForm.symptoms.map((symptom, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </button>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigate('/doctors')}
                        className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitBooking}
                        disabled={createAppointmentMutation.isLoading}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-6 rounded-lg font-medium transition-colors flex items-center"
                      >
                        {createAppointmentMutation.isLoading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span className="ml-2">Booking...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Confirm Booking
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Time Slot Button Component
const TimeSlotButton = ({ slot, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      className={`p-4 text-center border-2 rounded-xl transition-all duration-200 group relative overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-lg scale-105'
          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:shadow-md'
      }`}
    >
      {/* Background effect for selected state */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
      )}
      
      {/* Popular badge */}
      {slot.isPopular && !isSelected && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Popular
          </div>
        </div>
      )}

      {/* Early bird badge */}
      {slot.isEarly && !isSelected && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            Early
          </div>
        </div>
      )}

      {/* Peak hour badge */}
      {slot.isPeak && !isSelected && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
            Peak
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div className={`text-lg font-semibold mb-1 ${
          isSelected ? 'text-white' : 'text-gray-900'
        }`}>
          {slot.startTime}
        </div>
        <div className={`text-xs ${
          isSelected ? 'text-blue-100' : 'text-gray-500'
        }`}>
          to {slot.endTime}
        </div>
        
        {/* Session type indicator */}
        {!isSelected && (
          <div className="mt-2">
            <div className={`w-2 h-2 rounded-full mx-auto ${
              parseInt(slot.startTime.split(':')[0]) < 12 
                ? 'bg-orange-400' 
                : 'bg-purple-400'
            }`}></div>
          </div>
        )}
      </div>

      {/* Hover effect */}
      {!isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-200"></div>
      )}
    </button>
  )
}

export default BookAppointment