# Amigo invisible

Web app sencilla para organizar el amigo invisible con amigos: creas un grupo, compartes el enlace,
cada persona cuenta sus gustos y, tras el sorteo, cada uno ve solo a quién le ha tocado y qué le gusta.

- Sin cuentas ni contraseñas: cada persona entra con un enlace personal (`/p/<token>`).
- Gustos como pistas (intereses, cosas que le encantan, qué evitar, tallas), no lista de deseos.
- Sorteo en el servidor: nadie se toca a sí mismo, admite parejas excluidas y es secreto
  (ni quien organiza ve las asignaciones).

## Stack

Next.js 16 (App Router, Server Actions) · Tailwind CSS 4 · SQLite vía libSQL.
Estilo visual basado en las Human Interface Guidelines de Apple (listas agrupadas, tipografía del sistema,
modo claro/oscuro, contraste ≥ 4.5:1).

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000. La base de datos se crea sola en `local.db`.

## Privacidad

- Cada persona solo recibe sus propios gustos y los de quien le ha tocado; del resto del grupo, solo
  nombre, avatar y si ya ha puesto gustos (`listMembers` en `src/lib/data.ts`).
- Si alguien pierde su enlace, lo pide en `/unirse/<grupo>/recuperar`. Quien organiza lo aprueba, el
  enlace anterior deja de funcionar y el nuevo solo se abre en el móvil que lo pidió.

## Producción (Vercel + Turso)

1. Base de datos en [Turso](https://turso.tech) (plan gratis):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   turso db create amigo-invisible
   turso db show amigo-invisible --url     # → DATABASE_URL
   turso db tokens create amigo-invisible  # → DATABASE_AUTH_TOKEN
   ```
2. En [vercel.com](https://vercel.com) → *Add New… → Project* → importa este repo de GitHub.
3. En *Environment Variables* añade `DATABASE_URL` y `DATABASE_AUTH_TOKEN`.
4. *Deploy*. Las tablas se crean solas en la primera visita. Cada `git push` a `main` vuelve a desplegar.
