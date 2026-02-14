@echo off
echo ========================================
echo Sidequest Backend Setup and Testing
echo ========================================
echo.

echo Step 1: Installing dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Checking environment configuration...
if not exist ..\.env (
    echo WARNING: .env file not found!
    echo Please create .env from .env.example and configure your Google Cloud credentials
    echo.
    echo For now, running mock test without Vertex AI...
    echo.
    python test_agents_mock.py
) else (
    echo .env file found
    echo.
    choice /C YN /M "Run with real Vertex AI agents (Y) or mock agents (N)"
    if errorlevel 2 (
        python test_agents_mock.py
    ) else (
        python test_agents.py
    )
)

echo.
echo ========================================
echo Testing complete!
echo Check the sources/ directory for results
echo ========================================
pause
