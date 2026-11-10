# PulsoAlert — Construcción y conexiones del circuito electrónico

**FabLab Kä Träre · UNED, Costa Rica**  
**Área:** Hardware · **Documento de reproducción del prototipo experimental**  
**Alcance:** montaje implementado, principio de funcionamiento, comprobaciones y aspectos pendientes de validación eléctrica.

**Fecha de creación de esta edición:** 10 de noviembre de 2026  
**Responsable:** Ing. Harold Carvajal Álvarez  
**Laboratorio:** Fab Lab Kä Träre · UNED, Costa Rica  
**Firmware de referencia probado:** v1.5.3  
**Sitio web de referencia:** v0.5.6  
**Sitio del proyecto:** https://fablabkatrare.github.io/PulsoAlertPage/  
**Versión del documento:** 1.1 (actualización de referencias y descargo de responsabilidad)  


## 1. Propósito y alcance

PulsoAlert es una pulsera experimental destinada a explorar la medición óptica de la frecuencia cardíaca, la lectura de batería y la generación de avisos mediante una pantalla OLED, un LED y un motor de vibración. Se construyó con una placa ESP32-C3 con pantalla OLED integrada, un módulo MAX30102, un módulo de vibración con circuito controlador y una batería LiPo desmontable. El prototipo es educativo y **no constituye un dispositivo médico**.

El presente documento describe el circuito **tal como fue montado y probado**. Se diferencia el funcionamiento observado de la validación de seguridad eléctrica: que el equipo haya funcionado no demuestra que todas las tensiones y corrientes estén dentro de las especificaciones de cada placa.

## 2. Componentes empleados

| Componente | Función en el prototipo | Evidencia |
|---|---|---|
| ESP32-C3 OLED Development Board 0,42″ | Procesamiento, lectura ADC, bus I²C, control de alertas y pantalla OLED integrada | Fotografía y pinout aportados; GPIO probados |
| MAX30102 en módulo | Captura de señal óptica pulsátil | Fotografía aportada; lectura de BPM probada |
| Módulo de motor vibrador con driver | Aviso háptico controlado desde GPIO4 | Fotografía aportada; vibración probada |
| Batería LiPo 3,7 V nominales, 150 mAh | Alimentación autónoma | Montaje y medición de voltaje reportados |
| Conectores JST-PH macho/hembra | Desconexión de batería para uso y carga | Disposición de conexión confirmada |
| Cargador USB separado | Carga de la LiPo fuera de la pulsera | Fotografía aportada; corriente de carga sin verificar |
| Resistencias 100 kΩ + 100 kΩ | Divisor de tensión para el ADC GPIO0 | Lectura contrastada con multímetro |

## 3. Arquitectura del circuito

La placa ESP32-C3 coordina tres subsistemas: adquisición de pulso por I²C, presentación y señalización de estados, y supervisión del voltaje de la batería. El MAX30102 comparte el bus I²C con la pantalla OLED integrada. El motor no se conecta directamente al GPIO: se utiliza el circuito controlador de su módulo. El LED de estado forma parte de la propia placa ESP32-C3.

**Figura 1. Diagrama de interconexión externa del montaje.** El esquema vectorial incluido muestra las conexiones del prototipo. No representa ni certifica los circuitos internos de las placas comerciales; por ello, no debe interpretarse como un esquemático de fabricación validado.

![Diagrama de interconexiones](PulsoAlert_Diagrama_Electronico_Conexiones.svg)

## 4. Conexiones realizadas

| Origen | Destino | Función | Estado |
|---|---|---|---|
| ESP32-C3 GPIO5 | MAX30102 SDA | Datos I²C | Implementado y probado |
| ESP32-C3 GPIO6 | MAX30102 SCL | Reloj I²C | Implementado y probado |
| ESP32-C3 GPIO4 | Entrada de control del módulo vibrador | Activación del motor mediante driver | Implementado y probado |
| ESP32-C3 GPIO8 | LED integrado de la placa | Indicador, activo en LOW | Implementado y probado |
| ESP32-C3 GPIO9 | Botón BOOT integrado | Cambio de pantalla OLED | Implementado en v1.4.1 |
| Batería LiPo (+), mediante JST-PH | Pin identificado 5V de ESP32-C3 | Alimentación directa utilizada | Montado; compatibilidad eléctrica pendiente |
| Batería LiPo (+), mediante JST-PH | Alimentación de MAX30102 y módulo motor | Alimentación compartida | Montado; rango de tensión pendiente |
| Batería LiPo (−) | GND común de las placas | Referencia eléctrica | Montado |
| Batería (+) → 100 kΩ | Nodo de medida GPIO0 | Resistencia superior del divisor | Implementado y probado |
| Nodo GPIO0 → 100 kΩ → GND | GPIO0 y tierra | Resistencia inferior del divisor | Implementado y probado |

La pantalla OLED está integrada en la placa ESP32-C3. Las direcciones I²C utilizadas como referencia son `0x3C` para la OLED y `0x57` para el MAX30102; se deben comprobar si se reemplaza alguno de los módulos.

## 5. Alimentación mediante batería desmontable

Se utilizó una batería LiPo de **3,7 V nominales y 150 mAh** con un **conector JST-PH macho en el cable de batería**. El cableado de la pulsera incorpora una **hembra JST-PH** que distribuye la alimentación hacia el pin marcado **5V** del ESP32-C3 y hacia los módulos MAX30102 y vibrador. Todos los dispositivos comparten GND.

El cargador se mantuvo **separado del circuito** y dispone de otra hembra JST-PH. Para cargar la batería se desconecta primero de la pulsera y después se conecta al cargador. Una vez finalizada la carga, se desconecta del cargador y se vuelve a conectar a la pulsera.

**ADVERTENCIA DE SEGURIDAD: no conectar la batería al circuito cuando el cable USB esté conectado al ESP32-C3.** Para programar o probar por USB, retirar previamente la batería. Antes de volver a conectar la batería, retirar el USB. Esta restricción corresponde al cableado directo utilizado, en el que no se ha demostrado aislamiento entre fuentes.

El pin marcado `5V` **no recibe 5 V regulados** en esta configuración: recibe el voltaje variable de la celda LiPo. El funcionamiento observado no valida el rango eléctrico del pin ni el de los módulos. Antes de reproducir el montaje en un taller, se requiere comprobar las especificaciones y valorar una alimentación regulada con protección adecuada. También se debe medir y confirmar la polaridad de ambos conectores JST-PH: su compatibilidad mecánica no garantiza polaridad coincidente.

## 6. Medición del voltaje de batería

El voltaje se obtiene mediante un divisor de dos resistencias iguales de 100 kΩ. La primera conecta el positivo de batería al nodo ADC GPIO0 y la segunda conecta ese nodo a GND. En condiciones ideales, el voltaje en GPIO0 es la mitad del voltaje de la batería: `V_GPIO0 = V_LiPo × 100 kΩ / (100 kΩ + 100 kΩ)`. El firmware estima el voltaje de batería multiplicando la lectura ADC por dos, con la calibración correspondiente.

La lectura de batería mostrada en la pantalla OLED **fue comparada con un multímetro y coincidió** dentro de la precisión observada durante la prueba. Este resultado valida la lectura utilizada en ese montaje; no equivale a una calibración metrológica ni a una estimación exacta del porcentaje de carga. El texto `CARGAR` informa sobre batería baja, pero no sustituye un circuito de protección contra descarga excesiva.

## 7. Medición de frecuencia cardíaca por I²C

El ESP32-C3 se comunica con el MAX30102 mediante SDA en GPIO5 y SCL en GPIO6. El sensor ilumina la piel y mide variaciones de luz reflejada; el firmware identifica cambios periódicos asociados al pulso y estima pulsaciones por minuto (BPM). La pantalla OLED integrada utiliza el mismo bus I²C, con una dirección distinta.

El mensaje **`SIN CONTACTO`** se adoptó para indicar que la señal óptica disponible no permite una medición válida. Esta expresión describe mejor el uso en muñeca que el mensaje anterior `SIN DEDO`. La detección es indirecta: no existe un interruptor que confirme físicamente que la pulsera está colocada.

## 8. Señalización y alerta

La alerta se configuró con un umbral inicial de **50 BPM** y una confirmación de lectura inferior al umbral durante **más de 5 segundos**. El motor vibra mediante el módulo controlador conectado a GPIO4. La secuencia definida consiste en **tres pulsos de 300 ms**, separados por **200 ms**, con una pausa de **1000 ms entre ciclos** y un máximo de **tres ciclos**. El LED integrado en GPIO8 trabaja con lógica invertida: `LOW` lo enciende. Su duración de alerta se gestiona de forma independiente, hasta **120 segundos** según la configuración de referencia.

La pérdida de contacto o recuperación de BPM cancela la alerta conforme a la lógica del firmware. La pantalla principal presenta BPM grandes y estado de batería abreviado; el botón BOOT permite consultar una pantalla secundaria con voltaje y umbral. El texto de batería crítica se cambió a **`CARGAR`**. La versión v1.4.1 fue un hito aprobado del desarrollo local. La versión de firmware probada indicada para esta edición es **v1.5.3**. El archivo `.ino` recuperado de v1.4.1 precede algunos cambios manuales de texto y tipografía y no debe presentarse como copia exacta de la versión final. La documentación específica de v1.5.3 corresponde al área Firmware.

## 9. Carga de la batería y protección

El cargador USB se utiliza únicamente con la batería **desconectada del prototipo**. La fotografía permite identificar un módulo cargador, pero no demuestra la corriente de carga configurada ni la existencia y topología de protección contra sobrecarga o descarga. La corriente de carga debe verificarse frente a la ficha técnica de la celda de 150 mAh antes de utilizar el cargador en prácticas estudiantiles.

No se debe dejar la batería cargando sin supervisión ni utilizar celdas hinchadas, dañadas o calientes. Se deben aislar las conexiones y evitar cortocircuitos. La selección de una solución de alimentación regulada y protegida continúa pendiente de validación eléctrica.

## 10. Procedimiento de reproducción y pruebas

1. Identificar físicamente los pines de la placa ESP32-C3 con el pinout adjunto; comprobar que la variante de placa corresponde a la utilizada.
2. Montar SDA del MAX30102 en GPIO5, SCL en GPIO6 y GND común. Conectar el control del módulo vibrador a GPIO4, sin conectar el motor directamente al pin.
3. Montar el divisor de 100 kΩ + 100 kΩ entre positivo de batería y GND, llevando el punto medio a GPIO0.
4. Preparar el cableado JST-PH, verificar con multímetro la polaridad de cada conector y comprobar ausencia de cortocircuitos, **sin fuentes conectadas**.
5. **Con batería desconectada**, conectar el USB y cargar el firmware correspondiente. Verificar pantalla, detección del MAX30102, LED y control de motor.
6. Desconectar el USB. Solo entonces conectar la batería a la hembra JST-PH de la pulsera; comprobar tensiones y temperatura de los módulos durante funcionamiento y vibración.
7. Comparar el voltaje OLED con el multímetro y comprobar el mensaje `SIN CONTACTO` al retirar la pulsera.
8. Comprobar que BOOT muestra la pantalla secundaria y que los avisos de alerta respetan los temporizadores. No provocar bradicardia en personas para probar la alerta.
9. Para cargar la batería, desconectarla del prototipo y conectarla exclusivamente al cargador externo; comprobar previamente corriente y polaridad.

## 11. Resultados verificados y pendientes

**Implementado y probado:** comunicación I²C con MAX30102, visualización OLED, GPIO4 y módulo vibrador, LED integrado GPIO8, lectura de voltaje por divisor resistivo contrastada con multímetro y funcionamiento general de v1.4.1 reportado como aprobado en su momento. **Firmware de referencia probado en la edición actual: v1.5.3**, según confirmación del responsable; sus pruebas detalladas deben consultarse en la documentación de Firmware.

**Implementado, con verificación eléctrica incompleta:** alimentación directa de la batería al pin rotulado 5V y a los módulos; separación manual entre circuito y cargador mediante JST-PH.

**Pendiente:** confirmar especificaciones de entrada de alimentación de cada placa, tensión nominal y consumo del motor, corriente de carga real y protección del cargador, polaridad documentada de los JST-PH, medidas eléctricas bajo carga y esquema de fabricación a nivel de componentes internos.

## 12. Material fotográfico y referencias del proyecto

- `esp32(1).jpg`: fotografía de la placa ESP32-C3 OLED.
- `esp32 pinout(1).png`: identificación de pines y funciones.
- `Max30102(1).jpg`: fotografía del sensor óptico.
- `Motor vibración 1(1).jpg`: fotografía del módulo vibrador.
- `Cargador de baterías(1).jpg`: fotografía del módulo cargador separado.
- `katrare-logo.png`: logotipo original utilizado en la presentación gráfica del documento.

Las fotografías son referencias de los módulos empleados, no imágenes que demuestren por sí solas el cableado físico terminado. El archivo SVG es un **diagrama de interconexiones**, no una fotografía ni una certificación eléctrica. El firmware, BLE y la aplicación web se documentan en sus áreas respectivas.

## 13. Descargo de responsabilidad (disclaimer)

**Naturaleza educativa y experimental.** PulsoAlert es un prototipo de aprendizaje, investigación y demostración tecnológica. **No es un dispositivo médico**, no ha sido presentado como equipo clínicamente validado y no debe utilizarse para diagnosticar, prevenir, tratar ni monitorizar clínicamente enfermedades o emergencias. Las lecturas de frecuencia cardíaca y sus alertas pueden ser inexactas, tardías o interrumpirse por movimiento, contacto insuficiente, condiciones de iluminación, batería u otros factores. No deben emplearse como única base para decisiones de salud.

**Seguridad eléctrica y batería.** Las conexiones descritas corresponden al montaje experimental realizado y no constituyen una certificación de seguridad ni una garantía de compatibilidad eléctrica. En particular, la batería LiPo se conectó directamente al pin rotulado `5V` y a otros módulos, sin regulación de 5 V documentada. **Nunca conectar simultáneamente la batería y el USB al ESP32-C3 en este montaje.** Para cargar, retirar la batería del circuito y utilizar el cargador independiente, previa verificación de polaridad, corriente de carga y protección. La reproducción debe realizarse con supervisión técnica y comprobación de las especificaciones de cada componente.

**Alcance documental.** Los esquemas representan interconexiones externas y no sustituyen los esquemáticos de los fabricantes. Las fotografías de catálogo no acreditan por sí mismas la instalación final. Las versiones de firmware **v1.5.3** y sitio web **v0.5.6** se identifican como referencias de esta edición; sus fuentes, ensayos específicos y funcionalidades se documentan en sus respectivas áreas. El presente manual no implica homologación, certificación ni autorización para uso médico o comercial.
