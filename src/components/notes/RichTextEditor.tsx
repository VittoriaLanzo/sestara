import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  List,
  ListOrdered,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Sparkles,
  Loader2,
  AlertCircle,
  Lightbulb,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: any;
  onChange: (content: any) => void;
  placeholder?: string;
  onAIAction?: (action: string, selectedText: string) => Promise<string>;
  className?: string;
}

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = "Start writing...",
  onAIAction,
  className,
}: RichTextEditorProps) => {
  const [aiLoading, setAiLoading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Image.configure({
        inline: true,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  useEffect(() => {
    if (editor && content && typeof content === "object") {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const handleAIAction = useCallback(
    async (action: string) => {
      if (!editor || !onAIAction) return;

      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, " ");

      if (!selectedText.trim()) return;

      setAiLoading(true);
      try {
        const result = await onAIAction(action, selectedText);
        if (result) {
          editor
            .chain()
            .focus()
            .deleteSelection()
            .insertContent(result)
            .run();
        }
      } finally {
        setAiLoading(false);
      }
    },
    [editor, onAIAction]
  );

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "h-8 w-8 p-0",
        isActive && "bg-primary/20 text-primary"
      )}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border border-border rounded-lg overflow-hidden bg-background/50", className)}>
      {/* Fixed Toolbar */}
      <div className="border-b border-border bg-muted/30 p-2 flex flex-wrap gap-1">
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        {onAIAction && (
          <>
            <div className="w-px h-6 bg-border mx-1" />

            {/* AI Tools */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 gap-1"
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-xs">AI</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleAIAction("improve")}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Improve clarity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAction("simplify")}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Simplify language
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAction("expand")}>
                  <Info className="h-4 w-4 mr-2" />
                  Expand notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAction("bulletize")}>
                  <List className="h-4 w-4 mr-2" />
                  Convert to bullets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAIAction("exam")}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Exam-ready format
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>


      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
};
