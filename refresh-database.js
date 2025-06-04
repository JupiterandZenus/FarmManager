#!/usr/bin/env node

const { PrismaClient } = require('./generated/prisma');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './config.env' });

const prisma = new PrismaClient();

async function refreshDatabase() {
  console.log('🔄 Starting database refresh process...');
  
  try {
    // 1. Check database connection
    console.log('🔍 Testing database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Successfully connected to database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('💡 Please check your DATABASE_URL in config.env');
      process.exit(1);
    }
    
    // 2. Reset and migrate database
    console.log('🔄 Resetting database and applying migrations...');
    
    try {
      // Run Prisma migration reset (which includes applying migrations)
      await new Promise((resolve, reject) => {
        exec('npx prisma migrate reset --force', (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Migration reset failed:', error.message);
            return reject(error);
          }
          console.log(stdout);
          resolve();
        });
      });
      
      console.log('✅ Database reset and migrations applied successfully');
    } catch (error) {
      console.error('❌ Migration reset failed:', error.message);
      console.log('💡 Trying to manually initialize the database...');
      
      // Fallback to manual SQL execution
      try {
        // Create database if it doesn't exist
        await prisma.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS farmboy_db;`);
        console.log('✅ Database created or already exists');
        
        // Apply SQL schema directly
        const sqlSchema = fs.readFileSync(path.join(__dirname, 'setup_database.sql'), 'utf8');
        await prisma.$executeRawUnsafe(sqlSchema);
        console.log('✅ SQL schema applied successfully');
      } catch (dbError) {
        console.error('❌ Manual database initialization failed:', dbError.message);
        process.exit(1);
      }
    }
    
    // 3. Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      await new Promise((resolve, reject) => {
        exec('npx prisma generate', (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Prisma client generation failed:', error.message);
            return reject(error);
          }
          console.log(stdout);
          resolve();
        });
      });
      
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      console.error('❌ Prisma client generation failed:', error.message);
      process.exit(1);
    }
    
    // 4. Seed the database
    console.log('🌱 Seeding database with initial data...');
    try {
      await new Promise((resolve, reject) => {
        exec('node prisma/seed.js', (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Database seeding failed:', error.message);
            return reject(error);
          }
          console.log(stdout);
          resolve();
        });
      });
      
      console.log('✅ Database seeded successfully');
    } catch (error) {
      console.error('❌ Database seeding failed:', error.message);
    }
    
    // 5. Verify database refresh
    console.log('🔍 Verifying database refresh...');
    
    try {
      // Check if we can read from the database
      const agentCount = await prisma.agent.count();
      console.log(`✅ Database verification complete: Found ${agentCount} agents`);
    } catch (error) {
      console.error('❌ Database verification failed:', error.message);
    }
    
    console.log('✅ Database refresh process completed successfully!');
    console.log('💡 You can now restart your application to use the refreshed database.');
    
  } catch (error) {
    console.error('❌ Database refresh process failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the refresh function
refreshDatabase().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
}); 