# PulsoAlert Web v0.5.4 — Kä Träre / FabLab UNED

Versión basada en la **v0.5.1 validada por el usuario** con firmware ESP32-C3 v1.5.1 revisión A. Se mantienen el HTML estructural, `styles.css`, el logotipo institucional, los temas y el simulador.

## Cambios
- Indicación de estados BLE: demostración, conectando, conectado y desconectado.
- Ante una desconexión, se ocultan BPM, batería, contacto y alerta antiguos; no se vuelven a presentar como datos en tiempo real.
- Reconexión **manual** desde el botón Conectar BLE (sin permisos automáticos ni reconexión silenciosa).
- Al conectar, se muestran los tres valores recuperados del dispositivo.
- Al aplicar, la confirmación informa `CONFIG_STATUS=1` y los valores efectivamente releídos. En fallos, la secuencia se detiene y se releen los valores vigentes cuando la conexión lo permite.
- Protección contra continuar verificaciones de configuración si la conexión cambia durante la operación.
- Cache-busting de scripts `?v=0.5.2`.

## Publicación
Subir el contenido del ZIP a la raíz del repositorio `PulsoAlertPage`, reemplazando los archivos existentes. El diseño aprobado no requiere modificaciones en `styles.css`.

## Alcance de pruebas
La sintaxis JavaScript y el ZIP se verificaron localmente. **No se han realizado pruebas físicas de la v0.5.4**. La compatibilidad BLE de 6 y 8 bytes se hereda de v0.5.1; las nuevas mejoras requieren prueba con hardware.

Consulta `docs/CAMBIOS_Web_v0.5.4.md` para detalle técnico y pruebas sugeridas. Prototipo educativo; no es dispositivo médico.


## Corrección v0.5.4
Tras desconectar BLE, la interfaz oculta los datos reales. Pulsar cualquiera de los cuatro escenarios vuelve a activar el simulador sin recargar la página. Mientras BLE esté conectado, los escenarios no sustituyen la telemetría real. El diseño CSS y el protocolo GATT permanecen intactos.


## Ajustes v0.5.4

Se elimina la tarjeta obsoleta Estado de integración y se simplifica el mensaje de guardado. Se conservan la confirmación CONFIG_STATUS, la relectura GATT, la lógica de NVS, el simulador, los temas y el CSS sin modificaciones.
