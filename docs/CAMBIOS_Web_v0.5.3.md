# PulsoAlert Web v0.5.3 — Corrección del retorno al simulador

## Problema observado
En v0.5.2, `showScenario()` retornaba si `connectionEverEstablished` era verdadero. La variable permanecía verdadera después de desconectar, por lo que no se podía usar el simulador sin recargar la página.

## Modificación
- `showScenario()` bloquea la simulación solo durante una conexión BLE activa o mientras se ejecuta una operación de conexión/configuración.
- Si hubo una conexión anterior y ahora está desconectado, seleccionar un escenario cambia el estado a demostración y actualiza las tarjetas con datos explícitamente simulados.
- La desconexión sigue ocultando inmediatamente BPM, batería y alertas reales; no se activan automáticamente valores ficticios.
- Los botones de aplicar y restablecer vuelven a habilitarse al activar la demostración.
- Se aclara que Restablecer modifica solo los controles locales, incluso con BLE conectado, hasta que el usuario pulse Aplicar al dispositivo.
- Se conservan sin cambios `styles.css`, `bluetooth.js`, los UUID GATT, el logotipo y la estructura de tarjetas.

## Pruebas de aceptación pendientes en navegador
1. Abrir sin BLE y seleccionar los cuatro escenarios.
2. Conectar BLE, comprobar BPM y voltaje reales; los escenarios no deben sobrescribirlos.
3. Desconectar BLE: los datos deben ocultarse.
4. Seleccionar Alerta: volver a demostración sin recargar.
5. Aplicar valores en modo demostración: no deben enviarse por BLE.
6. Reconectar BLE: recuperar mediciones y configuración reales.
7. Verificar selector de temas en Windows y Android.

## Estado
Corrección implementada; requiere prueba física y visual del usuario. No es una versión validada aún.
