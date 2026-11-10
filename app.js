/* ==============================================================
   PULSOALERT WEB v0.5.1 - CONTROL DE INTERFAZ
   Aplicación educativa sin dependencias externas.

   IMPORTANTE:
   - Mantiene el simulador original y admite mediciones GATT v1.0 y v1.1.
   - El firmware BLE v1.5 todavía no está validado.
   ============================================================== */
'use strict';

// Valores iniciales usados solamente en la demostración.
const DEFAULTS = Object.freeze({ threshold: 50, cycles: 3, ledMinutes: 2 });

// Referencias a los controles de configuración del documento HTML.
const controls = {
  threshold: document.getElementById('threshold'),
  cycles: document.getElementById('cycles'),
  ledMinutes: document.getElementById('ledMinutes')
};

// Elementos donde se muestran los valores elegidos por el usuario.
const outputs = {
  threshold: document.getElementById('thresholdOutput'),
  cycles: document.getElementById('cyclesOutput'),
  ledMinutes: document.getElementById('ledMinutesOutput')
};

// Identificador del escenario visual seleccionado.
let currentScenario = 'normal';

/** Actualiza el texto de cada control sin enviar información al hardware. */
function updateOutputs() {
  const cycles = Number(controls.cycles.value);
  const minutes = Number(controls.ledMinutes.value);
  outputs.threshold.textContent = `${controls.threshold.value} BPM`;
  outputs.cycles.textContent = `${cycles} ${cycles === 1 ? 'ciclo' : 'ciclos'}`;
  outputs.ledMinutes.textContent = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
}

/** Presenta un escenario ficticio para evaluar los estados de la interfaz. */
function showScenario(scenario) {
  if (PulsoBLE.connected) return; // No sobrescribir datos reales con simulación.
  currentScenario = scenario;
  const scenarios = {
    normal: { bpm: '72', contact: 'Contacto detectado (simulado)', alert: 'Normal', description: 'Sin alerta activa (simulado)', css: '' },
    low: { bpm: '43', contact: 'Contacto detectado (simulado)', alert: 'FC baja', description: 'Confirmando umbral (simulado)', css: 'is-low' },
    alert: { bpm: '43', contact: 'Contacto detectado (simulado)', alert: '¡Alerta!', description: 'Vibración y LED (simulados)', css: 'is-alert' },
    'no-contact': { bpm: '--', contact: 'Sin contacto (simulado)', alert: 'Sin lectura', description: 'Medición no disponible (simulado)', css: '' }
  };
  const selected = scenarios[scenario];
  if (!selected) return;
  document.getElementById('bpmValue').textContent = selected.bpm;
  document.getElementById('contactValue').textContent = selected.contact;
  const alert = document.getElementById('alertValue');
  alert.textContent = selected.alert;
  alert.className = `alert-value ${selected.css}`.trim();
  document.getElementById('alertDescription').textContent = selected.description;
  document.querySelectorAll('[data-scenario]').forEach(button => {
    const active = button.dataset.scenario === scenario;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

/** Restablece los controles a sus valores iniciales de demostración. */
function resetSettings() {
  for (const [name, value] of Object.entries(DEFAULTS)) controls[name].value = String(value);
  updateOutputs();
  document.getElementById('settingsMessage').textContent = 'Valores de demostración restablecidos.';
}

/** Muestra el estado BLE sin cambiar el layout ni las clases estructurales. */
function setConnection(connected) {
  document.getElementById('connectionLabel').textContent = connected ? 'PulsoAlert conectado' : 'Modo demostración';
  document.getElementById('connectButton').textContent = connected ? 'Desconectar BLE' : 'Conectar BLE';
  document.getElementById('applyButton').textContent = connected ? 'Aplicar al dispositivo' : 'Aplicar a demostración';
  document.getElementById('notice').textContent = connected
    ? 'Conexión BLE activa. Se muestran datos recibidos del ESP32-C3.'
    : 'Modo demostración: datos simulados. No existe conexión con la pulsera.';
  document.getElementById('connectionDot').style.backgroundColor = connected ? '#2bbf73' : '';
  if (!connected) {
    document.querySelector('.metric:nth-child(2) .metric-value span').textContent = 'V';
    document.getElementById('batteryValue').textContent = '3.92';
    document.getElementById('batteryStatus').textContent = 'Estado: normal (simulado)';
    showScenario(currentScenario);
  }
}

/** Interpreta una medición BLE y distingue claramente datos reales de simulados. */
function showMeasurement(data) {
  const valid = data.contact === 1 && data.state === 1 && data.bpm > 0;
  document.getElementById('bpmValue').textContent = valid ? String(data.bpm) : '--';
  document.getElementById('contactValue').textContent = data.contact === 1 ? 'Contacto detectado' : 'Sin contacto';
  // Priorizar el voltaje medido (GATT v1.1); no estimar porcentaje desde voltios.
  // En GATT v1.0, conservar el porcentaje si el firmware lo reporta (0–100).
  const voltageAvailable = Number.isInteger(data.voltageMv) && data.voltageMv > 0;
  const percentageAvailable = Number.isInteger(data.battery) && data.battery >= 0 && data.battery <= 100;
  const batteryValue = document.getElementById('batteryValue');
  const batteryUnit = document.querySelector('.metric:nth-child(2) .metric-value span');
  const batteryStatus = document.getElementById('batteryStatus');
  if (voltageAvailable) {
    batteryValue.textContent = (data.voltageMv / 1000).toFixed(3);
    batteryUnit.textContent = 'V';
    batteryStatus.textContent = percentageAvailable
      ? `Voltaje medido · ${data.battery}% reportado por el dispositivo`
      : 'Voltaje medido · porcentaje sin calibrar';
  } else if (percentageAvailable) {
    batteryValue.textContent = String(data.battery);
    batteryUnit.textContent = '%';
    batteryStatus.textContent = 'Porcentaje reportado por el dispositivo · voltaje no disponible';
  } else {
    batteryValue.textContent = '--';
    batteryUnit.textContent = '';
    batteryStatus.textContent = 'Batería no disponible';
  }
  const alert = document.getElementById('alertValue');
  alert.textContent = data.alert === 1 ? '¡Alerta!' : valid ? 'Normal' : 'Sin lectura';
  alert.className = `alert-value ${data.alert === 1 ? 'is-alert' : ''}`.trim();
  document.getElementById('alertDescription').textContent = data.alert === 1 ? 'Alerta activa en el dispositivo' : valid ? 'Sin alerta activa' : 'Medición no disponible';
}

/** Conecta a petición del usuario; no solicita permisos al cargar la página. */
async function toggleBluetooth() {
  if (PulsoBLE.connected) { PulsoBLE.disconnect(); return; }
  if (!PulsoBLE.isAvailable()) {
    document.getElementById('notice').textContent = 'Web Bluetooth no disponible. Utiliza Chrome o Edge compatible con HTTPS. El simulador sigue funcionando.';
    return;
  }
  const button = document.getElementById('connectButton');
  button.disabled = true;
  try {
    const config = await PulsoBLE.connect({connection:setConnection,measurement:showMeasurement});
    for (const [key,value] of Object.entries(config)) controls[key].value = String(value);
    updateOutputs();
    document.getElementById('settingsMessage').textContent = 'Configuración actual leída del ESP32-C3.';
  } catch (error) {
    document.getElementById('notice').textContent = `No se estableció conexión BLE: ${error.message}`;
  } finally {button.disabled = false;}
}

// Los controles muestran sus valores en tiempo real.
Object.values(controls).forEach(control => control.addEventListener('input', updateOutputs));

// El botón de aplicar confirma únicamente los valores del simulador.
document.getElementById('applyButton').addEventListener('click', async () => {
  const message = document.getElementById('settingsMessage');
  if (!PulsoBLE.connected) {
    message.textContent = 'Configuración aplicada solo a la demostración. No se envió al ESP32-C3.';
    return;
  }
  const button = document.getElementById('applyButton');
  button.disabled = true;
  message.textContent = 'Enviando configuración y verificando persistencia...';
  try {
    const settings = Object.fromEntries(Object.entries(controls).map(([key,element]) => [key,Number(element.value)]));
    const results = await PulsoBLE.applySettings(settings);
    const success = results.filter(item => item.ok).map(item => item.key);
    const failure = results.find(item => !item.ok);
    message.textContent = failure
      ? `Confirmados: ${success.join(', ') || 'ninguno'}. Falló ${failure.key}: ${failure.error}. Comprueba los valores del dispositivo.`
      : 'Los tres parámetros fueron confirmados y releídos desde el dispositivo.';
    if (failure && PulsoBLE.connected) {
      const actual = await PulsoBLE.readSettings();
      for (const [key,value] of Object.entries(actual)) controls[key].value = String(value);
      updateOutputs();
    }
  } catch (error) { message.textContent = `Configuración no confirmada: ${error.message}`; }
  finally { button.disabled = false; }
});

document.getElementById('resetButton').addEventListener('click', resetSettings);

// Selección de escenarios de prueba visual.
document.querySelectorAll('[data-scenario]').forEach(button => {
  button.addEventListener('click', () => showScenario(button.dataset.scenario));
});

// No se solicita acceso Bluetooth hasta implementar el protocolo real.
document.getElementById('connectButton').addEventListener('click', toggleBluetooth);

// Estado inicial de la interfaz.
updateOutputs();
showScenario(currentScenario);

// Alterna únicamente la apariencia visual; no modifica parámetros del dispositivo.
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  const light = document.body.classList.toggle('light-theme');
  themeToggle.setAttribute('aria-pressed', String(light));
  themeToggle.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
});
