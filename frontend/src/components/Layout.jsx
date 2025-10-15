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
  User, 
  LogOut,
  Bell
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
  ]

  // Use patient navigation for patients, regular navigation for others
  const filteredNavigation = user?.role === 'patient' 
    ? patientNavigation 
    : navigation.filter(item => item.roles.includes(user?.role))

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">Hospital Management</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
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
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">Hospital Management</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
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
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
              >
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="flex items-center gap-x-4">
                <div className="flex items-center gap-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-x-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="btn btn-outline btn-sm"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
