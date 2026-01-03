# 🔄 Development Workflow Guide

This guide explains how to make changes and deploy them to Vercel and Heroku.

## 📝 Quick Workflow

### 1. Make Your Changes
Edit any files in the `frontend/` or `backend/` directories.

### 2. Check Your Changes
```powershell
# See what files you've modified
git status

# See the actual changes
git diff
```

### 3. Stage Your Changes
```powershell
# Stage all changes
git add .

# Or stage specific files
git add frontend/app/page.tsx
git add backend/src/server.js
```

### 4. Commit Your Changes
```powershell
git commit -m "Your descriptive commit message here"
```

### 5. Push to GitHub
```powershell
git push origin master
```

### 6. Auto-Deployment
Once you push:
- ✅ **Vercel** will automatically detect the push and deploy the frontend
- ✅ **Heroku** will automatically detect the push and deploy the backend

## 🎯 Common Scenarios

### Frontend Changes Only
```powershell
git add frontend/
git commit -m "Update frontend UI"
git push origin master
```

### Backend Changes Only
```powershell
git add backend/
git commit -m "Add new API endpoint"
git push origin master
```

### Both Frontend and Backend
```powershell
git add .
git commit -m "Update feature across frontend and backend"
git push origin master
```

## 🔍 Checking Deployment Status

### Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project
3. Check the "Deployments" tab

### Heroku
1. Go to [Heroku Dashboard](https://dashboard.heroku.com)
2. Find your app (`loudbrands-api`)
3. Check the "Activity" tab

## ⚠️ Important Notes

1. **Always test locally first** before pushing
2. **Use descriptive commit messages** so you can track changes
3. **Don't commit sensitive data** (API keys, passwords, etc.)
4. **Check deployment logs** if something goes wrong

## 🛠️ Useful Commands

```powershell
# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Create a new branch for features
git checkout -b feature-name
git push origin feature-name

# Switch back to master
git checkout master
```

## 🚨 Troubleshooting

### If deployment fails:
1. Check the logs in Vercel/Heroku dashboard
2. Verify environment variables are set correctly
3. Make sure all dependencies are in package.json
4. Check for build errors in the deployment logs

### If changes don't appear:
1. Wait a few minutes (deployments take time)
2. Clear your browser cache
3. Check if the deployment completed successfully
4. Verify you pushed to the correct branch (master)

