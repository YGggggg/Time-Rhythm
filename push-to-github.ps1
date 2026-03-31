param(
    [string]$CommitMessage = "chore: sync backend frontend and android app",
    [string]$RemoteUrl = "https://github.com/YGggggg/Time-Rhythm.git",
    [string]$Branch = "main",
    [string]$GitUserName,
    [string]$GitUserEmail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & git @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed with exit code $LASTEXITCODE."
    }
}

function Get-GitOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    $result = & git @Arguments 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    return ($result | Out-String).Trim()
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Step "Checking git availability"
Invoke-Git -Arguments @("--version")

if (-not (Test-Path ".git")) {
    Write-Step "Initializing repository"
    Invoke-Git -Arguments @("init", "--initial-branch=$Branch")
}
else {
    Write-Step "Repository already exists"
}

Write-Step "Preparing branch"
Invoke-Git -Arguments @("checkout", "-B", $Branch)

$existingUserName = Get-GitOutput -Arguments @("config", "--get", "user.name")
$existingUserEmail = Get-GitOutput -Arguments @("config", "--get", "user.email")

if ($GitUserName) {
    Invoke-Git -Arguments @("config", "user.name", $GitUserName)
    $existingUserName = $GitUserName
}

if ($GitUserEmail) {
    Invoke-Git -Arguments @("config", "user.email", $GitUserEmail)
    $existingUserEmail = $GitUserEmail
}

if (-not $existingUserName -or -not $existingUserEmail) {
    throw @"
Missing git identity.

Run the script again with:
  .\push-to-github.ps1 -GitUserName "Your Name" -GitUserEmail "you@example.com"

Or set it once:
  git config user.name "Your Name"
  git config user.email "you@example.com"
"@
}

Write-Step "Ensuring origin remote"
$existingOrigin = Get-GitOutput -Arguments @("remote", "get-url", "origin")
if (-not $existingOrigin) {
    Invoke-Git -Arguments @("remote", "add", "origin", $RemoteUrl)
}
elseif ($existingOrigin -ne $RemoteUrl) {
    Invoke-Git -Arguments @("remote", "set-url", "origin", $RemoteUrl)
}

Write-Step "Staging selected project folders"
Invoke-Git -Arguments @("add", "--", ".gitignore", "push-to-github.ps1", "backend", "frontend", "Time_Rhythm_APP")

$trackedEnv = Get-GitOutput -Arguments @("ls-files", "--", "backend/.env")
if ($trackedEnv) {
    Write-Step "Removing backend/.env from git index"
    Invoke-Git -Arguments @("rm", "--cached", "--force", "--", "backend/.env")
}

$hasStagedChanges = $true
& git diff --cached --quiet --exit-code
if ($LASTEXITCODE -eq 0) {
    $hasStagedChanges = $false
}
elseif ($LASTEXITCODE -ne 1) {
    throw "Unable to inspect staged changes."
}

if (-not $hasStagedChanges) {
    Write-Step "No staged changes to commit"
}
else {
    Write-Step "Creating commit"
    Invoke-Git -Arguments @("commit", "-m", $CommitMessage)
}

Write-Step "Pushing to origin/$Branch"
Invoke-Git -Arguments @("push", "-u", "origin", $Branch)

Write-Host ""
Write-Host "Push completed successfully." -ForegroundColor Green
