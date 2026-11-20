
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");
const sendButton = document.getElementById("sendButton");
const historyList = document.getElementById("historyList");

let selectedSubject = "General";
let conversation = [];
let isLoading = false;

// Selección de materias
document.querySelectorAll(".subject").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".subject").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        selectedSubject = button.dataset.subject;
    });
});

// Crear mensajes de manera segura
function addMessage(role, text) {
    const message = document.createElement("div");
    message.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = role === "user" ? "👤" : "🤖";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = role === "user" ? "Vos" : "Study AI";

    const paragraph = document.createElement("p");
    paragraph.textContent = text;

    content.append(name, paragraph);
    message.append(avatar, content);

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}

// Actualizar historial
function updateHistory(question, answer) {
    const empty = historyList.querySelector(".empty-history");

    if (empty) {
        empty.remove();
    }

    const item = document.createElement("div");
    item.className = "history-item";

    const title = document.createElement("strong");
    title.textContent = "📌 " + question;

    const response = document.createElement("p");
    response.textContent = answer;

    item.append(title, response);
    historyList.prepend(item);
}

// Enviar consulta a la API
async function askAI(question) {
    const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            question: question,
            subject: selectedSubject,
            history: conversation
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "No se pudo obtener una respuesta.");
    }

    return data.answer;
}

// Enviar formulario
chatForm.addEventListener("submit", async event => {
    event.preventDefault();

    const question = userInput.value.trim();

    if (!question) {
        alert("Por favor, escribí una pregunta.");
        return;
    }

    if (isLoading) return;

    isLoading = true;
    sendButton.disabled = true;
    sendButton.textContent = "Consultando...";

    addMessage("user", question);
    userInput.value = "";

    const loadingMessage = addMessage("bot", "Estoy pensando tu respuesta...");

    try {
        const answer = await askAI(question);

        loadingMessage.remove();
        addMessage("bot", answer);

        conversation.push(
            { role: "user", content: question },
            { role: "assistant", content: answer }
        );

        // Conservar solamente los últimos 10 intercambios
        conversation = conversation.slice(-20);

        updateHistory(question, answer);

    } catch (error) {
        loadingMessage.remove();

        addMessage(
            "bot",
            "No pude conectarme con el asistente. " + error.message
        );
    } finally {
        isLoading = false;
        sendButton.disabled = false;
        sendButton.textContent = "Enviar ➤";
        userInput.focus();
    }
});

// Enviar con Enter y utilizar Shift + Enter para salto de línea
userInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

// Herramientas de estudio
document.querySelectorAll(".tool-card").forEach(button => {
    button.addEventListener("click", () => {
        const prompt = button.dataset.prompt;
        userInput.value = prompt;
        userInput.focus();
    });
});

// Limpiar historial y conversación
document.getElementById("clearHistory").addEventListener("click", () => {
    conversation = [];

    chatMessages.innerHTML = "";

    addMessage(
        "bot",
        "¡Hola nuevamente! Soy Study AI. ¿Qué querés aprender hoy?"
    );

    historyList.innerHTML = `
        <p class="empty-history">
            Todavía no hay consultas.
        </p>
    `;

    userInput.value = "";
});

// Modo oscuro
const themeButton = document.getElementById("themeButton");

themeButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    themeButton.textContent = isDark ? "☀️" : "🌙";

    localStorage.setItem("studyTheme", isDark ? "dark" : "light");
});

// Recuperar el tema guardado
if (localStorage.getItem("studyTheme") === "dark") {
    document.body.classList.add("dark");
    themeButton.textContent = "☀️";
}
