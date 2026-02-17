# Icon-Problem beheben

## Problem
Die Icons erscheinen als weißes Fenster - das bedeutet, dass die PNG-Dateien wahrscheinlich:
- Weißen oder transparenten Hintergrund haben statt Brand-Blau (#2979FF)
- Nicht korrekt konvertiert wurden
- Die falsche Größe haben

## Lösung: Icons neu erstellen

### Schritt 1: SVG öffnen
Öffne `public/icon.svg` in einem Browser - es sollte ein schwarzes Quadrat mit weißem Logo zeigen.

### Schritt 2: PNG neu konvertieren

**Option A: Online-Tool (Empfohlen)**
1. Gehe zu https://convertio.co/svg-png/
2. Lade `icon.svg` hoch
3. Stelle sicher, dass **"Hintergrund behalten"** aktiviert ist
4. Exportiere als PNG:
   - **192x192 Pixel** → Speichere als `icon-192x192.png`
   - **512x512 Pixel** → Speichere als `icon-512x512.png`
5. **WICHTIG:** Stelle sicher, dass die PNGs einen **blauen Hintergrund (#2979FF)** haben (nicht transparent oder weiß!)

**Option B: ImageMagick mit Hintergrund**
```powershell
cd popout-app\public
# Mit Brand-Blau Hintergrund konvertieren (#2979FF)
magick icon.svg -background "#2979FF" -resize 192x192 icon-192x192.png
magick icon.svg -background "#2979FF" -resize 512x512 icon-512x512.png
```

**Option C: Node.js Script aktualisieren**
Das Script in `scripts/generate-icons.js` sollte bereits funktionieren, aber falls nicht:
```bash
cd popout-app
npm install sharp --save-dev
node scripts/generate-icons.js
```

### Schritt 3: Verifizierung
1. Öffne die PNG-Dateien direkt im Browser oder Bildbetrachter
2. Sie sollten ein **blaues Quadrat (#2979FF)** mit weißem Logo zeigen
3. **KEIN** transparenter oder weißer Hintergrund!

### Schritt 4: Cache leeren
Nach dem Ersetzen der Icons:
1. Chrome DevTools → Application → Clear Storage → "Clear site data"
2. Oder: Hard Reload (Ctrl+Shift+R / Cmd+Shift+R)
3. Service Worker neu registrieren: Application → Service Workers → Unregister

## Falls das Problem weiterhin besteht
- Prüfe die Dateigröße der PNGs (sollten nicht 0 KB sein)
- Prüfe, ob die Dateien wirklich `icon-192x192.png` und `icon-512x512.png` heißen
- Prüfe die Browser-Konsole auf Fehler beim Laden der Icons

