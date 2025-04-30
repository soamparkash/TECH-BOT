const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");
const body = document.body;
// API Setup
const API_KEY = "AIzaSyDRiEkP-M5e5ZWzYZEXsTOyDKMyjkARA9A";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
let controller, typingInterval;
const chatHistory = [];
const userData = { message: "", file: {} };
// Theme Management
function setInitialTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  body.className = `${savedTheme}-theme`;
  themeToggleBtn.textContent = savedTheme === "light" ? "dark_mode" : "light_mode";
}

function toggleTheme() {
  const isDark = body.classList.contains("dark-theme");
  body.classList.toggle("light-theme", isDark);
  body.classList.toggle("dark-theme", !isDark);
  
  const currentTheme = isDark ? "light" : "dark";
  localStorage.setItem("theme", currentTheme);
  themeToggleBtn.textContent = currentTheme === "light" ? "dark_mode" : "light_mode";
}

// Initialize theme
setInitialTheme();

// Function to create message elements
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Scroll to the bottom of the container
const scrollToBottom = () => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

// Simulate typing effect for bot responses
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;
  
  typingInterval = setInterval(() => {
      if (wordIndex < words.length) {
          textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
          scrollToBottom();
      } else {
          clearInterval(typingInterval);
          botMsgDiv.classList.remove("loading");
          document.body.classList.remove("bot-responding");
      }
  }, 10);
};

// Make the API call and generate the bot's response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();
  
  chatHistory.push({
      role: "user",
      parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: (({ fileName, isImage, ...rest }) => rest)(userData.file) }] : [])],
  });
  
  try {
      // Replace with your actual API call
      const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: chatHistory }),
          signal: controller.signal,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error.message);
      
      const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
      typingEffect(responseText, textElement, botMsgDiv);
      chatHistory.push({ role: "model", parts: [{ text: responseText }] });
  } catch (error) {
      textElement.textContent = error.name === "AbortError" ? "Response generation stopped." : error.message;
      textElement.style.color = "#d62939";
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
      scrollToBottom();
  } finally {
      userData.file = {};
  }
};

// Handle the form submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding")) return;
  
  userData.message = userMessage;
  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
  
  const userMsgHTML = `
      <p class="message-text"></p>
      ${userData.file.data ? (userData.file.isImage ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />` : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`) : ""}
  `;
  
  const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userData.message;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();
  
  setTimeout(() => {
      const botMsgHTML = `<img class="avatar" src="gemini.svg" /> <p class="message-text">Just a sec...</p>`;
      const botMsgDiv = createMessageElement(botMsgHTML, "bot-message", "loading");
      chatsContainer.appendChild(botMsgDiv);
      scrollToBottom();
      generateResponse(botMsgDiv);
  }, 600);
};

// Handle file input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  
  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  
  reader.onload = (e) => {
      fileInput.value = "";
      const base64String = e.target.result.split(",")[1];
      fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");
      userData.file = { fileName: file.name, data: base64String, mime_type: file.type, isImage };
  };
  
  reader.readAsDataURL(file);
});

// Cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
});

// Stop Bot Response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  controller?.abort();
  userData.file = {};
  clearInterval(typingInterval);
  chatsContainer.querySelector(".bot-message.loading").classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// Toggle theme
themeToggleBtn.addEventListener("click", toggleTheme);

// Delete all chats
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("chats-active", "bot-responding");
});

// Handle suggestions click
document.querySelectorAll(".suggestions-item").forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
      promptInput.value = suggestion.querySelector(".text").textContent;
      promptForm.dispatchEvent(new Event("submit"));
  });
});

// Add event listeners
promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());
document.addEventListener("DOMContentLoaded", () => {
    const suggestions = document.querySelector(".suggestions");

    suggestions.addEventListener("animationend", () => {
        suggestions.classList.remove("animate-slide");
        suggestions.style.transform = "translateX(0)"; // Reset final position
    });
});