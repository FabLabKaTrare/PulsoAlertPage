# PulsoAlert Web v0.5.1 — Etapa 1: compatibilidad de mediciones BLE

## Objetivo
Recuperar la conexión con el firmware v1.5.1 revisión A y conservar compatibilidad con v1.5.0, sin cambiar el diseño aprobado.

## Archivos modificados
- `bluetooth.js`: el decodificador `measurement(view)` acepta **exactamente 6 u 8 bytes**. Los bytes 0–5 se mantienen. En paquetes de 8 bytes lee `uint16` little-endian en offset 6 como milivoltios; `0` se interpreta como voltaje no disponible. En paquetes de 6 bytes el voltaje queda `null`. Los paquetes con otras longitudes siguen rechazándose.
- `app.js`: tarjeta de batería prioriza voltaje real (3 decimales) cuando existe. El porcentaje solo se muestra si el byte 3 está entre 0 y 100; `255` significa desconocido. Con solo porcentaje disponible, presenta porcentaje. Sin ninguno, presenta `--`. Nunca estima carga desde voltaje.
- `index.html`: actualiza versión de pie de página y añade `?v=0.5.1` a CSS/JS para evitar caché tras publicar. **No cambia la estructura del HTML**.
- `docs/PulsoAlert_Contrato_BLE_v1.1.md`: copia del contrato proporcionado para esta revisión.

## Archivos conservados sin modificaciones
`styles.css`, `assets/katrare-logo.png`. Se conserva el simulador y el selector de tema.

## Pruebas de aceptación manuales
1. Publicar en GitHub Pages y recargar con Ctrl+F5. Confirmar v0.5.1 en pie de página.
2. Verificar selector claro/oscuro y cuatro escenarios del simulador antes de conectar.
3. En Chrome/Edge con Bluetooth activado, pulsar Conectar BLE, seleccionar PulsoAlert. Debe mostrar Conectado sin el error de longitud.
4. Con firmware v1.5.1 y paquete de 8 bytes, verificar que 3920 mV aparece como `3.920 V`; porcentaje 255 debe indicar porcentaje sin calibrar.
5. Con firmware v1.5.0 y paquete de 6 bytes, verificar que no se rechaza la medición; se muestra porcentaje si es válido o `--` si no.
6. Desconectar y comprobar retorno a modo demostración.

## Alcance y estado
La lectura/escritura de configuración y la verificación de `CONFIG_STATUS` permanecen en el código v0.5.0 **sin modificaciones ni nueva validación**. La siguiente etapa debe revisarlas y probarlas con el firmware real. El contrato v1.1 define escritura secuencial, confirmación y relectura.

**Estado:** código preparado y sintaxis verificable; pruebas BLE físicas y visuales pendientes de ejecución por el usuario. Prototipo educativo, no dispositivo médico.
