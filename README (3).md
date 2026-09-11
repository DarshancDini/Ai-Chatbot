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


No installation, npm packages, or backend server required.

## What I learned building this

- Making POST requests with `fetch()` and handling JSON responses
- Working with multimodal (text + image) API requests using base64 encoding
- Managing UI state in vanilla JS without a framework
- Basic error handling for failed network requests


