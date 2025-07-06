# PowerShell script to copy all files from a2zlottoserver and nodeserver to nodeserver-lotto

Write-Host "Copying files from a2zlottoserver and nodeserver to nodeserver-lotto..."

# Copy all middleware files
Write-Host "Copying middleware files..."
Copy-Item "../a2zlottoserver/src/middlewares/*" "src/middlewares/" -Force

# Copy all model files
Write-Host "Copying model files..."
Copy-Item "../a2zlottoserver/src/models/*" "src/models/" -Force

# Copy all controller files
Write-Host "Copying controller files..."
Copy-Item "../a2zlottoserver/src/controllers/*" "src/controllers/" -Force

# Copy all route files
Write-Host "Copying route files..."
Copy-Item "../a2zlottoserver/src/routes/*" "src/routes/" -Force

# Copy all utility files
Write-Host "Copying utility files..."
Copy-Item "../a2zlottoserver/src/utils/*" "src/utils/" -Force

# Copy swagger files
Write-Host "Copying swagger files..."
Copy-Item "../a2zlottoserver/swagger.js" "." -Force
Copy-Item "../a2zlottoserver/swagger_doc.json" "." -Force

# Copy public files
Write-Host "Copying public files..."
Copy-Item "../a2zlottoserver/public/*" "public/" -Force

# Copy uploads directory
Write-Host "Copying uploads directory..."
Copy-Item "../a2zlottoserver/uploads/*" "uploads/" -Force

# Copy other config files
Write-Host "Copying other config files..."
Copy-Item "../a2zlottoserver/.gitignore" "." -Force
Copy-Item "../a2zlottoserver/Procfile" "." -Force
Copy-Item "../a2zlottoserver/README.md" "." -Force

Write-Host "File copying completed!" 