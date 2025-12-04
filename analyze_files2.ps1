$basePath = "c:\Users\shait\OneDrive\Documentos\GitHub\shaitamamMedAIHub"
$extensions = @("*.py", "*.ts", "*.tsx", "*.js", "*.jsx", "*.md", "*.css", "*.sql")
$excludePatterns = @("node_modules", ".next", "venv", "__pycache__", ".git", "dist", "build", "package-lock")

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

Write-Host ""
Write-Host "=== TOP 30 LARGEST FILES (by lines) ===" -ForegroundColor Cyan
$results | Sort-Object -Property Lines -Descending | Select-Object -First 30 | Format-Table @{L='Lines';E={$_.Lines};A='Right';W=7}, @{L='KB';E={$_.SizeKB};A='Right';W=8}, @{L='File';E={$_.File}} -AutoSize

Write-Host ""
Write-Host "=== BY FOLDER ===" -ForegroundColor Cyan
$byFolder = $results | ForEach-Object {
    $folder = Split-Path $_.File -Parent
    if (-not $folder) { $folder = "(root)" }
    [PSCustomObject]@{
        Folder = $folder
        Lines = $_.Lines
        SizeKB = $_.SizeKB
    }
} | Group-Object -Property Folder | ForEach-Object {
    [PSCustomObject]@{
        Folder = $_.Name
        Files = $_.Count
        TotalLines = ($_.Group | Measure-Object -Property Lines -Sum).Sum
        TotalKB = [math]::Round(($_.Group | Measure-Object -Property SizeKB -Sum).Sum, 1)
    }
} | Sort-Object -Property TotalLines -Descending

$byFolder | Format-Table @{L='Lines';E={$_.TotalLines};A='Right';W=7}, @{L='Files';E={$_.Files};A='Right';W=6}, @{L='KB';E={$_.TotalKB};A='Right';W=8}, @{L='Folder';E={$_.Folder}} -AutoSize

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host "Total Files: $($results.Count)"
Write-Host "Total Lines: $(($results | Measure-Object -Property Lines -Sum).Sum)"
Write-Host "Total Size: $([math]::Round(($results | Measure-Object -Property SizeKB -Sum).Sum, 1)) KB"
