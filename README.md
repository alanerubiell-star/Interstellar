# GenPat Pharma — sitio web

Sitio mobile-first de la farmacia (ventas solo en tienda) en un solo archivo (`index.html`, ~7.5 KB gzip, sin fuentes ni librerías externas).

## Datos del negocio
Dirección, horario (L–V 8–18 h, Sáb 9–15 h) y WhatsApp/teléfono (+52 220 204 8163) ya están en `index.html`.
Si cambia el horario, actualizar también el objeto `H` del script (estado "Abierto/Cerrado") y el bloque JSON-LD.

## Antes de publicar
Copiar el `aviso-privacidad.html` actual a esta carpeta (el footer lo enlaza).

## Publicar
Arrastrar la carpeta a Netlify Drop, o conectar este repo (usa `netlify.toml`).
