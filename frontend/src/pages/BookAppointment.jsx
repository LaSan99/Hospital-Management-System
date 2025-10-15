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
  X
} from 'lucide-react'
import { doctorsAPI, appointmentsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

// Hardcoded time slots generator (fallback)
// This function generates time slots when the API is unavailable or returns no slots
// CUSTOMIZE HERE:
// - startHour: Opening time (24-hour format, e.g., 9 = 9 AM)
// - endHour: Closing time (24-hour format, e.g., 17 = 5 PM)
// - slotDuration: Length of each appointment in minutes (e.g., 30, 60)
// - lunchStart/lunchEnd: Lunch break period (set both to 0 to disable)
const generateHardcodedSlots = () => {
  const slots = []
  const startHour = 9          // 9 AM
  const endHour = 17           // 5 PM
  const slotDuration = 30      // 30 minutes per slot
  const lunchStart = 13        // 1 PM (lunch break start)
  const lunchEnd = 14          // 2 PM (lunch break end)

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      // Skip lunch break
      if (hour >= lunchStart && hour < lunchEnd) {
        continue
      }

      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const totalMinutes = hour * 60 + minute + slotDuration
      const endHourCalc = Math.floor(totalMinutes / 60)
      const endMinuteCalc = totalMinutes % 60
      const endTime = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`

      if (endHourCalc <= endHour) {
        slots.push({ startTime, endTime })
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

  // Get doctor ID from URL params or location state
  const doctorId = searchParams.get('doctorId') || location.state?.doctorId
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [bookingForm, setBookingForm] = useState({
    appointmentType: 'consultation',
    reason: '',
    symptoms: []
  })

  // Fetch doctor details
  const { data: doctorData, isLoading: doctorLoading, error: doctorError } = useQuery(
    ['doctor', doctorId],
    () => doctorsAPI.getById(doctorId),
    {
      enabled: !!doctorId,
      retry: 1,
      refetchOnWindowFocus: false
    }
  )

  // Fetch available time slots for selected doctor
  const { data: slotsData, isLoading: slotsLoading } = useQuery(
    ['doctor-availability', doctorId, selectedDate],
    () => appointmentsAPI.getAvailability(doctorId, selectedDate),
    {
      enabled: !!doctorId && !!selectedDate,
      retry: 1
    }
  )

  // Create appointment mutation
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
  
  // Use API slots if available, otherwise use hardcoded slots
  const apiSlots = slotsData?.data?.availableSlots || []
  const hardcodedSlots = generateHardcodedSlots()
  const slots = apiSlots.length > 0 ? apiSlots : hardcodedSlots

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setSelectedDate(tomorrow.toISOString().split('T')[0])
  }, [])

  // Redirect if no doctor ID
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

  const handleSubmitBooking = (e) => {
    e.preventDefault()
    
    console.log('Form submitted')
    console.log('Selected Date:', selectedDate)
    console.log('Selected Slot:', selectedSlot)
    console.log('Booking Form:', bookingForm)
    console.log('Doctor ID:', doctorId)
    
    if (!selectedDate) {
      toast.error('Please select a date')
      return
    }
    
    if (!selectedSlot) {
      toast.error('Please select a time slot')
      return
    }
    
    if (!bookingForm.reason || bookingForm.reason.trim() === '') {
      toast.error('Please provide a reason for visit')
      return
    }

    const appointmentData = {
      doctorId: doctorId,
      appointmentDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      appointmentType: bookingForm.appointmentType,
      reason: bookingForm.reason,
      symptoms: bookingForm.symptoms
    }

    console.log('Submitting appointment data:', appointmentData)
    createAppointmentMutation.mutate(appointmentData)
  }

  if (doctorLoading) {
    return <LoadingSpinner />
  }

  if (doctorError || !doctor) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Doctor</h3>
          <p className="text-red-600">
            {doctorError?.response?.data?.message || 'Failed to load doctor details. Please try again.'}
          </p>
          <button 
            onClick={() => navigate('/doctors')}
            className="btn btn-outline mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Doctors
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/doctors')}
            className="btn btn-outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600">Schedule your appointment with the doctor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor Information Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Information</h2>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {getInitials(doctor.firstName, doctor.lastName)}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-lg">
                  Dr. {doctor.firstName} {doctor.lastName}
                </h3>
                <p className="text-sm text-gray-500">{doctor.specialization || 'General Practice'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Experience</p>
                  <p className="text-sm text-gray-600">
                    {doctor.experience ? `${doctor.experience} year${doctor.experience > 1 ? 's' : ''}` : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">License Number</p>
                  <p className="text-sm text-gray-600">{doctor.licenseNumber || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <DollarSign className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Consultation Fee</p>
                  <p className="text-sm text-gray-600">
                    ${doctor.consultationFee || 'Not specified'}
                  </p>
                </div>
              </div>

              {doctor.phone && (
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-sm text-gray-600">{doctor.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Appointment Details</h2>
            
            <form onSubmit={handleSubmitBooking} className="space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Select Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="form-input"
                />
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Available Time Slots *
                  </label>
                  
                  {/* Info banner when using hardcoded slots */}
                  {!slotsLoading && apiSlots.length === 0 && hardcodedSlots.length > 0 && (
                    <div className="mb-3 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
                      ℹ️ Showing default time slots (9 AM - 5 PM, excluding 1-2 PM lunch break)
                    </div>
                  )}
                  
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                      <span className="ml-2 text-gray-600">Loading available slots...</span>
                    </div>
                  ) : slots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {slots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-3 text-sm border rounded-lg transition-all ${
                            selectedSlot && selectedSlot.startTime === slot.startTime
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-medium">{slot.startTime}</div>
                          <div className="text-xs opacity-75">to {slot.endTime}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        No available slots for this date. Please select another date.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Appointment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Activity className="h-4 w-4 inline mr-2" />
                  Appointment Type *
                </label>
                <select
                  name="appointmentType"
                  value={bookingForm.appointmentType}
                  onChange={handleInputChange}
                  required
                  className="form-select"
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="checkup">Checkup</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Reason for Visit *
                </label>
                <textarea
                  name="reason"
                  value={bookingForm.reason}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Please describe the reason for your appointment..."
                  className="form-textarea"
                />
              </div>

              {/* Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Activity className="h-4 w-4 inline mr-2" />
                  Symptoms (optional)
                </label>
                <input
                  type="text"
                  value={bookingForm.symptoms.join(', ')}
                  onChange={handleSymptomChange}
                  placeholder="Enter symptoms separated by commas (e.g., fever, headache, cough)"
                  className="form-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple symptoms with commas
                </p>
              </div>

              {/* Summary Box */}
              {selectedSlot && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Appointment Summary</h3>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Doctor:</strong> Dr. {doctor.firstName} {doctor.lastName}</p>
                    <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                    <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                    <p><strong>Type:</strong> {bookingForm.appointmentType.replace('_', ' ').charAt(0).toUpperCase() + bookingForm.appointmentType.slice(1).replace('_', ' ')}</p>
                    <p><strong>Consultation Fee:</strong> ${doctor.consultationFee || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t">
                {(!selectedSlot || !bookingForm.reason.trim()) && (
                  <div className="mb-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <strong>Required:</strong>
                    {!selectedSlot && <span> Select a time slot.</span>}
                    {!bookingForm.reason.trim() && <span> Provide a reason for visit.</span>}
                  </div>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/doctors')}
                    className="btn btn-outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAppointmentMutation.isLoading || !selectedSlot || !bookingForm.reason.trim()}
                    className={`btn btn-primary ${(createAppointmentMutation.isLoading || !selectedSlot || !bookingForm.reason.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!selectedSlot ? 'Please select a time slot' : !bookingForm.reason.trim() ? 'Please provide a reason for visit' : ''}
                  >
                    {createAppointmentMutation.isLoading ? (
                      <>
                        <LoadingSpinner />
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
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookAppointment
