# Patient Doctors & Appointment Booking Feature

## Overview
This feature allows patients to view available doctors and book appointments directly through the web interface.

## Features Implemented

### 1. Patient Doctors View (`/doctors` for patients)
- **Location**: `frontend/src/pages/PatientDoctors.jsx`
- **Purpose**: Displays a list of available doctors with their information
- **Features**:
  - Search doctors by name or specialization
  - Filter by specialization
  - View doctor details (name, specialization, experience, consultation fee, contact info)
  - Book appointment button for each doctor

### 2. Appointment Booking Modal
- **Features**:
  - Doctor information display
  - Date selection (minimum date is today)
  - Available time slot selection (30-minute slots from 9 AM to 5 PM)
  - Appointment type selection (consultation, follow-up, checkup, emergency)
  - Reason for visit (required)
  - Symptoms input (optional, comma-separated)
  - Form validation and error handling

### 3. Navigation Updates
- **Layout**: Updated patient navigation to show "Find Doctors" instead of "Doctors"
- **Patient Home**: Added quick action buttons to navigate to doctors page
- **Patient Appointments**: Added "Book Appointment" button that links to doctors page

## Backend Endpoints Used

### 1. Get All Doctors
- **Endpoint**: `GET /api/doctors`
- **Description**: Returns list of all active doctors
- **Authentication**: Required

### 2. Get Doctor Availability
- **Endpoint**: `GET /api/appointments/availability/:doctorId?date=YYYY-MM-DD`
- **Description**: Returns available time slots for a specific doctor on a specific date
- **Authentication**: Not required (public endpoint)

### 3. Create Appointment
- **Endpoint**: `POST /api/appointments`
- **Description**: Creates a new appointment
- **Authentication**: Required
- **Body**:
  ```json
  {
    "doctorId": "string",
    "appointmentDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "appointmentType": "consultation|follow_up|checkup|emergency",
    "reason": "string",
    "symptoms": ["string"]
  }
  ```

## User Flow

1. **Patient logs in** and sees the patient dashboard
2. **Clicks "Find Doctors"** from navigation or quick actions
3. **Browses doctors** with search and filter options
4. **Clicks "Book Appointment"** on desired doctor
5. **Selects date** (minimum tomorrow)
6. **Views available time slots** for selected date
7. **Selects time slot** and fills appointment details
8. **Submits booking** and receives confirmation
9. **Appointment appears** in "My Appointments" page

## Technical Implementation

### Frontend
- **React Query** for data fetching and caching
- **React Hook Form** for form management
- **Toast notifications** for user feedback
- **Responsive design** with Tailwind CSS
- **Modal component** for booking interface

### Backend
- **MongoDB** for data storage
- **Express.js** for API endpoints
- **JWT authentication** for security
- **Time slot validation** to prevent double booking
- **Error handling** with proper HTTP status codes

## Security Features
- **Authentication required** for most endpoints
- **Input validation** on both frontend and backend
- **Time slot conflict checking** to prevent double booking
- **Role-based access control** (patients can only book for themselves)

## Error Handling
- **Network errors** are caught and displayed to user
- **Validation errors** show specific field errors
- **Time slot conflicts** are handled gracefully
- **Loading states** provide user feedback

## Future Enhancements
- **Real-time availability updates**
- **Doctor ratings and reviews**
- **Appointment rescheduling**
- **Email/SMS notifications**
- **Calendar integration**
- **Payment processing**
- **Video consultation support**

## Testing
To test the functionality:

1. **Start the backend server**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend development server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login as a patient** and navigate to "Find Doctors"
4. **Test the booking flow** with different doctors and dates
5. **Verify appointments** appear in "My Appointments"

## Dependencies
- **Frontend**: React, React Query, React Router, Tailwind CSS, Lucide React
- **Backend**: Express.js, MongoDB, Mongoose, JWT, bcryptjs
