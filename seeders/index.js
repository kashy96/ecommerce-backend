require('dotenv').config();
const mongoose = require('mongoose');
const { seedUsers } = require('./userSeeder');
const { seedCategories } = require('./categorySeeder');
const { seedProducts } = require('./productSeeder');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected for seeding');

      // Wait a moment to ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedAll = async () => {
  try {
    console.log('🌱 Starting complete database seeding...');
    console.log('=====================================\n');

    const startTime = Date.now();

    // Ensure we're connected
    await connectDB();

    // Seed in correct order due to dependencies
    console.log('1️⃣  SEEDING USERS');
    console.log('=================');
    await seedUsers();
    console.log('\n');

    console.log('2️⃣  SEEDING CATEGORIES');
    console.log('=====================');
    await seedCategories();
    console.log('\n');

    console.log('3️⃣  SEEDING PRODUCTS');
    console.log('===================');
    await seedProducts();
    console.log('\n');

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('===========================================');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log('\n🚀 Your e-commerce database is now ready!');
    console.log('\n📝 What was seeded:');
    console.log('-------------------');
    console.log('✅ Users: Admin and regular user accounts');
    console.log('✅ Categories: 6 main categories with hierarchical subcategories');
    console.log('✅ Products: Sample products across all categories');
    console.log('\n🔐 Login Credentials:');
    console.log('---------------------');
    console.log('👑 Admin: admin@modernshop.com / admin123');
    console.log('👤 User:  user@modernshop.com / user123');
    console.log('\n💡 Next Steps:');
    console.log('--------------');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Start your frontend: npm run dev (in frontend directory)');
    console.log('3. Login with admin credentials to access admin panel');
    console.log('4. Explore the seeded products and categories');
    console.log('5. Test the complete e-commerce functionality');
    console.log('\n⚠️  Remember to change default passwords in production!');

  } catch (error) {
    console.error('❌ Error during seeding process:', error);
    process.exit(1);
  }
};

const runSeeder = async () => {
  try {
    await seedAll();
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    console.log('Happy coding! 🎯');
  }
};

// Functions for individual seeding
const seedUsersOnly = async () => {
  try {
    await connectDB();
    await seedUsers();
  } finally {
    await mongoose.connection.close();
  }
};

const seedCategoriesOnly = async () => {
  try {
    await connectDB();
    await seedCategories();
  } finally {
    await mongoose.connection.close();
  }
};

const seedProductsOnly = async () => {
  try {
    await connectDB();
    await seedProducts();
  } finally {
    await mongoose.connection.close();
  }
};

// Run seeder if called directly
if (require.main === module) {
  runSeeder();
}

module.exports = {
  seedAll,
  seedUsersOnly,
  seedCategoriesOnly,
  seedProductsOnly,
  runSeeder
};