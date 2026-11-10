# PulsoAlert
## Manual de usuario e instalación del firmware

**Proyecto:** PulsoAlert  
**Institución:** Universidad Estatal a Distancia (UNED), Costa Rica · Fab Lab Kä Träre  
**Responsable:** Ing. Harold Carvajal Álvarez  
**Fecha de creación:** 10 de noviembre de 2026  
**Firmware de referencia probado:** v1.5.3  
**Sitio web de referencia:** PulsoAlert Web v0.5.6  
**Naturaleza:** prototipo experimental y educativo, no dispositivo médico


> **Advertencia de alcance.** PulsoAlert es un prototipo educativo de monitoreo experimental. No constituye un dispositivo médico, no ha sido validado para diagnóstico, seguimiento clínico ni emisión de alertas de seguridad vital. La ausencia de contacto o de una señal válida no debe interpretarse como una frecuencia cardíaca baja. Los resultados no sustituyen equipos clínicos ni la valoración de profesionales de salud.

## 1. Presentación

El firmware v1.5.3 controla una pulsera experimental con microcontrolador ESP32-C3, sensor óptico MAX30102, pantalla OLED de 72 × 40 píxeles, motor de vibración, LED integrado y lectura de batería LiPo. La comunicación Bluetooth Low Energy (BLE) permite consultar mediciones y ajustar parámetros desde PulsoAlert Web. El sitio de referencia es [PulsoAlert Web](https://fablabkatrare.github.io/PulsoAlertPage/), versión documental v0.5.6.

El presente manual explica la preparación del entorno, instalación del programa, operación y comprobaciones básicas. La reproducción del circuito eléctrico debe apoyarse en la documentación de hardware; no se debe deducir el cableado completo únicamente del firmware.

## 2. Equipo, herramientas y dependencias

| Elemento | Especificación de referencia | Observación |
|---|---|---|
| Placa | ESP32-C3 OLED Development Board 0,42″; OLED 72 × 40 | Placa del prototipo |
| Sensor | MAX30102 | Bus I²C compartido |
| Actuador | Motor vibrador con controlador/driver | Nunca conectado directamente a GPIO |
| Indicador | LED integrado GPIO8, activo LOW | No requiere LED externo |
| Energía | LiPo 3,7 V, cargador/protección y divisor 100 kΩ + 100 kΩ | Confirmar conexiones físicas en manual Hardware |
| Equipo de desarrollo | PC con Arduino IDE **2.3.1** | Versión indicada para este manual; no consta como versión históricamente ensayada |
| Paquete de placas | **esp32 by Espressif Systems** | Versión exacta del core no documentada |
| Biblioteca externa | **U8g2 by olikraus** (`U8g2lib.h`) | Versión exacta no documentada |
| Biblioteca externa | **SparkFun MAX3010x Pulse and Proximity Sensor Library** (`MAX30105.h`, `heartRate.h`) | Versión exacta no documentada |
| Bibliotecas del core | `Wire`, BLE (`BLEDevice`, `BLEServer`, `BLEUtils`, `BLE2902`), `Preferences`, FreeRTOS | Incluidas con el core ESP32; no instalar variantes BLE incompatibles sin necesidad |

**Archivo fuente de referencia:** `PulsoAlert_v1.5.3.ino`. Se recomienda conservar una copia intacta y registrar las versiones de bibliotecas instaladas al reproducir el montaje.

## 3. Instalación en Arduino IDE 2.3.1

1. Instalar Arduino IDE 2.3.1 y conectar el ESP32-C3 mediante un cable USB de datos.
2. Abrir **Archivo → Preferencias**. En «URLs adicionales de gestor de tarjetas», incorporar, si todavía no está configurada, la URL oficial del paquete Espressif: `https://espressif.github.io/arduino-esp32/package_esp32_index.json`.
3. Abrir **Herramientas → Placa → Gestor de tarjetas**, buscar `esp32` e instalar **esp32 by Espressif Systems**. Registrar la versión seleccionada.
4. Abrir **Herramientas → Administrar bibliotecas**, instalar **U8g2** y **SparkFun MAX3010x Pulse and Proximity Sensor Library**. Registrar sus versiones.
5. Abrir `PulsoAlert_v1.5.3.ino` en Arduino IDE. Seleccionar el perfil ESP32-C3 correspondiente a la placa utilizada; el nombre exacto del perfil de placa no quedó registrado en las pruebas disponibles.
6. Seleccionar el puerto USB de la placa. Configurar **USB CDC On Boot = Enabled** para la consola serie nativa y mantener los demás ajustes de placa que ya funcionan en el montaje.
7. Ejecutar **Verificar** para compilar. Si aparecen errores por bibliotecas faltantes, comprobar sus nombres y que el core elegido sea ESP32-C3.
8. Ejecutar **Subir** y esperar la finalización de la carga. No pulsar ni mantener BOOT durante el encendido normal; GPIO9 interviene en el arranque.
9. Abrir el **Monitor serie a 115200 baudios**. Deben aparecer mensajes de inicio, configuración NVS y publicidad BLE si la consola está operativa.

**Limitación conocida:** en la fuente v1.5.3 documentada, la salida serie periódica puede coincidir con un congelamiento de la OLED cuando se cierra el monitor. No se ha confirmado una solución definitiva. La compilación y carga correctas no equivalen a una validación de operación autónoma.

## 4. Conexiones lógicas verificadas

| GPIO | Función | Nivel / precaución |
|---|---|---|
| 5 | SDA I²C, OLED y MAX30102 | Bus compartido |
| 6 | SCL I²C, OLED y MAX30102 | Bus compartido |
| 4 | Señal de control al driver del motor | HIGH = activo; no conectar motor directamente |
| 8 | LED integrado | LOW = encendido |
| 9 | Botón BOOT | LOW = pulsado; pin de arranque |
| 0 | ADC para batería | Entrada desde divisor 100 kΩ/100 kΩ; nunca LiPo directa |

## 5. Uso cotidiano y pantalla OLED

Al encender, la OLED presenta el nombre y versión del firmware. La pantalla principal muestra el estado de medición, BPM en caracteres grandes cuando existe lectura válida y el estado abreviado de la batería.

| Texto en OLED | Significado | Acción recomendada |
|---|---|---|
| `SIN CONTACTO` | Señal IR inferior al umbral de contacto | Ajustar la posición del sensor sobre la piel |
| `LEYENDO...` | Hay contacto, pero todavía no hay BPM válido | Mantener el sensor estable y esperar nuevos latidos |
| `MONITOREO` + BPM | Medición disponible | Observar la tendencia, sin interpretarla clínicamente |
| `FC BAJA?` | Se está confirmando BPM bajo | Esperar los 5 s de confirmación; no equivale a diagnóstico |
| `ALERTA FC!` | Episodio de alerta activo | Se ejecuta vibración y parpadeo según parámetros |
| `BAT: OK` | Voltaje clasificado normal | Continuar observación |
| `BAT: BAJA` | Voltaje inferior a 3,50 V, tras confirmación | Preparar recarga |
| `BAT: CARGAR` | Voltaje inferior a 3,30 V, tras confirmación | Recargar de forma segura |

Pulsar **BOOT** durante la operación alterna entre la pantalla principal y la secundaria, que presenta voltaje de batería y umbral BPM. Si se activa una alerta, se prioriza la pantalla principal.

### Prototipos orientativos de pantalla (no fotografías)

```text
┌──────────────────────┐  ┌──────────────────────┐
│ MONITOREO            │  │ SIN CONTACTO         │
│                      │  │                      │
│  72 BPM              │  │ -- BPM               │
│ BAT: OK              │  │ BAT: OK              │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ CONFIG.              │  │ ALERTA FC!           │
│ BAT: 3.92V           │  │                      │
│ UMB: 50 BPM          │  │  45 BPM              │
│ BOOT: VOLVER         │  │ BAT: BAJA            │
└──────────────────────┘  └──────────────────────┘
```

Los valores numéricos son **ejemplos ilustrativos**, no resultados de medición ni capturas reales. La distribución exacta corresponde a los métodos `mostrarPantallaPrincipal()` y `mostrarPantallaConfiguracion()` del código.

## 6. Parámetros de configuración

| Parámetro | Valor inicial | Rango admitido | Unidad | Persistencia |
|---|---:|---:|---|---|
| Umbral de alerta | 50 | 30–120 | BPM | NVS `pulsoalert/umbral` |
| Ciclos de vibración | 3 | 1–5 | ciclos | NVS `pulsoalert/ciclos` |
| Duración del LED | 2 | 1–10 | minutos | NVS `pulsoalert/ledmin` |

Cada ciclo de vibración contiene **tres pulsos de 300 ms**, con **200 ms de pausa entre pulsos** y **1000 ms entre ciclos**. La alerta se activa tras **5 segundos** continuos bajo el umbral; se cancela después de **2 segundos** de recuperación sostenida o inmediatamente si se pierde una señal válida. El LED puede continuar parpadeando después de terminar el motor, hasta agotar su duración configurada.

## 7. Conexión con PulsoAlert Web v0.5.6

1. Abrir la página publicada en un navegador y dispositivo con compatibilidad Web Bluetooth, como Chrome o Edge en un entorno admitido.
2. Activar Bluetooth y seleccionar la opción de conexión del sitio.
3. Elegir el dispositivo anunciado como **PulsoAlert** y autorizar la conexión.
4. Verificar la recepción de BPM, contacto, estado de alerta y voltaje LiPo.
5. Ajustar un parámetro a la vez y comprobar la confirmación de guardado antes de modificar otro.
6. Reiniciar el ESP32-C3 y verificar que los parámetros persisten.

La medición GATT v1.1 tiene **8 bytes**; el voltaje real se transmite en los bytes 6–7 como milivoltios. El porcentaje de batería permanece como **desconocido (255)** en el firmware y no debe presentarse como porcentaje medido. Los detalles visuales, funciones de simulación y publicación del sitio corresponden al manual específico WebBLE.

## 8. Lista de comprobación de funcionamiento

| Prueba | Resultado esperado | Estado de evidencia |
|---|---|---|
| Compilar y cargar v1.5.3 | Sin errores; arranque en placa | Confirmado por el usuario para la versión probada |
| Sensor con contacto estable | BPM visible tras detección de latidos | Confirmado en pruebas previas; condicionado por incidencia serie |
| Retirar contacto | `SIN CONTACTO`, sin alerta por pérdida de señal | Implementado y probado históricamente |
| Pulsar BOOT | Alterna vista principal/secundaria | Probado históricamente |
| Configurar desde la web | Ajustes aplicados y confirmación BLE | Confirmado por el usuario |
| Reiniciar placa | Ajustes restaurados desde NVS | Confirmado por el usuario |
| Cerrar monitor serie | La OLED debería continuar actualizando | **No superada en fuente v1.5.3** |

## 9. Solución de problemas

| Síntoma | Comprobación / actuación |
|---|---|
| No compila: `U8g2lib.h` o `MAX30105.h` | Instalar la biblioteca correspondiente desde el gestor |
| No compila: tipos `ParametroBLE`, `ResultadoBLE`, `SolicitudBLE` | Utilizar la fuente v1.5.3 que ya incluye prototipos explícitos después de los tipos BLE |
| No aparece puerto serie | Comprobar cable de datos, controlador USB y puerto seleccionado |
| Consola sin mensajes | Verificar `USB CDC On Boot = Enabled`, puerto y 115200 baudios |
| OLED muestra `LEYENDO...` | Mantener contacto estable; comprobar detección de latidos, no asumir fallo de sensor |
| Web informa longitud BLE incorrecta | Comprobar compatibilidad de 8 bytes de `MEASUREMENT` con GATT v1.1 |
| No aparecen voltios | Revisar GPIO0, divisor resistivo y lectura en pantalla secundaria; no conectar batería directamente al ADC |
| OLED se congela al cerrar consola | **Incidencia conocida:** la prueba de aislamiento eliminó el síntoma al comentar `actualizarSerial(ahora)`, pero ello no constituye una corrección definitiva. Registrar el caso y consultar mantenimiento del firmware |

## 10. Historial de versiones y validaciones

| Versión | Alcance | Validación disponible |
|---|---|---|
| 1.4.2 | Sensor, OLED, alertas, motor, LED y batería | Base funcional probada; parpadeo LED corregido |
| 1.5.0 | Lectura y notificación BLE | BPM y alertas visibles en web |
| 1.5.1 revisión A | GATT de 8 bytes, configuración BLE, NVS y prototipos explícitos | Compilación y carga confirmadas; web anterior rechazó longitud 8 |
| **1.5.3** | Identificación de versión actualizada, misma lógica base | Pruebas de web, voltaje y NVS confirmadas; incidencia USB CDC abierta |

**Compatibilidad documental:** PulsoAlert Web **v0.5.6** es la versión de referencia declarada para este manual. El código fuente de esa versión web no forma parte de este documento de firmware.

## 11. Referencias

- Código fuente real: `PulsoAlert_v1.5.3.ino`.
- `PulsoAlert_Contrato_BLE_v1.1.md`.
- `PulsoAlert_Documentacion_Firmware.md` y `PulsoAlert_Inventario_Firmware.md` (consolidación del 10/11/2026).
- Sitio: https://fablabkatrare.github.io/PulsoAlertPage/
- Arduino IDE: https://www.arduino.cc/en/software
- Paquete Arduino-ESP32: https://docs.espressif.com/projects/arduino-esp32/en/latest/
- U8g2: https://github.com/olikraus/u8g2
- SparkFun MAX3010x: https://github.com/sparkfun/SparkFun_MAX3010x_Sensor_Library

## 12. Descargo de responsabilidad

El dispositivo es un **prototipo experimental con fines de enseñanza y demostración**. Sus lecturas de BPM, detección de contacto, niveles de batería y alertas no están certificados para uso clínico, prevención de síncopes ni vigilancia de emergencias. El funcionamiento depende de las condiciones de contacto, movimiento, alimentación y software. La conexión BLE de esta versión no incorpora autenticación de usuario. La construcción, carga de batería y operación deben realizarse con supervisión técnica y medidas de seguridad apropiadas. La documentación no autoriza su uso como equipo médico.
