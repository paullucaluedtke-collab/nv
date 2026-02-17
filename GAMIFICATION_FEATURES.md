# Gamification-System für NearVibe

## Übersicht

Dieses Dokument beschreibt das umfassende Gamification-System, das implementiert wurde, um Nutzer dazu zu motivieren, mehr Aktivitäten zu erstellen und an Aktivitäten teilzunehmen.

## Implementierte Features

### 1. Points-System (Punkte-System)

**Punkte werden vergeben für:**
- **Activity erstellen**: 50 Punkte
- **Activity beitreten**: 25 Punkte
- **Achievement freischalten**: 100 Bonus-Punkte
- **Streak-Bonus**: 10 Punkte pro Tag im Streak

**Level-System:**
- Level steigen exponentiell (100 × 1.5^(Level-1))
- Jedes Level erfordert mehr Punkte
- Level werden automatisch berechnet basierend auf Gesamtpunkten

### 2. Achievements (Erfolge)

**Achievement-Kategorien:**

#### Creation Achievements (Erstellungs-Erfolge)
- 🎯 **Erste Schritte**: Erstelle deine erste Aktivität
- ⭐ **Aktiver Organisator**: Erstelle 5 Aktivitäten
- 🏆 **Erfahrener Host**: Erstelle 10 Aktivitäten
- 👑 **Community Leader**: Erstelle 25 Aktivitäten
- 🌟 **Event Master**: Erstelle 50 Aktivitäten

#### Participation Achievements (Teilnahme-Erfolge)
- 🤝 **Gesellig**: Nimm an 5 Aktivitäten teil
- 🎉 **Aktiv dabei**: Nimm an 10 Aktivitäten teil
- 🦋 **Social Butterfly**: Nimm an 25 Aktivitäten teil
- 💫 **Community Champion**: Nimm an 50 Aktivitäten teil

#### Streak Achievements (Serien-Erfolge)
- 🔥 **Dranbleiben**: 3 Tage in Folge aktiv
- 🔥🔥 **Woche voller Action**: 7 Tage in Folge aktiv
- 🔥🔥🔥 **Zwei Wochen Power**: 14 Tage in Folge aktiv
- 🔥🔥🔥🔥 **Monat der Aktivität**: 30 Tage in Folge aktiv

#### Points Achievements (Punkte-Erfolge)
- 💯 **Hundert Punkte**: Sammle 100 Punkte
- 💎 **Fünfhundert Punkte**: Sammle 500 Punkte
- 🏅 **Tausend Punkte**: Sammle 1000 Punkte

### 3. Streak-System

**Funktionsweise:**
- Ein Streak wird fortgesetzt, wenn der Nutzer an aufeinanderfolgenden Tagen aktiv ist
- Aktivität = Activity erstellen ODER beitreten
- Streak wird automatisch zurückgesetzt, wenn ein Tag übersprungen wird
- Längster Streak wird gespeichert
- Streak-Bonus-Punkte werden täglich vergeben

### 4. Leaderboards (Bestenlisten)

**Drei verschiedene Leaderboards:**
1. **Punkte-Leaderboard**: Top 10 Nutzer nach Gesamtpunkten
2. **Creator-Leaderboard**: Top 10 Nutzer nach erstellten Aktivitäten
3. **Joiner-Leaderboard**: Top 10 Nutzer nach teilgenommenen Aktivitäten

**Features:**
- Echtzeit-Updates
- Hervorhebung des eigenen Rangs
- Anzeige von Level und zusätzlichen Stats

### 5. User Stats Panel

**Angezeigte Informationen:**
- Aktuelles Level und Fortschritt zum nächsten Level
- Gesamtpunkte
- Anzahl erstellter Aktivitäten
- Anzahl teilgenommener Aktivitäten
- Aktueller Streak
- Längster Streak
- Alle freigeschalteten Achievements

### 6. UI-Integration

**Neue Menüpunkte im AccountMenu:**
- "Meine Stats" - Öffnet das Stats Panel
- "Leaderboard" - Öffnet das Leaderboard Panel

**Automatische Punktevergabe:**
- Punkte werden automatisch vergeben, wenn:
  - Eine Activity erstellt wird
  - Einer Activity beigetreten wird
  - Ein Achievement freigeschaltet wird
  - Ein Streak fortgesetzt wird

## Datenbank-Schema

### Tabellen

1. **user_stats**: Speichert Punkte, Level, Streaks und Activity-Zähler
2. **achievements**: Definiert alle verfügbaren Achievements
3. **user_achievements**: Verknüpft Nutzer mit ihren freigeschalteten Achievements
4. **points_history**: Audit-Trail aller Punkte-Transaktionen

## Verwendung

### Migration ausführen

```sql
-- Migration ausführen
\i migrations/create_gamification_tables.sql
```

### In Code verwenden

```typescript
import { 
  getUserStats, 
  getUserAchievements, 
  getLeaderboard,
  getTopCreators,
  getTopJoiners 
} from "@/lib/gamificationRepository";

// Stats abrufen
const stats = await getUserStats(userId);

// Achievements abrufen
const achievements = await getUserAchievements(userId);

// Leaderboard abrufen
const leaderboard = await getLeaderboard(10);
```

## Zukünftige Erweiterungen

### Mögliche Features:
1. **Tägliche Challenges**: Spezielle Aufgaben für zusätzliche Punkte
2. **Social Features**: Punkte für Freunde einladen
3. **Seasonal Events**: Zeitlich begrenzte Events mit speziellen Achievements
4. **Badges im Profil**: Sichtbare Badges für erreichte Achievements
5. **Rewards**: Belohnungen für bestimmte Level/Achievements
6. **Activity Suggestions**: KI-basierte Vorschläge basierend auf Präferenzen
7. **Push Notifications**: Erinnerungen für Streaks und neue Achievements

## Psychologische Prinzipien

Das System nutzt mehrere bewährte Gamification-Prinzipien:

1. **Sofortiges Feedback**: Punkte werden sofort nach Aktionen vergeben
2. **Progression**: Level-System zeigt kontinuierlichen Fortschritt
3. **Achievements**: Klare Ziele motivieren zu mehr Aktivität
4. **Social Proof**: Leaderboards zeigen, was andere erreichen
5. **Streaks**: FOMO (Fear of Missing Out) motiviert tägliche Nutzung
6. **Transparenz**: Alle Punkte-Transaktionen werden protokolliert

## Metriken zur Erfolgsmessung

Folgende Metriken sollten überwacht werden:
- Durchschnittliche Anzahl erstellter Activities pro Nutzer
- Durchschnittliche Anzahl teilgenommener Activities pro Nutzer
- Durchschnittliche Streak-Länge
- Achievement-Freischaltungsrate
- Leaderboard-Teilnahme
- Retention-Rate (tägliche aktive Nutzer)


