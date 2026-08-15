/* Cotiza — editor. Todo corre en el navegador; nada se sube a un servidor. */
(function () {
  var cfg = window.COTIZA || {};
  var LS_DOCS = 'cotiza.docs';
  var LS_ACTUAL = 'cotiza.actual';

  var $ = function (id) { return document.getElementById(id); };

  var estado = {
    tipo: 'COTIZACIÓN',
    folio: 'COT-001',
    fecha: hoy(),
    vigencia: enDias(15),
    emisorNombre: '',
    emisorDatos: '',
    clienteNombre: '',
    clienteDatos: '',
    moneda: 'MXN',
    impNombre: 'IVA',
    impTasa: 16,
    descuento: 0,
    retencion: 0,
    condiciones: '',
    notas: '',
    color: '#3b46f1',
    logo: '',
    items: [{ desc: '', detalle: '', cant: 1, precio: 0 }],
  };

  /* ---------------- utilidades ---------------- */

  function hoy() { return new Date().toISOString().slice(0, 10); }

  function enDias(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function fechaLarga(iso) {
    if (!iso) return '';
    var p = iso.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  function dinero(n) {
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: estado.moneda, minimumFractionDigits: 2,
      }).format(n || 0);
    } catch (e) {
      return (n || 0).toFixed(2);
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function multilinea(s) { return esc(s).replace(/\n/g, '<br>'); }

  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

  /* ---------------- cálculo ---------------- */

  function totales() {
    var subtotal = estado.items.reduce(function (s, it) {
      return s + num(it.cant) * num(it.precio);
    }, 0);
    var descuento = subtotal * (num(estado.descuento) / 100);
    var base = subtotal - descuento;
    var impuesto = base * (num(estado.impTasa) / 100);
    var retencion = base * (num(estado.retencion) / 100);
    return {
      subtotal: subtotal,
      descuento: descuento,
      base: base,
      impuesto: impuesto,
      retencion: retencion,
      total: base + impuesto - retencion,
    };
  }

  /* ---------------- Pro ---------------- */

  function esPro() { return window.Licencia && window.Licencia.esPro(); }

  function aplicarPro() {
    var pro = esPro();

    document.querySelectorAll('[data-lock]').forEach(function (el) {
      el.classList.toggle('bloqueado', !pro);
    });

    var hint = $('logoHint');
    if (hint) hint.textContent = pro
      ? 'Logo y color activos. Se ven en el PDF.'
      : 'El logo y el color son del plan Pro.';

    document.querySelectorAll('#tipo option[data-pro]').forEach(function (op) {
      op.disabled = !pro;
    });

    var pill = $('estadoPro');
    if (pro) {
      pill.textContent = 'PRO';
      pill.classList.remove('libre');
      pill.title = 'Licencia activa: ' + (window.Licencia.email() || '');
    } else {
      pill.textContent = 'Plan gratis';
      pill.classList.add('libre');
      pill.title = 'Activar Pro';
    }
  }

  function ofrecerPro(motivo) {
    var msg = motivo + '\n\n¿Ya compraste Pro y quieres activar tu clave?\n' +
      'Aceptar = activar clave.  Cancelar = ver precios.';
    if (confirm(msg)) {
      window.Licencia.pedirClave().then(function (ok) { if (ok) { aplicarPro(); render(); } });
    } else {
      window.open('/#precios', '_blank');
    }
  }

  /* ---------------- formulario de conceptos ---------------- */

  function pintarItems() {
    var cont = $('items');
    cont.innerHTML = '';

    estado.items.forEach(function (it, i) {
      var div = document.createElement('div');
      div.className = 'item';
      div.innerHTML =
        '<div class="item-head"><span>CONCEPTO ' + (i + 1) + '</span>' +
        (estado.items.length > 1 ? '<button type="button" class="icon-btn" data-borrar="' + i + '" title="Eliminar">×</button>' : '') +
        '</div>' +
        '<div class="field"><input data-campo="desc" data-i="' + i + '" placeholder="Diseño de identidad de marca" value="' + esc(it.desc) + '"></div>' +
        '<div class="field"><input data-campo="detalle" data-i="' + i + '" placeholder="Detalle opcional (entregables, alcance…)" value="' + esc(it.detalle) + '"></div>' +
        '<div class="row">' +
        '<div><label>Cantidad</label><input type="number" step="0.01" min="0" data-campo="cant" data-i="' + i + '" value="' + esc(it.cant) + '"></div>' +
        '<div><label>Precio unitario</label><input type="number" step="0.01" min="0" data-campo="precio" data-i="' + i + '" value="' + esc(it.precio) + '"></div>' +
        '</div>';
      cont.appendChild(div);
    });

    cont.querySelectorAll('[data-campo]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var i = +inp.dataset.i, campo = inp.dataset.campo;
        estado.items[i][campo] = (campo === 'cant' || campo === 'precio') ? num(inp.value) : inp.value;
        render();
      });
    });

    cont.querySelectorAll('[data-borrar]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        estado.items.splice(+btn.dataset.borrar, 1);
        pintarItems();
        render();
      });
    });
  }

  /* ---------------- vista previa ---------------- */

  function render() {
    var pro = esPro();
    var color = pro ? estado.color : '#1a1a1a';

    $('vTipo').textContent = estado.tipo;
    $('vTipo').style.color = color;

    var meta = [];
    if (estado.folio) meta.push('<b>Folio:</b> ' + esc(estado.folio));
    if (estado.fecha) meta.push('<b>Fecha:</b> ' + fechaLarga(estado.fecha));
    if (estado.vigencia && (estado.tipo === 'COTIZACIÓN' || estado.tipo === 'PRESUPUESTO')) {
      meta.push('<b>Válida hasta:</b> ' + fechaLarga(estado.vigencia));
    }
    $('vMeta').innerHTML = meta.join('<br>');

    $('vEmisorNombre').textContent = estado.emisorNombre || 'Tu nombre o empresa';
    $('vEmisorDatos').innerHTML = multilinea(estado.emisorDatos);
    $('vClienteNombre').textContent = estado.clienteNombre || 'Nombre del cliente';
    $('vClienteDatos').innerHTML = multilinea(estado.clienteDatos);

    var logo = $('vLogo');
    if (pro && estado.logo) { logo.src = estado.logo; logo.hidden = false; }
    else { logo.hidden = true; }

    $('vThead').querySelectorAll('th').forEach(function (th) { th.style.background = color; });

    $('vItems').innerHTML = estado.items.map(function (it) {
      var importe = num(it.cant) * num(it.precio);
      return '<tr>' +
        '<td>' + (esc(it.desc) || '<span style="color:#bbb">Concepto</span>') +
        (it.detalle ? '<span class="desc-extra">' + esc(it.detalle) + '</span>' : '') + '</td>' +
        '<td class="num">' + (num(it.cant) % 1 === 0 ? num(it.cant) : num(it.cant).toFixed(2)) + '</td>' +
        '<td class="num">' + dinero(num(it.precio)) + '</td>' +
        '<td class="num">' + dinero(importe) + '</td>' +
        '</tr>';
    }).join('');

    var t = totales();
    var filas = '<tr><td>Subtotal</td><td>' + dinero(t.subtotal) + '</td></tr>';
    if (t.descuento > 0) {
      filas += '<tr class="desc"><td>Descuento (' + num(estado.descuento) + '%)</td><td>− ' + dinero(t.descuento) + '</td></tr>';
    }
    if (num(estado.impTasa) > 0) {
      filas += '<tr><td>' + esc(estado.impNombre || 'Impuesto') + ' (' + num(estado.impTasa) + '%)</td><td>' + dinero(t.impuesto) + '</td></tr>';
    }
    if (t.retencion > 0) {
      filas += '<tr><td>Retención (' + num(estado.retencion) + '%)</td><td>− ' + dinero(t.retencion) + '</td></tr>';
    }
    filas += '<tr class="total"><td>Total ' + esc(estado.moneda) + '</td><td style="color:' + color + '">' + dinero(t.total) + '</td></tr>';
    $('vTotales').innerHTML = filas;

    var notas = '';
    if (estado.condiciones) notas += '<div class="p-label">Condiciones de pago</div><p>' + esc(estado.condiciones) + '</p>';
    if (estado.notas) notas += '<div class="p-label">Notas</div><p>' + esc(estado.notas) + '</p>';
    $('vNotas').innerHTML = notas;
    $('vNotas').style.display = notas ? '' : 'none';

    $('vMarca').style.display = pro ? 'none' : '';
  }

  /* ---------------- enlazar formulario ---------------- */

  function enlazar() {
    Object.keys(estado).forEach(function (k) {
      if (k === 'items' || k === 'logo') return;
      var el = $(k);
      if (!el) return;
      el.value = estado[k];
      el.addEventListener('input', function () {
        if (el.id === 'tipo' && el.selectedOptions[0] && el.selectedOptions[0].dataset.pro && !esPro()) {
          el.value = 'COTIZACIÓN';
          estado.tipo = 'COTIZACIÓN';
          ofrecerPro('Los modos Factura y Recibo son del plan Pro.');
          render();
          return;
        }
        estado[k] = (el.type === 'number') ? num(el.value) : el.value;
        render();
      });
    });

    $('logo').addEventListener('change', function (e) {
      if (!esPro()) { e.target.value = ''; ofrecerPro('Poner tu logo es del plan Pro.'); return; }
      var file = e.target.files[0];
      if (!file) return;
      if (file.size > 900 * 1024) { alert('El logo debe pesar menos de 900 KB.'); e.target.value = ''; return; }
      var r = new FileReader();
      r.onload = function () { estado.logo = r.result; render(); };
      r.readAsDataURL(file);
    });

    $('color').addEventListener('input', function () {
      if (!esPro()) return;
      estado.color = $('color').value;
      render();
    });

    $('btnAgregar').addEventListener('click', function () {
      estado.items.push({ desc: '', detalle: '', cant: 1, precio: 0 });
      pintarItems();
      render();
    });

    $('estadoPro').addEventListener('click', function () {
      if (esPro()) {
        if (confirm('Pro activo con ' + window.Licencia.email() + '.\n\n¿Quieres desactivar la licencia en este dispositivo?')) {
          window.Licencia.borrar(); aplicarPro(); render();
        }
      } else {
        ofrecerPro('Pro quita la marca de agua y desbloquea logo, colores y documentos ilimitados.');
      }
    });

    [$('btnPdf'), $('btnPdf2')].forEach(function (b) {
      b.addEventListener('click', descargarPdf);
    });

    $('btnGuardar').addEventListener('click', guardar);
    $('btnAbrir').addEventListener('click', abrir);
    $('btnNuevo').addEventListener('click', nuevo);
  }

  /* ---------------- PDF ---------------- */

  function descargarPdf() {
    var titulo = document.title;
    var nombre = [estado.tipo.toLowerCase(), estado.folio, estado.clienteNombre]
      .filter(Boolean).join('-').replace(/[^\wáéíóúñ\- ]/gi, '').replace(/\s+/g, '-');
    // El nombre del archivo que sugiere el diálogo de impresión sale del título.
    document.title = nombre || 'cotizacion';
    autoguardar();
    window.print();
    setTimeout(function () { document.title = titulo; }, 800);
  }

  /* ---------------- guardar / abrir ---------------- */

  function docs() {
    try { return JSON.parse(localStorage.getItem(LS_DOCS) || '[]'); } catch (e) { return []; }
  }

  function autoguardar() {
    try { localStorage.setItem(LS_ACTUAL, JSON.stringify(estado)); } catch (e) {}
  }

  function aviso(txt) {
    var el = $('aviso');
    el.textContent = txt;
    setTimeout(function () { el.textContent = ''; }, 2600);
  }

  function guardar() {
    var lista = docs();
    var id = estado._id || ('d' + Date.now());
    var existente = lista.findIndex(function (d) { return d._id === id; });

    if (existente === -1 && !esPro() && lista.length >= (cfg.limiteGratis || 3)) {
      ofrecerPro('El plan gratis guarda ' + (cfg.limiteGratis || 3) + ' documentos. Pro los guarda sin límite.');
      return;
    }

    estado._id = id;
    var copia = JSON.parse(JSON.stringify(estado));
    copia._titulo = (estado.folio || 'Sin folio') + ' · ' + (estado.clienteNombre || 'Sin cliente');
    copia._ts = Date.now();

    if (existente === -1) lista.unshift(copia); else lista[existente] = copia;

    try {
      localStorage.setItem(LS_DOCS, JSON.stringify(lista));
      aviso('Guardado ✓');
    } catch (e) {
      alert('No hay espacio en el navegador. Borra algún documento guardado (probablemente un logo muy pesado).');
    }
  }

  function abrir() {
    var lista = docs();
    if (!lista.length) { alert('Todavía no tienes documentos guardados.'); return; }

    var menu = lista.map(function (d, i) {
      return (i + 1) + '. ' + d._titulo + '  (' + new Date(d._ts).toLocaleDateString('es-MX') + ')';
    }).join('\n');

    var r = prompt('Tus documentos:\n\n' + menu + '\n\nEscribe el número para abrirlo.\nPara borrar uno, escribe por ejemplo  b2');
    if (!r) return;
    r = r.trim().toLowerCase();

    if (r[0] === 'b') {
      var bi = parseInt(r.slice(1), 10) - 1;
      if (lista[bi]) {
        lista.splice(bi, 1);
        localStorage.setItem(LS_DOCS, JSON.stringify(lista));
        aviso('Documento borrado');
      }
      return;
    }

    var i = parseInt(r, 10) - 1;
    if (!lista[i]) return;
    estado = lista[i];
    if (!estado.items || !estado.items.length) estado.items = [{ desc: '', detalle: '', cant: 1, precio: 0 }];
    recargarFormulario();
  }

  function nuevo() {
    if (!confirm('¿Empezar un documento nuevo? Se pierde lo que no hayas guardado.')) return;
    var emisorNombre = estado.emisorNombre, emisorDatos = estado.emisorDatos;
    var logo = estado.logo, color = estado.color;
    var folio = siguienteFolio(estado.folio);
    estado = {
      tipo: 'COTIZACIÓN', folio: folio, fecha: hoy(), vigencia: enDias(15),
      emisorNombre: emisorNombre, emisorDatos: emisorDatos,
      clienteNombre: '', clienteDatos: '',
      moneda: estado.moneda, impNombre: estado.impNombre, impTasa: estado.impTasa,
      descuento: 0, retencion: 0, condiciones: estado.condiciones, notas: '',
      color: color, logo: logo,
      items: [{ desc: '', detalle: '', cant: 1, precio: 0 }],
    };
    recargarFormulario();
  }

  function siguienteFolio(folio) {
    if (!folio) return 'COT-001';
    return folio.replace(/(\d+)(?!.*\d)/, function (m) {
      return String(+m + 1).padStart(m.length, '0');
    });
  }

  function recargarFormulario() {
    Object.keys(estado).forEach(function (k) {
      var el = $(k);
      if (el && k !== 'items' && k !== 'logo') el.value = estado[k];
    });
    pintarItems();
    render();
    autoguardar();
  }

  /* ---------------- arranque ---------------- */

  async function iniciar() {
    try {
      var guardado = JSON.parse(localStorage.getItem(LS_ACTUAL) || 'null');
      if (guardado && guardado.items) estado = Object.assign(estado, guardado);
    } catch (e) {}

    if (window.Licencia) await window.Licencia.autoActivarDesdeUrl();

    enlazar();
    pintarItems();
    aplicarPro();
    render();

    window.addEventListener('beforeunload', autoguardar);
    setInterval(autoguardar, 15000);
  }

  iniciar();
})();
