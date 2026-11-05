# LIFE-LINK Quick Launcher Script
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  LIFE-LINK: Blood Bank & Organ Donor Network Management System" -ForegroundColor White
Write-Host "  Academic DBMS Capstone Project (MySQL 8.0, Node.js, React, Tailwind)" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Backend API Server on Port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

Write-Host "Starting Frontend React/Vite Application on Port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:5000/api/health" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan

