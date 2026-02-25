param(
    [string]$ProductsFile = "data/products.js",
    [string]$CatalogFile = "js/config/catalog-structure.js"
)

function Read-Products {
    param([string]$Path)

    if (-not (Test-Path -Path $Path)) {
        throw "No se encontro el archivo de productos: $Path"
    }

    $raw = Get-Content -Path $Path -Raw
    $json = $raw -replace '^export const PRODUCTS\s*=\s*', '' -replace ';\s*$', ''
    return $json | ConvertFrom-Json
}

function Read-CatalogPairs {
    param([string]$Path)

    if (-not (Test-Path -Path $Path)) {
        throw "No se encontro el archivo de catalogo: $Path"
    }

    $pairs = @{}
    $raw = Get-Content -Path $Path -Raw
    $groupMatches = [regex]::Matches($raw, 'brand:\s*"([^"]+)"[\s\S]*?lines:\s*\[([\s\S]*?)\]')

    foreach ($group in $groupMatches) {
        $brand = $group.Groups[1].Value
        $linesRaw = $group.Groups[2].Value
        $lineMatches = [regex]::Matches($linesRaw, '"([^"]+)"')

        foreach ($lineMatch in $lineMatches) {
            $line = $lineMatch.Groups[1].Value
            $pairs["$brand||$line"] = $true
        }
    }

    return $pairs
}

function Get-MissingImages {
    param($Products)

    $missing = @()
    foreach ($product in $Products) {
        foreach ($field in @("image", "hoverImage")) {
            $path = $product.$field
            if ($path -and -not (Test-Path -Path $path)) {
                $missing += [PSCustomObject]@{
                    id = $product.id
                    field = $field
                    path = $path
                }
            }
        }
    }
    return $missing
}

function Get-DuplicateSlugs {
    param($Products)

    return $Products |
        Group-Object -Property slug |
        Where-Object { $_.Name -and $_.Count -gt 1 } |
        Sort-Object -Property Count -Descending
}

try {
    $products = Read-Products -Path $ProductsFile
    $catalogPairs = Read-CatalogPairs -Path $CatalogFile

    $invalidProducts = $products | Where-Object {
        -not $_.id -or
        -not $_.name -or
        -not $_.brand -or
        -not $_.line -or
        -not $_.image
    }

    $missingImages = Get-MissingImages -Products $products
    $duplicateSlugs = Get-DuplicateSlugs -Products $products

    $pairsMissingInCatalog = @()
    foreach ($pair in ($products | ForEach-Object { "$($_.brand)||$($_.line)" } | Sort-Object -Unique)) {
        if (-not $catalogPairs.ContainsKey($pair)) {
            $pairsMissingInCatalog += $pair
        }
    }

    Write-Host "---- Validacion de catalogo ----"
    Write-Host "Productos totales: $($products.Count)"
    Write-Host "Productos invalidos: $($invalidProducts.Count)"
    Write-Host "Imagenes faltantes: $($missingImages.Count)"
    Write-Host "Slugs duplicados: $($duplicateSlugs.Count)"
    Write-Host "Brand/line no presentes en config: $($pairsMissingInCatalog.Count)"

    if ($invalidProducts.Count -gt 0) {
        Write-Host ""
        Write-Host "Productos invalidos (primeros 10):"
        $invalidProducts | Select-Object -First 10 id, name, brand, line, image | Format-Table
    }

    if ($missingImages.Count -gt 0) {
        Write-Host ""
        Write-Host "Imagenes faltantes (primeras 20):"
        $missingImages | Select-Object -First 20 id, field, path | Format-Table
    }

    if ($duplicateSlugs.Count -gt 0) {
        Write-Host ""
        Write-Host "Slugs duplicados:"
        $duplicateSlugs | Select-Object Name, Count | Format-Table
    }

    if ($pairsMissingInCatalog.Count -gt 0) {
        Write-Host ""
        Write-Host "Brand/line faltantes en config:"
        $pairsMissingInCatalog | Select-Object -First 20
    }
}
catch {
    Write-Error $_
    exit 1
}
