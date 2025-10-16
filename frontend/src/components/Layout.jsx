import React, { useState } from 'react'
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
  Activity
} from 'lucide-react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isAdmin, isDoctor, isStaff, isPatient } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'staff', 'doctor', 'patient'] },
    { name: 'Patients', href: '/patients', icon: Users, roles: ['admin', 'staff'] },
    { name: 'Doctors', href: '/doctors', icon: UserCheck, roles: ['admin', 'staff', 'patient'] },
    { name: 'Appointments', href: '/appointments', icon: Calendar, roles: ['admin', 'staff', 'doctor', 'patient'] },
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
            <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                2
              </span>
            </button>
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
  )
}

export default Layout