# Cambios PulsoAlert Web v0.5.5

## Alcance

Se modifica `app.js` para evaluar voltaje real de batería proveniente de `MEASUREMENT` GATT v1.1 (bytes 6–7, uint16 little-endian en mV), `index.html` para identificar la tarjeta existente con `id="batteryCard"`, y se añaden únicamente estilos de advertencia al final de `styles.css`. Se actualizan el pie de página, referencias de caché de scripts y README. No cambia `bluetooth.js`, los UUID, el logotipo, el layout, el simulador ni el selector de temas.

## Umbrales propuestos (LiPo 1S bajo carga)

- Normal: voltaje filtrado > 3600 mV.
- Recargar pronto: ≤ 3600 mV.
- Muy baja: ≤ 3400 mV.
- Crítica: ≤ 3200 mV.

Estos límites no se deben interpretar como porcentajes ni como valores de corte físico. Son provisionales y requieren validación con la celda y el circuito de protección. No reemplazan protección contra sobredescarga ni permiten apagar físicamente el dispositivo desde la web.

## Filtrado y presentación

Se utiliza mediana de hasta 5 lecturas recientes. Para confirmar un cambio de nivel se requieren 3 clasificaciones filtradas consecutivas. Para recuperar un nivel menos grave se requiere superar el límite por 80 mV (histéresis); para empeorar se usan los límites nominales. La advertencia se agrega al texto existente del estado de batería y cambia el color de borde/valor, utilizando las variables de tema `--warning` y `--danger`.

En desconexión, reconexión o retorno a simulación se reinicia el historial de voltajes y se limpian estilos. Si no hay voltaje válido (GATT v1.0, 0 mV o lectura desconocida), no se emite advertencia basada en voltaje. No se altera el reporte de porcentaje entregado por el firmware.

## Pruebas de aceptación pendientes

1. Verificar conexión BLE y visualización de voltaje real en Android y Windows.
2. Confirmar que el voltaje normal no muestra advertencia.
3. Inyectar lecturas controladas en un entorno de pruebas para confirmar los tres niveles, filtrado e histéresis (no descargar deliberadamente la LiPo para probar).
4. Verificar que desconectar elimina los datos reales y el aviso, y que el simulador sigue disponible.
5. Probar tema claro/oscuro y configuración BLE con NVS.
6. Confirmar con el hardware la presencia y especificación de protección contra sobredescarga.

## Nota de seguridad

La web solo informa cuando está conectada. Para proteger la LiPo sin navegador, añadir aviso autónomo en firmware y verificar el circuito de protección. El voltaje bajo carga puede variar con los pulsos del motor y no determina por sí solo el estado de carga.
