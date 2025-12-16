# Orb Project - Complete Backup Script
# Creates a timestamped backup of all source files

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "BACKUP_$timestamp"

Write-Host "Creating backup: $backupDir" -ForegroundColor Green
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Create subdirectories
New-Item -ItemType Directory -Path "$backupDir\src\components" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\src\lib" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\public" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\database" -Force | Out-Null

# Copy root configuration files
Write-Host "Copying configuration files..." -ForegroundColor Yellow
Copy-Item "package.json" -Destination $backupDir -ErrorAction SilentlyContinue
Copy-Item "package-lock.json" -Destination $backupDir -ErrorAction SilentlyContinue
Copy-Item "vite.config.js" -Destination $backupDir -ErrorAction SilentlyContinue
Copy-Item "index.html" -Destination $backupDir -ErrorAction SilentlyContinue
Copy-Item "vercel.json" -Destination $backupDir -ErrorAction SilentlyContinue
Copy-Item ".gitignore" -Destination $backupDir -ErrorAction SilentlyContinue
Copy-Item "README.md" -Destination $backupDir -ErrorAction SilentlyContinue

# Copy all markdown files
Write-Host "Copying documentation..." -ForegroundColor Yellow
Get-ChildItem -Filter "*.md" | Copy-Item -Destination $backupDir -ErrorAction SilentlyContinue

# Copy src files
Write-Host "Copying source files..." -ForegroundColor Yellow
Copy-Item "src\*.jsx" -Destination "$backupDir\src" -ErrorAction SilentlyContinue
Copy-Item "src\*.js" -Destination "$backupDir\src" -ErrorAction SilentlyContinue
Copy-Item "src\*.css" -Destination "$backupDir\src" -ErrorAction SilentlyContinue

# Copy components
Write-Host "Copying components..." -ForegroundColor Yellow
Copy-Item "src\components\*.jsx" -Destination "$backupDir\src\components" -ErrorAction SilentlyContinue

# Copy lib
Copy-Item "src\lib\*.js" -Destination "$backupDir\src\lib" -ErrorAction SilentlyContinue

# Copy public files
Write-Host "Copying public assets..." -ForegroundColor Yellow
Copy-Item "public\*" -Destination "$backupDir\public" -Recurse -ErrorAction SilentlyContinue

# Copy database
Copy-Item "database\schema.sql" -Destination "$backupDir\database" -ErrorAction SilentlyContinue

# Count files
$fileCount = (Get-ChildItem -Path $backupDir -Recurse -File).Count

Write-Host ""
Write-Host "Backup complete!" -ForegroundColor Green
Write-Host "Location: $backupDir" -ForegroundColor Cyan
Write-Host "Files backed up: $fileCount" -ForegroundColor Cyan

# Create zip
Write-Host ""
Write-Host "Creating zip archive..." -ForegroundColor Yellow
$zipPath = "ORB_BACKUP_$timestamp.zip"
Compress-Archive -Path $backupDir -DestinationPath $zipPath -Force

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "Zip created: $zipPath ($zipSize MB)" -ForegroundColor Green
