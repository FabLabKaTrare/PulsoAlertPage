# Manual de construcción y funcionamiento — PulsoAlert WebBLE

**Fecha de creación documental:** 10 de noviembre de 2026  
**Responsable:** Ing. Harold Carvajal Álvarez  
**Institución:** Fab Lab Kä Träre · Universidad Estatal a Distancia (UNED), Costa Rica  
**Firmware de referencia probado:** PulsoAlert v1.5.3 (versión reportada para la documentación; las pruebas BLE descritas en el historial corresponden a las versiones allí indicadas)  
**Sitio web de referencia:** PulsoAlert Web v0.5.6  
**Sitio publicado:** https://fablabkatrare.github.io/PulsoAlertPage/  
**Naturaleza del documento:** Material técnico y educativo, versión documental 1.1

## 1. Propósito y alcance
Este documento describe la **construcción del sitio web**, su arquitectura, sus módulos, su protocolo BLE y la identidad visual aplicada. No sustituye el manual de cableado ni el sketch del firmware: esas áreas pertenecen a Hardware y Firmware. El producto es experimental y educativo, no médico.

## 2. Arquitectura general
La solución es una aplicación web estática desarrollada con **HTML, CSS y JavaScript**, publicada mediante **GitHub Pages** sobre HTTPS. El navegador ejecuta la interfaz y, cuando dispone de Web Bluetooth, actúa como cliente GATT. El ESP32-C3 actúa como periférico BLE y suministra telemetría; recibe cambios de configuración y los conserva en NVS según el contrato del firmware.

**Flujo principal:** MAX30102 y lógica del ESP32-C3 → característica `MEASUREMENT` → `bluetooth.js` → `app.js` → tarjetas HTML. **Configuración:** controles HTML → `app.js` → `bluetooth.js` → características GATT → ESP32-C3/NVS → `CONFIG_STATUS` y relectura → confirmación de la web.

## 3. Archivos de la versión v0.5.6
| Archivo | Responsabilidad |
|---|---|
| `index.html` | Semántica de página, estructura de tarjetas, controles, botones y textos. |
| `styles.css` | Variables visuales, temas, tarjetas, rejillas y diseño responsivo. |
| `app.js` | Estado de UI, simulación, renderizado, configuración y advertencias de batería. |
| `bluetooth.js` | Conexión GATT, lectura de mediciones, escritura y confirmación. |
| `assets/katrare-logo.png` | Logotipo original dorado Kä Träre. |
| `docs/*.md` | Contratos BLE e historial de cambios. |
| `README.md` | Presentación y orientación del paquete. |

**Dependencias:** no se observan frameworks JS ni librerías CSS externas en el `index.html` examinado. Se usan APIs nativas del navegador, incluida Web Bluetooth. No hay proceso de compilación de frontend ni gestor de paquetes exigido por los archivos disponibles.

## 4. Estructura de la interfaz
La cabecera contiene el logotipo, nombre del producto y selector de tema. La introducción presenta el título y el panel de conexión. La rejilla `metrics` muestra tres tarjetas (BPM, batería, alerta). La rejilla `content-grid` contiene dos paneles: configuración y simulador. Una nota final advierte sobre el alcance experimental. Los IDs del HTML (`bpmValue`, `batteryValue`, `alertValue`, `threshold`, `cycles`, `ledMinutes`, etc.) son puntos de integración para `app.js`.

![Captura real de la interfaz completa](imagenes/captura_pagina_completa.png)

## 5. Identidad visual Kä Träre
La línea visual aprobada utiliza **fondo negro**, tarjetas **grafito azulado**, bordes **dorado tenue**, acento **amarillo dorado**, tipografía clara y componentes sobrios. El logo debe reutilizarse desde `assets/katrare-logo.png`, sin redibujarlo ni cambiarlo por otra marca.

| Token / uso | Tema oscuro | Tema claro |
|---|---|---|
| Fondo | `#000000` | `#F6F7F9` |
| Tarjetas | `#12171F` | `#FFFFFF` |
| Texto | `#F5F6F8` | `#11151B` |
| Texto secundario | `#B8BEC9` | `#59616E` |
| Borde | `#423A18` | `#E2E4E8` |
| Acento principal | `#FFCC00` | Dorado de la identidad |
| Acción primaria | `#FFCD4B` | Dorado de la identidad |
| Éxito | `#7DE0B0` | `#18784C` |
| Advertencia | `#FFCA4B` | `#A16A00` |
| Peligro | `#FF6972` | `#C82B37` |

La tipografía CSS declarada es `system-ui, -apple-system, "Segoe UI", Arial, sans-serif`; no se incluye una fuente web externa. La jerarquía usa títulos de panel de aproximadamente 22 px y peso 800, valores BPM de 48 px en escritorio, etiquetas pequeñas en mayúsculas con espaciado, y textos de ayuda compactos. Las tarjetas usan radio aproximado de 13 px y no dependen de sombras decorativas. El contenedor máximo es de 1170 px; las tarjetas forman tres columnas y los paneles inferiores dos (`1.15fr 1fr`). Existen ajustes responsivos a 850, 650 y 520 px. El tema claro se implementa mediante `body.light-theme`, **sin sustituir la hoja CSS estructural**.

![Detalle de tarjetas y diseño visual](imagenes/captura_tarjetas.png)

## 6. Servicio y características GATT
**Nombre anunciado:** `PulsoAlert`  
**Servicio:** `f0a10000-7b4d-4c6a-9e20-3b8c8f100001`

| Característica | UUID | Tipo / operación |
|---|---|---|
| MEASUREMENT | `f0a10001-7b4d-4c6a-9e20-3b8c8f100001` | Read, Notify; 6 u 8 bytes |
| BPM_THRESHOLD | `f0a10002-7b4d-4c6a-9e20-3b8c8f100001` | Read, Write; uint16 LE |
| VIBRATION_CYCLES | `f0a10003-7b4d-4c6a-9e20-3b8c8f100001` | Read, Write; uint8 |
| LED_DURATION | `f0a10004-7b4d-4c6a-9e20-3b8c8f100001` | Read, Write; uint16 LE, minutos |
| CONFIG_STATUS | `f0a10005-7b4d-4c6a-9e20-3b8c8f100001` | Read, Notify; 4 bytes |

`MEASUREMENT` utiliza bytes 0–1 BPM (uint16 LE), 2 contacto (0/1), 3 porcentaje de batería (255 = desconocido), 4 alerta (0/1), 5 estado de medición (0 esperando, 1 midiendo, 2 señal inválida). En GATT v1.1 los bytes 6–7 representan voltaje en mV (uint16 LE; 0 = no disponible). La web admite paquetes de 6 y 8 bytes. **No convierte voltaje a porcentaje sin calibración.**

`CONFIG_STATUS`: byte 0 código (0 inicial, 1 guardado, 2 inválido, 3 error NVS); byte 1 parámetro (0 ninguno, 1 umbral, 2 ciclos, 3 LED); bytes 2–3 valor vigente (uint16 LE).

## 7. Proceso de conexión y configuración
`bluetooth.js` solicita un dispositivo mediante `navigator.bluetooth.requestDevice` filtrando el servicio PulsoAlert. Tras conectar GATT obtiene las cinco características, se suscribe a notificaciones de medición y estado, lee parámetros y obtiene una medición inicial. El navegador requiere HTTPS y un gesto del usuario para iniciar la búsqueda.

Para guardar parámetros, `applySettings()` valida rangos (30–120 BPM, 1–5 ciclos, 1–10 minutos), escribe **secuencialmente**, espera `CONFIG_STATUS` (hasta 15 intentos con pausa de 200 ms) y relee la característica. Solo entonces la web considera el valor confirmado. No hay transacción atómica entre los tres parámetros. El firmware es responsable de la persistencia NVS.

## 8. Simuladores y separación de datos
`app.js` mantiene escenarios de frecuencia cardíaca **Normal, FC baja, Alerta y Sin contacto** y escenarios de batería **Normal, Recargar pronto, Muy baja y Crítica**. Son pruebas visuales; no envían comandos al hardware. Cuando existe BLE conectado, se prioriza telemetría real. Tras desconexión, se ocultan mediciones antiguas; seleccionar un escenario vuelve al modo demostración. El estado de tema claro/oscuro se aplica sin reconstruir la estructura HTML.

![Paneles de configuración y simulación](imagenes/captura_simuladores.png)

## 9. Advertencias de batería
La web recibe milivoltios y muestra voltios. El código v0.5.6 utiliza clasificación de estados, mediana de hasta cinco lecturas, confirmación de tres lecturas filtradas y una histéresis de 80 mV. Los umbrales documentados son orientativos: >3,60 V normal; 3,40–3,60 V recarga; 3,20–<3,40 V muy baja; <=3,20 V crítica. **La advertencia web no es una desconexión eléctrica ni un sistema de protección autónomo.** La placa de protección de la batería y el firmware deben tratarse en la documentación correspondiente.

## 10. Publicación y reproducción
1. Obtenga el **ZIP original v0.5.6**; descomprímalo sin modificar nombres ni estructura.
2. Mantenga `index.html`, `styles.css`, `app.js`, `bluetooth.js` y las carpetas `assets/` y `docs/` en la raíz del repositorio.
3. Publique mediante GitHub Pages con la rama `main` y carpeta raíz `/`, según la configuración del repositorio.
4. Compruebe que `index.html` carga CSS y JS por rutas relativas y que el logotipo se muestra.
5. Abra la URL HTTPS, pruebe selector de tema y simuladores sin hardware.
6. Con un ESP32-C3 que implemente el contrato GATT, pruebe conexión, medición, configuración, reinicio y relectura.
7. Verifique la presentación en Windows y Android compatibles; la disponibilidad Web Bluetooth varía por plataforma.

No se requiere un backend, base de datos ni compilador frontend. Para pruebas locales, un servidor HTTP simple puede mostrar la interfaz, pero el acceso a BLE requiere un contexto seguro compatible.

## 11. Evolución y validación
| Versión | Cambio relevante | Evidencia en conversación |
|---|---|---|
| v0.4.1 | Base visual Kä Träre aprobada | Diseño y simulador aprobados |
| v0.5.0 | Preparación de BLE | Paquete entregado; conexión real posterior |
| v0.5.1 | GATT v1.1, voltaje y configuración | Usuario confirmó BLE, lectura, envío y persistencia tras reinicio |
| v0.5.2 | Estados y desconexión | Problema del simulador tras desconectar |
| v0.5.3 | Retorno al simulador | Corrección implementada; validación integral no confirmada |
| v0.5.4 | Limpieza de mensajes | Paquete entregado; validación final no confirmada |
| v0.5.5 | Advertencias de batería | Implementadas; umbrales físicos pendientes de validar |
| v0.5.6 | Simulador de batería | Entregado; prueba final no confirmada |

**Incidencia histórica resuelta:** el error «Medición BLE con longitud incorrecta» se abordó aceptando longitudes de 6 y 8 bytes. **Pendiente:** ensayos sistemáticos de reconexión, pruebas cruzadas de navegadores, calibración de batería y validación integral de v0.5.6.

## 12. Seguridad, límites y mantenimiento
El sitio no autentica al periférico BLE según el contrato disponible; utilizarlo en entornos educativos controlados. No exponer el prototipo como dispositivo clínico. Mantener separados datos reales y simulados. Registrar versiones de firmware y web durante las pruebas. Si se modifican UUID o formatos binarios, actualizar conjuntamente firmware, `bluetooth.js`, contratos y manuales. Para conservar el diseño, realizar cambios puntuales en CSS y nunca reemplazar `styles.css` por una plantilla genérica.

## 13. Referencias de reproducción
- Código real: `PulsoAlert_Web_v0.5.6_Ka_Trare.zip` (paquete original de esta conversación).
- Contratos: `docs/PulsoAlert_Contrato_BLE_v1.0.md` y `docs/PulsoAlert_Contrato_BLE_v1.1.md`.
- Guía visual: `PulsoAlert_Guia_Identidad_Visual_Ka_Trare.md`.
- Sitio: https://fablabkatrare.github.io/PulsoAlertPage/
- Las capturas insertadas son fotografías digitales de la interfaz proporcionadas por el usuario, no mockups generados.

## Aviso de responsabilidad y limitaciones (disclaimer)

PulsoAlert es un **prototipo experimental y educativo** desarrollado en el Fab Lab Kä Träre de la UNED. No es un dispositivo médico, no cuenta con certificación sanitaria y no está destinado a diagnosticar, prevenir, tratar ni monitorizar clínicamente enfermedades. Las mediciones de frecuencia cardíaca pueden presentar errores por movimiento, colocación del sensor, calidad de contacto y condiciones ambientales; no deben emplearse para tomar decisiones médicas ni sustituir equipos clínicos.

Los valores del simulador son ficticios y no representan mediciones de una persona. Los umbrales de batería son orientativos y requieren validación con la celda, el circuito de protección y las condiciones reales de funcionamiento. Las advertencias de la página web no sustituyen los mecanismos físicos de protección ni garantizan el apagado del dispositivo.

La reproducción y utilización del prototipo requieren supervisión adecuada, prácticas seguras de manipulación de baterías LiPo y verificación de conexiones y polaridades. Las características de Bluetooth dependen de la compatibilidad del navegador, el sistema operativo y el firmware. La documentación describe el estado disponible al 10 de noviembre de 2026 y no constituye garantía de funcionamiento para otras configuraciones.

