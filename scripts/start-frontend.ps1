Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\..\frontend"
if (-not (Test-Path "node_modules")) {
    npm install
}
npm start
