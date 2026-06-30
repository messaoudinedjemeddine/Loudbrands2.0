# PowerShell script to help push changes to GitHub
# This will trigger auto-deployment on Vercel and Heroku

Write-Host "🔄 Checking git status..." -ForegroundColor Cyan
git status

Write-Host "`n📝 Enter your commit message:" -ForegroundColor Yellow
$commitMessage = Read-Host

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    Write-Host "❌ Commit message cannot be empty!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Staging all changes..." -ForegroundColor Cyan
git add .

Write-Host "💾 Committing changes..." -ForegroundColor Cyan
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Pushing to GitHub (master branch)..." -ForegroundColor Cyan
git push origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "`n📡 Auto-deployment triggered:" -ForegroundColor Cyan
    Write-Host "   • Vercel will deploy the frontend automatically" -ForegroundColor Yellow
    Write-Host "   • Heroku will deploy the backend automatically" -ForegroundColor Yellow
    Write-Host "`n⏳ Check deployment status in:" -ForegroundColor Cyan
    Write-Host "   • Vercel: https://vercel.com/dashboard" -ForegroundColor White
    Write-Host "   • Heroku: https://dashboard.heroku.com" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed! Check your git configuration and try again." -ForegroundColor Red
    exit 1
}

