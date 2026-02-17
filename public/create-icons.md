# Icon-Erstellung für nearvibe PWA

## ✅ SVG-Icon erstellt
Das SVG-Icon (`icon.svg`) wurde bereits erstellt und befindet sich im `/public` Ordner.

## Erforderliche Icon-Größen
- `icon-192x192.png` - Für Android und kleinere Displays
- `icon-512x512.png` - Für Android und größere Displays

## Konvertierung von SVG zu PNG

### Option 1: Node.js Script (Empfohlen)
```bash
cd popout-app
npm install sharp --save-dev
node scripts/generate-icons.js
```

### Option 2: Online-Tool (Einfachste Methode)
1. Öffne `public/icon.svg` in einem Browser oder Editor
2. Verwende ein Online-Tool:
   - https://convertio.co/svg-png/
   - https://cloudconvert.com/svg-to-png
   - https://svgtopng.com/
3. Exportiere in **192x192** Pixel → Speichere als `icon-192x192.png`
4. Exportiere in **512x512** Pixel → Speichere als `icon-512x512.png`
5. Beide Dateien in den `/public` Ordner kopieren

### Option 3: ImageMagick (Command Line)
```powershell
# Windows PowerShell
cd popout-app\public
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 512x512 icon-512x512.png
```

### Option 4: Inkscape (Grafik-Software)
1. Öffne `public/icon.svg` in Inkscape
2. Datei → Exportieren als PNG
3. Stelle Größe auf 192x192 ein → Exportiere als `icon-192x192.png`
4. Stelle Größe auf 512x512 ein → Exportiere als `icon-512x512.png`

## Nach der Konvertierung
Die PNG-Dateien werden automatisch vom Manifest und Layout verwendet, da sie bereits korrekt referenziert sind.

## Verifizierung
Nach dem Erstellen der Icons:
1. Starte die App: `npm run dev`
2. Öffne Chrome DevTools → Application → Manifest
3. Prüfe, ob die Icons korrekt geladen werden
4. Teste die PWA-Installation auf einem mobilen Gerät
