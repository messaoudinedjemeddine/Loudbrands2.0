const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function fixImageUploads() {
  try {
    console.log('🔧 Fixing image upload configuration...');

    // Create uploads directory if it doesn't exist
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Create a test image file to verify serving
    const testImagePath = path.join(uploadDir, 'test-image.txt');
    fs.writeFileSync(testImagePath, 'Test file for image serving');
    console.log('✅ Created test file for serving verification');

    // Check if we can read the file
    if (fs.existsSync(testImagePath)) {
      console.log('✅ File system is working');
    } else {
      console.log('❌ File system issue detected');
    }

    console.log('\n📋 Image Upload Configuration:');
    console.log(`- Upload Directory: ${uploadDir}`);
    console.log(`- Base URL: https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com`);
    console.log(`- Static Route: /uploads`);
    console.log(`- Full URL Example: https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/uploads/filename.jpg`);

    console.log('\n⚠️  Important Notes:');
    console.log('- Heroku filesystem is ephemeral (files are lost on dyno restart)');
    console.log('- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)');
    console.log('- Current setup works for testing but not for production');

  } catch (error) {
    console.error('❌ Error fixing image uploads:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (require.main === module) {
  fixImageUploads();
}

module.exports = fixImageUploads;
