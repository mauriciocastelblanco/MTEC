-- Seed initial servicio. ON CONFLICT (slug) DO NOTHING makes it re-runnable.
INSERT INTO servicios (
  slug, titulo, categoria, eyebrow, lead, estado,
  hero, solucion, consideraciones, geometrias, certificacion, galeria, cta
) VALUES (
  'encintado-de-lineas',
  'Encintado de Líneas',
  'servicios-especializados',
  'Servicio Especializado · Operación',
  'Sistema de matriz compuesta basado en fibra de carbono que rehabilita y restablece la capacidad MAOP original de tubos y tuberías con daños, corrosión o erosión — sin necesidad de detener el flujo.',
  'publicado',
  '{
    "imagen": "../brand_assets/site_pictures/servicios_especializados.png",
    "productCallout": {
      "textoSuperior": "Tecnología aplicada",
      "nombreProducto": "Iridium Wrap",
      "textoInferior": "AKKAIM INTEGRITY",
      "imagen": ""
    }
  }'::jsonb,
  '{
    "titulo": "La solución",
    "descripcion": "Matriz compuesta de fibra de carbono curada en sitio que restituye la capacidad estructural de la tubería sin paro de operación.",
    "metricaClave": { "valor": "MAOP", "label": "original" },
    "beneficios": [
      { "icono": "shield", "label": "Sin detener el flujo", "chip": "En operación" },
      { "icono": "check", "label": "Restituye MAOP original", "chip": "Estructural" },
      { "icono": "gauge", "label": "Resistente a altas presiones", "chip": "Hasta 1500 psi" },
      { "icono": "layers", "label": "Múltiples capas compuestas", "chip": "Diseño a medida" },
      { "icono": "thermometer", "label": "Tolerante a temperatura", "chip": "-29 a 149°C" },
      { "icono": "clock", "label": "Vida útil extendida", "chip": "20+ años" }
    ]
  }'::jsonb,
  '{
    "titulo": "Consideraciones técnicas",
    "lead": "Variables que evaluamos en la ingeniería previa para diseñar el encintado correcto.",
    "items": [
      { "titulo": "Tipo de daño", "descripcion": "Corrosión externa, mecánica, abolladuras, fisuras longitudinales o erosión interna." },
      { "titulo": "Geometría de la tubería", "descripcion": "Rectos, codos, tees, reducciones, bridas y conexiones especiales." },
      { "titulo": "Presión de operación", "descripcion": "MAOP, presión de prueba hidrostática y régimen de operación." },
      { "titulo": "Temperatura", "descripcion": "Temperatura del fluido y exposición ambiental." },
      { "titulo": "Producto transportado", "descripcion": "Compatibilidad química con la matriz seleccionada." },
      { "titulo": "Normativa aplicable", "descripcion": "ASME PCC-2, ISO 24817, API 570 según industria y jurisdicción." }
    ]
  }'::jsonb,
  '{
    "titulo": "Geometrías aplicables",
    "descripcion": "El sistema se adapta a múltiples configuraciones de tubería y accesorios.",
    "items": [
      { "nombre": "Tubería recta", "icono": "pipe" },
      { "nombre": "Codos", "icono": "elbow" },
      { "nombre": "Tees", "icono": "tee" },
      { "nombre": "Reducciones", "icono": "reducer" },
      { "nombre": "Bridas", "icono": "flange" },
      { "nombre": "Defectos circunferenciales", "icono": "circumferential" },
      { "nombre": "Defectos longitudinales", "icono": "longitudinal" },
      { "nombre": "Superficies irregulares", "icono": "irregular" }
    ]
  }'::jsonb,
  '{
    "badges": [{"nombre":"API"},{"nombre":"ASME"},{"nombre":"ISO"}],
    "normas": [
      { "texto": "ASME PCC-2 Art. 4.1" },
      { "texto": "ISO 24817 Clase 1, 2 y 3" },
      { "texto": "API 570" },
      { "texto": "API 1160" }
    ],
    "fichaTecnicaPdf": { "nombre": "IridiumWrap - TDS (Spanish).pdf", "dataUrl": "../deliverables/fichas-tecnicas/IridiumWrap%20-%20TDS%20(Spanish).pdf" },
    "certificadosPdf": null
  }'::jsonb,
  '[]'::jsonb,
  '{
    "headline": "¿Tu activo necesita esta solución?",
    "botonTexto": "Agenda una reunión"
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
