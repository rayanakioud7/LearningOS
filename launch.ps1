param([switch]$Stop, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$studyRoot = $PSScriptRoot
$studyPidFile = Join-Path $studyRoot '.server.pid'
$studyServer = Join-Path $studyRoot 'server.mjs'
$studyUrl = 'http://127.0.0.1:4173'
$studyVersion = (Get-Content -Raw -LiteralPath (Join-Path $studyRoot 'package.json') | ConvertFrom-Json).version
function Get-LearningHealth {
    try { return Invoke-RestMethod -Uri "$studyUrl/health" -TimeoutSec 1 -ErrorAction Stop } catch { return $null }
}
function Test-LearningHealth($health) {
    return $health -and $health.app -eq 'LearningOS' -and $health.version -eq $studyVersion -and [string]::Equals([string]$health.projectRoot, $studyRoot, [System.StringComparison]::OrdinalIgnoreCase)
}
if ($Stop) {
    if (Test-Path -LiteralPath $studyPidFile) {
        $studyProcessId = [int](Get-Content -LiteralPath $studyPidFile)
        $studyProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $studyProcessId" -ErrorAction SilentlyContinue
        if ($studyProcess -and $studyProcess.CommandLine.Contains($studyServer)) { Stop-Process -Id $studyProcessId }
        Remove-Item -LiteralPath $studyPidFile
    }
    Write-Host 'Learning OS local server stopped.'
    exit 0
}
$studyHealth = Get-LearningHealth
if (Test-LearningHealth $studyHealth) {
    Set-Content -LiteralPath $studyPidFile -Value $studyHealth.pid
    Write-Host "LearningOS v$studyVersion is already running from $studyRoot"
    if (-not $NoBrowser) { Start-Process $studyUrl }
    exit 0
}
if ($studyHealth) { throw "Port 4173 is serving a different app or version. Stop that server before starting LearningOS from $studyRoot." }
$studyNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$studyNode = if ($studyNodeCommand) { $studyNodeCommand.Source } else { 'C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $studyNode)) { throw 'Node.js 20 or newer is needed. Install it from nodejs.org, then reopen this launcher.' }
$studyProcess = Start-Process -FilePath $studyNode -ArgumentList ('"' + $studyServer + '"') -WorkingDirectory $studyRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $studyRoot 'server.log') -RedirectStandardError (Join-Path $studyRoot 'server-error.log')
Set-Content -LiteralPath $studyPidFile -Value $studyProcess.Id
$studyReady = $false
for ($studyAttempt = 0; $studyAttempt -lt 20; $studyAttempt++) {
    if (Test-LearningHealth (Get-LearningHealth)) { $studyReady = $true; break }
    if ($studyProcess.HasExited) { break }
    Start-Sleep -Milliseconds 200
}
if (-not $studyReady) { throw "LearningOS did not become ready. Read $studyRoot\server-error.log. Another app may be using port 4173." }
Write-Host "LearningOS v$studyVersion is running from $studyRoot"
Write-Host "Open $studyUrl in Zen. Press Ctrl+Shift+R if you still see an older design."
if (-not $NoBrowser) { Start-Process $studyUrl }
