# AI Chatbot using Gemini API

A simple chatbot web app built with **HTML, CSS, and JavaScript** that connects to **Google's Gemini API** to generate responses. Built as a beginner project to practice working with APIs, DOM manipulation, and async JavaScript.

## Features

- Clean chat interface with user and bot message bubbles
- Text input box with auto-resize and Enter-to-send
- Upload one or more images along with your message (multimodal input)
- Typing indicator while waiting for the AI's response
- Handles and displays API errors (e.g. invalid key, network issues)
- No frameworks or build tools — plain HTML/CSS/JS, so it's easy to read and run

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (Fetch API, async/await)
- Google Gemini API (`gemini-2.0-flash` model)

## How it works

1. The user pastes their own free Gemini API key into the app (kept only in browser memory for that session — never stored or sent anywhere except directly to Google's API).
2. When a message is sent, the app builds a request with the text and any attached images (converted to base64) and sends it to Gemini's `generateContent` endpoint.
3. The response is parsed and displayed in the chat window, and the full conversation is kept so the AI has context for follow-up questions.

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/gemini-chatbot.git
   cd gemini-chatbot
   ```
2. Open `index.html` in your browser (double-click it, or use a tool like VS Code's Live Server extension).
3. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).
4. Paste the key into the app when prompted and start chatting.

No installation, npm packages, or backend server required.

## Project Structure

```
gemini-chatbot/
├── index.html   # Page structure and layout
├── style.css    # All styling
├── script.js    # Chat logic + Gemini API calls
└── README.md
```

## What I learned building this

- Making POST requests with `fetch()` and handling JSON responses
- Working with multimodal (text + image) API requests using base64 encoding
- Managing UI state in vanilla JS without a framework
- Basic error handling for failed network requests

## Possible improvements

- Add a backend so the API key doesn't need to be entered in the browser
- Add markdown rendering for formatted AI responses
- Add streaming responses instead of waiting for the full reply
- Save chat history between sessions

## License

This project is open source and free to use for learning purposes.
