# AleaHome Catalogo

Catalogo web estatico de productos con filtro por marca/linea y tarjetas de producto.

## Estructura

- `index.html`: entrada principal.
- `js/main.js`: logica de UI/filtros/render.
- `js/config`: configuracion de menu/catalogo.
- `js/ui`: componentes de interfaz.
- `js/utils`: utilidades.
- `styles`: estilos por capa.
- `data/products.js`: dataset de productos (modulo ES).
- `data/productos.csv`: fuente tabular del catalogo.
- `productos/`: imagenes de productos.
- `scripts/validate-products.ps1`: validaciones de integridad.

## Levantar en local

```powershell
python -m http.server 4400
```

Abrir `http://localhost:4400/`.

## Validar datos

```powershell
powershell -ExecutionPolicy Bypass -File scripts\validate-products.ps1
```

El script reporta:

- productos invalidos
- imagenes faltantes
- slugs duplicados
- combinaciones `brand/line` fuera de configuracion

