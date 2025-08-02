# Script para iniciar el frontend en PowerShell
Write-Host "🚀 Iniciando frontend..." -ForegroundColor Green

# Cambiar al directorio frontend
Set-Location frontend

# Instalar dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Iniciar el servidor de desarrollo
Write-Host "🔥 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
npm run dev 