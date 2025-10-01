require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users (optional - remove this if you want to keep existing data)
    console.log('Clearing existing users...');
    await User.deleteMany({});

    // Don't hash passwords here - the User model's pre-save hook will handle it
    const adminPassword = 'admin123';
    const userPassword = 'user123';

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@modernshop.com',
      password: adminPassword,
      role: 'admin',
      phone: '+92 300 1234567',
      isActive: true,
      emailVerified: true,
      addresses: [{
        type: 'shipping',
        firstName: 'Admin',
        lastName: 'User',
        address: '123 Admin Street',
        city: 'Karachi',
        state: 'Sindh',
        zipCode: '75500',
        country: 'Pakistan',
        phone: '+92 300 1234567',
        isDefault: true
      }]
    });

    // Create regular user
    const regularUser = new User({
      name: 'John Doe',
      email: 'user@modernshop.com',
      password: userPassword,
      role: 'user',
      phone: '+92 301 9876543',
      isActive: true,
      emailVerified: true,
      addresses: [{
        type: 'shipping',
        firstName: 'John',
        lastName: 'Doe',
        address: '456 User Avenue',
        city: 'Lahore',
        state: 'Punjab',
        zipCode: '54000',
        country: 'Pakistan',
        phone: '+92 301 9876543',
        isDefault: true
      }]
    });

    // Save users
    await adminUser.save();
    await regularUser.save();

    console.log('✅ Users seeded successfully!');
    console.log('\n📋 Seeded Accounts:');
    console.log('===================');
    console.log('👑 Admin Account:');
    console.log('   Email: admin@modernshop.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');
    console.log('');
    console.log('👤 User Account:');
    console.log('   Email: user@modernshop.com');
    console.log('   Password: user123');
    console.log('   Role: user');
    console.log('');
    console.log('💡 Note: New signups will automatically be assigned "user" role');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
};

const runSeeder = async () => {
  console.log('🌱 Starting user seeder...');
  await connectDB();
  await seedUsers();
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

// Run seeder if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedUsers, runSeeder };