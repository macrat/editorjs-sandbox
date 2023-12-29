import mermaid from 'mermaid';
import { IconStretch, IconCollapse } from '@codexteam/icons';

import './mermaid.css';


mermaid.initialize({
  startOnLoad: false,
});


type MermaidData = {
  mermaid: string;
};


export default class Mermaid {
  data: MermaidData;
  readonly: boolean;
  view: 'split' | 'code' | 'preview' = 'split';
  container: HTMLDivElement | null = null;

  constructor({ data, readonly }: { data: MermaidData, readonly: boolean }) {
    this.data = data;
    this.readonly = readonly;
  }

  static get toolbox() {
    return {
      title: 'Mermaid',
      icon: 'M',
    };
  }

  render() {
    const id = Math.random().toString(36).slice(2);

    const container = document.createElement('div');
    container.classList.add('mermaid');
    this.container = container;
    this.setView(this.view);

    const codeWrapper = document.createElement('div');
    codeWrapper.classList.add('mermaid-code');
    container.appendChild(codeWrapper);

    const code = document.createElement('div');
    code.innerHTML = this.data.mermaid ?? 'flowchart\n  A --> B';
    code.contentEditable = this.readonly ? 'false' : 'plaintext-only';
    code.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        document.execCommand('insertText', false, '  ');
      }
    });
    codeWrapper.appendChild(code);

    const codeButton = document.createElement('button');
    codeButton.classList.add('mermaid-code-button');
    codeButton.innerHTML = IconStretch;
    codeButton.addEventListener('click', () => {
      if (this.view === 'code') {
        this.setView('split');
        codeButton.innerHTML = IconStretch;
      } else {
        this.setView('code');
        codeButton.innerHTML = IconCollapse;
      }
    });
    codeWrapper.appendChild(codeButton);

    const preview = document.createElement('div');
    preview.classList.add('mermaid-preview');
    container.appendChild(preview);

    const previewButton = document.createElement('button');
    previewButton.classList.add('mermaid-preview-button');
    previewButton.innerHTML = IconStretch;
    previewButton.addEventListener('click', () => {
      if (this.view === 'preview') {
        this.setView('split');
        previewButton.innerHTML = IconStretch;
      } else {
        this.setView('preview');
        previewButton.innerHTML = IconCollapse;
      }
    });
    preview.appendChild(previewButton);

    const svgContainer = document.createElement('div');
    preview.appendChild(svgContainer);

    const error = document.createElement('div');
    error.classList.add('mermaid-error');
    error.style.display = 'none';
    container.appendChild(error);

    const updatePreview = () => {
      mermaid.render(`mermaid-preview-${id}`, code.innerText, svgContainer).then(({ svg, bindFunctions }) => {
        error.style.display = 'none';
        error.innerText = '';

        svgContainer.innerHTML = svg;
        bindFunctions?.(svgContainer);
      }).catch((err) => {
        error.innerText = err.message;
        error.style.display = 'block';
      });
    };
    updatePreview();
    code.addEventListener('input', updatePreview);

    return container;
  }

  setView(view: 'split' | 'code' | 'preview') {
    this.view = view;
    this.container?.classList?.remove?.('mermaid-split-mode', 'mermaid-code-mode', 'mermaid-preview-mode');
    this.container?.classList?.add?.(`mermaid-${view}-mode`);

    const code: HTMLDivElement | null | undefined = this.container?.querySelector('.mermaid-code > div');
    if (code) {
      code.contentEditable = view === 'preview' ? 'false' : 'plaintext-only';
    }

    if (view === 'code') {
      this.container?.querySelector?.('.mermaid-code-button')?.classList?.add?.('active');
    } else {
      this.container?.querySelector?.('.mermaid-code-button')?.classList?.remove?.('active');
    }
    if (view === 'preview') {
      this.container?.querySelector?.('.mermaid-preview-button')?.classList?.add?.('active');
    } else {
      this.container?.querySelector?.('.mermaid-preview-button')?.classList?.remove?.('active');
    }
  }

  save(block: HTMLElement) {
    const code = block.querySelector('.mermaid-code > div') as HTMLDivElement | null;
    return {
      mermaid: code?.innerText?.replace(/^\n+|\n+$/g, '') ?? '',
    };
  }
}
