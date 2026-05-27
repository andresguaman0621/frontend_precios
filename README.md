# MMQEP Toma de Precios — App Móvil (Supervisores)

App React Native (Expo SDK 51) para supervisores que capturan precios en mercados de Quito. Consume el backend FastAPI ubicado en `../backend/`.

## Stack

- Expo SDK 51 + TypeScript estricto + Expo Router (file-based)
- Estado: TanStack Query v5 (servidor) + Zustand (cliente)
- Storage: expo-sqlite (datos offline), expo-secure-store (JWT), AsyncStorage (prefs)
- UI: NativeWind v4 (Tailwind RN), lucide-react-native, @shopify/flash-list
- Forms: react-hook-form + Zod
- HTTP: axios con interceptor 401/refresh
- GPS: expo-location | Push: expo-notifications | Háptica: expo-haptics

## Inicio rápido

1. **Copia variables de entorno**:

   ```bash
   cp .env.example .env
   # Edita .env y pon la IP LAN de la máquina que sirve el backend
   ```

2. **Instala dependencias** (ya hecho en este repo):

   ```bash
   npm install
   ```

3. **Levanta el backend** desde `../backend/` (default puerto 8005).

4. **Arranca Expo** en modo LAN:

   ```bash
   npm run start:lan
   ```

5. **Escanea el QR** con Expo Go (dispositivo físico recomendado para GPS y push).

## Variables de entorno (.env)

| Clave | Descripción |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | URL base del backend FastAPI (con `/api/v1`). En dev usa la IP LAN, no `localhost`. |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | Timeout de axios (default 30000) |

## Scripts

| Script | Descripción |
|---|---|
| `npm start` | Inicia Expo dev server |
| `npm run start:lan` | Inicia Expo en modo LAN (recomendado) |
| `npm run typecheck` | TypeScript strict typecheck |
| `npm run lint` | ESLint |
| `npm test` | Ejecuta tests (Jest) |
| `npm run test:coverage` | Cobertura |

## Arquitectura

```
app/                    Rutas Expo Router
├── (auth)/            Login, change-password
└── (app)/             Pantallas autenticadas (home, captura, historial, etc.)

src/
├── api/               Clientes axios por dominio (auth, sessions, prices, devices, users)
├── db/                SQLite local (schema, migraciones, repos)
├── sync/              SyncManager + triggers + conflict resolver
├── components/        UI (PriceCard, VariationAlertModal, etc.) + ui/ base
├── hooks/             useAuth, useGPS, useNetwork, useCatalog, etc.
├── schemas/           Zod validation + tipos API del backend
├── stores/            Zustand (auth, network, capture, toast)
├── utils/             week, decimal, variation, format, haptics
└── tests/unit/        Jest unit tests
```

## Flujo offline-first

1. Login online → bootstrap descarga catálogo a SQLite + registra device push.
2. Iniciar sesión → catálogo se cachea localmente para esa sesión.
3. Capturar precios → UPSERT en SQLite (`prices` con `sync_state='pending'`, `client_uuid` estable).
4. `SyncManager` se dispara automáticamente (debounce 2s tras edit, AppState=active, NetInfo connected, cada 60s, manual).
5. Bulk `POST /sessions/{id}/prices/bulk` (máx 200 items). Server responde por item: created/updated/conflict/error.
6. Conflictos abren `VariationAlertModal` → "Confirmar" reenvía con `confirmado=true`.

## Tests

- **Unit** (`src/tests/unit/`): week (semana domingo-domingo), decimal (parse), variation, normalize, Zod schemas, conflictResolver pub/sub.
- **E2E** (`e2e/offline-capture.yaml`): flujo completo Maestro:
  ```bash
  maestro test e2e/offline-capture.yaml --env USERNAME=belen.valencia --env PASSWORD=***
  ```

## Build con EAS

```bash
# Login
eas login

# Development APK (interno)
eas build --profile development --platform android

# Preview (staging)
eas build --profile preview --platform android

# Production (release a stores)
eas build --profile production
```

Bundle IDs: `ec.gob.mmqep.toma` (iOS + Android).

## Notas operativas

- **Multi-worker**: el backend FastAPI debe correr con `--workers 1` por el APScheduler.
- **Cache catálogo**: el catálogo del mercado se descarga al crear sesión. La primera toma en un mercado requiere conexión. Después, el supervisor opera offline durante esa sesión.
- **Refresh token**: 7 días; access token 15 min. El interceptor axios refresh automático con mutex.
- **Scope JWT**: la app siempre envía `scope: "mobile"`. Endpoints `/devices/*` y `/prices/bulk` rechazan otros scopes.
- **PostgreSQL TZ**: el backend usa `America/Guayaquil` para el cálculo de semanas; la app replica este cálculo en `src/utils/week.ts`.

## Criterio de éxito

Un supervisor puede: login → iniciar toma → modo avión → 20 precios + 5 observaciones offline → cerrar app → reabrir → ver datos persistidos → completar offline → recuperar red → sync automático en <30s → ver sesión en historial → datos correctos en panel web admin.
