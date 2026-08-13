# Checklist de lanzamiento

Este documento separa lo que puede automatizarse en el repositorio de las
validaciones que requieren credenciales, dispositivos o decisiones del negocio.

## Obligatorio para piloto

- [ ] CI en verde para backend y mobile.
- [ ] Flujo completo probado con un pasajero y un conductor reales.
- [ ] Recuperación de viaje activo verificada tras cerrar y abrir la app.
- [ ] Conductor impedido de aceptar dos viajes simultáneos.
- [ ] Google Maps y Directions probados con claves restringidas.
- [ ] Firebase probado en un development build nativo.
- [ ] Cloudinary configurado con acceso y retención definidos.
- [ ] Panel administrativo incluido en `/admin` y publicado mediante HTTPS.
- [ ] PostgreSQL con backup automático y restauración ensayada.
- [x] Scripts seguros de backup/restauración y entorno staging versionados.
- [ ] Secretos de producción cargados fuera del repositorio.
- [ ] Cuenta administrativa predeterminada reemplazada.
- [x] Revocación de JWT al cambiar/restablecer clave, bloquear o eliminar cuenta.
- [ ] SMTP configurado y recuperación de contraseña probada con correo real.
- [ ] Canal de soporte e incidencias definido.
- [x] Registro de incidentes por viaje y seguimiento administrativo implementados.
- [x] Cancelaciones con motivo y actor responsable trazable.
- [x] Contacto de emergencia y botón SOS durante el viaje.
- [x] Bloqueo de aprobación/disponibilidad por licencia o SOAT vencido.
- [x] Renovación de licencia y SOAT con nueva revisión administrativa.
- [x] Pago directo en efectivo o Yape del conductor, sin pasarela ni custodia de fondos.
- [x] Conductores ofertan precios y el pasajero elige antes de la asignación.
- [x] Retiro, expiración y límite de cambios de ofertas.
- [x] Confirmación bilateral del pago directo y controversia de pago.
- [x] Avisos y suspensión automática por documentos vencidos.
- [x] Métricas administrativas de ofertas y tarifa acordada.

## Obligatorio para publicación

- [ ] Términos, privacidad y consentimiento de ubicación revisados legalmente.
- [x] Eliminación de cuenta y datos personales implementada.
- [ ] Iconos, splash, capturas y textos finales.
- [x] Iconos, favicon y splash provisionales en dimensiones válidas para Expo.
- [x] Componentes comunes con etiquetas y estados básicos de accesibilidad.
- [x] Exportación web de Expo completada localmente.
- [ ] Fichas de privacidad de Google Play y App Store completadas.
- [ ] Builds Android/iOS firmados y probados en dispositivos físicos.
- [ ] Monitoreo, alertas, logs y respuesta ante incidentes operativos.
- [x] Métricas Prometheus, Request ID y auditoría administrativa implementados.
- [ ] Política de tarifas, cancelaciones, seguridad y atención al usuario aprobada.

## Comandos de validación

Preflight de producción en Windows (no imprime valores secretos):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\Invoke-ReleasePreflight.ps1
```

Si Maven no está en `PATH`, añade
`-MavenCommand "C:\ruta\apache-maven\bin\mvn.cmd"`.

Backend:

```bash
bash ./scripts/validate-production-env.sh
bash -n scripts/*.sh
mvn verify
```

Mobile:

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
```
