try { Stop-Process -Name "Discord" -Force -ErrorAction Stop } catch {}

# Sync fork avec upstream (sans interaction)
git fetch upstream

# Vérifie si fast-forward possible
$ffPossible = git merge-base --is-ancestor upstream/main main
if ($LASTEXITCODE -eq 0) {
    git checkout main
    git merge --ff-only upstream/main
    git push origin main
} else {
    Write-Host "Sync skipped: nécessite intervention (conflits ou divergence)."
}

pnpm build
pnpm inject -branch stable

& "C:\Users\$env:USERNAME\AppData\Local\Discord\Update.exe" --processStart "Discord.exe"
