# Face-Scan (manuell, Admin-gesteuert)

Aktueller Stand: Manuelle Bestätigung durch Admin, kein KI-Liveness. Später kann der POST-Endpunkt durch einen KI-Provider gespeist werden.

## Fluss (heute)
1) User lädt Foto/Video über UI-Flow (bestehender Face-Tab im VerificationModal). Status wird auf `pending` gesetzt.
2) Admin geht auf `/admin` → sieht Nutzerliste mit `faceVerification`.
3) Admin klickt auf „Face-Scan bestätigen/ablehnen“ → ruft POST `/api/admin/verifications/face/:userId` auf.
4) Endpoint schreibt `user_profiles.face_verification = { status, verifiedAt, confidence }`.
5) Trust-Profile zieht `face_verification` (siehe `trustRepository.fetchTrustProfile`) und UI zeigt Badge.

## Wichtige Stellen im Code
- API: `app/api/admin/verifications/face/[userId]/route.ts` (POST, erwartet `{ status, confidence }`).
- Repo: `lib/verificationRepository.ts` → `updateFaceVerificationStatus`.
- Admin-UI: `app/admin/page.tsx` → `handleVerifyFace` / `handleRejectFace`.
- Trust-Profile Datenschema: `types/trust.ts` → `faceVerification`.
- Anzeige für Nutzer: `components/UserProfileSheet.tsx` & `components/VerificationModal.tsx` (Face-Tab).

## Manuelles Setup / Betrieb
- Sicherstellen, dass `user_profiles` die Spalte `face_verification` besitzt (Migrationen ausführen).
- Admin-Route nur intern nutzen (basiert auf vorhandener Admin-Gate-Logik in `/admin`).
- Confidence kann optional mitgegeben werden, z.B. aus einem externen Tool.

## Zukunft (KI/Liveness)
- KI-Provider ruft nach erfolgreichem Scan den gleichen Endpoint `/api/admin/verifications/face/:userId` mit `{ status: "verified", confidence }` auf.
- Falls der Provider ein Webhook liefert, dort Signatur prüfen und den obigen Endpoint intern aufrufen.
- Liveness/ID-Check kann in `verificationRepository` um weitere Felder erweitert werden (z.B. `provider`, `livenessScore`), ohne die UI zu brechen.


