/* ==============================================================
   PULSOALERT WEB v0.5.5 - CONTROL DE INTERFAZ
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
// Estado de batería independiente del escenario de frecuencia cardíaca.
let currentBatteryScenario = 'normal';
let connectionBusy = false;
let settingsBusy = false;
let connectionEverEstablished = false;

/**
 * Avisos orientativos para una LiPo 1S bajo carga (milivoltios).
 * No representan un porcentaje de carga ni sustituyen protección eléctrica.
 * Tres muestras filtradas consecutivas evitan reaccionar a picos aislados.
 * La histéresis de 80 mV evita cambios rápidos cerca de los límites.
 */
const BATTERY_LIMITS_MV = Object.freeze({ recharge: 3600, low: 3400, critical: 3200 });
const BATTERY_HYSTERESIS_MV = 80;
const BATTERY_CONFIRM_SAMPLES = 3;
const BATTERY_FILTER_WINDOW = 5;
const batteryLevels = ['normal', 'recharge', 'low', 'critical'];
let batterySamples = [];
let batteryLevel = 'normal';
let batteryCandidate = null;
let batteryCandidateCount = 0;

/** Descarta el historial al cambiar de fuente de datos (BLE/demostración). */
function resetBatteryWarnings() {
  batterySamples = [];
  batteryLevel = 'normal';
  batteryCandidate = null;
  batteryCandidateCount = 0;
  const card = document.getElementById('batteryCard');
  card.classList.remove('battery-recharge', 'battery-low', 'battery-critical');
}

/** Devuelve la mediana, resistente a valores puntuales extremos. */
function medianBatteryVoltage(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

/**
 * Clasifica el voltaje con histéresis respecto al estado confirmado.
 * Los límites se aplican al voltaje medido, no a un porcentaje estimado.
 * @param {number} mv Voltaje filtrado, en milivoltios.
 * @returns {'normal'|'recharge'|'low'|'critical'}
 */
function classifyBatteryVoltage(mv) {
  const thresholds = [BATTERY_LIMITS_MV.recharge, BATTERY_LIMITS_MV.low, BATTERY_LIMITS_MV.critical];
  let levelIndex = batteryLevels.indexOf(batteryLevel);
  // El empeoramiento usa el umbral nominal; la recuperación requiere +80 mV.
  while (levelIndex < thresholds.length && mv <= thresholds[levelIndex]) levelIndex++;
  while (levelIndex > 0 && mv > thresholds[levelIndex - 1] + BATTERY_HYSTERESIS_MV) levelIndex--;
  return batteryLevels[levelIndex];
}

/** Actualiza el estado tras tres mediciones filtradas consecutivas concordantes. */
function updateBatteryWarning(mv) {
  batterySamples.push(mv);
  if (batterySamples.length > BATTERY_FILTER_WINDOW) batterySamples.shift();
  const filtered = medianBatteryVoltage(batterySamples);
  const proposed = classifyBatteryVoltage(filtered);
  if (proposed === batteryLevel) {
    batteryCandidate = null;
    batteryCandidateCount = 0;
  } else {
    batteryCandidateCount = proposed === batteryCandidate ? batteryCandidateCount + 1 : 1;
    batteryCandidate = proposed;
    if (batteryCandidateCount >= BATTERY_CONFIRM_SAMPLES) {
      batteryLevel = proposed;
      batteryCandidate = null;
      batteryCandidateCount = 0;
    }
  }
  const card = document.getElementById('batteryCard');
  card.classList.toggle('battery-recharge', batteryLevel === 'recharge');
  card.classList.toggle('battery-low', batteryLevel === 'low');
  card.classList.toggle('battery-critical', batteryLevel === 'critical');
  return {
    normal: '',
    recharge: 'Recargar pronto.',
    low: 'Batería muy baja: recargar o apagar.',
    critical: 'Batería crítica: apagar el dispositivo.'
  }[batteryLevel];
}


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

/**
 * Presenta una batería ficticia sin alterar las mediciones BLE ni los parámetros del ESP32.
 * Los valores representan escenarios de prueba visual, no una estimación de autonomía.
 * @param {'normal'|'recharge'|'low'|'critical'} scenario
 */
function showBatteryScenario(scenario) {
  if (PulsoBLE.connected || connectionBusy || settingsBusy) return;
  const examples = {
    normal: { mv: 3920, label: 'Estado normal (simulado)' },
    recharge: { mv: 3520, label: 'Recargar pronto (simulado)' },
    low: { mv: 3320, label: 'Batería muy baja: recargar o apagar (simulado)' },
    critical: { mv: 3100, label: 'Batería crítica: apagar el dispositivo (simulado)' }
  };
  const selected = examples[scenario];
  if (!selected) return;
  if (connectionEverEstablished) {
    connectionEverEstablished = false;
    renderConnection('demo');
    document.getElementById('settingsMessage').textContent = 'Modo demostración activado. Los ajustes no se envían al ESP32-C3.';
  }
  currentBatteryScenario = scenario;
  // En el simulador se aplica el estado elegido directamente; el filtro de cinco
  // muestras y la histéresis siguen reservados para las mediciones BLE reales.
  resetBatteryWarnings();
  batteryLevel = scenario;
  const card = document.getElementById('batteryCard');
  card.classList.toggle('battery-recharge', scenario === 'recharge');
  card.classList.toggle('battery-low', scenario === 'low');
  card.classList.toggle('battery-critical', scenario === 'critical');
  document.getElementById('batteryValue').textContent = (selected.mv / 1000).toFixed(3);
  document.querySelector('.metric:nth-child(2) .metric-value span').textContent = 'V';
  document.getElementById('batteryStatus').textContent = selected.label;
  document.querySelectorAll('[data-battery-scenario]').forEach(button => {
    const active = button.dataset.batteryScenario === scenario;
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
    resetBatteryWarnings();
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
    resetBatteryWarnings();
    document.querySelector('.metric:nth-child(2) .metric-value span').textContent = 'V';
    showScenario(currentScenario);
    showBatteryScenario(currentBatteryScenario);
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
    const warning = updateBatteryWarning(data.voltageMv);
    const detail = percentageAvailable
      ? `Voltaje medido · ${data.battery}% reportado por el dispositivo`
      : 'Voltaje medido · porcentaje sin calibrar';
    batteryStatus.textContent = warning ? `${warning} ${detail}` : detail;
  } else if (percentageAvailable) {
    resetBatteryWarnings();
    batteryValue.textContent = String(data.battery);
    batteryUnit.textContent = '%';
    batteryStatus.textContent = 'Porcentaje reportado por el dispositivo · voltaje no disponible';
  } else {
    resetBatteryWarnings();
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

// La batería puede simularse independientemente de la frecuencia cardíaca.
document.querySelectorAll('[data-battery-scenario]').forEach(button => {
  button.addEventListener('click', () => showBatteryScenario(button.dataset.batteryScenario));
});

// El permiso Bluetooth se solicita únicamente por interacción del usuario.
document.getElementById('connectButton').addEventListener('click', toggleBluetooth);

// Estado inicial de la interfaz.
updateOutputs();
showScenario(currentScenario);
showBatteryScenario(currentBatteryScenario);

// Alterna únicamente la apariencia visual; no modifica parámetros del dispositivo.
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  const light = document.body.classList.toggle('light-theme');
  themeToggle.setAttribute('aria-pressed', String(light));
  themeToggle.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
});
