# Panel administrativo de Utqallya

## Desarrollo local

```bash
npm install
npm run dev
```

Copia `.env.example` como `.env.local` y ajusta `VITE_API_BASE_URL` a la URL
pública de la API. La variable debe incluir el sufijo `/api`.

El panel usa el login existente y guarda el JWT en `sessionStorage`, por lo que
se elimina al cerrar la pestaña. Solo permite continuar a usuarios con rol
`ADMIN`.

## Compilación

```bash
npm run build
```

Los archivos listos para publicar quedan en `dist/`.
