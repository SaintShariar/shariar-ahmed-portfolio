# Chameleon setup script for Windows
# Installs Rust and builds the app

$ErrorActionPreference = "Stop"

Write-Host "=== Chameleon Setup ===" -ForegroundColor Cyan

# Refresh PATH for Node
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Node: $(node --version)"
Write-Host "npm: $(npm --version)"

# Install Rust if missing
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Rust..." -ForegroundColor Yellow
    winget install Rustlang.Rustup --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Set-Location $PSScriptRoot\..

Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "  Dev:   npm run tauri:dev"
Write-Host "  EXE:   npm run tauri:build"
Write-Host "  Android init: npm run tauri android init"
