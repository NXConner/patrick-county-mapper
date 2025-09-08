# Mobile integration (Android / iOS)

## Capabilities required
- Foreground service/background tasks for periodic GPS (5–60s)
- Significant location changes / activity recognition to adapt frequency
- Motion/activity type if available (on foot, bicycle, vehicle)
- Foreground notification on Android when tracking
- Battery optimizations disabled (OEM whitelisting guidance)
- Phone usage signals (screen/app usage, call state) where permitted

## Location payload
POST /ingest/locations (Bearer token)
```json
{
  "samples": [
    {
      "timestamp": "2025-09-08T16:59:00.000Z",
      "deviceId": "device-123",
      "lat": 40.7128,
      "lng": -74.006,
      "accuracyMeters": 8.5,
      "altitudeMeters": 12.3,
      "speedMps": 6.1,
      "headingDeg": 180,
      "source": "gps"
    }
  ]
}
```

Server behavior
- Stores samples and marks moving/stationary
- Evaluates geofence entry/exit and updates status
- Updates or starts a trip; computes distance, duration, avg/max speed
- Estimates fuel usage; infers driver vs passenger heuristically

## Phone usage payload
POST /ingest/phone-usage (Bearer token)
```json
{
  "events": [
    {
      "timestamp": "2025-09-08T17:00:00.000Z",
      "deviceId": "device-123",
      "event": "screen_on",
      "appPackage": "com.example.app",
      "durationSec": 30,
      "metadata": {"note": "optional"}
    }
  ]
}
```

## Auth
1) Register: POST /auth/register { email, fullName, password }
2) Login: POST /auth/login { email, password } -> token
3) Include Authorization: Bearer <token> on all ingest/clock endpoints

## Suggested client behavior
- Batch points (3–10) to reduce network overhead
- Increase interval when stationary; reduce to 5–10s when moving fast
- Send last known speed to improve moving detection
- Use exponential backoff on network errors; queue offline
- Respect user privacy and OS policies; request precise location permission

## iOS notes
- Use significant location changes + `startUpdatingLocation` while on shift
- Enable background modes: Location updates
- Consider `CLActivityType.automotiveNavigation`

## Android notes
- Use FusedLocationProvider with foreground service while on shift
- Request high accuracy only when necessary
- Handle Doze/App Standby; request ignore battery optimizations if appropriate

