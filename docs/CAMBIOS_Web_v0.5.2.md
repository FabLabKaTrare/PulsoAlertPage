# PulsoAlert Web v0.5.2 — Registro técnico de cambios

## Base y alcance
- Base: PulsoAlert Web v0.5.1, con GATT v1.0 (6 bytes) y v1.1 (8 bytes).
- Firmware de referencia: PulsoAlert v1.5.1 revisión A.
- Cambios limitados a `app.js`, `bluetooth.js`, versión de scripts y pie en `index.html`, y documentación.
- `styles.css` y `assets/katrare-logo.png` se conservan **sin cambios**.

## app.js — interfaz
1. `connectionBusy` impide iniciar conexiones simultáneas; `settingsBusy` impide desconectar durante la escritura de configuración iniciada por la web.
2. `connectionEverEstablished` diferencia una demostración inicial de una sesión real que terminó. Tras la primera conexión, los botones del simulador no sustituyen mediciones reales o desconectadas.
3. `renderConnection(state)` maneja los estados `demo`, `connecting`, `connected`, `disconnected`. No altera la estructura ni CSS institucional. Durante conexión/desconexión borra BPM, voltaje, contacto y alerta, evitando presentar datos caducados.
4. `setConnection(connected)` atiende eventos BLE. La reconexión se inicia **solo** con un nuevo clic del usuario; Web Bluetooth puede solicitar selección/permisos nuevamente.
5. Al conectar se leen `BPM_THRESHOLD`, `VIBRATION_CYCLES` y `LED_DURATION` y se reflejan en controles y mensaje de configuración.
6. Tras aplicar, se informa `CONFIG_STATUS=1` y los valores confirmados mediante relectura. En error parcial se indican los parámetros confirmados y se intenta releer el estado actual.
7. `index.html` incorpora `?v=0.5.2` en scripts para reducir problemas de caché de GitHub Pages.

## bluetooth.js — cliente GATT
1. `connectionGeneration` se incrementa al desconectar para invalidar una verificación de escritura que sigue pendiente.
2. `applySettings` revisa conexión y generación antes y durante el sondeo de `CONFIG_STATUS`.
3. Cada resultado correcto incluye `value` (releído) y `confirmation: 1`.
4. Se conserva la escritura secuencial, la validación de rangos y el contrato binario anterior.

## Contrato GATT
- Servicio: `f0a10000-7b4d-4c6a-9e20-3b8c8f100001`.
- `MEASUREMENT`: 6 bytes (v1.0) u 8 bytes (v1.1); en v1.1 los bytes 6–7 son mV uint16 little-endian.
- Configuración: umbral 30–120 BPM (uint16 LE), vibración 1–5 (uint8), LED 1–10 minutos (uint16 LE).
- `CONFIG_STATUS`: 4 bytes; código 1 guardado, 2 inválido, 3 fallo NVS; parámetro y valor vigente.
- No se supone atomicidad entre las tres escrituras.

## Pruebas de aceptación pendientes en dispositivo real
1. Conectar y verificar que se ven BPM, voltaje y configuración real.
2. Modificar un parámetro y comprobar confirmación y relectura.
3. Apagar o alejar el ESP32-C3: confirmar estado desconectado y mediciones `--`, no simuladas.
4. Encender y pulsar Conectar BLE: confirmar recuperación de telemetría y parámetros.
5. Desconectar mediante botón y reconectar manualmente.
6. Probar modo demostración tras cargar la página sin conectar y alternar temas.
7. Reiniciar el ESP32-C3 tras configurar y verificar persistencia NVS.

## Limitaciones
- No hay reconexión automática; el usuario debe autorizarla.
- La escritura se confirma por lectura de `CONFIG_STATUS` y del valor, no por una prueba independiente del almacenamiento físico NVS. La persistencia requiere reinicio.
- La web no es dispositivo médico ni sustituye monitoreo clínico.
