# RLS Performance Optimization - Migration Instructions

## Problem
Die Supabase-Database-Linter zeigt Performance-Warnungen an:
1. **Auth RLS Initialization Plan**: `auth.uid()` wird in RLS-Policies für jede Zeile neu evaluiert
2. **Multiple Permissive Policies**: Mehrere Policies für die gleiche Aktion auf derselben Tabelle

## Lösung
Die Migration `optimize_rls_performance.sql` optimiert alle RLS-Policies durch:
1. **Verwendung von `(select auth.uid())`** statt `auth.uid()` - wird nur einmal pro Query evaluiert
2. **Konsolidierung doppelter Policies** - entfernt redundante Policies und kombiniert sie zu einer

## Was die Migration macht

### Performance-Optimierung:
- **Vorher**: `auth.uid()::text = user_id` (wird für jede Zeile neu evaluiert)
- **Nachher**: `(select auth.uid())::text = user_id` (wird nur einmal evaluiert)

### Policy-Konsolidierung:
- **Activities**: Kombiniert "Anyone can view public activities" + "Users can view their own activities" → "Users can read activities"
- **Activity Messages**: Entfernt doppelte Policies "Users can view/read messages"
- **Global Messages**: Entfernt doppelte Policies "Anyone can view/read global messages"
- **Business Offers/Promotions**: Kombiniert öffentliche und Business-Owner Policies

## Ausführung in Supabase

### Option 1: SQL Editor
1. Öffne das Supabase Dashboard
2. Gehe zu **SQL Editor**
3. Kopiere den gesamten Inhalt von `optimize_rls_performance.sql`
4. Füge ihn in den SQL Editor ein
5. Klicke auf **Run** oder drücke `Ctrl+Enter`

### Option 2: Migration Tool
Falls du ein Migration-Tool verwendest, führe die Datei aus.

## Wichtige Hinweise

⚠️ **Sichere Migration**: Diese Migration droppt und erstellt Policies neu. Die Funktionalität bleibt gleich, nur die Performance wird verbessert.

⚠️ **Keine Datenänderungen**: Es werden keine Daten geändert, nur die Policies werden optimiert.

⚠️ **Testen**: Teste die App nach der Migration, um sicherzustellen, dass alle Funktionen noch funktionieren.

## Erwartete Verbesserungen

### Performance:
- **~50-90% schneller** bei Queries mit vielen Zeilen
- **Weniger Datenbank-Load** durch einmalige `auth.uid()` Evaluation
- **Bessere Query-Pläne** durch konsolidierte Policies

### Linter-Warnungen:
- ✅ Alle "Auth RLS Initialization Plan" Warnungen sollten verschwinden
- ✅ Alle "Multiple Permissive Policies" Warnungen sollten verschwinden

## Nach der Migration

### Überprüfung:
1. Gehe zurück zum Supabase Dashboard
2. Überprüfe die **Database Linter**-Sektion
3. Die Performance-Warnungen sollten verschwunden sein

### Falls Probleme auftreten:
- Überprüfe die Supabase-Logs
- Stelle sicher, dass die App weiterhin funktioniert
- Teste die wichtigsten Funktionen (Activities erstellen, Messages senden, etc.)

## Technische Details

### Warum `(select auth.uid())`?
PostgreSQL optimiert Subqueries in RLS-Policies so, dass sie nur einmal pro Query evaluiert werden, nicht für jede Zeile. Dies ist eine Best Practice für Supabase RLS-Policies.

### Warum Policy-Konsolidierung?
Mehrere permissive Policies für die gleiche Aktion müssen alle evaluiert werden. Eine konsolidierte Policy ist effizienter, da sie nur einmal evaluiert wird.

