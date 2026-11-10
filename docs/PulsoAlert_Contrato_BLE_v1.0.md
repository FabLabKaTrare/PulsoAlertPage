# PulsoAlert — Contrato BLE GATT v1.0 (PROPUESTA)

**Estado:** propuesta para PulsoAlert Web v0.5.0 y firmware ESP32-C3 v1.5; **no implementado ni validado**. Firmware v1.4.2 permanece estable.

## Servicio y características

Nombre anunciado sugerido: `PulsoAlert`.

UUID de servicio: `f0a10000-7b4d-4c6a-9e20-3b8c8f100001`

| Característica | UUID | Propiedades | Formato |
|---|---|---|---|
| MEASUREMENT | `f0a10001-7b4d-4c6a-9e20-3b8c8f100001` | Read, Notify | 6 bytes |
| BPM_THRESHOLD | `f0a10002-7b4d-4c6a-9e20-3b8c8f100001` | Read, Write | uint16 LE |
| VIBRATION_CYCLES | `f0a10003-7b4d-4c6a-9e20-3b8c8f100001` | Read, Write | uint8 |
| LED_DURATION | `f0a10004-7b4d-4c6a-9e20-3b8c8f100001` | Read, Write | uint16 LE, minutos |
| CONFIG_STATUS | `f0a10005-7b4d-4c6a-9e20-3b8c8f100001` | Read, Notify | 4 bytes |

UUID propuestos, exclusivos para el proyecto, sujetos a aceptación conjunta en firmware y web.

## MEASUREMENT (6 bytes)

| Offset | Tipo | Significado |
|---|---|---|
| 0 | uint16 LE | BPM: 0 indica lectura no válida |
| 2 | uint8 | Contacto: 0 sin contacto, 1 contacto |
| 3 | uint8 | Batería: 0–100 %, 255 desconocida |
| 4 | uint8 | Alerta: 0 normal, 1 activa |
| 5 | uint8 | Estado: 0 esperando, 1 midiendo, 2 señal inválida |

El cliente no mostrará BPM si no hay contacto, si el estado no es `midiendo` o si BPM es 0. La batería desconocida se presenta como `--`, nunca como 255 %. No se enviarán valores simulados como si fueran reales.

## Parámetros de configuración

| Parámetro | Rango propuesto | Unidad | Valor inicial de la interfaz demo |
|---|---|---|---|
| BPM_THRESHOLD | 30–120 | BPM | 50 |
| VIBRATION_CYCLES | 1–5 | ciclos | 3 |
| LED_DURATION | 1–10 | minutos | 2 |

Estos rangos corresponden a los controles actuales de la web, **no son rangos clínicos validados**. El firmware debe rechazar valores fuera de rango. Los valores predeterminados reales del ESP32-C3 se obtendrán mediante lectura BLE, no se asumirán desde la interfaz.

## CONFIG_STATUS (4 bytes)

| Offset | Tipo | Significado |
|---|---|---|
| 0 | uint8 | Código: 0 sin operación, 1 aplicado y persistido, 2 valor inválido, 3 error de almacenamiento |
| 1 | uint8 | Parámetro: 0 ninguno, 1 BPM_THRESHOLD, 2 VIBRATION_CYCLES, 3 LED_DURATION |
| 2–3 | uint16 LE | Valor vigente del parámetro indicado; 0 si ninguno |

La característica refleja el resultado de la última escritura procesada. La web realizará **una sola escritura a la vez**, esperará notificación o consultará el estado y leerá nuevamente el parámetro para comprobar el valor vigente. Si hay desconexión o timeout, mostrará estado no confirmado; no afirmará que se guardó. Este esquema simple está diseñado para un único cliente conectado y no admite correlación segura entre múltiples escritores simultáneos.

## Secuencia de conexión y configuración

1. Usuario pulsa **Conectar BLE**; navegador solicita permiso para seleccionar un dispositivo que anuncie el servicio.
2. Cliente conecta GATT y obtiene las cinco características.
3. Cliente se suscribe a MEASUREMENT y CONFIG_STATUS, y lee medición y configuración actual.
4. Usuario cambia controles y pulsa **Aplicar**.
5. Cliente valida rangos y escribe parámetros **secuencialmente**, uno por uno.
6. Para cada parámetro, ESP32-C3 valida, aplica, persiste en NVS y actualiza CONFIG_STATUS; la web verifica confirmación y lectura posterior.
7. Ante fallo parcial, la web muestra qué parámetros se confirmaron y cuáles no. No existe transacción atómica de tres parámetros.
8. Ante desconexión, la interfaz deja de mostrar valores como datos en vivo y permite volver a conectar.

## Seguridad y límites

- Web Bluetooth requiere navegador compatible, contexto seguro HTTPS/localhost y una acción explícita del usuario para seleccionar el dispositivo.
- La conexión BLE por sí sola no garantiza autenticación de usuarios. Para este prototipo educativo no se debe asumir protección contra conexiones no autorizadas; evaluar emparejamiento/autorización antes de uso fuera del laboratorio.
- El sistema es experimental, no un dispositivo médico ni un detector clínicamente validado de síncope.
- Pendiente: acordar frecuencia de notificaciones, desconexión/recuperación, fuente de porcentaje de batería (hasta incorporar LiPo), pruebas en Windows y Android, y correspondencia con el firmware real.

## Compatibilidad con la web v0.4.1

La versión ZIP entregada contiene `index.html`, `styles.css`, `app.js`, `README.md` y `assets/katrare-logo.png`. Mantener sin modificaciones el CSS, logo, tema y layout aprobados. Los controles existentes usan los rangos arriba descritos. Integración futura sugerida en `bluetooth.js` sin sustituir el simulador ni el diseño.
