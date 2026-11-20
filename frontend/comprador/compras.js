export function crearCompras({ api, panel, texto, dinero, boton, marcarCarrito }) {
    function carrito() {
      return panel('Tu carrito', async () => {
        const { data } = await api('/cart', { privada: true });
        marcarCarrito(data.items);
        if (!data.items.length) return '<p>Tu carrito está vacío.</p>';

        return data.items.map(item => `
          <article class="fila">
            <h3>${texto(item.product?.name || 'Producto')}</h3>
            <p>${dinero(item.product?.price)} por unidad antes de IVA</p>
            <form data-form="cantidad" data-id="${texto(item.product_id)}">
              <label>Cantidad <input name="quantity" type="number" min="1" value="${texto(item.quantity)}" required></label>
              <button class="suave">Actualizar</button>
              ${boton('Quitar', 'quitar', 'claro', item.product_id)}
            </form>
          </article>`).join('') + `
          <form data-form="pedido">
            <p class="muted">El pedido quedará pendiente de pago.</p>
            <button>Confirmar pedido</button>
          </form>`;
      });
    }

    function pedidos() {
      return panel('Mis pedidos', async () => {
        const resultado = await api('/orders', { privada: true });
        return resultado.data.map(pedido => `
          <article class="fila">
            <h3>Pedido #${texto(pedido.id)}</h3>
            <p>${dinero(pedido.total)} · ${texto(pedido.status === 'pending' ? 'Pendiente de pago' : pedido.status)}</p>
            <div>${boton('Ver pedido', 'pedido-detalle', 'suave', pedido.id)}</div>
          </article>`).join('') || '<p>Todavía no tienes pedidos.</p>';
      });
    }

    function detallePedido(id) {
      return panel(`Pedido #${id}`, async () => {
        const { data } = await api(`/orders/${id}`, { privada: true });
        return `${data.items.map(item => `
          <article class="fila">
            <h3>${texto(item.product?.name || 'Producto')}</h3>
            <p>${texto(item.quantity)} × ${dinero(item.unit_price)}</p>
          </article>`).join('')}
          <p>Subtotal ${dinero(data.subtotal)} · IVA ${dinero(data.tax)}</p>
          <p class="precio">Total ${dinero(data.total)}</p>
          <div>${boton('Volver a mis pedidos', 'pedidos')}</div>`;
      });
    }
    return { carrito, pedidos, detallePedido };
}
