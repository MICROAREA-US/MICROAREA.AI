const fs = require('fs');
const path = require('path');

const baseDir = 'C:/www';
const localesDir = 'C:/www/modern-suite/locales';

// Pricing and other global variables
const getGlobals = (lang, desde = '') => ({
  desde: desde,
  idioma: lang,
  divisa: '€',
  telefono: '+34 963 387 920',
  mailContacto: 'info@microareanext.com',
  webMicroarea: 'microarea.ai',
  linkMicroarea: 'http://localhost:8000',
  
  // Pricing variables
  'precio[1]': '216',
  'precio_M[1]': '20',
  'precio_A[1]': '216',
  'precio_desc_A[1]': '10',
  
  'precio[2]': '600',
  'precio_M[2]': '600',
  'precio_A[2]': '600',
  'precio_desc_A[2]': '10',
  
  'precio[3]': '1000',
  'precio_M[3]': '1000',
  'precio_A[3]': '1000',
  'precio_desc_A[3]': '10',
  
  'precio[4]': '2500',
});

function loadTranslations(product, lang) {
  try {
    const jsonPath = path.join(localesDir, product, `${lang}.json`);
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading translations for ${product} (${lang}):`, err);
  }
  return {};
}

function cleanIncludePath(includePath) {
  let cleanPath = includePath.trim();
  // Remove PHP concatenation syntax with $desde
  cleanPath = cleanPath.replace(/['"]\s*\.\s*\$desde\s*\.\s*['"]/g, ''); // Handles ''.$desde.'
  cleanPath = cleanPath.replace(/\$desde\s*\.\s*['"]/g, ''); // Handles $desde.'
  cleanPath = cleanPath.replace(/['"]\s*\.\s*\$desde/g, ''); // Handles '.\$desde
  cleanPath = cleanPath.replace(/\$desde/g, '');
  cleanPath = cleanPath.replace(/^['"]|['"]$/g, ''); // Strip outer quotes
  return cleanPath.trim();
}

function resolveInclude(currentFilePath, includePath, productDir) {
  const cleanPath = cleanIncludePath(includePath);
  if (!cleanPath) return '';

  let resolvedPath = '';
  // Try relative to current file
  const currentDir = path.dirname(currentFilePath);
  const tryRelative = path.join(currentDir, cleanPath);
  
  if (fs.existsSync(tryRelative) && fs.statSync(tryRelative).isFile()) {
    resolvedPath = tryRelative;
  } else {
    // Try relative to product root
    const tryRoot = path.join(productDir, cleanPath);
    if (fs.existsSync(tryRoot) && fs.statSync(tryRoot).isFile()) {
      resolvedPath = tryRoot;
    } else {
      // Try inside bloques/
      const tryBloques = path.join(productDir, 'bloques', cleanPath);
      if (fs.existsSync(tryBloques) && fs.statSync(tryBloques).isFile()) {
        resolvedPath = tryBloques;
      }
    }
  }

  if (resolvedPath) {
    return fs.readFileSync(resolvedPath, 'utf8');
  }

  console.warn(`Could not resolve include: ${includePath} in ${currentFilePath}`);
  return `<!-- INCLUDE NOT FOUND: ${includePath} -->`;
}

function compileDeclaraciones(filePath, product, lang, productDir, options) {
  const appParam = (options.query && (options.query.APP || options.query.app || '')).toUpperCase().trim();
  const validApps = ['G4', 'MX', 'PH'];
  const app = validApps.includes(appParam) ? appParam : null;
  
  const mostrarLexNext = !app || app === 'G4';
  const mostrarMaGest = !app || app === 'MX';
  const mostrarPhoshability = !app || app === 'PH';
  
  const declarationsDir = path.join(productDir, 'files', 'declaraciones');
  let archivos_LexNext = [];
  let archivos_MaGest = [];
  let archivos_TPV = [];
  
  if (fs.existsSync(declarationsDir) && fs.statSync(declarationsDir).isDirectory()) {
    const files = fs.readdirSync(declarationsDir);
    for (const file of files) {
      const fullPath = path.join(declarationsDir, file);
      if (fs.statSync(fullPath).isFile() && /\.pdf$/i.test(file)) {
        if (/g4/i.test(file)) archivos_LexNext.push(file);
        if (/mx/i.test(file)) archivos_MaGest.push(file);
        if (/ph/i.test(file)) archivos_TPV.push(file);
      }
    }
    archivos_LexNext.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    archivos_MaGest.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    archivos_TPV.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }
  
  function renderList(archivos, key) {
    if (archivos.length > 0) {
      let list = `<ul class="pdf-list ${key}">`;
      for (const f of archivos) {
        const formatted = f.replace(/\.pdf$/i, '');
        list += `
          <li>
            <a href="http://localhost:8088/files/declaraciones/${f}" target="_blank">
              ${formatted}
            </a>
          </li>`;
      }
      list += '</ul>';
      return list;
    } else {
      const name = key === 'lexnext' ? 'LexNext' : (key === 'magest' ? 'MaGest' : 'Poshability');
      return `<p class="no-files">No se encontraron declaraciones responsables para ${name}.</p>`;
    }
  }

  const footerPath = path.join(productDir, 'incluir', 'pie.php');
  let footerHtml = '';
  if (fs.existsSync(footerPath)) {
    footerHtml = fs.readFileSync(footerPath, 'utf8');
  }
  
  const tarjetasVisibles = (mostrarMaGest ? 1 : 0) + (mostrarLexNext ? 1 : 0) + (mostrarPhoshability ? 1 : 0);
  const claseCards = tarjetasVisibles === 1 ? 'cards single' : 'cards';

  let outputHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Declaraciones responsables programas Microarea VERI*FACTU</title>
  <link rel="stylesheet" type="text/css" href="../../css/verifactu.css" />
  <link rel="shortcut icon" href="../../favicon.ico">
</head>
<body>
  <div class="container" role="main">

    <!-- Cabecera -->
    <header class="site-header" role="banner" aria-label="Cabecera del sitio">
      <div class="logo" aria-hidden="true">
        <a href="http://localhost:8000" target="_blank" rel="noopener noreferrer">
          <img src="/img/logo_microareaPQ.png?text=Logo" alt="Microarea" style="background-color:white; padding:10px; border-radius:8px;">
        </a>
      </div>
      <div class="title">
		<h1>Microarea</h1>
		<p>Relación de declaraciones responsables VERI*FACTU de nuestros programas</p>
      </div>
	    <div class="logo" aria-hidden="true">
        <a href="https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu.html" target="_blank" rel="noopener noreferrer">
          <img src="/img/Verifactu_gif_red.gif?text=Logo" alt="VERI*FACTU." style="background-color:white; padding:10px; border-radius:8px;">
        </a>
      </div>
    </header>

    <main class="site-main" role="main" aria-label="Contenido principal">
      <section class="${claseCards}" aria-label="Opciones y documentos">`;

  if (mostrarLexNext) {
    outputHtml += `
        <!-- Tarjeta LexNext -->
        <article class="card" role="article" aria-labelledby="card2-title">
		  <div>
			<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:nowrap;">
			  <a href="/verifactu/declaraciones/?APP=G4" rel="noopener noreferrer" style="text-decoration:none; color:inherit; flex:1;">
				<h3 id="card2-title"><span class="badge badge-lexnext">LexNext</span></h3>
			  </a>
			  ${app ? `
				<a href="/verifactu/declaraciones/" rel="noopener noreferrer"
				   class="btn secondary"
				   style="font-size:0.85rem; flex-shrink:0; white-space:nowrap;">Todos los programas</a>
			  ` : ''}
			</div>
            <p>Relación de declaraciones responsables para el programa LexNext.</p>
            ${renderList(archivos_LexNext, 'lexnext')}
          </div>
        </article>`;
  }

  if (mostrarMaGest) {
    outputHtml += `
        <!-- Tarjeta MaGest -->
        <article class="card" role="article" aria-labelledby="card1-title">
          <div>
		  	<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:nowrap;">
				<a href="/verifactu/declaraciones/?APP=MX" rel="noopener noreferrer">            
				<h3 id="card1-title"><span class="badge badge-magest">MaGest</span></h3>
				</a>
				${app ? `
					<a href="/verifactu/declaraciones/" rel="noopener noreferrer"
					   class="btn secondary"
					   style="font-size:0.85rem; flex-shrink:0; white-space:nowrap;">Todos los programas</a>
				` : ''}
			</div>
            <p>Relación de declaraciones responsables para el programa MaGest.</p>
            ${renderList(archivos_MaGest, 'magest')}
          </div>
        </article>`;
  }

  if (mostrarPhoshability) {
    outputHtml += `
        <!-- Tarjeta Poshability -->
        <article class="card" role="article" aria-labelledby="card3-title">
          <div>
			<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:nowrap;">
				<a href="/verifactu/declaraciones/?APP=PH" rel="noopener noreferrer">
				<h3 id="card3-title"><span class="badge badge-phoshability">Poshability</span></h3>
				</a>
				${app ? `
					<a href="/verifactu/declaraciones/" rel="noopener noreferrer"
					   class="btn secondary"
					   style="font-size:0.85rem; flex-shrink:0; white-space:nowrap;">Todos los programas</a>
				` : ''}
			</div>
			<p>Relación de declaraciones responsables para el programa Poshability.</p>
            ${renderList(archivos_TPV, 'phoshability')}
          </div>
        </article>`;
  }

  outputHtml += `
      </section>
    </main>

    ${footerHtml}

  </div>
</body>
</html>`;

  return outputHtml;
}

function compileFile(filePath, product, lang, productDir, entryDesde = '', processedFiles = new Set(), options = {}) {
  if (processedFiles.has(filePath)) {
    return '<!-- Circular Include Detected -->';
  }
  processedFiles.add(filePath);

  if (filePath.endsWith('declaraciones/index.php') || filePath.endsWith('declaraciones\\index.php')) {
    return compileDeclaraciones(filePath, product, lang, productDir, options);
  }

  if (filePath.endsWith('item.lang.php')) {
    const idiomasdisp = [
      { loc: 'es', img: 'es', txt: 'ES' },
      { loc: 'en', img: 'us', txt: 'EN' },
      { loc: 'it', img: 'it', txt: 'IT' },
      { loc: 'fr', img: 'fr', txt: 'FR' },
      { loc: 'de', img: 'de', txt: 'DE' },
      { loc: 'ca', img: 'es-ct', txt: 'CA' },
      { loc: 'bg', img: 'bg', txt: 'BG' },
      { loc: 'pt', img: 'pt', txt: 'PT' },
      { loc: 'tr', img: 'tr', txt: 'TR' },
      { loc: 'pl', img: 'pl', txt: 'PL' }
    ];
    const selected = idiomasdisp.find(i => i.loc === lang) || idiomasdisp[0];
    const listHTML = idiomasdisp.filter(i => i.loc !== lang).map(i => `
      <a class="dropdown-item" href="#" onclick="changeLang('${i.loc}')" style="font-size: 13px">
        <i class="fi fi-${i.img} mr-2"></i>${i.txt}
      </a>
    `).join('\n');
    
    return `
<style>
	.popidioma.btn.dropdown-toggle::after {
		display: none;
	}
	.menuidioma.dropdown-menu {
		min-width: 90px;
	}	
	.noborder:focus {
		border: none;
		outline: none;
	}
	.noborder:hover {
		cursor: pointer;
	}
</style>
<script>
function changeLang(lang) {	
	let splitHref = (href, n) => {
		let hrefclaro;
		if (href.includes("#")) {
			hrefclaro = href.split(\`#\`);
			return hrefclaro[n];
		} else if (href.includes("?") ) {
			hrefclaro = href.split(\`?\`);
			return hrefclaro[n];
		} else {
			return href;
		}
	}
	location.href = splitHref(window.location.href, 0) + "?idioma=" + lang.trim();
}
document.addEventListener('DOMContentLoaded', function() {
	var dropdownToggles = document.querySelectorAll('.popidioma.dropdown-toggle');
	dropdownToggles.forEach(function(dropdownToggle) {
		dropdownToggle.addEventListener('click', function() {
			if (this.nextElementSibling.classList.contains('show')) {
				this.nextElementSibling.classList.remove('show');
			} else {
				var dropdowns = document.querySelectorAll('.dropdown-menu.show');
				dropdowns.forEach(function(dropdown) {
					dropdown.classList.remove('show');
				});
				this.nextElementSibling.classList.add('show');
			}
		});
	});
});
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/css/flag-icons.min.css"/>
<div class="dropdown dropidioma">
	<div class="btn bg-white btn-lg dropdown-toggle popidioma" type="button" data-toggle="dropdown" style="margin-top: 4px">
		<i class="fi fi-${selected.img}"></i>
	</div>
	<div class="dropdown-menu dropdown-menu-right menuidioma" style="border-radius: 10px; width: 10px;">
		${listHTML}
	</div>
</div>
    `;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const translations = loadTranslations(product, lang);
  const globals = {
    ...getGlobals(lang, entryDesde),
    ...options
  };

  // 1. Resolve includes recursively
  // Matches: any PHP block containing an include/require statement
  const includeRegex = /<\?php(?:(?!<\?php|\?>)[\s\S])*?(?:include_once|include|require_once|require)\s*\(?\s*([^;?\n)]+)\s*\)?\s*;?(?:(?!<\?php|\?>)[\s\S])*?\?>/g;
  html = html.replace(includeRegex, (match, includePath) => {
    const includeContent = resolveInclude(filePath, includePath, productDir);
    const cleanPath = cleanIncludePath(includePath);
    let currentDir = path.dirname(filePath);
    let resolvedIncludePath = path.join(currentDir, cleanPath);
    if (!fs.existsSync(resolvedIncludePath)) {
      resolvedIncludePath = path.join(productDir, cleanPath);
      if (!fs.existsSync(resolvedIncludePath)) {
        resolvedIncludePath = path.join(productDir, 'bloques', cleanPath);
      }
    }
    
    if (fs.existsSync(resolvedIncludePath)) {
      return compileFile(resolvedIncludePath, product, lang, productDir, entryDesde, new Set(processedFiles), options);
    }
    return includeContent;
  });

  // 2. Remove PHP tags that only set variables (e.g. <?php $desde=''; $actual='home'; ?>)
  html = html.replace(/<\?php\s*\$[a-zA-Z0-9_]+\s*=\s*.*?\s*;\s*\?>/g, '');

  // 3. Replace str_replace PHP blocks:
  // e.g. <?php echo str_replace('<li>','<li> ', gi_tarifa_2_resumen); ?>
  // e.g. <?php echo str_replace('<li>','<li>', gi_tarifa_3_resumen); ?>
  const strReplaceRegex = /<\?php\s+echo\s+str_replace\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3\s*,\s*(\w+)\s*\);\s*\?>/g;
  html = html.replace(strReplaceRegex, (match, q1, search, q2, replace, key) => {
    const baseText = translations[key] || '';
    return baseText.replace(new RegExp(search, 'g'), replace);
  });

  // 4. Replace concatenated prices:
  // e.g. <?php echo gi_tarifa_2_precio_mes.''.$divisa; ?>
  const priceConcatRegex = /<\?php\s+echo\s+(\w+)\s*\.\s*['"]*['"]*\s*\.\s*\$divisa;\s*\?>/g;
  html = html.replace(priceConcatRegex, (match, key) => {
    const baseText = translations[key] || globals[key] || '';
    return baseText + globals.divisa;
  });

  // 5. Replace simple echo tags:
  // e.g. <?php echo gi_lexnext; ?> or <?php echo $idioma; ?>
  const echoRegex = /<\?php\s+echo\s+([\s\S]+?);?\s*\?>/g;
  html = html.replace(echoRegex, (match, expr) => {
    expr = expr.trim().replace(/;$/, '').trim();
    // Check if it matches an i18n translation key
    if (translations[expr] !== undefined) {
      return translations[expr];
    }
    // Check if it matches a global variable (like $idioma or $desde)
    const cleanExpr = expr.replace(/^\$/, ''); // Remove leading $
    if (globals[cleanExpr] !== undefined) {
      return globals[cleanExpr];
    }
    return '';
  });

  // Handle session-conditional blocks
  const isLoggedIn = !!options.sessionUser;
  html = html.replace(/<\?php\s+if\s*\(\s*!isset\(\$_SESSION\['usuario_comunidad'\]\)\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*else\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*\?>/g, isLoggedIn ? '$2' : '$1');
  html = html.replace(/<\?php\s+if\s*\(\s*isset\(\$_SESSION\['usuario_comunidad'\]\)\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*else\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*\?>/g, isLoggedIn ? '$1' : '$2');
  html = html.replace(/<\?php\s+if\s*\(\s*isset\(\$_SESSION\['usuario_comunidad'\]\)\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*\?>/g, isLoggedIn ? '$1' : '');
  html = html.replace(/<\?php\s+if\s*\(\s*!isset\(\$_SESSION\['usuario_comunidad'\]\)\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*\?>/g, isLoggedIn ? '' : '$1');

  if (isLoggedIn) {
    const fullName = `${options.sessionUser.nombre} ${options.sessionUser.apellidos || ''}`.trim();
    html = html.replace(/<\?php\s+echo\s+nombreUsuarioConectado\s*\(\s*\$conexion\s*,\s*\$_SESSION\['usuario_comunidad'\]\s*\)\s*;?\s*\?>/g, fullName);
  } else {
    html = html.replace(/<\?php\s+echo\s+nombreUsuarioConectado\s*\(\s*\$conexion\s*,\s*\$_SESSION\['usuario_comunidad'\]\s*\)\s*;?\s*\?>/g, '');
  }

  // Handle activation and password recovery verification parameters (ccr and crp)
  const crpMatch = html.match(/<\?php\s+if\s*\(\s*!empty\(\$_GET\['crp'\]\)\s*\)\s*\{[\s\S]*?\}\s*\?>/);
  if (crpMatch) {
    if (options.crpStatus && options.crpToken) {
      const scriptCode = options.crpStatus === 'ok'
        ? `<script type="text/javascript">cargaFormularioPassword('${options.crpToken}');</script>`
        : `<script type="text/javascript">cargaFormularioPassword('ko');</script>`;
      html = html.replace(crpMatch[0], scriptCode);
    } else {
      html = html.replace(crpMatch[0], '');
    }
  }

  const ccrMatch = html.match(/<\?php\s+if\s*\(\s*!empty\(\$_GET\['ccr'\]\)\s*\)\s*\{[\s\S]*?\}\s*\?>/);
  if (ccrMatch) {
    if (options.ccrStatus && options.ccrToken) {
      const scriptCode = options.ccrStatus === 'ok'
        ? `<script type="text/javascript">cargaConfirmacionRegistro('${options.ccrToken}');</script>`
        : `<script type="text/javascript">cargaConfirmacionRegistro('ko');</script>`;
      html = html.replace(ccrMatch[0], scriptCode);
    } else {
      html = html.replace(ccrMatch[0], '');
    }
  }

  // Handle $pedido conditional blocks (default loading state)
  html = html.replace(/<\?php\s+if\s*\(\s*isset\(\$pedido\)\s*&&\s*\$pedido\s*==\s*['"]ok['"]\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*else\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*\?>/g, '$2');
  html = html.replace(/<\?php\s+if\s*\(\s*isset\(\$pedido\)\s*&&\s*\$pedido\s*==\s*['"]ok['"]\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*else\s+if\s*\(\s*isset\(\$pedido\)\s*&&\s*\$pedido\s*==\s*['"]ko['"]\s*\)\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*else\s*\{\s*\?>([\s\S]*?)<\?php\s*\}\s*\?>/g, '$3');

  // 6. Remove remaining general PHP tags to avoid leakage
  html = html.replace(/<\?php[\s\S]*?\?>/g, '');

  return html;
}

function rewriteUrls(html, requestHost) {
  if (!requestHost) return html;
  
  const hostPart = requestHost.split(':')[0];
  const isLocal = hostPart === 'localhost' || 
                  hostPart === '127.0.0.1' || 
                  hostPart.startsWith('192.168.') || 
                  hostPart.startsWith('10.') || 
                  /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostPart) ||
                  hostPart.endsWith('.local');
                  
  const portsMap = {
    '8081': 'winlab',
    '8082': 'eoswin',
    '8083': 'maconta',
    '8084': 'magest',
    '8085': 'lexnext',
    '8086': 'poshability',
    '8087': 'cloud',
    '8088': 'manuales'
  };

  // 1. Replace http://localhost:808X
  html = html.replace(/http:\/\/localhost:(808[1-8])([^"'\s]*)/g, (match, port, path) => {
    if (isLocal) {
      return `http://${hostPart}:${port}${path}`;
    } else {
      const sub = portsMap[port];
      return `https://${sub}.microarea.ai${path}`;
    }
  });

  // 2. Replace http://localhost:8000
  html = html.replace(/http:\/\/localhost:8000([^"'\s]*)/g, (match, path) => {
    if (isLocal) {
      return `http://${hostPart}${path}`;
    } else {
      return `https://microarea.ai${path}`;
    }
  });

  return html;
}

module.exports = {
  compile: (product, lang, relFilePath, options = {}) => {
    const productDir = path.join(baseDir, `${product}.microarea.es`);
    const targetPath = path.join(productDir, relFilePath || 'index.php');
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found: ${targetPath}`);
    }
    const cleanRelPath = relFilePath ? relFilePath.replace(/\\/g, '/') : 'index.php';
    const depth = cleanRelPath.split('/').length - 1;
    const desde = depth > 0 ? '../'.repeat(depth) : '';
    let html = compileFile(targetPath, product, lang, productDir, desde, new Set(), options);
    
    // Rewrite URLs dynamically based on options.host
    html = rewriteUrls(html, options.host);
    
    return html;
  }
};
