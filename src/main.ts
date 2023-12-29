import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import NestedList from '@editorjs/nested-list';
import CodeTool from '@editorjs/code';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

import Mermaid from './mermaid';


function toMarkdown(data: EditorJS.OutputData): string {
  const result: string[] = [];

  const inline = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*')
      .replace(/_/g, '\\_')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
  }

  interface ListItem {
    content: string;
    items: ListItem[];
  }

  const list = (items: ListItem[], indent: number = 0): string => {
    const result: string[] = [];

    for (const item of items) {
      result.push(`${'  '.repeat(indent)}- ${inline(item.content)}`);
      if (item.items.length > 0) {
        result.push(list(item.items, indent + 1));
      }
    }

    return result.join('\n');
  };

  for (const block of data.blocks) {
    switch (block.type) {
      case 'header':
        result.push(`${'#'.repeat(block.data.level)} ${inline(block.data.text)}`);
        break;
      case 'paragraph':
        result.push(inline(block.data.text));
        break;
      case 'list':
        result.push(list(block.data.items));
        break;
      case 'mermaid':
        result.push('```mermaid\n' + block.data.mermaid + '\n```');
        break;
      case 'code':
        result.push('```\n' + block.data.code + '\n```');
        break;
      default:
        console.warn(`Unknown block type: ${block.type}`);
    }
  }

  return result.join('\n\n');
}


function fromMarkdown(markdown: string): EditorJS.OutputData {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const ast = processor.parse(markdown);

  const inline = ({ children }: { children: any[] }): string => {
    return children.map((child) => {
      switch (child.type) {
        case 'text':
          return child.value;
        case 'strong':
          return `<b>${inline(child)}</b>`;
        case 'emphasis':
          return `<i>${inline(child)}</i>`;
        case 'link':
          return `<a href="${child.url}">${inline(child)}</a>`;
        default:
          console.warn(`Unknown inline node type: ${child.type}`);
          return '';
      }
    }).join('');
  };

  return {
    time: Date.now(),
    blocks: ast.children.map((node) => {
      switch (node.type) {
        case 'heading':
          return {
            type: 'header',
            data: {
              level: node.depth,
              text: inline(node),
            },
          };
        case 'paragraph':
          return {
            type: 'paragraph',
            data: {
              text: inline(node),
            },
          };
        case 'code':
          if (node.lang === 'mermaid') {
            return {
              type: 'mermaid',
              data: {
                mermaid: node.value,
              },
            };
          } else {
            return {
              type: 'code',
              data: {
                code: node.value,
              },
            };
          }
        case 'list':
          interface ListItem {
            content: string;
            items: ListItem[];
          }
          function parseItem(node: any): ListItem {
            const content = node.children.filter((child: any) => child.type !== 'list').map(inline).join('\n');
            const items = node.children.filter((child: any) => child.type === 'list').flatMap((child: any) => child.children.map(parseItem));
            return { content, items };
          };

          return {
            type: 'list',
            data: {
              style: node.ordered ? 'ordered' : 'unordered',
              items: node.children.map(parseItem),
            },
          };
        default:
          console.warn(`Unknown node type: ${node.type}`);
          return null;
      }
    }).filter((block) => block),
    version: '2.28.2',
  };
}


const editor = new EditorJS({
  holder: document.getElementById('app')!,
  tools: {
    header: {
      class: Header,
      inlineToolbar: ['link'],
    },
    list: {
      class: NestedList,
      inlineToolbar: true,
    },
    code: CodeTool,
    mermaid: Mermaid,
  },
  data: fromMarkdown([
    '# Hello world!',
    'This is a **test**.',
    '',
    '```mermaid',
    'flowchart',
    '  md[Markdown]',
    '  ejs["EditorJS Data"]',
    '',
    '  md -->|"fromMarkdown()"| ejs',
    '  ejs -->|"toMarkdown()"| md',
    '',
    '  ejs <-->|"edit"| EditorJS',
    '```',
  ].join('\n')),
  onChange: (api) => {
    api.saver.save().then((output) => {
      console.log(toMarkdown(output));
    });
  }
});
