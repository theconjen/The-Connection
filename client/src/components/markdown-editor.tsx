import { useRef, useCallback, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
import { applyMarkdownAction, type MarkdownAction } from '@/lib/markdown-utils';

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface ToolbarButton {
  action: MarkdownAction;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<string>('write');
  const pendingCursor = useRef<{ start: number; end: number } | null>(null);

  const applyAction = useCallback(
    (action: MarkdownAction) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { newValue, newCursorStart, newCursorEnd } = applyMarkdownAction(
        action,
        value,
        textarea.selectionStart,
        textarea.selectionEnd,
      );

      onChange(newValue);
      pendingCursor.current = { start: newCursorStart, end: newCursorEnd };
    },
    [value, onChange],
  );

  // Restore cursor position after React re-renders the textarea value
  useEffect(() => {
    if (pendingCursor.current && textareaRef.current) {
      const { start, end } = pendingCursor.current;
      pendingCursor.current = null;
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(start, end);
        }
      });
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === 'b') {
        e.preventDefault();
        applyAction('bold');
      } else if (e.key === 'i') {
        e.preventDefault();
        applyAction('italic');
      } else if (e.key === 'k') {
        e.preventDefault();
        applyAction('link');
      }
    },
    [applyAction],
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
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            applyAction(btn.action);
                          }}
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

          {/* Write tab content */}
          <TabsContent value="write" className="mt-0">
            <textarea
              ref={textareaRef}
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={rows}
              className="w-full resize-y border-0 bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ minHeight: `${(rows || 10) * 1.5}rem` }}
            />
          </TabsContent>

          {/* Preview tab content */}
          <TabsContent value="preview" className="mt-0">
            <div
              className="px-4 py-3 prose prose-sm max-w-none min-h-[10rem]"
              style={{ minHeight: `${(rows || 10) * 1.5}rem` }}
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
