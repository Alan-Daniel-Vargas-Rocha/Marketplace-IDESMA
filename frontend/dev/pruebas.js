export function crearPruebas({
    api, panel, texto, dinero, boton, $, modoPrueba, nombreRol,
    sesionesPrueba, abrir, cambiarCuenta, cuenta, contenido,
    esAdmin, esAdminCentroDev
}) {
    function productosCentroDev(pagina = '1') {
      if (!modoPrueba || !esAdminCentroDev()) return;
      const numero = Math.max(1, Number.parseInt(pagina, 10) || 1);

      return panel('Productos y vendedores', async () => {
        const resultado = await api(`/dev/products?page=${numero}`, { privada: true });

        const filas = resultado.data.map(producto => `
          <article class="fila">
            <h3>${texto(producto.name)}</h3>
            <p>Publicado por <strong>${texto(producto.seller_name || 'Sin vendedor')}</strong></p>
            <p class="muted" style="overflow-wrap:anywhere">${texto(producto.seller_email || 'Sin correo disponible')}</p>
            <p>${dinero(producto.price)} · Stock ${texto(producto.stock)} · ${texto(producto.status)}</p>
          </article>
        `).join('') || '<p>No hay productos publicados.</p>';

        return filas + `<div class="acciones">
          ${numero > 1 ? boton('Anterior', 'dev-productos', 'claro', numero - 1) : ''}
          ${resultado.next_page_url ? boton('Siguiente', 'dev-productos', 'claro', numero + 1) : ''}
        </div>`;
      });
    }

    let revisionCentroDev = 0;

    let cuentasCentroDev = new Map();

    async function mostrarCentroDev(pagina = 1) {
      const revision = ++revisionCentroDev;
      const centro = $('#centro-dev');
      cuentasCentroDev = new Map();
      centro.hidden = !modoPrueba;
      if (!modoPrueba) {
        centro.replaceChildren();
        return;
      }

      centro.innerHTML = `
        <h1 id="titulo-centro-dev">Centro de pruebas</h1>
        <div class="acciones">
          ${boton('Cuentas de prueba', 'cuentas-prueba', 'claro')}
          ${esAdminCentroDev() ? boton('Productos y vendedores', 'dev-productos') : ''}
        </div>
        <div id="datos-centro-dev" class="pila"></div>`;

      const datos = $('#datos-centro-dev');
      if (!esAdminCentroDev()) {
        datos.innerHTML = '<p class="muted">Entra como administrador para consultar los correos registrados.</p>';
        return;
      }

      const numero = Math.max(1, Number.parseInt(pagina, 10) || 1);
      datos.innerHTML = '<p role="status">Cargando cuentas…</p>';

      try {
        const { totals, accounts } = await api(`/dev/overview?page=${numero}`, { privada: true });
        if (revision !== revisionCentroDev) return;

        cuentasCentroDev = new Map(accounts.data.map(cuenta => [String(cuenta.id), cuenta]));

        datos.innerHTML = `
          <div class="rejilla">
            <article class="tarjeta"><h3>Correos registrados</h3><p class="precio">${texto(accounts.total)}</p></article>
            <article class="tarjeta"><h3>Compradores</h3><p class="precio">${texto(totals.comprador)}</p></article>
            <article class="tarjeta"><h3>Vendedores</h3><p class="precio">${texto(totals.vendedor)}</p></article>
            <article class="tarjeta"><h3>Ambos roles</h3><p class="precio">${texto(totals.ambos)}</p></article>
          </div>
          <h2>Cuentas registradas</h2>
          ${accounts.data.map(cuenta => `
            <article class="fila">
              <h3>${texto(cuenta.name)}</h3>
              <p class="muted correo-dev">${texto(cuenta.email)}</p>
              <p>${texto(nombreRol(cuenta))}${Number(cuenta.is_demo) === 1 ? ' · Cuenta de prueba' : ''}</p>
              <div>${boton(
                sesionesPrueba.has(String(cuenta.id)) ? 'Cambiar a esta cuenta' : 'Entrar con esta cuenta',
                'entrar-desde-dev', 'claro', cuenta.id
              )}</div>
            </article>`).join('') || '<p>No hay cuentas registradas.</p>'}
          <div class="acciones">
            ${numero > 1 ? boton('Anterior', 'pagina-centro-dev', 'claro', numero - 1) : ''}
            ${accounts.next_page_url ? boton('Siguiente', 'pagina-centro-dev', 'claro', numero + 1) : ''}
          </div>`;
      } catch (error) {
        if (revision === revisionCentroDev) datos.textContent = error.message;
      }
    }

    async function entrarDesdeDev(id) {
      if (!modoPrueba || !esAdminCentroDev()) return;
      const perfil = cuentasCentroDev.get(String(id));
      if (!perfil) return;

      if (sesionesPrueba.has(String(id))) {
        abrir('Cambiar de cuenta', '<p>Comprobando la sesión…</p>');
        await cambiarCuenta(id);
        return;
      }

      cuenta(false);
      const correo = contenido.querySelector('input[name="email"]');
      correo.value = perfil.email;
      contenido.querySelector('input[name="password"]').focus();
    }
    return { productosCentroDev, mostrarCentroDev, entrarDesdeDev };
}
