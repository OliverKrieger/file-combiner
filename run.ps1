param(
    [string]$Path,
    [string]$Name,
    [int]$ChunkSize,
    [string]$Include,        # ".md,.txt"
    [string]$Exclude,        # ".obsidian,imgs"
    [ValidateSet("merge", "replace")]
    [string]$ExcludeMode = "merge"
)

# Ensure we execute from the repo root (where this script lives),
# so `npm run combine` uses the correct package.json.
Push-Location $PSScriptRoot
try {
    $forward = @()

    if ($Path) { $forward += @("--path", $Path) }
    if ($Name) { $forward += @("--name", $Name) }
    if ($PSBoundParameters.ContainsKey("ChunkSize")) { $forward += @("--chunkSize", $ChunkSize) }
    if ($Include) { $forward += @("--include", $Include) }
    if ($Exclude) { $forward += @("--exclude", $Exclude) }

    # only forward excludeMode if exclude was provided
    if ($Exclude -and $ExcludeMode) { $forward += @("--excludeMode", $ExcludeMode) }

    # NPM requires `--` to forward args to the Node script
    if ($forward.Count -gt 0) {
        npm run combine -- @forward
    }
    else {
        npm run combine
    }

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}