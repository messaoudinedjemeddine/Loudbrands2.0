@echo off
echo Setting Vercel Environment Variables for Cloudinary...

echo ddtetstxq | vercel env add CLOUDINARY_CLOUD_NAME production
echo 248835256494799 | vercel env add CLOUDINARY_API_KEY production  
echo pQpG5r6QfXzbIeUdPmZbYhQcp0I | vercel env add CLOUDINARY_API_SECRET production
echo 10485760 | vercel env add MAX_FILE_SIZE production

echo.
echo Environment variables set successfully!
echo.
echo Your Cloudinary setup is now complete!
echo.
echo Backend: https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com
echo Frontend: https://frontend-870zl7fne-nedjem-eddine-messaoudis-projects.vercel.app
echo.
echo You can now upload images from your admin dashboard and they will be stored in Cloudinary!
pause
