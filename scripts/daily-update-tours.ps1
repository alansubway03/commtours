# 每日更新旅行團：先抓五家旅行社，再以 upsert 寫入 Supabase
# 使用方式：
#   1. 在專案根目錄執行： .\scripts\daily-update-tours.ps1
#   2. 或由 Windows 工作排程器每天呼叫此腳本（需先設好 .env.local 或系統環境變數）

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

# 載入 .env.local（若存在）
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim().Trim('"'), "Process")
        }
    }
}

Write-Host "[daily-update-tours] 開始抓取..."
npx tsx scripts/scrape-tours-playwright.ts
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$outputDir = Join-Path $ProjectRoot "scripts\output"
# 只 push 目前有在抓的旅行社（金怡、縱橫遊已暫停）
$files = @(
    "tours-wingon.json",
    "tours-egl.json",
    "tours-jetour.json"
)

Write-Host "[daily-update-tours] 開始 upsert 到 Supabase..."
foreach ($f in $files) {
    $path = Join-Path $outputDir $f
    if (Test-Path $path) {
        npx tsx scripts/push-tours-to-supabase.ts --upsert $path
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
}

Write-Host "[daily-update-tours] 完成。"
