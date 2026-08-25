<#
.SYNOPSIS
    TeamX Benchmark Runner — executes k6 load-test scenarios and collects results.

.DESCRIPTION
    Runs the three k6 benchmark scenarios (query_time, concurrent_tenants, tenant_isolation)
    against a running TeamX backend and saves JSON results to benchmarks/results/.

.PARAMETER BaseUrl
    Override the backend base URL (default: http://localhost:8080/api/v1)

.PARAMETER Scenario
    Run only a specific scenario: 'query_time', 'concurrent_tenants', or 'tenant_isolation'.
    If omitted, all three scenarios run sequentially.

.EXAMPLE
    .\run-benchmarks.ps1
    .\run-benchmarks.ps1 -Scenario query_time
    .\run-benchmarks.ps1 -BaseUrl "http://myserver:8080/api/v1"
#>

param(
    [string]$BaseUrl = "http://localhost:8080/api/v1",
    [ValidateSet("query_time", "concurrent_tenants", "tenant_isolation", "all")]
    [string]$Scenario = "all"
)

$ErrorActionPreference = "Stop"

# -- Paths --------------------------------------------------------------------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$K6Dir       = Join-Path $ScriptDir "k6"
$ScenariosDir = Join-Path $K6Dir "scenarios"
$ResultsDir  = Join-Path $ScriptDir "results"

# Ensure results directory exists
if (-not (Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null
}

# -- Pre-flight checks --------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                  TeamX Benchmark Runner                        " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check k6 is installed
$localK6 = Join-Path $ScriptDir "k6.exe"
$cmdObj = Get-Command k6 -ErrorAction SilentlyContinue
$k6Cmd = if (Test-Path $localK6) { $localK6 } elseif ($cmdObj) { $cmdObj.Source } else { $null }
if (-not $k6Cmd) {
    Write-Host "[ERROR] k6 is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install k6:" -ForegroundColor Yellow
    Write-Host "  Windows (winget):  winget install Grafana.k6" -ForegroundColor Gray
    Write-Host "  Windows (choco):   choco install k6" -ForegroundColor Gray
    Write-Host "  macOS (brew):      brew install k6" -ForegroundColor Gray
    Write-Host "  Docker:            docker run --rm -i grafana/k6 run -" -ForegroundColor Gray
    Write-Host "  Download:          https://k6.io/docs/get-started/installation/" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host "[OK] k6 found: $k6Cmd" -ForegroundColor Green

# Check backend is reachable
Write-Host "  Checking backend at $BaseUrl ..." -NoNewline
try {
    $healthCheck = Invoke-WebRequest -Uri "$BaseUrl/auth/login" -Method POST `
        -ContentType "application/json" -Body '{"email":"","password":""}' `
        -TimeoutSec 5 -ErrorAction SilentlyContinue -UseBasicParsing
} catch {
    # Even a 400/401 means the server is up
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode) {
        Write-Host " UP (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host " UNREACHABLE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Make sure the backend is running:" -ForegroundColor Yellow
        Write-Host '  cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=benchmark' -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
}

# -- Scenario Definitions -----------------------------------------------------
$Scenarios = @{
    "query_time"         = @{
        File        = Join-Path $ScenariosDir "query_time.js"
        Label       = "Query Time Measurement"
        Description = "Measures p50/p95 latency for GET /projects and GET /projects/{id}/tasks"
    }
    "concurrent_tenants" = @{
        File        = Join-Path $ScenariosDir "concurrent_tenants.js"
        Label       = "Concurrent Tenants"
        Description = "50 tenants performing simultaneous CRUD operations"
    }
    "tenant_isolation"   = @{
        File        = Join-Path $ScenariosDir "tenant_isolation.js"
        Label       = "Tenant Isolation Verification"
        Description = "Verifies zero cross-tenant data leakage under load"
    }
}

# Determine which scenarios to run
if ($Scenario -eq "all") {
    $toRun = @("query_time", "concurrent_tenants", "tenant_isolation")
} else {
    $toRun = @($Scenario)
}

# -- Run Scenarios ------------------------------------------------------------
$results = @()

foreach ($name in $toRun) {
    $s = $Scenarios[$name]
    Write-Host ""
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ">> $($s.Label)" -ForegroundColor Yellow
    Write-Host "   $($s.Description)" -ForegroundColor Gray
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""

    $startTime = Get-Date

    # Run k6 with environment variables
    & $k6Cmd run `
        --env BASE_URL=$BaseUrl `
        --env NUM_TENANTS=50 `
        $($s.File)

    $exitCode = $LASTEXITCODE
    $elapsed  = (Get-Date) - $startTime

    $status = if ($exitCode -eq 0) { "[PASSED]" } else { "[FAILED]" }
    $color  = if ($exitCode -eq 0) { "Green" } else { "Red" }

    $results += [PSCustomObject]@{
        Scenario = $s.Label
        Status   = $status
        Duration = "{0:mm\:ss}" -f $elapsed
        Exit     = $exitCode
    }

    Write-Host ""
    Write-Host "  $status - completed in $("{0:mm\:ss}" -f $elapsed)" -ForegroundColor $color
    Write-Host ""
}

# -- Summary Table ------------------------------------------------------------
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                  BENCHMARK RESULTS SUMMARY                     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

foreach ($r in $results) {
    $color = if ($r.Exit -eq 0) { "Green" } else { "Red" }
    $line  = "  {0,-35} {1,-12} {2,6}" -f $r.Scenario, $r.Status, $r.Duration
    Write-Host $line -ForegroundColor $color
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Detailed JSON results saved to: $ResultsDir" -ForegroundColor Gray
Write-Host ""

# Exit with failure if any scenario failed
$anyFailed = $results | Where-Object { $_.Exit -ne 0 }
if ($anyFailed) {
    Write-Host "[WARNING] Some scenarios failed. Review the output above for details." -ForegroundColor Yellow
    exit 1
}

Write-Host "[SUCCESS] All benchmarks passed!" -ForegroundColor Green
