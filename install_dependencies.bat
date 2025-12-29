@echo off
echo Installing required packages...
call npm install jsonwebtoken cookie-parser

echo.
echo Packages installed successfully!
echo.
echo NEXT STEPS:
echo 1. Run the SQL migration to create the favorites table
echo    - Open MySQL and run: create_favorites_table.sql
echo    - Or use command: mysql -u root music ^< create_favorites_table.sql
echo.
echo 2. Restart the server (Ctrl+C then npm start)
echo.
pause
