const fs = require('fs');
const path = require('path');
const os = require('os');

const MODEL_PATH = path.join(os.homedir(), '.blip', 'vosk-model');

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function loadDeps() {
  let mic;
  let vosk;

  try {
    mic = require('mic');
  } catch (_error) {
    throw new Error("Le module 'mic' est introuvable. Installe-le avec : npm install mic");
  }

  try {
    vosk = require('vosk');
  } catch (_error) {
    throw new Error("Le module 'vosk' est introuvable. Installe-le avec : npm install vosk");
  }

  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error(
      `Aucun modèle vosk trouvé dans ${MODEL_PATH}. Télécharge un modèle sur https://alphacephei.com/vosk/models ` +
        'et décompresse-le à cet emplacement.'
    );
  }

  return { mic, vosk };
}

/**
 * Start listening on the microphone and react to speech.
 *
 * `onSpeech(text)` fires for every recognized utterance.
 * `onWakeWord()` fires when the character's own name is heard inside an utterance.
 *
 * Returns a controller with `stop()`. Throws synchronously if the required
 * dependencies (mic, vosk, a downloaded model) are not available so the
 * caller can fall back to click mode with a helpful message.
 */
function startListening({ name, onSpeech, onWakeWord, onError }) {
  const { mic, vosk } = loadDeps();

  vosk.setLogLevel(-1);
  const model = new vosk.Model(MODEL_PATH);
  const recognizer = new vosk.Recognizer({ model, sampleRate: 16000 });
  const wakeWord = normalize(name || 'blip');

  const microphone = mic({ rate: '16000', channels: '1', debug: false, exitOnSilence: 0 });
  const micInputStream = microphone.getAudioStream();

  micInputStream.on('data', (data) => {
    try {
      if (recognizer.acceptWaveform(data)) {
        const { text } = recognizer.result();
        if (text) {
          const normalized = normalize(text);
          if (onSpeech) onSpeech(text);
          if (wakeWord && normalized.includes(wakeWord) && onWakeWord) onWakeWord();
        }
      }
    } catch (error) {
      if (onError) onError(error);
    }
  });

  micInputStream.on('error', (error) => {
    if (onError) onError(error);
  });

  microphone.start();

  return {
    stop() {
      try {
        microphone.stop();
      } catch (_error) {
        // already stopped
      }
      recognizer.free();
      model.free();
    },
  };
}

module.exports = { startListening, MODEL_PATH };
