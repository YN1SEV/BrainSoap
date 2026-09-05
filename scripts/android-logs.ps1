param(
  [string]$Device = "emulator-5554"
)

adb -s $Device logcat -c
Write-Host "Streaming Firefox Android logs for $Device. Press Ctrl+C to stop."
adb -s $Device logcat -v time | Select-String -Pattern "BrainSoap|Gecko|Firefox|WebExtension|Console"
