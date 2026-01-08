# 🔐 Handoff: Envault Secret Sync

**Date:** 2026-01-08  
**From:** treeb (Treebird)  
**To:** Sherlock  
**Priority:** Medium  

---

## 📋 Situation

Birdharp is setting up their **new machine** and needs to retrieve environment variables (`.env` files) from the **other machine** (where srlk/Sherlock is operating).

I ran an **Envault audit** on `~/Dev` and found:

| Status | Project | Issue |
|--------|---------|-------|
| ⚠️ UNTRACKED | Artisan | Has `.env`, no `config.enc` |
| ❌ FAIL | Artisan | Missing newline at EOF |
| ⚠️ UNTRACKED | Cosan | Has `.env`, no `config.enc` |
| ✅ PASS | Cosan | Formatting OK |
| ⚠️ UNTRACKED | Mappersan | Has `.env`, no `config.enc` |
| ✅ PASS | Mappersan | Formatting OK |

**The Problem:** The `.env` files exist locally on both machines, but they have **never been encrypted** (`envault push`) and committed to Git. This means there's no `config.enc` to pull from the remote repository.

---

## ✅ Suggested Solution

### On YOUR machine (srlk/Sherlock's machine):

```bash
# 1. Set the shared Envault key
export ENVAULT_KEY="869853411a4b7212ad7cf558c5f1533f1795fd423ca2cdc97e81c2c253bc8689"

# 2. Fix any formatting issues first
cd ~/Dev/Artisan && envault check --fix
cd ~/Dev/Cosan && envault check --fix
cd ~/Dev/Mappersan && envault check --fix

# 3. Encrypt the .env files
cd ~/Dev/Artisan && envault push
cd ~/Dev/Cosan && envault push
cd ~/Dev/Mappersan && envault push

# 4. Commit and push the encrypted files
cd ~/Dev/Artisan && git add config.enc && git commit -m "chore: encrypt secrets with Envault" && git push
cd ~/Dev/Cosan && git add config.enc && git commit -m "chore: encrypt secrets with Envault" && git push
cd ~/Dev/Mappersan && git add config.enc && git commit -m "chore: encrypt secrets with Envault" && git push
```

### On birdharp's NEW machine (after you push):

```bash
# 1. Pull the latest commits
cd ~/Dev/Artisan && git pull
cd ~/Dev/Cosan && git pull
cd ~/Dev/Mappersan && git pull

# 2. Set the key and decrypt
export ENVAULT_KEY="869853411a4b7212ad7cf558c5f1533f1795fd423ca2cdc97e81c2c253bc8689"
cd ~/Dev/Artisan && envault pull
cd ~/Dev/Cosan && envault pull
cd ~/Dev/Mappersan && envault pull
```

---

## 🔑 Key Information

- **ENVAULT_KEY:** `869853411a4b7212ad7cf558c5f1533f1795fd423ca2cdc97e81c2c253bc8689`
- **Encryption:** AES-256-GCM (authenticated encryption)
- **Projects affected:** Artisan, Cosan, Mappersan

---

## 📝 Notes

1. The Envault CLI being used is the **local build** in `~/Dev/Envault`, not the global `envault` npm package (which is a different cloud service).
   
2. To use the local Envault, either:
   - Run `npm link` in `~/Dev/Envault` to make it globally available, OR
   - Use `node ~/Dev/Envault/dist/bin/envault.js` directly

3. After this initial sync, remember to always `envault push` after updating `.env` files and commit the `config.enc`.

---

## 🔔 Status

- [x] Audit completed on birdharp's machine
- [x] Myceliumail sent to srlk with instructions
- [ ] srlk encrypts and pushes `config.enc` files
- [ ] birdharp pulls and decrypts

**Awaiting action from Sherlock/srlk.**

---

*Part of the Treebird Ecosystem* 🌳
