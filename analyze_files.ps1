$basePath = "c:\Users\shait\OneDrive\Documentos\GitHub\shaitamamMedAIHub"
$extensions = @("*.py", "*.ts", "*.tsx", "*.js", "*.jsx", "*.json", "*.md", "*.css", "*.sql")
$excludePatterns = @("node_modules", ".next", "venv", "__pycache__", ".git", "dist", "build")

$files = Get-ChildItem -Path $basePath -Recurse -File -Include $extensions | Where-Object {
    $path = $_.FullName
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($path -match [regex]::Escape($pattern)) {
            $exclude = $true
            break
        }
    }
    -not $exclude
}

$results = @()
foreach ($file in $files) {
    $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
    $lineCount = if ($content) { ($content | Measure-Object -Line).Lines } else { 0 }
    $relativePath = $file.FullName.Replace($basePath + "\", "")
    $results += [PSCustomObject]@{
        File = $relativePath
        Lines = $lineCount
        SizeKB = [math]::Round($file.Length / 1024, 1)
    }
}

$results | Sort-Object -Property Lines -Descending | Format-Table -AutoSize

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Total Files: $($results.Count)"
Write-Host "Total Lines: $(($results | Measure-Object -Property Lines -Sum).Sum)"
Write-Host "Total Size: $([math]::Round(($results | Measure-Object -Property SizeKB -Sum).Sum, 1)) KB"
