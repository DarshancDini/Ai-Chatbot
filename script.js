/* =====================================================
   AI Chatbot using Google Gemini API
   -----------------------------------------------------
   This is a simple beginner-level project that:
   1. Lets the user type a message and/or upload images
   2. Sends the message to Google's Gemini API
   3. Shows the AI's reply in a chat window

   Note: The API key is entered by the user and stored
   only in memory (a normal JS variable) for this tab.
   It is never saved to a file, server, or localStorage.
===================================================== */

// ---------- Variables to keep track of app state ----------
let apiKey = "";              // holds the Gemini API key once the user saves it
let uploadedImages = [];      // list of images the user has attached but not sent yet
let conversationHistory = []; // full chat history, sent with every request for context

// The Gemini model we are using (fast + supports text and images)
const GEMINI_MODEL = "gemini-2.0-flash";

// ---------- Grab all the HTML elements we need ----------
const apiKeySection = document.getElementById("apiKeySection");
const apiKeyToggleBtn = document.getElementById("apiKeyToggleBtn");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");
const statusText = document.getElementById("statusText");

const chatMessages = document.getElementById("chatMessages");
const emptyState = document.getElementById("emptyState");

const userMessageInput = document.getElementById("userMessageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

const uploadImageBtn = document.getElementById("uploadImageBtn");
const imageFileInput = document.getElementById("imageFileInput");
const imagePreviewRow = document.getElementById("imagePreviewRow");


// =====================================================
// 1. API key handling
// =====================================================

// Show/hide the API key panel when the header button is clicked
apiKeyToggleBtn.addEventListener("click", function () {
  if (apiKeySection.style.display === "none") {
    apiKeySection.style.display = "block";
  } else {
    apiKeySection.style.display = "none";
  }
});

// Save the key the user typed in
saveKeyBtn.addEventListener("click", function () {
  const enteredKey = apiKeyInput.value.trim();

  if (enteredKey === "") {
    alert("Please paste a valid API key first.");
    return;
  }

  apiKey = enteredKey;
  statusText.textContent = "Ready to chat ✅";
  apiKeySection.style.display = "none";
  updateSendButtonState();
  userMessageInput.focus();
});


// =====================================================
// 2. Text input behaviour
// =====================================================

// Grow the textarea automatically as the user types more lines
userMessageInput.addEventListener("input", function () {
  userMessageInput.style.height = "auto";
  userMessageInput.style.height = userMessageInput.scrollHeight + "px";
  updateSendButtonState();
});

// Allow pressing Enter to send (Shift+Enter still makes a new line)
userMessageInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

// The Send button should only be clickable if there is something to send
function updateSendButtonState() {
  const hasText = userMessageInput.value.trim().length > 0;
  const hasImages = uploadedImages.length > 0;
  sendMessageBtn.disabled = !(hasText || hasImages) || apiKey === "";
}


// =====================================================
// 3. Image upload handling
// =====================================================

uploadImageBtn.addEventListener("click", function () {
  imageFileInput.click();
});

imageFileInput.addEventListener("change", async function (event) {
  const selectedFiles = Array.from(event.target.files);

  for (const file of selectedFiles) {
    // Skip anything that isn't an image, just in case
    if (!file.type.startsWith("image/")) continue;

    const base64Data = await convertFileToBase64(file);
    const previewUrl = URL.createObjectURL(file);

    uploadedImages.push({
      base64: base64Data,
      mimeType: file.type,
      previewUrl: previewUrl,
    });
  }

  renderImagePreviews();
  updateSendButtonState();

  // reset the file input so the same image can be picked again later if needed
  imageFileInput.value = "";
});

// Helper function: turns an image file into base64 text
// (Gemini's API expects images as base64-encoded strings)
function convertFileToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      // reader.result looks like "data:image/png;base64,AAAA..."
      // we only need the part after the comma
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Draws the small image thumbnails above the text box
function renderImagePreviews() {
  imagePreviewRow.innerHTML = "";

  uploadedImages.forEach(function (image, index) {
    const chip = document.createElement("div");
    chip.className = "image-chip";
    chip.innerHTML =
      '<img src="' + image.previewUrl + '" alt="uploaded image" />' +
      '<button>x</button>';

    // Let the user remove an image before sending
    chip.querySelector("button").addEventListener("click", function () {
      uploadedImages.splice(index, 1);
      renderImagePreviews();
      updateSendButtonState();
    });

    imagePreviewRow.appendChild(chip);
  });
}


// =====================================================
// 4. Sending a message + rendering the chat
// =====================================================

sendMessageBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const messageText = userMessageInput.value.trim();

  // Don't send an empty message with no images
  if (messageText === "" && uploadedImages.length === 0) return;
  if (apiKey === "") return;

  // Show the user's message in the chat window
  addUserMessageToChat(messageText, uploadedImages);

  // Build the "parts" array for the Gemini API request
  // (text goes in one part, each image goes in its own part)
  const messageParts = [];
  if (messageText !== "") {
    messageParts.push({ text: messageText });
  }
  uploadedImages.forEach(function (image) {
    messageParts.push({
      inline_data: {
        mime_type: image.mimeType,
        data: image.base64,
      },
    });
  });

  conversationHistory.push({ role: "user", parts: messageParts });

  // Clear the input box and image previews for the next message
  userMessageInput.value = "";
  userMessageInput.style.height = "auto";
  uploadedImages = [];
  renderImagePreviews();
  updateSendButtonState();

  showTypingIndicator();

  try {
    const botReply = await callGeminiAPI();
    removeTypingIndicator();
    addBotMessageToChat(botReply, false);
    conversationHistory.push({ role: "model", parts: [{ text: botReply }] });
  } catch (error) {
    removeTypingIndicator();
    addBotMessageToChat(
      error.message || "Something went wrong. Please check your API key and try again.",
      true
    );
  }
}

// Adds the user's chat bubble to the screen
function addUserMessageToChat(text, images) {
  if (emptyState) emptyState.remove();

  const row = document.createElement("div");
  row.className = "message-row user";

  let imagesHtml = "";
  images.forEach(function (image) {
    imagesHtml += '<img src="' + image.previewUrl + '" alt="uploaded image" />';
  });

  row.innerHTML =
    '<div class="message-bubble">' + escapeHtml(text) + imagesHtml + "</div>";

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Adds the bot's chat bubble to the screen
function addBotMessageToChat(text, isError) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  const bubbleClass = isError ? "message-bubble error-bubble" : "message-bubble";
  row.innerHTML = '<div class="' + bubbleClass + '">' + escapeHtml(text) + "</div>";

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Shows the "..." typing animation while waiting for a reply
function showTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = "typingIndicatorRow";
  row.innerHTML =
    '<div class="message-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const row = document.getElementById("typingIndicatorRow");
  if (row) row.remove();
}

// Basic protection so user text can't break the page's HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}


// =====================================================
// 5. Calling the Gemini API
// =====================================================

async function callGeminiAPI() {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    GEMINI_MODEL +
    ":generateContent?key=" +
    encodeURIComponent(apiKey);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: conversationHistory }),
  });

  if (!response.ok) {
    let errorMessage = "Request failed with status " + response.status;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      }
    } catch (e) {
      // if the error response isn't JSON, just use the generic message above
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const firstCandidate = data.candidates && data.candidates[0];
  const textPart =
    firstCandidate &&
    firstCandidate.content &&
    firstCandidate.content.parts &&
    firstCandidate.content.parts.find(function (part) {
      return part.text;
    });

  if (!textPart) {
    throw new Error("No response text was returned. Try rephrasing your message.");
  }

  return textPart.text;
}
