# GenPat Pharma — sitio web

Landing mobile-first en un solo archivo (`index.html`, ~7.5 KB gzip, sin fuentes ni librerías externas).

## Antes de publicar
Buscar y reemplazar en `index.html`:
- `52XXXXXXXXXX` → número de WhatsApp (lada país + número, sin `+`)
- `+52XXXXXXXXXX` → teléfono para llamadas
- `contacto@genpat.mx` → correo real

Copiar el `aviso-privacidad.html` actual a esta carpeta (el footer lo enlaza).

## Publicar
Arrastrar la carpeta a Netlify Drop, o conectar este repo (usa `netlify.toml`).
