/* PulsoAlert Web v0.5.2 — Cliente BLE educativo.
 * Contratos GATT v1.0 (6 bytes) y v1.1 (8 bytes).
 * Ninguna escritura se considera persistida sin confirmación y relectura.
 */
'use strict';
const PulsoBLE = (() => {
  const SERVICE = 'f0a10000-7b4d-4c6a-9e20-3b8c8f100001';
  const BASE = 'f0a1000';
  const uuid = number => `${BASE}${number}-7b4d-4c6a-9e20-3b8c8f100001`;
  const names = { measurement: 1, threshold: 2, cycles: 3, ledMinutes: 4, status: 5 };
  const ids = { threshold: 1, cycles: 2, ledMinutes: 3 };
  const limits = { threshold: [30,120], cycles: [1,5], ledMinutes: [1,10] };
  let device = null, server = null, characteristics = {}, connected = false;
  let connectionGeneration = 0;
  let onMeasurement = () => {}, onConnection = () => {};
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const isAvailable = () => Boolean(navigator.bluetooth && window.isSecureContext);
  /**
   * Decodifica la telemetría recibida por GATT.
   * @param {DataView} view - Valor binario recibido del ESP32-C3.
   * @returns {{bpm:number,contact:number,battery:number,alert:number,state:number,voltageMv:number|null}}
   *   voltageMv es null en GATT v1.0 (6 bytes) o si v1.1 reporta 0 mV.
   * @throws {Error} Cuando el paquete no tiene exactamente 6 u 8 bytes.
   * Los campos multibyte son uint16 little-endian; no se infiere porcentaje desde voltaje.
   */
  function measurement(view) {
    if (view.byteLength !== 6 && view.byteLength !== 8) {
      throw new Error(`Medición BLE con longitud incorrecta (${view.byteLength} bytes; se esperan 6 u 8).`);
    }
    const mv = view.byteLength === 8 ? view.getUint16(6, true) : 0;
    return {
      bpm: view.getUint16(0, true),
      contact: view.getUint8(2),
      battery: view.getUint8(3), // 255 = porcentaje desconocido.
      alert: view.getUint8(4),
      state: view.getUint8(5),
      voltageMv: mv > 0 ? mv : null
    };
  }
  function status(view) {
    if (view.byteLength !== 4) throw new Error('Confirmación BLE con longitud incorrecta.');
    return { code: view.getUint8(0), parameter: view.getUint8(1), value: view.getUint16(2,true) };
  }
  /** Invalida las operaciones pendientes y notifica una desconexión real. */
  function disconnectEvent() {
    connectionGeneration++;
    connected = false; server = null; characteristics = {};
    onConnection(false);
  }
  async function connect(callbacks = {}) {
    if (!isAvailable()) throw new Error('Web Bluetooth requiere HTTPS y un navegador compatible.');
    onMeasurement = callbacks.measurement || onMeasurement;
    onConnection = callbacks.connection || onConnection;
    // requestDevice debe ejecutarse desde el clic explícito del usuario.
    device = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE] }] });
    device.removeEventListener('gattserverdisconnected', disconnectEvent);
    device.addEventListener('gattserverdisconnected', disconnectEvent);
    try {
      server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE);
      const entries = await Promise.all(Object.entries(names).map(async ([key, id]) => [key, await service.getCharacteristic(uuid(id))]));
      characteristics = Object.fromEntries(entries);
      await characteristics.measurement.startNotifications();
      characteristics.measurement.addEventListener('characteristicvaluechanged', event => {
        try { onMeasurement(measurement(event.target.value)); } catch (error) { console.warn(error); }
      });
      await characteristics.status.startNotifications();
      connected = true;
      onConnection(true);
      const config = await readSettings();
      onMeasurement(measurement(await characteristics.measurement.readValue()));
      return config;
    } catch (error) { if (device?.gatt?.connected) device.gatt.disconnect(); disconnectEvent(); throw error; }
  }
  function disconnect() { if (device?.gatt?.connected) device.gatt.disconnect(); else disconnectEvent(); }
  async function readSettings() {
    if (!connected) throw new Error('No existe conexión BLE.');
    const result = {};
    for (const key of Object.keys(ids)) {
      const value = await characteristics[key].readValue();
      result[key] = key === 'cycles' ? value.getUint8(0) : value.getUint16(0,true);
    }
    return result;
  }
  async function applySettings(settings) {
    if (!connected) throw new Error('No existe conexión BLE.');
    const generation = connectionGeneration;
    const results = [];
    for (const key of Object.keys(ids)) {
      const value = Number(settings[key]);
      const [min,max] = limits[key];
      if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Valor inválido: ${key}`);
      const buffer = new ArrayBuffer(key === 'cycles' ? 1 : 2);
      const view = new DataView(buffer);
      if (key === 'cycles') view.setUint8(0,value); else view.setUint16(0,value,true);
      try {
        if (!connected || generation !== connectionGeneration) throw new Error('Conexión BLE interrumpida.');
        // Se verifica código, parámetro y valor vigente. Se concede un tiempo
        // breve para que el firmware persista en NVS y actualice CONFIG_STATUS.
        await characteristics[key].writeValueWithResponse(buffer);
        let confirmed = false;
        for (let attempt = 0; attempt < 15; attempt++) {
          await pause(200);
          if (!connected || generation !== connectionGeneration) throw new Error('Conexión BLE interrumpida.');
          const ack = status(await characteristics.status.readValue());
          if (ack.parameter === ids[key]) {
            if (ack.code === 2 || ack.code === 3) throw new Error(`El dispositivo rechazó ${key} (código ${ack.code}).`);
            if (ack.code === 1 && ack.value === value) { confirmed = true; break; }
          }
        }
        if (!confirmed) throw new Error(`Sin confirmación de ${key}.`);
        const readBack = await characteristics[key].readValue();
        const actual = key === 'cycles' ? readBack.getUint8(0) : readBack.getUint16(0,true);
        if (actual !== value) throw new Error(`La relectura de ${key} no coincide.`);
        results.push({key, ok:true, value:actual, confirmation:1});
      } catch (error) { results.push({key,ok:false,error:error.message}); break; }
    }
    return results;
  }
  return { isAvailable, connect, disconnect, readSettings, applySettings, get connected() {return connected;} };
})();
