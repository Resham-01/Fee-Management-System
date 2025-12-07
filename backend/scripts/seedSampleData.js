/* Seed script to create sample users and data for all dashboards */
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const connectDB = require('../src/config/db');
const { User, USER_ROLES } = require('../src/models/User');
const School = require('../src/models/School');
const Plan = require('../src/models/Plan');
const Student = require('../src/models/Student');
const Invoice = require('../src/models/Invoice');

async function seed() {
  try {
    await connectDB();

    // Clear only what we seed (optional – comment out in production)
    await Promise.all([
      User.deleteMany({}),
      School.deleteMany({}),
      Plan.deleteMany({}),
      Student.deleteMany({}),
      Invoice.deleteMany({}),
    ]);

    // 1. Create a subscription plan
    const basicPlan = await Plan.create({
      name: 'Basic Plan',
      pricePerMonth: 1000,
      maxStudents: 500,
      features: ['Invoices', 'Online Payments', 'Basic Reports'],
    });

    // 2. Create a school
    const school = await School.create({
      name: 'Green Valley School',
      address: 'Kathmandu',
      contactEmail: 'info@greenvalley.edu',
      contactPhone: '+977-123456789',
      isApproved: true,
      subscriptionPlan: basicPlan._id,
    });

    // 3. Create Super Admin
    await User.create({
      name: 'Super Admin',
      email: 'superadmin@gmail.com',
      password: 'SuperAdmin@123',
      role: USER_ROLES.SUPER_ADMIN,
    });

    // 4. Create School Admin
    const schoolAdmin = await User.create({
      name: 'School Admin',
      email: 'schooladmin@gmail.com',
      password: 'SchoolAdmin@123',
      role: USER_ROLES.SCHOOL_ADMIN,
      school: school._id,
    });

    // 5. Create Parent
    const parentUser = await User.create({
      name: 'Parent User',
      email: 'parent@gmail.com',
      password: 'Parent@123',
      role: USER_ROLES.PARENT,
      school: school._id,
    });

    // 6. Create a student linked to the parent
    const student = await Student.create({
      school: school._id,
      firstName: 'Sita',
      lastName: 'Sharma',
      studentCode: 'STU-001',
      className: 'Grade 5',
      section: 'A',
      parent: parentUser._id,
    });

    // 7. Create a sample invoice
    await Invoice.create({
      school: school._id,
      student: student._id,
      amount: 5000,
      currency: 'NPR',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      term: 'Monthly - Baisakh',
      description: 'Tuition fee for Baisakh',
    });

    // Log credentials
    console.log('=== Seeded Sample Data ===');
    console.log('Super Admin:', {
      email: 'superadmin@gmail.com',
      password: 'SuperAdmin@123',
    });
    console.log('School Admin:', {
      email: 'schooladmin@gmail.com',
      password: 'SchoolAdmin@123',
      school: school.name,
    });
    console.log('Parent:', {
      email: 'parent@gmail.com',
      password: 'Parent@123',
      studentCode: 'STU-001',
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();



