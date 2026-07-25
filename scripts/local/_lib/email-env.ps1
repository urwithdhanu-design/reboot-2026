#Requires -Version 5.1
# Bootstrap Gmail SMTP .env files for local Java services (kyc, policy, notification).

function Read-DotEnvMap([string] $Path) {
  $map = @{}
  if (-not (Test-Path $Path)) { return $map }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or -not $line.Contains("=")) { return }
    $eq = $line.IndexOf("=")
    $k = $line.Substring(0, $eq).Trim()
    $v = $line.Substring($eq + 1).Trim().Trim('"').Trim("'")
    if ($k -eq "EMAIL_PASS") { $v = $v -replace "\s", "" }
    if ($k) { $map[$k] = $v }
  }
  return $map
}

function Get-EmailEnvSource {
  param([string] $RepoRoot)

  $candidates = @(
    (Join-Path $RepoRoot "apps\services\kyc-service\.env"),
    (Join-Path $RepoRoot ".env"),
    "C:\projects\kindred-circle-crm\email-api\.env"
  )
  foreach ($path in $candidates) {
    $map = Read-DotEnvMap $path
    if ($map["EMAIL_USER"] -and $map["EMAIL_PASS"]) {
      return @{ path = $path; map = $map }
    }
  }
  return $null
}

function Ensure-EmailEnvFiles {
  param([string] $RepoRoot)

  $kycEnv = Join-Path $RepoRoot "apps\services\kyc-service\.env"
  if (Test-Path $kycEnv) {
    $existing = Read-DotEnvMap $kycEnv
    if ($existing["EMAIL_USER"] -and $existing["EMAIL_PASS"]) {
      return $existing
    }
  }

  $source = Get-EmailEnvSource -RepoRoot $RepoRoot
  if (-not $source) {
    Write-Host "Email not configured - copy apps\services\kyc-service\.env.example to .env and set EMAIL_USER + EMAIL_PASS (Gmail App Password)."
    return @{}
  }

  $fromName = "Reboot 2026 Insurance"
  if ($source.map["EMAIL_FROM_NAME"] -and $source.map["EMAIL_FROM_NAME"] -notmatch "SalesDesk|Kindred") {
    $fromName = $source.map["EMAIL_FROM_NAME"]
  }
  $lines = @(
    "# Gmail SMTP - auto-copied from $($source.path)"
    "EMAIL_USER=$($source.map['EMAIL_USER'])"
    "EMAIL_PASS=$($source.map['EMAIL_PASS'])"
    "EMAIL_FROM_NAME=$fromName"
    "EMAIL_ENABLED=true"
  )
  $lines | Set-Content -Path $kycEnv -Encoding utf8

  foreach ($service in @("policy-service", "notification-service")) {
    $target = Join-Path $RepoRoot "apps\services\$service\.env"
    if (-not (Test-Path $target)) {
      $lines | Set-Content -Path $target -Encoding utf8
    }
  }

  Write-Host "Email env ready for local services (from $($source.path))"
  return Read-DotEnvMap $kycEnv
}

function Get-EmailEnvCmdPrefix([hashtable] $EmailMap) {
  if (-not $EmailMap -or -not $EmailMap["EMAIL_USER"] -or -not $EmailMap["EMAIL_PASS"]) {
    return ""
  }
  $parts = @()
  foreach ($key in @("EMAIL_USER", "EMAIL_PASS", "EMAIL_FROM_NAME", "EMAIL_ENABLED")) {
    if ($EmailMap[$key]) {
      $parts += "set $key=$($EmailMap[$key])"
    }
  }
  if ($parts.Count -eq 0) { return "" }
  return ($parts -join " && ") + " && "
}
