# clichatgpt

ChatGPT CLI powered by **Google Chrome automation**.

⚠️ **macOS only**

`clichatgpt` allows you to interact with ChatGPT directly from the terminal by controlling a Chrome browser session.

---

## Features

- Chat with ChatGPT from the terminal
- Uses your existing ChatGPT login in Chrome
- No API key required
- Simple single-file CLI

---

## Requirements

This tool currently supports **macOS only**.

Required software:

- Google Chrome
- curl

Install Google Chrome:

https://www.google.com/chrome/

---

## Install

### Quick install

```bash
curl -fsSL https://raw.githubusercontent.com/RSKyo/clichatgpt/main/install.sh?nocache=$(date +%s) | bash
```

After installation, the command will be available as:

```
/usr/local/bin/clichatgpt
```

---

### Manual install

Clone the repository:

```bash
git clone https://github.com/RSKyo/clichatgpt
cd clichatgpt
```

Build the CLI:

```bash
build/build.sh
```

Install:

```bash
sudo cp dist/clichatgpt /usr/local/bin/
```

---

## Usage

Run:

```bash
clichatgpt
```

Example:

```bash
echo "Explain bash arrays" | clichatgpt
```

---

## How it works

`clichatgpt` automates **Google Chrome** on macOS.

It:

1. Opens or focuses a Chrome tab
2. Sends the prompt
3. Waits for the response
4. Returns the answer to the terminal

No API keys required.

---

## Development

Build the bundled CLI:

```bash
build/build.sh
```

The built binary will appear in:

```
dist/clichatgpt
```

---

## License

MIT
