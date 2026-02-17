# RLS Security Fix - Migration Instructions

## Problem
Die Supabase-Dashboard zeigt CRITICAL Sicherheitswarnungen an:
- RLS (Row-Level Security) ist in mehreren öffentlichen Tabellen deaktiviert
- Dies bedeutet, dass Daten möglicherweise ungeschützt sind

## Lösung
Die Migration `enable_rls_and_policies.sql` aktiviert RLS und erstellt sichere Policies für alle betroffenen Tabellen.

## Betroffene Tabellen
1. ✅ `friends` - Freundschaftsbeziehungen
2. ✅ `activity_logs` - Aktivitäts-Logs
3. ✅ `business_profiles` - Business-Profile
4. ✅ `business_offers` - Business-Angebote
5. ✅ `activity_promotions` - Activity-Promotions
6. ✅ `activities` - Aktivitäten (falls noch nicht aktiviert)
7. ✅ `activity_messages` - Activity-Chat-Nachrichten (falls existiert)
8. ✅ `global_messages` - Global-Chat-Nachrichten (falls existiert)

## Ausführung in Supabase

### Option 1: SQL Editor
1. Öffne das Supabase Dashboard
2. Gehe zu **SQL Editor**
3. Kopiere den gesamten Inhalt von `enable_rls_and_policies.sql`
4. Füge ihn in den SQL Editor ein
5. Klicke auf **Run** oder drücke `Ctrl+Enter`

### Option 2: Migration Tool
Falls du ein Migration-Tool verwendest, führe die Datei in der richtigen Reihenfolge aus.

## Was die Migration macht

### Für jede Tabelle:
1. **Aktiviert RLS**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. **Erstellt SELECT Policies**: Wer kann Daten lesen?
3. **Erstellt INSERT Policies**: Wer kann Daten erstellen?
4. **Erstellt UPDATE Policies**: Wer kann Daten aktualisieren?
5. **Erstellt DELETE Policies**: Wer kann Daten löschen?

### Sicherheitsprinzipien:
- **Users sehen nur ihre eigenen Daten** (außer öffentliche Daten wie verifizierte Businesses)
- **Users können nur ihre eigenen Daten ändern**
- **Business-Owner können ihre Business-Daten verwalten**
- **Activity-Logs sind privat** (nur eigene Logs sichtbar)

## Nach der Migration

### Überprüfung:
1. Gehe zurück zum Supabase Dashboard
2. Überprüfe die **Security**-Sektion
3. Die CRITICAL-Warnungen sollten verschwunden sein

### Falls Probleme auftreten:
- Überprüfe die Supabase-Logs
- Stelle sicher, dass `auth.uid()` korrekt funktioniert
- Teste die App-Funktionalität nach der Migration

## Wichtige Hinweise

⚠️ **Backup erstellen**: Erstelle vor der Migration ein Backup deiner Datenbank!

⚠️ **Testen**: Teste die App nach der Migration gründlich, um sicherzustellen, dass alle Funktionen noch funktionieren.

⚠️ **Service Role**: Einige Operationen (z.B. Activity-Logs) benötigen möglicherweise den Service Role Key statt User Auth. Die App sollte weiterhin funktionieren, da sie den Service Role Key verwendet.

## Zusätzliche Sicherheitseinstellungen

### Leaked Password Protection
Die Warnung "Leaked Password Protection Disabled" muss im Supabase Dashboard manuell aktiviert werden:
1. Gehe zu **Authentication** → **Settings**
2. Aktiviere **"Leaked Password Protection"**
3. Speichere die Änderungen

Dies kann nicht per SQL-Migration aktiviert werden, da es eine Dashboard-Einstellung ist.

