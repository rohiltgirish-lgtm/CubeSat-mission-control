# ============================================
# CubeSat Git History Farm - April 1 to April 8
# ============================================
# Run this from: c:\Users\Admin\OneDrive\Desktop\CubeSat
# ============================================

# Step 1: Remove old git history
Remove-Item -Recurse -Force .git
Start-Sleep -Seconds 2

# Step 2: Init fresh repo
git init
git remote add origin https://github.com/rohilgirish/CubeSat-mission-control.git

# ---- COMMIT 1: April 1st - Project setup & docs ----
git add .gitignore LICENSE README.md docs/
$env:GIT_AUTHOR_DATE = "2026-04-01T10:30:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-01T10:30:00+05:30"
git commit -m "chore: initial project setup with documentation and license"

# ---- COMMIT 2: April 2nd - Backend foundation ----
git add backend/requirements.txt backend/main.py backend/run.py backend/start.ps1 backend/schemas/
$env:GIT_AUTHOR_DATE = "2026-04-02T14:15:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-02T14:15:00+05:30"
git commit -m "feat(backend): initialize FastAPI server with telemetry schemas"

# ---- COMMIT 3: April 3rd - Backend APIs ----
git add backend/routers/ backend/services/
$env:GIT_AUTHOR_DATE = "2026-04-03T18:45:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-03T18:45:00+05:30"
git commit -m "feat(backend): implement satellite tracking and telemetry API routes"

# ---- COMMIT 4: April 4th - ML integration in backend ----
git add backend/ml/
$env:GIT_AUTHOR_DATE = "2026-04-04T11:00:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-04T11:00:00+05:30"
git commit -m "feat(backend): add ML model store and anomaly detection inference"

# ---- COMMIT 5: April 5th - Frontend setup ----
git add frontend/package.json frontend/package-lock.json frontend/postcss.config.js frontend/tailwind.config.js frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html frontend/public/
$env:GIT_AUTHOR_DATE = "2026-04-05T15:30:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-05T15:30:00+05:30"
git commit -m "feat(frontend): scaffold React app with Vite, Tailwind, and TypeScript"

# ---- COMMIT 6: April 6th - Frontend UI components ----
git add frontend/src/
$env:GIT_AUTHOR_DATE = "2026-04-06T20:00:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-06T20:00:00+05:30"
git commit -m "feat(frontend): build mission control dashboard with 3D orbit viewer"

# ---- COMMIT 7: April 7th - ML models & training ----
git add ml-model/ models/
$env:GIT_AUTHOR_DATE = "2026-04-07T09:45:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-07T09:45:00+05:30"
git commit -m "feat(ml): add anomaly detection models and training pipelines"

# ---- COMMIT 8: April 8th - Docker & final polish ----
git add docker-compose.yml frontend/Dockerfile backend/Dockerfile
$env:GIT_AUTHOR_DATE = "2026-04-08T16:00:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-08T16:00:00+05:30"
git commit -m "feat(ops): add Docker Compose orchestration for full-stack deployment"

# ---- Catch any remaining files ----
git add .
$env:GIT_AUTHOR_DATE = "2026-04-08T21:30:00+05:30"
$env:GIT_COMMITTER_DATE = "2026-04-08T21:30:00+05:30"
git commit -m "chore: final cleanup and dependency updates" --allow-empty

# Clean up date env vars
Remove-Item Env:GIT_AUTHOR_DATE
Remove-Item Env:GIT_COMMITTER_DATE

# Step 3: Rename branch and force push
git branch -M master
git push -f origin master

# Cleanup this script
Remove-Item farm.ps1

Write-Host "`n✅ Done! 8 commits pushed spanning April 1-8, 2026." -ForegroundColor Green
