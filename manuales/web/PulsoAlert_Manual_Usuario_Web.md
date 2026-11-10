# Manual de usuario — PulsoAlert Web

**Fecha de creación documental:** 10 de noviembre de 2026  
**Responsable:** Ing. Harold Carvajal Álvarez  
**Institución:** Fab Lab Kä Träre · Universidad Estatal a Distancia (UNED), Costa Rica  
**Firmware de referencia probado:** PulsoAlert v1.5.3 (versión reportada para la documentación; las pruebas BLE descritas en el historial corresponden a las versiones allí indicadas)  
**Sitio web de referencia:** PulsoAlert Web v0.5.6  
**Sitio publicado:** https://fablabkatrare.github.io/PulsoAlertPage/  
**Naturaleza del documento:** Material técnico y educativo, versión documental 1.1

## 1. Presentación y alcance
PulsoAlert Web es la interfaz de un prototipo educativo de monitoreo experimental de frecuencia cardíaca con ESP32-C3 y sensor MAX30102. Permite observar BPM, contacto con la piel, batería y alertas; también permite configurar ciertos parámetros mediante Bluetooth Low Energy (BLE). **No es un dispositivo médico, no diagnostica y no debe emplearse para decisiones clínicas.**

La página puede utilizarse en **modo demostración**, con valores ficticios, o en **modo conectado**, con información transmitida por el prototipo. Los datos simulados siempre deben interpretarse como ejemplos.

## 2. Conocer la pantalla
La cabecera presenta el logotipo Kä Träre, el nombre PulsoAlert y el selector de tema. Debajo se encuentran el título, el estado de conexión y el botón **Conectar BLE**. Tres tarjetas muestran **Frecuencia cardíaca**, **Batería** y **Estado de alerta**. En la zona inferior aparecen **Parámetros de alerta** y **Simulador de estados**. Al final se incluye la advertencia educativa.

![Pantalla principal real de PulsoAlert Web](imagenes/captura_pagina_completa.png)

## 3. Requisitos antes de empezar
- Abrir la dirección del sitio con HTTPS en un navegador que admita Web Bluetooth; la compatibilidad depende del navegador y dispositivo. En equipos compatibles, usar Chrome o Edge actualizados.
- Activar Bluetooth en el equipo y encender el prototipo con firmware BLE compatible.
- Permitir la selección del dispositivo cuando el navegador lo solicite. El navegador requiere una acción explícita del usuario para iniciar la búsqueda.
- La página es estática: no exige instalar una aplicación Android ni crear una cuenta. Para utilizar BLE es necesario disponer del dispositivo físico.

## 4. Operar sin pulsera: modo demostración
1. Abra el sitio; confirme el texto **Modo demostración** y la advertencia de datos simulados.
2. En **Simulador de estados**, seleccione **Normal**, **FC baja**, **Alerta** o **Sin contacto**.
3. Observe cómo cambian la frecuencia cardíaca, el estado de contacto y la tarjeta de alerta.
4. En **Simulador de batería**, seleccione **Normal**, **Recargar pronto**, **Muy baja** o **Crítica**; la tarjeta Batería muestra voltajes ficticios y advertencias.
5. Puede combinar un escenario de frecuencia cardíaca con otro de batería. Ningún botón del simulador controla el hardware.

![Simulador de frecuencia cardíaca y batería](imagenes/captura_simuladores.png)

## 5. Conectar el ESP32-C3 por BLE
1. Encienda el ESP32-C3 y manténgalo próximo al equipo.
2. Pulse **Conectar BLE**.
3. En el selector del navegador, elija el dispositivo **PulsoAlert** y autorice la conexión.
4. Espere a que el estado indique conexión. Las tarjetas empezarán a mostrar datos del ESP32-C3.
5. Compruebe que el voltaje mostrado es una lectura real. La ausencia de contacto o de medición válida puede impedir mostrar BPM útiles.

**Si no aparece el dispositivo:** revise alimentación, Bluetooth, permisos, navegador compatible y que el firmware anuncie el servicio GATT de PulsoAlert. No asuma que cualquier navegador admite Web Bluetooth.

## 6. Interpretar las tres tarjetas
**Frecuencia cardíaca:** muestra BPM cuando la señal es válida. El texto inferior indica el estado de contacto. Un BPM igual a cero o un estado de señal inválida no representa necesariamente una frecuencia real.

**Batería:** muestra el voltaje medido en voltios cuando el firmware transmite los bytes adicionales del contrato GATT v1.1. Con paquetes antiguos de 6 bytes puede no haber voltaje disponible. No se deduce porcentaje de carga a partir del voltaje sin calibración.

**Estado de alerta:** indica si el firmware informa una alerta. La vibración y el LED son acciones físicas del dispositivo; la web solo refleja su estado.

![Tarjetas de medición y alerta](imagenes/captura_tarjetas.png)

## 7. Alertas de batería
Los estados de la web utilizan umbrales **experimentales**, sujetos a validación con la batería real: por encima de 3,60 V, normal; de 3,40 a 3,60 V, recargar pronto; de 3,20 a menos de 3,40 V, batería muy baja, recargar o apagar; a 3,20 V o menos, batería crítica, apagar. El algoritmo filtra fluctuaciones breves mediante una ventana de lecturas, confirmaciones e histéresis.

**Importante:** el aviso en el navegador no desconecta físicamente la batería ni sustituye la placa de protección. Si aparece una advertencia crítica, deje de utilizar el prototipo y recárguelo con el sistema de carga adecuado. No cargue una celda dañada, hinchada o excesivamente caliente.

## 8. Configurar parámetros de alerta
Los controles permiten ajustar **umbral de frecuencia cardíaca** (30–120 BPM), **ciclos de vibración** (1–5) y **duración del parpadeo LED** (1–10 minutos). Valores iniciales mostrados en la interfaz: 50 BPM, 3 ciclos y 2 minutos.

1. Con BLE conectado, desplace los tres controles al valor deseado.
2. Pulse el botón de aplicación de configuración.
3. Espere la confirmación **«Configuración guardada correctamente»**. La web escribe un parámetro por vez, comprueba `CONFIG_STATUS` y relee el valor del dispositivo.
4. Si aparece un error, revise la conexión y repita la operación. No dé por guardados los cambios sin confirmación.
5. Para verificar persistencia, reinicie el ESP32-C3, vuelva a conectar y compruebe que recupera los valores elegidos.

**Sin BLE:** el botón **Aplicar a demostración** afecta solo a la interfaz simulada. **Restablecer** debe interpretarse según el modo y el mensaje mostrado; antes de actuar sobre un dispositivo real compruebe qué valores presenta la web.

![Controles de configuración](imagenes/captura_configuracion.png)

## 9. Desconexión y regreso al simulador
Cuando se pierde BLE, la web oculta las mediciones reales anteriores para que no parezcan actuales. Para volver a conectar, pulse **Conectar BLE**. Para utilizar el simulador después de una desconexión, seleccione un escenario de frecuencia cardíaca o batería. Mientras BLE esté conectado, el simulador no reemplaza los datos reales.

## 10. Tema visual y uso móvil
El interruptor de la cabecera cambia entre tema oscuro y claro. El tema oscuro usa negro, grafito y acentos dorados; el claro mantiene la estructura con superficies claras. En pantallas estrechas, las tarjetas y paneles se reorganizan en una sola columna. La disponibilidad de BLE en móviles depende del navegador y del sistema.

## 11. Problemas frecuentes
| Síntoma | Qué comprobar |
|---|---|
| No aparece PulsoAlert en la búsqueda | ESP encendido, firmware BLE, Bluetooth y permisos del navegador. |
| «Medición BLE con longitud incorrecta» | Actualizar la web; debe aceptar 6 u 8 bytes. |
| Los controles cambian pero no se guardan | Confirmar que BLE está conectado, aplicar y esperar confirmación. |
| Después de desconectar no hay BPM | Es intencional: se ocultan mediciones obsoletas. |
| Simulador no responde con BLE conectado | Es intencional: se priorizan mediciones reales. |
| No aparece voltaje | Revisar firmware GATT v1.1 y conexión; 6 bytes no incluyen milivoltios. |
| El sitio parece antiguo | Recargar forzadamente y verificar publicación de GitHub Pages. |

## 12. Prácticas sugeridas
- Cambiar entre Normal, FC baja, Alerta y Sin contacto y explicar la diferencia entre estado y medición.
- Comparar los cuatro estados de batería sin conectar la pulsera.
- Ajustar umbral, ciclos y duración en modo demostración; describir qué cambió visualmente.
- Con BLE, enviar un parámetro, reiniciar y verificar su recuperación. Realizar la prueba únicamente bajo supervisión y con el prototipo en condiciones seguras.

## 13. Estado de validación
**Validación registrada:** conexión BLE, recepción de BPM, lectura del voltaje, envío de configuración y persistencia NVS en v0.5.1; simulador de estados y tema visual en versiones previas. **Implementado sin validación final confirmada:** simulador de batería de v0.5.6 y su funcionamiento integral en todos los navegadores. **No verificado:** exactitud clínica del sensor, autonomía y protección autónoma de batería.

## Aviso de responsabilidad y limitaciones (disclaimer)

PulsoAlert es un **prototipo experimental y educativo** desarrollado en el Fab Lab Kä Träre de la UNED. No es un dispositivo médico, no cuenta con certificación sanitaria y no está destinado a diagnosticar, prevenir, tratar ni monitorizar clínicamente enfermedades. Las mediciones de frecuencia cardíaca pueden presentar errores por movimiento, colocación del sensor, calidad de contacto y condiciones ambientales; no deben emplearse para tomar decisiones médicas ni sustituir equipos clínicos.

Los valores del simulador son ficticios y no representan mediciones de una persona. Los umbrales de batería son orientativos y requieren validación con la celda, el circuito de protección y las condiciones reales de funcionamiento. Las advertencias de la página web no sustituyen los mecanismos físicos de protección ni garantizan el apagado del dispositivo.

La reproducción y utilización del prototipo requieren supervisión adecuada, prácticas seguras de manipulación de baterías LiPo y verificación de conexiones y polaridades. Las características de Bluetooth dependen de la compatibilidad del navegador, el sistema operativo y el firmware. La documentación describe el estado disponible al 10 de noviembre de 2026 y no constituye garantía de funcionamiento para otras configuraciones.

