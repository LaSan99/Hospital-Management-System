# Hospital Management System

A comprehensive Hospital Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring patient management, appointment scheduling, medical records, and digital health cards.

## 🏥 Features

### Core Functionality
- **Patient Account Management**: Create and manage patient accounts with complete profiles
- **Digital Health Cards**: Issue, manage, and validate digital health cards with QR codes
- **Appointment Scheduling**: Book, reschedule, and manage appointments with real-time availability
- **Medical Records**: Comprehensive medical record management for doctors
- **Role-based Access Control**: Secure access for Admin, Doctor, Staff, and Patient roles
- **Notification System**: Real-time notifications for appointments and updates

### User Roles
- **Admin**: Full system access and management
- **Staff**: Patient management and appointment scheduling
- **Doctor**: Patient care, medical records, and appointment management
- **Patient**: Personal profile, appointment booking, and health card access

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hospital-management
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   cp config.env .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Set up the frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
hospital-management/
├── backend/                 # Node.js/Express API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Authentication & validation
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   └── public/             # Static assets
└── README.md               # This file
```

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **React Query** - Data fetching
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `POST /api/doctors` - Create doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/specialization/:specialization` - Get doctors by specialization

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments/availability/:doctorId` - Get available time slots

### Medical Records
- `GET /api/medical-records` - Get all medical records
- `POST /api/medical-records` - Create medical record
- `PUT /api/medical-records/:id` - Update medical record
- `POST /api/medical-records/:id/medication` - Add medication
- `POST /api/medical-records/:id/lab-result` - Add lab result

### Health Cards
- `GET /api/health-cards` - Get all health cards
- `POST /api/health-cards` - Create health card
- `GET /api/health-cards/validate/:cardNumber` - Validate health card
- `PUT /api/health-cards/:id/block` - Block health card

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role-based Access Control**: Granular permissions system
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: Protection against brute force attacks

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first, works on all devices
- **Modern Interface**: Clean, intuitive user interface
- **Role-based Navigation**: Different menus for different user types
- **Real-time Updates**: Live data updates and notifications
- **Form Validation**: Client-side and server-side validation
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages

## 📱 Getting Started Guide

### For Patients
1. Register for an account
2. Complete your profile
3. Browse available doctors
4. Book appointments
5. View your health card
6. Access your medical records

### For Doctors
1. Register with medical credentials
2. Set up your profile and specialization
3. View your appointments
4. Create medical records for patients
5. Manage your schedule

### For Staff
1. Access patient management
2. Schedule appointments
3. Issue health cards
4. Manage doctor schedules
5. Handle check-ins

### For Admins
1. Full system access
2. Manage all users
3. Oversee appointments
4. System configuration
5. Analytics and reporting

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up CORS for your frontend domain

### Frontend Deployment
1. Build the production version: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages
3. Configure API endpoints for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/backend` and `/frontend` directories
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and role management
  - Patient and doctor management
  - Appointment scheduling
  - Medical records system
  - Digital health cards
  - Notification system

---

**Built with ❤️ for better healthcare management**
