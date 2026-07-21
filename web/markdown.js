(() => {
  const ALLOWED_TAGS = [
    'p', 'br',
    'strong', 'em', 'del', 's',
    'ul', 'ol', 'li',
    'blockquote',
    'code', 'pre',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a'
  ];

  const ALLOWED_ATTR = [
    'href', 'target', 'rel',
    'class', 'data-language',
    'aria-label'
  ];

  const SAFE_PROTOCOLS = new Set(['https:', 'http:', 'mailto:']);

  let parseInstance = null;

  function getParser() {
    if (!parseInstance) {
      parseInstance = window.markdownit({
        html: false,
        linkify: true,
        breaks: true,
        typographer: false
      });

      parseInstance.renderer.rules.image = (tokens, index) => {
        const token = tokens[index];
        const alt = (token.content || '').trim() || 'Image';
        const href = token.attrGet('src') || '';

        return href
          ? `<a href="${parseInstance.utils.escapeHtml(href)}">Image: ${parseInstance.utils.escapeHtml(alt)}</a>`
          : `<span>Image: ${parseInstance.utils.escapeHtml(alt)}</span>`;
      };
    }
    return parseInstance;
  }

  function sanitizeHtml(html) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: true,
      FORBID_TAGS: [
        'script', 'style', 'iframe', 'object', 'embed',
        'form', 'input', 'textarea', 'select',
        'svg', 'math', 'img', 'video', 'audio'
      ],
      FORBID_ATTR: [
        'style', 'src', 'srcset',
        'onerror', 'onload', 'onclick',
        'onfocus', 'onblur', 'onchange', 'oninput',
        'onsubmit', 'onreset', 'onselect',
        'onkeydown', 'onkeypress', 'onkeyup',
        'onmouseover', 'onmouseout', 'onmousedown', 'onmouseup',
        'ondblclick', 'oncontextmenu'
      ]
    });
  }

  function hardenLinks(container) {
    const anchors = container.querySelectorAll('a[href]');
    anchors.forEach((anchor) => {
      const raw = anchor.getAttribute('href');
      if (!raw) return;

      let parsed;
      try {
        parsed = new URL(raw, window.location.origin);
      } catch (_) {
        anchor.removeAttribute('href');
        return;
      }

      if (!SAFE_PROTOCOLS.has(parsed.protocol)) {
        anchor.removeAttribute('href');
      } else if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noopener noreferrer nofollow ugc');
      }
    });
  }

  function enhanceCodeBlocks(container) {
    const pres = container.querySelectorAll('pre');
    pres.forEach((pre) => {
      if (pre.closest('.markdown-code-shell')) return;

      const code = pre.querySelector('code');
      const lang = code?.className?.match(/language-(\S+)/)?.[1] || '';

      const shell = document.createElement('div');
      shell.className = 'markdown-code-shell';

      const header = document.createElement('div');
      header.className = 'markdown-code-header';

      const langLabel = document.createElement('span');
      langLabel.textContent = lang || 'code';

      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.className = 'markdown-copy-button';
      const label = lang ? `Copy ${lang} code` : 'Copy code';
      copyButton.setAttribute('aria-label', label);
      copyButton.textContent = 'Copy';

      copyButton.addEventListener('click', async () => {
        const text = code?.textContent || '';

        try {
          if (navigator.clipboard?.writeText && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
          } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }

          copyButton.textContent = 'Copied';
        } catch (_) {
          copyButton.textContent = 'Copy failed';
        }

        window.setTimeout(() => {
          copyButton.textContent = 'Copy';
        }, 2000);
      });

      header.append(langLabel, copyButton);
      shell.append(header);

      if (lang) {
        code.setAttribute('data-language', lang);
      }

      pre.parentNode.insertBefore(shell, pre);
      shell.append(pre);
    });
  }

  function wrapTables(container) {
    const tables = container.querySelectorAll('table');
    tables.forEach((table) => {
      if (table.closest('.markdown-table-scroll')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'markdown-table-scroll';
      wrapper.setAttribute('tabindex', '0');

      table.parentNode.insertBefore(wrapper, table);
      wrapper.append(table);
    });
  }

  function render(source) {
    if (!source || typeof source !== 'string') return '';
    const parser = getParser();
    const rawHtml = parser.render(source);
    const cleanHtml = sanitizeHtml(rawHtml);
    return cleanHtml;
  }

  function renderInto(container, source) {
    const html = render(source);
    container.innerHTML = '';

    const fragment = document.createDocumentFragment();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    while (wrapper.firstChild) {
      fragment.append(wrapper.firstChild);
    }

    hardenLinks(fragment);
    enhanceCodeBlocks(fragment);
    wrapTables(fragment);

    container.append(fragment);
  }

  function extractPreviewText(container) {
    const blockSelector = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,tr';
    const blocks = container.querySelectorAll(blockSelector);

    if (!blocks.length) return container.textContent || '';

    return [...blocks]
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .join(' ');
  }

  function previewText(source) {
    if (!source || typeof source !== 'string') return '';

    const container = document.createElement('div');
    const html = render(source);
    container.innerHTML = html;
    hardenLinks(container);

    return extractPreviewText(container);
  }

  window.HacoMarkdown = { renderInto, previewText };
})();
