# Arquitectura de Utqallya

Este documento explica cómo está organizado el proyecto y por qué se tomaron
las decisiones de diseño más relevantes. Para el detalle de endpoints ver
[API.md](./API.md); para el modelo de datos ver [DATABASE.md](./DATABASE.md).

## Visión general

```
Sistema de transporte/
├── backend/     API REST en Spring Boot (Java 21)
├── mobile/      App React Native + Expo (TypeScript)
└── docs/        Este directorio
```

Es un monorepo simple: dos aplicaciones independientes que se comunican por
HTTP/JSON, cada una con su propio ciclo de vida de build y despliegue.

## Backend — Clean Architecture por capas

```
controller/   → Entrada HTTP. Solo valida, delega y traduce a códigos HTTP.
service/      → Reglas de negocio (interfaces + impl/). Toda la lógica vive aquí.
repository/   → Acceso a datos (Spring Data JPA).
entity/       → Modelo de dominio persistente (JPA).
dto/          → Contratos de entrada/salida, desacoplados de las entidades.
security/     → JWT, UserDetailsService, filtros.
config/       → Configuración transversal (seguridad, CORS, Swagger, Firebase).
exception/    → Excepciones de dominio + manejador centralizado.
util/         → Funciones puras sin estado (GeoUtils, TripCodeGenerator).
```

Reglas seguidas:

- **Los controladores nunca acceden a repositorios directamente.** Siempre
  pasan por un servicio. Esto mantiene la lógica de negocio en un solo lugar
  y testeable sin levantar el contexto web.
- **Los DTO nunca se filtran hacia las entidades JPA** ni viceversa: cada
  respuesta expone exactamente lo que el cliente debe ver (p. ej. el código
  de confirmación de un viaje solo viaja en la respuesta dirigida al
  pasajero, nunca al conductor — ver `TripResponse#forDriver`).
- **Un endpoint = una transición de estado.** `TripController` no tiene un
  endpoint genérico "actualizar viaje"; tiene `/accept`, `/arrived`,
  `/confirm-code`, `/finish`, `/cancel`, cada uno mapeado 1 a 1 con el enum
  `TripStatus`. Esto hace imposible dejar un viaje en un estado inconsistente
  desde el cliente.

### Decisiones de diseño que vale la pena explicar

**Asignación de conductor sin condiciones de carrera.** Cuando varios
conductores presionan "Aceptar" casi al mismo tiempo, solo uno puede ganar el
viaje. Esto se resuelve con un `UPDATE` condicional atómico en base de datos
(`TripRepository#tryAssignDriver`): la fila solo se actualiza si el viaje
sigue `SEARCHING_DRIVER` y sin conductor asignado. El primer `UPDATE` que
llegue a la base de datos gana (1 fila afectada); los demás reciben 0 filas y
el backend responde 409 Conflict. No se usa un lock pesimista ni colas
externas: es la solución más simple que garantiza corrección (KISS).

**Sin WebSockets, con sondeo (polling).** El pasajero y el conductor
consultan el estado del viaje cada pocos segundos (`GET /trips/{id}` y
`GET /trips/{id}/driver-location`) en vez de mantener una conexión en tiempo
real. A la escala de dos distritos vecinos con un número acotado de
conductores, esto es suficientemente responsivo y evita la complejidad
operativa de mantener conexiones persistentes en producción. Si el proyecto
crece, este es el punto de extensión natural hacia WebSockets/STOMP.

**Emparejamiento por distancia en memoria.** Para encontrar conductores
dentro del radio de búsqueda se usa la fórmula de Haversine en Java
(`GeoUtils`), no una extensión geoespacial de PostgreSQL (PostGIS). Con el
volumen de conductores esperado en Acarí y Bella Unión, esto es más simple de
operar y perfectamente suficiente en rendimiento.

**El código de confirmación nunca llega al conductor por API.** El pasajero
lo ve en pantalla y se lo dice de viva voz; el conductor solo puede *enviar*
un intento (`POST /trips/{id}/confirm-code`), que el backend valida. Esto
está reforzado a nivel de DTO (`TripResponse.forDriver` omite el campo), no
solo a nivel de UI.

**El panel administrativo es web, no parte de la app móvil.** La app React
Native solo tiene los roles Pasajero y Conductor, tal como pide el alcance
del MVP. El backend ya expone todos los endpoints `/api/admin/**` necesarios
para construir ese panel (React/Next.js, por ejemplo) como un tercer cliente
independiente cuando se priorice.

## Mobile — organización por capas

```
src/
├── theme/        Colores, tipografía, espaciado (única fuente de verdad visual)
├── components/   UI reutilizable sin lógica de negocio (Button, TextField, ...)
├── screens/      Una carpeta por dominio: auth/, passenger/, driver/, shared/
├── navigation/   Stacks y tabs de React Navigation
├── context/      Estado global mínimo: sesión (AuthContext) y viaje activo (TripContext)
├── services/     Toda llamada HTTP vive aquí, nunca directamente en una pantalla
├── constants/    Configuración y valores fijos (radios, intervalos, colores de estado)
└── types/        Tipos TypeScript compartidos, alineados con los DTO del backend
```

- **Las pantallas no llaman a `axios` directamente**: siempre pasan por
  `services/*.ts`. Si el día de mañana cambia el cliente HTTP o se agrega
  caché, se toca un solo archivo por dominio.
- **Pantallas compartidas entre roles.** `ProfileScreen` y `HistoryScreen`
  se reutilizan para pasajero y conductor porque el backend ya devuelve la
  vista correcta según el rol autenticado (`/trips/me`, `/users/me`); la
  pantalla solo decide qué secciones adicionales mostrar. Esto evita
  duplicar cuatro pantallas casi idénticas (DRY).
- **Pantalla única y adaptativa para el tramo activo del viaje.**
  `TripTrackingScreen` (pasajero) y `DriverTripScreen` (conductor) cambian su
  contenido según `trip.status` en vez de tener una pantalla separada por
  cada estado intermedio (conductor en camino / esperando confirmación / en
  viaje). Menos pantallas casi duplicadas, mismo resultado para el usuario.

## Seguridad

- Autenticación **stateless** con JWT (HMAC-SHA256, `jjwt`). El token va en
  `Authorization: Bearer <token>` y se valida en cada request
  (`JwtAuthenticationFilter`).
- Contraseñas con **BCrypt** (`spring-security-crypto`).
- Autorización por rol tanto a nivel de ruta (`SecurityConfig`, p. ej.
  `/api/admin/**` → solo `ROLE_ADMIN`) como a nivel de método
  (`@PreAuthorize` en los controladores de pasajero/conductor).
- Un usuario bloqueado por el administrador (`User.blocked = true`) no puede
  volver a iniciar sesión (`UserPrincipal#isEnabled`/`isAccountNonLocked`).

## Por qué no se agregaron ciertas cosas

Siguiendo el alcance del MVP, deliberadamente **no** se implementó: chat,
negociación de tarifa, subastas, viajes compartidos, tarifas dinámicas,
pasarela de pago real, ni IA. Agregar cualquiera de estos sin que el negocio
lo pida sería sobre-ingeniería (YAGNI) para un servicio de transporte local
pensado para ser extremadamente simple de usar.
