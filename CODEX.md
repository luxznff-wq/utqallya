# CODEX — Estado del proyecto Utqallya

> Documento de contexto para que cualquier asistente de IA (o desarrollador humano) que continúe este proyecto entienda rápidamente qué existe, qué funciona, qué se probó y qué falta. Generado a partir de una sesión de desarrollo extensa con Claude Code. Última actualización: **2026-07-25**.

---

## 1. Qué es Utqallya

App de transporte tipo Uber/inDrive, simplificada, para los distritos de **Acarí** y **Bella Unión** (provincia Caravelí, Arequipa, Perú). Dos tipos de usuario: **Pasajero** y **Conductor** (solo Automóvil o Mototaxi). Sin negociación de precio, sin chat, sin viajes compartidos — el primer conductor que acepta se queda con el viaje. El precio lo pone/cobra el conductor directamente (no hay tarifa dinámica ni estimación de precio en la app).

## 2. Stack y versiones actuales

**Backend** (`backend/`)
- Java 21, Spring Boot **3.3.4**, Maven
- PostgreSQL (Flyway para migraciones: `V1__init_schema.sql`, `V2__seed_reference_data.sql`, `V3__add_vehicle_type_to_trips.sql`)
- JWT (jjwt 0.12.6) para auth
- Firebase Admin SDK para push (deshabilitado por defecto vía `utqallya.firebase.enabled=false`)

**Mobile** (`mobile/`) — **Expo SDK 54** (subido desde SDK 51 en esta sesión)
- `expo` 54.0.36, `react` 19.1.0, `react-native` 0.81.5
- `react-navigation` v6 (bottom-tabs + native-stack)
- `react-native-maps` 1.20.1, TypeScript 5.9.3
- Ver `mobile/package.json` para el detalle completo.

## 3. Estado funcional — qué está verificado y funcionando

Todo lo siguiente fue **probado de punta a punta** en un emulador Android (API 36.1, Google Play) y contra un backend real corriendo en `localhost:8080` con PostgreSQL real (no mocks):

- Registro de pasajero, login, persistencia de sesión (JWT en `expo-secure-store`).
- Flujo completo de pedido de viaje: Inicio → fijar origen/destino → elegir vehículo → buscar conductor → (el resto del ciclo de vida del viaje — aceptar, llegar, confirmar código, finalizar, calificar — existe en el código pero **no se volvió a probar en esta ronda de rediseño**, solo se verificó en una sesión anterior contra el flujo viejo).
- Historial de viajes con datos reales (incluye varios viajes de prueba cancelados, visibles en la BD).
- Perfil de pasajero.
- Mapa nativo con Google Maps SDK renderizando calles reales de Acarí (API key configurada).

**No probado en esta sesión:** flujo del conductor con el nuevo diseño (las pantallas de conductor no cambiaron visualmente, ver sección 6), notificaciones push reales, la app en un celular físico (se intentó, ver sección 7), panel de administrador (no tiene UI, solo API — ver sección 8).

## 4. Entorno de desarrollo local (todo lo que se instaló/configuró en esta máquina)

Esta máquina (Windows) no tenía nada de esto antes de esta sesión:

| Herramienta | Ubicación | Notas |
|---|---|---|
| JDK 21 (Temurin) | `C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot` | El `java` del PATH por defecto sigue siendo Java 8; hay que exportar `JAVA_HOME` explícitamente |
| Maven 3.9.16 | `C:\Users\User\tools\apache-maven-3.9.16` | Portable, no está en el PATH del sistema |
| PostgreSQL 18 | Servicio de Windows (`postgresql-x64-18`) | Ya estaba instalado; se creó el rol/BD `utqallya` (ver abajo) |
| Android Studio + SDK + emulador | `C:\Users\User\AppData\Local\Android\Sdk` | Emulador existente: `Medium_Phone_API_36.1` (Google Play, x86_64) |

**Para correr el backend** (cada sesión nueva de terminal necesita esto):
```bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.11.10-hotspot"
export PATH="$JAVA_HOME/bin:/c/Users/User/tools/apache-maven-3.9.16/bin:$PATH"
cd backend
set -a; source .env; set +a   # carga DIRECTIONS_API_KEY (ver sección 6b) — Spring no lo hace solo
mvn spring-boot:run
```
Base de datos: rol y BD `utqallya` ya existen en el PostgreSQL local, con las credenciales que `application.yml` ya trae por defecto (`utqallya`/`utqallya`, BD `utqallya`, `localhost:5432`) — no hace falta configurar nada adicional. La contraseña del superusuario `postgres` del sistema **no** está documentada aquí a propósito (es del sistema del usuario, no de la app).

**Para correr el móvil:**
```bash
cd mobile
npm install   # si no se hizo antes
npx expo start --web       # navegador (mapa no funcional, ver AppMap.web.tsx)
npx expo start --android   # emulador Android
npx expo start             # QR para celular físico (misma red WiFi)
```
`mobile/.env` ya tiene `EXPO_PUBLIC_API_URL` y la API key de Google Maps configuradas (el archivo está en `.gitignore`, no viaja con el repo). **Importante:** el valor de `EXPO_PUBLIC_API_URL` depende del método de acceso:
- Web (mismo PC): `http://localhost:8080/api`
- Emulador Android: `http://10.0.2.2:8080/api` (alias especial del emulador hacia el host) — esto ya está resuelto automáticamente por `src/constants/config.ts` según la plataforma, **excepto** que si `.env` trae un valor explícito, ese gana siempre.
- Celular físico: la IP de LAN del PC (ej. `http://192.168.1.90:8080/api`) — **esto cambia si la red cambia**, hay que actualizarlo a mano en `.env`.

## 5. Cuenta de prueba

```
correo:      prueba@utqallya.pe
contraseña:  Test1234
```
Rol: PASSENGER. Ya tiene varios viajes cancelados en el historial (de las pruebas de esta sesión).

## 6. Rediseño visual (esta sesión) — inspirado en inDrive/Uber

El usuario pidió acercar el diseño a inDrive/Uber. Se rediseñó **solo el lado del pasajero**:

- **`HomeMapScreen`** — antes: mapa + botón "Solicitar viaje" que llevaba a 2 pantallas separadas (`SelectOriginScreen`, `SelectDestinationScreen`, ambas **eliminadas**). Ahora: origen y destino son dos campos de texto editables en una sola tarjeta sobre el mapa, cada uno con botón 🗺️. Se puede escribir libremente (sin autocompletado real — decisión explícita del usuario) o fijar el punto con precisión en el mapa.
  - **Importante — revisado dos veces:** la primera versión navegaba a una pantalla separada (`PickLocationScreen`) para fijar el punto en el mapa. El usuario lo probó y no le gustó ese cambio de pantalla ("ahí se puede hacer todo"). Se **eliminó `PickLocationScreen`** y ahora el modo "fijar punto" ocurre **dentro del mismo `HomeMapScreen`**, con un estado local `activeField` que cambia el contenido renderizado (mapa + pin central + confirmar) sin navegar a ningún lado. Esto también eliminó de paso el `LocationPickerContext` (ya no hace falta pasar datos entre pantallas).
- **`ChooseVehicleScreen`** (nueva) — selección de Mototaxi/Automóvil + método de pago (Efectivo/Yape), con vista previa del mapa con ambos puntos y la ruta real (ver sección 6b). **No muestra precio estimado** — el usuario aclaró explícitamente que el precio lo pone el conductor, no la app. Sí muestra distancia/tiempo real ("X km · Y min"), que no es un precio.
- **`SearchingDriverScreen`** — rediseñada con animación de radar (círculos concéntricos pulsantes con `Animated` de React Native, sin librerías externas) alrededor de un ícono de auto.
- **`HistoryScreen`** — tarjetas con ícono de ruta (punto verde + línea punteada + bandera de meta), y para viajes completados, íconos de vehículo + conductor.
- **`ProfileScreen`** — avatar circular con iniciales, tarjetas con íconos. Se omitieron a propósito las insignias de "verificación" que pedía la referencia visual del usuario porque no existe ningún sistema de verificación de email/teléfono en el backend — no se quiso inventar una insignia sin funcionalidad real detrás.

**No tocado:** `DriverHomeScreen`, `DriverTripScreen`, `DriverFoundScreen`, `RateTripScreen` mantienen el diseño anterior (ya comparten la misma paleta/tipografía, pero no se rediseñaron layouts). `TripTrackingScreen` sí recibió un cambio funcional (ruta real, ver 6b) pero no de layout. Si se quiere consistencia total, falta aplicar el mismo lenguaje visual a las pantallas de conductor.

### 6a. Backend: nuevo campo `vehicleType` en el viaje

El pasajero ahora elige tipo de vehículo al pedir el viaje, y **solo se notifica a conductores con ese mismo tipo de vehículo** (antes se notificaba a todos los conductores disponibles sin filtrar). Cambios:
- `CreateTripRequest` — nuevo campo `vehicleType` (obligatorio).
- `Trip` entity + migración `V3__add_vehicle_type_to_trips.sql` — nueva columna `vehicle_type`.
- `TripServiceImpl.notifyNearbyDrivers` — filtra por `driver.vehicle.type == trip.vehicleType` antes del filtro de distancia.
- `TripResponse` — expone `vehicleType` al cliente.

### 6b. Backend + frontend: ruta real por calles (Google Directions API)

El usuario notó que la ruta entre origen y destino se dibujaba como línea recta (no seguía las calles), y que la distancia/duración también eran una aproximación en línea recta (Haversine). Se integró **Google Directions API**:

- **Nuevo endpoint** `GET /api/directions?originLat=&originLng=&destLat=&destLng=` (`DirectionsController` / `DirectionsService` / `DirectionsServiceImpl`) — cualquier usuario autenticado (pasajero o conductor) puede llamarlo. Devuelve `{ distanceKm, durationMinutes, polyline: [{latitude, longitude}, ...] }`.
- **Con respaldo automático:** si `utqallya.directions.enabled=false` o no hay `api-key` configurada, o la llamada a Google falla por cualquier motivo, el endpoint **nunca falla** — cae a línea recta de 2 puntos + distancia Haversine (el mismo cálculo que existía antes de esta integración). El frontend no necesita saber cuál de los dos casos ocurrió.
- **`TripServiceImpl.requestTrip`** ahora usa `DirectionsService.getRoute(...)` en vez de calcular Haversine directamente, así que `distanceKm`/`estimatedDurationMinutes`/`fare` del viaje persistido ya reflejan la ruta real (cuando está disponible).
- **Frontend:** nuevo `src/services/directionsService.ts`, usado por `ChooseVehicleScreen` (vista previa antes de pedir el viaje) y `TripTrackingScreen` (durante el viaje). Ambos dibujan la polilínea real en vez de una línea recta entre los dos pines.
- **Configuración:** `utqallya.directions.api-key` / `utqallya.directions.enabled` en `application.yml`, leídas de las variables de entorno `DIRECTIONS_API_KEY` / `DIRECTIONS_ENABLED`. **Ya está configurada y funcionando** con una API key real del usuario, guardada en `backend/.env` (gitignored — ver sección 4 para cómo cargarla al arrancar el backend).
- **Gotcha real encontrado al configurar la key:** "habilitar la API en el proyecto" de Google Cloud y "permitir que esta key específica la use" son dos configuraciones separadas. La key inicial dio `REQUEST_DENIED` con mensaje `"This API key is not authorized to use this service or API"` hasta que el usuario agregó "Directions API" (y "Places API") a la lista de **restricciones de API de la key** (Credenciales → [la key] → Restricciones de API). Los cambios de restricciones de key pueden tardar unos minutos en propagarse en el lado de Google.
- **Places API también está habilitada** en el mismo proyecto/key (el usuario la activó "por si acaso"), pero **no se usa todavía** — el usuario decidió explícitamente no implementar autocompletado real de direcciones (ver sección 8). Queda lista para usarse si se decide lo contrario más adelante.

### 6c. Íconos SVG minimalistas (reemplazo de emojis)

El usuario proveyó 8 archivos SVG monocromáticos (24×24, un solo `path`) directamente en la raíz del proyecto: `Correo.svg`, `Destino.svg`, `Historial.svg`, `Inicio.svg`, `Mapa.svg`, `Marcador.svg`, `Perfil.svg`, `Telefono.svg`. Se instaló `react-native-svg` (vía `npx expo install`, versión ajustada al SDK) y se creó `mobile/src/components/icons.tsx`: cada ícono es un componente liviano (`<Svg><Path d="..."/></Svg>`) con el path de cada SVG embebido directamente como string — **no** se usa un transformer de Metro para importar `.svg` crudos, para no agregar otra pieza de configuración de build por solo 8 íconos estáticos. Cada componente acepta `size`/`color`.

Reemplazados: barra de pestañas (Inicio/Historial/Perfil, en `PassengerNavigator` y `DriverNavigator`), campos de Origen/Destino y botón de mapa en `HomeMapScreen`, ícono de ruta en `HistoryScreen`, filas de Correo/Teléfono en `ProfileScreen`. Los emojis 🚗/🛺 (tipo de vehículo) y 🎉 (conductor encontrado) se dejaron como estaban — no había SVG equivalente provisto.

Los 8 archivos `.svg` originales del usuario siguen en la raíz del repo (no en `mobile/`) — son solo la fuente de diseño, el código ya no los necesita en tiempo de ejecución porque los paths están embebidos en `icons.tsx`.

## 7. SDK 51 → 54: por qué y qué se rompió

El celular físico del usuario tenía Expo Go con SDK 54 (Expo Go solo soporta la versión más reciente del SDK, no versiones viejas). Se actualizó todo el proyecto. Bugs reales encontrados y arreglados en el proceso:

1. `NotificationBehavior` de `expo-notifications` cambió de forma (`shouldShowAlert` → `shouldShowBanner`/`shouldShowList`).
2. Faltaba `babel-preset-expo` como devDependency explícita.
3. `expo/tsconfig.base.json` pasó a usar `"module": "preserve"`, que exige TypeScript 5.4+ (se subió a 5.9.3).
4. **Expo Go ya no soporta push notifications remotas en Android desde el SDK 53** — esto es una limitación de Expo, no un bug del proyecto. El código ya maneja el fallo sin romper el login (try/catch en `AuthContext`/`notificationService`), pero significa que **el flujo de "conductor recibe aviso de nuevo viaje" no se puede probar ni en el emulador ni en Expo Go de un celular** — solo funcionaría con un development build nativo propio (`expo run:android` / EAS Build), algo que no se ha configurado todavía.

## 8. Limitaciones y cosas pendientes conocidas

- **Sin autocompletado de direcciones real.** El usuario lo pidió explícitamente así (para no depender de Google Places API / costos adicionales). Escribir una dirección solo pone una etiqueta de texto; las coordenadas reales solo se fijan arrastrando el pin en el mapa (o se heredan del centro del mapa actual si nunca se abrió el selector).
- **Sin panel de administrador con interfaz.** El backend ya tiene toda la API en `/api/admin/**` (`AdminController`): aprobar/rechazar conductores, bloquear/desbloquear usuarios, ver todos los viajes, estadísticas básicas. No existe ningún frontend (web o móvil) que lo consuma — la app móvil solo tiene una pantalla `AdminNotSupportedScreen` de placeholder.
- **Firebase deshabilitado.** `utqallya.firebase.enabled=false` por defecto. Si se habilita, además hay que lidiar con la limitación de Expo Go del punto 7.
- **Mapa en blanco en el emulador de Android en algunas condiciones.** Se diagnosticó como un problema de red virtual del emulador (NAT tipo slirp) con las llamadas internas de Google Play Services, no un bug de la app — en el celular físico y en web no debería pasar.
- **No se probó en celular físico dentro de esta sesión** — se dejó todo listo (SDK correcto, `.env` con la IP de LAN) pero el usuario no confirmó la conexión final.
- **Pantallas de conductor con diseño antiguo** (ver sección 6).

## 9. Bugs no obvios que vale la pena recordar

- **`react-navigation` (native-stack) descarta funciones pasadas como params de navegación.** Al construir el flujo de selección de punto en el mapa (cuando todavía era una pantalla separada, `PickLocationScreen`), se intentó devolver el punto elegido pasando un callback (`onConfirm`) en los params de navegación — react-navigation lo detecta como "non-serializable" y lo descarta silenciosamente en el stack nativo, sin avisar con un error visible. Se probó luego con params serializables (`route.params`) y con un context (`LocationPickerContext`) como buzón de un solo uso — ambos funcionaban, pero terminaron siendo innecesarios: la solución final (ver sección 6) fue **no navegar a otra pantalla en absoluto** — todo el estado vive en `HomeMapScreen`, así que este problema desapareció de raíz en vez de trabajarse alrededor. Si en el futuro se necesita devolver datos entre pantallas reales (no evitables fusionándolas), usar params serializables + `navigation.setParams`, nunca funciones en los params.
- **Mostrar `punto.address ?? 'placeholder'` es ambiguo.** Un punto ya fijado pero sin texto de referencia (`address: undefined`) se veía visualmente idéntico a "no fijado todavía", lo que causó muchísima confusión al probar el flujo (parecía que el estado no se guardaba, cuando en realidad sí se guardaba). Se arregló mostrando `"Punto en el mapa"` como fallback cuando el punto existe pero no tiene texto, reservando el placeholder real ("¿A dónde vamos?") solo para cuando el campo genuinamente es `null`.
- **`trip.origin`/`trip.destination` cambian de referencia en cada sondeo.** `TripContext` hace polling y llama `setTrip(nuevoObjeto)` cada `TRIP_POLL_INTERVAL_MS`, incluso si las coordenadas no cambiaron. Un `useEffect` con `[trip.origin, trip.destination]` como dependencias (objetos) se re-ejecuta en cada poll — en `TripTrackingScreen` esto habría vuelto a pedir la ruta a Directions API cada pocos segundos. Se usan las coordenadas primitivas (`trip.origin.latitude`, etc.) como dependencias en su lugar.

## 10. Estructura de carpetas (resumen)

```
backend/src/main/java/com/utqallya/backend/
  controller/     — REST controllers (Auth, Trip, Driver, Admin, User, Notification, Directions)
  service/        — lógica de negocio (TripServiceImpl es el núcleo del ciclo de vida del viaje;
                     DirectionsServiceImpl llama a Google o cae a línea recta)
  entity/         — JPA entities (Trip, Driver, Vehicle, User, GeoLocation, ...)
  dto/            — request/response DTOs
  security/       — JWT, filtros, UserDetailsService
backend/src/main/resources/db/migration/  — Flyway (V1, V2, V3)
backend/.env      — DIRECTIONS_API_KEY (gitignored, hay que cargarlo a mano, ver sección 4)

mobile/src/
  screens/passenger/  — flujo del pasajero (rediseñado esta sesión). Ya no existe
                         PickLocationScreen: fijar un punto ocurre dentro de HomeMapScreen.
  screens/driver/     — flujo del conductor (diseño anterior, sin cambios visuales)
  screens/shared/     — Perfil, Historial, Configuración (compartidas por rol)
  screens/auth/       — Login, registro, splash
  components/         — Button, TextField, AppMap (+ AppMap.web.tsx), etc.
  context/            — AuthContext, TripContext
  services/           — clientes de API por dominio (tripService, authService, directionsService, ...)
  navigation/          — RootNavigator, PassengerNavigator, DriverNavigator, AuthNavigator
```

## 11. Siguientes pasos sugeridos (no decididos, solo ideas)

- Probar el flujo completo en celular físico real (GPS real, red real).
- Aplicar el mismo lenguaje visual del rediseño a las pantallas de conductor.
- Faltan íconos SVG propios para 🚗/🛺 (auto/mototaxi) y 🎉 (celebración en DriverFoundScreen) — el usuario solo proveyó 8 (Correo, Destino, Historial, Inicio, Mapa, Marcador, Perfil, Telefono, ver sección 6c), esos quedaron sin reemplazo por no tener SVG equivalente.
- Decidir si vale la pena montar un development build nativo para poder probar push notifications de verdad.
- Construir un frontend (aunque sea web simple) para el panel de administrador, ya que la API ya existe.
- Si más adelante se decide agregar autocompletado real de direcciones, Places API ya está habilitada en el mismo proyecto/key de Google Cloud — solo faltaría el código.
