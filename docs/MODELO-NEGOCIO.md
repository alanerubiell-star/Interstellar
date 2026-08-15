# Modelo de negocio: qué hace falta para llegar a $15 USD al día

Este documento es la parte incómoda y la más importante. El código ya está hecho;
lo que decide si esto llega a $15 diarios es la aritmética de abajo.

---

## 1. El producto

**Cotiza** es una herramienta web que genera cotizaciones y presupuestos en PDF.

- **Gratis:** documentos ilimitados, con una línea de marca al pie y sin logo propio.
- **Pro — $9 USD, pago único:** quita la marca, permite logo y color propios,
  desbloquea modo factura/recibo y guarda documentos sin límite.

**Por qué este producto y no otro**

| Requisito | Cómo lo cumple |
|---|---|
| Costo marginal cero | Todo corre en el navegador del usuario. Cero servidores, cero APIs de pago. |
| Sin soporte pesado | No hay cuentas, no hay contraseñas que resetear, no hay datos que perder. |
| Tráfico orgánico posible | "Cómo hacer una cotización" es una búsqueda con intención y volumen real en español. |
| Dolor con dinero de por medio | Quien busca cómo cotizar está a punto de intentar cobrarle a alguien. |
| Momento de compra natural | La marca de agua molesta justo cuando el usuario ya obtuvo valor y va a mandar el PDF a un cliente. |

---

## 2. Los números de $15/día

$15 USD/día = **$450 USD/mes** = $5,475 USD/año.

### Ingreso neto por venta

| Concepto | Monto |
|---|---|
| Precio de lista | $9.00 |
| Comisión Stripe (≈2.9% + $0.30) | −$0.56 |
| **Neto por venta** | **≈ $8.44** |

$450 ÷ $8.44 = **54 ventas al mes** ≈ **1.8 ventas al día**.

### Cuánto tráfico requieren esas 54 ventas

Embudo con supuestos conservadores pero realistas para una herramienta gratuita:

| Etapa | Tasa | Resultado |
|---|---|---|
| Visitas al sitio | — | 7,700 |
| Abren la herramienta | 35% | 2,695 |
| Terminan y descargan un PDF | 50% | 1,348 |
| Compran Pro | 4% | **54** |

**≈ 7,700 visitas al mes ≈ 257 visitas al día.**

> Conversión total visita → venta: **0.7%**. Si tu embudo real sale peor (0.4%),
> necesitas ~13,500 visitas al mes. Si sale mejor (1.2%), bastan ~4,500.
> Mide el tuyo antes de creerle a esta tabla.

---

## 3. El precio es la palanca más fuerte que tienes

Duplicar el tráfico es un trabajo de meses. Subir el precio es un cambio de un
renglón en `config.js`. A $9 el producto está **subvaluado**: le ahorra horas de
trabajo a alguien que factura por horas.

| Precio | Neto/venta | Ventas/mes para $450 | Visitas/mes necesarias |
|---|---|---|---|
| $9 | $8.44 | 54 | 7,700 |
| $19 | $18.15 | 25 | 3,600 |
| $29 | $27.86 | 17 | 2,400 |
| $19 + $5/mes opcional | mixto | ~15 nuevas | ~2,100 |

A $29 necesitas **un tercio** del tráfico que a $9 — y con casi total certeza no
pierdes dos tercios de los compradores. La elasticidad no es lineal en este rango.

**Recomendación: lanza a $9 para conseguir tus primeros 20 compradores rápido y
recoger testimonios; súbelo a $19 en cuanto los tengas.** Los que ya compraron
conservan su licencia; el pago único no se les toca.

---

## 4. El techo del pago único (y cómo romperlo)

Un producto de pago único no acumula: cada mes empiezas de cero. Para que $450
sea un **piso** y no un techo, tres capas encima del producto actual:

1. **Suscripción opcional ($5/mes o $39/año).** Documentos sincronizados entre
   dispositivos, catálogo de clientes, recordatorios de seguimiento. Requiere backend
   —es la única función de esta lista que cuesta dinero operar—, pero convierte
   ingreso de una sola vez en ingreso recurrente. Es la diferencia entre vender
   54 veces cada mes y vender 54 veces una vez.
2. **Paquete de plantillas ($15).** Contratos, órdenes de compra, remisiones y
   recibos. Es contenido, no software: se produce una vez y se vende siempre.
3. **Afiliación.** Cuando recomiendas a tu usuario una herramienta de facturación
   electrónica o de contabilidad, esa recomendación vale comisión. Tu audiencia
   ya está calificada: son personas que acaban de cotizar un trabajo.

---

## 5. Calendario realista

Cualquiera que te prometa $15/día en la semana uno te está vendiendo algo.

| Periodo | Qué pasa | Ingreso esperado |
|---|---|---|
| Mes 1 | Lanzamiento, Product Hunt, grupos, primeros usuarios | $0 – $80 |
| Mes 2–3 | Google empieza a indexar el blog; primeras ventas orgánicas | $30 – $150 |
| Mes 4–6 | Los artículos escalan posiciones; el tráfico se compone | $150 – $400 |
| Mes 7–12 | 250+ visitas diarias sostenidas | **$400 – $900** |

**El único factor que decide si esto pasa o no es si publicas contenido de forma
constante durante seis meses.** El código de este repo es un activo terminado; el
contenido es el trabajo real que queda por delante.

---

## 6. Costos de operación

| Concepto | Costo mensual |
|---|---|
| Hosting (Netlify, plan gratis) | $0 |
| Funciones serverless (dentro del plan gratis) | $0 |
| Dominio | ~$1 (≈$12/año) |
| Correo transaccional (Resend, 3,000/mes gratis) | $0 |
| Stripe | Solo comisión por venta |
| **Total fijo** | **≈ $1/mes** |

El margen es de aproximadamente 94%. No hay inventario, no hay envíos, no hay
nómina. Con una sola venta al mes el negocio ya es rentable en términos de caja;
lo que estás comprando con tu tiempo es volumen.

---

## 7. Cómo saber si va bien (mide esto, no las visitas)

| Métrica | Meta | Por qué importa |
|---|---|---|
| Visitas → abren la herramienta | > 30% | Si es menor, la landing no convence |
| Abren → descargan PDF | > 45% | Si es menor, la herramienta confunde |
| Descargan → compran | > 3% | Si es menor, Pro no vale la pena como está |
| Reembolsos | < 5% | Si sube, el producto promete de más |
| Posición en Google para "cómo hacer una cotización" | Top 10 en 6 meses | Es el motor de todo lo demás |

Instala una analítica sin cookies (Plausible o Umami; también sirve el plan
gratis de Cloudflare Web Analytics) y revisa estas cinco cifras una vez por semana.
No más seguido: el ruido semanal te hará tomar malas decisiones.
