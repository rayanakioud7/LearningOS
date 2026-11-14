param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$studyRoot = $PSScriptRoot
$studyPidFile = Join-Path $studyRoot '.server.pid'
$studyServer = Join-Path $studyRoot 'server.mjs'
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
$studyNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$studyNode = if ($studyNodeCommand) { $studyNodeCommand.Source } else { 'C:\Program Files\WindowsApps\OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $studyNode)) { throw 'Node.js 20 or newer is needed. Install it from nodejs.org, then reopen this launcher.' }
if (Test-Path -LiteralPath $studyPidFile) {
    $studyProcessId = [int](Get-Content -LiteralPath $studyPidFile)
    $studyProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $studyProcessId" -ErrorAction SilentlyContinue
    if ($studyProcess -and $studyProcess.CommandLine.Contains($studyServer)) { Start-Process 'http://127.0.0.1:4173'; exit 0 }
}
$studyProcess = Start-Process -FilePath $studyNode -ArgumentList ('"' + $studyServer + '"') -WorkingDirectory $studyRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $studyRoot 'server.log') -RedirectStandardError (Join-Path $studyRoot 'server-error.log')
Set-Content -LiteralPath $studyPidFile -Value $studyProcess.Id
Start-Sleep -Milliseconds 700
if ($studyProcess.HasExited) { throw 'The local server could not start. Read server-error.log; another app may be using port 4173.' }
Start-Process 'http://127.0.0.1:4173'
