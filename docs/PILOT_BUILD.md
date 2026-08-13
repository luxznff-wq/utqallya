# Build y prueba del piloto móvil

## Preparación

1. Crea `mobile/.env` desde `.env.example` y usa la URL HTTPS de staging.
2. Configura el proyecto EAS y guarda los secretos con EAS; no los confirmes
   en Git.
3. Restringe las claves de Maps por paquete/bundle y firma.
4. Verifica que privacidad, términos y soporte sean URLs HTTPS públicas.

## Validación local

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
npx expo export --platform web
```

## Builds internos

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile preview --platform ios
```

Usa `development` si necesitas inspección con Expo Dev Client y `production`
solamente cuando el piloto haya sido aprobado. iOS requiere una cuenta de
Apple Developer y Android requiere la identidad de firma definitiva.

## Matriz mínima de dispositivos

- Android de gama media en la versión mínima soportada y en una versión
  reciente.
- iPhone físico en la versión mínima soportada y en una versión reciente.
- Permisos de ubicación: concedido, denegado y revocado después.
- Red estable, lenta, pérdida de red y reapertura de la app durante un viaje.
- App en primer plano, segundo plano y pantalla bloqueada para el conductor.

## Guion de aceptación

1. Registrar pasajero y conductor, cargar documentos y aprobar al conductor.
2. Iniciar sesión, cerrar sesión y recuperar contraseña por correo real.
3. Solicitar viaje, recibir varias ofertas, elegir una, llegar, validar código,
   iniciar y finalizar.
4. Cerrar y reabrir ambas apps durante el viaje; comprobar recuperación.
5. Verificar ubicación en segundo plano y navegación desde una notificación.
6. Calificar, revisar historial y reportar un incidente.
7. Resolver el incidente en `/admin` y verificar la respuesta en la app.
8. Cambiar contraseña, comprobar revocación de sesión y eliminar una cuenta de
   prueba.

Registra dispositivo, sistema, build, hora, pasos y evidencia de cada fallo.
No publiques hasta completar este guion en Android e iOS sin defectos críticos.
