try { Stop-Process -Name "Discord" -Force -ErrorAction Stop } catch {}
pnpm build
pnpm inject -branch stable
& "C:\Users\$env:USERNAME\AppData\Local\Discord\Update.exe" --processStart "Discord.exe"
