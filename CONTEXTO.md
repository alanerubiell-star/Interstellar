# GenPat Pharma — contexto del proyecto

## Sitio web (publicado)
- Carpeta `genpat-pharma/` = sitio estático publicado en https://genpat-pharma.netlify.app (proyecto Netlify `genpat-pharma`, despliegue manual arrastrando la carpeta).
- `index.html` contiene el catálogo en la constante `CATALOGO` (251 productos, 23 categorías) y datos estructurados JSON-LD (Pharmacy, FAQ, ItemList de venta libre).
- Fuente de productos y precios: Excel «GenPat_Pharma_Machote.xlsx», hoja «Lista de Productos» (columna PRECIO SUGERIDO). No está en el repo.
- Dirección: Torres Médicas Angelópolis, Torre II, Consultorio 801, Piso 8, Anillo Periférico Ecológico 3507, San Andrés Cholula, Puebla, C.P. 72821.
- Horario: lun–vie 8:00–18:00 · sáb 9:00–13:00 · dom cerrado.
- Google Analytics 4: G-H6EF087RH3.
- Decisiones de precio: Nuzolmet se queda en $1,500 (no $2,000 del Excel). Ajolot: bolsa 6 piezas $31 y pieza $3.
- Imagen para redes: `og-genpat-2026-10.jpg` (ya con la dirección nueva).

## Pendiente: Monedero GenPat (tarjeta digital en Wallet)
Propuesta enviada; maqueta en `propuestas/monedero-genpat-maqueta.png`. Falta que el cliente elija:
- **A.** Cuenta Apple Developer (USD 99/año) → Apple Wallet + Google Wallet nativos.
- **B.** Plataforma de terceros (PassKit, Passcreator, Boomerangme) con mensualidad.
- **C.** Sin Apple: Google Wallet + tarjeta web (PWA) en iPhone; agregar Apple después sin re-registrar clientes.

Reglas propuestas (por aprobar): 5% de regreso, $20 de bienvenida, canje desde $50, vigencia 12 meses, niveles Plata/Oro en fase 2, nombre «Monedero GenPat».

Arquitectura propuesta: Netlify Functions + Postgres (Supabase, plan gratuito); página de alta `/tarjeta`; panel `/mostrador` con PIN por persona, escaneo por cámara o lector USB, registro de compras y canjes, exportación CSV para la hoja de Ventas. No guardar recetas, diagnósticos ni medicamentos comprados. Actualizar aviso de privacidad y publicar términos del programa.
