import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PatientHome from "./pages/PatientHome";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";
import PatientDoctors from "./pages/PatientDoctors";
import BookAppointment from "./pages/BookAppointment";
import MedicalRecords from "./pages/MedicalRecords";
import PatientMedicalRecords from "./pages/PatientMedicalRecords";
import DoctorMedicalRecords from "./pages/DoctorMedicalRecords";
import HealthCards from "./pages/HealthCards";
import Profile from "./pages/Profile";
import LoadingSpinner from "./components/LoadingSpinner";
import PatientTreatmentRecords from "./pages/PatientTreatmentRecords";
import Payment from "./pages/Payment";
import PatientHealthCard from "./pages/PatientHealthCard";
import PatientDetail from "./pages/PatientDetail";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={user?.role === "patient" ? <PatientHome /> : <Dashboard />}
        />
        <Route
          path="patient-home"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientHome />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<Profile />} />

        {/* Patient Management */}
        <Route
          path="patients"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <Patients />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <PatientDetail />
            </ProtectedRoute>
          }
        />

        {/* Doctor Management */}
        <Route
          path="doctors"
          element={user?.role === "patient" ? <PatientDoctors /> : <Doctors />}
        />

        {/* Appointments */}
        <Route
          path="appointments"
          element={
            user?.role === "patient" ? (
              <PatientAppointments />
            ) : user?.role === "doctor" ? (
              <DoctorAppointments />
            ) : (
              <Appointments />
            )
          }
        />
        <Route
          path="book-appointment"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />

        {/* Medical Records */}
        <Route
          path="medical-records"
          element={
            user?.role === "patient" ? (
              <PatientMedicalRecords />
            ) : user?.role === "doctor" ? (
              <DoctorMedicalRecords />
            ) : (
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <MedicalRecords />
              </ProtectedRoute>
            )
          }
        />

        {/* Treatment Records (Patient-only) */}
        <Route
          path="treatment-records"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <PatientTreatmentRecords />
            </ProtectedRoute>
          }
        />

        {/* Payment (Patient-only) */}
        <Route
          path="payment"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>
              <Payment />
            </ProtectedRoute>
          }
        />

        {/* Health Cards */}
        <Route
          path="health-cards"
          element={
            user?.role === "patient" ? (
              <PatientHealthCard />
            ) : (
              <ProtectedRoute allowedRoles={["admin", "staff"]}>
                <HealthCards />
              </ProtectedRoute>
            )
          }
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
