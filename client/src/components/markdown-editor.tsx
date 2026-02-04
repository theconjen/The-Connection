import { useRef, useCallback, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  TextQuote,
  Code,
} from 'lucide-react';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type ToolbarAction = 'bold' | 'italic' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'link' | 'blockquote' | 'code';

interface ToolbarButton {
  action: ToolbarAction;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const toolbarGroups: ToolbarButton[][] = [
  [
    { action: 'bold', icon: <Bold className="h-4 w-4" />, label: 'Bold', shortcut: 'Ctrl+B' },
    { action: 'italic', icon: <Italic className="h-4 w-4" />, label: 'Italic', shortcut: 'Ctrl+I' },
  ],
  [
    { action: 'heading2', icon: <Heading2 className="h-4 w-4" />, label: 'Heading 2' },
    { action: 'heading3', icon: <Heading3 className="h-4 w-4" />, label: 'Heading 3' },
  ],
  [
    { action: 'bulletList', icon: <List className="h-4 w-4" />, label: 'Bullet List' },
    { action: 'numberedList', icon: <ListOrdered className="h-4 w-4" />, label: 'Numbered List' },
  ],
  [
    { action: 'link', icon: <Link2 className="h-4 w-4" />, label: 'Link', shortcut: 'Ctrl+K' },
    { action: 'blockquote', icon: <TextQuote className="h-4 w-4" />, label: 'Quote' },
    { action: 'code', icon: <Code className="h-4 w-4" />, label: 'Inline Code' },
  ],
];

export function MarkdownEditor({ id, value, onChange, placeholder, rows = 20 }: MarkdownEditorProps) {
  const [tab, setTab] = useState<string>('write');
  const lastEmitted = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder?.replace(/&#10;/g, '\n') || 'Write your content here...',
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown();
      lastEmitted.current = md;
      onChange(md);
    },
    editorProps: {
      attributes: {
        id: id || '',
        class: 'tiptap-content focus:outline-none',
        style: `min-height: ${(rows || 10) * 1.75}rem`,
      },
    },
  });

  // Sync external value changes (e.g., loading a post)
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const runAction = useCallback(
    (action: ToolbarAction) => {
      if (!editor) return;

      const actions: Record<ToolbarAction, () => void> = {
        bold: () => editor.chain().focus().toggleBold().run(),
        italic: () => editor.chain().focus().toggleItalic().run(),
        heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        bulletList: () => editor.chain().focus().toggleBulletList().run(),
        numberedList: () => editor.chain().focus().toggleOrderedList().run(),
        blockquote: () => editor.chain().focus().toggleBlockquote().run(),
        code: () => editor.chain().focus().toggleCode().run(),
        link: () => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt('URL', previousUrl || 'https://');
          if (url === null) return;
          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
          } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }
        },
      };

      actions[action]();
    },
    [editor],
  );

  const isActive = useCallback(
    (action: ToolbarAction): boolean => {
      if (!editor) return false;
      switch (action) {
        case 'bold': return editor.isActive('bold');
        case 'italic': return editor.isActive('italic');
        case 'heading2': return editor.isActive('heading', { level: 2 });
        case 'heading3': return editor.isActive('heading', { level: 3 });
        case 'bulletList': return editor.isActive('bulletList');
        case 'numberedList': return editor.isActive('orderedList');
        case 'blockquote': return editor.isActive('blockquote');
        case 'code': return editor.isActive('code');
        case 'link': return editor.isActive('link');
        default: return false;
      }
    },
    [editor],
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="border rounded-lg overflow-hidden">
          {/* Toolbar + Tab toggle row */}
          <div className="flex items-center justify-between bg-muted/50 border-b px-2 py-1 gap-1 flex-wrap">
            {/* Toolbar buttons */}
            <div className="flex items-center gap-0.5 flex-wrap">
              {toolbarGroups.map((group, gi) => (
                <div key={gi} className="flex items-center gap-0.5">
                  {gi > 0 && (
                    <Separator orientation="vertical" className="mx-1 h-6" />
                  )}
                  {group.map((btn) => (
                    <Tooltip key={btn.action}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 ${
                            tab === 'write' && isActive(btn.action)
                              ? 'bg-muted text-foreground'
                              : ''
                          }`}
                          onClick={() => runAction(btn.action)}
                          disabled={tab !== 'write'}
                        >
                          {btn.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {btn.label}
                        {btn.shortcut && (
                          <span className="ml-2 text-muted-foreground text-xs">
                            {btn.shortcut}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}
            </div>

            {/* Write / Preview tabs */}
            <TabsList className="h-8">
              <TabsTrigger value="write" className="text-xs px-3 py-1">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs px-3 py-1">
                Preview
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Write tab content — TipTap WYSIWYG */}
          <TabsContent value="write" className="mt-0">
            <EditorContent editor={editor} />
          </TabsContent>

          {/* Preview tab content — final rendered markdown */}
          <TabsContent value="preview" className="mt-0">
            <div
              className="px-4 py-3 prose prose-sm max-w-none min-h-[10rem]"
              style={{ minHeight: `${(rows || 10) * 1.75}rem` }}
            >
              {value ? (
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-5 mb-2" {...props} />,
                    p: ({ ...props }) => <p className="mb-4 leading-relaxed text-gray-700" {...props} />,
                    ul: ({ ...props }) => <ul className="mb-4 ml-6 space-y-2" {...props} />,
                    ol: ({ ...props }) => <ol className="mb-4 ml-6 space-y-2" {...props} />,
                    li: ({ ...props }) => <li className="text-gray-700" {...props} />,
                    a: ({ ...props }) => (
                      <a
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),
                    blockquote: ({ ...props }) => (
                      <blockquote
                        className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4"
                        {...props}
                      />
                    ),
                    code: ({ inline, ...props }: any) =>
                      inline ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm" {...props} />
                      ) : (
                        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto" {...props} />
                      ),
                  }}
                >
                  {value}
                </ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview</p>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </TooltipProvider>
  );
}
