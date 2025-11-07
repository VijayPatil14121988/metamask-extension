# Testing Steps - Shard Wallet Snap

## Current Status
✅ Server running: http://localhost:8080
✅ Manifest shasum matches bundle: `w7QRUCbXo/JTQpNd3SnIwk7aTrDRcwiu01umBmej1wI=`

---

## Clear Cache and Test

### Option 1: Clear Browser Cache (Recommended)

1. **Open Chrome DevTools**: Press `F12` or `Cmd+Option+I` (Mac)

2. **Open Application Tab** → **Storage** → **Clear site data**
   - Check "Cached images and files"
   - Check "Local Storage"
   - Check "IndexedDB"
   - Click "Clear site data"

3. **Clear MetaMask Flask Cache**:
   - Open MetaMask Flask
   - Settings → Advanced
   - Scroll to "Clear activity tab data" → Click "Clear"
   - Restart browser

4. **Try again**: http://localhost:8080/test-page.html

---

### Option 2: Use Incognito Mode (Fastest)

1. **Open Incognito Window**: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows)

2. **Install MetaMask Flask** in incognito:
   - Go to `chrome://extensions`
   - Enable "Allow in incognito" for MetaMask Flask

3. **Open test page**: http://localhost:8080/test-page.html

4. **Click "Connect Snap"**

---

### Option 3: Force Refresh

1. **Hard Refresh the page**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

2. **Then try connecting**

---

## Verification Commands

Run these to confirm everything is correct:

```bash
# Verify server is running
curl -s http://localhost:8080/snap.manifest.json | grep shasum

# Verify bundle shasum
curl -s http://localhost:8080/bundle.js | shasum -a 256

# They should match:
# Manifest: w7QRUCbXo/JTQpNd3SnIwk7aTrDRcwiu01umBmej1wI=
# Bundle: c3b411502...  (hex) = w7QRUCbXo/JTQpNd3SnIwk7aTrDRcwiu01umBmej1wI= (base64)
```

---

## If Still Failing

The issue is likely MetaMask Flask caching the old manifest/bundle.

**Solution**: Uninstall the Snap completely:

1. Open MetaMask Flask
2. Settings → Snaps
3. Find "Shard Wallet Snap" → Click → Remove
4. Restart browser
5. Try installing again

---

## Success Indicators

When it works, you'll see:

1. ✅ MetaMask Flask permission dialog appears
2. ✅ Shows: "Shard Wallet Snap wants to:"
   - Store and manage data
   - Display notifications
   - Run scheduled tasks
   - Access Ethereum accounts
3. ✅ After approval: "Snap installed successfully!"

Then test:
- **Securitize Wallet** → Should return `{ "success": true, "healthStatus": {...} }`
- **Check Health** → Should show all 4 storage locations as "healthy"
- **Get Version** → Should return `{ "version": "1.0.0" }`
