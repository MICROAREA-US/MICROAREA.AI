/**
 * Microarea AI Chat Widget
 * Autocontenido, premium glassmorphism design.
 * Conectado con la API local /api/gemini.
 * Soporta selección de software, carga de conocimientos locales y handoff humano.
 */
(function() {
    // Evitar doble inicialización
    if (window.MicroareaAIChatInitialized) return;
    window.MicroareaAIChatInitialized = true;

    // Crear estilos CSS dinámicos
    const styles = `
        /* --- Contenedor del Chat --- */
        #microarea-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        /* --- Botón Flotante Estilo Liquid Glass (iOS 27) --- */
        #microarea-chat-trigger {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(0, 169, 157, 0.85) 0%, rgba(0, 125, 116, 0.85) 100%) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            box-shadow: 
                inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), 
                inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.15),
                0 8px 24px rgba(0, 169, 157, 0.3) !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
            border: none;
            outline: none;
        }

        #microarea-chat-trigger:hover {
            transform: scale(1.1) rotate(5deg) !important;
            box-shadow: 
                inset 0 2px 2px rgba(255, 255, 255, 0.6), 
                0 12px 30px rgba(0, 169, 157, 0.5) !important;
        }

        #microarea-chat-trigger:active {
            transform: scale(0.95) !important;
        }

        #microarea-chat-trigger svg {
            width: 28px;
            height: 28px;
            fill: #ffffff;
            transition: transform 0.3s ease;
        }

        #microarea-chat-trigger.open svg {
            transform: rotate(90deg);
        }

        /* --- Ventana de Chat Estilo Liquid Glass --- */
        #microarea-chat-window {
            width: 380px;
            height: 520px;
            border-radius: 24px !important;
            background: rgba(255, 255, 255, 0.65) !important;
            backdrop-filter: blur(25px) saturate(190%) !important;
            -webkit-backdrop-filter: blur(25px) saturate(190%) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            box-shadow: 
                inset 0 2px 2px rgba(255, 255, 255, 0.65), 
                0 15px 45px rgba(0, 0, 0, 0.08) !important;
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(30px) scale(0.95);
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
            transform-origin: bottom right;
        }

        #microarea-chat-window.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        /* --- Cabecera del Chat --- */
        .microarea-chat-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, rgba(68, 113, 177, 0.85) 0%, rgba(46, 76, 118, 0.85) 100%) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 
                inset 0 1px 1px rgba(255, 255, 255, 0.3), 
                0 4px 15px rgba(0, 0, 0, 0.03) !important;
        }

        .microarea-chat-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .microarea-chat-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
        }

        .microarea-chat-title {
            font-size: 15px;
            font-weight: 600;
            margin: 0;
            letter-spacing: 0.3px;
        }

        .microarea-chat-status {
            font-size: 11px;
            opacity: 0.9;
            margin: 2px 0 0 0;
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .microarea-chat-status::before {
            content: "";
            display: inline-block;
            width: 7px;
            height: 7px;
            background-color: #2ecc71;
            border-radius: 50%;
            animation: pulse-green 2s infinite;
        }

        .microarea-chat-close-btn {
            background: none;
            border: none;
            color: #ffffff;
            font-size: 20px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .microarea-chat-close-btn:hover {
            opacity: 1;
        }

        /* --- Cuerpo de Mensajes --- */
        .microarea-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scroll-behavior: smooth;
        }

        /* Mensajes Individuales - Burbujas Glassmorphic */
        .microarea-message {
            max-width: 85%;
            padding: 10px 15px;
            border-radius: 18px !important;
            font-size: 14px;
            line-height: 1.5;
            word-wrap: break-word;
            animation: fade-in-up 0.3s ease;
        }

        .microarea-message.user {
            background: linear-gradient(135deg, rgba(0, 169, 157, 0.85) 0%, rgba(0, 125, 116, 0.85) 100%) !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            color: #ffffff;
            align-self: flex-end;
            border-bottom-right-radius: 4px !important;
            box-shadow: 
                inset 0 1px 1px rgba(255, 255, 255, 0.4), 
                0 4px 10px rgba(0, 169, 157, 0.15) !important;
        }

        .microarea-message.bot {
            background-color: rgba(240, 242, 245, 0.65) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            color: #2c3e50;
            align-self: flex-start;
            border-bottom-left-radius: 4px !important;
            box-shadow: 
                inset 0 1px 1px rgba(255, 255, 255, 0.6), 
                0 3px 8px rgba(0, 0, 0, 0.02) !important;
        }

        /* Formateo de Texto en Bot */
        .microarea-message.bot p {
            margin: 0 0 8px 0;
        }
        .microarea-message.bot p:last-child {
            margin-bottom: 0;
        }
        .microarea-message.bot strong {
            color: #007d74;
        }
        .microarea-message.bot ul {
            margin: 5px 0;
            padding-left: 18px;
        }
        .microarea-message.bot li {
            margin-bottom: 4px;
        }
        .microarea-message.bot a {
            color: #00a99d;
            text-decoration: underline;
            font-weight: 500;
        }
        .microarea-message.bot a:hover {
            color: #007d74;
        }

        /* --- Menú de Selección de Programas --- */
        .microarea-chat-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 10px;
            width: 100%;
            animation: fade-in-up 0.4s ease;
        }

        .microarea-option-btn {
            background: rgba(255, 255, 255, 0.55) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 14px !important;
            padding: 10px 14px;
            font-size: 13.5px;
            font-weight: 600;
            color: #007d74;
            cursor: pointer;
            text-align: left;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
            display: flex;
            align-items: center;
            justify-content: space-between;
            outline: none;
            box-shadow: 
                inset 0 1px 1px rgba(255, 255, 255, 0.5), 
                0 4px 12px rgba(0, 0, 0, 0.03) !important;
        }

        .microarea-option-btn:hover {
            background: linear-gradient(135deg, #00a99d 0%, #007d74 100%) !important;
            color: #ffffff !important;
            transform: translateX(4px) scale(1.01) !important;
            box-shadow: 0 4px 15px rgba(0, 169, 157, 0.2) !important;
            border-color: rgba(255, 255, 255, 0.4) !important;
        }

        .microarea-option-btn:active {
            transform: translateX(2px) !important;
        }

        .microarea-option-btn::after {
            content: "→";
            font-weight: bold;
            opacity: 0.7;
        }

        /* --- Formulario de Traspaso a Humano --- */
        .microarea-handoff-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
            background: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 18px !important;
            padding: 16px;
            margin-top: 10px;
            width: 100%;
            box-sizing: border-box;
            animation: fade-in-up 0.4s ease;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04) !important;
        }

        .microarea-handoff-title {
            font-size: 14px;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 6px 0;
            text-align: center;
        }

        .microarea-handoff-field {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .microarea-handoff-field label {
            font-size: 11px;
            font-weight: 600;
            color: #7f8c8d;
            text-transform: uppercase;
        }

        .microarea-handoff-field input, .microarea-handoff-field select {
            border: 1px solid rgba(0, 0, 0, 0.12) !important;
            border-radius: 10px !important;
            padding: 8px 12px;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.6) !important;
            box-sizing: border-box;
        }

        .microarea-handoff-field input:focus, .microarea-handoff-field select:focus {
            border-color: #00a99d !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 3px rgba(0, 169, 157, 0.15) !important;
        }

        .microarea-handoff-submit {
            background: linear-gradient(135deg, #00a99d, #007d74) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            border-radius: 30px !important;
            padding: 10px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
            margin-top: 5px;
            box-shadow: 0 4px 12px rgba(0, 169, 157, 0.2) !important;
        }

        .microarea-handoff-submit:hover {
            transform: translateY(-2px) scale(1.02) !important;
            box-shadow: 0 8px 18px rgba(0, 169, 157, 0.35) !important;
        }

        .microarea-handoff-submit:active {
            transform: scale(0.98) !important;
        }

        /* --- Enlace en Footer para Traspaso --- */
        .microarea-chat-trigger-handoff-lnk {
            color: #007d74;
            text-decoration: underline;
            font-weight: 800;
            cursor: pointer;
            margin-left: 5px;
            font-size: 13px;
            display: inline-block;
            padding: 2px 8px;
            background: rgba(0, 169, 157, 0.1);
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        .microarea-chat-trigger-handoff-lnk:hover {
            color: #ffffff;
            background: #00a99d;
            text-decoration: none;
        }

        /* --- Indicador de Carga --- */
        .microarea-typing-indicator {
            display: flex;
            gap: 5px;
            padding: 8px 15px;
            background-color: rgba(240, 242, 245, 0.65) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 12px;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            animation: fade-in-up 0.2s ease;
        }

        .microarea-typing-dot {
            width: 8px;
            height: 8px;
            background-color: #7f8c8d;
            border-radius: 50%;
            animation: bounce-dots 1.4s infinite ease-in-out both;
        }

        .microarea-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .microarea-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        /* --- Panel de Entrada de Mensaje --- */
        .microarea-chat-input-area {
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.45) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .microarea-chat-input {
            flex: 1;
            border: 1px solid rgba(0, 0, 0, 0.08) !important;
            border-radius: 20px;
            padding: 10px 16px;
            font-size: 14px;
            outline: none;
            resize: none;
            height: 20px;
            line-height: 20px;
            background: rgba(255, 255, 255, 0.5) !important;
            transition: all 0.2s ease;
        }

        .microarea-chat-input:focus {
            border-color: #00a99d !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 3px rgba(0, 169, 157, 0.15) !important;
        }

        .microarea-chat-send-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #00a99d;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            outline: none;
        }

        .microarea-chat-send-btn:hover {
            background-color: #007d74;
            transform: scale(1.05);
        }

        .microarea-chat-send-btn:active {
            transform: scale(0.95);
        }

        .microarea-chat-send-btn svg {
            width: 18px;
            height: 18px;
            fill: #ffffff;
        }

        /* --- Footer Informativo --- */
        .microarea-chat-footer {
            font-size: 12px;
            text-align: center;
            color: #555555;
            padding: 8px 10px;
            background: rgba(255, 255, 255, 0.6) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        /* --- Pestañas (Tabs) --- */
        .microarea-chat-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.4) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
            z-index: 10;
        }

        .microarea-chat-tab {
            flex: 1;
            padding: 12px 10px;
            background: none;
            border: none;
            font-size: 13px;
            font-weight: 600;
            color: #7f8c8d;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s ease;
            position: relative;
            outline: none;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }

        .microarea-chat-tab:hover {
            color: #4471b1;
        }

        .microarea-chat-tab.active {
            color: #4471b1;
            background: rgba(68, 113, 177, 0.04);
        }

        .microarea-chat-tab.active::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 15%;
            right: 15%;
            height: 3px;
            background: #4471b1;
            border-radius: 2px 2px 0 0;
        }

        /* --- Formulario Dedicado Humano --- */
        .microarea-handoff-form-dedicated {
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            border-radius: 18px !important;
            padding: 20px;
            box-sizing: border-box;
            width: 100%;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04) !important;
        }

        /* --- Animaciones --- */
        @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(46, 204, 113, 0); }
            100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }

        @keyframes bounce-dots {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
        }

        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* --- Responsive Móvil --- */
        @media (max-width: 480px) {
            #microarea-chat-widget {
                bottom: 0;
                right: 0;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                align-items: stretch;
            }

            #microarea-chat-window {
                width: 100%;
                height: 100% !important;
                margin-bottom: 0;
                border-radius: 0;
                border: none;
            }

            #microarea-chat-trigger {
                position: fixed;
                bottom: 15px;
                right: 15px;
                z-index: 1000000;
            }
            
            #microarea-chat-trigger.open {
                display: none;
            }
        }
`;

    // Inyectar etiqueta de estilo en el HEAD
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Detectar el idioma de la página de forma dinámica
    function getPageLanguage() {
        let lang = '';
        // 1. Comprobar parámetro en URL
        const urlParams = new URLSearchParams(window.location.search);
        lang = urlParams.get('idioma') || urlParams.get('lang') || '';
        lang = lang.substring(0, 2).toLowerCase();
        
        // 2. Comprobar atributo lang de HTML
        if (!lang) {
            let htmlLang = document.documentElement.lang || '';
            lang = htmlLang.substring(0, 2).toLowerCase();
        }
        
        // 3. Comprobar ruta URL (ej: /en/home/ o /en)
        if (!lang) {
            const path = window.location.pathname;
            const match = path.match(/^\/([a-z]{2})(?:\/|$)/i);
            if (match) {
                lang = match[1].toLowerCase();
            }
        }
        
        // 4. Comprobar cookies
        if (!lang) {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const parts = cookies[i].split('=');
                if (parts[0].trim() === 'pll_language') {
                    lang = parts[1].trim().substring(0, 2).toLowerCase();
                    break;
                }
            }
        }
        
        const supported = ['es', 'en', 'de', 'it', 'ca', 'pt', 'tr', 'eu', 'gl', 'fr', 'bg', 'pl'];
        return supported.includes(lang) ? lang : 'es';
    }

    const currentLang = getPageLanguage();

    const translations = {
        es: {
            title: "Asistente Microarea",
            tabAi: "🤖 Asistente IA",
            tabHuman: "👤 Agente Humano",
            statusOnline: "En línea",
            placeholderAi: "Escribe tu consulta aquí...",
            placeholderHuman: "Escribe un mensaje al técnico...",
            btnBack: "Volver al Asistente IA",
            welcome: "¡Hola! Bienvenido al asistente virtual inteligente de **Microarea**.\n\nPara poder ayudarte mejor, ¿sobre qué programa o servicio deseas hacer tu consulta hoy?",
            programConfigured: "Estupendo. He configurado mi sistema para tus consultas sobre **{program}**.\n\nEscribe tu pregunta sobre el programa y la responderé al instante utilizando los manuales de producto.",
            handoffFormTitle: "Contactar con Soporte Técnico",
            handoffFormDesc: "Por favor, rellena tus datos para transferir tu consulta a un agente de soporte de Microarea.",
            formName: "Nombre y Apellidos *",
            formEmail: "Correo Electrónico *",
            formPhone: "Teléfono de Contacto",
            formSoftware: "Mensaje / Consulta *",
            btnSubmit: "Enviar Solicitud a Soporte",
            connecting: "Conectando con soporte técnico...",
            noResponse: "No obtuve respuesta del asistente.",
            selectProgram: "Selecciona un programa para comenzar",
            handoffPrefix: "¿Prefieres hablar con un ",
            handoffLink: "agente humano",
            handoffSuffix: "?",
            queryFor: "Consulta para: {program}",
            alertFields: "Por favor, introduce tu Nombre y Correo Electrónico para poder contactarte.",
            handoffSuccess: "¡Gracias, **{name}**! Tu solicitud ha sido enviada con éxito a nuestro equipo de soporte técnico.\n\nHemos adjuntado la transcripción de tus preguntas para que un agente revise el caso y te responda por correo o teléfono lo antes posible.",
            handoffError: "⚠️ Ocurrió un error al enviar el ticket. \n\nNo te preocupes, puedes contactarnos directamente enviando un correo a **soporte@microareanext.com** o llamándonos al **(+34) 96 338 78 20**.",
            alertFieldsD: "Por favor, introduce tu Nombre, Correo Electrónico y consulta.",
            initiatingChat: "Iniciando chat...",
            waitingForTech: "Esperando a un técnico de soporte...",
            waitingForTechShort: "Esperando a un técnico...",
            techConnected: "Técnico conectado en línea",
            chatClosedByTech: "Chat finalizado por el técnico",
            connError: "⚠️ Lo siento, no he podido conectarme con el servidor. Por favor, inténtalo de nuevo en unos momentos.",
            noTechsOnline: "No hay técnicos en línea",
            queueMessage: "Es usted el cliente número {num} en la cola",
            formProgram: "¿Sobre qué programa desea realizar la consulta?",
            commercialInquiry: "Consulta Comercial",
            programs: {
                winlab: "WinLab (Nóminas y Seguridad Social)",
                eoswin: "EosWin (Autónomos y Estimaciones)",
                maconta: "MaConta (Contabilidad General)",
                magest: "MaGest (Facturación y Almacén)",
                lexnext: "LexNext (Despachos y Abogados)",
                poshability: "Poshability (TPV Comercio y Hostelería)",
                general: "Consulta General o Comercial"
            }
        },
        en: {
            title: "Microarea Assistant",
            tabAi: "🤖 AI Assistant",
            tabHuman: "👤 Human Agent",
            statusOnline: "Online",
            placeholderAi: "Type your question here...",
            placeholderHuman: "Type a message to the technician...",
            btnBack: "Back to AI Assistant",
            welcome: "Hello! Welcome to the **Microarea** intelligent virtual assistant.\n\nTo help you better, which software or service would you like to inquire about today?",
            programConfigured: "Great. I have configured my system for your questions about **{program}**.\n\nType your question about the software and I will answer it instantly using the product manuals.",
            handoffFormTitle: "Contact Technical Support",
            handoffFormDesc: "Please fill in your details to transfer your query to a Microarea support agent.",
            formName: "Full Name *",
            formEmail: "Email Address *",
            formPhone: "Contact Phone",
            formSoftware: "Message / Query *",
            btnSubmit: "Send Support Request",
            connecting: "Connecting to technical support...",
            noResponse: "I did not receive a response from the assistant.",
            selectProgram: "Select a program to start",
            handoffPrefix: "Prefer to speak with a ",
            handoffLink: "human agent",
            handoffSuffix: "?",
            queryFor: "Query for: {program}",
            alertFields: "Please enter your Name and Email address to proceed.",
            handoffSuccess: "Thank you, **{name}**! Your request has been sent successfully to our support team.\n\nWe have attached the transcript of your questions so an agent can review it and get back to you as soon as possible.",
            handoffError: "⚠️ An error occurred while sending the ticket. \n\nDon't worry, you can contact us directly by email at **soporte@microareanext.com** or call us at **(+34) 96 338 78 20**.",
            alertFieldsD: "Please enter your Name, Email, and message.",
            initiatingChat: "Starting chat...",
            waitingForTech: "Waiting for a support technician...",
            waitingForTechShort: "Waiting for a technician...",
            techConnected: "Technician connected online",
            chatClosedByTech: "Chat ended by the technician",
            connError: "⚠️ Sorry, I could not connect to the server. Please try again in a few moments.",
            noTechsOnline: "No technicians online",
            queueMessage: "You are customer number {num} in the queue",
            formProgram: "Which program would you like to inquire about?",
            commercialInquiry: "Sales Inquiry",
            programs: {
                winlab: "WinLab (Payroll & Social Security)",
                eoswin: "EosWin (Freelancers & Tax)",
                maconta: "MaConta (General Accounting)",
                magest: "MaGest (Invoicing & Inventory)",
                lexnext: "LexNext (Law Firms & Lawyers)",
                poshability: "Poshability (POS & Hospitality)",
                general: "General or Sales Inquiry"
            }
        },
        de: {
            title: "Microarea-Assistent",
            tabAi: "🤖 KI-Assistent",
            tabHuman: "👤 Mitarbeiter",
            statusOnline: "Online",
            placeholderAi: "Geben Sie Ihre Frage hier ein...",
            placeholderHuman: "Schreiben Sie eine Nachricht an den Techniker...",
            btnBack: "Zurück zum KI-Assistenten",
            welcome: "Hallo! Willkommen beim intelligenten virtuellen Assistenten von **Microarea**.\n\nUm Ihnen besser helfen zu können, zu welchem Programm oder Service möchten Sie sich heute informieren?",
            programConfigured: "Großartig. Ich habe mein System für Ihre Fragen zu **{program}** eingerichtet.\n\nStellen Sie Ihre Frage zum Programm und ich werde sie sofort anhand der Produkthandbücher beantworten.",
            handoffFormTitle: "Technischen Support kontaktieren",
            handoffFormDesc: "Bitte füllen Sie Ihre Daten aus, um Ihre Anfrage an einen Support-Mitarbeiter von Microarea weiterzuleiten.",
            formName: "Name und Nachname *",
            formEmail: "E-Mail-Adresse *",
            formPhone: "Kontakttelefon",
            formSoftware: "Nachricht / Anfrage *",
            btnSubmit: "Support-Anfrage senden",
            connecting: "Verbindung mit dem technischen Support wird hergestellt...",
            noResponse: "Ich habe keine Antwort vom Assistenten erhalten.",
            selectProgram: "Wählen Sie ein Programm aus, um zu starten",
            handoffPrefix: "Möchten Sie lieber mit einem ",
            handoffLink: "menschlichen Mitarbeiter",
            handoffSuffix: " sprechen?",
            queryFor: "Anfrage zu: {program}",
            alertFields: "Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse ein, um fortzufahren.",
            handoffSuccess: "Vielen Dank, **{name}**! Ihre Anfrage wurde erfolgreich an unser Support-Team gesendet.\n\nWir haben das Protokoll Ihrer Fragen beigefügt, damit ein Support-Mitarbeiter den Fall prüfen und sich so schnell wie möglich bei Ihnen melden kann.",
            handoffError: "⚠️ Beim Senden des Tickets ist ein Fehler aufgetreten. \n\nSie können uns direkt per E-Mail unter **soporte@microareanext.com** kontaktieren oder uns unter **(+34) 96 338 78 20** anrufen.",
            alertFieldsD: "Bitte geben Sie Ihren Namen, Ihre E-Mail-Adresse und Ihre Nachricht ein.",
            initiatingChat: "Chat wird gestartet...",
            waitingForTech: "Warten auf einen Support-Techniker...",
            waitingForTechShort: "Warten auf einen Techniker...",
            techConnected: "Techniker online verbunden",
            chatClosedByTech: "Chat vom Techniker beendet",
            connError: "⚠️ Entschuldigung, ich konnte keine Verbindung zum Server herstellen. Bitte versuchen Sie es in wenigen Augenblicken erneut.",
            noTechsOnline: "Keine Techniker online",
            queueMessage: "Sie sind Kunde Nummer {num} in der Warteschlange",
            formProgram: "Über welches Programm möchten Sie sich erkundigen?",
            commercialInquiry: "Verkaufsanfrage",
            programs: {
                winlab: "WinLab (Lohn- & Sozialversicherung)",
                eoswin: "EosWin (Selbstständige & Steuern)",
                maconta: "MaConta (Allgemeine Buchhaltung)",
                magest: "MaGest (Rechnungsstellung & Lager)",
                lexnext: "LexNext (Kanzleien & Anwälte)",
                poshability: "Poshability (Kasse & Gastgewerbe)",
                general: "Allgemeine oder kommerzielle Anfrage"
            }
        },
        it: {
            title: "Assistente Microarea",
            tabAi: "🤖 Assistente IA",
            tabHuman: "👤 Operatore Umano",
            statusOnline: "Online",
            placeholderAi: "Scrivi la tua domanda qui...",
            placeholderHuman: "Scrivi un messaggio al tecnico...",
            btnBack: "Torna all'assistente IA",
            welcome: "Ciao! Benvenuto nell'assistente virtuale intelligente di **Microarea**.\n\nPer poterti aiutare al meglio, su quale programma o servizio desideri fare una domanda oggi?",
            programConfigured: "Ottimo. Ho configurato il sistema per le tue domande su **{program}**.\n\nScrivi la tua domanda sul programma e ti risponderò all'istante utilizzando i manuali del prodotto.",
            handoffFormTitle: "Contatta il Supporto Tecnico",
            handoffFormDesc: "Si prega di compilare i dati per trasferire la query a un agente di supporto Microarea.",
            formName: "Nome e Cognome *",
            formEmail: "Indirizzo E-mail *",
            formPhone: "Telefono di Contatto",
            formSoftware: "Messaggio / Richiesta *",
            btnSubmit: "Invia Richiesta di Supporto",
            connecting: "Connessione con il supporto tecnico...",
            noResponse: "Non ho ricevuto risposta dall'assistente.",
            selectProgram: "Seleziona un programma per iniziare",
            handoffPrefix: "Preferisci parlare con un ",
            handoffLink: "operatore umano",
            handoffSuffix: "?",
            queryFor: "Richiesta per: {program}",
            alertFields: "Si prega di inserire il proprio Nome e indirizzo E-mail per procedere.",
            handoffSuccess: "Grazie, **{name}**! La tua richiesta è stata inviata con successo al nostro team di supporto.\n\nAbbiamo allegato la trascrizione delle tue domande in modo che un operatore possa esaminare il caso e risponderti al più presto.",
            handoffError: "⚠️ Si è verificato un errore durante l'invio della richiesta. \n\nPuoi contattarci direttamente via e-mail all'indirizzo **soporte@microareanext.com** o chiamarci al numero **(+34) 96 338 78 20**.",
            alertFieldsD: "Si prega di inserire Nome, E-mail e messaggio.",
            initiatingChat: "Avvio della chat...",
            waitingForTech: "In attesa di un tecnico di supporto...",
            waitingForTechShort: "In attesa di un tecnico...",
            techConnected: "Tecnico connesso online",
            chatClosedByTech: "Chat terminata dal tecnico",
            connError: "⚠️ Spiacenti, impossibile connettersi al server. Riprova tra qualche istante.",
            noTechsOnline: "Nessun tecnico in linea",
            queueMessage: "Sei il cliente numero {num} in coda",
            formProgram: "Su quale programma desideri fare una domanda?",
            commercialInquiry: "Richiesta Commerciale",
            programs: {
                winlab: "WinLab (Paghe e Previdenza Sociale)",
                eoswin: "EosWin (Autonomi e Tasse)",
                maconta: "MaConta (Contabilità Generale)",
                magest: "MaGest (Fatturazione e Magazzino)",
                lexnext: "LexNext (Studi Legali e Avvocati)",
                poshability: "Poshability (Cassa e Ristorazione)",
                general: "Richiesta Generale o Commerciale"
            }
        },
        ca: {
            title: "Assistent Microarea",
            tabAi: "🤖 Assistent IA",
            tabHuman: "👤 Agent Humà",
            statusOnline: "En línia",
            placeholderAi: "Escriu la teva consulta aquí...",
            placeholderHuman: "Escriu un missatge al tècnic...",
            btnBack: "Tornar a l'Assistent IA",
            welcome: "Hola! Benvingut a l'assistent virtual intel·ligent de **Microarea**.\n\nPer poder ajudar-te millor, sobre quin programa o servei vols fer la teva consulta avui?",
            programConfigured: "Molt bé. He configurat el meu sistema per a les teves consultes sobre **{program}**.\n\nEscriu la teva pregunta sobre el programa i la respondré a l'instant utilitzant els manuals de producte.",
            handoffFormTitle: "Contactar amb Suport Tècnic",
            handoffFormDesc: "Si us plau, emplena les teves dades per transferir la teva consulta a un agent de suport de Microarea.",
            formName: "Nom i Cognoms *",
            formEmail: "Correu Electrònic *",
            formPhone: "Telèfon de Contacte",
            formSoftware: "Missatge / Consulta *",
            btnSubmit: "Enviar Sol·licitud a Suport",
            connecting: "Connectant amb suport tècnic...",
            noResponse: "No he obtingut resposta de l'assistent.",
            selectProgram: "Selecciona un programa per començar",
            handoffPrefix: "Prefereixes parlar amb un ",
            handoffLink: "agent humà",
            handoffSuffix: "?",
            queryFor: "Consulta per a: {program}",
            alertFields: "Si us plau, introdueix el teu Nom i Correu Electrònic per poder contactar-te.",
            handoffSuccess: "Gràcies, **{name}**! La teva sol·licitud ha estat enviada amb èxit al nostre equip de suport tècnic.\n\nHem adjuntat la transcripció de les teves preguntes perquè un agent revisi el cas i et respongui per correu o telèfon al més aviat possible.",
            handoffError: "⚠️ Ha sorgit un error en enviar la sol·licitud. \n\nNo et preocupis, pots contactar-nos directament enviant un correu a **soporte@microareanext.com** o trucant-nos al **(+34) 96 338 78 20**.",
            alertFieldsD: "Si us plau, introdueix el teu Nom, Correu Electrònic i consulta.",
            initiatingChat: "Iniciant xat...",
            waitingForTech: "Esperant un tècnic de suport...",
            waitingForTechShort: "Esperant un tècnic...",
            techConnected: "Técnic connectat en línia",
            chatClosedByTech: "Xat finalitzat pel tècnic",
            connError: "⚠️ Ho sento, no he pogut connectar amb el servidor. Si us plau, torna-ho a intentar en uns moments.",
            noTechsOnline: "No hi ha tècnics en línia",
            queueMessage: "Sou el client número {num} a la cua",
            formProgram: "Sobre quin programa voleu fer la consulta?",
            commercialInquiry: "Consulta Comercial",
            programs: {
                winlab: "WinLab (Nòmines i Seguretat Social)",
                eoswin: "EosWin (Autònoms i Estimacions)",
                maconta: "MaConta (Comptabilitat General)",
                magest: "MaGest (Facturació i Almacen)",
                lexnext: "LexNext (Despatxos i Advocats)",
                poshability: "Poshability (TPV Comerç i Hostaleria)",
                general: "Consulta General o Comercial"
            }
        },
        pt: {
            title: "Assistente Microarea",
            tabAi: "🤖 Assistente IA",
            tabHuman: "👤 Atendente Humano",
            statusOnline: "Online",
            placeholderAi: "Escreva sua pergunta aqui...",
            placeholderHuman: "Escreva uma mensagem para o técnico...",
            btnBack: "Voltar para o Assistente IA",
            welcome: "Olá! Bem-vindo ao assistente virtual inteligente da **Microarea**.\n\nPara que possamos ajudar melhor, sobre qual programa ou serviço deseja fazer sua pergunta hoje?",
            programConfigured: "Excelente. Configurei meu sistema para suas dúvidas sobre **{program}**.\n\nEscreva sua pergunta sobre o programa e responderei instantaneamente usando os manuais do produto.",
            handoffFormTitle: "Contatar Suporte Técnico",
            handoffFormDesc: "Por favor, preencha seus dados para transferir sua consulta a um agente de suporte da Microarea.",
            formName: "Nome Completo *",
            formEmail: "Endereço de E-mail *",
            formPhone: "Telefone de Contato",
            formSoftware: "Mensagem / Consulta *",
            btnSubmit: "Enviar Solicitação de Suporte",
            connecting: "Conectando ao suporte técnico...",
            noResponse: "Não obtive resposta do assistente.",
            selectProgram: "Selecione um programa para começar",
            handoffPrefix: "Prefere falar com um ",
            handoffLink: "atendente humano",
            handoffSuffix: "?",
            queryFor: "Consulta para: {program}",
            alertFields: "Por favor, insira seu Nome e E-mail para prosseguir.",
            handoffSuccess: "Obrigado, **{name}**! Sua solicitação foi enviada com sucesso para nossa equipe de suporte técnico.\n\nAnexamos o histórico de suas perguntas para que um agente analise o caso e entre em contato o mais breve possível.",
            handoffError: "⚠️ Ocorreu um erro ao enviar o ticket. \n\nNão se preocupe, você pode entrar em contato diretamente pelo e-mail **soporte@microareanext.com** ou ligar para **(+34) 96 338 78 20**.",
            alertFieldsD: "Por favor, insira seu Nome, E-mail e consulta.",
            initiatingChat: "Iniciando chat...",
            waitingForTech: "Aguardando um técnico de suporte...",
            waitingForTechShort: "Aguardando um técnico...",
            techConnected: "Técnico conectado online",
            chatClosedByTech: "Chat encerrado pelo técnico",
            connError: "⚠️ Desculpe, não foi possível conectar ao servidor. Por favor, tente novamente em instantes.",
            noTechsOnline: "Não há técnicos em linha",
            queueMessage: "Você é o cliente número {num} na fila",
            formProgram: "Sobre qual programa deseja fazer a consulta?",
            commercialInquiry: "Consulta Comercial",
            programs: {
                winlab: "WinLab (Folha de Pagamento & Seguridade Social)",
                eoswin: "EosWin (Autônomos & Impostos)",
                maconta: "MaConta (Contabilidade Geral)",
                magest: "MaGest (Faturamento & Estoque)",
                lexnext: "LexNext (Escritórios & Advogados)",
                poshability: "Poshability (PDV & Hospitalidade)",
                general: "Consulta Geral ou Comercial"
            }
        },
        tr: {
            title: "Microarea Asistanı",
            tabAi: "🤖 YZ Asistanı",
            tabHuman: "👤 Canlı Temsilci",
            statusOnline: "Çevrimiçi",
            placeholderAi: "Sorunuzu buraya yazın...",
            placeholderHuman: "Teknisyene bir mesaj yazın...",
            btnBack: "YZ Asistanına Geri Dön",
            welcome: "Merhaba! **Microarea** akıllı sanal asistanına hoş geldiniz.\n\nSize daha iyi yardımcı olabilmemiz için bugün hangi program veya hizmet hakkında bilgi almak istersiniz?",
            programConfigured: "Harika. Sistemimi **{program}** hakkındaki sorularınız için yapılandırdım.\n\nProgramla ilgili sorunuzu yazın, ürün kılavuzlarını kullanarak anında yanıtlayayım.",
            handoffFormTitle: "Teknik Destekle İletişime Geçin",
            handoffFormDesc: "Sorunuzu bir Microarea destek temsilcisine aktarmak için lütfen bilgilerinizi doldurun.",
            formName: "Adınız ve Soyadınız *",
            formEmail: "E-posta Adresiniz *",
            formPhone: "İletişim Telefonu",
            formSoftware: "Mesaj / Sorunuz *",
            btnSubmit: "Destek Talebi Gönder",
            connecting: "Teknik desteğe bağlanıyor...",
            noResponse: "Asistandan yanıt alamadım.",
            selectProgram: "Başlamak için bir program seçin",
            handoffPrefix: "Bir ",
            handoffLink: "müşteri temsilcisiyle",
            handoffSuffix: " mi görüşmek istersiniz?",
            queryFor: "Şunun için sorgu: {program}",
            alertFields: "Devam etmek için lütfen Adınızı ve E-posta adresinizi girin.",
            handoffSuccess: "Teşekkürler, **{name}**! Talebiniz destek ekibimize başarıyla iletildi.\n\nBir temsilcinin incelemesi ve size en kısa sürede geri dönmesi için sorularınızın dökümünü ekledik.",
            handoffError: "⚠️ Destek talebi gönderilirken bir hata oluştu. \n\nEndişelenmeyin, doğrudan **soporte@microareanext.com** adresine e-posta göndererek veya **(+34) 96 338 78 20** numaralı telefondan bize ulaşabilirsiniz.",
            alertFieldsD: "Lütfen Adınızı, E-postanızı ve mesajınızı girin.",
            initiatingChat: "Sohbet başlatılıyor...",
            waitingForTech: "Destek teknisyeni bekleniyor...",
            waitingForTechShort: "Teknisyen bekleniyor...",
            techConnected: "Teknisyen çevrimiçi bağlandı",
            chatClosedByTech: "Sohbet teknisyen tarafından sonlandırıldı",
            connError: "⚠️ Üzgünüz, sunucuya bağlanılamadı. Lütfen birkaç dakika sonra tekrar deneyin.",
            noTechsOnline: "Çevrimiçi teknisyen yok",
            queueMessage: "Sırada {num}. müşterisiniz",
            formProgram: "Hangi program hakkında bilgi almak istersiniz?",
            commercialInquiry: "Satış Talebi",
            programs: {
                winlab: "WinLab (Bordro ve Sosyal Güvenlik)",
                eoswin: "EosWin (Serbest Çalışanlar ve Vergi)",
                maconta: "MaConta (Genel Muhasebe)",
                magest: "MaGest (Faturalama ve Stok)",
                lexnext: "LexNext (Hukuk Büroları ve Avukatlar)",
                poshability: "Poshability (POS ve Otel/Restoran)",
                general: "Genel veya Ticari Sorular"
            }
        },
        eu: {
            title: "Microarea Laguntzailea",
            tabAi: "🤖 AE Laguntzailea",
            tabHuman: "👤 Agentea",
            statusOnline: "Online",
            placeholderAi: "Idatzi zure kontsulta hemen...",
            placeholderHuman: "Idatzi mezu bat teknikariari...",
            btnBack: "Itzuli AE Laguntzailera",
            welcome: "Kaixo! Ongi etorri **Microarea**-ren laguntzaile birtual adimendunera.\n\nHobeto laguntzeko, zein programa edo zerbitzuri buruz egin nahi duzu kontsulta gaur?",
            programConfigured: "Oso ondo. Nire sistema konfiguratu dut **{program}**-ri buruzko kontsultetarako.\n\nIdatzi programari buruzko galdera eta berehala erantzungo dut produktuaren eskuliburuak erabiliz.",
            handoffFormTitle: "Jarri harremanetan laguntza teknikoarekin",
            handoffFormDesc: "Mesedez, bete zure datuak zure galdera Microareako laguntza-teknikari bati helarazteko.",
            formName: "Izen-Abizenak *",
            formEmail: "Posta Elektronikoa *",
            formPhone: "Harremanetarako Telefonoa",
            formSoftware: "Mezua / Kontsulta *",
            btnSubmit: "Bidali Laguntza Eskaera",
            connecting: "Laguntza teknikoarekin konektatzen...",
            noResponse: "Ez dut erantzunik jaso laguntzailearengandik.",
            selectProgram: "Hautatu programa bat hasteko",
            handoffPrefix: "Nahiago duzu ",
            handoffLink: "agente batekin",
            handoffSuffix: " hitz egin?",
            queryFor: "Honako honi buruzko kontsulta: {program}",
            alertFields: "Mesedez, sartu zuren izena eta posta elektronikoa aurrera jarraitzeko.",
            handoffSuccess: "Eskerrik asko, **{name}**! Zure eskaera ongi bidali da gure laguntza teknikoko taldeari.\n\nZure galderen transkripzioa erantsi dugu agente batek kasua azter dezan eta ahalik eta lasterren erantzun diezazun.",
            handoffError: "⚠️ Akats bat gertatu da txartela bidaltzean. \n\nEz kezkatu, gurekin harremanetan jar zaitezke zuzenean **soporte@microareanext.com** helbidera mezu bat idatziz edo **(+34) 96 338 78 20** telefonora deituz.",
            alertFieldsD: "Mesedez, sartu zure izena, posta elektronikoa eta mezua.",
            initiatingChat: "Txata hasten...",
            waitingForTech: "Laguntza-teknikari baten zain...",
            waitingForTechShort: "Teknikari baten zain...",
            techConnected: "Teknikaria konektatuta",
            chatClosedByTech: "Teknikariak txata amaitu du",
            connError: "⚠️ Sentitzen dut, ezin izan dut zerbitzariarekin konektatu. Mesedez, saiatu berriro une batzuk barru.",
            noTechsOnline: "Ez dago teknikaririk online",
            queueMessage: "Itxaron-ilaran {num}. bezeroa zara",
            formProgram: "Zein programari buruz egin nahi duzu kontsulta?",
            commercialInquiry: "Kontsulta Komertziala",
            programs: {
                winlab: "WinLab (Nomina eta Gizarte Segurantza)",
                eoswin: "EosWin (Autonomoak eta Zerghak)",
                maconta: "MaConta (Kontabilitate Orokorra)",
                magest: "MaGest (Fakturazioa eta Biltegia)",
                lexnext: "LexNext (Bulegoak eta Abokatuak)",
                poshability: "Poshability (TPV Merkataritza eta Ostalaritza)",
                general: "Kontsulta Orokorra edo Komertziala"
            }
        },
        gl: {
            title: "Asistente Microarea",
            tabAi: "🤖 Asistente IA",
            tabHuman: "👤 Axente Axuda",
            statusOnline: "En liña",
            placeholderAi: "Escribe a túa consulta aquí...",
            placeholderHuman: "Escribe unha mensaxe ao técnico...",
            btnBack: "Volver ao Asistente IA",
            welcome: "Ola! Benvido ao asistente virtual intelixente de **Microarea**.\n\nPara poder axudarche mellor, sobre que programa o servizo desexas facer a túa consulta hoxe?",
            programConfigured: "Estupendo. Configurei o meu sistema para as túas consultas sobre **{program}**.\n\nEscribe a túa pregunta sobre el programa e responderei ao instante utilizando os manuais de produto.",
            handoffFormTitle: "Contactar con Soporte Técnico",
            handoffFormDesc: "Por favor, enche os teus datos para transferir a túa consulta a un axente de soporte de Microarea.",
            formName: "Nome e Apelidos *",
            formEmail: "Correo Electrónico *",
            formPhone: "Teléfono de Contacto",
            formSoftware: "Mensaxe / Consulta *",
            btnSubmit: "Enviar Solicitude a Soporte",
            connecting: "Conectando con soporte técnico...",
            noResponse: "Non obtiven resposta do asistente.",
            selectProgram: "Selecciona un programa para comezar",
            handoffPrefix: "Prefires falar cun ",
            handoffLink: "axente humano",
            handoffSuffix: "?",
            queryFor: "Consulta para: {program}",
            alertFields: "Por favor, introduce o teu Nome e Correo Electrónico para proceder.",
            handoffSuccess: "Grazas, **{name}**! A túa solicitude foi enviada con éxito ao noso equipo de soporte técnico.\n\nHemos adxuntado a transcrición das túas preguntas para que un axente revise o caso e che responda por correo ou teléfono o antes posible.",
            handoffError: "⚠️ Ocorreu un erro ao enviar a solicitude. \n\nNon te preocupes, podes contactar connosco directamente enviando un correo a **soporte@microareanext.com** ou chamándonos ao **(+34) 96 338 78 20**.",
            alertFieldsD: "Por favor, introduce o teu Nome, Correu Electrónico e consulta.",
            initiatingChat: "Iniciando chat...",
            waitingForTech: "Agardando por un técnico de soporte...",
            waitingForTechShort: "Agardando por un técnico...",
            techConnected: "Técnico conectado en liña",
            chatClosedByTech: "Chat finalizado polo técnico",
            connError: "⚠️ Sentímolo, non se puido conectar co servidor. Por favor, inténtao de novo nuns momentos.",
            noTechsOnline: "Non hai técnicos en liña",
            queueMessage: "Vostede é o cliente número {num} na cola",
            formProgram: "Sobre que programa desexa realizar a consulta?",
            commercialInquiry: "Consulta Comercial",
            programs: {
                winlab: "WinLab (Nóminas e Seguretat Social)",
                eoswin: "EosWin (Autónomos e Estimacións)",
                maconta: "MaConta (Contabilidade Xeral)",
                magest: "MaGest (Facturación e Almacén)",
                lexnext: "LexNext (Despachos e Avogados)",
                poshability: "Poshability (TPV Comercio e Hostalería)",
                general: "Consulta Xeral ou Comercial"
            }
        },
        fr: {
            title: "Assistant Microarea",
            tabAi: "🤖 Assistant IA",
            tabHuman: "👤 Agent Humain",
            statusOnline: "En ligne",
            placeholderAi: "Écrivez votre question ici...",
            placeholderHuman: "Écrivez un message au technicien...",
            btnBack: "Retour à l'Assistant IA",
            welcome: "Bonjour ! Bienvenue dans l'assistant virtuel intelligent de **Microarea**.\n\nPour mieux vous aider, sur quel logiciel ou service souhaitez-vous vous renseigner aujourd'hui ?",
            programConfigured: "Super. J'ai configuré mon système pour vos questions sur **{program}**.\n\nSaisissez votre question sur le logiciel et j'y répondrai instantanément à l'aide des manuels du produit.",
            handoffFormTitle: "Contacter le support technique",
            handoffFormDesc: "Veuillez remplir vos coordonnées pour transférer votre demande à un agent de support Microarea.",
            formName: "Nom et Prénom *",
            formEmail: "Adresse E-mail *",
            formPhone: "Téléphone de contact",
            formSoftware: "Message / Question *",
            btnSubmit: "Envoyer la demande de support",
            connecting: "Connexion au support technique...",
            noResponse: "Je n'ai pas reçu de réponse de l'assistant.",
            selectProgram: "Sélectionnez un programme pour commencer",
            handoffPrefix: "Préférez-vous parler à un ",
            handoffLink: "agent humain",
            handoffSuffix: " ?",
            queryFor: "Demande pour : {program}",
            alertFields: "Veuillez entrer votre nom et votre adresse e-mail pour continuer.",
            handoffSuccess: "Merci, **{name}** ! Votre demande a été envoyée avec succès à notre équipe de support.\n\nNous avons joint l'historique de vos questions afin qu'un agent puisse étudier votre dossier et vous répondre dans les plus brefs délais.",
            handoffError: "⚠️ Une erreur est survenue lors de l'envoi du ticket. \n\nVous pouvez nous contacter directement par e-mail à **soporte@microareanext.com** ou par téléphone au **(+34) 96 338 78 20**.",
            alertFieldsD: "Veuillez saisir votre nom, votre e-mail et votre message.",
            initiatingChat: "Démarrage du chat...",
            waitingForTech: "En attente d'un technicien de support...",
            waitingForTechShort: "En attente d'un technicien...",
            techConnected: "Technicien connecté en ligne",
            chatClosedByTech: "Chat terminé par le technicien",
            connError: "⚠️ Désolé, impossible de se connecter au serveur. Veuillez réessayer dans quelques instants.",
            noTechsOnline: "Aucun technicien en ligne",
            queueMessage: "Vous êtes le client numéro {num} dans la file",
            formProgram: "Sur quel logiciel souhaitez-vous vous renseigner ?",
            commercialInquiry: "Demande Commerciale",
            programs: {
                winlab: "WinLab (Paie & Sécurité Sociale)",
                eoswin: "EosWin (Indépendants & Fiscalité)",
                maconta: "MaConta (Comptabilité Générale)",
                magest: "MaGest (Facturation & Stocks)",
                lexnext: "LexNext (Cabinets d'Avocats & Juristes)",
                poshability: "Poshability (Caisse & Restauration)",
                general: "Demande Générale ou Commerciale"
            }
        },
        bg: {
            title: "Microarea Асистент",
            tabAi: "🤖 ИИ Асистент",
            tabHuman: "👤 Човешки Агент",
            statusOnline: "На линия",
            placeholderAi: "Напишете вашия въпрос тук...",
            placeholderHuman: "Напишете съобщение на техника...",
            btnBack: "Обратно към ИИ Асистент",
            welcome: "Здравейте! Добре дошли в интелигентния виртуален асистент на **Microarea**.\n\nЗа да ви помогнем по-добре, за кой софтуер или услуга искате да попитате днес?",
            programConfigured: "Чудесно. Конфигурирах системата си за вашите въпроси относно **{program}**.\n\nНапишете вашия въпрос за софтуера и аз ще му отговоря незабавно, използвайки ръководствата за продукти.",
            handoffFormTitle: "Свържете се с техническата поддръжка",
            handoffFormDesc: "Моля, попълнете данните си, за да прехвърлите запитването си към агент по поддръжката на Microarea.",
            formName: "Име и Фамилия *",
            formEmail: "Имейл адрес *",
            formPhone: "Телефон за контакт",
            formSoftware: "Съобщение / Запитване *",
            btnSubmit: "Изпрати заявка за поддръжка",
            connecting: "Свързване с техническата поддръжка...",
            noResponse: "Не получих отговор от асистента.",
            selectProgram: "Изберете програма, за да започнете",
            handoffPrefix: "Предпочитате ли да говорите с ",
            handoffLink: "човешки агент",
            handoffSuffix: "?",
            queryFor: "Запитване за: {program}",
            alertFields: "Моля, въведете вашето Име и Имейл адрес, за да продължите.",
            handoffSuccess: "Благодарим ви, **{name}**! Вашата заявка беше изпратена успешно до нашия екип за поддръжка.\n\nПрикачихме хронологията на вашите въпроси, за да може наш представител да се запознае със случая и да ви отговори възможно най-скоро.",
            handoffError: "⚠️ Възникна грешка при изпращането на заявката. \n\nНе се притеснявайте, можете да се свържете с нас директно на имейл **soporte@microareanext.com** или на телефон **(+34) 96 338 78 20**.",
            alertFieldsD: "Моля, въведете вашето Име, Имейл и съобщение.",
            initiatingChat: "Стартиране на чат...",
            waitingForTech: "Изчакване на техник по поддръжката...",
            waitingForTechShort: "Изчакване на техник...",
            techConnected: "Свързан техник на линия",
            chatClosedByTech: "Чатът е прекратен от техника",
            connError: "⚠️ Съжаляваме, не можахме да се свържем със сървъра. Моля, опитайте отново след малко.",
            noTechsOnline: "Няма техници на линия",
            queueMessage: "Вие сте клиент номер {num} на опашката",
            formProgram: "За коя програма желаете да направите запитването?",
            commercialInquiry: "Търговско запитване",
            programs: {
                winlab: "WinLab (Заплати и Осигуряване)",
                eoswin: "EosWin (Свободни Професии и Данъци)",
                maconta: "MaConta (Общо Счетоводство)",
                magest: "MaGest (Фактуриране и Склад)",
                lexnext: "LexNext (Адвокатски Кантори)",
                poshability: "Poshability (ПОС и Ресторантьорство)",
                general: "Общо или Търговско Запитване"
            }
        },
        pl: {
            title: "Asystent Microarea",
            tabAi: "🤖 Asystent AI",
            tabHuman: "👤 Konsultant",
            statusOnline: "Online",
            placeholderAi: "Wpisz tutaj swoje pytanie...",
            placeholderHuman: "Napisz wiadomość do technika...",
            btnBack: "Powrót do Asystenta AI",
            welcome: "Witaj! Zapraszamy do korzystania z inteligentnego wirtualnego asystenta **Microarea**.\n\nAbyśmy mogli lepiej pomóc, o który program lub usługę chcesz dzisiaj zapytać?",
            programConfigured: "Świetnie. Skonfigurowałem system pod kątem pytań o **{program}**.\n\nWpisz swoje pytanie dotyczące oprogramowania, a odpowiem natychmiast, korzystając z instrukcji produktu.",
            handoffFormTitle: "Skontaktuj się z pomocą techniczną",
            handoffFormDesc: "Wypełnij swoje dane, aby przekazać zapytanie do konsultanta Microarea.",
            formName: "Imię i Nazwisko *",
            formEmail: "Adres E-mail *",
            formPhone: "Telefon kontaktowy",
            formSoftware: "Wiadomość / Zapytanie *",
            btnSubmit: "Wyślij zgłoszenie",
            connecting: "Łączenie z pomocą techniczną...",
            noResponse: "Nie otrzymałem odpowiedzi od asystenta.",
            selectProgram: "Wybierz program, aby rozpocząć",
            handoffPrefix: "Czy wolisz porozmawiać z ",
            handoffLink: "konsultantem",
            handoffSuffix: "?",
            queryFor: "Zapytanie dot.: {program}",
            alertFields: "Wprowadź swoje Imię i Adres E-mail, aby kontynuować.",
            handoffSuccess: "Dziękujemy, **{name}**! Twoje zgłoszenie zostało pomyślnie wysłane do zespołu pomocy technicznej.\n\nZałączyliśmy zapis Twoich pytań, aby konsultant mógł przeanalizować sprawę i odpowiedzieć jak najszybciej.",
            handoffError: "⚠️ Wystąpił błąd podczas wysyłania zgłoszenia. \n\nMożesz skontaktować się z nami bezpośrednio przez e-mail **soporte@microareanext.com** ou dzwoniąc pod numer **(+34) 96 338 78 20**.",
            alertFieldsD: "Wprowadź swoje Imię, Adres E-mail i treść zapytania.",
            initiatingChat: "Uruchamianie czatu...",
            waitingForTech: "Oczekiwanie na konsultanta...",
            waitingForTechShort: "Oczekiwanie na konsultanta...",
            techConnected: "Konsultant połączony online",
            chatClosedByTech: "Czat zakończony przez konsultanta",
            connError: "⚠️ Przepraszamy, nie udało się połączyć z serwerem. Spróbuj ponownie za chwilę.",
            noTechsOnline: "Brak dostępnych konsultantów",
            queueMessage: "Jesteś {num}. klientem w kolejce",
            formProgram: "Którego programu dotyczy zapytanie?",
            commercialInquiry: "Zapytanie Handlowe",
            programs: {
                winlab: "WinLab (Kadry i Płace)",
                eoswin: "EosWin (Samozatrudnienie i Podatki)",
                maconta: "MaConta (Księgowość Ogólna)",
                magest: "MaGest (Fakturowanie i Magazyn)",
                lexnext: "LexNext (Kancelarie Prawne)",
                poshability: "Poshability (POS i Gastronomia)",
                general: "Zapytanie Ogólne lub Handlowe"
            }
        }
    };

    const t = translations[currentLang] || translations['es'];

    // Estructura HTML del Widget
    const chatHTML = `
        <div id="microarea-chat-window">
            <div class="microarea-chat-header">
                <div class="microarea-chat-header-info">
                    <div class="microarea-chat-avatar">AI</div>
                    <div>
                        <h4 class="microarea-chat-title">${t.title}</h4>
                        <p class="microarea-chat-status">${t.statusOnline}</p>
                    </div>
                </div>
                <button class="microarea-chat-close-btn" id="microarea-chat-close" aria-label="Cerrar">&times;</button>
            </div>
            
            <!-- Pestañas de Navegación -->
            <div class="microarea-chat-tabs">
                <button class="microarea-chat-tab active" id="microarea-tab-ai">${t.tabAi}</button>
                <button class="microarea-chat-tab" id="microarea-tab-human">${t.tabHuman}</button>
            </div>
            
            <!-- Vista 1: Asistente IA (Conversación Normal) -->
            <div id="microarea-view-ai" style="display: flex; flex-direction: column; flex: 1; overflow: hidden;">
                <div class="microarea-chat-messages" id="microarea-chat-msgs">
                    <!-- Los mensajes se cargarán dinámicamente aquí -->
                </div>

                <div class="microarea-chat-input-area" id="microarea-chat-input-container">
                    <input type="text" class="microarea-chat-input" id="microarea-chat-input" placeholder="${t.placeholderAi}" maxlength="400" autocomplete="off">
                    <button class="microarea-chat-send-btn" id="microarea-chat-send" aria-label="Enviar">
                        <svg viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                    </button>
                </div>
                <div class="microarea-chat-footer">
                    ${t.handoffPrefix}<span class="microarea-chat-trigger-handoff-lnk" id="microarea-chat-trigger-handoff">${t.handoffLink}</span>${t.handoffSuffix}
                </div>
            </div>
            
            <!-- Vista 2: Agente Humano (Formulario Dedicado) -->
            <div id="microarea-view-human" style="display: none; flex-direction: column; flex: 1; overflow-y: auto; padding: 16px; box-sizing: border-box;">
                <div class="microarea-handoff-form-dedicated" id="microarea-handoff-form-container-d">
                    <h5 class="microarea-handoff-title">${t.handoffFormTitle}</h5>
                    <p style="font-size: 12.5px; color: #7f8c8d; margin: 0 0 10px 0; text-align: center; line-height: 1.4;">${t.handoffFormDesc}</p>
                    <div class="microarea-handoff-field">
                        <label for="handoff-name-d">${t.formName}</label>
                        <input type="text" id="handoff-name-d" required placeholder="Ej: Juan Pérez">
                    </div>
                    <div class="microarea-handoff-field">
                        <label for="handoff-email-d">${t.formEmail}</label>
                        <input type="email" id="handoff-email-d" required placeholder="Ej: juan@empresa.com">
                    </div>
                    <div class="microarea-handoff-field">
                        <label for="handoff-phone-d">${t.formPhone}</label>
                        <input type="tel" id="handoff-phone-d" placeholder="Ej: +34 600 000 000">
                    </div>
                    <div class="microarea-handoff-field">
                        <label for="handoff-software-d">${t.formProgram}</label>
                        <select id="handoff-software-d" style="height: 38px; cursor: pointer;">
                            <option value="Comercial">${t.commercialInquiry}</option>
                            <option value="winlab">${t.programs.winlab}</option>
                            <option value="eoswin">${t.programs.eoswin}</option>
                            <option value="maconta">${t.programs.maconta}</option>
                            <option value="magest">${t.programs.magest}</option>
                            <option value="lexnext">${t.programs.lexnext}</option>
                            <option value="poshability">${t.programs.poshability}</option>
                            <option value="general">${t.programs.general}</option>
                        </select>
                    </div>
                    <div class="microarea-handoff-field">
                        <label for="handoff-msg-d">${t.formSoftware}</label>
                        <textarea id="handoff-msg-d" placeholder="Explica brevemente tu duda..." style="border: 1px solid rgba(0, 0, 0, 0.15); border-radius: 8px; padding: 8px 12px; font-size: 13px; outline: none; height: 65px; font-family: inherit; resize: none; box-sizing: border-box;"></textarea>
                    </div>
                    <button class="microarea-handoff-submit" id="handoff-submit-btn-d">${t.btnSubmit}</button>
                </div>
                
                <!-- Vista del Chat en Vivo con el Técnico -->
                <div id="microarea-human-live-chat" style="display: none; flex-direction: column; flex: 1; height: 100%; min-height: 380px; box-sizing: border-box;">
                    <div style="background: rgba(68, 113, 177, 0.08); padding: 8px 12px; border-radius: 8px; font-size: 12px; color: #2e4c76; text-align: center; font-weight: 600; margin-bottom: 10px;" id="microarea-live-chat-status-text">
                        ${t.connecting}
                    </div>
                    <div id="microarea-human-live-chat-msgs" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; max-height: 250px; min-height: 220px; padding: 10px; border: 1px solid rgba(0,0,0,0.06); border-radius: 12px; background: rgba(0,0,0,0.01);">
                        <!-- Mensajes del chat en vivo aparecerán aquí -->
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 8px;">
                        <input type="text" id="microarea-human-live-chat-input" placeholder="${t.placeholderHuman}" style="flex: 1; border: 1px solid rgba(0,0,0,0.15); border-radius: 16px; padding: 8px 12px; font-size: 13px; outline: none; background: #ffffff;" autocomplete="off">
                        <button id="microarea-human-live-chat-send" style="width: 32px; height: 32px; border-radius: 50%; background: #00a99d; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; transition: background 0.2s;">
                            <svg viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: white;"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                        </button>
                    </div>
                    <button id="microarea-human-live-chat-close-btn" style="align-self: center; margin-top: 10px; background: none; border: none; color: #e74c3c; font-size: 11px; font-weight: bold; cursor: pointer; text-decoration: underline; outline: none;">Terminar Chat y Salir</button>
                </div>
                
                <div id="microarea-human-success-msg" style="display: none; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 12px; padding: 20px; box-sizing: border-box;">
                    <div style="font-size: 44px; color: #2ecc71; line-height: 1;">✓</div>
                    <h6 style="font-size: 16px; font-weight: 600; color: #2c3e50; margin: 0;">¡Solicitud Enviada!</h6>
                    <p id="handoff-success-text-d" style="font-size: 13px; color: #7f8c8d; line-height: 1.5; margin: 0;"></p>
                    <button id="handoff-back-to-ai-btn" style="background: linear-gradient(135deg, #00a99d, #007d74); color: #ffffff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: bold; cursor: pointer; margin-top: 10px; outline: none;">${t.btnBack}</button>
                </div>
            </div>
        </div>

        <button id="microarea-chat-trigger" aria-label="Abrir chat">
            <svg viewBox="0 0 24 24" id="microarea-chat-bubble-icon">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
            </svg>
            <svg viewBox="0 0 24 24" id="microarea-chat-close-icon" style="display:none; width:24px; height:24px;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
        </button>
    `;

    // Crear y añadir el contenedor del widget al body
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'microarea-chat-widget';
    widgetContainer.innerHTML = chatHTML;
    document.body.appendChild(widgetContainer);

    // Referencias a los elementos del DOM
    const triggerBtn = document.getElementById('microarea-chat-trigger');
    const chatWindow = document.getElementById('microarea-chat-window');
    const closeBtn = document.getElementById('microarea-chat-close');
    const sendBtn = document.getElementById('microarea-chat-send');
    const chatInput = document.getElementById('microarea-chat-input');
    const msgsContainer = document.getElementById('microarea-chat-msgs');
    const bubbleIcon = document.getElementById('microarea-chat-bubble-icon');
    const closeIcon = document.getElementById('microarea-chat-close-icon');
    const handoffLink = document.getElementById('microarea-chat-trigger-handoff');
    const inputContainer = document.getElementById('microarea-chat-input-container');

    // Referencias para pestañas y vistas
    const tabAi = document.getElementById('microarea-tab-ai');
    const tabHuman = document.getElementById('microarea-tab-human');
    const viewAi = document.getElementById('microarea-view-ai');
    const viewHuman = document.getElementById('microarea-view-human');
    const handoffSubmitBtnD = document.getElementById('handoff-submit-btn-d');
    const handoffBackToAiBtn = document.getElementById('handoff-back-to-ai-btn');
    const humanSuccessMsg = document.getElementById('microarea-human-success-msg');
    const handoffFormContainerD = document.getElementById('microarea-handoff-form-container-d');
    const handoffSuccessTextD = document.getElementById('handoff-success-text-d');

    // Referencias para el Chat en Vivo con Humano
    const liveChatPanel = document.getElementById('microarea-human-live-chat');
    const liveChatMsgs = document.getElementById('microarea-human-live-chat-msgs');
    const liveChatInput = document.getElementById('microarea-human-live-chat-input');
    const liveChatSend = document.getElementById('microarea-human-live-chat-send');
    const liveChatCloseBtn = document.getElementById('microarea-human-live-chat-close-btn');
    const liveChatStatus = document.getElementById('microarea-live-chat-status-text');

    // Estado del chat
    let chatHistory = [];
    let isTyping = false;
    let selectedSoftware = 'Consulta General';
    let isHandoffMode = false;
    let activeSessionId = null;
    let pollingInterval = null;

    // Inicializar historial
    function initChat() {
        const storedHistory = sessionStorage.getItem('microarea_chat_history');
        const storedSoftware = sessionStorage.getItem('microarea_selected_software');
        const storedHandoff = sessionStorage.getItem('microarea_handoff_mode');

        if (storedSoftware) {
            selectedSoftware = storedSoftware;
        }
        if (storedHandoff === 'true') {
            isHandoffMode = true;
        }

        if (storedHistory) {
            chatHistory = JSON.parse(storedHistory);
            renderHistory();
            if (isHandoffMode) {
                renderHandoffForm();
            }
        } else {
            // Bienvenida inicial y menú de selección de software
            const welcomeMsg = {
                sender: 'bot',
                text: t.welcome
            };
            chatHistory.push(welcomeMsg);
            saveHistory();
            renderHistory();
            renderSoftwareOptions();
        }
    }

    // Guardar historial y estados en sessionStorage
    function saveHistory() {
        sessionStorage.setItem('microarea_chat_history', JSON.stringify(chatHistory));
        sessionStorage.setItem('microarea_selected_software', selectedSoftware);
        sessionStorage.setItem('microarea_handoff_mode', isHandoffMode.toString());
    }

    // Renderizar todo el historial
    function renderHistory() {
        msgsContainer.innerHTML = '';
        chatHistory.forEach(msg => {
            appendMessageHTML(msg.sender, msg.text);
        });
        scrollToBottom();
    }

    // Añadir mensaje visualmente al chat
    function appendMessageHTML(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('microarea-message', sender);
        
        if (sender === 'bot') {
            msgDiv.innerHTML = parseMarkdownHtml(text);
        } else {
            msgDiv.textContent = text;
        }
        
        msgsContainer.appendChild(msgDiv);
    }

    // Auto-scroll al final del chat
    function scrollToBottom() {
        setTimeout(() => {
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
        }, 50);
    }

    // Mostrar/ocultar indicador de escritura
    function toggleTypingIndicator(show) {
        const existingIndicator = document.getElementById('microarea-typing-indicator');
        if (show && !existingIndicator) {
            const indicatorDiv = document.createElement('div');
            indicatorDiv.id = 'microarea-typing-indicator';
            indicatorDiv.classList.add('microarea-typing-indicator');
            indicatorDiv.innerHTML = `
                <div class="microarea-typing-dot"></div>
                <div class="microarea-typing-dot"></div>
                <div class="microarea-typing-dot"></div>
            `;
            msgsContainer.appendChild(indicatorDiv);
            scrollToBottom();
        } else if (!show && existingIndicator) {
            existingIndicator.remove();
        }
    }

    // Dibujar los botones de opciones de software
    function renderSoftwareOptions() {
        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('microarea-chat-options');
        optionsDiv.id = 'microarea-software-options';

        const programs = [
            { id: 'winlab', name: t.programs.winlab },
            { id: 'eoswin', name: t.programs.eoswin },
            { id: 'maconta', name: t.programs.maconta },
            { id: 'magest', name: t.programs.magest },
            { id: 'lexnext', name: t.programs.lexnext },
            { id: 'poshability', name: t.programs.poshability },
            { id: 'general', name: t.programs.general }
        ];

        programs.forEach(prog => {
            const btn = document.createElement('button');
            btn.classList.add('microarea-option-btn');
            btn.textContent = prog.name;
            btn.addEventListener('click', () => selectSoftware(prog.name));
            optionsDiv.appendChild(btn);
        });

        msgsContainer.appendChild(optionsDiv);
        scrollToBottom();
    }

    // Seleccionar programa del menú
    async function selectSoftware(programName) {
        // Remover el contenedor visual de opciones
        const optionsDiv = document.getElementById('microarea-software-options');
        if (optionsDiv) optionsDiv.remove();

        selectedSoftware = programName;
        
        // Agregar selección como mensaje de usuario
        const selectMsgText = t.queryFor.replace('{program}', programName);
        const selectMsg = { sender: 'user', text: selectMsgText };
        chatHistory.push(selectMsg);
        appendMessageHTML('user', selectMsgText);
        
        saveHistory();
        scrollToBottom();

        // Respuesta inicial del bot pidiendo la pregunta
        isTyping = true;
        toggleTypingIndicator(true);

        setTimeout(() => {
            toggleTypingIndicator(false);
            const responseText = t.programConfigured.replace('{program}', programName);
            const botResponse = { sender: 'bot', text: responseText };
            chatHistory.push(botResponse);
            saveHistory();
            appendMessageHTML('bot', responseText);
            scrollToBottom();
            isTyping = false;
        }, 800);
    }

    // Parseo de Markdown
    function parseMarkdownHtml(text) {
        let html = text;
        html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        const lines = html.split('\n');
        let inList = false;
        let formattedLines = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                if (!inList) {
                    formattedLines.push('<ul>');
                    inList = true;
                }
                const content = trimmed.substring(2);
                formattedLines.push(`<li>${content}</li>`);
            } else {
                if (inList) {
                    formattedLines.push('</ul>');
                    inList = false;
                }
                formattedLines.push(line);
            }
        });
        if (inList) formattedLines.push('</ul>');

        html = formattedLines.join('\n');
        html = html.replace(/\n/g, '<br>');
        html = html.replace(/<\/ul><br>/g, '</ul>');
        html = html.replace(/<br><ul>/g, '<ul>');

        return html;
    }

    // Activar formulario de handoff humano
    function triggerHandoff() {
        if (isHandoffMode) return;
        
        isHandoffMode = true;
        saveHistory();
        
        const requestMsg = { sender: 'bot', text: t.handoffFormDesc };
        chatHistory.push(requestMsg);
        saveHistory();
        
        appendMessageHTML('bot', requestMsg.text);
        renderHandoffForm();
    }

    // Dibujar el formulario de datos en el chat
    function renderHandoffForm() {
        // Ocultar caja de entrada de texto mientras se rellena el formulario
        inputContainer.style.display = 'none';

        const formDiv = document.createElement('div');
        formDiv.classList.add('microarea-handoff-form');
        formDiv.id = 'microarea-handoff-form-container';
        formDiv.innerHTML = `
            <h5 class="microarea-handoff-title">${t.handoffFormTitle}</h5>
            <div class="microarea-handoff-field">
                <label for="handoff-name">${t.formName}</label>
                <input type="text" id="handoff-name" required placeholder="Ej: Juan Pérez">
            </div>
            <div class="microarea-handoff-field">
                <label for="handoff-email">${t.formEmail}</label>
                <input type="email" id="handoff-email" required placeholder="Ej: juan@empresa.com">
            </div>
            <div class="microarea-handoff-field">
                <label for="handoff-phone">${t.formPhone}</label>
                <input type="tel" id="handoff-phone" placeholder="Ej: +34 600 000 000">
            </div>
            <button class="microarea-handoff-submit" id="handoff-submit-btn">${t.btnSubmit}</button>
        `;

        msgsContainer.appendChild(formDiv);
        scrollToBottom();

        document.getElementById('handoff-submit-btn').addEventListener('click', handleHandoffSubmit);
    }

    // Manejar envío del formulario de Handoff
    async function handleHandoffSubmit() {
        const name = document.getElementById('handoff-name').value.trim();
        const email = document.getElementById('handoff-email').value.trim();
        const phone = document.getElementById('handoff-phone').value.trim();

        if (!name || !email) {
            alert(t.alertFields);
            return;
        }

        // Remover formulario
        const formDiv = document.getElementById('microarea-handoff-form-container');
        if (formDiv) formDiv.remove();

        // Mostrar indicador de carga
        isTyping = true;
        toggleTypingIndicator(true);

        try {
            // Llamar al endpoint de handoff
            const response = await fetch('/api/handoff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    software: selectedSoftware,
                    history: chatHistory,
                    lang: currentLang
                })
            });

            toggleTypingIndicator(false);

            if (response.ok) {
                const successText = t.handoffSuccess.replace('{name}', name);
                chatHistory.push({ sender: 'bot', text: successText });
                appendMessageHTML('bot', successText);
            } else {
                throw new Error('Error al enviar ticket');
            }
        } catch (error) {
            console.error('[Handoff] Error al enviar ticket:', error);
            toggleTypingIndicator(false);
            const errorText = t.handoffError;
            chatHistory.push({ sender: 'bot', text: errorText });
            appendMessageHTML('bot', errorText);
        } finally {
            isTyping = false;
            // Reactivar entrada de chat por si desean escribir algo más
            inputContainer.style.display = 'flex';
            isHandoffMode = false;
            saveHistory();
            scrollToBottom();
        }
    }

    // Toggle de la Ventana de Chat
    function toggleChat() {
        const isOpen = chatWindow.classList.toggle('open');
        triggerBtn.classList.toggle('open', isOpen);
        
        if (isOpen) {
            bubbleIcon.style.display = 'none';
            closeIcon.style.display = 'block';
            if (inputContainer.style.display !== 'none') {
                chatInput.focus();
            }
            scrollToBottom();
        } else {
            bubbleIcon.style.display = 'block';
            closeIcon.style.display = 'none';
            // Reiniciar el estado del chat cuando se cierra
            resetChatState();
        }
    }

    // Cambiar entre vista de Asistente IA y Agente Humano
    function showView(viewName) {
        if (viewName === 'ai') {
            tabAi.classList.add('active');
            tabHuman.classList.remove('active');
            viewAi.style.display = 'flex';
            viewHuman.style.display = 'none';
            scrollToBottom();
        } else if (viewName === 'human') {
            tabHuman.classList.add('active');
            tabAi.classList.remove('active');
            viewHuman.style.display = 'flex';
            viewAi.style.display = 'none';
            
            // Restablecer el formulario dedicado
            handoffFormContainerD.style.display = 'flex';
            humanSuccessMsg.style.display = 'none';
        }
    }

    // Enviar formulario de Handoff dedicado (Pestaña Humano) -> Iniciar Chat en Vivo
    async function handleHandoffSubmitD() {
        const name = document.getElementById('handoff-name-d').value.trim();
        const email = document.getElementById('handoff-email-d').value.trim();
        const phone = document.getElementById('handoff-phone-d').value.trim();
        const software = document.getElementById('handoff-software-d').value;
        const message = document.getElementById('handoff-msg-d').value.trim();

        if (!name || !email || !message) {
            alert(t.alertFieldsD);
            return;
        }

        const submitBtn = document.getElementById('handoff-submit-btn-d');
        submitBtn.disabled = true;
        submitBtn.textContent = t.initiatingChat;

        try {
            // Inicializar la sesión en el servidor Express
            const response = await fetch('/api/chat/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    software,
                    lang: currentLang
                })
            });

            if (response.ok) {
                const data = await response.json();
                activeSessionId = data.sessionId;

                // Enviar el mensaje inicial que escribió el usuario
                await fetch('/api/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: activeSessionId,
                        sender: 'user',
                        text: message
                    })
                });

                // Transición visual: Ocultar formulario, mostrar panel de chat en vivo
                handoffFormContainerD.style.display = 'none';
                liveChatPanel.style.display = 'flex';
                liveChatStatus.textContent = t.waitingForTech;
                liveChatStatus.style.background = 'rgba(230, 126, 34, 0.1)';
                liveChatStatus.style.color = '#d35400';

                // Iniciar polling
                startLiveChatPolling();
            } else {
                throw new Error('Error al iniciar chat en vivo');
            }
        } catch (error) {
            console.error('[Handoff Live Chat] Error:', error);
            alert(t.connError);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = t.btnSubmit;
        }
    }

    // Iniciar el ciclo de polling para recibir mensajes del técnico
    function startLiveChatPolling() {
        if (pollingInterval) clearInterval(pollingInterval);
        
        // Primera consulta inmediata
        fetchLiveChatMessages();
        
        // Consultar cada 2 segundos
        pollingInterval = setInterval(fetchLiveChatMessages, 2000);
    }

    // Consultar mensajes en el servidor
    async function fetchLiveChatMessages() {
        if (!activeSessionId) return;

        try {
            const response = await fetch(`/api/chat/messages?sessionId=${activeSessionId}`);
            if (!response.ok) return;

            const data = await response.json();
            
            // Actualizar estado visual
            if (data.status === 'pending') {
                if (data.activeTechsCount === 0) {
                    liveChatStatus.textContent = t.noTechsOnline;
                    liveChatStatus.style.background = 'rgba(231, 76, 60, 0.1)';
                    liveChatStatus.style.color = '#c0392b';
                } else if (data.queuePos && data.queuePos > data.activeTechsCount) {
                    liveChatStatus.textContent = t.queueMessage.replace('{num}', data.queuePos);
                    liveChatStatus.style.background = 'rgba(230, 126, 34, 0.1)';
                    liveChatStatus.style.color = '#d35400';
                } else {
                    liveChatStatus.textContent = t.waitingForTechShort;
                    liveChatStatus.style.background = 'rgba(230, 126, 34, 0.1)';
                    liveChatStatus.style.color = '#d35400';
                }
            } else if (data.status === 'active') {
                liveChatStatus.textContent = t.techConnected;
                liveChatStatus.style.background = 'rgba(46, 204, 113, 0.1)';
                liveChatStatus.style.color = '#27ae60';
            } else if (data.status === 'closed') {
                liveChatStatus.textContent = t.chatClosedByTech;
                liveChatStatus.style.background = 'rgba(127, 140, 141, 0.1)';
                liveChatStatus.style.color = '#7f8c8d';
                clearInterval(pollingInterval);
            }

            // Dibujar mensajes
            liveChatMsgs.innerHTML = '';
            data.messages.forEach(msg => {
                const msgDiv = document.createElement('div');
                msgDiv.style.maxWidth = '85%';
                msgDiv.style.padding = '8px 12px';
                msgDiv.style.borderRadius = '12px';
                msgDiv.style.fontSize = '13.5px';
                msgDiv.style.lineHeight = '1.4';
                msgDiv.style.wordBreak = 'break-word';
                msgDiv.style.animation = 'fade-in-up 0.2s ease';

                if (msg.sender === 'user') {
                    msgDiv.style.backgroundColor = '#00a99d';
                    msgDiv.style.color = '#ffffff';
                    msgDiv.style.alignSelf = 'flex-end';
                    msgDiv.style.borderBottomRightRadius = '2px';
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = msg.text;
                    msgDiv.appendChild(textSpan);
                } else if (msg.sender === 'tech') {
                    msgDiv.style.backgroundColor = 'rgba(240, 242, 245, 0.9)';
                    msgDiv.style.color = '#2c3e50';
                    msgDiv.style.alignSelf = 'flex-start';
                    msgDiv.style.borderBottomLeftRadius = '2px';
                    msgDiv.style.border = '1px solid rgba(0,0,0,0.05)';
                    
                    if (msg.agentName) {
                        const nameSpan = document.createElement('span');
                        nameSpan.style.display = 'block';
                        nameSpan.style.fontSize = '10px';
                        nameSpan.style.fontWeight = 'bold';
                        nameSpan.style.color = '#007d74';
                        nameSpan.style.marginBottom = '2px';
                        nameSpan.textContent = msg.agentName;
                        msgDiv.appendChild(nameSpan);
                    }
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = msg.text;
                    msgDiv.appendChild(textSpan);
                } else {
                    // System/bot
                    msgDiv.style.backgroundColor = 'rgba(0, 169, 157, 0.05)';
                    msgDiv.style.color = '#007d74';
                    msgDiv.style.alignSelf = 'center';
                    msgDiv.style.fontSize = '12px';
                    msgDiv.style.textAlign = 'center';
                    msgDiv.style.fontStyle = 'italic';
                    
                    const textSpan = document.createElement('span');
                    textSpan.textContent = msg.text;
                    msgDiv.appendChild(textSpan);
                }

                liveChatMsgs.appendChild(msgDiv);
            });

            // Si el técnico está escribiendo, añadir indicador de escritura
            if (data.techIsTyping) {
                const typingIndicatorDiv = document.createElement('div');
                typingIndicatorDiv.style.display = 'flex';
                typingIndicatorDiv.style.gap = '5px';
                typingIndicatorDiv.style.padding = '8px 12px';
                typingIndicatorDiv.style.backgroundColor = 'rgba(240, 242, 245, 0.85)';
                typingIndicatorDiv.style.borderRadius = '12px';
                typingIndicatorDiv.style.alignSelf = 'flex-start';
                typingIndicatorDiv.style.borderBottomLeftRadius = '2px';
                typingIndicatorDiv.style.border = '1px solid rgba(0,0,0,0.05)';
                typingIndicatorDiv.style.animation = 'fade-in-up 0.2s ease';
                typingIndicatorDiv.style.maxWidth = '85%';
                typingIndicatorDiv.innerHTML = `
                    <div class="microarea-typing-dot"></div>
                    <div class="microarea-typing-dot"></div>
                    <div class="microarea-typing-dot"></div>
                `;
                liveChatMsgs.appendChild(typingIndicatorDiv);
            }

            // Auto-scroll al fondo
            liveChatMsgs.scrollTop = liveChatMsgs.scrollHeight;

        } catch (err) {
            console.error('Error al recuperar mensajes de soporte:', err);
        }
    }

    // Enviar un mensaje al chat activo
    async function sendLiveChatMessage() {
        const text = liveChatInput.value.trim();
        if (!text || !activeSessionId) return;

        liveChatInput.value = '';

        try {
            await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeSessionId,
                    sender: 'user',
                    text
                })
            });
            fetchLiveChatMessages();
        } catch (err) {
            console.error('Error al enviar mensaje de chat en vivo:', err);
        }
    }

    // Terminar la sesión de chat activa
    async function closeLiveChat() {
        if (!activeSessionId) return;

        try {
            await fetch('/api/chat/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: activeSessionId })
            });
        } catch (err) {
            console.error('Error al finalizar sesión de chat:', err);
        } finally {
            if (pollingInterval) clearInterval(pollingInterval);
            activeSessionId = null;
            
            // Regresar al estado limpio
            liveChatPanel.style.display = 'none';
            handoffFormContainerD.style.display = 'flex';
            showView('ai');
        }
    }

    // Reiniciar por completo el estado del chat
    function resetChatState() {
        if (pollingInterval) clearInterval(pollingInterval);
        if (activeSessionId) {
            closeLiveChat();
        }

        sessionStorage.removeItem('microarea_chat_history');
        sessionStorage.removeItem('microarea_selected_software');
        sessionStorage.removeItem('microarea_handoff_mode');
        
        chatHistory = [];
        isTyping = false;
        selectedSoftware = 'Consulta General';
        isHandoffMode = false;
        activeSessionId = null;
        
        // Mostrar entrada y footer de IA
        inputContainer.style.display = 'flex';
        
        // Ocultar panel de chat en vivo
        liveChatPanel.style.display = 'none';
        
        // Limpiar campos de formularios
        document.getElementById('handoff-name-d').value = '';
        document.getElementById('handoff-email-d').value = '';
        document.getElementById('handoff-phone-d').value = '';
        document.getElementById('handoff-msg-d').value = '';
        
        // Volver a la pestaña IA activa
        showView('ai');
        
        // Inicializar de nuevo
        initChat();
    }

    // Manejar envío de mensaje normal
    async function handleSend() {
        const queryText = chatInput.value.trim();
        if (!queryText || isTyping) return;

        chatInput.value = '';
        chatInput.style.height = '20px';
        
        const userMsg = { sender: 'user', text: queryText };
        chatHistory.push(userMsg);
        saveHistory();
        appendMessageHTML('user', queryText);
        scrollToBottom();

        isTyping = true;
        toggleTypingIndicator(true);

        try {
            // Llamada al endpoint API local enviando el software seleccionado e idioma de la página
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    query: queryText,
                    software: selectedSoftware,
                    lang: currentLang
                })
            });

            if (!response.ok) {
                throw new Error('Respuesta del servidor no válida');
            }

            const data = await response.json();
            
            toggleTypingIndicator(false);
            const botResponseText = data.response || t.noResponse;
            
            // Detectar si la respuesta de la IA requiere handoff
            if (botResponseText.includes('[HANDOFF]') || queryText.toLowerCase() === 'agente' || queryText.toLowerCase().includes('humano')) {
                const cleanedText = botResponseText.replace('[HANDOFF]', '');
                const botMsg = { sender: 'bot', text: cleanedText };
                chatHistory.push(botMsg);
                appendMessageHTML('bot', cleanedText);
                triggerHandoff();
            } else {
                const botMsg = { sender: 'bot', text: botResponseText };
                chatHistory.push(botMsg);
                saveHistory();
                appendMessageHTML('bot', botResponseText);
            }
            
            scrollToBottom();
        } catch (error) {
            console.error('[Chat Widget] Error al enviar mensaje:', error);
            toggleTypingIndicator(false);
            const errorMsgText = t.connError;
            appendMessageHTML('bot', errorMsgText);
            scrollToBottom();
        } finally {
            isTyping = false;
        }
    }

    // Event Listeners
    triggerBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', handleSend);
    handoffLink.addEventListener('click', (e) => {
        e.preventDefault();
        triggerHandoff();
    });
    
    // Listeners de Pestañas y Formulario Dedicado Humano
    tabAi.addEventListener('click', () => showView('ai'));
    tabHuman.addEventListener('click', () => showView('human'));
    handoffSubmitBtnD.addEventListener('click', handleHandoffSubmitD);
    handoffBackToAiBtn.addEventListener('click', () => showView('ai'));
    
    // Listeners para el Chat en Vivo con Humano
    liveChatSend.addEventListener('click', sendLiveChatMessage);
    liveChatCloseBtn.addEventListener('click', closeLiveChat);
    liveChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendLiveChatMessage();
        }
    });
    
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    chatInput.addEventListener('input', function() {
        this.style.height = '20px';
        this.style.height = (this.scrollHeight - 20) + 'px';
    });

    // Inicializar el chat
    initChat();
})();
