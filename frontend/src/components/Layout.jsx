import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  UserCheck, 
  Calendar, 
  FileText, 
  CreditCard, 
  ClipboardList, 
  User, 
  LogOut,
  Bell,
  Search,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  UserPlus,
  FileCheck,
  CreditCard as CardIcon,
  Calendar as CalendarIcon,
  Stethoscope,
  Heart,
  Shield
} from 'lucide-react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const { user, logout, isAdmin, isDoctor, isStaff, isPatient } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Generate dummy notifications based on user role
  const generateDummyNotifications = (userRole) => {
    const baseNotifications = [
      {
        id: 1,
        type: 'info',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2:00 AM to 4:00 AM',
        time: '2 hours ago',
        icon: Info,
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Welcome to MediCare',
        message: 'Your account has been successfully set up and verified',
        time: '1 day ago',
        icon: CheckCircle,
        read: false
      }
    ]

    const roleSpecificNotifications = {
      admin: [
        {
          id: 3,
          type: 'warning',
          title: 'New Patient Registration',
          message: '5 new patients have registered and need approval',
          time: '30 minutes ago',
          icon: UserPlus,
          read: false
        },
        {
          id: 4,
          type: 'info',
          title: 'Health Card Request',
          message: '3 new health card requests are pending approval',
          time: '1 hour ago',
          icon: CardIcon,
          read: false
        },
        {
          id: 5,
          type: 'success',
          title: 'Monthly Report Ready',
          message: 'Your monthly hospital statistics report is now available',
          time: '3 hours ago',
          icon: FileCheck,
          read: true
        }
      ],
      doctor: [
        {
          id: 3,
          type: 'info',
          title: 'New Appointment',
          message: 'You have a new appointment with John Smith at 2:00 PM',
          time: '15 minutes ago',
          icon: CalendarIcon,
          read: false
        },
        {
          id: 4,
          type: 'warning',
          title: 'Patient Update',
          message: 'Patient Sarah Johnson has updated their medical information',
          time: '45 minutes ago',
          icon: Stethoscope,
          read: false
        },
        {
          id: 5,
          type: 'info',
          title: 'Schedule Reminder',
          message: 'Your next appointment is in 30 minutes with Dr. Williams',
          time: '2 hours ago',
          icon: Clock,
          read: true
        }
      ],
      patient: [
        {
          id: 3,
          type: 'success',
          title: 'Appointment Confirmed',
          message: 'Your appointment with Dr. Johnson has been confirmed for tomorrow at 10:00 AM',
          time: '1 hour ago',
          icon: CheckCircle,
          read: false
        },
        {
          id: 4,
          type: 'info',
          title: 'Health Card Status',
          message: 'Your health card application is under review',
          time: '2 hours ago',
          icon: CardIcon,
          read: false
        },
        {
          id: 5,
          type: 'warning',
          title: 'Prescription Reminder',
          message: 'Your prescription for medication is due for renewal',
          time: '1 day ago',
          icon: Heart,
          read: true
        }
      ],
      staff: [
        {
          id: 3,
          type: 'info',
          title: 'New Patient Check-in',
          message: 'Patient Michael Brown has arrived for their appointment',
          time: '20 minutes ago',
          icon: UserPlus,
          read: false
        },
        {
          id: 4,
          type: 'warning',
          title: 'Equipment Maintenance',
          message: 'X-ray machine in Room 3 requires scheduled maintenance',
          time: '1 hour ago',
          icon: AlertTriangle,
          read: false
        },
        {
          id: 5,
          type: 'success',
          title: 'Daily Report Complete',
          message: 'All daily patient records have been processed successfully',
          time: '4 hours ago',
          icon: FileCheck,
          read: true
        }
      ]
    }

    return [...baseNotifications, ...(roleSpecificNotifications[userRole] || [])]
  }

  // Initialize notifications based on user role
  useEffect(() => {
    if (user?.role) {
      setNotifications(generateDummyNotifications(user.role))
    }
  }, [user?.role])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsOpen && !event.target.closest('.notification-dropdown')) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationsOpen])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      default:
        return Bell
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-emerald-600 bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-200'
      case 'warning':
        return 'text-amber-600 bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-200'
      case 'info':
        return 'text-blue-600 bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200'
      default:
        return 'text-gray-600 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200'
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'staff', 'doctor', 'patient'] },
    { name: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'staff'] },
    { name: 'Doctors', href: '/doctors', icon: UserCheck, roles: ['admin', 'staff', 'patient'] },
    { name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['staff', 'doctor', 'patient'] },
    { name: 'Medical Records', href: '/medical-records', icon: FileText, roles: ['admin', 'staff', 'doctor'] },
    { name: 'Health Cards', href: '/health-cards', icon: CreditCard, roles: ['admin', 'staff'] },
  ]

  // Patient-specific navigation (simpler)
  const patientNavigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Find Doctors', href: '/doctors', icon: UserCheck },
    { name: 'My Appointments', href: '/appointments', icon: Calendar },
    { name: 'My Records', href: '/medical-records', icon: FileText },
    { name: 'Treatment Plan', href: '/treatment-records', icon: ClipboardList },
  ]

  // Use patient navigation for patients, regular navigation for others
  const filteredNavigation = user?.role === 'patient' 
    ? patientNavigation 
    : navigation.filter(item => item.roles.includes(user?.role))

  const isActive = (path) => location.pathname === path

  return (
    <>
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: slideInFromTop 0.2s ease-out forwards;
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 6px;
        }
        
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
      `}</style>
      <div className="flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-2">
              <Activity className="text-white h-6 w-6" />
              <span className="font-bold text-xl">MediCare</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-blue-200 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-blue-200 text-xs px-6 -mt-2 shrink-0">Hospital Management</p>
          <nav className="mt-8 flex-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault()
                    navigate(item.href)
                    setSidebarOpen(false)
                  }}
                  className={`flex items-center px-6 py-3.5 text-sm transition-all duration-150 relative ${
                    isActive(item.href)
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-blue-100 hover:bg-white/5'
                  }`}
                >
                  {isActive(item.href) && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r"></div>
                  )}
                  <span className={`mr-3 ${isActive(item.href) ? 'text-white' : 'text-blue-200'}`}>
                    <Icon size={18} />
                  </span>
                  {item.name}
                </a>
              )
            })}
          </nav>
          <div className="shrink-0 p-4 border-t border-blue-600/30">
            <div className="bg-blue-800/50 rounded-lg p-4 text-center">
              <p className="text-blue-200 text-xs">Need help?</p>
              <button className="mt-2 bg-white text-blue-800 rounded-lg py-2 px-4 text-sm font-medium w-full hover:bg-blue-50 transition-all">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar - Fixed */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-xl z-40">
        <div className="p-6 shrink-0">
          <div className="flex items-center space-x-2">
            <Activity className="text-white h-6 w-6" />
            <span className="font-bold text-xl">MediCare</span>
          </div>
          <p className="text-blue-200 text-xs mt-1">Hospital Management</p>
        </div>
        <nav className="mt-8 flex-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(item.href)
                }}
                className={`flex items-center px-6 py-3.5 text-sm transition-all duration-150 relative ${
                  isActive(item.href)
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-blue-100 hover:bg-white/5'
                }`}
              >
                {isActive(item.href) && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r"></div>
                )}
                <span className={`mr-3 ${isActive(item.href) ? 'text-white' : 'text-blue-200'}`}>
                  <Icon size={18} />
                </span>
                {item.name}
              </a>
            )
          })}
        </nav>
        <div className="shrink-0 p-4 border-t border-blue-600/30">
          <div className="bg-blue-800/50 rounded-lg p-4 text-center">
            <p className="text-blue-200 text-xs">Need help?</p>
            <button className="mt-2 bg-white text-blue-800 rounded-lg py-2 px-4 text-sm font-medium w-full hover:bg-blue-50 transition-all">
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:ml-64 flex-1 flex flex-col min-w-0">
        {/* Header - Fixed */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm fixed top-0 right-0 left-0 lg:left-64 z-30">
          <button
            type="button"
            className="lg:hidden -m-2.5 p-2.5 text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-5">
            <div className="relative notification-dropdown">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 group"
              >
                <Bell size={20} className={`transition-transform duration-200 ${notificationsOpen ? 'rotate-12' : 'group-hover:scale-110'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full shadow-lg animate-pulse border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[500px] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {/* Header with gradient background */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                          <Bell size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">Notifications</h3>
                          <p className="text-blue-100 text-sm">
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                          </p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                          <Bell size={24} className="text-gray-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">All caught up!</h4>
                        <p className="text-gray-500 text-sm">No new notifications at this time.</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {notifications.map((notification, index) => {
                          const IconComponent = getNotificationIcon(notification.type)
                          return (
                            <div
                              key={notification.id}
                              onClick={() => markAsRead(notification.id)}
                              className={`group relative p-4 mb-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                                !notification.read 
                                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 shadow-sm' 
                                  : 'hover:bg-gray-50'
                              }`}
                              style={{
                                animationDelay: `${index * 50}ms`,
                                animation: 'slideInFromRight 0.3s ease-out forwards'
                              }}
                            >
                              <div className="flex items-start space-x-4">
                                <div className={`p-3 rounded-full shadow-sm transition-all duration-200 group-hover:scale-110 ${getNotificationColor(notification.type)}`}>
                                  <IconComponent size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className={`text-sm font-semibold mb-1 transition-colors duration-200 ${
                                        !notification.read ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center space-x-2">
                                        <Clock size={12} className="text-gray-400" />
                                        <p className="text-xs text-gray-500 font-medium">
                                          {notification.time}
                                        </p>
                                      </div>
                                    </div>
                                    {!notification.read && (
                                      <div className="flex items-center space-x-2 ml-3">
                                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse shadow-sm"></div>
                                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Hover effect overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl pointer-events-none"></div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
                        </div>
                        <button
                          onClick={() => setNotificationsOpen(false)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center pl-5 border-l border-gray-100">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white mr-3 shadow-md">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="mr-6">
                <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/profile')}
                  className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 py-1.5 px-2 rounded-md transition-colors"
                >
                  Profile
                </button>
                <div 
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer hover:bg-gray-50 py-1.5 px-2 rounded-md transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={16} className="mr-1" />
                  Logout
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content - Scrollable with no padding/margin */}
        <main className="flex-1 overflow-auto mt-16 p-0 m-0">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  )
}

export default Layout