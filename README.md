# Cotiza — negocio digital listo para operar

Herramienta web que genera **cotizaciones y presupuestos en PDF** para freelancers
y pequeños negocios de habla hispana. Gratis para usar, con una licencia Pro de
pago único que quita la marca de agua y desbloquea logo, colores y documentos
ilimitados.

100% digital: sin inventario, sin envíos y con un costo de operación de
**aproximadamente $1 USD al mes**.

---

## Empezar

```bash
npm install
npm run dev        # http://localhost:8080
```

Para ponerlo a cobrar de verdad: **[`docs/LANZAMIENTO.md`](docs/LANZAMIENTO.md)** (60–90 min).

---

## Los tres documentos que importan

| Documento | Qué contiene |
|---|---|
| [`docs/MODELO-NEGOCIO.md`](docs/MODELO-NEGOCIO.md) | La aritmética de $15/día: cuántas ventas, cuánto tráfico, qué precio y en cuánto tiempo |
| [`docs/LANZAMIENTO.md`](docs/LANZAMIENTO.md) | Paso a paso: dominio, Netlify, Stripe, entrega automática de licencias |
| [`docs/DISTRIBUCION.md`](docs/DISTRIBUCION.md) | Cómo conseguir las visitas: 12 artículos priorizados, comunidades y plan de 30 días |

**Resumen honesto:** $15 USD/día son ~54 ventas al mes a $9, que requieren unas
7,700 visitas mensuales. Es alcanzable en 6–12 meses **si publicas contenido de
forma constante**. El código de este repo está terminado; el contenido es el
trabajo que queda.

---

## Qué hay adentro

```
public/
  index.html              Landing con precios y preguntas frecuentes
  app.html                La herramienta (formulario + vista previa en vivo)
  gracias.html            Post-compra, activa la licencia automáticamente
  privacidad.html         Privacidad y términos
  blog/                   3 artículos de SEO, listos para publicar
  assets/js/config.js     ← el único archivo que necesitas editar

netlify/functions/
  stripe-webhook.js       Recibe el pago, emite la clave y la manda por correo
  verify-license.js       Valida clave + correo
  _lib/license.js         Generación de claves con HMAC

scripts/
  gen-license.js          Emitir claves a mano (soporte, regalos, ventas fuera de Stripe)
  build-sitemap.js        Genera sitemap.xml y robots.txt en cada despliegue

docs/                     Modelo de negocio, lanzamiento y distribución
```

---

## Decisiones técnicas y por qué

**Todo corre en el navegador.** Los datos de tus clientes nunca tocan un servidor
nuestro. Eso elimina la base de datos, el cumplimiento de protección de datos y el
riesgo de fuga; además es el argumento de venta más fuerte frente a la competencia.

**El PDF se genera con la impresión del navegador**, no con una librería. Cero
dependencias en el navegador, salida nítida en cualquier tamaño y hojas de estilo
`@media print` que caben en unas cuantas líneas.

**Las licencias no necesitan base de datos.** La clave es
`HMAC-SHA256(secreto, correo)` codificada en un alfabeto sin caracteres
confundibles. Emitir y validar son el mismo cálculo, así que no hay nada que
almacenar ni que respaldar —salvo el secreto—.

**El bloqueo de Pro es del lado del cliente,** y es una decisión consciente: quien
sepa editar JavaScript puede saltárselo. Para un producto de $9 dirigido a
profesionales, poner un servidor de por medio cuesta más de lo que evita. La
fricción honesta convierte mejor que la fortaleza.

---

## Comandos

```bash
npm run dev                                          # servidor local
npm run sitemap                                      # regenerar sitemap.xml y robots.txt
LICENSE_SECRET=xxx npm run licencia -- correo@x.com  # emitir una clave a mano
```

## Variables de entorno (Netlify)

| Variable | Necesaria para |
|---|---|
| `LICENSE_SECRET` | Emitir y validar licencias. **Respáldala: si la cambias, invalidas todas las claves vendidas.** |
| `STRIPE_SECRET_KEY` | Webhook de Stripe |
| `STRIPE_WEBHOOK_SECRET` | Verificar la firma del webhook |
| `RESEND_API_KEY` | Enviar la clave por correo (opcional; sin ella se manda a mano) |
| `CORREO_REMITENTE` | Remitente de los correos |
| `CORREO_SOPORTE` | Correo de contacto que ve el cliente |
