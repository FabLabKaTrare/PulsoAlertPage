/* ==============================================================
   PULSOALERT WEB v0.1 - CONTROL DE INTERFAZ
   Aplicación educativa sin dependencias externas.

   IMPORTANTE:
   - Esta versión es un PROTOTIPO VISUAL con datos simulados.
   - No descubre ni modifica todavía dispositivos ESP32-C3.
   - El firmware BLE v1.5 deberá definir servicio, características,
     formato de datos y validaciones antes de habilitar la escritura.
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

/** Comprueba si el navegador expone Web Bluetooth; no conecta aún. */
function explainBluetoothStatus() {
  const notice = document.getElementById('notice');
  const supported = Boolean(navigator.bluetooth) && window.isSecureContext;
  notice.textContent = supported
    ? 'El navegador admite Web Bluetooth. La conexión con PulsoAlert estará disponible cuando definamos e instalemos el firmware BLE v1.5.'
    : 'Web Bluetooth no está disponible en este navegador o contexto. Prueba Chrome/Edge compatibles desde HTTPS o localhost. La demostración sigue funcionando.';
  document.getElementById('connectionLabel').textContent = 'Sin conexión BLE';
}

// Los controles muestran sus valores en tiempo real.
Object.values(controls).forEach(control => control.addEventListener('input', updateOutputs));

// El botón de aplicar confirma únicamente los valores del simulador.
document.getElementById('applyButton').addEventListener('click', () => {
  document.getElementById('settingsMessage').textContent =
    'Configuración aplicada solo a la demostración. No se envió al ESP32-C3.';
});

document.getElementById('resetButton').addEventListener('click', resetSettings);

// Selección de escenarios de prueba visual.
document.querySelectorAll('[data-scenario]').forEach(button => {
  button.addEventListener('click', () => showScenario(button.dataset.scenario));
});

// No se solicita acceso Bluetooth hasta implementar el protocolo real.
document.getElementById('connectButton').addEventListener('click', explainBluetoothStatus);

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
