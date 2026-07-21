import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(__dirname, '..', 'web');

function loadJs(filePath) {
  return readFileSync(resolve(webDir, filePath), 'utf8');
}

function createDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'https://haco.local',
    runScripts: 'dangerously',
    resources: 'usable',
  });
  return dom;
}

function setupMarkdown() {
  const dom = createDom();

  dom.window.eval(loadJs('vendor/markdown-it.min.js'));
  dom.window.eval(loadJs('vendor/dompurify.min.js'));
  dom.window.eval(loadJs('markdown.js'));

  return dom.window;
}

const ALL_FORBIDDEN_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed',
  'form', 'input', 'textarea', 'select',
  'svg', 'math', 'img', 'video', 'audio'
];

// ── Rendering tests ──────────────────────────────────────────

describe('HacoMarkdown.renderInto', () => {
  it('renders paragraphs', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, 'Hello world');
    assert.ok(el.querySelector('p'));
    assert.match(el.textContent || '', /Hello world/);
  });

  it('renders bold', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '**bold**');
    const strong = el.querySelector('strong');
    assert.ok(strong);
    assert.match(strong.textContent || '', /bold/);
  });

  it('renders italic', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '*italic*');
    const em = el.querySelector('em');
    assert.ok(em);
    assert.match(em.textContent || '', /italic/);
  });

  it('renders strikethrough', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '~~strike~~');
    const s = el.querySelector('s');
    assert.ok(s);
    assert.match(s.textContent || '', /strike/);
  });

  it('renders headings', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '# H1\n## H2\n### H3');
    assert.ok(el.querySelector('h1'));
    assert.ok(el.querySelector('h2'));
    assert.ok(el.querySelector('h3'));
    assert.match(el.querySelector('h1').textContent || '', /H1/);
  });

  it('renders ordered lists', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '1. First\n2. Second');
    const ol = el.querySelector('ol');
    assert.ok(ol);
    const items = ol.querySelectorAll('li');
    assert.equal(items.length, 2);
  });

  it('renders unordered lists', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '- One\n- Two');
    const ul = el.querySelector('ul');
    assert.ok(ul);
    assert.equal(ul.querySelectorAll('li').length, 2);
  });

  it('renders nested lists', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '- Outer\n  - Inner');
    const outerUl = el.querySelector('ul');
    assert.ok(outerUl);
    const innerUl = outerUl.querySelector('li ul');
    assert.ok(innerUl);
  });

  it('renders blockquotes', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '> quoted text');
    const blockquote = el.querySelector('blockquote');
    assert.ok(blockquote);
    assert.match(blockquote.textContent || '', /quoted text/);
  });

  it('renders inline code', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, 'use `code` here');
    const code = el.querySelector('code');
    assert.ok(code);
    assert.match(code.textContent || '', /code/);
  });

  it('renders fenced code blocks', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '```\nconst x = 1;\n```');
    const pre = el.querySelector('pre');
    assert.ok(pre);
    const code = pre.querySelector('code');
    assert.ok(code);
  });

  it('renders fenced code with language', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '```javascript\nconst x = 1;\n```');
    const code = el.querySelector('pre code[data-language]');
    assert.ok(code);
    assert.equal(code.getAttribute('data-language'), 'javascript');
  });

  it('renders links with safe attributes', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '[Example](https://example.com)');
    const a = el.querySelector('a');
    assert.ok(a);
    assert.equal(a.getAttribute('href'), 'https://example.com');
    assert.equal(a.getAttribute('target'), '_blank');
    assert.match(a.getAttribute('rel') || '', /noopener/);
  });

  it('renders autolinks', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, 'Visit https://example.com');
    const a = el.querySelector('a');
    assert.ok(a);
    assert.equal(a.getAttribute('href'), 'https://example.com');
  });

  it('renders tables', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '| A | B |\n| --- | --- |\n| 1 | 2 |');
    const table = el.querySelector('table');
    assert.ok(table);
    const cells = table.querySelectorAll('td');
    assert.equal(cells.length, 2);
  });

  it('handles empty body', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '');
    assert.equal(el.innerHTML.trim(), '');
  });

  it('handles very long unbroken strings safely', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    const long = 'a'.repeat(10000);
    win.HacoMarkdown.renderInto(el, long);
    assert.ok(el.textContent.length > 0);
  });

  it('handles unicode and emoji', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, 'Hello 世界 🎉 café');
    assert.match(el.textContent || '', /🎉/);
  });

  it('does not interpret inline HTML', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<strong>should be text</strong>');
    assert.ok(!el.querySelector('strong'));
  });

  it('converts markdown images to safe text links', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '![Architecture](https://example.com/diagram.png)');
    assert.ok(!el.querySelector('img'), 'no img element');
    const a = el.querySelector('a');
    assert.ok(a, 'image becomes a link');
    assert.match(a.textContent || '', /Architecture/);
  });

  it('preserves image alt text when image link is removed', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '![alt text](javascript:alert(1))');
    assert.match(el.textContent || '', /alt text/, 'alt text preserved');
    assert.ok(!el.querySelector('img'), 'no img element');
  });
});

// ── Security tests ───────────────────────────────────────────

describe('HacoMarkdown security', () => {
  it('strips script tags', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<script>alert(1)</script>');
    assert.ok(!el.querySelector('script'));
  });

  it('strips img tags', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<img src=x onerror=alert(1)>');
    assert.ok(!el.querySelector('img'));
  });

  it('strips SVG', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<svg onload=alert(1)></svg>');
    assert.ok(!el.querySelector('svg'));
  });

  it('strips iframes', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<iframe srcdoc="<script>alert(1)</script>"></iframe>');
    assert.ok(!el.querySelector('iframe'));
  });

  it('removes javascript: links', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '[Click](javascript:alert(1))');
    const a = el.querySelector('a');
    if (a) assert.ok(!a.getAttribute('href'));
    assert.match(el.textContent || '', /Click/);
  });

  it('removes data: URL links', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '[Click](data:text/html,<script>alert(1)</script>)');
    const a = el.querySelector('a');
    if (a) assert.ok(!a.getAttribute('href'));
  });

  it('removes file: URL links', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '[Click](file:///etc/passwd)');
    const a = el.querySelector('a');
    if (a) assert.ok(!a.getAttribute('href'));
  });

  it('removes vbscript: links', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '[Click](vbscript:msgbox(1))');
    const a = el.querySelector('a');
    if (a) assert.ok(!a.getAttribute('href'));
  });

  it('has no event-handler attributes', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<p onclick="alert(1)">text</p>');
    const all = el.querySelectorAll('*');
    for (const node of all) {
      for (const attr of node.attributes) {
        assert.ok(!attr.name.startsWith('on'), `found event handler: ${attr.name}`);
      }
    }
  });

  it('has no style attribute', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<p style="color:red">text</p>');
    const all = el.querySelectorAll('*');
    for (const node of all) {
      assert.ok(!node.hasAttribute('style'), 'found style attribute');
    }
  });

  it('strips forbidden tags', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    const input = ALL_FORBIDDEN_TAGS.map(t => `<${t}>test</${t}>`).join('\n');
    win.HacoMarkdown.renderInto(el, input);
    for (const tag of ALL_FORBIDDEN_TAGS) {
      assert.ok(!el.querySelector(tag), `found forbidden tag: ${tag}`);
    }
  });

  it('sanitizes before reaching DOM', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    const malicious = '![img](https://evil.com/track.png)';
    win.HacoMarkdown.renderInto(el, malicious);
    assert.ok(!el.querySelector('img'), 'markdown image should not render as img');
  });

  it('strips interactive tags from rendered output', () => {
    const win = setupMarkdown();
    const el = win.document.createElement('div');
    win.HacoMarkdown.renderInto(el, '<div>test</div><span>inline</span><button>click</button>');
    assert.ok(!el.querySelector('div'), 'div stripped');
    assert.ok(!el.querySelector('span'), 'span stripped');
    assert.ok(!el.querySelector('button'), 'button stripped');
  });
});

// ── previewText tests ────────────────────────────────────────

describe('HacoMarkdown.previewText', () => {
  it('strips markdown formatting', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('**bold** and *italic*');
    assert.ok(!text.includes('**'));
    assert.ok(!text.includes('*'));
    assert.match(text, /bold/);
    assert.match(text, /italic/);
  });

  it('strips HTML from preview', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('<script>alert(1)</script>hello');
    assert.match(text, /hello/);
    assert.ok(text.trim().length > 0);
  });

  it('returns empty for empty input', () => {
    const win = setupMarkdown();
    assert.equal(win.HacoMarkdown.previewText(''), '');
    assert.equal(win.HacoMarkdown.previewText(null), '');
    assert.equal(win.HacoMarkdown.previewText(undefined), '');
  });

  it('separates block elements with spaces', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('# Deploy\n- Build\n- Test\n- Release');
    assert.ok(text.includes(' ') || text.includes('Deploy Build') || text.includes('Build Test') || text.includes('Test Release'),
      'block elements should have separators');
  });

  it('preserves heading text in preview', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('## Investigation complete');
    assert.match(text, /Investigation complete/);
    assert.ok(!text.includes('##'), 'heading markers stripped');
  });

  it('handles blockquotes in preview', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('> important note');
    assert.match(text, /important note/);
    assert.ok(!text.includes('>'), 'blockquote marker stripped');
  });

  it('handles code blocks in preview', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('```\nconst x = 1;\n```');
    assert.match(text, /const x = 1/);
    assert.ok(!text.includes('```'), 'fence stripped');
  });

  it('handles tables in preview', () => {
    const win = setupMarkdown();
    const text = win.HacoMarkdown.previewText('| Name | Status |\n| --- | --- |\n| API | Ready |');
    assert.match(text, /Name/);
    assert.match(text, /Status/);
    assert.match(text, /API/);
    assert.match(text, /Ready/);
    assert.ok(!text.includes('|'), 'table pipes stripped');
  });
});
