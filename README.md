# microarea.ai - Chatbot AI & Soporte Técnico

Este repositorio contiene la solución completa de chat inteligente y soporte técnico implementada para **microarea.ai**.

## Estructura del Proyecto

* **`frontend/`**: Archivos del widget de chat inyectado en el portal público WordPress (`microarea-chat.js`, `admin-chat.html`, estilos y optimizaciones).
  * **`microarea-chat.js`**: Widget flotante moderno con soporte multidioma (12 idiomas), detección automática, cola de espera y handoff a humanos.
  * **`admin-chat.html`**: Portal técnico de soporte con corrector ortográfico integrado (Gemini + LanguageTool) e indicador de escritura en tiempo real.
* **`backend/`**: Servidor Node.js (`modern-suite`) que gestiona la lógica del asistente e integración RAG.
  * **`index.js`**: API REST principal (`/api/gemini`, `/api/chat/*`, `/api/correct`).
  * **`knowledge/`**: Base de conocimientos estructurada con leyes del BOE y manuales en PDF para responder consultas técnicas de forma precisa según el software seleccionado (WinLab, EosWin, MaConta, MaGest, LexNext).

## Configuración del Servidor

1. Dirígete a la carpeta `backend/server`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura el archivo `.env` con tus claves de API (Gemini, nodemailer, etc.).
4. Ejecuta el servidor:
   ```bash
   node index.js
   ```
