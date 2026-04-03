<#
.SYNOPSIS
    SHI Dashboard - Build & Run wrapper
.DESCRIPTION
    Runs run.py with all arguments forwarded.
    Usage:
        .\run.ps1              # install + db setup + start both servers
        .\run.ps1 --seed       # also seed test data
        .\run.ps1 --clean      # clean reinstall
        .\run.ps1 --db-only    # only run database setup
        .\run.ps1 --skip-db    # skip database, just start servers
        .\run.ps1 --install    # only install dependencies
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$python = $null
foreach ($cmd in @("python", "python3", "py")) {
    $found = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($found) {
        $python = $found.Source
        break
    }
}

if (-not $python) {
    Write-Host "[ERROR] Python not found. Install Python 3.10+ first." -ForegroundColor Red
    exit 1
}

& $python "$ScriptDir\run.py" @args
