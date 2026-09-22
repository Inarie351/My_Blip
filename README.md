# My_Blip

A pixel-art companion that lives in your terminal. It sits in its own `tmux` pane, wanders around while you work, and reacts to you — mouse clicks by default, or your voice when you switch it into sound mode.

## What it does

- You start it with one command. On first run, it walks you through picking a character, a size, and giving your character a name.
- After that, it shows up in a dedicated `tmux` pane next to your normal shell — you keep working in your main pane exactly as before.
- By default, it reacts to mouse clicks inside its pane.
- Switch it to sound mode and it reacts to your voice, including recognizing when you say its own name.
- It keeps running until you stop it — no need to reconfigure every time.

## Requirements

- **Node.js** (v18+)
- **tmux** — required so the character can live in its own pane while your shell stays usable. Not available natively on Windows (use WSL).
- **sox** — required for microphone capture (`brew install sox` on macOS, `apt install sox` on Linux).

## Usage

```bash
# first run: walks through configuration (character, size, name)
blip start

# reacts to mouse clicks in its pane (default)
blip start

# reacts to your voice, including its own name
blip start --sound

# while in sound mode, press "s" to go back to click mode
# (the program keeps running — this does not exit it)

# stop the character from another terminal
blip stop
```

## Features

- **CLI-driven setup** — `blip start` handles first-run configuration and every launch after that.
- **Persistent, visible process** — runs in the foreground inside its own `tmux` pane so it's always on screen, not a hidden background daemon.
- **Clean stop/start** — a PID file tracks the running process so `blip stop` (or `Ctrl+C`) shuts it down cleanly.
- **Click-reactive by default** — responds to mouse clicks inside its pane.
- **Voice-reactive mode** — pass `--sound` to switch input from clicks to your microphone.
- **Name recognition** — in sound mode, the character can recognize when you say the name you gave it during setup.
- **Non-destructive mode switch** — pressing a key during a sound session returns to click mode without exiting the program.
- **Multiple characters** — pick from several pixel-art characters at setup, each with its own look.
- **Wanders while you work** — moves around inside the bounds of its `tmux` pane, independent of your main shell.

## Tech stack

| Need | Choice | Why |
|---|---|---|
| Language / runtime | Node.js | Mature CLI ecosystem, easy one-command install via npm |
| CLI / flags | [`commander`](https://www.npmjs.com/package/commander) | Simple, standard way to handle `start`, `stop`, `--sound` |
| Rendering + mouse/keyboard capture (inside its pane) | [`blessed`](https://www.npmjs.com/package/blessed) (or the maintained fork `neo-blessed`) | Handles the screen buffer, mouse click detection, and key capture in one library |
| Pixel art rendering | Unicode half-blocks (`▀`) + 24-bit ANSI color | Gets close-to-square "pixels" out of rectangular terminal cells, in full color |
| Pane management | `tmux` (shelled out to from Node) | The only reliable way to keep the character visible in its own space while the main shell stays usable |
| Configuration storage | Plain JSON (`~/.blip/config.json`) | Simple enough not to need a dedicated config library |
| Start/stop control | PID file (`~/.blip/blip.pid`) | Lightweight process tracking, no extra dependency |
| Microphone capture | [`mic`](https://www.npmjs.com/package/mic) (wraps `sox`) | Reliable continuous audio streaming from Node |
| Name recognition | [`vosk`](https://www.npmjs.com/package/vosk) | Offline speech-to-text — no internet dependency, no API key, good enough to spot one word in a stream |
| Distribution | npm package with a `bin` entry | Installable anywhere with `npm install -g my_blip` |

## Open questions / next steps

- Finalize the exact sprite format and palette for each character (grid size, color list).
- Decide the wake-word matching approach on top of `vosk`'s transcription (exact match vs. fuzzy match on the character's name).
- Confirm the `tmux` pane layout (position, default size) for the character's pane.
- Windows support is limited to WSL, since `tmux` isn't available natively — worth deciding if that's acceptable for v1.

## Notes

- No `pm2`: it manages background processes with no attached terminal, which can't display anything. This project needs the character visible, so it runs in the foreground inside its `tmux` pane instead.
- No cloud speech API: keeps the tool free to run, offline-capable, and simple to install (no API keys to configure).
