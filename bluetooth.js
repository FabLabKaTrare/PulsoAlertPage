/* PulsoAlert Web v0.5.0 — Cliente BLE educativo.
 * Contrato GATT v1.0 PROPUESTO; requiere firmware v1.5 compatible.
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
  let onMeasurement = () => {}, onConnection = () => {};
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const isAvailable = () => Boolean(navigator.bluetooth && window.isSecureContext);
  function measurement(view) {
    if (view.byteLength !== 6) throw new Error('Medición BLE con longitud incorrecta.');
    return { bpm: view.getUint16(0,true), contact: view.getUint8(2), battery: view.getUint8(3), alert: view.getUint8(4), state: view.getUint8(5) };
  }
  function status(view) {
    if (view.byteLength !== 4) throw new Error('Confirmación BLE con longitud incorrecta.');
    return { code: view.getUint8(0), parameter: view.getUint8(1), value: view.getUint16(2,true) };
  }
  function disconnectEvent() {
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
    const results = [];
    for (const key of Object.keys(ids)) {
      const value = Number(settings[key]);
      const [min,max] = limits[key];
      if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Valor inválido: ${key}`);
      const buffer = new ArrayBuffer(key === 'cycles' ? 1 : 2);
      const view = new DataView(buffer);
      if (key === 'cycles') view.setUint8(0,value); else view.setUint16(0,value,true);
      try {
        // Se verifica código, parámetro y valor vigente. Se concede un tiempo
        // breve para que el firmware persista en NVS y actualice CONFIG_STATUS.
        await characteristics[key].writeValueWithResponse(buffer);
        let confirmed = false;
        for (let attempt = 0; attempt < 15; attempt++) {
          await pause(200);
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
        results.push({key, ok:true});
      } catch (error) { results.push({key,ok:false,error:error.message}); break; }
    }
    return results;
  }
  return { isAvailable, connect, disconnect, readSettings, applySettings, get connected() {return connected;} };
})();
