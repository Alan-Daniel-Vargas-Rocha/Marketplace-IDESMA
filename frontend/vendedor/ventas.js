export function crearVentas({
    api, panel, texto, dinero, boton, $, puedeComprar, puedeVender,
    obtenerUsuario, dibujarInicioPorRol
}) {
    function vendedor() {
      return panel('Mis productos', async () => {
        const { data } = await api('/seller/products', { privada: true });
        return `<div>${boton('Publicar producto', 'publicar')}</div>` +
          (data.map(p => `<article class="fila">
            <h3>${texto(p.name)}</h3>
            <p>${dinero(p.price)} · Stock ${texto(p.stock)} · ${texto(p.status)}</p>
            <div>${boton('Editar', 'editar', 'claro', p.id)}</div>
          </article>`).join('') || '<p>Todavía no has publicado productos.</p>');
      });
    }

    function ventas(pagina = '1') {
      const numero = Math.max(1, Number.parseInt(pagina, 10) || 1);

      return panel('Pedidos recibidos', async () => {
        const resultado = await api(`/seller/orders?page=${numero}`, { privada: true });
        const estadoPedido = { pending: 'Pendiente de pago', paid: 'Pagado', cancelled: 'Cancelado' };

        const filas = resultado.data.map(item => {
          const fecha = item.ordered_at ? new Date(item.ordered_at).toLocaleString('es-MX') : '';
          return `<article class="fila">
            <h3>${texto(item.product_name || 'Producto')}</h3>
            <p>Comprador: <strong>${texto(item.buyer_name || 'Sin nombre')}</strong></p>
            <p>${texto(item.quantity)} × ${dinero(item.unit_price)}</p>
            <p class="muted">Pedido #${texto(item.order_id)} · ${texto(estadoPedido[item.status] || item.status || 'Sin estado')}</p>
            ${fecha ? `<p class="muted">${texto(fecha)}</p>` : ''}
          </article>`;
        }).join('') || '<p>Todavía no hay pedidos en esta página.</p>';

        const paginacion = `<div class="acciones">
          ${numero > 1 ? boton('Anterior', 'ventas', 'claro', numero - 1) : ''}
          ${resultado.next_page_url ? boton('Siguiente', 'ventas', 'claro', numero + 1) : ''}
        </div>`;

        return filas + paginacion;
      });
    }

    let cargaVistaVendedor = 0;

    async function mostrarVistaVendedor() {
      const carga = ++cargaVistaVendedor;
      const vista = $('#vista-vendedor');
      const inicioAnterior = $('#inicio-rol');
      const administra = ['admin', 'administrador'].includes(obtenerUsuario()?.role);
      const vende = puedeVender();

      document.body.classList.toggle('vendiendo', vende);
      vista.hidden = !vende;

      if (administra && typeof dibujarInicioPorRol === 'function') {
        void dibujarInicioPorRol();
        return;
      }

      $('.portada').hidden = vende;
      $('#catalogo').hidden = vende;
      if (inicioAnterior) inicioAnterior.hidden = true;

      if (!vende) {
        vista.replaceChildren();
        return;
      }

      vista.innerHTML = `
        <h1>Panel del vendedor</h1>
        <div class="acciones">
          ${boton('Publicar producto', 'publicar', '')}
          ${boton('Mis productos', 'vendedor', 'claro')}
          ${boton('Pedidos recibidos', 'ventas', 'claro')}
          ${puedeComprar() ? boton('Abrir tienda', 'ver-tienda-vendedor', 'claro') : ''}
        </div>
        <div id="datos-vendedor" class="pila" role="region" aria-label="Actividad del vendedor">
          <p role="status">Cargando tu actividad…</p>
        </div>`;

      try {
        // ======== Aqui traemos solo los articulos y pedidos de esta cuenta.
        const [productosPropios, pedidos, resumen] = await Promise.all([
          api('/seller/products', { privada: true }),
          api('/seller/orders', { privada: true }),
          api('/seller/summary', { privada: true })
        ]);
        if (carga !== cargaVistaVendedor) return;

        const estados = {
          paid: 'Pagado',
          pending: 'Pendiente de pago',
          cancelled: 'Cancelado'
        };

        $('#datos-vendedor').innerHTML = `
          <div class="rejilla">
            <article class="tarjeta tarjeta-ventas">
              <h3>Unidades vendidas</h3><p class="precio">${texto(resumen.data.sold_units)}</p>
            </article>
            <article class="tarjeta">
              <h3>Unidades pendientes de pago</h3><p class="precio">${texto(resumen.data.pending_units)}</p>
            </article>
            <article class="tarjeta">
              <h3>Mis artículos</h3><p class="precio">${productosPropios.data.length}</p>
            </article>
          </div>
          <h2>Mis artículos recientes</h2>
          <div class="rejilla">${productosPropios.data.slice(0, 6).map(p => `
            <article class="tarjeta">
              <h3>${texto(p.name)}</h3>
              <p>${dinero(p.price)} · Stock ${texto(p.stock)}</p>
              <div>${boton('Editar', 'editar', 'claro', p.id)}</div>
            </article>`).join('') || '<p>Todavía no has publicado artículos.</p>'}</div>
          <h2>Pedidos recientes</h2>
          ${pedidos.data.slice(0, 5).map(item => `
            <article class="fila">
              <h3>${texto(item.product_name)}</h3>
              <p>${texto(item.buyer_name || 'Comprador')} · ${texto(item.quantity)} unidades</p>
              <p class="muted">Pedido #${texto(item.order_id)} · ${texto(estados[item.status] || item.status)}</p>
            </article>`).join('') || '<p>Todavía no te han pedido artículos.</p>'}`;
      } catch (error) {
        if (carga === cargaVistaVendedor) {
          $('#datos-vendedor').textContent = error.message;
        }
      }
    }
    return { vendedor, ventas, mostrarVistaVendedor };
}
