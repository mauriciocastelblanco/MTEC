# Encabezados de sección editables, límites de caracteres y galería a 12

**Fecha:** 2026-07-28
**Estado:** aprobado

## Problema

Tres cosas sueltas en el sitio MTEC:

1. El enlace de LinkedIn del sitio apunta a `company/mtec/`, que no es el perfil de la
   empresa. El perfil real es `company/mtec-erres/`.
2. Los encabezados de las secciones de una página de servicio están quemados en el HTML,
   así que todos los servicios comparten los mismos títulos. No hay forma de adaptarlos
   por servicio desde el admin.
3. Nada limita el largo de los textos que se cargan desde el admin. Un texto largo
   desborda su contenedor u obliga a scrollear en la página pública, y no hay señal en el
   formulario de cuánto cabe.

Y un ajuste menor: la galería no tiene tope de fotos.

## Alcance

Fuera de alcance: el botón de eliminar servicio del admin, que ya existe y funciona
([admin-ui.js:52](../../../admin/assets/js/admin-ui.js)).

## 1. LinkedIn

`https://www.linkedin.com/company/mtec-erres/` en tres lugares:

| Archivo | Qué es |
|---|---|
| `partials/footer.html` (link del footer) | el enlace visible |
| `partials/footer.html` (`sameAs` del JSON-LD) | vincula la organización con su perfil para buscadores |
| `contacto.html` (botón de Redes Sociales) | hoy es `href="#"`, un enlace muerto |

## 2. Encabezados editables por servicio

Cada una de las cuatro secciones de la página de servicio gana **etiqueta + título +
bajada** editables desde su pestaña del admin.

| Sección | Etiqueta actual | Título actual | Bajada actual |
|---|---|---|---|
| Certificación | Certificación & Normativa | Cumple con estándares internacionales | quemada en el HTML |
| Consideraciones | Consideraciones | — (h2 nuevo) | ya editable |
| Geometrías | Geometrías Aplicables | — (h2 nuevo) | ya editable |
| Galería | Aplicaciones | Casos en terreno | — (nueva) |

### Almacenamiento

Columna nueva `secciones jsonb NOT NULL DEFAULT '{}'` en la tabla `servicios`:

```json
{
  "certificacion": { "tag": "…", "titulo": "…", "descripcion": "…" },
  "solucion":      { "tag": "…", "titulo": "…", "descripcion": "…" },
  "geometrias":    { "tag": "…", "titulo": "…", "descripcion": "…" },
  "galeria":       { "tag": "…", "titulo": "…", "descripcion": "…" }
}
```

Se eligió una columna nueva en vez de anidar dentro de los jsonb existentes porque
`galeria` es un **array** y no puede alojar sus propios encabezados.

Las bajadas de Consideraciones y Geometrías viven hoy en `solucion.descripcion` y
`geometrias.descripcion`. Se mudan a la columna nueva, con lectura de respaldo al lugar
viejo — el mismo patrón de compatibilidad que el código ya usa para `hero.imagenes` /
`hero.imagen` y `solucion.kpis` / `solucion.metricaClave`. No hay migración de datos.

### Regla de visibilidad

Decide qué muestra la página pública para cada campo:

- **Clave ausente** (servicio que nunca se guardó con esta versión) → se usa el texto por
  defecto que hoy está quemado en el HTML. Los servicios ya publicados no cambian de
  aspecto solo por desplegar esto.
- **Clave presente con texto** → se muestra ese texto.
- **Clave presente y vacía** → el elemento no se muestra. Así se puede ocultar un
  encabezado a propósito.

En el admin los campos vienen precargados con los textos por defecto, como guía editable.

## 3. Límites de caracteres

Tope duro (`maxlength`) más un contador vivo. Los valores se midieron en el navegador
llenando cada campo hasta su tope y observando el resultado, no estimando desde el CSS.
El contenido real del servicio Encintado de Líneas quedó holgado en todos los casos.

### Hero

| Campo | Límite | Actual | Razón |
|---|---|---|---|
| Título | 48 | 19 | ~22 caracteres por línea a 64px condensado → 2 líneas |
| Eyebrow | 60 | 34 | una línea a 11px con `letter-spacing: 0.28em` |
| Descripción del servicio | 650 | 512 | ver abajo |

La medición corrigió el primer valor propuesto (400), que era **más corto que el contenido
que el sitio ya publica**. La altura del hero no la manda el texto sino la tarjeta de
imagen (579px a 1440px de ancho): entre 350 y 650 caracteres el hero mide lo mismo, 857px.
A 700 el texto empieza a estirarlo y a 800 se sale del pliegue. **650 es el punto exacto
donde el texto alcanza la altura de la imagen**, y deja 138 caracteres de holgura sobre lo
que hay hoy.

Salvedad: a 1366×768 y 1280×800 el hero no entra en el pliegue con ningún largo de texto,
porque la tarjeta de imagen sola ya excede el espacio disponible. Es una característica
previa del layout, no algo que un límite de caracteres pueda resolver.

### Encabezados de sección

| Campo | Límite | Razón |
|---|---|---|
| Etiqueta | 40 | una línea a 10px con `letter-spacing: 0.25em` |
| Título | 60 | el h2 tiene `max-width: 24ch` → 3 líneas |
| Bajada | 360 | `max-width: 60ch` → ~7 líneas |

### Ítems de repeater

| Campo | Límite | Actual | Razón |
|---|---|---|---|
| KPI · valor | 8 | — | a 10 desbordaba la tarjeta cuando la columna se estrecha |
| KPI · etiqueta | 20 | — | 10,5px con `letter-spacing: 0.16em`, 2 líneas dentro de la tarjeta |
| Consideración · label | 90 | 76 | columna de ~350px a 14px → 2 líneas |
| Consideración · chip | 15 | 15 | ver abajo |
| Geometría · nombre | 32 | 26 | tarjeta de ~176px a 12px mayúsculas |
| Estándar · nombre | 8 | — | baldosa de 110×110px; a 10 el texto queda pegado a los bordes |
| Norma · texto | 40 | 24 | tarjeta de 160px de ancho fijo a 11px → 2 líneas |
| Caption de galería | 40 | — | 10px mayúsculas sobre la foto, una línea |

El chip es `white-space: nowrap` dentro de una grilla `1fr 1fr`, así que arrastra el reparto
de columnas: a 15 caracteres las deja en 493/587, a 18 en 454/626. El tope de 15 es el
máximo que el contenido actual ya usa, así que fija el desbalance donde está hoy en vez de
permitir que empeore.

### Comportamiento del contador

Reutiliza los tokens que el admin ya define, sin colores nuevos:

- Bajo el 70% del límite: invisible. El formulario se ve igual que hoy.
- Del 70% al 89%: aparece en `--plomo`.
- Del 90% al 100%: `--amber-text`.
- Sobre el límite: `#FCA5A5`, el mismo rojo de `.field-error`.

Se ubica a la derecha de la etiqueta del campo, con cifras tabulares para que no salte
mientras se escribe.

En la descripción del servicio el editor es Trix (texto rico), donde `maxlength` no aplica.
El conteo va sobre el texto plano, así que negritas y enlaces no gastan cupo, y el editor
bloquea la inserción que exceda el tope.

Contenido existente que exceda un límite nuevo **no se trunca**: el contador se muestra en
rojo hasta que se edite.

## 4. Galería a 12 fotos

Tope duro de 12 en el botón de agregar imagen, con la misma mecánica `data-max` que ya
limita el hero a 4. Con 12 el carrusel público queda en cuatro páginas de tres fotos
exactas — 10 dejaba la última página con una sola foto y dos huecos.

## Verificación

Servidor local y capturas de la página pública con cada campo en su límite, para confirmar
que nada se desborda ni obliga a scrollear. Dos rondas de comparación.

## Despliegue

La carpeta `supabase/` está excluida del deploy de cPanel, así que la migración se corre a
mano en el SQL Editor de Supabase **antes** de desplegar el código.
