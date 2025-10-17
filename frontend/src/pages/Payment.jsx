import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from 'react-query'
import { 
  CreditCard, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  Zap,
  Sparkles,
  Calendar,
  Clock,
  User,
  FileText,
  BadgeCheck,
  Eye,
  EyeOff
} from 'lucide-react'
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
  const [showCvv, setShowCvv] = useState(false)
  const [activeCard, setActiveCard] = useState('visa')

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
        toast.success('Payment successful! Your appointment is confirmed.')
        setTimeout(() => {
          navigate('/appointments')
        }, 2000)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Payment failed. Please try again.')
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

  const detectCardType = (number) => {
    const cleaned = number.replace(/\s/g, '')
    if (/^4/.test(cleaned)) {
      setActiveCard('visa')
    } else if (/^5[1-5]/.test(cleaned)) {
      setActiveCard('mastercard')
    } else if (/^3[47]/.test(cleaned)) {
      setActiveCard('amex')
    } else {
      setActiveCard('visa')
    }
  }

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardDetails({ ...cardDetails, cardNumber: formatted })
    detectCardType(formatted)
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

    // Card number validation
    const cardNumberDigits = cardDetails.cardNumber.replace(/\s/g, '')
    if (!cardNumberDigits) {
      newErrors.cardNumber = 'Card number is required'
    } else if (cardNumberDigits.length !== 16) {
      newErrors.cardNumber = 'Card number must be 16 digits'
    } else if (!/^\d+$/.test(cardNumberDigits)) {
      newErrors.cardNumber = 'Card number must contain only digits'
    }

    // Card holder validation
    if (!cardDetails.cardHolder.trim()) {
      newErrors.cardHolder = 'Card holder name is required'
    } else if (cardDetails.cardHolder.trim().length < 2) {
      newErrors.cardHolder = 'Please enter a valid name'
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
    } else if (!/^\d+$/.test(cardDetails.cvv)) {
      newErrors.cvv = 'CVV must contain only digits'
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

  const getCardIcon = (type) => {
    const icons = {
      visa: '💳',
      mastercard: '🔷', 
      amex: '🏦'
    }
    return icons[type] || '💳'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading payment details...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-red-800 mb-2">Payment Error</h3>
          <p className="text-red-600 mb-6">
            {error?.response?.data?.message || 'Failed to load appointment details.'}
          </p>
          <button 
            onClick={() => navigate('/appointments')}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/appointments')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Appointments
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center space-x-4">
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Secure Payment
                </h1>
                <p className="text-gray-600 text-lg">Complete your appointment booking with confidence</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                    <p className="text-gray-600">Enter your card information securely</p>
                  </div>
                </div>
                
                {/* Card Type Indicator */}
                <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-xl">
                  <span className="text-2xl">{getCardIcon(activeCard)}</span>
                  <span className="font-medium text-gray-700 capitalize">{activeCard}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card Number with Preview */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Card Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className={`w-full px-4 py-4 pl-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium ${
                        errors.cardNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                    />
                    <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {errors.cardNumber && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.cardNumber}
                    </p>
                  )}
                </div>

                {/* Card Holder */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Card Holder Name *
                  </label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardDetails.cardHolder}
                    onChange={handleInputChange}
                    placeholder="Enter name as shown on card"
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium ${
                      errors.cardHolder ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  />
                  {errors.cardHolder && (
                    <p className="text-red-500 text-sm mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.cardHolder}
                    </p>
                  )}
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Expiry Date *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <select
                          name="expiryMonth"
                          value={cardDetails.expiryMonth}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium ${
                            errors.expiryMonth ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <option key={month} value={month.toString().padStart(2, '0')}>
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        {errors.expiryMonth && (
                          <p className="text-red-500 text-sm mt-2">{errors.expiryMonth}</p>
                        )}
                      </div>
                      <div>
                        <select
                          name="expiryYear"
                          value={cardDetails.expiryYear}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium ${
                            errors.expiryYear ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        {errors.expiryYear && (
                          <p className="text-red-500 text-sm mt-2">{errors.expiryYear}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      CVV *
                    </label>
                    <div className="relative">
                      <input
                        type={showCvv ? "text" : "password"}
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength="3"
                        className={`w-full px-4 py-4 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-medium ${
                          errors.cvv ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(!showCvv)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCvv ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.cvv && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.cvv}
                      </p>
                    )}
                  </div>
                </div>

                {/* Security Features */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">Bank-Level Security</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center text-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          SSL Encrypted Connection
                        </div>
                        <div className="flex items-center text-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          PCI DSS Compliant
                        </div>
                        <div className="flex items-center text-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          No Card Data Stored
                        </div>
                        <div className="flex items-center text-blue-700">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          256-bit Encryption
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      
                      Pay Rs. {appointment.consultationFee || '0.00'} Now
                     
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Enhanced Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-green-100 p-2 rounded-xl">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Appointment Summary</h2>
              </div>
              
              {/* Doctor Info */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Dr. {appointment.doctorName}</p>
                    <p className="text-sm text-blue-700">{appointment.doctorSpecialization}</p>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Date</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Time</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {appointment.startTime} - {appointment.endTime}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BadgeCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Duration</span>
                  </div>
                  <span className="font-medium text-gray-900">30 minutes</span>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="font-medium text-gray-900">Rs.{appointment.consultationFee || '0.00'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium text-green-600">Rs.0.00</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Tax</span>
                  <span>Included</span>
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Total Amount</span>
                  <span className="font-bold text-blue-600 text-xl">
                    Rs. {appointment.consultationFee || '0.00'}
                  </span>
                </div>
              </div>

              {/* Guarantee */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-900">Money-Back Guarantee</span>
                </div>
                <p className="text-sm text-green-700">
                  Full refund if appointment is cancelled 24 hours in advance
                </p>
              </div>

              {/* Trust Badges */}
              <div className="mt-4 flex justify-between items-center">
                <div className="text-center">
                  <div className="text-2xl">🔒</div>
                  <p className="text-xs text-gray-500 mt-1">Secure</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl">⚡</div>
                  <p className="text-xs text-gray-500 mt-1">Instant</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl">🛡️</div>
                  <p className="text-xs text-gray-500 mt-1">Protected</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl">💎</div>
                  <p className="text-xs text-gray-500 mt-1">Guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment