# Puesta en marcha — de repositorio a negocio cobrando

Tiempo total: **60–90 minutos**. Sigue los pasos en orden; cada uno depende del anterior.

---

## Paso 0 — Probar en tu computadora (5 min)

```bash
npm install
npm run dev            # abre http://localhost:8080
```

Crea una cotización de prueba y descarga el PDF. Si eso funciona, todo lo demás
es configuración.

---

## Paso 1 — Dominio (10 min)

Compra un dominio en Namecheap, Cloudflare o Porkbun (~$12 USD/año).

Ideas disponibles con frecuencia: `cotizafacil.com`, `haztucotizacion.com`,
`cotizador.app`, `cotiza.mx`.

> Si quieres validar antes de gastar, sáltate este paso: Netlify te da un
> subdominio gratis del tipo `tu-sitio.netlify.app` y puedes conectar el dominio
> propio después sin perder nada.

---

## Paso 2 — Publicar el sitio (10 min)

1. Entra a [netlify.com](https://netlify.com) y crea una cuenta gratis.
2. **Add new site → Import an existing project → GitHub** y elige este repositorio.
3. Netlify lee `netlify.toml` solo. No cambies nada, dale **Deploy**.
4. Cuando termine, ve a **Domain settings** y conecta tu dominio.

El sitio ya está en línea. La herramienta gratuita funciona desde este momento
—no necesita ninguno de los pasos siguientes—; lo que falta es poder cobrar.

---

## Paso 3 — Stripe (20 min)

### 3.1 Crear el producto

1. Crea tu cuenta en [stripe.com](https://stripe.com) y completa la verificación
   de identidad (Stripe no libera pagos hasta que lo hagas).
2. **Productos → Añadir producto**
   - Nombre: `Cotiza Pro`
   - Descripción: `Licencia de por vida. Sin marca de agua, logo propio y documentos ilimitados.`
   - Precio: **$9 USD**, tipo **Único** (no recurrente).
3. En el producto, **Crear enlace de pago (Payment Link)**. En sus opciones:
   - Activa **Recopilar la dirección de correo electrónico** ← imprescindible,
     de ahí sale la clave de licencia.
   - En "Después del pago", elige **Redirigir a una página** y pon
     `https://TUDOMINIO.com/gracias.html`.
4. Copia la URL del Payment Link.

### 3.2 Pegarlo en el sitio

Edita `public/assets/js/config.js`:

```js
window.COTIZA = {
  siteUrl: 'https://TUDOMINIO.com',
  stripeLink: 'https://buy.stripe.com/xxxxxxxxxxxx',   // ← el que copiaste
  precio: '$9',
  moneda: 'USD',
  soporte: 'hola@TUDOMINIO.com',
  limiteGratis: 3,
};
```

Haz commit y push. Netlify vuelve a publicar solo.

---

## Paso 4 — Entrega automática de licencias (25 min)

Sin este paso las ventas funcionan, pero tienes que mandar cada clave a mano
(`npm run licencia -- correo@cliente.com`). Con este paso, el cliente recibe su
clave por correo en segundos.

### 4.1 Genera tu secreto de licencias

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guarda ese valor. **Si lo pierdes o lo cambias, todas las licencias emitidas
dejan de validar.** Ponlo en tu gestor de contraseñas ahora mismo.

### 4.2 Correo transaccional (Resend)

1. Crea una cuenta en [resend.com](https://resend.com) — 3,000 correos al mes gratis.
2. Verifica tu dominio (te da unos registros DNS que pegas en tu proveedor).
3. Copia tu API key.

### 4.3 Variables de entorno en Netlify

**Site settings → Environment variables**, agrega:

| Variable | Valor |
|---|---|
| `LICENSE_SECRET` | el hex de 64 caracteres del paso 4.1 |
| `STRIPE_SECRET_KEY` | Stripe → Desarrolladores → Claves API → clave secreta |
| `STRIPE_WEBHOOK_SECRET` | lo obtienes en el paso 4.4 |
| `RESEND_API_KEY` | tu clave de Resend |
| `CORREO_REMITENTE` | `Cotiza <hola@TUDOMINIO.com>` |
| `CORREO_SOPORTE` | `hola@TUDOMINIO.com` |

### 4.4 Webhook de Stripe

1. Stripe → **Desarrolladores → Webhooks → Añadir endpoint**
2. URL: `https://TUDOMINIO.com/api/stripe-webhook`
3. Evento a escuchar: **`checkout.session.completed`** (solo ese)
4. Copia el **Signing secret** (empieza con `whsec_`) y ponlo en Netlify como
   `STRIPE_WEBHOOK_SECRET`.
5. Vuelve a desplegar el sitio para que tome las variables nuevas.

### 4.5 Prueba de punta a punta

Con Stripe en **modo de prueba**, compra usando la tarjeta `4242 4242 4242 4242`,
cualquier fecha futura y cualquier CVC. Debes ver:

- Redirección a `/gracias.html` con Pro activado automáticamente.
- Un correo con tu clave.
- En la herramienta, la marca de agua desaparecida y el logo desbloqueado.

Si algo falla, revisa **Netlify → Functions → stripe-webhook → logs**.

**Cuando funcione, activa el modo real en Stripe y repite el paso 3.1 y 4.4 con
las claves reales.** Los enlaces y secretos de prueba no sirven en producción.

---

## Paso 5 — Analítica (5 min)

Sin medición estás manejando a ciegas. Usa una opción sin cookies para no
necesitar banner de consentimiento:

- [Plausible](https://plausible.io) — de pago, la más cómoda
- [Umami Cloud](https://umami.is) — plan gratis generoso
- Cloudflare Web Analytics — gratis si ya usas Cloudflare

Pega su script antes de `</head>` en `index.html`, `app.html` y los archivos de
`blog/`.

---

## Paso 6 — Indexar en Google (10 min)

1. Entra a [Search Console](https://search.google.com/search-console) y verifica
   tu dominio.
2. Envía `https://TUDOMINIO.com/sitemap.xml` (se genera solo en cada despliegue).
3. Usa **Inspección de URL → Solicitar indexación** para la portada y para los
   tres artículos del blog.

La indexación tarda días; el posicionamiento, meses. Empieza ya.

---

## Lista de verificación previa al lanzamiento

- [ ] `config.js` con tu dominio, tu Payment Link y tu correo real
- [ ] Compra de prueba completa, correo recibido y licencia activada
- [ ] `LICENSE_SECRET` respaldado en tu gestor de contraseñas
- [ ] Buscar y reemplazar `cotiza.app` por tu dominio en los `<link rel="canonical">` y en `docs/`
- [ ] Correo de soporte que realmente revisas
- [ ] Probado en celular (más de la mitad de tu tráfico será móvil)
- [ ] `sitemap.xml` enviado a Search Console
- [ ] Analítica instalada y registrando visitas

---

## Operación diaria (15 minutos)

| Cuándo | Qué |
|---|---|
| Diario | Revisar el correo de soporte. Responde el mismo día: es tu ventaja frente a las apps grandes. |
| Semanal | Publicar un artículo nuevo. Revisar las cinco métricas de `MODELO-NEGOCIO.md`. |
| Mensual | Revisar Search Console: qué búsquedas ya te traen gente y qué artículo escribir después. |

## Soporte: los tres casos que vas a ver

1. **"No me llegó la clave."** → `LICENSE_SECRET=xxx npm run licencia -- correo@cliente.com`
   y se la mandas. Verifica primero el pago en Stripe.
2. **"Perdí mis documentos."** → Están en el almacenamiento local del navegador.
   Si borró datos de navegación o usa modo incógnito, se perdieron. Explícalo con
   amabilidad y sugiere descargar siempre el PDF.
3. **"Quiero mi reembolso."** → Devuélvelo sin discutir desde Stripe. A este
   precio, discutir cuesta más que el reembolso, y una devolución rápida a veces
   se convierte en una recomendación.
