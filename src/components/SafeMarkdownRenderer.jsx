import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Copy, Check, ExternalLink, Maximize2, X } from 'lucide-react';
import './SafeMarkdownRenderer.css';

// Configure marked renderer for clean output
const renderer = new marked.Renderer();

// Custom link renderer: ensure target="_blank" and rel="noopener noreferrer"
renderer.link = function ({ href, title, text }) {
  const isExternal = href.startsWith('http') || href.startsWith('//');
  return `<a href="${href}" ${title ? `title="${title}"` : ''} ${isExternal ? 'target="_blank" rel="noopener noreferrer"' : ''} class="markdown-link">${text}</a>`;
};

// Custom image renderer: lazy loaded and styled
renderer.image = function ({ href, title, text }) {
  // Normalize relative image paths to public /patterns/images/
  let cleanHref = href;
  if (cleanHref.startsWith('./images/')) {
    cleanHref = cleanHref.replace('./images/', '/patterns/images/');
  } else if (cleanHref.startsWith('images/')) {
    cleanHref = cleanHref.replace('images/', '/patterns/images/');
  }

  return `<figure class="markdown-image-wrapper">
    <img src="${cleanHref}" alt="${text || 'Pattern Diagram'}" title="${title || text || ''}" loading="lazy" class="markdown-image" data-zoomable="true" />
    ${text ? `<figcaption class="markdown-image-caption">${text}</figcaption>` : ''}
  </figure>`;
};

// Custom table renderer for responsiveness
renderer.table = function ({ header, rows }) {
  return `<div class="markdown-table-wrapper">
    <table class="markdown-table">
      <thead>${header}</thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: true,
  pedantic: false
});

const SafeMarkdownRenderer = ({ content = '', className = '' }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  // Parse and sanitize markdown safely
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';

    // Normalize any image references first
    const normalizedContent = content
      .replace(/!\[(.*?)\]\(\.?\/?images\/(.*?)\)/g, '![$1](/patterns/images/$2)')
      .replace(/<img(.*?)src=["']\.?\/?images\/(.*?)["'](.*?)>/g, '<img$1src="/patterns/images/$2"$3>');

    const rawHtml = marked.parse(normalizedContent);

    // Sanitize with strict DOMPurify rules (no scripts, no iframes, no eval/object)
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div', 'hr', 'br',
        'strong', 'b', 'em', 'i', 's', 'del', 'u', 'sub', 'sup',
        'pre', 'code', 'blockquote',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'a', 'img', 'figure', 'figcaption'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'class', 'src', 'alt',
        'loading', 'width', 'height', 'data-zoomable'
      ],
      ADD_ATTR: ['target', 'rel']
    });
  }, [content]);

  // Handle image clicks for zoom modal
  const handleContainerClick = (e) => {
    const target = e.target;
    if (target.tagName === 'IMG' && target.classList.contains('markdown-image')) {
      setModalImage({
        src: target.src,
        alt: target.alt || 'Enlarged diagram'
      });
    }

    // Handle code block copy button if clicked
    const copyBtn = target.closest('.markdown-copy-btn');
    if (copyBtn) {
      const pre = copyBtn.closest('.markdown-code-container')?.querySelector('pre');
      if (pre) {
        const textToCopy = pre.innerText.replace(/Copy|Copied!/g, '').trim();
        navigator.clipboard.writeText(textToCopy);
        const idx = copyBtn.getAttribute('data-code-idx');
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
    }
  };

  return (
    <div className={`safe-markdown-container ${className}`} onClick={handleContainerClick}>
      <div
        className="safe-markdown-body"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />

      {/* Lightbox Modal for Diagrams */}
      {modalImage && (
        <div className="diagram-lightbox-overlay" onClick={() => setModalImage(null)}>
          <div className="diagram-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="diagram-lightbox-close"
              onClick={() => setModalImage(null)}
              aria-label="Close image zoom"
            >
              <X size={20} />
            </button>
            <img src={modalImage.src} alt={modalImage.alt} className="diagram-lightbox-img" />
            {modalImage.alt && (
              <p className="diagram-lightbox-caption">{modalImage.alt}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeMarkdownRenderer;
