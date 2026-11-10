# PulsoAlert Web v0.5.4 — Cambios

## Objetivo
Simplificar la interfaz sin cambiar el protocolo BLE ni el diseño institucional Kä Träre.

## Cambios en `index.html`
- Eliminada la tarjeta **Estado de integración** y sus indicadores de desarrollo obsoletos.
- Actualizado el número de versión del pie de página a v0.5.4.
- Actualizados los parámetros `?v=0.5.4` de los recursos para evitar caché de GitHub Pages.

## Cambios en `app.js`
- Después de que `applySettings` confirma los tres parámetros con `CONFIG_STATUS` y relectura, se muestra solamente **Configuración guardada correctamente.**
- Mensajes de conexión, carga y desconexión más breves.
- Se mantienen los errores de escritura, los rechazos y las fallas de persistencia.

## Sin cambios
- `bluetooth.js`: se conservan UUID, compatibilidad GATT v1.0/v1.1, lectura de 6 y 8 bytes, escritura secuencial y confirmación de NVS.
- `styles.css` y `assets/katrare-logo.png`: sin modificaciones.
- Simulador, selector de temas, tres tarjetas y disposición general.

## Pruebas pendientes en dispositivo real
1. Refrescar con Ctrl+F5; comprobar ausencia de Estado de integración.
2. Conectar ESP32-C3; comprobar BPM y voltaje.
3. Cambiar tres parámetros; confirmar mensaje breve y persistencia tras reinicio.
4. Desconectar, seleccionar simulador y reconectar.
5. Comprobar tema claro/oscuro y visualización móvil.

**Estado:** paquete preparado; validación física pendiente.
