# Utqallya

Aplicación de transporte de pasajeros para los distritos de **Acarí** y
**Bella Unión** (provincia de Caravelí, departamento de Arequipa, Perú).

Es un MVP profesional, deliberadamente simple: solo conecta pasajeros con
conductores de auto o mototaxi mediante un flujo de solicitud → ofertas de
conductores → elección del pasajero → código de confirmación → viaje →
calificación. El conductor propone el precio y el pasajero decide antes de la
asignación.

## Estructura del repositorio

```
Sistema de transporte/
├── backend/    API REST — Spring Boot 3 · Java 21 · PostgreSQL · JWT
├── mobile/     App móvil — React Native · Expo · TypeScript
└── docs/       Arquitectura, modelo de datos, API, variables de entorno
```

Documentación detallada:

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) — capas, decisiones de diseño y por qué
- [docs/DATABASE.md](./docs/DATABASE.md) — modelo entidad-relación
- [docs/API.md](./docs/API.md) — endpoints REST
- [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) — variables de entorno

## Stack técnico

| Capa            | Tecnología                                                  |
|------------------|---------------------------------------------------------------|
| App móvil        | React Native + Expo + TypeScript                              |
| Backend          | Spring Boot 3, Java 21, Maven, Spring Security + JWT           |
| Base de datos    | PostgreSQL + Flyway (migraciones versionadas)                   |
| Mapas            | Google Maps SDK + Directions API, geolocalización en tiempo real |
| Notificaciones   | Firebase Cloud Messaging                                        |
| Almacenamiento   | Cloudinary (fotos de DNI, licencia, SOAT y vehículo)             |

## Roles

Solo existen dos tipos de usuario en la app móvil (más un administrador que
opera desde un panel web, fuera del alcance de esta app):

- **Pasajero**: se registra, solicita viajes, ve al conductor asignado en el
  mapa, cancela, revisa su historial y califica.
- **Conductor** (auto o mototaxi): se registra con su documentación (DNI,
  licencia, SOAT, foto del vehículo), queda pendiente de aprobación, y una
  vez aprobado puede activarse para recibir y atender viajes.

## Requisitos previos

- JDK 21 y Maven 3.9+ (backend)
- Node.js 18+ y npm (app móvil)
- Docker (para levantar PostgreSQL localmente) o una instancia propia de PostgreSQL 16
- Expo Go instalado en tu celular, o un emulador Android/iOS

## Puesta en marcha rápida

### 1. Base de datos

```bash
cd backend
docker compose up -d   # levanta PostgreSQL en localhost:5432
```

### 2. Backend

```bash
cd backend
mvn spring-boot:run   # http://localhost:8080 · Swagger UI en /docs
```

Las migraciones de Flyway crean el esquema y siembran los datos de
referencia (roles, métodos de pago y un usuario administrador) al arrancar
por primera vez. Ver credenciales iniciales en [docs/API.md](./docs/API.md).

### 3. App móvil

```bash
cd mobile
npm install
cp .env.example .env    # completa EXPO_PUBLIC_API_URL y las claves de Google Maps
npm start                # abre Expo Dev Tools; escanea el QR con Expo Go
```

Ver todas las variables de entorno (backend y mobile) en
[docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md).

## Flujo de un viaje, en una línea

El pasajero elige origen y destino → los conductores aprobados y disponibles
dentro del radio reciben la solicitud → cada conductor interesado propone su
precio → el pasajero compara y elige una oferta → el conductor seleccionado
llega al punto de recogida → el pasajero le dicta
un código numérico que ve en su pantalla → el conductor lo ingresa y el
viaje comienza → al llegar al destino el conductor lo finaliza → el pasajero
califica de 1 a 5 estrellas.

## Estado del proyecto

MVP funcional de extremo a extremo (backend + app móvil) listo para
conectarse a credenciales reales de Google Maps, Firebase y Cloudinary antes
de un despliegue a producción. `mobile/assets/` contiene una identidad visual
provisional completa y dimensionada para Expo; debe ser aprobada por el
responsable de marca antes de publicar en las tiendas.
