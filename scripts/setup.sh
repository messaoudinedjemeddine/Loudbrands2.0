#!/bin/bash

echo "🚀 E-commerce Platform Setup Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Backend Setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials"
else
    echo "✅ .env file already exists"
fi

# Create uploads directory
mkdir -p uploads

cd ..

# Frontend Setup
echo ""
echo "🎨 Setting up Frontend..."
cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
    echo "✅ .env.local file created"
else
    echo "✅ .env.local file already exists"
fi

cd ..

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Install PostgreSQL if not already installed"
echo "2. Create a database named 'ecommerce_db'"
echo "3. Edit backend/.env with your database credentials"
echo "4. Run the following commands:"
echo ""
echo "   # Setup database"
echo "   cd backend"
echo "   npm run db:generate"
echo "   npm run db:push"
echo "   npm run db:seed"
echo ""
echo "   # Start backend server"
echo "   npm run dev"
echo ""
echo "   # In another terminal, start frontend"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Admin: http://localhost:3000/admin (admin@example.com / admin123)"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 See SETUP.md for detailed instructions" 