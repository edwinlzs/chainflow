@REM for testing demo code on windows machines
@REM (remove when lib is ready to publish)

@ECHO OFF
powershell -Command "$env:DEBUG='*'; pnpm run demo"