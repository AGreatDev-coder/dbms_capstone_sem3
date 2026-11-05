@echo off
title LIFE-LINK: Blood Bank and Organ Donor Network Management System
echo ============================================================================
echo   LIFE-LINK: Blood Bank and Organ Donor Network Management System
echo   Academic DBMS Capstone Project (MySQL 8.0, Node.js, Express, React)
echo ============================================================================
echo.
echo Starting Backend API Server on Port 5000...
start "LIFE-LINK Backend" cmd /k "cd backend && npm start"

echo.
echo Starting Frontend React/Vite Application on Port 3000...
start "LIFE-LINK Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================================
echo   Both services initiated!
echo   Frontend Web Application: http://localhost:3000
echo   Backend REST API:         http://localhost:5000/api/health
echo ============================================================================
echo.
pause

