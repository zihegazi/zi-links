# الاستخدام:
#   powershell -ExecutionPolicy Bypass -File .\pin-download.ps1 -Export .\pinterest_export.html -Out .\PinDownload
param(
  [Parameter(Mandatory = $true)][string]$Export,
  [string]$Out = ".\PinDownload"
)
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$ProgressPreference = "SilentlyContinue"

$html = Get-Content -Raw -Encoding UTF8 $Export
$m = [regex]::Match($html, '<script id="d" type="application/json">(.*?)</script>', 'Singleline')
if (-not $m.Success) { throw "مش لاقي البيانات في الملف. استخدم ملف طلع من زر تصدير HTML." }
$data = $m.Groups[1].Value | ConvertFrom-Json
$pins = @($data.pins)

New-Item -ItemType Directory -Force -Path "$Out\images", "$Out\videos" | Out-Null
$failedFile = Join-Path $Out "failed.txt"
if (Test-Path $failedFile) { Remove-Item $failedFile }

$hdr = @{ "Referer" = "https://www.pinterest.com/"; "User-Agent" = "Mozilla/5.0" }
function Get-File($url, $path) {
  try { Invoke-WebRequest -Uri $url -OutFile $path -Headers $hdr -UseBasicParsing; return $true }
  catch { if (Test-Path $path) { Remove-Item $path -Force }; return $false }
}

$ok = 0; $fail = 0; $i = 0
foreach ($p in $pins) {
  $i++
  Write-Progress -Activity "تحميل" -Status "$i / $($pins.Count)" -PercentComplete (100 * $i / [Math]::Max($pins.Count, 1))
  Write-Host "[$i/$($pins.Count)] $($p.id)"
  if ($p.orig) {
    $ext = if ($p.orig -match '\.(jpg|jpeg|png|gif|webp)(\?|$)') { $Matches[1] } else { "jpg" }
    $f = Join-Path "$Out\images" "$($p.id).$ext"
    if (Test-Path $f) { $ok++ }
    elseif (Get-File $p.orig $f) { $ok++ }
    elseif ($p.thumb -and (Get-File ($p.thumb -replace '/\d+x(\d+)?/', '/736x/') $f)) { $ok++ }
    else { $fail++; Add-Content $failedFile $p.url }
  }
  if ($p.vurl) {
    $f = Join-Path "$Out\videos" "$($p.id).mp4"
    if (-not (Test-Path $f)) {
      if (Get-File $p.vurl $f) { $ok++ } else { $fail++; Add-Content $failedFile "$($p.url) (video)" }
    }
  }
}

# index محلي
$enc = { param($s) [System.Net.WebUtility]::HtmlEncode([string]$s) }
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>Index</title>')
[void]$sb.AppendLine('<style>body{font:14px system-ui;margin:16px}details{margin:4px 16px}summary{cursor:pointer;font-weight:600}.r{display:flex;gap:8px;align-items:center;margin:3px 0}.r img{width:48px;height:48px;object-fit:cover;border-radius:4px}a{color:#06c}</style>')
[void]$sb.AppendLine("<details open><summary>$(& $enc $data.page.title) ($($pins.Count))</summary>")
if ($data.boards) {
  [void]$sb.AppendLine("<details><summary>Boards ($(@($data.boards).Count))</summary>")
  foreach ($b in $data.boards) { [void]$sb.AppendLine("<div class=r><a href=""$(& $enc $b.url)"">$(& $enc $b.title)</a></div>") }
  [void]$sb.AppendLine("</details>")
}
[void]$sb.AppendLine("<details open><summary>Pins</summary>")
foreach ($p in $pins) {
  $img = Get-ChildItem "$Out\images" -Filter "$($p.id).*" -ErrorAction SilentlyContinue | Select-Object -First 1
  $vid = Test-Path "$Out\videos\$($p.id).mp4"
  $src = if ($img) { "images/$($img.Name)" } else { "" }
  $line = "<div class=r>"
  if ($src) { $line += "<a href=""$src""><img src=""$src""></a>" }
  $line += "<a href=""$(& $enc $p.url)"">$(& $enc ($(if ($p.title) { $p.title } else { $p.url })))</a>"
  if ($vid) { $line += " <a href=""videos/$($p.id).mp4"">🎬</a>" }
  $line += "</div>"
  [void]$sb.AppendLine($line)
}
[void]$sb.AppendLine("</details></details></html>")
Set-Content -Path (Join-Path $Out "index.html") -Value $sb.ToString() -Encoding UTF8

Write-Host "خلص: نجح $ok، فشل $fail. افتح $Out\index.html"
if ($fail) { Write-Host "الفاشل في $failedFile" }
