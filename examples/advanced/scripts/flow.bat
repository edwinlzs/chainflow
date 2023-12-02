@ECHO OFF
cd ../
powershell -Command "$env:DEBUG='*'; pnpm run flow"