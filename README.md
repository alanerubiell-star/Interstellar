# GenPat Pharma — sitio web

Sitio mobile-first de la farmacia (ventas solo en tienda) en un solo archivo (`index.html`, ~7.5 KB gzip, sin fuentes ni librerías externas).

## Antes de publicar
Buscar y reemplazar en `index.html`:
- `52XXXXXXXXXX` → número de WhatsApp (lada país + número, sin `+`)
- `+52XXXXXXXXXX` → teléfono de la farmacia
- `[DIRECCIÓN]` y `[HORARIO ...]` → dirección y horarios reales
- URL `google.com/maps/search/...` → enlace "Compartir" de tu ficha en Google Maps

Copiar el `aviso-privacidad.html` actual a esta carpeta (el footer lo enlaza).

## Publicar
Arrastrar la carpeta a Netlify Drop, o conectar este repo (usa `netlify.toml`).
