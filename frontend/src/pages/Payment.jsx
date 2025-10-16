import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { CreditCard, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { appointmentsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const Payment = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const appointmentId = searchParams.get('appointmentId')
  const { user } = useAuth()

  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: ''
  })

  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)

  // Fetch appointment details
  const { data: appointmentData, isLoading, error } = useQuery(
    ['appointment', appointmentId],
    () => appointmentsAPI.getById(appointmentId),
    {
      enabled: !!appointmentId,
      retry: 1
    }
  )

  const appointment = appointmentData?.data?.data?.appointment || appointmentData?.data?.appointment

  // Payment mutation
  const paymentMutation = useMutation(
    (id) => appointmentsAPI.processPayment(id),
    {
      onSuccess: () => {
        toast.success('Payment successful!')
        setTimeout(() => {
          navigate('/appointments')
        }, 2000)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Payment failed')
        setProcessing(false)
      }
    }
  )

  useEffect(() => {
    if (!appointmentId) {
      toast.error('No appointment selected')
      navigate('/appointments')
    }
  }, [appointmentId, navigate])

  useEffect(() => {
    if (appointment && appointment.paymentStatus) {
      toast.info('This appointment is already paid')
      navigate('/appointments')
    }
  }, [appointment, navigate])

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardDetails({ ...cardDetails, cardNumber: formatted })
    if (errors.cardNumber) {
      setErrors({ ...errors, cardNumber: '' })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCardDetails({ ...cardDetails, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Card number validation (16 digits)
    const cardNumberDigits = cardDetails.cardNumber.replace(/\s/g, '')
    if (!cardNumberDigits) {
      newErrors.cardNumber = 'Card number is required'
    } else if (cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits'
    }

    // Card holder validation
    if (!cardDetails.cardHolder.trim()) {
      newErrors.cardHolder = 'Card holder name is required'
    }

    // Expiry month validation
    if (!cardDetails.expiryMonth) {
      newErrors.expiryMonth = 'Expiry month is required'
    }

    // Expiry year validation
    if (!cardDetails.expiryYear) {
      newErrors.expiryYear = 'Expiry year is required'
    } else {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth() + 1
      const selectedYear = parseInt(cardDetails.expiryYear)
      const selectedMonth = parseInt(cardDetails.expiryMonth)

      if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
        newErrors.expiryYear = 'Card has expired'
      }
    }

    // CVV validation
    if (!cardDetails.cvv) {
      newErrors.cvv = 'CVV is required'
    } else if (cardDetails.cvv.length !== 3) {
      newErrors.cvv = 'CVV must be 3 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setProcessing(true)

    // Simulate payment processing delay
    setTimeout(() => {
      paymentMutation.mutate(appointmentId)
    }, 2000)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error || !appointment) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Error Loading Appointment</h3>
          </div>
          <p className="text-red-600 mb-4">
            {error?.response?.data?.message || 'Failed to load appointment details.'}
          </p>
          <button onClick={() => navigate('/appointments')} className="btn btn-primary">
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/appointments')}
          className="btn btn-outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment</h1>
          <p className="text-gray-600">Complete your appointment payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Card Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number *
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className={`form-input ${errors.cardNumber ? 'border-red-500' : ''}`}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Card Holder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Holder Name *
                </label>
                <input
                  type="text"
                  name="cardHolder"
                  value={cardDetails.cardHolder}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`form-input ${errors.cardHolder ? 'border-red-500' : ''}`}
                />
                {errors.cardHolder && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardHolder}</p>
                )}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month *
                  </label>
                  <select
                    name="expiryMonth"
                    value={cardDetails.expiryMonth}
                    onChange={handleInputChange}
                    className={`form-select ${errors.expiryMonth ? 'border-red-500' : ''}`}
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month.toString().padStart(2, '0')}>
                        {month.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                  {errors.expiryMonth && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryMonth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year *
                  </label>
                  <select
                    name="expiryYear"
                    value={cardDetails.expiryYear}
                    onChange={handleInputChange}
                    className={`form-select ${errors.expiryYear ? 'border-red-500' : ''}`}
                  >
                    <option value="">YYYY</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.expiryYear && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryYear}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV *
                  </label>
                  <input
                    type="text"
                    name="cvv"
                    value={cardDetails.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength="3"
                    className={`form-input ${errors.cvv ? 'border-red-500' : ''}`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Lock className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Secure Payment</p>
                    <p className="text-sm text-blue-700">
                      Your payment information is encrypted and secure. This is a demo payment system.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="btn btn-primary w-full"
              >
                {processing ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ${appointment.consultationFee || '0.00'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Appointment with:</span>
                <span className="font-medium text-gray-900">Dr. {appointment.doctorName}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Specialization:</span>
                <span className="font-medium text-gray-900">{appointment.doctorSpecialization}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(appointment.appointmentDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium text-gray-900">
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Consultation Fee:</span>
                <span className="font-medium text-gray-900">${appointment.consultationFee || '0.00'}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Fee:</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
              
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-blue-600 text-lg">
                  ${appointment.consultationFee || '0.00'}
                </span>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 text-center">
                By completing this payment, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
