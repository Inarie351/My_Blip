const readline = require('readline');
const { CHARACTER_KEYS, CHARACTERS } = require('./characters');

// A manual line queue instead of rl.question()'s own queuing: with piped
// (non-TTY) input, readline can flush every buffered line as 'line' events
// before our async code has a chance to call question() again, silently
// dropping answers. Queuing them ourselves makes prompting order-safe
// regardless of whether stdin is a real TTY or piped input.
function createPrompter(rl) {
  const pending = [];
  const waiters = [];

  rl.on('line', (line) => {
    if (waiters.length) {
      waiters.shift()(line);
    } else {
      pending.push(line);
    }
  });

  return function ask(question) {
    process.stdout.write(question);
    return new Promise((resolve) => {
      if (pending.length) {
        resolve(pending.shift());
      } else {
        waiters.push(resolve);
      }
    }).then((answer) => answer.trim());
  };
}

/**
 * Interactive first-run configuration: pick a character, a size, and a name.
 * Any value already supplied in `prefill` (e.g. from CLI flags) is used
 * as-is and not prompted for.
 */
async function runSetupWizard(prefill = {}) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = createPrompter(rl);

  console.log('Bienvenue dans My_Blip ! Configurons ton compagnon.\n');

  try {
    let character = prefill.character;
    if (!CHARACTER_KEYS.includes(character)) {
      console.log('Choisis un personnage :');
      CHARACTER_KEYS.forEach((key, index) => {
        console.log(`  ${index + 1}) ${CHARACTERS[key].label}`);
      });

      let choice = null;
      while (choice === null) {
        const answer = await ask(`Ton choix [1-${CHARACTER_KEYS.length}] (1) : `);
        if (answer === '') {
          choice = 0;
          break;
        }
        const index = Number.parseInt(answer, 10) - 1;
        if (Number.isInteger(index) && index >= 0 && index < CHARACTER_KEYS.length) {
          choice = index;
        } else {
          console.log('Choix invalide, réessaie.');
        }
      }
      character = CHARACTER_KEYS[choice];
    }

    let size = Number.isInteger(prefill.size) ? prefill.size : null;
    while (size === null) {
      const answer = await ask('Quelle taille (1-3) [1] : ');
      if (answer === '') {
        size = 1;
        break;
      }
      const parsed = Number.parseInt(answer, 10);
      if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 3) {
        size = parsed;
      } else {
        console.log('Taille invalide, choisis un nombre entre 1 et 3.');
      }
    }

    let name = prefill.name;
    if (!name) {
      const answer = await ask(`Quel nom pour ton ${CHARACTERS[character].label.toLowerCase()} ? [Blip] : `);
      name = answer || 'Blip';
    }

    return { character, size, name };
  } finally {
    rl.close();
  }
}

module.exports = { runSetupWizard };
