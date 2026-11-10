/* ==============================================================
   PULSOALERT WEB v0.5.4 - CONTROL DE INTERFAZ
   Aplicación educativa sin dependencias externas.

   IMPORTANTE:
   - Mantiene el simulador original y admite mediciones GATT v1.0 y v1.1.
   - Integración probada con firmware v1.5.1 revisión A; reconexión pendiente.
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
let connectionBusy = false;
let settingsBusy = false;
let connectionEverEstablished = false;

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
  // Nunca sustituir telemetría real mientras exista conexión o una operación BLE en curso.
  if (PulsoBLE.connected || connectionBusy || settingsBusy) return;
  // Tras una desconexión, seleccionar un escenario reactiva explícitamente la demostración.
  // Los datos reales permanecen ocultos hasta esa acción del usuario.
  if (connectionEverEstablished) {
    connectionEverEstablished = false;
    renderConnection('demo');
    document.getElementById('settingsMessage').textContent = 'Modo demostración activado. Los ajustes no se envían al ESP32-C3.';
  }
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
  document.getElementById('settingsMessage').textContent = PulsoBLE.connected
    ? 'Controles restablecidos localmente; pulsa Aplicar al dispositivo para enviarlos.'
    : 'Valores de demostración restablecidos. No se enviaron al ESP32-C3.';
}

/**
 * Estados de conexión sin modificar la estructura visual aprobada.
 * El estado desconectado tras una sesión real nunca presenta mediciones antiguas
 * como si fueran actuales; la demostración solo vuelve por acción explícita.
 * @param {'demo'|'connecting'|'connected'|'disconnected'} state
 */
function renderConnection(state) {
  const labels = {
    demo: 'Modo demostración',
    connecting: 'Conectando BLE…',
    connected: 'PulsoAlert conectado',
    disconnected: 'PulsoAlert desconectado'
  };
  document.getElementById('connectionLabel').textContent = labels[state];
  document.getElementById('connectButton').textContent = state === 'connected' ? 'Desconectar BLE' : state === 'connecting' ? 'Conectando…' : 'Conectar BLE';
  document.getElementById('connectButton').disabled = connectionBusy || settingsBusy;
  document.getElementById('applyButton').textContent = state === 'connected' ? 'Aplicar al dispositivo' : 'Aplicar a demostración';
  document.getElementById('applyButton').disabled = connectionBusy || settingsBusy || state === 'disconnected';
  document.getElementById('resetButton').disabled = connectionBusy || settingsBusy || state === 'disconnected';
  document.getElementById('notice').textContent = ({
    demo: 'Modo demostración: datos simulados. No existe conexión con la pulsera.',
    connecting: 'Conectando con el ESP32-C3. Espera la lectura inicial.',
    connected: 'Conexión BLE activa. Se muestran datos recibidos del ESP32-C3.',
    disconnected: 'BLE desconectado. Mediciones ocultas. Pulsa Conectar BLE para reconectar o elige un escenario para volver a la demostración.'
  })[state];
  document.getElementById('connectionDot').style.backgroundColor = state === 'connected' ? '#2bbf73' : state === 'connecting' ? '#e3b341' : '';
  if (state === 'disconnected' || state === 'connecting') {
    document.getElementById('bpmValue').textContent = '--';
    document.getElementById('contactValue').textContent = state === 'connecting' ? 'Esperando medición real' : 'Sin conexión BLE';
    document.getElementById('batteryValue').textContent = '--';
    document.querySelector('.metric:nth-child(2) .metric-value span').textContent = '';
    document.getElementById('batteryStatus').textContent = 'Sin datos actuales de batería';
    const alert = document.getElementById('alertValue');
    alert.textContent = 'Sin datos';
    alert.className = 'alert-value';
    document.getElementById('alertDescription').textContent = 'Estado del dispositivo no disponible';
  } else if (state === 'demo') {
    document.querySelector('.metric:nth-child(2) .metric-value span').textContent = 'V';
    document.getElementById('batteryValue').textContent = '3.92';
    document.getElementById('batteryStatus').textContent = 'Estado: normal (simulado)';
    showScenario(currentScenario);
  }
}

/** Recibe los eventos del cliente GATT, incluidos cortes inesperados. */
function setConnection(connected) {
  if (connected) {
    connectionEverEstablished = true;
    renderConnection('connected');
  } else {
    renderConnection(connectionEverEstablished ? 'disconnected' : 'demo');
    if (connectionEverEstablished) {
      document.getElementById('settingsMessage').textContent = 'Dispositivo desconectado. Los ajustes no están disponibles hasta reconectar.';
    }
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
  if (connectionBusy || settingsBusy) return;
  if (PulsoBLE.connected) { PulsoBLE.disconnect(); return; }
  if (!PulsoBLE.isAvailable()) {
    document.getElementById('notice').textContent = 'Web Bluetooth no disponible. Utiliza Chrome o Edge compatible con HTTPS. El simulador sigue funcionando.';
    return;
  }
  connectionBusy = true;
  renderConnection('connecting');
  try {
    const config = await PulsoBLE.connect({connection:setConnection,measurement:showMeasurement});
    for (const [key,value] of Object.entries(config)) controls[key].value = String(value);
    updateOutputs();
    document.getElementById('settingsMessage').textContent = 'Configuración del dispositivo cargada.';
  } catch (error) {
    setConnection(false);
    document.getElementById('notice').textContent = `No se estableció conexión BLE: ${error.message}`;
  } finally {
    connectionBusy = false;
    document.getElementById('connectButton').disabled = false;
    document.getElementById('applyButton').disabled = connectionEverEstablished && !PulsoBLE.connected;
    document.getElementById('resetButton').disabled = connectionEverEstablished && !PulsoBLE.connected;
  }
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
  settingsBusy = true;
  const button = document.getElementById('applyButton');
  button.disabled = true;
  document.getElementById('connectButton').disabled = true;
  message.textContent = 'Guardando configuración…';
  try {
    const settings = Object.fromEntries(Object.entries(controls).map(([key,element]) => [key,Number(element.value)]));
    const results = await PulsoBLE.applySettings(settings);
    const success = results.filter(item => item.ok).map(item => item.key);
    const failure = results.find(item => !item.ok);
    message.textContent = failure
      ? `Confirmados: ${success.join(', ') || 'ninguno'}. Falló ${failure.key}: ${failure.error}. Comprueba los valores del dispositivo.`
      : 'Configuración guardada correctamente.';
    if (failure && PulsoBLE.connected) {
      const actual = await PulsoBLE.readSettings();
      for (const [key,value] of Object.entries(actual)) controls[key].value = String(value);
      updateOutputs();
    }
  } catch (error) { message.textContent = `Configuración no confirmada: ${error.message}`; }
  finally {
    settingsBusy = false;
    button.disabled = !PulsoBLE.connected;
    document.getElementById('connectButton').disabled = false;
  }
});

document.getElementById('resetButton').addEventListener('click', resetSettings);

// Selección de escenarios de prueba visual.
document.querySelectorAll('[data-scenario]').forEach(button => {
  button.addEventListener('click', () => showScenario(button.dataset.scenario));
});

// El permiso Bluetooth se solicita únicamente por interacción del usuario.
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
