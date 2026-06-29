$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
$env:REACT_NATIVE_PACKAGER_HOSTNAME=$ip

# Actualizar api.js con la IP correcta
$apiPath = "src\services\api.js"
$content = Get-Content $apiPath -Raw
$content = $content -replace 'http://[\d.]+:5000/api', "http://$ip`:5000/api"
Set-Content $apiPath $content

Write-Host "Usando IP: $ip"
npx expo start --lan