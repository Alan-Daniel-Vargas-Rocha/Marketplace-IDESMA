# Marketplace IDESMA

## Cómo correr el programa

Primero abran Docker Desktop* y esperen a que esté listo. Luego abran dos ventanas de PowerShell, una para el backend y otra para el frontend. Los comandos de abajo suponen que guardaron el proyecto en `Marketplace-IDESMA` dentro de su carpeta de usuario. Si lo tienen en otro lado, cambien la ruta de `Set-Location`.

**Si es la primera vez que lo corren** baje al renglon 105 y haga ese paso primero.

### 1. Activar el backend

En la primera ventana pongan este código. Aquí levantamos Laravel para que la tienda pueda consultar los productos, iniciar sesión y guardar los pedidos.

```powershell

Set-Location "$env:USERPROFILE\Marketplace-IDESMA\backend"
docker run --rm --name marketplace-idesma -p 127.0.0.1:8000:8000 --mount "type=bind,source=$($PWD.Path),target=/app" -w /app composer:2 php artisan serve --host=0.0.0.0 --port=8000

```

Cuando salga **Server running**, dejen esa ventana abierta. Si quieren checar que el backend responde, abran [la API de productos](http://localhost:8000/api/products).

### 2. Activar el frontend

En la segunda ventana pongan este código. Aquí levantamos la página de la tienda.

```powershell

Set-Location "$env:USERPROFILE\Marketplace-IDESMA\frontend"
docker run --rm --name idesma-frontend -p 127.0.0.1:5173:5173 --mount "type=bind,source=$($PWD.Path),target=/app,readonly" -w /app composer:2 php -S 0.0.0.0:5173

```

Ya con los dos corriendo, abran [la tienda](http://localhost:5173/) en el navegador. Dejen las dos ventanas abiertas mientras estén usando el programa.

**Una cosa.** Si Docker dice que el nombre ya está en uso, pongan `docker ps`. Si ven `marketplace-idesma` o `idesma-frontend` con estado `Up`, ese servidor ya está corriendo.

## Modos de la tienda

A continuación tenemos los modos que salen según la cuenta con la que entren.

### Comprador

Aquí se queda la tienda normal, en color salmon. Pueden buscar productos, abrir su detalle y agregarlos al carrito. El circulito del carrito marca cuántas unidades llevan. Cuando confirmen el pedido, lo pueden checar en **Mis pedidos**.

**Nota.** El pedido queda como **Pendiente de pago**. En esta versión se registra el pedido y se descuenta el stock.

### Vendedor

Si entran como vendedor, la página cambia a un panel verde donde salen sus artículos y sus pedidos. Desde Publicar producto* pueden agregar más artículos, y desde Mis productos pueden editar lo que ya publicaron.

En Pedidos recibidos pueden checar quién pidió su producto y cuántas unidades pidió. En el panel también salen las unidades vendidas y las pendientes de pago. Las vendidas se cuentan cuando el pedido aparece como pagado.

### Modo dev

Para abrirlo, entren a [la tienda en modo dev](http://localhost:5173/?dev=1). Van a ver la barra de diferente color y el Centro de pruebas.

Desde Cuentas de prueba pueden crear un comprador y un vendedor, o agregar una cuenta que ya tengan. Si las dos cuentas ya iniciaron sesión en esa pestaña, pueden brincar entre ellas para vender desde una y comprar desde la otra.

Si entran como Administrador, en el Centro de pruebas salen los correos y roles registrados. También pueden abrir Productos y vendedores para ver quién publicó cada artículo y con qué correo. Si una cuenta todavía no inició sesión en esa pestaña, se pide su contraseña al entrar.

A continuacion se muestra como crear una cuenta admin.

## Como crear una cuenta de administrador

Si descargaron el proyecto de GitHub, cada quien tiene su propia base de datos local. Para entrar como administrador, primero corran las migraciones y levanten el backend. Luego abran otra ventana de PowerShell y pongan este codigo:

```powershell
#aqui inicia

$crearAdmin = @'
$email = 'admin-'.strtolower(\Illuminate\Support\Str::random(8)).'@example.test';
$password = \Illuminate\Support\Str::random(24);

// ======== Aqui creamos la cuenta admin y guardamos su contraseña con hash.
$user = \App\Models\User::create([
    'name' => 'Administrador IDESMA',
    'email' => $email,
    'password' => \Illuminate\Support\Facades\Hash::make($password),
    'role' => 'admin',
]);

echo 'Correo: '.$user->email.PHP_EOL;
echo 'Contraseña: '.$password.PHP_EOL;
'@

docker exec marketplace-idesma php artisan tinker "--execute=$crearAdmin"

#aqui termina
```

Guarden el correo y la contraseña que salen en PowerShell. Luego entren a [la tienda en modo dev](http://localhost:5173/?dev=1) y usen esos datos en Iniciar sesion. Si todo salio bien, debe aparecer Administrador junto al nombre y se deben ver las opciones del Centro de pruebas.

Una cosa. La misma cuenta les sirve cada vez que entren mientras conserven su base de datos. Si vuelven a correr el codigo, se crea otro administrador.

Antes de subir los cambios, chequen con `git status --short` que `backend/.env` y `backend/database/database.sqlite` queden fuera del commit. En el README va el comando para crear la cuenta. El correo y la contraseña que les salieron se quedan con ustedes.

### Cómo probar el flujo completo

1. En modo dev, entren con una cuenta de vendedor y publiquen un artículo con stock.
2. Abran **Cuentas de prueba** y cambien a una cuenta de comprador.
3. Busquen el artículo, agréguenlo al carrito y confirmen el pedido.
4. Chequen que el pedido salga en **Mis pedidos**.
5. Brinquen otra vez a la cuenta de vendedor y abran **Pedidos recibidos**. Ahí debe salir quién lo pidió. También pueden revisar que el stock haya bajado.

## Si es la primera vez que lo corren

Si acaban de clonar el proyecto, preparen Laravel antes de activar el backend. Pongan esto en PowerShell con Docker Desktop abierto.

```powershell
#inicia aqui.

Set-Location "$env:USERPROFILE\Marketplace-IDESMA\backend"

if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path 'database\database.sqlite')) {
    New-Item -ItemType File 'database\database.sqlite' | Out-Null
}

$opcionesDocker = @(
    '--rm',
    '--mount', "type=bind,source=$($PWD.Path),target=/app",
    '-w', '/app'
)

docker run @opcionesDocker composer:2 composer install --ignore-platform-reqs --no-interaction --no-scripts
docker run @opcionesDocker composer:2 php artisan package:discover

if (Select-String -Path .env -Pattern '^APP_KEY=\s*$' -Quiet) {
    docker run @opcionesDocker composer:2 php artisan key:generate
}

docker run @opcionesDocker composer:2 php artisan migrate --force --quiet
docker run @opcionesDocker composer:2 php artisan tinker '--execute=app(\Database\Seeders\ElectronicsCategorySeeder::class)->run();'

#termina aqui.
```

Cuando termine, regresen a los pasos **Activar el backend** y **Activar el frontend**. La primera vez el catálogo puede estar vacío hasta que un vendedor publique un producto.

## Cómo detener el programa

Cuando terminen, presionen **Ctrl+C** en cada ventana donde levantaron los servidores. También pueden detenerlos desde otra ventana de PowerShell.

```powershell
#inicia
docker stop idesma-frontend marketplace-idesma
#trermina
```

## Dónde está cada cosa

- `backend/` tiene Laravel, la API, los servicios y las migraciones.
- `frontend/` tiene la página de la tienda en `index.html`.
