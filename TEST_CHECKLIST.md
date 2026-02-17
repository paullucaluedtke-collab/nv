# Business-Profile Feature - Test-Checkliste

## ✅ Vorbereitung

- [ ] Storage Bucket `business-profiles` in Supabase erstellt
  - Name: `business-profiles`
  - Public: Yes
  - File size limit: 5MB
  - Allowed MIME types: `image/*`

- [ ] Migrationen ausgeführt (in dieser Reihenfolge):
  - [ ] `create_business_profiles_table.sql`
  - [ ] `create_business_offers_table.sql`
  - [ ] `create_activity_promotions_table.sql`
  - [ ] `add_business_fields_to_activities.sql`

## ✅ Funktionale Tests

### 1. Business-Profil erstellen
- [ ] Als User einloggen
- [ ] Account-Menü öffnen
- [ ] "Business-Profil erstellen" Option sichtbar
- [ ] Modal öffnet sich
- [ ] Formular ausfüllen:
  - [ ] Business-Name (Pflichtfeld)
  - [ ] Business-Typ auswählen
  - [ ] Beschreibung (optional)
  - [ ] Kontaktdaten (Website, Telefon, Email)
  - [ ] Standort (Adresse, PLZ, Stadt)
  - [ ] Logo hochladen
  - [ ] Cover-Bild hochladen
- [ ] Speichern funktioniert
- [ ] Toast-Nachricht erscheint
- [ ] Modal schließt sich
- [ ] Account-Menü zeigt jetzt "Business verwalten" statt "erstellen"

### 2. Business-Profil bearbeiten
- [ ] Account-Menü → "Business verwalten"
- [ ] Modal öffnet sich mit vorhandenen Daten
- [ ] Änderungen vornehmen
- [ ] Speichern funktioniert
- [ ] Änderungen werden gespeichert

### 3. Business-Profil laden
- [ ] Nach Login wird Business-Profil automatisch geladen
- [ ] Account-Menü zeigt korrekten Status (erstellt/verwalten)

### 4. Validierung
- [ ] Business-Name < 3 Zeichen → Fehler
- [ ] Adresse ohne Stadt → Fehler
- [ ] Alle Pflichtfelder müssen ausgefüllt sein

### 5. Bild-Upload
- [ ] Logo-Upload funktioniert
- [ ] Cover-Upload funktioniert
- [ ] Preview wird angezeigt
- [ ] Bilder werden in Storage gespeichert
- [ ] URLs werden korrekt gespeichert

## ✅ Datenbank-Tests

- [ ] Business-Profil wird in `business_profiles` Tabelle gespeichert
- [ ] Alle Felder werden korrekt gespeichert
- [ ] Status ist "pending" nach Erstellung
- [ ] `user_id` ist korrekt gesetzt
- [ ] `created_at` und `updated_at` werden gesetzt
- [ ] JSONB-Felder (gallery_urls, opening_hours) werden korrekt gespeichert

## ✅ Integration-Tests

- [ ] Business-Profil wird beim Login geladen
- [ ] Account-Menü zeigt korrekten Status
- [ ] Logging funktioniert (BUSINESS_PROFILE_CREATED/BUSINESS_PROFILE_UPDATED)
- [ ] Keine TypeScript-Fehler
- [ ] Keine Linter-Fehler

## ✅ Edge Cases

- [ ] User ohne Business-Profil → "erstellen" Option
- [ ] User mit Business-Profil → "verwalten" Option
- [ ] Modal schließen mit ESC-Taste
- [ ] Modal schließen durch Klick außerhalb
- [ ] Fehler beim Speichern → Fehlermeldung wird angezeigt
- [ ] Fehler beim Bild-Upload → Fehlermeldung wird angezeigt

## ✅ UI/UX Tests

- [ ] Modal ist responsive (Mobile/Desktop)
- [ ] Formular ist übersichtlich
- [ ] Fehlermeldungen sind klar
- [ ] Loading-States werden angezeigt
- [ ] Buttons sind deaktiviert während Submit

## 🔄 Nächste Schritte (später)

- [ ] Admin-Verifizierung implementieren
- [ ] Business-Activities erstellen
- [ ] Angebote-System implementieren
- [ ] Promotion-System implementieren

