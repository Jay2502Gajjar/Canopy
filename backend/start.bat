@echo off
echo ============================================
echo  Starting Canopy HR FastAPI Backend
echo ============================================
cd /d "%~dp0"
py -m uvicorn main:app --port 5000 --reload
