param(
    [string]$Path,
    [string]$Name,
    [int]$ChunkSize,
    [string]$Include,        # ".md,.txt"
    [string]$Exclude,        # ".obsidian,imgs"
    [ValidateSet("merge", "replace")]
    [string]$ExcludeMode = "merge"
)

Push-Location $PSScriptRoot
try {
    $nodeArgs = @("scripts/combine/index.js")

    if ($Path) { $nodeArgs += @("--path", $Path) }
    if ($Name) { $nodeArgs += @("--name", $Name) }
    if ($PSBoundParameters.ContainsKey("ChunkSize")) { $nodeArgs += @("--chunkSize", "$ChunkSize") }
    if ($Include) { $nodeArgs += @("--include", $Include) }
    if ($Exclude) { $nodeArgs += @("--exclude", $Exclude) }
    if ($Exclude -and $ExcludeMode) { $nodeArgs += @("--excludeMode", $ExcludeMode) }

    Write-Host "Running: node $($nodeArgs -join ' ')" -ForegroundColor Cyan
    & node @nodeArgs

    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
finally {
    Pop-Location
}