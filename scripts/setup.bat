@echo off
echo 🚀 E-commerce Platform Setup Script
echo ==================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Backend Setup
echo.
echo 🔧 Setting up Backend...
cd backend

REM Install dependencies
echo 📦 Installing backend dependencies...
call npm install

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file...
    copy env.example .env
    echo ⚠️  Please edit backend/.env with your database credentials
) else (
    echo ✅ .env file already exists
)

REM Create uploads directory
if not exist uploads mkdir uploads

cd ..

REM Frontend Setup
echo.
echo 🎨 Setting up Frontend...
cd frontend

REM Install dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Create .env.local file if it doesn't exist
if not exist .env.local (
    echo 📝 Creating .env.local file...
    copy env.example .env.local
    echo ✅ .env.local file created
) else (
    echo ✅ .env.local file already exists
)

cd ..

echo.
echo 🎉 Setup completed!
echo.
echo 📋 Next steps:
echo 1. Install PostgreSQL if not already installed
echo 2. Create a database named 'ecommerce_db'
echo 3. Edit backend/.env with your database credentials
echo 4. Run the following commands:
echo.
echo    # Setup database
echo    cd backend
echo    npm run db:generate
echo    npm run db:push
echo    npm run db:seed
echo.
echo    # Start backend server
echo    npm run dev
echo.
echo    # In another terminal, start frontend
echo    cd frontend
echo    npm run dev
echo.
echo 🌐 Access the application:
echo    Frontend: http://localhost:3000
echo    Admin: http://localhost:3000/admin (admin@example.com / admin123)
echo    Backend API: http://localhost:5000
echo.
echo 📚 See SETUP.md for detailed instructions
pause 