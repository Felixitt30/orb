# PowerShell script to resize icons using .NET System.Drawing
# This creates properly sized PNG icons from the 512px source

$sourcePath = "public\icons\icon-512.png"
$sizes = @(72, 96, 128, 144, 152, 167, 180, 192)

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

# Load source image
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $sourcePath))

foreach ($size in $sizes) {
    $outputPath = "public\icons\icon-$size.png"
    
    # Create new bitmap with target size
    $newImage = New-Object System.Drawing.Bitmap($size, $size)
    
    # Create graphics object for high-quality resize
    $graphics = [System.Drawing.Graphics]::FromImage($newImage)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    # Draw resized image
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    
    # Save as PNG
    $newImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $newImage.Dispose()
    
    Write-Host "Created $outputPath ($size x $size)"
}

# Cleanup source
$sourceImage.Dispose()

Write-Host "`nAll icons created successfully!"
