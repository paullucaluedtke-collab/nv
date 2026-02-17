# Business-Profile Feature - Konzept & Implementierungsplan

## Übersicht

Business-Profile ermöglichen es Clubs, Bars, Restaurants, Sportvereinen etc., ihre eigenen Profile zu erstellen, Aktivitäten zu verwalten, Angebote zu erstellen und später ihre Aktivitäten gegen Gebühr zu bewerben.

## Datenstruktur

### 1. Business Profiles (`business_profiles`)
- Basis-Informationen (Name, Typ, Beschreibung)
- Kontaktdaten (Website, Telefon, Email)
- Standort (Adresse, Koordinaten)
- Medien (Logo, Cover, Galerie)
- Öffnungszeiten (JSONB)
- Verifizierungsstatus
- Features & Credits

### 2. Business Offers (`business_offers`)
- Angebote/Deals die mit Activities verknüpft werden können
- Rabatt-Typen (Prozent, Fixbetrag, Gratis-Item)
- Gültigkeitszeitraum
- Terms & Conditions

### 3. Activity Promotions (`activity_promotions`)
- Bezahlte Werbung für Activities
- Typen: Featured, Boost, Sponsored
- Kosten & Status
- Zeitraum

### 4. Activities Erweiterung
- `business_id` - Verknüpfung zum Business
- `is_business_activity` - Flag für Business-Activities
- `promotion_level` - Aktueller Promotion-Level

## Implementierungsphasen

### Phase 1: Basis Business-Profile ✅ (Vorbereitet)
- [x] Datenstruktur definiert
- [x] Migrationen erstellt
- [x] Types definiert
- [x] Repository erstellt
- [ ] UI für Business-Profile-Erstellung
- [ ] Business-Profile-Verwaltung
- [ ] Admin-Verifizierung

### Phase 2: Business-Activities
- [ ] Activity-Erstellung für Businesses erweitern
- [ ] Business-Activity-Badge in UI
- [ ] Filter für Business-Activities
- [ ] Business-Profile-Anzeige bei Activities

### Phase 3: Angebote-System
- [ ] UI für Angebots-Erstellung
- [ ] Angebote-Anzeige bei Activities
- [ ] Angebote-Verwaltung
- [ ] QR-Code für Angebote (optional)

### Phase 4: Promotion-System
- [ ] Promotion-UI für Businesses
- [ ] Promotion-Anzeige in Activity-Liste
- [ ] Featured/Boost/Sponsored Badges
- [ ] Payment-Integration (später)
- [ ] Credit-System

## UI-Komponenten (zu erstellen)

1. **BusinessProfileModal** - Erstellung/Bearbeitung von Business-Profilen
2. **BusinessProfileView** - Anzeige eines Business-Profils
3. **BusinessOfferModal** - Angebots-Erstellung
4. **BusinessOfferCard** - Angebots-Anzeige
5. **ActivityPromotionModal** - Promotion-Erstellung
6. **BusinessActivityBadge** - Badge für Business-Activities

## Workflow

### Business-Profile erstellen:
1. User meldet sich an
2. Öffnet "Business-Profile erstellen"
3. Füllt Formular aus (Name, Typ, Kontakt, Standort, etc.)
4. Lädt Logo/Cover hoch
5. Speichert → Status: "pending"
6. Admin verifiziert → Status: "verified"
7. Business kann Activities erstellen

### Activity mit Angebot erstellen:
1. Business erstellt Activity (wie normale Activity)
2. Fügt optional Angebot hinzu (Rabatt, Gültigkeit, Terms)
3. Activity wird mit Angebot angezeigt
4. User können Angebot einlösen

### Activity bewerben:
1. Business wählt Activity aus
2. Wählt Promotion-Typ (Featured/Boost/Sponsored)
3. Wählt Zeitraum
4. Sieht Kosten
5. Bestätigt → Promotion wird aktiviert
6. Activity erscheint höher/featured in Listen

## Pricing (später)

- **Featured**: 5€/Tag - Activity erscheint oben in Listen
- **Boost**: 10€/Tag - Activity erscheint prominent + Badge
- **Sponsored**: 20€/Tag - Activity erscheint als Werbung + Premium-Badge

## Nächste Schritte

1. Migrationen in Supabase ausführen
2. Business-Profile-UI erstellen
3. Activity-Erstellung für Businesses erweitern
4. Angebote-System implementieren
5. Promotion-System implementieren

