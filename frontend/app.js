import { crearCompras } from './comprador/compras.js';
import { crearVentas } from './vendedor/ventas.js';
import { crearPruebas } from './dev/pruebas.js';

// ======== Aqui conectamos la tienda con Laravel y mandamos el token cuando hace falta.
    const API = 'http://localhost:8000/api';
    const $ = s => document.querySelector(s);
    const dialogo = $('#dialogo');
    const contenido = $('#contenido');
    const claveToken = 'idesma.token';
    const modoPrueba = ['localhost', '127.0.0.1'].includes(location.hostname) &&
      new URLSearchParams(location.search).get('dev') === '1';

    // ======== Aqui se quedan las sesiones de prueba mientras esta abierta la pagina.
    document.body.classList.toggle('modo-dev', modoPrueba);
    // ======== Aqui recuperamos las cuentas de prueba cuando recargan la pagina.
    const claveCuentasPrueba = 'idesma.cuentasPrueba';
    const sesionesPrueba = new Map();

    if (modoPrueba) {
      try {
        const guardadas = JSON.parse(sessionStorage.getItem(claveCuentasPrueba) || '[]');
        if (Array.isArray(guardadas)) {
          for (const sesion of guardadas) {
            if (sesion?.user?.id != null && typeof sesion.token === 'string' && sesion.token) {
              sesionesPrueba.set(String(sesion.user.id), sesion);
            }
          }
        }
      } catch {
        sessionStorage.removeItem(claveCuentasPrueba);
      }
    }

    function guardarCuentasPrueba() {
      if (modoPrueba) {
        sessionStorage.setItem(claveCuentasPrueba, JSON.stringify([...sesionesPrueba.values()]));
      }
    }

    // ======== Aqui recordamos las cuentas aunque se cierre la pestaña.
    // ======== Nota, aqui solo van el nombre, correo y rol. Los tokens siguen por pestaña.
    const claveDirectorioPrueba = 'idesma.directorioPrueba';
    const directorioPrueba = new Map();

    if (modoPrueba) {
      try {
        const cuentas = JSON.parse(localStorage.getItem(claveDirectorioPrueba) || '[]');
        for (const user of Array.isArray(cuentas) ? cuentas : []) {
          if (user?.id != null && typeof user.email === 'string') {
            directorioPrueba.set(String(user.id), user);
          }
        }
      } catch {
        // Si no se puede leer la lista, empezamos con las sesiones de esta pestaña.
      }
      for (const { user } of sesionesPrueba.values()) recordarPerfilPrueba(user);
    }

    function guardarDirectorioPrueba() {
      try {
        localStorage.setItem(claveDirectorioPrueba, JSON.stringify([...directorioPrueba.values()]));
      } catch {
        // Todavia se puede usar el selector mientras la pagina siga abierta.
      }
    }

    function recordarPerfilPrueba({ id, name, email, role }) {
      directorioPrueba.set(String(id), { id, name, email, role });
      guardarDirectorioPrueba();
    }

    function recordarCuentasPrueba(id, sesion) {
      recordarPerfilPrueba(sesion.user);
      sesionesPrueba.set(String(id), sesion);
      guardarCuentasPrueba();
    }

    function olvidarCuentaPrueba(id) {
      sesionesPrueba.delete(String(id));
      guardarCuentasPrueba();
    }
    const nombresRol = {
      admin: 'Administrador',
      administrador: 'Administrador',
      vendedor: 'Vendedor',
      comprador: 'Comprador',
      ambos: 'Comprador y vendedor'
    };
    const nombreRol = cuenta => nombresRol[cuenta?.role] || cuenta?.role || 'Cuenta';
    let token = sessionStorage.getItem(claveToken) || '';
    let usuario = null;
    let categorias = [];
    let productos = [];
    let vista = 0;
    let ocupado = false;

    const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    const dinero = valor => moneda.format(Number(valor));
    const texto = valor => String(valor ?? '').replace(/[&<>"']/g, letra =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[letra]
    );
    const puedeComprar = () => ['comprador', 'ambos'].includes(usuario?.role);
    const puedeVender = () => ['vendedor', 'ambos'].includes(usuario?.role);
    const boton = (nombre, accion, clase = 'suave', id = '') =>
      `<button type="button" class="${clase}" data-accion="${accion}" data-id="${texto(id)}">${nombre}</button>`;

    async function api(ruta, { metodo = 'GET', datos, privada = false, credencial = token } = {}) {
      const headers = { Accept: 'application/json' };
      if (privada && credencial) headers.Authorization = `Bearer ${credencial}`;
      if (datos !== undefined) headers['Content-Type'] = 'application/json';

      let respuesta;
      try {
        respuesta = await fetch(`${API}${ruta}`, {
          method: metodo, headers,
          body: datos === undefined ? undefined : JSON.stringify(datos)
        });
      } catch {
        throw new Error('No pude conectar con Laravel. Checa que Docker siga sirviendo el puerto 8000.');
      }

      const resultado = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
      if (!respuesta.ok) {
        if (privada && respuesta.status === 401 && credencial === token) guardarSesion(null);
        const mensajes = Object.values(resultado?.errors ?? {}).flat();
        const error = new Error(mensajes.join(' ') || resultado?.message || `La API devolvió ${respuesta.status}.`);
        error.status = respuesta.status;
        throw error;
      }
      return resultado;
    }

    function estado(selector, mensaje = '', error = false) {
      const nodo = $(selector);
      nodo.textContent = mensaje;
      nodo.classList.toggle('error', error);
    }

    function guardarSesion(datos) {
      if (modoPrueba && !datos && usuario) olvidarCuentaPrueba(String(usuario.id));

      token = datos?.token || '';
      usuario = datos?.user || null;

      if (modoPrueba && usuario && token && ['comprador', 'vendedor', 'ambos'].includes(usuario.role)) {
        recordarCuentasPrueba(String(usuario.id), { user: usuario, token });
      }
      if (token) sessionStorage.setItem(claveToken, token);
      else sessionStorage.removeItem(claveToken);
      marcarCarrito();
      dibujarMenu();
      void cargarContador();
    }

    // ======== Aqui juntamos las unidades, aunque sean del mismo producto.
    let totalCarrito = 0;
    let versionContador = 0;

    function botonCarrito() {
      return `<button type="button" class="suave boton-carrito" data-accion="carrito">
        Carrito<span class="contador-carrito" aria-hidden="true" hidden></span>
      </button>`;
    }

    function dibujarContador() {
      const control = $('#navegacion .boton-carrito');
      if (!control) return;

      const circulo = control.querySelector('.contador-carrito');
      circulo.textContent = totalCarrito > 99 ? '99+' : String(totalCarrito);
      circulo.hidden = totalCarrito === 0;
      control.setAttribute('aria-label', `Carrito, ${totalCarrito} ${totalCarrito === 1 ? 'unidad' : 'unidades'}`);
    }

    function marcarCarrito(items = []) {
      versionContador += 1;
      totalCarrito = items.reduce((suma, item) => suma + (Number(item.quantity) || 0), 0);
      dibujarContador();
    }

    async function cargarContador() {
      if (!puedeComprar() || !token) return;
      const credencial = token;
      const version = versionContador;

      try {
        const { data } = await api('/cart', { privada: true, credencial });
        // ======== Nota, si cambiamos de cuenta no pintamos el carrito anterior.
        if (token === credencial && version === versionContador) marcarCarrito(data.items);
      } catch {
        // El carrito vuelve a consultar la API cuando se abre.
      }
    }

    function dibujarMenu() {
      void mostrarCentroDev();
      void mostrarVistaVendedor();
      const menu = usuario
        ? `<span class="cuenta-activa">${texto(usuario.name)}
             <span class="rol-activo" data-rol="${texto(usuario.role)}">${texto(nombreRol(usuario))}</span>
           </span>
           ${puedeComprar() ? botonCarrito() + boton('Mis pedidos', 'pedidos') : ''}
           ${puedeVender() ? boton('Publicar producto', 'publicar', '') +
              boton('Mis productos', 'vendedor') + boton('Pedidos recibidos', 'ventas') : ''}
           ${boton('Cerrar sesión', 'salir', 'claro')}`
        : boton('Iniciar sesión', 'login', 'claro') + boton('Crear cuenta', 'registro');

      $('#navegacion').innerHTML = menu +
        (modoPrueba ? boton('Cuentas de prueba', 'cuentas-prueba', 'claro') : '');
    }

    function abrir(titulo, html) {
      vista += 1;
      $('#dialogo-titulo').textContent = titulo;
      contenido.innerHTML = html;
      estado('#estado-dialogo');
      if (!dialogo.open) dialogo.showModal();
      return vista;
    }

    dialogo.addEventListener('close', () => { if (!dialogo.open) vista += 1; });

    async function panel(titulo, cargar) {
      const actual = abrir(titulo, '<p class="muted">Cargando…</p>');
      try {
        const html = await cargar();
        if (vista === actual && dialogo.open) contenido.innerHTML = html;
      } catch (error) {
        if (vista === actual && dialogo.open) {
          contenido.replaceChildren();
          estado('#estado-dialogo', error.message, true);
        }
      }
    }

    // ======== Acontinuacion tenemos el catalogo, la busqueda y el detalle del producto.
    function dibujarCatalogo() {
      const buscar = $('#buscar').value.trim().toLocaleLowerCase('es-MX');
      const categoria = $('#filtro').value;
      const visibles = productos.filter(producto =>
        (!categoria || String(producto.category_id) === categoria) &&
        [producto.name, producto.brand, producto.description].some(valor =>
          String(valor ?? '').toLocaleLowerCase('es-MX').includes(buscar)
        )
      );

      $('#productos').innerHTML = visibles.map(producto => `
        <article class="tarjeta">
          <p class="categoria">${texto(producto.category?.name || 'Electrónicos')}</p>
          <h3>${texto(producto.name)}</h3>
          <p class="precio">${dinero(producto.price)}</p>
          <p class="muted">${producto.stock > 0 && producto.status === 'activo' ? `${texto(producto.stock)} disponibles` : 'Agotado'}</p>
          <div class="acciones">${boton('Ver producto', 'detalle', 'suave', producto.id)}</div>
        </article>`).join('') || '<p class="vacio">No hay productos para esta búsqueda.</p>';
    }

    async function cargarCatalogo() {
      estado('#estado-catalogo', 'Cargando catálogo…');
      try {
        const [lista, grupos] = await Promise.all([api('/products'), api('/categories')]);
        productos = lista.data;
        categorias = grupos.data;
        const filtro = $('#filtro');
        const anterior = filtro.value;
        filtro.innerHTML = '<option value="">Todas</option>' + categorias.map(categoria =>
          `<option value="${texto(categoria.id)}">${texto(categoria.name)}</option>`).join('');
        if (categorias.some(c => String(c.id) === anterior)) filtro.value = anterior;
        dibujarCatalogo();
        estado('#estado-catalogo');
      } catch (error) {
        estado('#estado-catalogo', error.message, true);
      }
    }

    function detalle(id) {
      return panel('Detalle del producto', async () => {
        const { data: p } = await api(`/products/${id}`);
        const disponible = p.status === 'activo' && Number(p.stock) > 0;
        const compra = disponible
          ? puedeComprar()
            ? `<form class="pila" data-form="agregar" data-id="${texto(p.id)}">
                 <label>Cantidad <input name="quantity" type="number" min="1" max="${texto(p.stock)}" value="1" required></label>
                 <div><button>Agregar al carrito</button></div>
               </form>`
            : usuario ? '<p class="muted">Tu cuenta es de vendedor.</p>' : boton('Iniciar sesión para comprar', 'login')
          : '<p class="muted">Agotado.</p>';
        return `<h3>${texto(p.name)}</h3><p class="precio">${dinero(p.price)}</p>
                <p>${texto(p.description || 'Sin descripción.')}</p>
                <p class="muted">${texto(p.condition || 'Nuevo')} · Vende ${texto(p.seller?.name || 'IDESMA')}</p>${compra}`;
      });
    }

    function cuenta(registro, dePrueba = false) {
      abrir(registro ? 'Crear cuenta' : 'Iniciar sesión', `
        <form class="pila" data-form="${dePrueba ? 'registro-prueba' : registro ? 'registro' : 'login'}">
          ${registro ? '<label>Nombre <input name="name" required maxlength="255" autocomplete="name"></label>' : ''}
          <label>Correo <input name="email" type="email" required autocomplete="email"></label>
          <label>Contraseña <input name="password" type="password" required
            autocomplete="${registro ? 'new-password' : 'current-password'}" ${registro ? 'minlength="8"' : ''}></label>
          ${registro ? `<label>Tipo de cuenta <select name="role">
              <option value="comprador">Comprador</option>
              <option value="vendedor">Vendedor</option>
              <option value="ambos">Comprador y vendedor</option>
            </select></label>` : ''}
          <div><button>${registro ? 'Crear cuenta' : 'Entrar'}</button></div>
        </form>`);
    }

    // ======== Aqui tenemos lo del comprador. El stock se descuenta al confirmar.






    // ======== Aqui el vendedor publica y edita solo sus propios productos.


    async function editor(id) {
      let producto = {};
      if (id) {
        const { data } = await api('/seller/products', { privada: true });
        producto = data.find(p => String(p.id) === String(id));
        if (!producto) throw new Error('No encontré ese producto en tu cuenta.');
      }
      if (!categorias.length) categorias = (await api('/categories')).data;
      if (!categorias.length) throw new Error('Primero carga las categorías en Laravel.');

      const opciones = (lista, actual) => lista.map(([valor, nombre]) =>
        `<option value="${texto(valor)}" ${String(valor) === String(actual) ? 'selected' : ''}>${texto(nombre)}</option>`
      ).join('');

      abrir(id ? 'Editar producto' : 'Publicar producto', `
        <form class="campos" data-form="producto" data-id="${texto(id || '')}">
          <label class="amplio">Nombre <input name="name" required maxlength="255" value="${texto(producto.name)}"></label>
          <label>Precio antes de IVA <input name="price" type="number" min=".01" max="99999999.99" step=".01" required value="${texto(producto.price)}"></label>
          <label>Stock <input name="stock" type="number" min="0" max="2147483647" required value="${texto(producto.stock ?? 0)}"></label>
          <label>Categoría <select name="category_id">${opciones(categorias.map(c => [c.id, c.name]), producto.category_id)}</select></label>
          <label>Marca <input name="brand" maxlength="255" value="${texto(producto.brand)}"></label>
          <label>Condición <select name="condition">${opciones(['Nuevo', 'Usado', 'Reacondicionado'].map(c => [c, c]), producto.condition)}</select></label>
          <label>Garantía en meses <input name="warranty_months" type="number" min="0" max="2147483647" required value="${texto(producto.warranty_months ?? 0)}"></label>
          ${id ? `<label>Estado <select name="status">${opciones(['activo', 'pausado', 'agotado'].map(s => [s, s]), producto.status)}</select></label>` : ''}
          <label class="amplio">Descripción <textarea name="description" rows="4">${texto(producto.description)}</textarea></label>
          <div class="amplio"><button>${id ? 'Guardar cambios' : 'Publicar'}</button></div>
        </form>`);
    }

    // ======== Una cosa, si van a cambiar como se mandan los datos, pongan la fecha y que cambiaron.
    // ===AAAA-MM-DD=== Descripcion del cambio.
    // ======== Acontinuacion el vendedor puede ver quien pidio sus productos.


    // ======== Aqui podemos brincar entre las cuentas que si iniciaron sesion en esta pagina.
    // ======== Nota, esto usa el login normal y se activa solo en localhost con ?dev=1.
    function cuentasPrueba() {
      if (!modoPrueba) return;

      const lista = [...directorioPrueba.values()].map(perfil => {
        const sesion = sesionesPrueba.get(String(perfil.id));
        const user = sesion?.user || perfil;
        const activa = String(user.id) === String(usuario?.id);
        return `<article class="fila">
          <h3>${texto(user.name)}</h3>
          <p class="muted">${texto(nombreRol(user))} · ${texto(user.email)}</p>
          <div class="acciones">
            ${activa ? '<span class="rol-activo">Cuenta activa</span>' :
              sesion ? boton('Cambiar a esta cuenta', 'cambiar-cuenta', 'suave', user.id) :
                boton('Iniciar sesión', 'entrar-cuenta-recordada', 'suave', user.id)}
            ${Number(user.is_demo) === 1
              ? boton('Eliminar cuenta', 'eliminar-cuenta-prueba', 'claro', user.id)
              : ''}
          </div>
        </article>`;
      }).join('');

      abrir('Cuentas de prueba', `
        <p>Inicia sesión o registra un comprador y un vendedor para cambiar entre ellos.</p>
        <div class="acciones">
          ${boton('Agregar cuenta existente', 'login', 'claro')}
          ${boton('Crear cuenta de prueba', 'registro-prueba')}
        </div>
        ${lista || '<p class="muted">Todavía no hay cuentas guardadas para la prueba.</p>'}`);
    }

    async function cambiarCuenta(id) {
      const sesion = modoPrueba && sesionesPrueba.get(String(id));
      if (!sesion) return;

      try {
        const user = await api('/user', { privada: true, credencial: sesion.token });
        guardarSesion({ user, token: sesion.token });
        dialogo.close();
        estado('#aviso', `Entraste como ${user.name} · ${nombreRol(user)}.`);
      } catch (error) {
        if (error.status !== 401) throw error;
        olvidarCuentaPrueba(String(id));
        cuentasPrueba();
        estado('#estado-dialogo', 'Esa sesión venció. Agrégala otra vez iniciando sesión.', true);
      }
    }

    // ======== Aqui usamos el token de esa misma cuenta de prueba para eliminarla.
    async function eliminarCuentaPrueba(id) {
      const sesion = modoPrueba && sesionesPrueba.get(String(id));
      if (!sesion || Number(sesion.user.is_demo) !== 1) return;

      if (!confirm(`¿Eliminar la cuenta de prueba de ${sesion.user.name}? Sus pedidos se conservarán.`)) return;

      await api('/dev/account', {
        metodo: 'DELETE', privada: true, credencial: sesion.token
      });

      olvidarCuentaPrueba(String(id));
      directorioPrueba.delete(String(id));
      guardarDirectorioPrueba();
      if (String(usuario?.id) === String(id)) guardarSesion(null);
      await cargarCatalogo();
      cuentasPrueba();
      estado('#estado-dialogo', 'Cuenta de prueba eliminada.');
    }

    // ======== Aqui cambiamos la vista segun el rol. El comprador sigue en la tienda normal.







    function esAdminCentroDev() {
      return ['admin', 'administrador'].includes(usuario?.role);
    }

    // ======== Acontinuacion mostramos las cuentas y sus numeros para la demo.


    // ======== Nota, solo brincamos directo si esa cuenta ya inicio sesion en esta pestaña.


    // ======== Aqui vemos los productos y el correo de la cuenta que los publico.


    const acciones = () => ({
      'dev-productos': productosCentroDev,
      'pagina-centro-dev': mostrarCentroDev,
      'entrar-desde-dev': entrarDesdeDev,
      'ver-tienda-vendedor': () => {
        if (!(puedeComprar() && puedeVender())) return;
        const catalogo = $('#catalogo');
        catalogo.hidden = false;
        catalogo.scrollIntoView({ block: 'start' });
      },
      'registro-prueba': () => { if (modoPrueba) cuenta(true, true); },
      'eliminar-cuenta-prueba': eliminarCuentaPrueba,
      ventas,
      'entrar-cuenta-recordada': id => {
        const perfil = modoPrueba && directorioPrueba.get(String(id));
        if (!perfil) return;
        cuenta(false);
        contenido.querySelector('input[name="email"]').value = perfil.email;
      },
      'cuentas-prueba': cuentasPrueba,
      'cambiar-cuenta': cambiarCuenta,
      cerrar: () => dialogo.close(),
      login: () => cuenta(false),
      registro: () => cuenta(true),
      detalle, carrito, pedidos, vendedor,
      'pedido-detalle': detallePedido,
      publicar: () => editor(),
      editar: editor,
      async quitar(id) {
        await api(`/cart/items/${id}`, { metodo: 'DELETE', privada: true });
        await carrito();
      },
      async salir() {
        await api('/auth/logout', { metodo: 'POST', privada: true });
        guardarSesion(null);
        if (dialogo.open) dialogo.close();
        estado('#aviso', 'Sesión cerrada.');
      }
    });

    async function enviar(formulario) {
      const datos = Object.fromEntries(new FormData(formulario));
      const id = formulario.dataset.id;
      const tipo = formulario.dataset.form;
      if (['login', 'registro', 'registro-prueba'].includes(tipo)) {
        const ruta = tipo === 'login' ? '/auth/login' :
          tipo === 'registro-prueba' ? '/dev/accounts' : '/auth/register';
        guardarSesion(await api(ruta, { metodo: 'POST', datos }));
        dialogo.close();
        estado('#aviso', `Hola, ${usuario.name}.`);
      } else if (tipo === 'agregar' || tipo === 'cantidad') {
        const cantidad = Number(datos.quantity);
        if (tipo === 'agregar') {
          await api('/cart/items', { metodo: 'POST', privada: true, datos: { product_id: Number(id), quantity: cantidad } });
        } else {
          await api(`/cart/items/${id}`, { metodo: 'PUT', privada: true, datos: { quantity: cantidad } });
        }
        await carrito();
      } else if (tipo === 'pedido') {
        const { data } = await api('/orders', { metodo: 'POST', privada: true, datos: {} });
        marcarCarrito();
        await cargarCatalogo();
        abrir('Pedido registrado', `<p>Pedido #${texto(data.id)} pendiente de pago.</p>
          <p class="precio">${dinero(data.total)}</p><div>${boton('Ver mis pedidos', 'pedidos')}</div>`);
      } else if (tipo === 'producto') {
        datos.stock = Number(datos.stock);
        datos.category_id = Number(datos.category_id);
        datos.warranty_months = Number(datos.warranty_months);
        await api(id ? `/products/${id}` : '/products', { metodo: id ? 'PUT' : 'POST', privada: true, datos });
        await cargarCatalogo();
        await vendedor();
        void mostrarVistaVendedor();
        estado('#estado-dialogo', id ? 'Cambios guardados.' : 'Producto publicado.');
      }
    }

    async function ejecutar(tarea, control) {
      if (ocupado) return;
      ocupado = true;
      if (control) control.disabled = true;
      estado(dialogo.open ? '#estado-dialogo' : '#aviso');
      try {
        await tarea();
      } catch (error) {
        estado(dialogo.open ? '#estado-dialogo' : '#aviso', error.message, true);
      } finally {
        ocupado = false;
        if (control) control.disabled = false;
      }
    }

    document.addEventListener('click', evento => {
      const control = evento.target.closest('button[data-accion]');
      if (!control) return;
      const accion = acciones()[control.dataset.accion];
      if (accion) ejecutar(() => accion(control.dataset.id), control);
    });

    dialogo.addEventListener('submit', evento => {
      const formulario = evento.target;
      if (!formulario.dataset.form) return;
      evento.preventDefault();
      ejecutar(() => enviar(formulario), evento.submitter);
    });

    const { carrito, pedidos, detallePedido } = crearCompras({
      api, panel, texto, dinero, boton,
      marcarCarrito: typeof marcarCarrito === 'function' ? marcarCarrito : () => {}
    });

    const { vendedor, ventas, mostrarVistaVendedor } = crearVentas({
      api, panel, texto, dinero, boton, $, puedeComprar, puedeVender,
      obtenerUsuario: () => usuario,
      dibujarInicioPorRol: typeof dibujarInicioPorRol === 'function' ? dibujarInicioPorRol : undefined
    });

    const { productosCentroDev, mostrarCentroDev, entrarDesdeDev } = crearPruebas({
      api, panel, texto, dinero, boton, $, modoPrueba, nombreRol,
      sesionesPrueba, abrir, cambiarCuenta, cuenta, contenido,
      esAdmin: typeof esAdmin === 'function' ? esAdmin : () => false,
      esAdminCentroDev: typeof esAdminCentroDev === 'function' ? esAdminCentroDev : () => false
    });

    $('#buscar').addEventListener('input', dibujarCatalogo);
    $('#filtro').addEventListener('change', dibujarCatalogo);
    dibujarMenu();
    cargarCatalogo();

    if (token) {
      const tokenInicial = token;
      api('/user', { privada: true, credencial: tokenInicial })
        .then(user => {
          if (token === tokenInicial) guardarSesion({ user, token: tokenInicial });
        })
        .catch(error => {
          if (!usuario) estado('#aviso', error.status === 401 ? 'Vuelve a iniciar sesión.' : error.message, true);
        });
    }
  