# Comprehensive fix for all API routes
# Adds "const supabase = createAdminClient()" after "try {" in all exported functions

Write-Host "🔧 Adding admin client initialization to all API functions..." -ForegroundColor Cyan

$files = Get-ChildItem -Path "src\app\api" -Filter "*.ts" -Recurse -File

$totalFixed = 0
$totalFiles = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Skip if doesn't use createAdminClient import
    if ($content -notmatch "createAdminClient") {
        continue
    }
    
    $totalFiles++
    $modified = $false
    
    # Pattern to match: "export async function NAME(...) {\n  try {" without "const supabase = createAdminClient()"
    # Replace with:    "export async function NAME(...) {\n  try {\n    const supabase = createAdminClient()"
    
    # Match GET functions
    if ($content -match "(export async function GET.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))") {
        $content = $content -replace "(export async function GET.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))", "`$1`n    const supabase = createAdminClient()`$2"
        $modified = $true
    }
    
    # Match POST functions
    if ($content -match "(export async function POST.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))") {
        $content = $content -replace "(export async function POST.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))", "`$1`n    const supabase = createAdminClient()`$2"
        $modified = $true
    }
    
    # Match PUT functions
    if ($content -match "(export async function PUT.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))") {
        $content = $content -replace "(export async function PUT.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))", "`$1`n    const supabase = createAdminClient()`$2"
        $modified = $true
    }
    
    # Match DELETE functions
    if ($content -match "(export async function DELETE.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))") {
        $content = $content -replace "(export async function DELETE.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))", "`$1`n    const supabase = createAdminClient()`$2"
        $modified = $true
    }
    
    # Match PATCH functions
    if ($content -match "(export async function PATCH.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))") {
        $content = $content -replace "(export async function PATCH.*?\n\s*try \{)(\n\s*)(?!const supabase = createAdminClient\(\))", "`$1`n    const supabase = createAdminClient()`$2"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✅ Fixed: $($file.FullName.Replace((Get-Location).Path + '\', ''))" -ForegroundColor Green
        $totalFixed++
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Processed: $totalFiles files" -ForegroundColor Yellow
Write-Host "  Modified: $totalFixed files" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan
