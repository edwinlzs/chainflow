@ECHO OFF
cd ../
powershell -Command "$env:DEBUG='false'; pnpm run server"