const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const templateEngine = require('./template_engine');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|doc|docx)$/i;
    if (!allowed.test(file.originalname)) {
      return cb(new Error('Only PDF, DOC, DOCX files are allowed'));
    }
    cb(null, true);
  }
});

// Middleware to parse urlencoded and JSON bodies (for form submits)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multi-tenant identification middleware
app.use((req, res, next) => {
  let site = req.headers['x-site'];
  if (!site) {
    const host = req.headers.host || '';
    if (host.includes('winlab') || host.includes('8081')) site = 'winlab';
    else if (host.includes('eoswin') || host.includes('8082')) site = 'eoswin';
    else if (host.includes('maconta') || host.includes('8083')) site = 'maconta';
    else if (host.includes('magest') || host.includes('8084')) site = 'magest';
    else if (host.includes('lexnext') || host.includes('8085')) site = 'lexnext';
    else if (host.includes('poshability') || host.includes('8086')) site = 'poshability';
    else if (host.includes('cloud') || host.includes('8087')) site = 'cloud';
    else if (host.includes('manuales') || host.includes('8088')) site = 'manuales';
    else site = 'winlab'; // Default fallback
  }
  
  req.site = site;
  next();
});

// Helper to parse cookies manually
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

// Custom handler for community main pages
app.get(['/comunidad', '/comunidad/', '/comunidad/index.php'], async (req, res) => {
  const cookies = parseCookies(req);
  const userId = cookies.usuario_comunidad ? parseInt(cookies.usuario_comunidad, 10) : null;
  let sessionUser = null;
  if (userId) {
    try {
      const userRes = await db.query('SELECT id, nombre, apellidos, nivel, activo FROM usuario_comunidad WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        sessionUser = userRes.rows[0];
      }
    } catch (err) {
      console.error('Error fetching session user:', err);
    }
  }

  let ccrStatus = undefined;
  let ccrToken = req.query.ccr;
  if (ccrToken) {
    try {
      const allUsers = await db.query('SELECT id, nombre, email, apellidos, nivel FROM usuario_comunidad');
      const crypto = require('crypto');
      let matchedUser = null;
      for (const u of allUsers.rows) {
        const concatStr = (u.nombre + u.email + u.apellidos + u.nivel).toLowerCase();
        const hash = crypto.createHash('md5').update(concatStr).digest('hex');
        if (hash === ccrToken.toLowerCase()) {
          matchedUser = u;
          break;
        }
      }
      if (matchedUser) {
        await db.query('UPDATE usuario_comunidad SET activo = 1 WHERE id = $1', [matchedUser.id]);
        ccrStatus = 'ok';
      } else {
        ccrStatus = 'ko';
      }
    } catch (err) {
      console.error('Error verifying ccr token:', err);
      ccrStatus = 'ko';
    }
  }

  let crpStatus = undefined;
  let crpToken = req.query.crp;
  if (crpToken) {
    try {
      const allUsers = await db.query('SELECT id, nombre, email, apellidos, nivel FROM usuario_comunidad');
      const crypto = require('crypto');
      let matchedUser = null;
      for (const u of allUsers.rows) {
        const concatStr = (u.nombre + u.email + u.apellidos + u.nivel).toLowerCase();
        const hash = crypto.createHash('md5').update(concatStr).digest('hex');
        if (hash === crpToken.toLowerCase()) {
          matchedUser = u;
          break;
        }
      }
      if (matchedUser) {
        crpStatus = 'ok';
      } else {
        crpStatus = 'ko';
      }
    } catch (err) {
      console.error('Error verifying crp token:', err);
      crpStatus = 'ko';
    }
  }

  const supportedLangs = ['es', 'en', 'it', 'fr', 'de', 'ca', 'bg', 'pt', 'tr', 'pl'];
  const lang = req.query.idioma || req.query.lang || req.acceptsLanguages(supportedLangs) || 'es';
  try {
    const html = templateEngine.compile(req.site, lang, 'comunidad/index.php', {
      sessionUser,
      ccrStatus,
      ccrToken,
      crpStatus,
      crpToken,
      host: req.headers.host
    });
    res.send(html);
  } catch (error) {
    console.error('Error compiling comunidad/index.php:', error);
    res.status(500).send(`Error loading template: ${error.message}`);
  }
});

// Custom handler for community consultation threads
app.get(['/comunidad/consulta/:publi', '/comunidad/consulta/:publi/', '/comunidad/consulta.php'], async (req, res) => {
  let publi = req.params.publi || req.query.publi || '';
  const publiParts = publi.split('-');
  const idPubli = parseInt(publiParts[0], 10) || 0;

  const cookies = parseCookies(req);
  const userId = cookies.usuario_comunidad ? parseInt(cookies.usuario_comunidad, 10) : null;
  let sessionUser = null;
  if (userId) {
    try {
      const userRes = await db.query('SELECT id, nombre, apellidos, nivel, activo FROM usuario_comunidad WHERE id = $1', [userId]);
      if (userRes.rows.length > 0) {
        sessionUser = userRes.rows[0];
      }
    } catch (err) {
      console.error('Error fetching session user:', err);
    }
  }

  let ccrStatus = undefined;
  let ccrToken = req.query.ccr;
  let crpStatus = undefined;
  let crpToken = req.query.crp;

  const supportedLangs = ['es', 'en', 'it', 'fr', 'de', 'ca', 'bg', 'pt', 'tr', 'pl'];
  const lang = req.query.idioma || req.query.lang || req.acceptsLanguages(supportedLangs) || 'es';
  try {
    const html = templateEngine.compile(req.site, lang, 'comunidad/consulta.php', {
      sessionUser,
      ccrStatus,
      ccrToken,
      crpStatus,
      crpToken,
      publi,
      idPubli,
      host: req.headers.host
    });
    res.send(html);
  } catch (error) {
    console.error('Error compiling comunidad/consulta.php:', error);
    res.status(500).send(`Error loading template: ${error.message}`);
  }
});

// Dynamic Static File Server Middleware
// Resolves files from the original product directory dynamically
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }
  const productDir = `C:/www/${req.site}.microarea.es`;
  
  let targetPath = path.join(productDir, req.path);
  let isPhp = false;
  let relPath = req.path.replace(/^\//, '');
  
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
    const tryIndex = path.join(targetPath, 'index.php');
    if (fs.existsSync(tryIndex)) {
      targetPath = tryIndex;
      relPath = path.join(relPath, 'index.php').replace(/\\/g, '/');
      isPhp = true;
    }
  } else if (req.path.endsWith('.php')) {
    isPhp = true;
  }
  
  if (isPhp && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    const supportedLangs = ['es', 'en', 'it', 'fr', 'de', 'ca', 'bg', 'pt', 'tr', 'pl'];
    const lang = req.query.idioma || req.query.lang || req.acceptsLanguages(supportedLangs) || 'es';
    try {
      const html = templateEngine.compile(req.site, lang, relPath, {
        query: req.query,
        host: req.headers.host
      });
      return res.send(html);
    } catch (error) {
      console.error(`Error compiling PHP file ${relPath}:`, error);
      return res.status(500).send(`Error loading template: ${error.message}`);
    }
  }
  
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return res.sendFile(targetPath);
  }

  // Fallback: check if the file exists in the main landing site (new2.microarea.es)
  if (req.site !== 'new2') {
    const fallbackPath = path.join('C:/www/new2.microarea.es', req.path);
    if (fs.existsSync(fallbackPath) && fs.statSync(fallbackPath).isFile()) {
      return res.sendFile(fallbackPath);
    }
  }

  next();
});



// Dynamic Template compiler for main page
app.get('/', (req, res) => {
  const supportedLangs = ['es', 'en', 'it', 'fr', 'de', 'ca', 'bg', 'pt', 'tr', 'pl'];
  const lang = req.query.idioma || req.query.lang || req.acceptsLanguages(supportedLangs) || 'es';
  try {
    const html = templateEngine.compile(req.site, lang, undefined, {
      host: req.headers.host
    });
    res.send(html);
  } catch (error) {
    console.error(`Error rendering site ${req.site}:`, error);
    res.status(500).send(`Error loading site: ${error.message}`);
  }
});

// Redirect common entries
app.get(['/index.php', '/index.html'], (req, res) => {
  const queryStr = new URLSearchParams(req.query).toString();
  res.redirect(queryStr ? `/?${queryStr}` : '/');
});

const nodemailer = require('nodemailer');

const countries = [
  "", "España", "Estados Unidos", "", "Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda",
  "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés",
  "Barbados", "Baréin", "Bélgica", "Belice", "Benín", "Bielorrusia", "Birmania/Myanmar", "Bolivia", "Bosnia y Herzegovina",
  "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún",
  "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Ciudad del Vaticano", "Colombia", "Comoras",
  "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica",
  "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "Estonia", "Etiopía",
  "Filipinas", "Finlandia", "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala",
  "Guyana", "Guinea", "Guinea-Bisáu", "Guinea Ecuatorial", "Haití", "Honduras", "Hungría", "India", "Indonesia", "Irak",
  "Irán", "Irlanda", "Islandia", "Islas Marshall", "Islas Salomón", "Israel", "Italia", "Jamaica", "Japón", "Jordania",
  "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia",
  "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí",
  "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro",
  "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda", "Omán",
  "Países Bajos", "Pakistán", "Palaos", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal",
  "Reino Unido", "República Centroafricana", "República Checa", "República del Congo", "República Democrática del Congo",
  "República Dominicana", "Ruanda", "Rumanía", "Rusia", "Samoa", "San Cristóbal y Nieves", "San Marino",
  "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona",
  "Singapur", "Siria", "Somalia", "Sri Lanka", "Suazilandia", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza",
  "Surinam", "Tailandia", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez",
  "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistán", "Vanuatu", "Venezuela", "Vietnam",
  "Yemen", "Yibuti", "Zambia", "Zimbabue"
];

const productConfig = {
  winlab: {
    senderName: 'WinLab',
    subject: 'Microarea WinLab',
    exeUrl: '/winlab_inst_descarga/INSTWL8.exe',
    pdfPath: '/winlab_inst_descarga/guia_'
  },
  eoswin: {
    senderName: 'EosWin',
    subject: 'Microarea EosWin',
    exeUrl: '/eoswin_inst_descarga/INSTEW.exe',
    pdfPath: '/eoswin_inst_descarga/guia_'
  },
  maconta: {
    senderName: 'MaConta',
    subject: 'Microarea MaConta',
    exeUrl: '/maconta_inst_descarga/instmaconta.exe',
    pdfPath: '/maconta_inst_descarga/guia_'
  },
  magest: {
    senderName: 'MaGest',
    subject: 'Microarea MaGest',
    exeUrl: '/MaGest_inst_descarga/instmagest.exe',
    pdfPath: '/magest_inst_descarga/guia_'
  },
  lexnext: {
    senderName: 'LexNext',
    subject: 'Microarea LexNext',
    exeUrl: '/lexnext_inst_descarga/lexnext_es.exe',
    pdfPath: '/lexnext_inst_descarga/guia_'
  },
  poshability: {
    senderName: 'Poshability',
    subject: 'Microarea Poshability',
    exeUrl: '/poshability_inst_descarga/instposhability.exe',
    pdfPath: '/poshability_inst_descarga/guia_'
  }
};

function getLanguageFromRequest(req) {
  if (req.query.idioma) return req.query.idioma;
  if (req.query.lang) return req.query.lang;
  if (req.body.idioma) return req.body.idioma;
  if (req.body.lang) return req.body.lang;
  const referer = req.headers.referer;
  if (referer) {
    try {
      const urlObj = new URL(referer);
      const idioma = urlObj.searchParams.get('idioma') || urlObj.searchParams.get('lang');
      if (idioma) return idioma;
      const pathParts = urlObj.pathname.split('/');
      const firstPart = pathParts[1];
      const supportedLangs = ['es', 'en', 'it', 'fr', 'de', 'ca', 'bg', 'pt', 'tr', 'pl'];
      if (supportedLangs.includes(firstPart)) {
        return firstPart;
      }
    } catch (e) {}
  }
  const supportedLangs = ['es', 'en', 'it', 'fr', 'de', 'ca', 'bg', 'pt', 'tr', 'pl'];
  return req.acceptsLanguages(supportedLangs) || 'es';
}

function loadTranslations(product, lang) {
  try {
    const localesDir = 'C:/www/modern-suite/locales';
    const jsonPath = path.join(localesDir, product, `${lang}.json`);
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading translations for ${product} (${lang}):`, err);
  }
  return {};
}

function getTranslation(translations, esTranslations, key) {
  return translations[key] !== undefined ? translations[key] : (esTranslations[key] !== undefined ? esTranslations[key] : '');
}

// Mock/Log email and query form submissions
app.post(['/mandaConsulta.php', '/mandaEmail.php'], async (req, res) => {
  console.log(`[FORM SUBMIT] [${req.site.toUpperCase()}] Received form submission on ${req.path}:`, req.body);
  
  if (req.path === '/mandaEmail.php') {
    const { nombre, email, telefono, pais, cp, domicilio, localidad, provincia } = req.body;
    if (!nombre || !email || !telefono || !pais || !cp || !domicilio || !localidad || !provincia) {
      console.warn('[FORM VALIDATION FAILED] Missing fields in form submission');
      return res.status(400).send('Error: Todos los campos son obligatorios.');
    }
    if (!/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i.test(email)) {
      console.warn('[FORM VALIDATION FAILED] Invalid email address format');
      return res.status(400).send('Error: Email no válido.');
    }

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.serviciodecorreo.es',
        port: 587,
        secure: false,
        auth: {
          user: 'noreply@microarea-law.es',
          pass: 'AlexJimenez2007@'
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      const countryId = parseInt(pais || '0', 10);
      const countryName = countries[countryId] || pais || 'España';
      
      // 1. Send admin notification email
      const adminMailOptions = {
        from: '"Microarea Demo" <noreply@microarea-law.es>',
        to: 'info@microareanext.com',
        subject: 'DESCARGA DE DEMO',
        html: `
          <h3>Nueva descarga de versión demo solicitada</h3>
          <p><strong>Producto/Subdominio:</strong> ${req.site.toUpperCase()}</p>
          <table border="1" cellpadding="8" style="border-collapse: collapse; border: 1px solid #ddd;">
            <tr style="background-color: #f2f2f2;"><th>Campo</th><th>Valor del Cliente</th></tr>
            <tr><td><strong>Nombre Completo:</strong></td><td>${nombre}</td></tr>
            <tr><td><strong>Dirección:</strong></td><td>${domicilio}</td></tr>
            <tr><td><strong>Código Postal:</strong></td><td>${cp}</td></tr>
            <tr><td><strong>Localidad:</strong></td><td>${localidad}</td></tr>
            <tr><td><strong>Provincia:</strong></td><td>${provincia}</td></tr>
            <tr><td><strong>País:</strong></td><td>${countryName}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
            <tr><td><strong>Teléfono:</strong></td><td>${telefono}</td></tr>
          </table>
        `
      };
      
      await transporter.sendMail(adminMailOptions);
      console.log(`[EMAIL SENT] Demo download notification email sent successfully to info@microareanext.com`);

      // 2. Send customer confirmation email with links
      const lang = getLanguageFromRequest(req);
      const translations = loadTranslations(req.site, lang);
      const esTranslations = lang === 'es' ? translations : loadTranslations(req.site, 'es');

      const em_hola = getTranslation(translations, esTranslations, 'em_hola');
      const em_adjuntamos_vinculo = getTranslation(translations, esTranslations, 'em_adjuntamos_vinculo');
      const em_requisitos_instalacion = getTranslation(translations, esTranslations, 'em_requisitos_instalacion');
      const em_guia_instalacion = getTranslation(translations, esTranslations, 'em_guia_instalacion');
      const em_pie_email = getTranslation(translations, esTranslations, 'em_pie_email');
      const em_guia = getTranslation(translations, esTranslations, 'em_guia');

      const config = productConfig[req.site] || productConfig.winlab;
      const idiomaDescarga = lang === 'ca' ? 'es' : lang;

      const hostHeader = req.headers.host || '';
      let domain = hostHeader;
      if (domain.includes('localhost') || domain.includes('127.0.0.1') || /^\d+\.\d+\.\d+\.\d+/.test(domain) || domain.includes('808')) {
        domain = `${req.site}.microarea.ai`;
      }
      const baseUrl = `https://${domain}`;

      const exeLink = `<a href="${baseUrl}${config.exeUrl}">${config.senderName}</a>`;
      const pdfLink = `<a href="${baseUrl}${config.pdfPath}${idiomaDescarga}.pdf">${em_guia}</a>`;

      const clientBody = `
        ${em_hola} ${nombre},<br><br>
        ${em_adjuntamos_vinculo}:<br><br>
        ${exeLink}<br>
        ${em_requisitos_instalacion}
        ${em_guia_instalacion}:<br><br>
        ${pdfLink}<br><br>
        ${em_pie_email}
      `;

      const clientMailOptions = {
        from: `"${config.senderName}" <noreply@microarea-law.es>`,
        to: email,
        subject: config.subject,
        html: clientBody
      };

      await transporter.sendMail(clientMailOptions);
      console.log(`[EMAIL SENT] Client confirmation email successfully sent to ${email} (${lang}) for site: ${req.site}`);

    } catch (error) {
      console.error('[EMAIL ERROR] Failed to send email notification:', error);
    }
  }
  
  res.send('success');
});

// New route for job application form with file upload
app.post('/api/trabaje-con-nosotros', upload.single('archivo'), async (req, res) => {
  const { nombre, email, telefono, puesto, mensaje } = req.body;
  if (!nombre || !email || !telefono || !puesto) {
    console.warn('[JOB FORM] Missing required fields');
    return res.status(400).send('Error: Todos los campos obligatorios deben completarse.');
  }
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
  if (!emailRegex.test(email)) {
    console.warn('[JOB FORM] Invalid email');
    return res.status(400).send('Error: Email no válido.');
  }
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.serviciodecorreo.es',
      port: 587,
      secure: false,
      auth: {
        user: 'noreply@microarea-law.es',
        pass: 'AlexJimenez2007@'
      },
      tls: { rejectUnauthorized: false }
    });
    const adminMailOptions = {
      from: '"Microarea Demo" <noreply@microarea-law.es>',
      to: ['info@microareanext.com', 'jose.jimenez@microareanext.com'],
      subject: 'FORMULARIO RECIBIDO DE BÚSQUEDA DE EMPLEO',
      html: `<h3>Nueva solicitud de empleo</h3>
        <table border="1" cellpadding="8" style="border-collapse: collapse; border: 1px solid #ddd;">
          <tr style="background-color:#f2f2f2;"><th>Campo</th><th>Valor</th></tr>
          <tr><td><strong>Nombre:</strong></td><td>${nombre}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
          <tr><td><strong>Teléfono:</strong></td><td>${telefono}</td></tr>
          <tr><td><strong>Puesto:</strong></td><td>${puesto}</td></tr>
          <tr><td><strong>Mensaje:</strong></td><td>${mensaje || ''}</td></tr>
        </table>`,
      attachments: req.file ? [{ filename: req.file.originalname, content: req.file.buffer }] : []
    };
    await transporter.sendMail(adminMailOptions);
    console.log('[EMAIL SENT] Job application email sent to admin.');
    const applicantMailOptions = {
      from: '"Microarea" <noreply@microarea-law.es>',
      to: email,
      subject: 'Confirmación de solicitud de empleo',
      html: `<p>Hola ${nombre},</p><p>Gracias por tu interés en unirte a nuestro equipo. Hemos recibido tu solicitud para el puesto de "${puesto}" y nos pondremos en contacto contigo pronto.</p>`
    };
    await transporter.sendMail(applicantMailOptions);
    console.log('[EMAIL SENT] Confirmation email sent to applicant.');
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[JOB FORM] Email sending failed:', err);
    res.status(500).send('Error interno del servidor');
  }
});

// Function to format URL for consultation
function codificaURL(url) {
  if (!url) return '';
  url = url.toLowerCase();
  const find = ['á', 'é', 'í', 'ó', 'ú', 'ñ'];
  const repl = ['a', 'e', 'i', 'o', 'u', 'n'];
  for (let i = 0; i < find.length; i++) {
    url = url.replace(new RegExp(find[i], 'g'), repl[i]);
  }
  url = url.replace(/[\s&\n\r+]+/g, '-');
  url = url.replace(/[^a-z0-9\-]/g, '');
  url = url.replace(/-+/g, '-');
  return url;
}

// Route to serve the simulated Google Auth popup page
app.get('/google_auth.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'google_auth.html'));
});

// Diagnostic route to check Accept-Language header
app.get('/api/test-lang', (req, res) => {
  res.json({
    acceptLanguageHeader: req.headers['accept-language'],
    parsedLanguages: req.acceptsLanguages()
  });
});

// Route to serve Google Client ID config
app.get('/api/auth/config', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' 
      ? process.env.GOOGLE_CLIENT_ID 
      : null
  });
});

// Helper to call Gemini API with retries and fallback models
async function callGeminiWithRetryAndFallback(query, systemInstruction, oauthToken) {
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
  const maxRetriesPerModel = 3;
  const initialDelay = 1000; // 1 second

  let lastError = null;

  for (const model of models) {
    console.log(`[API /api/gemini] Intentando modelo: ${model}`);
    
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const headers = {
          'Content-Type': 'application/json'
        };

        if (oauthToken) {
          headers['Authorization'] = `Bearer ${oauthToken}`;
        } else {
          url += `?key=${process.env.GEMINI_API_KEY}`;
        }

        const payload = {
          contents: [
            { role: 'user', parts: [{ text: query }] }
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        console.log(`[API /api/gemini] [Modelo: ${model}] [Intento: ${attempt}] Código de estado: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) {
            return { ok: true, answer };
          } else {
            console.log(`[API /api/gemini] OK pero sin candidatos para ${model}.`);
          }
        }

        const errorText = await response.text();
        console.error(`[API /api/gemini] Error en ${model} (intento ${attempt}):`, response.status, errorText);

        // If it is 401 or 403, fail immediately (unauthorized/forbidden)
        if (response.status === 401 || response.status === 403) {
          return { ok: false, status: response.status, errorText };
        }

        // Retry on 503, 429, or general 5xx errors
        if (response.status === 503 || response.status === 429 || response.status >= 500) {
          let parsedError = null;
          try {
            parsedError = JSON.parse(errorText);
          } catch(e) {}
          lastError = { status: response.status, errorText, parsedError };
          
          if (attempt < maxRetriesPerModel) {
            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.log(`[API /api/gemini] Esperando ${delay}ms antes de reintentar...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          continue;
        }

        // Other 4xx client errors are not retryable
        return { ok: false, status: response.status, errorText };

      } catch (err) {
        console.error(`[API /api/gemini] Error de conexión en ${model} (intento ${attempt}):`, err);
        lastError = err;
        if (attempt < maxRetriesPerModel) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`[API /api/gemini] Esperando ${delay}ms antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.log(`[API /api/gemini] El modelo ${model} falló tras ${maxRetriesPerModel} intentos.`);
  }

  // If we reach here, all models and retries failed
  return { 
    ok: false, 
    status: lastError?.status || 500, 
    errorText: lastError?.errorText || lastError?.message || 'Error desconocido',
    parsedError: lastError?.parsedError
  };
}

// Helper to load knowledge base files filtered by selected software to optimize speed and context size (supports TXT and PDF)
async function loadKnowledgeBase(software) {
  try {
    const fs = require('fs');
    const path = require('path');
    const pdfParse = require('pdf-parse');

    const kbPath = path.join(__dirname, 'knowledge');
    if (!fs.existsSync(kbPath)) {
      return '';
    }

    let kbContent = '\n=== BASE DE CONOCIMIENTO (DOCUMENTOS DE SOPORTE Y MANUALES) ===\n';
    let fileCount = 0;

    // 1. Load general root files (always loaded)
    const rootFiles = fs.readdirSync(kbPath);
    for (const file of rootFiles) {
      const filePath = path.join(kbPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        // Skip boe_irpf_ley_35_2006.txt by default unless it's a tax/labor software (EosWin, WinLab, MaConta, or general)
        if (file === 'boe_irpf_ley_35_2006.txt') {
          const isTaxOrLabor = software && (
            software.toLowerCase().includes('eoswin') ||
            software.toLowerCase().includes('winlab') ||
            software.toLowerCase().includes('maconta') ||
            software.toLowerCase().includes('general')
          );
          if (!isTaxOrLabor) {
            continue; // skip big law file for unrelated software
          }
        }

        if (file.endsWith('.txt')) {
          const data = fs.readFileSync(filePath, 'utf8');
          kbContent += `\nDocumento General: ${file}\n${data}\n-----------------------------------\n`;
          fileCount++;
        } else if (file.endsWith('.json')) {
          try {
            const data = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(data);
            let jsonText = '';
            if (Array.isArray(jsonData)) {
              jsonData.forEach((item, idx) => {
                const q = item.pregunta || item.question || item.q || '';
                const a = item.respuesta || item.answer || item.a || '';
                if (q && a) {
                  jsonText += `PREGUNTA: ${q}\nRESPUESTA: ${a}\n------------------\n`;
                } else {
                  jsonText += `Item ${idx + 1}: ${JSON.stringify(item)}\n`;
                }
              });
            } else if (typeof jsonData === 'object' && jsonData !== null) {
              for (const [key, val] of Object.entries(jsonData)) {
                if (typeof val === 'string') {
                  jsonText += `PREGUNTA: ${key}\nRESPUESTA: ${val}\n------------------\n`;
                } else {
                  jsonText += `${key}: ${JSON.stringify(val)}\n`;
                }
              }
            }
            if (jsonText) {
              kbContent += `\nDocumento General JSON: ${file}\n${jsonText}\n-----------------------------------\n`;
              fileCount++;
            }
          } catch (jsonErr) {
            console.error(`Error al parsear JSON ${file} en carpeta root:`, jsonErr);
          }
        }
      }
    }

    // 2. Map software to its specific subfolder
    let subfolder = 'General'; // Default to General admin/setup PDFs
    if (software) {
      const swLower = software.toLowerCase();
      if (swLower.includes('winlab')) {
        subfolder = 'Winlab8';
      } else if (swLower.includes('eoswin')) {
        subfolder = 'Eoswin';
      } else if (swLower.includes('maconta')) {
        subfolder = 'Maconta';
      } else if (swLower.includes('magest')) {
        subfolder = 'Magest';
      } else if (swLower.includes('lexnext')) {
        subfolder = 'Lexnext';
      } else if (swLower.includes('poshability')) {
        subfolder = 'Poshability';
      }
    }

    // 3. Load files from the specific subfolder
    const subfolderPath = path.join(kbPath, subfolder);
    if (fs.existsSync(subfolderPath) && fs.statSync(subfolderPath).isDirectory()) {
      const subFiles = fs.readdirSync(subfolderPath);
      for (const file of subFiles) {
        const filePath = path.join(subfolderPath, file);
        if (file.endsWith('.txt')) {
          const data = fs.readFileSync(filePath, 'utf8');
          kbContent += `\nDocumento [${subfolder}]: ${file}\n${data}\n-----------------------------------\n`;
          fileCount++;
        } else if (file.endsWith('.pdf')) {
          try {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            kbContent += `\nManual PDF [${subfolder}]: ${file}\n${pdfData.text}\n-----------------------------------\n`;
            fileCount++;
          } catch (pdfErr) {
            console.error(`Error al parsear PDF ${file} en subcarpeta ${subfolder}:`, pdfErr);
          }
        } else if (file.endsWith('.json')) {
          try {
            const data = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(data);
            let jsonText = '';
            if (Array.isArray(jsonData)) {
              jsonData.forEach((item, idx) => {
                const q = item.pregunta || item.question || item.q || '';
                const a = item.respuesta || item.answer || item.a || '';
                if (q && a) {
                  jsonText += `PREGUNTA: ${q}\nRESPUESTA: ${a}\n------------------\n`;
                } else {
                  jsonText += `Item ${idx + 1}: ${JSON.stringify(item)}\n`;
                }
              });
            } else if (typeof jsonData === 'object' && jsonData !== null) {
              for (const [key, val] of Object.entries(jsonData)) {
                if (typeof val === 'string') {
                  jsonText += `PREGUNTA: ${key}\nRESPUESTA: ${val}\n------------------\n`;
                } else {
                  jsonText += `${key}: ${JSON.stringify(val)}\n`;
                }
              }
            }
            if (jsonText) {
              kbContent += `\nDocumento JSON [${subfolder}]: ${file}\n${jsonText}\n-----------------------------------\n`;
              fileCount++;
            }
          } catch (jsonErr) {
            console.error(`Error al parsear JSON ${file} en subcarpeta ${subfolder}:`, jsonErr);
          }
        }
      }
    }

    console.log(`[KB LOAD] Cargados ${fileCount} archivos de conocimiento para "${software || 'General'}" (Subcarpeta: ${subfolder}).`);
    return kbContent;
  } catch (err) {
    console.error('Error al cargar la base de conocimientos:', err);
    return '';
  }
}

// Active real-time chat sessions for human technician handoff
const activeChats = {};
const onlineTechnicians = {};

const techWelcomeMessages = {
  es: "¡Hola {name}! Iniciando chat con el soporte técnico. Esperando a que un técnico se una...",
  en: "Hello {name}! Starting chat with technical support. Waiting for a technician to join...",
  de: "Hallo {name}! Chat mit dem technischen Support wird gestartet. Warten auf Beitritt eines Technikers...",
  it: "Ciao {name}! Avvio della chat con il supporto tecnico. In attesa che un tecnico si unisca...",
  ca: "Hola {name}! Iniciant xat amb el suport tècnic. Esperant que un tècnic s'uneixi...",
  pt: "Olá {name}! Iniciando chat com o suporte técnico. Aguardando um técnico se juntar...",
  tr: "Merhaba {name}! Teknik destek ile sohbet başlatılıyor. Bir teknisyenin katılması bekleniyor...",
  eu: "Kaixo {name}! Laguntza teknikoarekin txata hasten. Teknikari bat elkartu arte zain...",
  gl: "Ola {name}! Iniciando chat co soporte técnico. Agardando a que un técnico se una...",
  fr: "Bonjour {name}! Démarrage du chat avec le support technique. En attente de la connexion d'un technicien...",
  bg: "Здравейте {name}! Стартиране на чат с техническата поддръжка. Изчакване на техник да се присъедини...",
  pl: "Witaj {name}! Rozpoczynanie czatu z pomocą techniczną. Oczekiwanie na dołączenie konsultanta..."
};

const techJoinMessages = {
  es: "Un técnico de soporte se ha unido al chat. ¿En qué puedo ayudarte hoy?",
  en: "A support technician has joined the chat. How can I help you today?",
  de: "Ein Support-Techniker ist dem Chat beigetreten. Wie kann ich Ihnen heute helfen?",
  it: "Un tecnico di supporto si è unito alla chat. Come posso aiutarti oggi?",
  ca: "Un tècnic de suport s'ha unit al xat. En què et puc ajudar avui?",
  pt: "Um técnico de suporte juntou-se ao chat. Como posso ajudar você hoje?",
  tr: "Bir destek teknisyeni sohbete katıldı. Bugün size nasıl yardımcı olabilirim?",
  eu: "Laguntza-teknikari bat elkartu da txatera. Nola lagun diezazuket gaur?",
  gl: "Un técnico de soporte uniuse ao chat. En que podo axudarche hoxe?",
  fr: "Un technicien de support a rejoint le chat. Comment puis-je vous aider aujourd'hui?",
  bg: "Техник по поддръжката се присъедини към чата. С какво мога да ви помогна днес?",
  pl: "Konsultant pomocy technicznej dołączył do czatu. W czym mogę dzisiaj pomóc?"
};

// 1. Initialize a live chat session
app.post('/api/chat/init', (req, res) => {
  const { name, email, phone, software, lang } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  const langKey = lang || 'es';

  // Count active technicians
  const now = Date.now();
  const activeTechs = Object.keys(onlineTechnicians).filter(name => now - onlineTechnicians[name] < 8000);
  const activeTechsCount = activeTechs.length;

  const messages = [];
  if (activeTechsCount === 0) {
    const noTechsWelcome = {
      es: "Lo sentimos, no hay técnicos en línea en este momento. Deja tu consulta y te responderemos lo antes posible por correo o teléfono.",
      en: "Sorry, there are no technicians online at the moment. Please leave your query and we will get back to you as soon as possible by email or phone.",
      de: "Leider sind derzeit keine Techniker online. Bitte hinterlassen Sie Ihre Anfrage und wir werden uns so schnell wie möglich per E-Mail oder Telefon bei Ihnen melden.",
      it: "Spiacenti, non ci sono tecnici online al momento. Lascia la tua richiesta e ti risponderemo al più presto via e-mail o telefono.",
      ca: "Ho sentim, no hi ha tècnics en línia en aquest moment. Deixa la teva consulta i et respondrem com més aviat millor per correu o telèfon.",
      pt: "Desculpe, não há técnicos online no momento. Deixe sua consulta e entraremos em contato o mais breve possível por e-mail ou de telefone.",
      tr: "Üzgünüz, şu anda çevrimiçi teknisyen yok. Lütfen sorunuzu bırakın, e-posta veya telefon yoluyla en kısa sürede size geri döneceğiz.",
      eu: "Barkatu, une honetan ez dago teknikaririk online. Utzi zure kontsulta eta lehenbailehen erantzungo dizugu posta elektronikoz edo telefonoz.",
      gl: "Sentímolo, non hai técnicos en liña neste momento. Deixe a súa consulta e responderémoslle o antes posible por correo ou teléfono.",
      fr: "Désolé, il n'y a aucun technicien en ligne pour le moment. Veuillez laisser votre message et nous vous répondrons dès que possible par e-mail ou par téléphone.",
      bg: "Съжаляваме, в момента няма техници на линия. Моля, оставете вашето запитване и ще ви отговорим възможно най-скоро по имейл или телефон.",
      pl: "Przepraszamy, w tym momencie brak dostępnych konsultantów. Zostaw swoją wiadomość, a odpowiemy tak szybko, jak to możliwe e-mailem lub telefonicznie."
    };
    const welcomeText = noTechsWelcome[langKey] || noTechsWelcome['es'];
    messages.push({ sender: 'bot', text: welcomeText, timestamp: new Date() });
  } else {
    // Welcome message
    const welcomePattern = techWelcomeMessages[langKey] || techWelcomeMessages['es'];
    const welcomeText = welcomePattern.replace('{name}', name);
    messages.push({ sender: 'bot', text: welcomeText, timestamp: new Date() });

    // Calculate queue position: number of pending sessions currently in the queue
    const pendingSessionsCount = Object.keys(activeChats).filter(id => activeChats[id].status === 'pending').length;
    const queuePos = pendingSessionsCount + 1;

    // If there are more clients waiting than active technicians, tell them their queue position
    if (queuePos > activeTechsCount) {
      const queueMsgTemplates = {
        es: `Es usted el cliente número ${queuePos} en la cola de espera.`,
        en: `You are customer number ${queuePos} in the queue.`,
        de: `Sie sind Kunde Nummer ${queuePos} in der Warteschlange.`,
        it: `Sei il cliente numero ${queuePos} in coda.`,
        ca: `Sou el client número ${queuePos} a la cua d'espera.`,
        pt: `Você é o cliente número ${queuePos} na fila de espera.`,
        tr: `Sırada ${queuePos}. müşterisiniz.`,
        eu: `Itxaron-ilaran ${queuePos}. bezeroa zara.`,
        gl: `Vostede é o cliente número ${queuePos} na cola de agarda.`,
        fr: `Vous êtes le client numéro ${queuePos} dans la file d'attente.`,
        bg: `Вие сте клиент номер ${queuePos} на опашката.`,
        pl: `Jesteś ${queuePos}. klientem w kolejce.`
      };
      const queueText = queueMsgTemplates[langKey] || queueMsgTemplates['es'];
      messages.push({ sender: 'bot', text: queueText, timestamp: new Date() });
    }
  }

  activeChats[sessionId] = {
    name,
    email,
    phone,
    software: software || 'General',
    lang: langKey,
    messages,
    status: 'pending',
    createdAt: new Date()
  };

  console.log(`[LIVE CHAT] Session initialized: ${sessionId} for ${name} [Lang: ${langKey}] [Techs online: ${activeTechsCount}]`);
  res.json({ sessionId });
});

// 2. Send a message in a session
app.post('/api/chat/send', (req, res) => {
  const { sessionId, sender, text, agentName } = req.body;
  if (!sessionId || !sender || !text) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const chat = activeChats[sessionId];
  if (!chat) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const msg = {
    sender, // 'user' or 'tech'
    text,
    agentName: sender === 'tech' ? (agentName || chat.agentName || 'Técnico') : null,
    timestamp: new Date()
  };
  chat.messages.push(msg);

  // If technician sends a message, ensure session status becomes active and reset typing state
  if (sender === 'tech') {
    chat.lastTechTypingTimestamp = 0;
    if (chat.status === 'pending') {
      chat.status = 'active';
    }
    if (agentName && !chat.agentName) {
      chat.agentName = agentName;
    }
  }

  console.log(`[LIVE CHAT] Message from ${sender} (${msg.agentName || ''}) in ${sessionId}: "${text.substr(0, 30)}..."`);
  res.json({ success: true });
});

// 3. Get messages for a session (polling)
app.get('/api/chat/messages', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const chat = activeChats[sessionId];
  if (!chat) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const techIsTyping = chat.lastTechTypingTimestamp && (Date.now() - chat.lastTechTypingTimestamp < 4000);

  // Count active technicians
  const now = Date.now();
  const activeTechs = Object.keys(onlineTechnicians).filter(name => now - onlineTechnicians[name] < 8000);
  const activeTechsCount = activeTechs.length;

  // Calculate dynamic queue position if pending
  let queuePos = null;
  if (chat.status === 'pending') {
    const pendingSessions = Object.keys(activeChats)
      .map(id => activeChats[id])
      .filter(s => s.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
    
    const index = pendingSessions.findIndex(s => s.createdAt.getTime() === chat.createdAt.getTime());
    queuePos = index !== -1 ? index + 1 : 1;
  }

  res.json({
    status: chat.status,
    messages: chat.messages,
    techIsTyping: !!techIsTyping,
    activeTechsCount,
    queuePos
  });
});

// 3.5 Update technician typing status
app.post('/api/chat/typing', (req, res) => {
  const { sessionId, isTyping } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const chat = activeChats[sessionId];
  if (!chat) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (isTyping) {
    chat.lastTechTypingTimestamp = Date.now();
  } else {
    chat.lastTechTypingTimestamp = 0;
  }

  res.json({ success: true });
});

// 4. List all chat sessions (technician side)
app.get('/api/chat/sessions', (req, res) => {
  const { agentName } = req.query;
  if (agentName) {
    onlineTechnicians[agentName] = Date.now();
  }

  const sessions = Object.keys(activeChats).map(id => {
    const chat = activeChats[id];
    return {
      sessionId: id,
      name: chat.name,
      email: chat.email,
      phone: chat.phone,
      software: chat.software,
      lang: chat.lang || 'es',
      agentName: chat.agentName || null,
      status: chat.status,
      createdAt: chat.createdAt,
      lastMessage: chat.messages[chat.messages.length - 1]
    };
  }).filter(s => s.status !== 'closed'); // Only return active or pending sessions

  res.json({ sessions });
});

// 5. Join a session (technician side)
app.post('/api/chat/join', (req, res) => {
  const { sessionId, agentName } = req.body;
  const chat = activeChats[sessionId];
  if (!chat) {
    return res.status(404).json({ error: 'Session not found' });
  }

  chat.status = 'active';
  chat.agentName = agentName || 'Técnico';
  const langKey = chat.lang || 'es';

  const techJoinMsgTemplates = {
    es: "El técnico {agentName} se ha unido al chat. ¿En qué puedo ayudarte hoy?",
    en: "Technician {agentName} has joined the chat. How can I help you today?",
    de: "Techniker {agentName} ist dem Chat beigetreten. Wie kann ich Ihnen heute helfen?",
    it: "Il tecnico {agentName} si è unito alla chat. Come posso aiutarti oggi?",
    ca: "El tècnic {agentName} s'ha unit al xat. En què et puc ajudar avui?",
    pt: "O técnico {agentName} juntou-se ao chat. Como posso ajudar você hoje?",
    tr: "Teknisyen {agentName} sohbete katıldı. Bugün size nasıl yardımcı olabilirim?",
    eu: "{agentName} teknikaria elkartu da txatera. Nola lagun diezazuket gaur?",
    gl: "O técnico {agentName} uniuse ao chat. En que podo axudarche hoxe?",
    fr: "Le technicien {agentName} a rejoint le chat. Comment puis-je vous aider aujourd'hui?",
    bg: "Техникът {agentName} се присъедини към чата. С какво мога да ви помогна днес?",
    pl: "Konsultant {agentName} dołączył do czatu. W czym mogę dzisiaj pomóc?"
  };

  const joinPattern = techJoinMsgTemplates[langKey] || techJoinMsgTemplates['es'];
  const joinText = joinPattern.replace('{agentName}', chat.agentName);

  chat.messages.push({
    sender: 'tech',
    text: joinText,
    agentName: chat.agentName,
    timestamp: new Date()
  });

  console.log(`[LIVE CHAT] Technician [${chat.agentName}] joined session: ${sessionId} [Lang: ${langKey}]`);
  res.json({ success: true });
});

// 6. Close a session
app.post('/api/chat/close', (req, res) => {
  const { sessionId } = req.body;
  const chat = activeChats[sessionId];
  if (!chat) {
    return res.status(404).json({ error: 'Session not found' });
  }

  chat.status = 'closed';
  console.log(`[LIVE CHAT] Session closed: ${sessionId}`);
  res.json({ success: true });
});

const localSpanishCorrections = {
  "preva": "prueba",
  "pruebas": "pruebas",
  "ortogracia": "ortografía",
  "ortografia": "ortografía",
  "hortografia": "ortografía",
  "redacion": "redacción",
  "espanol": "español",
  "nesesito": "necesito",
  "nenesito": "necesito",
  "frasde": "frase",
  "frasdes": "frases",
  "winlab": "WinLab",
  "maconta": "MaConta",
  "magest": "MaGest",
  "eoswin": "EosWin",
  "lexnext": "LexNext",
  "poshability": "Poshability",
  "ke": "que",
  "ola": "hola",
  "aver": "a ver",
  "boy": "voy",
  "hescribir": "escribir",
  "faltass": "faltas",
  "hayga": "haya",
  "acerlo": "hacerlo"
};

function localCorrectSpelling(text) {
  let corrected = text;
  Object.keys(localSpanishCorrections).forEach(typo => {
    const regex = new RegExp('\\b' + typo + '\\b', 'gi');
    corrected = corrected.replace(regex, (match) => {
      const correction = localSpanishCorrections[typo];
      if (match[0] === match[0].toUpperCase()) {
        return correction[0].toUpperCase() + correction.slice(1);
      }
      return correction;
    });
  });
  return corrected;
}

// Función para corregir ortografía usando la API pública gratuita de LanguageTool
async function languageToolCorrectSpelling(text, lang) {
  try {
    const url = 'https://api.languagetool.org/v2/check';
    const params = new URLSearchParams();
    params.append('text', text);
    
    let ltLang = lang || 'es';
    if (ltLang === 'en') ltLang = 'en-US';
    params.append('language', ltLang);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (response.ok) {
      const data = await response.json();
      let corrected = text;
      const matches = (data.matches || []).sort((a, b) => b.offset - a.offset);
      
      for (const match of matches) {
        if (match.replacements && match.replacements.length > 0) {
          const replacement = match.replacements[0].value;
          corrected = corrected.substring(0, match.offset) + replacement + corrected.substring(match.offset + match.length);
        }
      }
      return corrected;
    }
  } catch (err) {
    console.error('[LanguageTool API Error]:', err);
  }
  return text;
}

// Función para traducir texto usando la API pública gratuita de Google Translate
async function googleTranslateText(text, targetLang) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0]) {
        return data[0].map(x => x[0]).join('');
      }
    }
  } catch (err) {
    console.error('[Google Translate Error]:', err);
  }
  return text;
}

// Corrector ortográfico con Gemini en español o fallback de LT y diccionario local (sin traducción)
app.post('/api/correct', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.json({ correctedText: '' });
  }

  // Corregimos la ortografía siempre en español ("es"), ya que el agente escribe en español
  const activeLang = 'es';
  let correctedText = text;

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
    try {
      const prompt = `Corrige cualquier error de ortografía, gramática, acentuación o puntuación en el siguiente texto redactado por un técnico de soporte de software en español.
Mantén el mismo significado, tono profesional y estilo. No añadas introducciones, explicaciones ni comillas. Devuelve ÚNICAMENTE el texto limpio y corregido en español.

Texto:
"${text}"`;

      const result = await callGeminiWithRetryAndFallback(prompt, "Devuelve únicamente el texto corregido sin explicaciones ni comillas.", null);
      if (result.ok && result.answer) {
        let corrected = result.answer.trim();
        if (corrected.startsWith('"') && corrected.endsWith('"')) {
          corrected = corrected.substring(1, corrected.length - 1);
        }
        correctedText = corrected;
        console.log(`[CORRECT GEMINI - es] Original: "${text}" | Corregido: "${correctedText}"`);
      }
    } catch (err) {
      console.error(`[CORRECT - es] Error llamando a Gemini:`, err);
    }
  }

  // LanguageTool fallback (si Gemini no corrigió o no está configurado)
  if (correctedText === text) {
    try {
      const ltCorrected = await languageToolCorrectSpelling(correctedText, 'es');
      if (ltCorrected !== correctedText) {
        correctedText = ltCorrected;
        console.log(`[CORRECT LT - es] Original: "${text}" | Corregido: "${correctedText}"`);
      }
    } catch (err) {
      console.error(`[CORRECT LT - es] Error en LanguageTool:`, err);
    }
  }

  // Local fallback spellchecker (sólo para español)
  if (correctedText === text) {
    correctedText = localCorrectSpelling(text);
    console.log(`[CORRECT LOCAL - es] Original: "${text}" | Corregido: "${correctedText}"`);
  }

  return res.json({ correctedText });
});

// Custom POST route for Gemini AI assistant
app.post('/api/gemini', async (req, res) => {
  const { query, software, lang } = req.body;
  const clientLang = lang || 'es';
  console.log(`[API /api/gemini] Petición recibida. Consulta: "${query}" | Software: "${software || 'General'}" | Lang: "${clientLang}"`);

  if (!query) {
    console.log('[API /api/gemini] Consulta vacía. Enviando 400.');
    return res.status(400).json({ response: 'Por favor, proporciona una consulta.' });
  }

  // Check for User Bearer Token (Google OAuth)
  const authHeader = req.headers.authorization;
  let oauthToken = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    oauthToken = authHeader.split(' ')[1];
  }

  console.log(`[API /api/gemini] Token OAuth del usuario presente: ${oauthToken ? 'SÍ' : 'NO'}`);

  // Load local knowledge base dynamically on each request, filtered by the selected software context
  const kbText = await loadKnowledgeBase(software);

  // If there's an OAuth token or a global developer key, we connect to Gemini
  if (oauthToken || (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')) {
    try {
      const systemInstruction = `Eres "Microarea Ai", el asistente virtual de la empresa Microarea Software (desarrollado con la tecnología Gemini de Google).
Tus respuestas deben ser claras, concisas, profesionales y serviciales.

DEBES DAR PRIORIDAD ABSOLUTA Y EXCLUSIVA A LA INFORMACIÓN OFICIAL EXTRAÍDA DE LAS PÁGINAS DE MICROAREA.ES Y MICROAREA.AI contenida en la siguiente BASE DE CONOCIMIENTO:

=== BASE DE CONOCIMIENTO (DOCUMENTOS OFICIALES Y MANUALES) ===
${kbText}
=============================================================

REGLAS CRÍTICAS DE RESPUESTA:
1. PREFERENCIA DE INFORMACIÓN: Toda la información sobre características, versiones, soporte, teléfonos, correos y enlaces de descarga debe basarse ESTRICTAMENTE en la base de conocimiento cargada arriba. No inventes datos, teléfonos, precios ni características que no estén presentes allí.
2. CONOCIMIENTO GENERAL LIMITADO: Si el usuario te pregunta sobre temas contables, fiscales, legales o generales, puedes responder usando tu conocimiento general como modelo de lenguaje. Sin embargo, para CUALQUIER consulta relacionada con los programas de Microarea (WinLab, EosWin, MaConta, MaGest, LexNext, Poshability), debes ceñirte ÚNICAMENTE a lo indicado en los documentos de soporte y la web oficial.
3. SOFTWARE SELECCIONADO: El usuario seleccionó el producto/tema: "${software || 'Consulta General'}". Si la consulta está relacionada, enfoca tu respuesta en este programa usando sus manuales oficiales cargados en la base de conocimiento.
4. TRASPASO A HUMANO: Si no encuentras la solución en los documentos cargados, si el usuario te lo solicita de manera explícita (o con frases como "quiero hablar con un agente", "pásame con soporte", "hablar con humano"), responde de forma amable indicando que vas a transferir la conversación e incluye obligatoriamente al final del mensaje la etiqueta exacta "[HANDOFF]" (en mayúsculas y con corchetes).
5. DEMOS Y PRUEBAS: Si preguntan por demostraciones, indícales que utilicen el formulario de la página web correspondiente para recibir el enlace de descarga directamente por email.
6. IDIOMA: El idioma preferido de la interfaz del usuario es: "${clientLang}". Responde siempre en el idioma preferido de la interfaz del usuario ("${clientLang}"), a menos que el usuario te hable en otro idioma diferente, en cuyo caso debes responder en el idioma en el que te hable el usuario.
7. COMPLEMENTAR CON ORGANISMOS OFICIALES DE ESPAÑA: La base de conocimiento cargada contiene documentos y guías oficiales de organismos del Gobierno de España. Cuando respondas a consultas legales, fiscales, laborales o de cotización, debes complementar y fundamentar tus respuestas en base a esta legislación y directrices oficiales.
8. NO CONFUNDIR PRODUCTOS CON OTROS SECTORES: Evita confundir los nombres de los programas de Microarea con otros programas homónimos del mercado. Por ejemplo, **WinLab es única y exclusivamente un programa de gestión de Nóminas, Seguridad Social e I.R.P.F. en España**, y **bajo ningún concepto** debes describirlo o confundirlo con software de gestión para laboratorios dentales o de salud.`;

      console.log('[API /api/gemini] Iniciando llamadas a Gemini con reintentos y fallback...');
      const result = await callGeminiWithRetryAndFallback(query, systemInstruction, oauthToken);

      if (result.ok) {
        return res.json({ response: result.answer });
      } else {
        if (result.status === 401) {
          return res.json({ 
            response: '🔑 **Tu sesión de Google ha caducado o es inválida.**\n\nPor favor, haz clic en el botón **"Desconectar"** arriba a la derecha e inicia sesión de nuevo para renovar tus credenciales.' 
          });
        }
        
        if (result.status === 403) {
          return res.json({ 
            response: '⚠️ **Acceso denegado por Google Cloud (Error 403).**\n\nEsto suele significar que la **Generative Language API** no está activa en tu proyecto de Google Cloud.' 
          });
        }

        let errorDetails = result.errorText;
        if (result.parsedError) {
          errorDetails = JSON.stringify(result.parsedError, null, 2);
        }
        
        return res.json({
          response: `❌ **Error en la API de Gemini (${result.status})**\n\nDetalle del error:\n\`\`\`json\n${errorDetails}\n\`\`\``
        });
      }
    } catch (err) {
      console.error("[API /api/gemini] Error communicating with Gemini API:", err);
      return res.json({ response: '⚠️ Ocurrió un error de conexión al intentar comunicar con los servidores de Google.' });
    }
  }

  console.log('[API /api/gemini] Entrando al fallback local (respuestas estáticas)...');
  const queryLower = query.toLowerCase();
  let response = '';
  const isSpanish = (clientLang === 'es' || !clientLang);

  if (isSpanish) {
    // Fallback respuestas estáticas en Español
    if (queryLower.includes('winlab') || queryLower.includes('nómina') || queryLower.includes('seguridad social') || queryLower.includes('contrato') || queryLower.includes('laboral') || queryLower.includes('siltra')) {
      response = `**WinLab** es el software líder de Microarea para la **gestión de Nóminas, Seguridad Social y Relaciones Laborales en España**.
Está específicamente diseñado para asesorías laborales y departamentos de recursos humanos:
- **Cálculo de Nóminas:** Nóminas mensuales, pagas extras, atrasos de convenio (L03), finiquitos y liquidaciones.
- **Seguridad Social:** Envío y liquidación directa vía SILTRA y afiliación (AFI) en el Sistema RED de la TGSS.
- **Contratación y SEPE:** Confección de contratos oficiales y comunicación telemática mediante Contrat@.
- **Modelos Fiscales:** Retenciones IRPF (Modelos 111 y 190 ante la AEAT y Haciendas Forales).
- **Soporte Técnico:** (+34) 96 338 78 20 / winlab@microareanext.com`;
    } else if (queryLower.includes('maconta') || queryLower.includes('contabilidad') || queryLower.includes('asiento') || queryLower.includes('balance') || queryLower.includes('diario')) {
      response = `**MaConta** es nuestro software profesional para la **gestión contable y fiscal de empresas**.
- **Asientos Contables:** Contabilización automatizada de facturas, cobros y pagos con plantillas.
- **Impuestos Oficiales:** Confección del IVA (Modelo 303, 390) e Impuesto sobre Sociedades (Modelo 200).
- **Libros Oficiales:** Emisión del Libro Diario, Mayor, Balances de Sumas y Saldos y Cuentas Anuales.
- **Amortizaciones:** Control del inmovilizado y cálculo automático de amortizaciones.`;
    } else if (queryLower.includes('magest') || queryLower.includes('factura') || queryLower.includes('tpv') || queryLower.includes('inventario') || queryLower.includes('cliente') || queryLower.includes('stock')) {
      response = `**MaGest** es nuestro **ERP de facturación, compras, ventas y control de almacén** para pymes y comercios.
- **Ciclo Comercial:** Presupuestos, pedidos, albaranes, facturación y control de cobros/pagos.
- **Stock:** Gestión de almacén, control de inventario y trazabilidad por lotes/series.
- **Facturación Electrónica:** Adaptado a la legislación de facturación electrónica en España (TicketBAI, etc.).
- **TPV:** Interfaz de terminal punto de venta táctil para comercios.`;
    } else if (queryLower.includes('eoswin') || queryLower.includes('módulo') || queryLower.includes('autónomo') || queryLower.includes('renta') || queryLower.includes('estimación')) {
      response = `**EosWin** es nuestro software para la **gestión fiscal de autónomos y estimaciones (directa y objetiva)**.
- **Módulos:** Gestión y cálculo de módulos agrícolas, ganaderos y empresariales.
- **Declaraciones Trimestrales:** IRPF (Modelos 130, 131) e IVA (Modelos 303, 390).
- **Campaña de Renta:** Integración para la presentación telemática del Modelo 100 de Renta.`;
    } else if (queryLower.includes('lexnext') || queryLower.includes('abogado') || queryLower.includes('jurídico') || queryLower.includes('despacho') || queryLower.includes('expediente') || queryLower.includes('juicio')) {
      response = `**LexNext** es nuestro software de **gestión jurídica para despachos de abogados y bufetes**.
- **Expedientes:** Ficha única del expediente, intervinientes, contrarios, juzgados y documentos.
- **Agenda y Plazos:** Control estricto de señalamientos, vistas, reuniones y plazos.
- **Sincronización LexNET:** Seguimiento integrado de notificaciones de la plataforma oficial LexNET.
- **Minutación:** Control de hojas de encargo, provisión de fondos y facturación de honorarios.`;
    } else if (queryLower.includes('poshability') || queryLower.includes('hostelería')) {
      response = `**Poshability** es nuestra solución de **TPV y gestión comercial táctil para el sector de la hostelería** y restauración.`;
    } else if (queryLower.includes('soporte') || queryLower.includes('humano') || queryLower.includes('agente') || queryLower.includes('persona')) {
      response = `Entendido. Te transferiré con un técnico de soporte. [HANDOFF]`;
    } else {
      response = `¡Hola! Soy **MicroArea Ai**, tu asistente virtual inteligente basado en Gemini. 
Estoy aquí para ayudarte con cualquier duda sobre nuestra gama de productos (WinLab, EosWin, MaConta, MaGest, LexNext, Poshability).
¿De cuál de ellos te gustaría que habláramos hoy?`;
    }
  } else {
    // Fallback static responses in English for other languages
    if (queryLower.includes('winlab') || queryLower.includes('payroll') || queryLower.includes('social security') || queryLower.includes('contract') || queryLower.includes('laboral')) {
      response = `**WinLab** is Microarea's leading software for **Payroll, Social Security, and Labor Relations management in Spain**.
Specifically designed for labor advisors and HR departments:
- **Payroll Calculations:** Monthly payrolls, extra payments, agreement updates, and settlements.
- **Social Security:** Direct settlement via SILTRA (CRA, bases files) and affiliation (AFI) in TGSS.
- **Contracts:** Configuration of official contracts and telematic communication via Contrat@.
- **Taxes:** IRPF retentions declarations (Forms 111 and 190 before AEAT).
- **Technical Support:** (+34) 96 338 78 20 / winlab@microareanext.com`;
    } else if (queryLower.includes('maconta') || queryLower.includes('accounting') || queryLower.includes('entry') || queryLower.includes('balance') || queryLower.includes('ledger')) {
      response = `**MaConta** is our professional software for **accounting and tax management of companies**.
- **Accounting Entries:** Automated recording of invoices, collections, and payments with templates.
- **Official Taxes:** Preparation of VAT (Forms 303, 390) and Corporate Tax (Form 200).
- **Official Books:** Output of Daily Book, Ledger, Sums and Balances, and Annual Accounts.
- **Amortization:** Control of fixed assets and automatic technical and fiscal depreciation.`;
    } else if (queryLower.includes('magest') || queryLower.includes('invoice') || queryLower.includes('tpv') || queryLower.includes('inventory') || queryLower.includes('stock')) {
      response = `**MaGest** is our **ERP for invoicing, purchasing, sales, and warehouse stock control** for SMEs and retail shops.
- **Commercial Cycle:** Budgets, orders, delivery notes, invoicing, and collections/payments tracking.
- **Stock Control:** Multi-warehouse management, inventory control, and lot/serial number traceability.
- **Electronic Invoicing:** Adapted to electronic invoicing legislation in Spain (TicketBAI, etc.).
- **POS:** Fast touch screen Point of Sale interface for shops.`;
    } else if (queryLower.includes('eoswin') || queryLower.includes('freelance') || queryLower.includes('tax') || queryLower.includes('estimate')) {
      response = `**EosWin** is our software for **tax management of freelancers and estimates (direct and module-based)**.
- **Modules:** Calculation and management of agricultural and business modules.
- **Quarterly Returns:** IRPF (Forms 130, 131) and VAT (Forms 303, 390).
- **Income Tax:** Integration for online submission of the Income Tax Form 100.`;
    } else if (queryLower.includes('lexnext') || queryLower.includes('lawyer') || queryLower.includes('legal') || queryLower.includes('case')) {
      response = `**LexNext** is our **legal management software for law firms and lawyers**.
- **Case Files:** Single record of case files, parties, opposing lawyers, courts, and documents.
- **Agenda & Deadlines:** Strict control of hearings, views, meetings, and procedural deadlines.
- **LexNET Sync:** Integrated tracking of judicial notifications from the official LexNET platform.
- **Billing:** Management of work sheets, funds provision, and invoicing of fees and expenses.`;
    } else if (queryLower.includes('poshability') || queryLower.includes('hospitality') || queryLower.includes('restaurant')) {
      response = `**Poshability** is our touch POS and commercial management solution for the **hospitality and food service sector**.`;
    } else if (queryLower.includes('support') || queryLower.includes('human') || queryLower.includes('agent') || queryLower.includes('person')) {
      response = `Understood. I will transfer you to a support technician. [HANDOFF]`;
    } else {
      response = `Hello! I am **Microarea Ai**, your smart virtual assistant based on Gemini. 
I am here to help you with any questions about our range of products (WinLab, EosWin, MaConta, MaGest, LexNext, Poshability).
Which one would you like to discuss today?`;
    }
  }

  return res.json({ response });
});

// Endpoint POST for Human Handoff (sending chat transcript via email)
app.post('/api/handoff', async (req, res) => {
  const { name, email, phone, software, history } = req.body;
  console.log(`[API /api/handoff] Recibida solicitud de traspaso. Cliente: ${name} (${email}) | Software: ${software}`);

  if (!name || !email || !history) {
    return res.status(400).json({ error: 'Faltan campos requeridos (nombre, email e historial).' });
  }

  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.serviciodecorreo.es',
      port: 587,
      secure: false,
      auth: {
        user: 'noreply@microarea-law.es',
        pass: 'AlexJimenez2007@'
      },
      tls: { rejectUnauthorized: false }
    });

    // Formatear el historial de chat para el cuerpo del correo
    let historyHtml = '';
    history.forEach(msg => {
      const senderName = msg.sender === 'user' ? 'Cliente' : 'Asistente IA';
      const bg = msg.sender === 'user' ? '#e8f8f5' : '#f4f6f6';
      const border = msg.sender === 'user' ? 'border-right: 4px solid #00a99d;' : 'border-left: 4px solid #7f8c8d;';
      historyHtml += `
        <div style="margin-bottom: 12px; padding: 10px; background-color: ${bg}; border-radius: 8px; ${border}">
          <strong style="font-size: 11px; color: #7f8c8d; text-transform: uppercase;">${senderName}</strong>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #2c3e50; line-height: 1.4;">${msg.text.replace(/\n/g, '<br>')}</p>
        </div>`;
    });

    const mailOptions = {
      from: '"Microarea Chat IA" <noreply@microarea-law.es>',
      to: ['info@microareanext.com', 'soporte@microareanext.com'],
      subject: `🚨 TRASPASO CHAT IA: ${name} - ${software}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #2c3e50;">
          <h2 style="color: #007d74; border-bottom: 2px solid #00a99d; padding-bottom: 8px;">Solicitud de Soporte Técnico Humano</h2>
          <p>Un cliente ha solicitado la asistencia de un operador humano a través del chat de la web <strong>microarea.ai</strong>.</p>
          
          <table border="1" cellpadding="8" style="border-collapse: collapse; border: 1px solid #ddd; width: 100%; margin-bottom: 20px;">
            <tr style="background-color:#f2f2f2;"><th align="left">Campo</th><th align="left">Valor</th></tr>
            <tr><td><strong>Nombre:</strong></td><td>${name}</td></tr>
            <tr><td><strong>Email:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td><strong>Teléfono:</strong></td><td>${phone || 'No especificado'}</td></tr>
            <tr><td><strong>Programa:</strong></td><td>${software}</td></tr>
            <tr><td><strong>Fecha/Hora:</strong></td><td>${new Date().toLocaleString('es-ES')}</td></tr>
          </table>

          <h3 style="color: #007d74; margin-top: 25px;">Historial de la Conversación con la IA:</h3>
          <div style="border: 1px solid #eee; padding: 15px; border-radius: 12px; background-color: #fafafa; max-height: 400px; overflow-y: auto;">
            ${historyHtml}
          </div>
          
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 11px; color: #95a5a6; text-align: center;">Este es un mensaje automático del servidor de chat de microarea.ai</p>
        </div>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Solicitud de handoff de ${name} enviada por correo con éxito.`);
    return res.json({ success: true });
  } catch (err) {
    console.error('[EMAIL ERROR] Error al enviar correo de handoff:', err);
    return res.status(500).json({ error: 'Error al enviar la solicitud por correo electrónico.' });
  }
});

// Custom POST route for community operations
app.post('/comunidad/carga.php', async (req, res) => {
  const op = req.body.op;
  const cookies = parseCookies(req);
  const userId = cookies.usuario_comunidad ? parseInt(cookies.usuario_comunidad, 10) : null;
  
  const lang = getLanguageFromRequest(req);
  const translations = loadTranslations(req.site, lang);
  const esTranslations = lang === 'es' ? translations : loadTranslations(req.site, 'es');
  
  const gi_publicado_por = getTranslation(translations, esTranslations, 'gi_publicado_por') || 'Publicado por';
  const gi_respuesta = getTranslation(translations, esTranslations, 'gi_respuesta') || 'Respuesta';
  const gi_respuestas = getTranslation(translations, esTranslations, 'gi_respuestas') || 'Respuestas';
  const gi_confirma_eliminar = getTranslation(translations, esTranslations, 'gi_confirma_eliminar') || '¿Confirmar eliminación?';
  const crypto = require('crypto');

  switch (op) {
    case 'registrar': {
      let mensajeError = '';
      const nombre = req.body.nombre || '';
      const apellidos = req.body.apellidos || '';
      const email = req.body.email || '';
      const passwordSinCifrar = req.body.password || '';
      
      const passwordRegex = /^(?=.*\d)(?=.*[A-Za-z])[0-9A-Za-z!@#$%]{8,12}$/;
      if (!passwordSinCifrar || !passwordRegex.test(passwordSinCifrar)) {
        const gi_contrasena_sencilla = getTranslation(translations, esTranslations, 'gi_contraseña_sencilla') || 'La contraseña debe tener de 8 a 12 caracteres y contener números y letras.';
        mensajeError += gi_contrasena_sencilla + '<br>';
        return res.send(`<script type="text/javascript">$('#notificaciones_form').html('${mensajeError}');</script>`);
      }
      
      try {
        const emailCheck = await db.query('SELECT count(*) FROM usuario_comunidad WHERE email ILIKE $1', [email]);
        if (parseInt(emailCheck.rows[0].count, 10) > 0) {
          const gi_email_existe = getTranslation(translations, esTranslations, 'gi_email_existe') || 'El email introducido ya existe.';
          mensajeError += gi_email_existe + '<br>';
          return res.send(`<script type="text/javascript">marcaInput(1,'email'); $('#notificaciones_form').html('${mensajeError}');</script>`);
        }
        
        const md5Password = crypto.createHash('md5').update(passwordSinCifrar).digest('hex');
        await db.query(
          'INSERT INTO usuario_comunidad (nombre, apellidos, email, password, nivel, activo) VALUES ($1, $2, $3, $4, 2, 0)',
          [nombre, apellidos, email, md5Password]
        );
        
        const concatStr = (nombre + email + apellidos + '2').toLowerCase();
        const cadenaRegistro = crypto.createHash('md5').update(concatStr).digest('hex');
        
        const gi_comunidad = getTranslation(translations, esTranslations, 'gi_comunidad') || 'Comunidad';
        const gi_confirmacion_registro = getTranslation(translations, esTranslations, 'gi_confirmacion_registro') || 'Confirmación de registro';
        const gi_link_confirma = getTranslation(translations, esTranslations, 'gi_link_confirma') || 'Haga clic en el siguiente enlace para confirmar su registro';
        const gi_registro_pendiente = getTranslation(translations, esTranslations, 'gi_registro_pendiente') || 'Registro Pendiente de Confirmación';
        const gi_confirme_registro = getTranslation(translations, esTranslations, 'gi_confirme_registro') || 'Revise su bandeja de correo electrónico...';
        
        const hostHeader = req.headers.host || '';
        const baseUrl = `http://${hostHeader}`;
        
        const asunto = `WinLab ${gi_comunidad} - ${gi_confirmacion_registro}`;
        const cuerpo = `${gi_link_confirma}<br><br><a href="${baseUrl}/comunidad/?ccr=${cadenaRegistro}">${baseUrl}/comunidad/?ccr=${cadenaRegistro}</a><br><br>`;
        
        try {
          const transporter = nodemailer.createTransport({
            host: 'smtp.serviciodecorreo.es',
            port: 587,
            secure: false,
            auth: {
              user: 'noreply@microarea-law.es',
              pass: 'AlexJimenez2007@'
            },
            tls: {
              rejectUnauthorized: false
            }
          });
          
          await transporter.sendMail({
            from: '"WinLab" <noreply@microarea-law.es>',
            to: email,
            subject: asunto,
            html: cuerpo
          });
          console.log(`[EMAIL SENT] Verification email sent successfully to ${email}`);
        } catch (mailErr) {
          console.error('Error sending registration confirmation email:', mailErr);
        }
        
        res.send(`
          <script type="text/javascript">
            $('#carga-formulario-registro').html('<h2 class="section-heading text-center">${gi_registro_pendiente}</h2><span>${gi_confirme_registro}</span>');
          </script>
        `);
      } catch (dbErr) {
        console.error('Error registering community user:', dbErr);
        res.status(500).send('Error registering user.');
      }
      break;
    }
    case 'logear': {
      const emailInput = req.body.email || '';
      const passwordInput = req.body.password || '';
      const md5Email = crypto.createHash('md5').update(emailInput).digest('hex');
      const md5Password = crypto.createHash('md5').update(passwordInput).digest('hex');
      
      try {
        const userRes = await db.query(
          'SELECT * FROM usuario_comunidad WHERE (email = $1 OR md5(email) = $2) AND password = $3',
          [emailInput, md5Email, md5Password]
        );
        if (userRes.rows.length > 0) {
          const user = userRes.rows[0];
          res.cookie('usuario_comunidad', user.id.toString(), { path: '/' });
          res.cookie('nivel_comunidad', (user.nivel || 2).toString(), { path: '/' });
          res.send('<script type="text/javascript">window.location.replace("");</script>');
        } else {
          res.send(`<script type="text/javascript">marcaInput(1,'login_password'); $('#notificaciones_form').html('Credenciales incorrectas<br>');</script>`);
        }
      } catch (dbErr) {
        console.error('Error logging in community user:', dbErr);
        res.status(500).send('Error logging in.');
      }
      break;
    }
    case 'desconectar': {
      res.clearCookie('usuario_comunidad', { path: '/' });
      res.clearCookie('nivel_comunidad', { path: '/' });
      res.send('<script type="text/javascript">window.location.replace("");</script>');
      break;
    }
    case 'guardarAjustes': {
      if (!userId) return res.send('Error: no session');
      const nombre = req.body.nombre || '';
      const apellidos = req.body.apellidos || '';
      const passwordEntra = req.body.password || '';
      
      try {
        let query = 'UPDATE usuario_comunidad SET nombre = $1, apellidos = $2';
        const params = [nombre, apellidos, userId];
        if (passwordEntra) {
          const md5Password = crypto.createHash('md5').update(passwordEntra).digest('hex');
          query += ', password = $4';
          params.push(md5Password);
        }
        query += ' WHERE id = $3';
        await db.query(query, params);
        
        res.send(`
          <script type="text/javascript">
            $('#carga-formulario-ajustes').html('<h2 class="section-heading text-center">Ajustes Editados</h2>');
            setTimeout(function(){ location.reload(true) }, 1000);
          </script>
        `);
      } catch (dbErr) {
        console.error('Error saving adjustments:', dbErr);
        res.status(500).send('Error saving adjustments.');
      }
      break;
    }
    case 'recuperar': {
      const email = req.body.email || '';
      try {
        const userRes = await db.query('SELECT id, nombre, email, apellidos, nivel FROM usuario_comunidad WHERE email = $1', [email]);
        if (userRes.rows.length > 0) {
          const u = userRes.rows[0];
          const concatStr = (u.nombre + u.email + u.apellidos + u.nivel).toLowerCase();
          const cadenaRecuperacion = crypto.createHash('md5').update(concatStr).digest('hex');
          
          const gi_comunidad = getTranslation(translations, esTranslations, 'gi_comunidad') || 'Comunidad';
          const gi_recuperacion_contrasena = getTranslation(translations, esTranslations, 'gi_recuperacion_contrasena') || 'Recuperación de contraseña';
          const gi_adjunta_link_recupera = getTranslation(translations, esTranslations, 'gi_adjunta_link_recupera') || 'Se adjunta el siguiente vínculo para restablecer su contraseña';
          const gi_mail_enviado = getTranslation(translations, esTranslations, 'gi_mail_enviado') || 'Correo enviado';
          const gi_revise_bandeja_recupera = getTranslation(translations, esTranslations, 'gi_revise_bandeja_recupera') || 'Revise su bandeja de correo electrónico...';
          
          const hostHeader = req.headers.host || '';
          const baseUrl = `http://${hostHeader}`;
          
          const asunto = `WinLab ${gi_comunidad} - ${gi_recuperacion_contrasena}`;
          const cuerpo = `${gi_adjunta_link_recupera}<br><br><a href="${baseUrl}/comunidad/?crp=${cadenaRecuperacion}">${baseUrl}/comunidad/?crp=${cadenaRecuperacion}</a><br><br>`;
          
          try {
            const transporter = nodemailer.createTransport({
              host: 'smtp.serviciodecorreo.es',
              port: 587,
              secure: false,
              auth: {
                user: 'noreply@microarea-law.es',
                pass: 'AlexJimenez2007@'
              },
              tls: {
                rejectUnauthorized: false
              }
            });
            
            await transporter.sendMail({
              from: '"WinLab" <noreply@microarea-law.es>',
              to: email,
              subject: asunto,
              html: cuerpo
            });
          } catch (mailErr) {
            console.error('Error sending recovery email:', mailErr);
          }
          
          res.send(`
            <script type="text/javascript">
              $('#carga-formulario-login').html('<h2 class="section-heading text-center">${gi_mail_enviado}</h2><span>${gi_revise_bandeja_recupera}</span>');
            </script>
          `);
        } else {
          res.send(`<script type="text/javascript">marcaInput(1,'login_mail');</script>`);
        }
      } catch (dbErr) {
        console.error('Error recovering user:', dbErr);
        res.status(500).send('Error recovering user.');
      }
      break;
    }
    case 'restablecerPassword': {
      const crp = req.body.crp || '';
      const password = req.body.password || '';
      const md5Password = crypto.createHash('md5').update(password).digest('hex');
      
      try {
        const allUsers = await db.query('SELECT id, nombre, email, apellidos, nivel FROM usuario_comunidad');
        let matchedUser = null;
        for (const u of allUsers.rows) {
          const concatStr = (u.nombre + u.email + u.apellidos + u.nivel).toLowerCase();
          const hash = crypto.createHash('md5').update(concatStr).digest('hex');
          if (hash === crp.toLowerCase()) {
            matchedUser = u;
            break;
          }
        }
        if (matchedUser) {
          await db.query('UPDATE usuario_comunidad SET password = $1 WHERE id = $2', [md5Password, matchedUser.id]);
          
          const gi_contrasena_restablecida = getTranslation(translations, esTranslations, 'gi_contrasena_restablecida') || 'Contraseña restablecida';
          res.send(`<script type="text/javascript">$('#carga-formulario-login').html('<h2 class="section-heading text-center">${gi_contrasena_restablecida}</h2><span></span>');</script>`);
        } else {
          res.status(400).send('Token de restablecimiento inválido.');
        }
      } catch (dbErr) {
        console.error('Error resetting password:', dbErr);
        res.status(500).send('Error resetting password.');
      }
      break;
    }
    case 'listar': {
      const pag = parseInt(req.body.pag || '1', 10);
      const filtra = req.body.filtra || '';
      const tag = req.body.tag || '';
      const cantPorPagina = 50;
      const pubDesde = (pag - 1) * cantPorPagina;
      
      let whereClause = 'WHERE id_entrada_responde = 0 AND aplicacion = 1';
      const params = [];
      
      if (tag) {
        const cleanTag = tag.replace(/[^A-Za-z0-9 ]/g, '');
        if (filtra === 'etiqueta') {
          whereClause += ` AND etiquetas LIKE $${params.length + 1}`;
          params.push(`%${cleanTag}%`);
        } else if (filtra === 'buscador') {
          whereClause += ` AND (titulo ILIKE $${params.length + 1} OR texto ILIKE $${params.length + 1} OR etiquetas ILIKE $${params.length + 1})`;
          params.push(`%${cleanTag}%`);
        }
      }
      
      try {
        const countRes = await db.query(`SELECT count(*) FROM entrada_comunidad ${whereClause}`, params);
        const totalEntries = parseInt(countRes.rows[0].count, 10);
        
        const entriesRes = await db.query(`
          SELECT e.*, u.nombre as autor_nombre, u.apellidos as autor_apellidos,
                 (SELECT COUNT(*) FROM entrada_comunidad r WHERE r.id_entrada_responde = e.id AND r.aplicacion = 1) as respuestas_count
          FROM entrada_comunidad e
          LEFT JOIN usuario_comunidad u ON e.id_autor = u.id
          ${whereClause}
          ORDER BY e.fecha DESC
          LIMIT ${cantPorPagina} OFFSET ${pubDesde}
        `, params);
        
        let htmlContent = '';
        let cont = 0;
        for (const row of entriesRes.rows) {
          cont++;
          const id = row.id;
          const nombreAutor = row.autor_nombre || '';
          const titulo = row.titulo || '';
          const texto = row.texto || '';
          const respuestas = parseInt(row.respuestas_count || '0', 10);
          
          const dateObj = row.fecha ? new Date(row.fecha) : new Date();
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          const fecha = `${day}/${month}/${year} - ${hours}:${minutes}`;
          
          const paroimpar = cont % 2 === 0 ? 'lineaPar' : 'lineaImpar';
          const etiquetaRespuestas = respuestas === 1 ? ` ${gi_respuesta}` : ` ${gi_respuestas}`;
          const isOwnerOrAdmin = (userId && (userId === row.id_autor)) || (cookies.nivel_comunidad === '1');
          
          htmlContent += `
            <div class="lineaEntrada ${paroimpar} lineaEntradaPointer" onclick="cargaRespuestas(${id},'lista')">
              <div class="columnaEntradaIz" id="columnaEntradaIz${id}">
                <div class="tituloEntrada">${titulo}</div>
                <div class="textoEntrada">${texto}</div>
                <div class="autorEntrada">${gi_publicado_por} <span>${nombreAutor}</span></div>
              </div>
              <div class="columnaEntradaDe">
                <div class="fechaEntrada">${fecha}</div>
                <div class="respuestasEntrada">
                  <span id="cuentaRespuestas${id}">${respuestas}</span>
                  <span id="etiquetaRespuestas${id}">${etiquetaRespuestas}</span>
                </div>
                <div class="opcionesEntrada">
                  ${isOwnerOrAdmin ? `
                    <i class="fa fa-edit botonOpciones botonEditar" title="Editar" id="botonEditarEntrada${id}" onclick="editarEntrada(${id})"></i>
                    <i class="fa fa-trash botonOpciones botonBorrar" title="Borrar" id="botonBorrarEntrada${id}" onclick="borrarEntrada(${id})"></i>
                    <div class="confirmaBorrar" id="confirmaBorrar${id}">
                      <i class="fa fa-ban botonOpciones botonCanc" id="botonBorrarEntrada${id}" onclick="borrarEntrada(${id})"></i>
                      <i class="fa fa-check-circle botonOpciones botonOk" id="botonEditarEntrada${id}" onclick="confirmaBorrarEntrada(${id},'e')"></i>
                      <span>${gi_confirma_eliminar}</span>
                    </div>
                  ` : ''}
                </div>
                <div class="opcionesEntrada">
                  <a href="consulta/${id}-${codificaURL(titulo)}/" target="_blank" title="Abrir en una nueva pestaña"><i class="fa fa-external-link botonOpciones botonEditar"></i></a>
                </div>
              </div>
            </div>
            <div class="editorEntrada" id="editorEntrada${id}"></div>
            <div class="lineaRespuestas" id="lineaRespuestas_${id}"></div>
          `;
        }
        
        if (tag) {
          const gi_filtro = getTranslation(translations, esTranslations, 'gi_filtro') || 'Filtro';
          htmlContent = `
            <div class="lineaFiltro">
              <div class="enunciadoFiltro">${gi_filtro}:</div>
              <div class="elementoFiltro">
                ${tag}
                <i class="fa fa-minus-circle icoQuitaFiltro" onclick="listaContenido('','','')"></i>
              </div>
            </div>
          ` + htmlContent;
        }
        
        const cantPaginas = Math.ceil(totalEntries / cantPorPagina);
        htmlContent += `
          <script type="text/javascript">
            cargaPaginador(${cantPaginas}, ${pag}, '${filtra}', '${tag}');
          </script>
        `;
        
        res.send(htmlContent);
      } catch (dbErr) {
        console.error('Error listing entries:', dbErr);
        res.status(500).send('Error listing entries.');
      }
      break;
    }
    case 'formularioPublicar': {
      const gi_titulo = getTranslation(translations, esTranslations, 'gi_titulo') || 'Título';
      const gi_detalles = getTranslation(translations, esTranslations, 'gi_detalles') || 'Detalles';
      const gi_etiquetas_nota = getTranslation(translations, esTranslations, 'gi_etiquetas_nota') || 'Etiquetas (separadas por espacio)';
      const gi_publicar = getTranslation(translations, esTranslations, 'gi_publicar') || 'Publicar';
      
      res.send(`
        <script>tinymce.init({ selector:'textarea', plugins:'image', language:"es_ES", images_upload_url : 'http://localhost:8081/comunidad/postAcceptor.php' });</script>
        <div class="bloqueFormularioCentro">
          <div class="lineaFormulario">
            <div class="etiquetaFormulario">${gi_titulo}</div>
            <div class="campoFormulario">
              <input type="text" id="tituloEntrada0">
            </div>
          </div>
          <div class="lineaFormulario">
            <div class="etiquetaFormulario">${gi_detalles}</div>
            <div class="campoFormulario">
              <textarea id="textoEntrada0"></textarea>
            </div>
          </div>
          <div class="lineaFormulario">
            <div class="etiquetaFormulario">${gi_etiquetas_nota}</div>
            <div class="campoFormulario">
              <input type="text" id="etiquetasEntrada0">
            </div>
          </div>
          <div class="lineaFormulario">
            <div class="botonFormulario" onclick="publicarEntrada(0,'crear')">${gi_publicar}</div>
          </div>
        </div>
      `);
      break;
    }
    case 'editarPublicacion': {
      const id = parseInt(req.body.id || '0', 10);
      const tipo = req.body.tipo || '';
      
      try {
        const entryRes = await db.query('SELECT * FROM entrada_comunidad WHERE id = $1', [id]);
        if (entryRes.rows.length === 0) return res.send('No entry found');
        const row = entryRes.rows[0];
        const titulo = row.titulo || '';
        const texto = row.texto || '';
        const etiquetas = row.etiquetas || '';
        
        const gi_titulo = getTranslation(translations, esTranslations, 'gi_titulo') || 'Título';
        const gi_detalles = getTranslation(translations, esTranslations, 'gi_detalles') || 'Detalles';
        const gi_etiquetas_nota = getTranslation(translations, esTranslations, 'gi_etiquetas_nota') || 'Etiquetas (separadas por espacio)';
        const gi_guardar = getTranslation(translations, esTranslations, 'gi_guardar') || 'Guardar';
        const gi_cancelar = getTranslation(translations, esTranslations, 'gi_cancelar') || 'Cancelar';
        
        res.send(`
          <script>tinymce.init({ selector:'textarea', plugins:'image', language:"es_ES", images_upload_url : 'http://localhost:8081/comunidad/postAcceptor.php' });</script>
          <div class="bloqueFormularioCentro">
            ${tipo === 'entrada' ? `
              <div class="lineaFormulario">
                <div class="etiquetaFormulario">${gi_titulo}</div>
                <div class="campoFormulario">
                  <input type="text" id="tituloEntrada${id}" value="${titulo}">
                </div>
              </div>
            ` : ''}
            <div class="lineaFormulario">
              <div class="etiquetaFormulario">${gi_detalles}</div>
              <div class="campoFormulario">
                <textarea id="textoEntrada${id}">${texto}</textarea>
              </div>
            </div>
            ${tipo === 'entrada' ? `
              <div class="lineaFormulario">
                <div class="etiquetaFormulario">${gi_etiquetas_nota}</div>
                <div class="campoFormulario">
                  <input type="text" id="etiquetasEntrada${id}" value="${etiquetas}">
                </div>
              </div>
            ` : ''}
            <div class="lineaFormulario">
              ${tipo === 'entrada' ? `
                <div class="botonFormulario" onclick="publicarEntrada(${id},'editar')">${gi_guardar}</div>
              ` : `
                <div class="botonFormulario" onclick="publicarRespuesta(${id},'editar')">${gi_guardar}</div>
              `}
              <div class="botonCancelar" onclick="ocultaEditorEntrada()">${gi_cancelar}</div>
            </div>
          </div>
        `);
      } catch (dbErr) {
        console.error('Error fetching entry to edit:', dbErr);
        res.status(500).send('Error loading editor.');
      }
      break;
    }
    case 'publicaEntrada': {
      if (!userId) return res.send('Unauthorized');
      const id = parseInt(req.body.id || '0', 10);
      const accion = req.body.accion || '';
      const tituloEntrada = req.body.tituloEntrada || '';
      const textoEntrada = req.body.textoEntrada || '';
      const etiquetasEntrada = (req.body.etiquetasEntrada || '').toLowerCase();
      
      try {
        if (accion === 'crear') {
          await db.query(
            'INSERT INTO entrada_comunidad (id_autor, titulo, texto, etiquetas, version, aplicacion, id_entrada_responde, fecha) VALUES ($1, $2, $3, $4, \'8\', 1, 0, NOW())',
            [userId, tituloEntrada, textoEntrada, etiquetasEntrada]
          );
        } else if (accion === 'editar') {
          await db.query(
            'UPDATE entrada_comunidad SET titulo = $1, texto = $2, etiquetas = $3 WHERE id = $4',
            [tituloEntrada, textoEntrada, etiquetasEntrada, id]
          );
        }
        res.send(`
          <script type="text/javascript">
            ${accion === 'crear' ? 'cargaFormularioPublicar();' : ''}
            listaContenido('','','');
            cargaEtiquetas();
          </script>
        `);
      } catch (dbErr) {
        console.error('Error saving entry:', dbErr);
        res.status(500).send('Error saving entry.');
      }
      break;
    }
    case 'respuestas': {
      const id = parseInt(req.body.id || '0', 10);
      const gi_responder = getTranslation(translations, esTranslations, 'gi_responder') || 'Responder';
      
      try {
        let html = `
          <div class="lineaOpcionesContenido">
            ${userId ? `
              <div class="opcionPublicar" id="opcionResponder${id}" onclick="cargaFormularioResponder(${id})">
                ${gi_responder}<i class="fa fa-plus-circle icoPublica"></i>
              </div>
            ` : ''}
          </div>
          <div class="bloqueFormularioResponde" id="bloqueFormularioResponde${id}"></div>
          <div class="cabeceraRespuestas">${gi_respuestas}</div>
        `;
        
        const repliesRes = await db.query(`
          SELECT e.*, u.nombre as autor_nombre, u.apellidos as autor_apellidos
          FROM entrada_comunidad e
          LEFT JOIN usuario_comunidad u ON e.id_autor = u.id
          WHERE e.id_entrada_responde = $1 AND e.aplicacion = 1
          ORDER BY e.fecha DESC
        `, [id]);
        
        let cont = 0;
        for (const row of repliesRes.rows) {
          cont++;
          const repId = row.id;
          const nombreAutor = row.autor_nombre || '';
          const titulo = row.titulo || '';
          const texto = row.texto || '';
          
          const dateObj = row.fecha ? new Date(row.fecha) : new Date();
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          const fecha = `${day}/${month}/${year} - ${hours}:${minutes}`;
          
          const isOwnerOrAdmin = (userId && (userId === row.id_autor)) || (cookies.nivel_comunidad === '1');
          
          html += `
            <div class="lineaEntrada lineaRespuesta">
              <div class="columnaEntradaIz">
                <div class="tituloEntrada">${titulo}</div>
                <div class="textoEntrada">${texto}</div>
                <div class="autorEntrada">${gi_publicado_por} <span>${nombreAutor}</span></div>
              </div>
              <div class="columnaEntradaDe">
                <div class="fechaEntrada">${fecha}</div>
                <div class="opcionesEntrada">
                  ${isOwnerOrAdmin ? `
                    <i class="fa fa-edit botonOpciones botonEditar" id="botonEditarEntrada${repId}" onclick="editarRespuesta(${repId})"></i>
                    <i class="fa fa-trash botonOpciones botonBorrar" id="botonBorrarEntrada${repId}" onclick="borrarEntrada(${repId})"></i>
                    <div class="confirmaBorrar" id="confirmaBorrar${repId}">
                      <i class="fa fa-ban botonOpciones botonCanc" id="botonBorrarEntrada${repId}" onclick="borrarEntrada(${repId})"></i>
                      <i class="fa fa-check-circle botonOpciones botonOk" id="botonEditarEntrada${repId}" onclick="confirmaBorrarEntrada(${repId},'r')"></i>
                      <span>${gi_confirma_eliminar}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="editorEntrada" id="editorEntrada${repId}"></div>
          `;
        }
        
        if (cont === 0) {
          html += '<div class="noHayRespuestas">No hay Respuestas</div>';
        }
        
        res.send(html);
      } catch (dbErr) {
        console.error('Error fetching replies:', dbErr);
        res.status(500).send('Error loading replies.');
      }
      break;
    }
    case 'formularioResponder': {
      const id = parseInt(req.body.id || '0', 10);
      const gi_responder = getTranslation(translations, esTranslations, 'gi_responder') || 'Responder';
      
      res.send(`
        <script>tinymce.init({ selector:'textarea', plugins:'image', language:"es_ES", images_upload_url : 'http://localhost:8081/comunidad/postAcceptor.php' });</script>
        <div class="bloqueFormularioCentro">
          <div class="lineaFormulario">
            <div class="etiquetaFormulario">${gi_respuesta}</div>
            <div class="campoFormulario">
              <textarea id="textoEntrada${id}"></textarea>
            </div>
          </div>
          <div class="lineaFormulario">
            <div class="botonFormulario" onclick="publicarRespuesta(${id},'crear')">${gi_responder}</div>
          </div>
        </div>
      `);
      break;
    }
    case 'publicaRespuesta': {
      if (!userId) return res.send('Unauthorized');
      const id = parseInt(req.body.id || '0', 10);
      const accion = req.body.accion || '';
      const textoEntrada = req.body.textoEntrada || '';
      
      try {
        if (accion === 'crear') {
          await db.query(
            'INSERT INTO entrada_comunidad (id_autor, titulo, texto, id_entrada_responde, aplicacion, fecha) VALUES ($1, $2, $3, $4, 1, NOW())',
            [userId, '', textoEntrada, id]
          );
        } else if (accion === 'editar') {
          await db.query('UPDATE entrada_comunidad SET texto = $1 WHERE id = $2', [textoEntrada, id]);
        }
        
        const countRepliesRes = await db.query('SELECT count(*) FROM entrada_comunidad WHERE id_entrada_responde = $1 AND aplicacion = 1', [id]);
        const numReplies = countRepliesRes.rows[0].count;
        
        if (accion === 'crear') {
          res.send(`
            <script type="text/javascript">
              cargaFormularioResponder(${id});
              actualizaNumeroRespuestas(${id}, ${numReplies});
              cargaRespuestas(${id}, 'publica');
            </script>
          `);
        } else {
          const entryRes = await db.query('SELECT id_entrada_responde FROM entrada_comunidad WHERE id = $1', [id]);
          const parentId = entryRes.rows[0].id_entrada_responde;
          res.send(`
            <script type="text/javascript">
              cargaFormularioResponder(${id});
              cargaRespuestas(${parentId}, 'publica');
            </script>
          `);
        }
      } catch (dbErr) {
        console.error('Error saving reply:', dbErr);
        res.status(500).send('Error saving reply.');
      }
      break;
    }
    case 'borraEntrada': {
      if (!userId) return res.send('Unauthorized');
      const id = parseInt(req.body.id || '0', 10);
      const tipo = req.body.tipo || '';
      
      try {
        const entryRes = await db.query('SELECT id_autor, id_entrada_responde FROM entrada_comunidad WHERE id = $1', [id]);
        if (entryRes.rows.length === 0) return res.send('Entry not found');
        const entry = entryRes.rows[0];
        
        if (userId === entry.id_autor || cookies.nivel_comunidad === '1') {
          const padreResp = entry.id_entrada_responde;
          await db.query('DELETE FROM entrada_comunidad WHERE id = $1 OR id_entrada_responde = $1', [id]);
          
          if (tipo === 'e') {
            res.send('<script type="text/javascript">listaContenido(\'\',\'\',\'\');</script>');
          } else {
            const countRes = await db.query('SELECT count(*) FROM entrada_comunidad WHERE id_entrada_responde = $1 AND aplicacion = 1', [padreResp]);
            const numReplies = countRes.rows[0].count;
            res.send(`
              <script type="text/javascript">
                cargaFormularioResponder(${padreResp});
                actualizaNumeroRespuestas(${padreResp}, ${numReplies});
                cargaRespuestas(${padreResp}, 'publica');
              </script>
            `);
          }
        } else {
          res.status(403).send('Unauthorized deletion');
        }
      } catch (dbErr) {
        console.error('Error deleting entry:', dbErr);
        res.status(500).send('Error deleting entry.');
      }
      break;
    }
    case 'cargaEtiquetas': {
      try {
        const tagsRes = await db.query('SELECT etiquetas FROM entrada_comunidad WHERE aplicacion = 1');
        const tagCounts = {};
        for (const row of tagsRes.rows) {
          if (row.etiquetas) {
            const tags = row.etiquetas.split(/\s+/);
            for (const tag of tags) {
              const cleanTag = tag.trim().toLowerCase();
              if (cleanTag) {
                tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
              }
            }
          }
        }
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
        
        let tagsHtml = '';
        for (const [tag, count] of sortedTags) {
          tagsHtml += `<span onclick="filtraEtiqueta('${tag}')">${tag}<span>(${count})</span></span>\n`;
        }
        res.send(tagsHtml);
      } catch (dbErr) {
        console.error('Error loading tags:', dbErr);
        res.status(500).send('Error loading tags.');
      }
      break;
    }
    case 'cargaConsulta': {
      const publi = parseInt(req.body.publi || '0', 10);
      try {
        const entryRes = await db.query(`
          SELECT e.*, u.nombre as autor_nombre, u.apellidos as autor_apellidos,
                 (SELECT COUNT(*) FROM entrada_comunidad r WHERE r.id_entrada_responde = e.id AND r.aplicacion = 1) as respuestas_count
          FROM entrada_comunidad e
          LEFT JOIN usuario_comunidad u ON e.id_autor = u.id
          WHERE e.id = $1 AND e.aplicacion = 1
        `, [publi]);
        
        if (entryRes.rows.length === 0) {
          return res.send('Consulta no encontrada');
        }
        const row = entryRes.rows[0];
        const id = row.id;
        const nombreAutor = row.autor_nombre || '';
        const titulo = row.titulo || '';
        const texto = row.texto || '';
        const respuestas = parseInt(row.respuestas_count || '0', 10);
        
        const dateObj = row.fecha ? new Date(row.fecha) : new Date();
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const fecha = `${day}/${month}/${year} - ${hours}:${minutes}`;
        
        const etiquetaRespuestas = respuestas === 1 ? ' Respuesta' : ' Respuestas';
        const isOwnerOrAdmin = (userId && (userId === row.id_autor)) || (cookies.nivel_comunidad === '1');
        
        const html = `
          <div class="lineaEntradaConsulta">
            <div class="columnaEntradaIz" id="columnaEntradaIz${id}">
              <div class="tituloEntrada">${titulo}</div>
              <div class="textoEntrada">${texto}</div>
              <div class="autorEntrada">${gi_publicado_por} <span>${nombreAutor}</span></div>
            </div>
            <div class="columnaEntradaDe">
              <div class="fechaEntrada">${fecha}</div>
              <div class="respuestasEntrada">
                <span id="cuentaRespuestas${id}">${respuestas}</span>
                <span id="etiquetaRespuestas${id}">${etiquetaRespuestas}</span>
              </div>
              <div class="opcionesEntrada">
                ${isOwnerOrAdmin ? `
                  <i class="fa fa-edit botonOpciones botonEditar" id="botonEditarEntrada${id}" onclick="editarEntrada(${id})"></i>
                  <i class="fa fa-trash botonOpciones botonBorrar" id="botonBorrarEntrada${id}" onclick="borrarEntrada(${id})"></i>
                  <div class="confirmaBorrar" id="confirmaBorrar${id}">
                    <i class="fa fa-ban botonOpciones botonCanc" id="botonBorrarEntrada${id}" onclick="borrarEntrada(${id})"></i>
                    <i class="fa fa-check-circle botonOpciones botonOk" id="botonEditarEntrada${id}" onclick="confirmaBorrarEntrada(${id},'e')"></i>
                    <span>${gi_confirma_eliminar}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="editorEntrada" id="editorEntrada${id}"></div>
          <div class="lineaRespuestas" id="lineaRespuestas_${id}"></div>
          <script type="text/javascript">cargaRespuestas(${id},'lista')</script>
        `;
        res.send(html);
      } catch (dbErr) {
        console.error('Error fetching consultation:', dbErr);
        res.status(500).send('Error loading consultation.');
      }
      break;
    }
    default:
      res.status(400).send('Operación no soportada');
  }
});

// General Mock for other PHP form POST requests (e.g. login, registration)
app.post('/*.php', (req, res) => {
  console.log(`[MOCK POST] [${req.site.toUpperCase()}] Received POST request on ${req.path}:`, req.body);
  res.send('success');
});

// Database-backed WordPress Page & Contact Form API
// 1. Get all pages
app.get('/api/pages', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, wp_id, title, slug, type FROM microarea_pages ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get single page by slug
app.get('/api/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await db.query(
      'SELECT * FROM microarea_pages WHERE slug = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching page ${req.params.slug}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Post contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await db.query(
      'INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );
    
    console.log(`Contact submission received from ${name} (${email})`);
    res.json({ success: true, message: 'Submission saved successfully' });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for local form submissions from Genessics
app.post('/api/submit-genesics-form', async (req, res) => {
  try {
    const { formId, pageTitle, fields } = req.body;
    console.log(`[GENESSICS FORM] Submission received for form ID: ${formId}`);

    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ error: 'Invalid or missing fields' });
    }

    // 1. Save submission to disk in C:/www/genessics/wp-content/submissions/
    const submissionsDir = 'C:/www/genessics/wp-content/submissions';
    if (!fs.existsSync(submissionsDir)) {
      fs.mkdirSync(submissionsDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `${formId || 'form'}_${timestamp}.json`;
    const filepath = path.join(submissionsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      formId,
      pageTitle,
      fields,
      submittedAt: new Date().toISOString()
    }, null, 2), 'utf8');

    console.log(`[GENESSICS FORM] Submission saved to: ${filepath}`);

    // 2. Determine user email for auto-responder (search keys for email/mail)
    let userEmail = '';
    for (const [key, value] of Object.entries(fields)) {
      if (key.toLowerCase().includes('email') || key.toLowerCase().includes('mail')) {
        if (value && typeof value === 'string' && value.includes('@')) {
          userEmail = value.trim();
          break;
        }
      }
    }

    // 3. Build HTML table for admin notification
    let fieldsHtml = '<table border="1" cellpadding="8" style="border-collapse: collapse; border: 1px solid #ddd; width: 100%;">';
    fieldsHtml += '<tr style="background-color:#f2f2f2; text-align: left;"><th>Campo / Field</th><th>Valor / Value</th></tr>';
    for (const [key, value] of Object.entries(fields)) {
      const displayVal = Array.isArray(value) ? value.join(', ') : value;
      fieldsHtml += `<tr><td><strong>${key}</strong></td><td>${displayVal || ''}</td></tr>`;
    }
    fieldsHtml += '</table>';

    // 4. Send email notification to admins
    const transporter = nodemailer.createTransport({
      host: 'smtp.serviciodecorreo.es',
      port: 587,
      secure: false,
      auth: {
        user: 'noreply@microarea-law.es',
        pass: 'AlexJimenez2007@'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const adminMailOptions = {
      from: '"GENESSICS Local Forms" <noreply@microarea-law.es>',
      to: ['info@microareanext.com', 'jose.jimenez@microareanext.com', 'jose.jimenez@microarea-law.es'],
      subject: `[GENESSICS] Nuevo Formulario Recibido: ${pageTitle || formId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #7abdae; border-bottom: 2px solid #7abdae; padding-bottom: 10px;">Nuevo Envío de Formulario</h2>
          <p><strong>Formulario:</strong> ${formId || 'N/A'}</p>
          <p><strong>Página:</strong> ${pageTitle || 'N/A'}</p>
          <p><strong>Fecha y Hora:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <h3>Datos Recibidos:</h3>
          ${fieldsHtml}
        </div>
      `
    };

    await transporter.sendMail(adminMailOptions);
    console.log(`[GENESSICS FORM] Email sent to admins.`);

    // 5. Send confirmation email to applicant if email was found
    if (userEmail) {
      let userName = '';
      for (const [key, value] of Object.entries(fields)) {
        const k = key.toLowerCase();
        if (k.includes('first name') || k.includes('nombre') || k.includes('second name') || k.includes('apellidos')) {
          userName = value;
          break;
        }
      }

      const clientMailOptions = {
        from: '"GENESSICS" <noreply@microarea-law.es>',
        to: userEmail,
        subject: 'We have received your form / Hemos recibido tu formulario',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #7abdae;">Thank you / Gracias</h2>
            <p>Hello ${userName || ''},</p>
            <p>We have successfully received your form submission (<strong>${pageTitle || 'Application'}</strong>) and we will get back to you shortly.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p>Hola ${userName || ''},</p>
            <p>Hemos recibido correctamente tu formulario (<strong>${pageTitle || 'Solicitud'}</strong>) y nos pondremos en contacto contigo a la brevedad.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #888;">
              Best regards / Atentamente,<br>
              <strong>GENESSICS | The Life Company</strong><br>
              Surrogacy and egg donation agency
            </p>
          </div>
        `
      };

      await transporter.sendMail(clientMailOptions);
      console.log(`[GENESSICS FORM] Confirmation email sent to applicant: ${userEmail}`);
    }

    res.json({ success: true, message: 'Submission saved and processed' });
  } catch (error) {
    console.error('[GENESSICS FORM] Error processing submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Multi-tenant Node.js server running on port ${port}`);
});
