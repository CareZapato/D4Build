# Script para instalar dependencias limpias

Write-Host "Limpiando instalación anterior..." -ForegroundColor Yellow

# Eliminar node_modules si existe
if (Test-Path "node_modules") {
    Write-Host "Eliminando node_modules..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
}

# Eliminar package-lock.json si existe
if (Test-Path "package-lock.json") {
    Write-Host "Eliminando package-lock.json..." -ForegroundColor Cyan
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

# Limpiar caché de npm
Write-Host "Limpiando caché de npm..." -ForegroundColor Cyan
npm cache clean --force

# Instalar dependencias
Write-Host "`nInstalando dependencias..." -ForegroundColor Green
npm install

Write-Host "`n✅ Instalación completa!" -ForegroundColor Green
Write-Host "Ejecuta 'npm run dev' para iniciar la aplicación" -ForegroundColor Yellow
