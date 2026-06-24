(function() {
  var searchIndex = null;
  var isFetching = false;
  var currentLang = 'es';

  // Modal Translations dictionary
  var searchI18n = {
    es: {
      placeholder: "Buscar en la web...",
      typing: "Escribe algo para comenzar a buscar...",
      loading: "Cargando índice de búsqueda...",
      noResults: "No se encontraron resultados para"
    },
    en: {
      placeholder: "Search the website...",
      typing: "Type something to start searching...",
      loading: "Loading search index...",
      noResults: "No results found for"
    },
    it: {
      placeholder: "Cerca nel sito...",
      typing: "Scrivi qualcosa per iniziare a cercare...",
      loading: "Caricamento dell'indice di ricerca...",
      noResults: "Nessun risultato trovato per"
    },
    de: {
      placeholder: "Website durchsuchen...",
      typing: "Geben Sie etwas ein, um die Suche zu starten...",
      loading: "Suchindex wird geladen...",
      noResults: "Keine Ergebnisse gefunden für"
    },
    ca: {
      placeholder: "Cercar al lloc web...",
      typing: "Escriu alguna cosa per començar a cercar...",
      loading: "Carregant l'índex de cerca...",
      noResults: "No s'han trobat resultats per a"
    },
    bg: {
      placeholder: "Търсене в сайта...",
      typing: "Напишете нещо, за да започнете търсенето...",
      loading: "Зареждане на индекса за търсене...",
      noResults: "Няма намерени резултати за"
    },
    pt: {
      placeholder: "Pesquisar no site...",
      typing: "Digite algo para começar a pesquisar...",
      loading: "Carregando o índice de pesquisa...",
      noResults: "Nenhum resultado encontrado para"
    },
    tr: {
      placeholder: "Web sitesinde ara...",
      typing: "Aramaya başlamak için bir şeyler yazın...",
      loading: "Arama dizini yükleniyor...",
      noResults: "Şunun için sonuç bulunamadı:"
    },
    eu: {
      placeholder: "Bilatu webgunean...",
      typing: "Idatzi zerbait bilatzen hasteko...",
      loading: "Bilaketa indizea kargatzen...",
      noResults: "Ez da emaitzarik aurkitu honentzako:"
    },
    gl: {
      placeholder: "Buscar no sitio web...",
      typing: "Escribe algo para comezar a buscar...",
      loading: "Cargando o índice de busca...",
      noResults: "Non se atoparon resultados para"
    }
  };

  function detectCurrentLanguage() {
    var path = window.location.pathname;
    
    // Check if on a product subdomain port/query
    var urlParams = new URLSearchParams(window.location.search);
    var langParam = urlParams.get('idioma') || urlParams.get('lang');
    if (langParam) {
      var l = langParam.substring(0, 2).toLowerCase();
      if (searchI18n[l]) {
        return l;
      }
    }

    // Check directory path
    var segments = path.split('/').filter(Boolean);
    if (segments.length > 0) {
      var possibleLang = segments[0].toLowerCase();
      if (searchI18n[possibleLang]) {
        return possibleLang;
      }
    }

    return 'es';
  }

  function initSearch() {
    if (document.getElementById('search-modal-overlay')) return;

    currentLang = detectCurrentLanguage();
    var i18n = searchI18n[currentLang] || searchI18n['es'];

    // Create Modal HTML
    var modalHTML = 
      '<div id="search-modal-overlay">' +
      '  <div id="search-modal-container">' +
      '    <div class="search-modal-brand" style="display: flex !important; align-items: center !important; justify-content: space-between !important; padding: 18px 24px 12px 24px !important; border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; background: #0f172a !important;">' +
      '      <div style="background: rgba(255, 255, 255, 0.9) !important; padding: 5px 12px !important; border-radius: 8px !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;">' +
      '        <img src="/wp-content/uploads/2021/06/logo_web.png" alt="Microarea" style="height: 24px !important; width: auto !important; display: block !important;" />' +
      '      </div>' +
      '      <button id="search-modal-close" class="search-modal-close-btn" style="padding: 0 !important; margin: 0 !important; font-size: 28px !important; line-height: 1 !important;">&times;</button>' +
      '    </div>' +
      '    <div class="search-modal-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;">' +
      '      <svg viewBox="0 0 24 24" width="20" height="20" stroke="#94a3b8" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px; flex-shrink: 0;">' +
      '        <circle cx="11" cy="11" r="8"></circle>' +
      '        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>' +
      '      </svg>' +
      '      <input type="text" id="search-modal-input" placeholder="' + i18n.placeholder + '" />' +
      '    </div>' +
      '    <div id="search-modal-results" class="search-modal-results">' +
      '      <div style="text-align: center; color: #64748b; padding: 20px;">' + i18n.typing + '</div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    var div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstChild);

    var overlay = document.getElementById('search-modal-overlay');
    var closeBtn = document.getElementById('search-modal-close');
    var input = document.getElementById('search-modal-input');
    var resultsContainer = document.getElementById('search-modal-results');

    // Attach search trigger click event
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document) {
        if (target.id === 'search-trigger' || (target.className && typeof target.className === 'string' && target.className.indexOf('search-trigger') !== -1)) {
          e.preventDefault();
          openModal();
          return;
        }
        target = target.parentNode;
      }
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.style.display === 'flex') {
        closeModal();
      }
    });

    input.addEventListener('input', function() {
      performSearch(input.value.trim());
    });

    function openModal() {
      // Re-detect language in case it changed dynamically
      currentLang = detectCurrentLanguage();
      i18n = searchI18n[currentLang] || searchI18n['es'];

      // Update placeholder
      input.placeholder = i18n.placeholder;

      overlay.style.display = 'flex';
      input.value = '';
      resultsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">' + i18n.typing + '</div>';
      setTimeout(function() {
        input.focus();
      }, 50);
      loadIndex();
    }

    function closeModal() {
      overlay.style.display = 'none';
    }

    function loadIndex() {
      if (searchIndex || isFetching) return;
      isFetching = true;
      fetch('/search_index.json')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          searchIndex = data;
          isFetching = false;
          if (input.value.trim()) {
            performSearch(input.value.trim());
          }
        })
        .catch(function(err) {
          console.error("Failed to load search index:", err);
          isFetching = false;
        });
    }

    function performSearch(query) {
      if (!query) {
        resultsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">' + i18n.typing + '</div>';
        return;
      }

      if (!searchIndex) {
        resultsContainer.innerHTML = '<div style="text-align: center; color: #64748b; padding: 20px;">' + i18n.loading + '</div>';
        return;
      }

      var queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
      if (queryWords.length === 0) return;

      var results = [];

      searchIndex.forEach(function(page) {
        // EXCLUSIVELY search content matching current page's language
        if (page.lang !== currentLang) {
          return;
        }

        var score = 0;
        var pageTitle = page.title.toLowerCase();
        var pageHeadings = page.headings.toLowerCase();
        var pageText = page.text.toLowerCase();
        
        var matchesAll = queryWords.every(function(word) {
          var wordMatches = false;
          if (pageTitle.indexOf(word) !== -1) {
            score += 15;
            wordMatches = true;
          }
          if (pageHeadings.indexOf(word) !== -1) {
            score += 5;
            wordMatches = true;
          }
          if (pageText.indexOf(word) !== -1) {
            score += 2;
            wordMatches = true;
          }
          return wordMatches;
        });

        if (matchesAll && score > 0) {
          results.push({
            page: page,
            score: score
          });
        }
      });

      results.sort(function(a, b) {
        return b.score - a.score;
      });

      if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="search-no-results">' + i18n.noResults + ' "' + escapeHtml(query) + '"</div>';
        return;
      }

      var html = '';
      var limit = Math.min(results.length, 15);
      for (var i = 0; i < limit; i++) {
        var res = results[i];
        var p = res.page;
        
        var snippet = p.text;
        if (snippet.length > 180) {
          snippet = snippet.substring(0, 180) + '...';
        }

        var isSubdomain = p.url.startsWith('http');
        var subtitle = p.headings || (isSubdomain ? 'Subdominio del Programa' : '');

        html += 
          '<a href="' + p.url + '" class="search-result-item">' +
          '  <div class="search-result-title">' +
          '    <span>' + escapeHtml(p.title) + '</span>' +
          '  </div>' +
          (subtitle ? '  <div class="search-result-headings">' + escapeHtml(subtitle) + '</div>' : '') +
          '  <div class="search-result-snippet">' + escapeHtml(snippet) + '</div>' +
          '</a>';
      }

      resultsContainer.innerHTML = html;
    }

    function escapeHtml(text) {
      var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
  }

  // Bind to DOM
  document.addEventListener('DOMContentLoaded', initSearch);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initSearch();
  }
})();


// --- MicroArea AI Feature Implementation ---
(function() {
  function initAiModal() {
    if (document.getElementById('ai-modal-overlay')) return;

    // Create Modal HTML
    var modalHTML = 
      '<div id="ai-modal-overlay">' +
      '  <!-- Google Sign-In Card -->' +
      '  <div id="ai-login-card" class="dark" style="position: relative !important;">' +
      '    <button id="ai-login-close" style="position: absolute !important; top: 16px !important; right: 20px !important; background: transparent !important; border: none !important; color: #94a3b8 !important; font-size: 28px !important; cursor: pointer !important; line-height: 1 !important; transition: color 0.2s ease !important; padding: 0 !important; margin: 0 !important;">&times;</button>' +
      '    <div class="google-logo-container">' +
      '      <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">' +
      '        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>' +
      '        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
      '        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>' +
      '        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>' +
      '      </svg>' +
      '    </div>' +
      '    <h2 class="ai-login-title" id="login-title">Acceder</h2>' +
      '    <p class="ai-login-subtitle" id="login-subtitle">Ir a MicroArea AI (Gemini)</p>' +
      '    ' +
      '    <button class="google-signin-btn-custom" id="google-signin-btn">' +
      '      <svg class="google-btn-logo" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" style="margin-right: 12px; display: inline-block; vertical-align: middle;">' +
      '        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>' +
      '        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
      '        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>' +
      '        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>' +
      '      </svg>' +
      '      <span>Iniciar sesión con Google</span>' +
      '    </button>' +
      '  </div>' +
      '' +
      '  <!-- Gemini Chat Card -->' +
      '  <div id="gemini-chat-card" style="display: none;">' +
      '    <div class="gemini-header">' +
      '      <div class="gemini-logo-text">' +
      '        <svg viewBox="0 0 24 24" width="20" height="20" fill="url(#geminiGradientHeader)" style="display: inline-block; vertical-align: middle;">' +
      '          <defs>' +
      '            <linearGradient id="geminiGradientHeader" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '              <stop offset="0%" stop-color="#9bc5ff" /><stop offset="50%" stop-color="#c1a6ff" /><stop offset="100%" stop-color="#ff9eb5" />' +
      '            </linearGradient>' +
      '          </defs>' +
      '          <path d="M12 2a9.7 9.7 0 0 0 .7 3.3c.5 1.2 1.3 2.2 2.4 2.8 1.1.6 2.3.9 3.5.9a9.7 9.7 0 0 0-3.3.7c-1.2.5-2.2 1.3-2.8 2.4-.6 1.1-.9 2.3-.9 3.5a9.7 9.7 0 0 0-.7-3.3c-.5-1.2-1.3-2.2-2.4-2.8a9.7 9.7 0 0 0-3.5-.9 9.7 9.7 0 0 0 3.3-.7c1.2-.5 2.2-1.3 2.8-2.4.6-1.1.9-2.3.9-3.5z"/>' +
      '        </svg>' +
      '        <span>MicroArea Ai</span>' +
      '      </div>' +
      '      <div class="gemini-user-profile">' +
      '        <span id="gemini-display-email"></span>' +
      '        <div class="gemini-user-avatar" id="gemini-avatar-letter">U</div>' +
      '        <button class="gemini-disconnect-btn" id="gemini-disconnect">Desconectar</button>' +
      '        <button id="ai-chat-close" style="background: transparent !important; border: none !important; color: #94a3b8 !important; font-size: 28px !important; cursor: pointer !important; line-height: 1 !important; padding: 0 0 0 12px !important; margin: 0 !important; transition: color 0.2s ease !important;">&times;</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="gemini-chat-area" id="gemini-chat-area">' +
      '      <!-- Welcome Screen -->' +
      '      <div class="gemini-welcome-card" id="gemini-welcome">' +
      '        <h3>Hola.</h3>' +
      '        <p>Soy el asistente inteligente de MicroArea. Pregúntame sobre WinLab, EosWin, MaConta, LexNext, o cualquier consulta sobre nuestros productos y servicios.</p>' +
      '      </div>' +
      '    </div>' +
      '    <div class="gemini-input-area">' +
      '      <div class="gemini-input-container">' +
      '        <textarea id="gemini-input" placeholder="Pregunta a Gemini..." rows="1"></textarea>' +
      '        <button class="gemini-send-btn" id="gemini-send-btn" disabled>' +
      '          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '            <line x1="22" y1="2" x2="11" y2="13"></line>' +
      '            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>' +
      '          </svg>' +
      '        </button>' +
      '      </div>' +
      '      <div class="gemini-disclaimer">MicroArea AI puede cometer errores. Considera verificar la información importante.</div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    var div = document.createElement('div');
    div.innerHTML = modalHTML;
    document.body.appendChild(div.firstChild);

    var overlay = document.getElementById('ai-modal-overlay');
    var loginCard = document.getElementById('ai-login-card');
    var chatCard = document.getElementById('gemini-chat-card');
    
    var btnDisconnect = document.getElementById('gemini-disconnect');
    var btnSend = document.getElementById('gemini-send-btn');
    var chatInput = document.getElementById('gemini-input');
    var chatArea = document.getElementById('gemini-chat-area');
    
    var userEmailDisplay = document.getElementById('gemini-display-email');
    var avatarLetter = document.getElementById('gemini-avatar-letter');

    var loginCloseBtn = document.getElementById('ai-login-close');
    var chatCloseBtn = document.getElementById('ai-chat-close');

    if (loginCloseBtn) {
      loginCloseBtn.addEventListener('click', closeAiModal);
      loginCloseBtn.addEventListener('mouseover', function() { loginCloseBtn.style.color = '#ffffff'; });
      loginCloseBtn.addEventListener('mouseout', function() { loginCloseBtn.style.color = '#94a3b8'; });
    }
    if (chatCloseBtn) {
      chatCloseBtn.addEventListener('click', closeAiModal);
      chatCloseBtn.addEventListener('mouseover', function() { chatCloseBtn.style.color = '#ffffff'; });
      chatCloseBtn.addEventListener('mouseout', function() { chatCloseBtn.style.color = '#94a3b8'; });
    }

    // Trigger AI popup
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document) {
        if (target.id === 'ai-trigger' || (target.className && typeof target.className === 'string' && target.className.indexOf('ai-trigger') !== -1)) {
          e.preventDefault();
          openAiModal();
          return;
        }
        target = target.parentNode;
      }
    });

    // Close when clicking overlay (except cards)
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeAiModal();
      }
    });

    // ESC close
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && overlay.style.display === 'flex') {
        closeAiModal();
      }
    });

    // Google Sign-In button click
    var googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', function() {
        var width = 500;
        var height = 600;
        var left = (screen.width - width) / 2;
        var top = (screen.height - height) / 2;
        window.open('/google_auth.html', 'GoogleAuth', 'width=' + width + ',height=' + height + ',left=' + left + ',top=' + top);
      });
    }

    // Message listener for Google Auth callback
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'google-auth-success') {
        var email = event.data.email;
        var token = event.data.accessToken;
        localStorage.setItem('google_user', email);
        if (token) {
          localStorage.setItem('google_access_token', token);
        } else {
          localStorage.removeItem('google_access_token');
        }
        transitionToChat(email);
      }
    });

    btnDisconnect.addEventListener('click', function() {
      localStorage.removeItem('google_user');
      localStorage.removeItem('google_access_token');
      chatCard.style.display = 'none';
      loginCard.style.display = 'block';
    });

    // Chat input listeners
    chatInput.addEventListener('input', function() {
      chatInput.style.height = 'auto';
      chatInput.style.height = (chatInput.scrollHeight) + 'px';
      if (chatInput.value.trim()) {
        btnSend.disabled = false;
        btnSend.classList.add('active');
      } else {
        btnSend.disabled = true;
        btnSend.classList.remove('active');
      }
    });

    chatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    btnSend.addEventListener('click', sendMessage);

    function openAiModal() {
      overlay.style.display = 'flex';
      
      // Verify OAuth configuration from the server
      fetch('/api/auth/config')
        .then(function(res) { return res.json(); })
        .then(function(config) {
          var googleClientId = config.clientId;
          var loggedUser = localStorage.getItem('google_user');
          var token = localStorage.getItem('google_access_token');
          
          if (loggedUser && (!googleClientId || token)) {
            transitionToChat(loggedUser);
          } else {
            if (googleClientId && !token) {
              localStorage.removeItem('google_user');
            }
            loginCard.style.display = 'block';
            chatCard.style.display = 'none';
          }
        })
        .catch(function(err) {
          console.error('Error checking OAuth config on open:', err);
          var loggedUser = localStorage.getItem('google_user');
          if (loggedUser) {
            transitionToChat(loggedUser);
          } else {
            loginCard.style.display = 'block';
            chatCard.style.display = 'none';
          }
        });
    }

    function closeAiModal() {
      overlay.style.display = 'none';
    }

    function transitionToChat(email) {
      loginCard.style.display = 'none';
      chatCard.style.display = 'flex';
      userEmailDisplay.textContent = email;
      avatarLetter.textContent = email.charAt(0).toUpperCase();
      
      // Clear previous conversation except welcome card
      var welcome = document.getElementById('gemini-welcome');
      chatArea.innerHTML = '';
      if (welcome) {
        welcome.style.display = 'block';
        chatArea.appendChild(welcome);
      }
    }

    function sendMessage() {
      var query = chatInput.value.trim();
      if (!query) return;

      chatInput.value = '';
      chatInput.style.height = '24px';
      btnSend.disabled = true;
      btnSend.classList.remove('active');

      // Hide welcome card
      var welcome = document.getElementById('gemini-welcome');
      if (welcome) welcome.style.display = 'none';

      // 1. Append User Message
      appendMessage('user', query);

      // 2. Append Loading/Typing Indicator
      var loadId = appendTypingIndicator();
      chatArea.scrollTop = chatArea.scrollHeight;

      // 3. Request Server API
      var headers = {
        'Content-Type': 'application/json'
      };
      var token = localStorage.getItem('google_access_token');
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      fetch('/api/gemini', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ query: query })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        removeTypingIndicator(loadId);
        typeWriteMessage('ai', data.response || 'Disculpa, no he podido procesar tu consulta.');
      })
      .catch(function(err) {
        console.error(err);
        removeTypingIndicator(loadId);
        appendMessage('ai', 'Ha ocurrido un error al conectar con Gemini. Por favor, inténtalo de nuevo.');
      });
    }

    function appendMessage(role, text) {
      var msgRow = document.createElement('div');
      msgRow.className = 'gemini-msg-row ' + role;
      
      var avatar = document.createElement('div');
      avatar.className = 'gemini-msg-avatar';
      
      if (role === 'user') {
        avatar.innerHTML = '<div class="gemini-user-avatar" style="width: 36px !important; height: 36px !important; background: #38bdf8 !important;">' + avatarLetter.textContent + '</div>';
      } else {
        avatar.innerHTML = 
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="url(#geminiGradientMsg)" style="display: block;">' +
          '  <defs>' +
          '    <linearGradient id="geminiGradientMsg" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '      <stop offset="0%" stop-color="#9bc5ff" /><stop offset="50%" stop-color="#c1a6ff" /><stop offset="100%" stop-color="#ff9eb5" />' +
          '    </linearGradient>' +
          '  </defs>' +
          '  <path d="M12 2a9.7 9.7 0 0 0 .7 3.3c.5 1.2 1.3 2.2 2.4 2.8 1.1.6 2.3.9 3.5.9a9.7 9.7 0 0 0-3.3.7c-1.2.5-2.2 1.3-2.8 2.4-.6 1.1-.9 2.3-.9 3.5a9.7 9.7 0 0 0-.7-3.3c-.5-1.2-1.3-2.2-2.4-2.8a9.7 9.7 0 0 0-3.5-.9 9.7 9.7 0 0 0 3.3-.7c1.2-.5 2.2-1.3 2.8-2.4.6-1.1.9-2.3.9-3.5z"/>' +
          '</svg>';
      }

      var bubble = document.createElement('div');
      bubble.className = 'gemini-msg-bubble';
      bubble.innerHTML = formatMarkdown(text);
      
      msgRow.appendChild(avatar);
      msgRow.appendChild(bubble);
      chatArea.appendChild(msgRow);
      chatArea.scrollTop = chatArea.scrollHeight;
    }

    function appendTypingIndicator() {
      var loadId = 'gemini-load-' + Date.now();
      var msgRow = document.createElement('div');
      msgRow.className = 'gemini-msg-row ai';
      msgRow.id = loadId;
      
      var avatar = document.createElement('div');
      avatar.className = 'gemini-msg-avatar';
      avatar.innerHTML = 
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="url(#geminiGradientMsgLoad)">' +
        '  <defs>' +
        '    <linearGradient id="geminiGradientMsgLoad" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '      <stop offset="0%" stop-color="#9bc5ff" /><stop offset="50%" stop-color="#c1a6ff" /><stop offset="100%" stop-color="#ff9eb5" />' +
        '    </linearGradient>' +
        '  </defs>' +
        '  <path d="M12 2a9.7 9.7 0 0 0 .7 3.3c.5 1.2 1.3 2.2 2.4 2.8 1.1.6 2.3.9 3.5.9a9.7 9.7 0 0 0-3.3.7c-1.2.5-2.2 1.3-2.8 2.4-.6 1.1-.9 2.3-.9 3.5a9.7 9.7 0 0 0-.7-3.3c-.5-1.2-1.3-2.2-2.4-2.8a9.7 9.7 0 0 0-3.5-.9 9.7 9.7 0 0 0 3.3-.7c1.2-.5 2.2-1.3 2.8-2.4.6-1.1.9-2.3.9-3.5z"/>' +
        '</svg>';
        
      var bubble = document.createElement('div');
      bubble.className = 'gemini-msg-bubble';
      bubble.innerHTML = 
        '<div class="gemini-typing-indicator">' +
        '  <div class="gemini-typing-dot"></div>' +
        '  <div class="gemini-typing-dot"></div>' +
        '  <div class="gemini-typing-dot"></div>' +
        '</div>';
        
      msgRow.appendChild(avatar);
      msgRow.appendChild(bubble);
      chatArea.appendChild(msgRow);
      return loadId;
    }

    function removeTypingIndicator(id) {
      var elem = document.getElementById(id);
      if (elem) elem.parentNode.removeChild(elem);
    }

    function typeWriteMessage(role, text) {
      var msgRow = document.createElement('div');
      msgRow.className = 'gemini-msg-row ' + role;
      
      var avatar = document.createElement('div');
      avatar.className = 'gemini-msg-avatar';
      avatar.innerHTML = 
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="url(#geminiGradientMsgType)">' +
        '  <defs>' +
        '    <linearGradient id="geminiGradientMsgType" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '      <stop offset="0%" stop-color="#9bc5ff" /><stop offset="50%" stop-color="#c1a6ff" /><stop offset="100%" stop-color="#ff9eb5" />' +
        '    </linearGradient>' +
        '  </defs>' +
        '  <path d="M12 2a9.7 9.7 0 0 0 .7 3.3c.5 1.2 1.3 2.2 2.4 2.8 1.1.6 2.3.9 3.5.9a9.7 9.7 0 0 0-3.3.7c-1.2.5-2.2 1.3-2.8 2.4-.6 1.1-.9 2.3-.9 3.5a9.7 9.7 0 0 0-.7-3.3c-.5-1.2-1.3-2.2-2.4-2.8a9.7 9.7 0 0 0-3.5-.9 9.7 9.7 0 0 0 3.3-.7c1.2-.5 2.2-1.3 2.8-2.4.6-1.1.9-2.3.9-3.5z"/>' +
        '</svg>';
        
      var bubble = document.createElement('div');
      bubble.className = 'gemini-msg-bubble';
      
      msgRow.appendChild(avatar);
      msgRow.appendChild(bubble);
      chatArea.appendChild(msgRow);
      chatArea.scrollTop = chatArea.scrollHeight;

      // Typewrite words
      var words = text.split(' ');
      var wordIndex = 0;
      var currentText = '';

      function typeNextWord() {
        if (wordIndex < words.length) {
          currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
          bubble.innerHTML = formatMarkdown(currentText);
          chatArea.scrollTop = chatArea.scrollHeight;
          wordIndex++;
          setTimeout(typeNextWord, 20 + Math.random() * 20); // 20-40ms per word
        }
      }
      typeNextWord();
    }

    function formatMarkdown(text) {
      // Escape HTML
      var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
      var html = text.replace(/[&<>]/g, function(m) { return map[m]; });
      
      // Code blocks
      html = html.replace(/\`\`\`(\w*)\n([\s\S]*?)\n\`\`\`/g, function(match, lang, code) {
        return '<pre style="background: #1e293b; padding: 12px; border-radius: 8px; overflow-x: auto; color: #f8fafc; font-size: 13px; font-family: monospace; border: 1px solid rgba(255,255,255,0.06); text-align: left;"><code>' + code + '</code></pre>';
      });
      
      // Inline code
      html = html.replace(/\`([^\`\n]+)\`/g, '<code style="background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #f8fafc; font-family: monospace;">$1</code>');

      // Bold
      html = html.replace(/\*\*([^\*\n]+)\*\*/g, '<strong style="color: #ffffff; font-weight: 600;">$1</strong>');

      // Bullet lists
      html = html.replace(/^\s*-\s+(.+)$/gm, '<li style="margin-left: 20px; list-style-type: disc; margin-bottom: 4px;">$1</li>');
      
      // Newlines to <br> (except inside pre blocks)
      var parts = html.split(/(<pre[\s\S]*?<\/pre>)/);
      for (var i = 0; i < parts.length; i++) {
        if (!parts[i].startsWith('<pre')) {
          parts[i] = parts[i].replace(/\n/g, '<br>');
        }
      }
      return parts.join('');
    }
  }

  // Bind to DOM
  document.addEventListener('DOMContentLoaded', initAiModal);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initAiModal();
  }

  // Fix language switcher redirect loop by setting cookie on click before navigation
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document) {
      if (target.tagName === 'A' && target.parentNode && target.parentNode.classList && target.parentNode.classList.contains('lang-item')) {
        var parentClasses = target.parentNode.classList;
        var langCode = '';
        for (var i = 0; i < parentClasses.length; i++) {
          if (parentClasses[i].indexOf('lang-item-') === 0) {
            langCode = parentClasses[i].replace('lang-item-', '');
            break;
          }
        }
        if (langCode) {
          // Helper to delete cookie on all domain/path variants
          var pastDate = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
          var hostname = window.location.hostname;
          var domains = [hostname, 'localhost', 'microarea.es', 'microarea.ai'];
          var paths = ["/", "/en/", "/es/"];
          
          paths.forEach(function(path) {
            document.cookie = "pll_language=; " + pastDate + "; path=" + path;
            domains.forEach(function(domain) {
              document.cookie = "pll_language=; " + pastDate + "; path=" + path + "; domain=" + domain;
              document.cookie = "pll_language=; " + pastDate + "; path=" + path + "; domain=." + domain;
            });
          });
          
          // Set the new cookie
          var expirationDate = new Date();
          expirationDate.setTime(expirationDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
          var expires = "; expires=" + expirationDate.toUTCString();
          var cookiePath = "; path=/; SameSite=Lax";
          document.cookie = "pll_language=" + langCode + expires + cookiePath;
        }
      }
      target = target.parentNode;
    }
  });
})();
