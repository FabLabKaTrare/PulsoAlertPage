# PulsoAlert Web v0.5.0 — Kä Träre / FabLab UNED

Basado en la interfaz aprobada v0.4.1. Se preservan `styles.css`, logotipo y layout.

## Novedades
- `bluetooth.js`: conexión Web Bluetooth, notificaciones de medición, lectura de parámetros y escrituras con confirmación y relectura.
- El simulador sigue funcionando sin hardware. Al conectar, deja de sobrescribir mediciones reales.
- La batería BLE se muestra como porcentaje, o `--` si el firmware reporta 255 (desconocido). La demostración conserva el voltaje ficticio.

## Publicación
Subir todos los archivos al directorio raíz del repositorio GitHub Pages, incluyendo `bluetooth.js` y `docs/`. Probar con Chrome/Edge compatible sobre HTTPS.

## Importante
**La comunicación BLE NO está validada con hardware.** Requiere firmware ESP32-C3 v1.5 que implemente exactamente `docs/PulsoAlert_Contrato_BLE_v1.0.md`. El firmware v1.4.2 no anuncia este servicio. La confirmación GATT propuesta supone un solo cliente escritor y que el firmware actualiza CONFIG_STATUS después de persistir en NVS. La web detiene la secuencia ante el primer fallo y no asegura atomicidad de tres parámetros.

El proyecto es educativo y no constituye un dispositivo médico.
