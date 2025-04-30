import tkinter as tk
from tkinter import scrolledtext
import google.generativeai as genai
import pyttsx3

# === API Configuration ===
GOOGLE_API_KEY = "AIzaSyC0YsB1fXdumOy2nVZhGVIybrJ9pN9ua5s"
genai.configure(api_key=GOOGLE_API_KEY)

# Load Gemini 1.5 Pro model
model = genai.GenerativeModel('gemini-1.5-pro')
chat = model.start_chat(history=[])

# Initialize Text-to-Speech Engine
engine = pyttsx3.init()
engine.setProperty('rate', 170)  # Speech speed

latest_bot_reply = ""  # Store latest bot reply

# === Bot Speaking Function ===
def speak_response():
    if latest_bot_reply:
        engine.say(latest_bot_reply)
        engine.runAndWait()

# === Response Handler ===
def get_bot_response():
    global latest_bot_reply

    user_input = user_entry.get()
    if user_input.strip() == "":
        return

    insert_message("You", user_input, "#00bfff")
    user_entry.delete(0, tk.END)

    try:
        response = chat.send_message(user_input)
        latest_bot_reply = response.text
    except Exception as e:
        latest_bot_reply = f"Error: {str(e)}"

    insert_message("TechBot", latest_bot_reply, "#00ff7f")

# === Insert Messages in Chat Window ===
def insert_message(sender, message, color):
    chat_area.config(state=tk.NORMAL)
    chat_area.insert(tk.END, f"{sender}: ", ("sender",))
    chat_area.insert(tk.END, message + "\n\n", ("message",))
    chat_area.tag_config("sender", foreground=color, font=("Segoe UI", 11, "bold"))
    chat_area.tag_config("message", foreground="#ffffff", font=("Segoe UI", 11))
    chat_area.config(state=tk.DISABLED)
    chat_area.see(tk.END)

# === GUI Setup ===
window = tk.Tk()
window.title("💻 Tech Support Chatbot")
window.geometry("700x580")
window.configure(bg="#1e1e1e")

# === Chat Display Area ===
chat_area = scrolledtext.ScrolledText(window, wrap=tk.WORD, state=tk.DISABLED, bg="#2b2b2b",
                                      fg="#ffffff", font=("Segoe UI", 11), padx=10, pady=10)
chat_area.pack(padx=10, pady=10, fill=tk.BOTH, expand=True)

# === Entry + Buttons Frame ===
entry_frame = tk.Frame(window, bg="#1e1e1e")
entry_frame.pack(fill=tk.X, padx=10, pady=(0, 10))

user_entry = tk.Entry(entry_frame, font=("Segoe UI", 12), bg="#333333", fg="#ffffff", insertbackground="#ffffff")
user_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10), ipady=6)
user_entry.bind("<Return>", lambda event: get_bot_response())

send_button = tk.Button(entry_frame, text="Send", font=("Segoe UI", 12, "bold"),
                        bg="#00bfff", fg="white", activebackground="#009acd", cursor="hand2",
                        command=get_bot_response)
send_button.pack(side=tk.RIGHT, ipadx=10, ipady=6)

# === Speak Button ===
speak_button = tk.Button(window, text="🔊 Speak", font=("Segoe UI", 11, "bold"),
                         bg="#444444", fg="white", activebackground="#666666", cursor="hand2",
                         command=speak_response)
speak_button.pack(pady=(0, 10), ipadx=10, ipady=6)

# Auto-focus the entry field
user_entry.focus()

window.mainloop()