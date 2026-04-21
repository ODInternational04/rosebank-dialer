# Generate a secure JWT_SECRET
Write-Host "`n=== Generating Secure JWT_SECRET ===`n" -ForegroundColor Cyan

# Generate a random 64-character string
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$jwtSecret = [Convert]::ToBase64String($bytes)

Write-Host "Your new secure JWT_SECRET:" -ForegroundColor Green
Write-Host $jwtSecret -ForegroundColor Yellow

Write-Host "`n=== Instructions ===`n" -ForegroundColor Cyan
Write-Host "1. Copy the JWT_SECRET above"
Write-Host "2. Open your .env.local file"
Write-Host "3. Replace the current JWT_SECRET value with the new one"
Write-Host "4. Add the same value to Vercel environment variables"
Write-Host "`nFile location: .env.local" -ForegroundColor Gray
Write-Host "Current JWT_SECRET length: $(if ($env:JWT_SECRET) { $env:JWT_SECRET.Length } else { 'Not set' })" -ForegroundColor Gray
Write-Host "Required length: 32+ characters" -ForegroundColor Gray
Write-Host "`n"
