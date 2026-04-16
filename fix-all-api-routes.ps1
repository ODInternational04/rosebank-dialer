# Fix all API routes to use admin client instead of regular supabase client
# This ensures all database operations bypass RLS and work with JWT authentication

Write-Host "🔧 Fixing API Routes - Replacing supabase with createAdminClient..." -ForegroundColor Cyan

$files = @(
    "src\app\api\clients\[id]\route.ts",
    "src\app\api\callbacks\route.ts",
    "src\app\api\call-logs\route.ts",
    "src\app\api\call-logs\[id]\route.ts",
    "src\app\api\users\route.ts",
    "src\app\api\users\[id]\route.ts",
    "src\app\api\notifications\route.ts",
    "src\app\api\notifications\[id]\route.ts",
    "src\app\api\user-status\route.ts",
    "src\app\api\auth\verify\route.ts",
    "src\app\api\auth\register\route.ts",
    "src\app\api\dashboard\stats\route.ts",
    "src\app\api\dashboard\daily-performance\route.ts",
    "src\app\api\dashboard\weekly-performance\route.ts",
    "src\app\api\dashboard\user-performance\route.ts",
    "src\app\api\reports\route.ts",
    "src\app\api\clients\stats\route.ts",
    "src\app\api\clients\[id]\availability\route.ts",
    "src\app\api\customer-feedback\route.ts",
    "src\app\api\customer-feedback\[id]\route.ts",
    "src\app\api\customer-feedback\stats\route.ts",
    "src\app\api\customer-feedback\latest-per-client\route.ts",
    "src\app\api\notifications\callback\route.ts",
    "src\app\api\notifications\callback-action\route.ts"
)

$fixedCount = 0
$alreadyFixed = 0
$notFound = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Check if already fixed
        if ($content -match "import \{ createAdminClient \} from '@/lib/supabase'") {
            Write-Host "  ✓ Already fixed: $file" -ForegroundColor Green
            $alreadyFixed++
            continue
        }
        
        # Check if file uses supabase
        if ($content -match "import \{ supabase \} from '@/lib/supabase'") {
            # Replace import
            $content = $content -replace "import \{ supabase \} from '@/lib/supabase'", "import { createAdminClient } from '@/lib/supabase'"
            
            # Add const supabase = createAdminClient() at the beginning of each exported function
            # This is a simpler approach - just replace the import for now
            # The actual function fixes will be done individually
            
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  ✅ Fixed: $file" -ForegroundColor Yellow
            $fixedCount++
        } else {
            Write-Host "  ℹ️  No supabase import: $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ Not found: $file" -ForegroundColor Red
        $notFound++
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  Fixed: $fixedCount files" -ForegroundColor Yellow
Write-Host "  Already fixed: $alreadyFixed files" -ForegroundColor Green
Write-Host "  Not found: $notFound files" -ForegroundColor Red
Write-Host "================================`n" -ForegroundColor Cyan

if ($fixedCount -gt 0) {
    Write-Host "⚠️  IMPORTANT: You need to add 'const supabase = createAdminClient()' at the beginning of each function in these files!" -ForegroundColor Yellow
    Write-Host "   Example:" -ForegroundColor Gray
    Write-Host "   export async function GET(request: NextRequest) {" -ForegroundColor Gray
    Write-Host "     const supabase = createAdminClient()  // Add this line" -ForegroundColor Green
    Write-Host "     ..." -ForegroundColor Gray
}