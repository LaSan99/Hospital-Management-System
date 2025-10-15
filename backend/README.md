# Hospital Management System - Backend

A simple and beginner-friendly Node.js/Express backend for a Hospital Management System.

## Features

- **User Management**: Register and manage patients, doctors, staff, and admins
- **Authentication**: JWT-based authentication with role-based access control
- **Patient Management**: Create and manage patient accounts
- **Health Cards**: Digital health card system with QR codes
- **Appointments**: Book, manage, and track appointments
- **Medical Records**: Create and manage patient medical records
- **Notifications**: Send and manage system notifications

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `config.env` to `.env`
   - Update the values in `.env` file

3. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /logout` - Logout user

### Patients (`/api/patients`)
- `GET /` - Get all patients (admin/staff only)
- `GET /:id` - Get single patient
- `POST /` - Create new patient (admin/staff only)
- `PUT /:id` - Update patient
- `DELETE /:id` - Delete patient (admin only)
- `GET /:id/health-card` - Get patient's health card

### Doctors (`/api/doctors`)
- `GET /` - Get all doctors
- `GET /:id` - Get single doctor
- `POST /` - Create new doctor (admin only)
- `PUT /:id` - Update doctor
- `DELETE /:id` - Delete doctor (admin only)
- `GET /specialization/:specialization` - Get doctors by specialization

### Appointments (`/api/appointments`)
- `GET /` - Get all appointments
- `GET /:id` - Get single appointment
- `POST /` - Create new appointment
- `PUT /:id` - Update appointment
- `PUT /:id/cancel` - Cancel appointment
- `PUT /:id/checkin` - Check in patient (admin/staff only)
- `GET /availability/:doctorId` - Get available time slots

### Medical Records (`/api/medical-records`)
- `GET /` - Get all medical records (admin/staff/doctor only)
- `GET /patient/:patientId` - Get patient's medical records
- `GET /:id` - Get single medical record
- `POST /` - Create new medical record
- `PUT /:id` - Update medical record
- `PUT /:id/complete` - Complete medical record
- `POST /:id/medication` - Add medication
- `POST /:id/lab-result` - Add lab result

### Health Cards (`/api/health-cards`)
- `GET /` - Get all health cards (admin/staff only)
- `GET /:id` - Get health card by ID
- `GET /patient/:patientId` - Get patient's health card
- `POST /` - Create new health card (admin/staff only)
- `PUT /:id` - Update health card
- `PUT /:id/block` - Block health card
- `PUT /:id/unblock` - Unblock health card
- `GET /validate/:cardNumber` - Validate health card
- `GET /card/:cardNumber` - Get health card by card number

### Notifications (`/api/notifications`)
- `GET /` - Get user's notifications
- `GET /unread-count` - Get unread count
- `PUT /:id/read` - Mark notification as read
- `PUT /mark-all-read` - Mark all notifications as read
- `POST /` - Create notification
- `DELETE /:id` - Delete notification
- `GET /type/:type` - Get notifications by type

## User Roles

- **Admin**: Full access to all features
- **Staff**: Access to patient management, appointments, and health cards
- **Doctor**: Access to appointments, medical records, and patient data
- **Patient**: Access to own profile, appointments, and health card

## Database Models

### User
- Basic user information (name, email, phone, etc.)
- Role-based fields (specialization for doctors, blood type for patients)
- Authentication and account status

### HealthCard
- Patient information
- Card number and validity
- Medical information (allergies, blood type)
- Emergency contact details

### Appointment
- Patient and doctor information
- Date, time, and status
- Appointment type and reason
- Check-in and payment status

### MedicalRecord
- Patient and doctor information
- Diagnosis and treatment details
- Lab results and vital signs
- Medications and follow-up instructions

### Notification
- Recipient and sender information
- Message content and type
- Read status and priority

## Error Handling

All API endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- CORS protection

## Getting Started

1. Make sure MongoDB is running
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the server: `npm run dev`
5. The API will be available at `http://localhost:5000`

## Contributing

This is a beginner-friendly project. Feel free to:
- Add new features
- Improve existing code
- Fix bugs
- Add tests
- Improve documentation
