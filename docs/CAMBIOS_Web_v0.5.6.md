# PulsoAlert Web v0.5.6 — Simulador de batería

## Alcance
Se añade al panel **Simulador de estados** un grupo de cuatro botones para comprobar la presentación de la batería: Normal (3.920 V), Recargar pronto (3.520 V), Muy baja (3.320 V) y Crítica (3.100 V).

## Implementación
- `index.html`: nuevo grupo de botones `data-battery-scenario`, versión visible 0.5.6.
- `app.js`: `currentBatteryScenario` y `showBatteryScenario()`, independientes de los escenarios BPM. No se escriben características GATT ni se modifica NVS.
- `styles.css`: solo separación y encabezado del grupo nuevo; se conserva el tema institucional.
- La selección de una batería ficticia después de desconectar BLE reactiva explícitamente la demostración; mientras BLE esté conectado no se sustituyen datos reales.
- Los estados ficticios se aplican de inmediato, sin el filtrado temporal de la telemetría real. Al recibir mediciones reales, el estado y las advertencias se calculan exclusivamente a partir de BLE.

## Pruebas pendientes en navegador
1. Sin BLE: seleccionar cada uno de los cuatro estados y observar voltaje, mensaje y color.
2. Cambiar entre estados BPM y verificar que la batería simulada elegida permanece.
3. Conectar BLE y comprobar que la batería muestra datos reales, no simulados.
4. Desconectar BLE: deben ocultarse los datos; elegir un botón de batería y comprobar que vuelve el modo demostración.
5. Revisar los temas claro/oscuro y el diseño en Android y Windows.

Los umbrales de advertencia siguen siendo provisionales. La web no protege físicamente la LiPo ni sustituye la protección de la batería.
