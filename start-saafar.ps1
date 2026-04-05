param(
  [int]$Port = 4173,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$publicDir = Join-Path $PSScriptRoot "public"
$publicRoot = [System.IO.Path]::GetFullPath($publicDir)
$prefix = "http://localhost:$Port/"

if (-not (Test-Path $publicRoot)) {
  throw "No se encontro la carpeta public en $publicRoot"
}

$mimeTypes = @{
  ".css"  = "text/css; charset=utf-8"
  ".html" = "text/html; charset=utf-8"
  ".js"   = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".svg"  = "image/svg+xml"
  ".txt"  = "text/plain; charset=utf-8"
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)
$listener.Start()

Write-Host "Saafar 1.0 H disponible en $prefix"
Write-Host "Presiona Ctrl+C para detener el servidor."

if (-not $NoBrowser) {
  Start-Process $prefix
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $requestPath = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)

    if ([string]::IsNullOrWhiteSpace($requestPath) -or $requestPath -eq "/") {
      $requestPath = "/index.html"
    }

    $relativePath = $requestPath.TrimStart("/") -replace "/", "\"
    $targetPath = [System.IO.Path]::GetFullPath((Join-Path $publicRoot $relativePath))

    if (-not $targetPath.StartsWith($publicRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("Acceso denegado.")
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
      continue
    }

    if ((Test-Path $targetPath) -and (Get-Item $targetPath).PSIsContainer) {
      $targetPath = Join-Path $targetPath "index.html"
    }

    if (-not (Test-Path $targetPath)) {
      $context.Response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("Archivo no encontrado.")
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
      continue
    }

    $extension = [System.IO.Path]::GetExtension($targetPath).ToLowerInvariant()
    $contentType = $mimeTypes[$extension]

    if (-not $contentType) {
      $contentType = "application/octet-stream"
    }

    $fileBytes = [System.IO.File]::ReadAllBytes($targetPath)
    $context.Response.ContentType = $contentType
    $context.Response.ContentLength64 = $fileBytes.Length
    $context.Response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
    $context.Response.Close()
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
