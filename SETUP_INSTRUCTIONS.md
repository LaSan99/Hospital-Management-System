# Hospital Management System - Setup Instructions

This document provides step-by-step instructions to set up and run the Hospital Management System with real database data.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Git

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - The `config.env` file is already configured with default values
   - Make sure MongoDB is running on `mongodb://localhost:27017/hospital_management`
   - Or update the `MONGODB_URI` in `config.env` to point to your MongoDB instance

4. **Seed the database with sample data:**
   ```bash
   npm run seed
   ```
   This will create sample users, appointments, medical records, and health cards.

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## Sample Login Credentials

After running the seed script, you can use these credentials to log in:

### Admin Account
- **Email:** admin@hospital.com
- **Password:** admin123
- **Access:** Full system access

### Doctor Account
- **Email:** john.smith@hospital.com
- **Password:** doctor123
- **Access:** Patient management, appointments, medical records

### Staff Account
- **Email:** emily.davis@hospital.com
- **Password:** staff123
- **Access:** Patient management, appointments, health cards

### Patient Account
- **Email:** alice.wilson@email.com
- **Password:** patient123
- **Access:** View own appointments, medical records, health card

## Features with Real Data

The application now displays real data fetched from the database:

### Dashboard
- Shows real statistics based on actual data
- Displays today's appointments and upcoming appointments
- Role-based content (different views for admin, doctor, staff, patient)

### Patients Page
- Lists all patients from the database
- Search functionality
- Patient details including contact info, blood type, allergies
- Status indicators (Active/Inactive)

### Doctors Page
- Shows all doctors with their specializations
- Search and filter by specialization
- Doctor details including experience, consultation fees, contact info
- Star ratings (simulated)

### Appointments Page
- Lists all appointments with real data
- Filter by status (scheduled, confirmed, completed, cancelled)
- Search functionality
- Role-based filtering (patients see only their appointments, doctors see only their patients)

### Medical Records Page
- Displays medical records with detailed information
- Shows diagnosis, symptoms, medications, vital signs
- Filter by record type
- Search functionality

### Health Cards Page
- Shows digital health cards for patients
- Card status indicators (active, expired, blocked)
- Patient information, blood type, allergies
- Emergency contact information
- Expiry date tracking

## Database Schema

The system uses the following main collections:

- **Users:** Admin, doctors, staff, and patients
- **Appointments:** Patient appointments with doctors
- **Medical Records:** Detailed medical history and treatment records
- **Health Cards:** Digital health cards for patients

## API Endpoints

The backend provides RESTful API endpoints:

- `GET /api/patients` - Get all patients
- `GET /api/doctors` - Get all doctors
- `GET /api/appointments` - Get all appointments
- `GET /api/medical-records` - Get all medical records
- `GET /api/health-cards` - Get all health cards

All endpoints support authentication and role-based access control.

## Troubleshooting

1. **MongoDB Connection Issues:**
   - Ensure MongoDB is running
   - Check the connection string in `config.env`
   - Verify network connectivity

2. **Frontend API Issues:**
   - Ensure backend is running on port 5000
   - Check browser console for CORS errors
   - Verify API endpoints are accessible

3. **Authentication Issues:**
   - Clear browser localStorage
   - Re-run the seed script to reset data
   - Check JWT token expiration

## Development

To add more sample data or modify existing data, edit the `backend/seed.js` file and run:

```bash
npm run seed
```

This will clear the existing data and populate with new data.

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Update database connection strings
3. Configure proper CORS settings
4. Set up SSL certificates
5. Use a production MongoDB instance

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is running and accessible
4. Check that all required environment variables are set
