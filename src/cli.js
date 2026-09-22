const path = require('path');
const { Command } = require('commander');
const {
  ensureConfig,
  hasConfig,
  loadConfig,
  readPidFile,
  removePidFile,
  isProcessAlive,
} = require('./config');
const { startRuntime } = require('./runtime');
const { runSetupWizard } = require('./wizard');
const { CHARACTER_KEYS } = require('./characters');
const tmux = require('./tmux');

const RENDER_SCRIPT = path.join(__dirname, '..', 'bin', 'blip.js');

async function resolveConfig(options) {
  const overrides = {
    name: options.name,
    character: options.character,
    size: options.size ? Number.parseInt(options.size, 10) : undefined,
    sound: options.sound ? true : undefined,
  };

  if (!hasConfig()) {
    const answers = await runSetupWizard(overrides);
    return ensureConfig({ ...answers, sound: overrides.sound || false });
  }

  return ensureConfig(overrides);
}

async function startAction(options) {
  const existingPid = readPidFile();
  if (isProcessAlive(existingPid)) {
    console.log(`My_Blip tourne déjà (PID ${existingPid}). Utilise "blip stop" pour l'arrêter d'abord.`);
    return;
  }
  if (existingPid) {
    removePidFile();
  }

  const config = await resolveConfig(options);
  console.log(`Lancement de My_Blip pour ${config.name} (${config.character}).`);

  const renderArgs = [RENDER_SCRIPT, 'render'];

  if (!tmux.isTmuxAvailable()) {
    console.log("tmux est introuvable : lancement dans le terminal courant (pas d'isolation en pane).");
    startRuntime(config);
    return;
  }

  try {
    if (tmux.isInsideTmux()) {
      tmux.splitPaneHere(process.execPath, renderArgs);
      console.log('My_Blip est lancé dans un nouveau pane tmux, à côté de ton shell.');
    } else {
      console.log('Ouverture d’une session tmux (ton shell + My_Blip). Détache-toi avec Ctrl-b puis d.');
      await tmux.launchSessionWithShell(process.execPath, renderArgs);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

function renderAction() {
  const config = loadConfig();
  if (!config) {
    console.error('Aucune configuration trouvée. Lance "blip start" depuis un terminal normal d’abord.');
    process.exit(1);
  }
  startRuntime(config);
}

function stopAction() {
  const pid = readPidFile();

  if (!isProcessAlive(pid)) {
    console.log('Aucun processus Blip actif trouvé.');
    removePidFile();
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    removePidFile();
    console.log(`Arrêt du processus Blip (PID ${pid}).`);
  } catch (_error) {
    console.log('Impossible d’arrêter le processus Blip.');
  }
}

function createProgram() {
  const program = new Command();

  program
    .name('blip')
    .description('Companion animé dans le terminal')
    .version('0.1.0');

  program
    .command('start')
    .description('Lance le personnage dans le terminal')
    .option('-n, --name <name>', 'Nom du personnage')
    .option('-c, --character <character>', `Personnage à afficher (${CHARACTER_KEYS.join(', ')})`)
    .option('-s, --size <size>', 'Taille d’affichage')
    .option('--sound', 'Active le mode sonore')
    .action(startAction);

  program
    .command('render', { hidden: true })
    .description('Usage interne : affiche le personnage (lancé automatiquement dans le pane tmux)')
    .action(renderAction);

  program
    .command('stop')
    .description('Arrête le processus Blip actif')
    .action(stopAction);

  return program;
}

module.exports = { createProgram };
