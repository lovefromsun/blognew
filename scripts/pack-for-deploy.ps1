# 打包项目用于部署（排除 node_modules、.next、.git）
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$out = Join-Path $root "blog-deploy.zip"
$temp = Join-Path $env:TEMP "blog-deploy-$(Get-Random)"

New-Item -ItemType Directory -Path $temp -Force | Out-Null
try {
    $toCopy = @("src", "public", "content", "package.json", "package-lock.json", "next.config.ts", "postcss.config.mjs", "tsconfig.json", "eslint.config.mjs", "ecosystem.config.cjs", "next-env.d.ts", "deploy", ".env.example")
    foreach ($item in $toCopy) {
        $src = Join-Path $root $item
        if (Test-Path $src) {
            Copy-Item -Path $src -Destination $temp -Recurse -Force
        }
    }
    Compress-Archive -Path "$temp\*" -DestinationPath $out -Force
    Write-Host "已生成: $out"
} finally {
    Remove-Item -Path $temp -Recurse -Force -ErrorAction SilentlyContinue
}
