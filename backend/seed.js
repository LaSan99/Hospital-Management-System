const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

// Import models
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const HealthCard = require('./models/HealthCard');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Sample data
const sampleUsers = [
  // Admin
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'admin',
    phone: '+1-555-0100',
    dateOfBirth: new Date('1980-01-01'),
    gender: 'male',
    address: {
      street: '123 Admin St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    }
  },
  // Doctors
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@hospital.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+1-555-0101',
    dateOfBirth: new Date('1975-05-15'),
    gender: 'male',
    specialization: 'Cardiology',
    licenseNumber: 'MD123456',
    experience: 15,
    consultationFee: 200,
    address: {
      street: '456 Doctor Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA'
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@hospital.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+1-555-0102',
    dateOfBirth: new Date('1982-08-20'),
    gender: 'female',
    specialization: 'Pediatrics',
    licenseNumber: 'MD789012',
    experience: 10,
    consultationFee: 150,
    address: {
      street: '789 Pediatric St',
      city: 'New York',
      state: 'NY',
      zipCode: '10003',
      country: 'USA'
    }
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@hospital.com',
    password: 'doctor123',
    role: 'doctor',
    phone: '+1-555-0103',
    dateOfBirth: new Date('1978-12-10'),
    gender: 'male',
    specialization: 'Neurology',
    licenseNumber: 'MD345678',
    experience: 12,
    consultationFee: 250,
    address: {
      street: '321 Neurology Blvd',
      city: 'New York',
      state: 'NY',
      zipCode: '10004',
      country: 'USA'
    }
  },
  // Staff
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@hospital.com',
    password: 'staff123',
    role: 'staff',
    phone: '+1-555-0104',
    dateOfBirth: new Date('1990-03-25'),
    gender: 'female',
    address: {
      street: '654 Staff Rd',
      city: 'New York',
      state: 'NY',
      zipCode: '10005',
      country: 'USA'
    }
  },
  // Patients
  {
    firstName: 'Alice',
    lastName: 'Wilson',
    email: 'alice.wilson@email.com',
    password: 'patient123',
    role: 'patient',
    phone: '+1-555-0201',
    dateOfBirth: new Date('1995-06-15'),
    gender: 'female',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish'],
    emergencyContact: {
      name: 'Bob Wilson',
      phone: '+1-555-0202',
      relationship: 'Spouse'
    },
    address: {
      street: '123 Patient St',
      city: 'New York',
      state: 'NY',
      zipCode: '10006',
      country: 'USA'
    }
  },
  {
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.miller@email.com',
    password: 'patient123',
    role: 'patient',
    phone: '+1-555-0203',
    dateOfBirth: new Date('1988-09-30'),
    gender: 'male',
    bloodType: 'A-',
    allergies: ['Latex'],
    emergencyContact: {
      name: 'Jane Miller',
      phone: '+1-555-0204',
      relationship: 'Sister'
    },
    address: {
      street: '456 Patient Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10007',
      country: 'USA'
    }
  },
  {
    firstName: 'Lisa',
    lastName: 'Garcia',
    email: 'lisa.garcia@email.com',
    password: 'patient123',
    role: 'patient',
    phone: '+1-555-0205',
    dateOfBirth: new Date('1992-11-12'),
    gender: 'female',
    bloodType: 'B+',
    allergies: ['Aspirin'],
    emergencyContact: {
      name: 'Carlos Garcia',
      phone: '+1-555-0206',
      relationship: 'Father'
    },
    address: {
      street: '789 Patient Blvd',
      city: 'New York',
      state: 'NY',
      zipCode: '10008',
      country: 'USA'
    }
  }
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalRecord.deleteMany({});
    await HealthCard.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = await User.insertMany(sampleUsers);
    console.log(`Created ${users.length} users`);

    // Get user IDs for relationships
    const admin = users.find(u => u.role === 'admin');
    const doctors = users.filter(u => u.role === 'doctor');
    const patients = users.filter(u => u.role === 'patient');

    // Create appointments
    const appointments = [
      {
        patientId: patients[0]._id,
        doctorId: doctors[0]._id,
        appointmentDate: new Date('2024-01-15'),
        startTime: '09:00',
        endTime: '10:00',
        appointmentType: 'consultation',
        reason: 'Chest pain and shortness of breath',
        symptoms: ['Chest pain', 'Shortness of breath', 'Fatigue'],
        patientName: `${patients[0].firstName} ${patients[0].lastName}`,
        patientPhone: patients[0].phone,
        patientEmail: patients[0].email,
        doctorName: `Dr. ${doctors[0].firstName} ${doctors[0].lastName}`,
        doctorSpecialization: doctors[0].specialization,
        consultationFee: doctors[0].consultationFee,
        status: 'completed',
        location: 'clinic',
        room: 'A101',
        checkedIn: true,
        checkedInAt: new Date('2024-01-15T09:00:00Z')
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[1]._id,
        appointmentDate: new Date('2024-01-16'),
        startTime: '14:00',
        endTime: '15:00',
        appointmentType: 'follow_up',
        reason: 'Regular checkup for child',
        symptoms: ['None'],
        patientName: `${patients[1].firstName} ${patients[1].lastName}`,
        patientPhone: patients[1].phone,
        patientEmail: patients[1].email,
        doctorName: `Dr. ${doctors[1].firstName} ${doctors[1].lastName}`,
        doctorSpecialization: doctors[1].specialization,
        consultationFee: doctors[1].consultationFee,
        status: 'scheduled',
        location: 'clinic',
        room: 'B201'
      },
      {
        patientId: patients[2]._id,
        doctorId: doctors[2]._id,
        appointmentDate: new Date('2024-01-17'),
        startTime: '10:30',
        endTime: '11:30',
        appointmentType: 'consultation',
        reason: 'Headaches and dizziness',
        symptoms: ['Headaches', 'Dizziness', 'Nausea'],
        patientName: `${patients[2].firstName} ${patients[2].lastName}`,
        patientPhone: patients[2].phone,
        patientEmail: patients[2].email,
        doctorName: `Dr. ${doctors[2].firstName} ${doctors[2].lastName}`,
        doctorSpecialization: doctors[2].specialization,
        consultationFee: doctors[2].consultationFee,
        status: 'confirmed',
        location: 'clinic',
        room: 'C301'
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log(`Created ${createdAppointments.length} appointments`);

    // Create medical records
    const medicalRecords = [
      {
        patientId: patients[0]._id,
        doctorId: doctors[0]._id,
        appointmentId: createdAppointments[0]._id,
        recordType: 'consultation',
        diagnosis: {
          mainProblem: 'Possible angina',
          symptoms: ['Chest pain', 'Shortness of breath', 'Fatigue'],
          notes: 'Patient reports chest pain that worsens with exertion'
        },
        treatment: {
          medications: [
            {
              name: 'Nitroglycerin',
              dosage: '0.4mg',
              frequency: 'As needed',
              duration: '30 days',
              instructions: 'Take when experiencing chest pain'
            },
            {
              name: 'Aspirin',
              dosage: '81mg',
              frequency: 'Once daily',
              duration: 'Indefinite',
              instructions: 'Take with food'
            }
          ],
          procedures: ['ECG', 'Blood tests', 'Stress test'],
          recommendations: ['Rest', 'Avoid strenuous activity', 'Follow up in 2 weeks']
        },
        vitalSigns: {
          bloodPressure: '140/90',
          heartRate: 85,
          temperature: 98.6,
          weight: 70,
          height: 170
        },
        doctorNotes: 'Patient shows signs of possible angina. Recommended further testing and lifestyle changes.',
        patientComplaints: 'Chest pain and shortness of breath for the past week',
        status: 'completed'
      },
      {
        patientId: patients[1]._id,
        doctorId: doctors[1]._id,
        appointmentId: createdAppointments[1]._id,
        recordType: 'follow_up',
        diagnosis: {
          mainProblem: 'Healthy child',
          symptoms: ['None'],
          notes: 'Regular checkup - no issues found'
        },
        treatment: {
          medications: [],
          procedures: ['Physical examination', 'Growth chart review'],
          recommendations: ['Continue regular checkups', 'Maintain healthy diet']
        },
        vitalSigns: {
          bloodPressure: '110/70',
          heartRate: 75,
          temperature: 98.4,
          weight: 65,
          height: 165
        },
        doctorNotes: 'Patient is healthy and growing normally. No concerns at this time.',
        patientComplaints: 'None - routine checkup',
        status: 'draft'
      }
    ];

    const createdMedicalRecords = await MedicalRecord.insertMany(medicalRecords);
    console.log(`Created ${createdMedicalRecords.length} medical records`);

    // Create health cards
    const healthCards = [
      {
        patientId: patients[0]._id,
        cardNumber: 'HC000001',
        issueDate: new Date('2023-01-01'),
        expiryDate: new Date('2025-01-01'),
        status: 'active',
        patientName: `${patients[0].firstName} ${patients[0].lastName}`,
        patientEmail: patients[0].email,
        patientPhone: patients[0].phone,
        bloodType: patients[0].bloodType,
        allergies: patients[0].allergies,
        emergencyContact: patients[0].emergencyContact
      },
      {
        patientId: patients[1]._id,
        cardNumber: 'HC000002',
        issueDate: new Date('2023-02-01'),
        expiryDate: new Date('2025-02-01'),
        status: 'active',
        patientName: `${patients[1].firstName} ${patients[1].lastName}`,
        patientEmail: patients[1].email,
        patientPhone: patients[1].phone,
        bloodType: patients[1].bloodType,
        allergies: patients[1].allergies,
        emergencyContact: patients[1].emergencyContact
      },
      {
        patientId: patients[2]._id,
        cardNumber: 'HC000003',
        issueDate: new Date('2023-03-01'),
        expiryDate: new Date('2025-03-01'),
        status: 'active',
        patientName: `${patients[2].firstName} ${patients[2].lastName}`,
        patientEmail: patients[2].email,
        patientPhone: patients[2].phone,
        bloodType: patients[2].bloodType,
        allergies: patients[2].allergies,
        emergencyContact: patients[2].emergencyContact
      }
    ];

    const createdHealthCards = await HealthCard.insertMany(healthCards);
    console.log(`Created ${createdHealthCards.length} health cards`);

    console.log('Database seeding completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Admin: admin@hospital.com / admin123');
    console.log('Doctor: john.smith@hospital.com / doctor123');
    console.log('Staff: emily.davis@hospital.com / staff123');
    console.log('Patient: alice.wilson@email.com / patient123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedDatabase();
