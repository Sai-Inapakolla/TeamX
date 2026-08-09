Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\..\backend"
mvn spring-boot:run -Dspring.profiles.active=dev
