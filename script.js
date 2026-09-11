


let apiKey = "";              
let uploadedImages = [];      
let conversationHistory = []; 


const GEMINI_MODEL = "gemini-2.0-flash";


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



apiKeyToggleBtn.addEventListener("click", function () {
  if (apiKeySection.style.display === "none") {
    apiKeySection.style.display = "block";
  } else {
    apiKeySection.style.display = "none";
  }
});


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



userMessageInput.addEventListener("input", function () {
  userMessageInput.style.height = "auto";
  userMessageInput.style.height = userMessageInput.scrollHeight + "px";
  updateSendButtonState();
});


userMessageInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});


function updateSendButtonState() {
  const hasText = userMessageInput.value.trim().length > 0;
  const hasImages = uploadedImages.length > 0;
  sendMessageBtn.disabled = !(hasText || hasImages) || apiKey === "";
}




uploadImageBtn.addEventListener("click", function () {
  imageFileInput.click();
});

imageFileInput.addEventListener("change", async function (event) {
  const selectedFiles = Array.from(event.target.files);

  for (const file of selectedFiles) {
   
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

 
  imageFileInput.value = "";
});


function convertFileToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () {
      
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function renderImagePreviews() {
  imagePreviewRow.innerHTML = "";

  uploadedImages.forEach(function (image, index) {
    const chip = document.createElement("div");
    chip.className = "image-chip";
    chip.innerHTML =
      '<img src="' + image.previewUrl + '" alt="uploaded image" />' +
      '<button>x</button>';

    
    chip.querySelector("button").addEventListener("click", function () {
      uploadedImages.splice(index, 1);
      renderImagePreviews();
      updateSendButtonState();
    });

    imagePreviewRow.appendChild(chip);
  });
}




sendMessageBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const messageText = userMessageInput.value.trim();

 
  if (messageText === "" && uploadedImages.length === 0) return;
  if (apiKey === "") return;

  
  addUserMessageToChat(messageText, uploadedImages);

  
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


function addBotMessageToChat(text, isError) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  const bubbleClass = isError ? "message-bubble error-bubble" : "message-bubble";
  row.innerHTML = '<div class="' + bubbleClass + '">' + escapeHtml(text) + "</div>";

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


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


function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}




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
