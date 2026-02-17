# Business-Profile Setup - Migrations

## Vorbereitung

### 1. Storage Bucket erstellen
Bevor du die Migrationen ausführst, erstelle einen Storage Bucket in Supabase:

1. Gehe zu **Storage** → **Buckets** → **New Bucket**
2. Name: `business-profiles`
3. Public: **Yes** (aktivieren)
4. File size limit: `5MB`
5. Allowed MIME types: `image/*`
6. Erstelle den Bucket

### 2. Migrationen ausführen

Führe die SQL-Dateien **in dieser Reihenfolge** im Supabase SQL Editor aus:

1. ✅ `create_business_profiles_table.sql`
2. ✅ `create_business_offers_table.sql`
3. ✅ `create_activity_promotions_table.sql`
4. ✅ `add_business_fields_to_activities.sql`

**Wichtig:** Die Reihenfolge ist wichtig, da die Tabellen aufeinander referenzieren!

## Nach den Migrationen

- Business-Profile können über das Account-Menü erstellt werden
- Status ist zunächst "pending" - Admin muss verifizieren
- Nach Verifizierung können Businesses Activities erstellen
- Angebote und Promotionen können später hinzugefügt werden

## Testen

1. Als User einloggen
2. Account-Menü öffnen
3. "Business-Profil erstellen" wählen
4. Formular ausfüllen und speichern
5. Im Admin-Panel verifizieren (später)

