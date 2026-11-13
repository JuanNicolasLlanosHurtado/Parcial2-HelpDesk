# HelpDesk – Laboratorio Node.js: Seguridad y conexión de datos (MongoDB local)

## Requisitos
Node.js y MongoDB Community corriendo en local (puerto 27017).

## Ejecutar
```bash
npm install
npm start
```
Abrir http://localhost:3000 (consola: "Conectado exitosamente a MongoDB (local)").

## Rutas
| Ruta | Acceso | Descripción |
|---|---|---|
| `/`, `/reportar` | Pública | Inicio y formulario (guarda en MongoDB) |
| `/login`, `/logout` | Pública | Inicio / cierre de sesión (admin / 12345) |
| `/admin` | Protegida | Panel con los tickets (`_id` de MongoDB) |
| `/admin/resolver` | Protegida | Elimina el ticket por `_id` |

## Verificación
1. Entrar a /admin sin sesión → redirige a /login.
2. Login admin / 12345 → cambia el menú.
3. Enviar un reporte en /reportar → no existe tickets.json, se guarda en MongoDB.
4. Ver el registro en /admin y eliminarlo con su `_id`.
