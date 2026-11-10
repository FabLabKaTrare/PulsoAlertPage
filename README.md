# PulsoAlert Web v0.5.7 — Kä Träre / FabLab UNED

Versión actual: **0.5.7**. Firmware de referencia probado: **1.5.3**.

## Novedades v0.5.7

- Biblioteca de cinco manuales (hardware, firmware y web).
- Lectura en navegador mediante HTML generado a partir de los Markdown originales, con tablas, código, índice y tema claro/oscuro.
- Acceso a PDF y descarga de Markdown sin cambios en la lógica de medición ni BLE.
- Visor estático que también funciona desde disco local (`file://`), sin bibliotecas CDN.

## Publicación

Extraer el ZIP y subir **todo su contenido** a la raíz de GitHub Pages. Abrir `index.html`. No omitir `manual-viewer.css`, `manual-viewer.js` ni las páginas HTML de `manuales/`.

## Versiones históricas

# PulsoAlert Web v0.5.5 — Kä Träre / FabLab UNED

Actualización incremental de la v0.5.4. Conserva la interfaz, el simulador, el selector claro/oscuro y la comunicación GATT v1.0/v1.1.

## Novedad

Avisos de batería basados exclusivamente en voltaje BLE real, sin estimar porcentaje: recargar pronto (≤3.60 V), batería muy baja (≤3.40 V) y crítica (≤3.20 V). Valores orientativos para LiPo 1S; requieren validación física. El voltaje se sigue mostrando con tres decimales. Los avisos utilizan mediana de las últimas cinco muestras, confirmación por tres muestras filtradas consecutivas e histéresis de 80 mV al recuperarse. La interfaz no apaga el ESP32-C3.

En modo demostración no se generan advertencias de batería real. Tras desconexión se limpian los datos y el historial de alertas. Para GATT v1.0 (6 bytes) sin voltaje, se conserva la visualización previa sin advertencias basadas en voltaje.

## Instalación

Subir el contenido de este ZIP a la raíz del repositorio GitHub Pages `PulsoAlertPage`. Recargar la página sin caché. No requiere cambios de firmware ni del contrato GATT.

## Estado

Sintaxis JavaScript y ZIP comprobados localmente; pruebas con ESP32-C3 pendientes. Es un prototipo educativo, no un sistema de protección de batería ni un dispositivo médico. La placa de protección de la LiPo debe verificarse por separado.


## v0.5.6 — Simulador de batería
Se agregan cuatro escenarios de batería independientes de los de frecuencia cardíaca. Solo se habilitan sin conexión BLE; no modifican el firmware. Los valores son ficticios: 3.920, 3.520, 3.320 y 3.100 V.
