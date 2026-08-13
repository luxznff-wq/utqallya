# Ficha de tiendas — borrador

Debe revisarse con negocio y legal antes de copiarla a Google Play o App Store.
No afirmar cobertura, disponibilidad o tiempos que todavía no hayan sido
comprobados durante el piloto.

## Identidad

- Nombre: **Utqallya**
- Categoría sugerida: Viajes / Transporte
- Bundle ID iOS: `pe.utqallya.app`
- Package Android: `pe.utqallya.app`
- Idioma inicial: español (Perú)

## Descripción corta

Solicita viajes locales, compara ofertas de conductores y elige la que prefieras.

## Descripción completa

Utqallya conecta pasajeros con conductores de automóvil y mototaxi disponibles
en su zona.

Como pasajero puedes indicar origen y destino, recibir propuestas de precio,
comparar conductor, vehículo y calificación, y elegir libremente una oferta.
Durante el viaje puedes consultar el estado, usar un código de seguridad,
reportar incidentes y guardar un contacto de emergencia.

Los conductores controlan su disponibilidad, proponen sus propios precios,
actualizan su ubicación durante el servicio y administran la vigencia de su
licencia y SOAT.

El pago se realiza directamente al conductor en efectivo o mediante Yape.
Utqallya no recibe, procesa ni custodia el dinero del viaje.

## Textos para capturas

1. Solicita tu viaje desde el mapa.
2. Recibe y compara ofertas de conductores.
3. Elige según precio, vehículo y calificación.
4. Sigue el viaje y confirma el inicio con tu código.
5. Paga directamente en efectivo o Yape.
6. Reporta incidentes y consulta su seguimiento.

## URLs obligatorias

- Política de privacidad: pendiente de URL pública.
- Términos y condiciones: pendiente de URL pública.
- Soporte: pendiente de URL pública.
- Eliminación de cuenta: disponible dentro de Configuración; publicar además
  instrucciones web si Google Play lo exige.

## Declaración inicial de datos

Esta lista sirve para completar los formularios, pero debe contrastarse con el
comportamiento del build final y los contratos de los proveedores.

| Dato | Finalidad | Compartido con |
|---|---|---|
| Nombre, correo y teléfono | Cuenta, autenticación y contacto | Backend |
| Ubicación precisa | Búsqueda, asignación y seguimiento del viaje | Backend, Google Maps/Directions |
| Fotos y documentos del conductor | Verificación administrativa | Backend, Cloudinary |
| Token del dispositivo | Notificaciones | Backend, Firebase/Expo |
| Viajes, ofertas y tarifa acordada | Prestación, soporte y auditoría | Backend |
| Incidentes y contacto de emergencia | Seguridad y soporte | Backend |
| Número Yape del conductor | Pago directo del viaje seleccionado | Pasajero asignado |

No declarar cifrado, anonimización, eliminación o retención hasta confirmar la
configuración real de producción y la política legal aprobada.

## Permisos que deben justificarse

- Ubicación mientras se usa la app: mostrar posición, origen y destino.
- Ubicación en segundo plano: conductor disponible o realizando un viaje.
- Notificaciones: solicitudes, ofertas, estados e incidentes.
- Fotografías/galería: documentos de registro y renovación del conductor.

La ubicación en segundo plano debe explicarse en la revisión de tiendas y
demostrarse con un build funcional; es un permiso sensible.

