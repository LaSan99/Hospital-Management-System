const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: './config.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected for checking'))
.catch(err => console.error('MongoDB connection error:', err));

const checkDatabase = async () => {
  try {
    console.log('Checking database...');
    
    // Check if users exist
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('❌ No users found! Database needs to be seeded.');
      console.log('Run: npm run seed');
    } else {
      console.log('✅ Users found in database');
      
      // List all users
      const users = await User.find({}).select('firstName lastName email role isActive');
      console.log('\nUsers in database:');
      users.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    }
    
    // Check JWT secret
    console.log('\nJWT Secret configured:', process.env.JWT_SECRET ? 'Yes' : 'No');
    if (process.env.JWT_SECRET === 'your_jwt_secret_key_here') {
      console.log('❌ JWT Secret is still set to placeholder value!');
    } else {
      console.log('✅ JWT Secret is properly configured');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    mongoose.connection.close();
  }
};

checkDatabase();
