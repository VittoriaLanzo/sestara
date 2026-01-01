import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  MoreVertical,
  Trash2,
  Pin,
  PinOff,
  Palette,
  GripVertical,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotePage {
  id: string;
  title: string;
  is_pinned: boolean;
  color_tag: string | null;
  icon: string | null;
  order_index: number;
  updated_at: string;
  content?: any;
}

interface NoteSidebarProps {
  pages: NotePage[];
  activePageId: string | null;
  onSelectPage: (pageId: string) => void;
  onCreatePage: () => void;
  onDeletePage: (pageId: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onTogglePin: (pageId: string) => void;
  onSetColorTag: (pageId: string, color: string | null) => void;
  onReorderPages: (pages: NotePage[]) => void;
}

const COLOR_OPTIONS = [
  { value: null, label: "None", class: "bg-muted" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
];

const getColorClass = (color: string | null) => {
  const found = COLOR_OPTIONS.find((c) => c.value === color);
  return found?.class || "bg-muted";
};

export const NoteSidebar = ({
  pages,
  activePageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onTogglePin,
  onSetColorTag,
  onReorderPages,
}: NoteSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first, then by order_index
  const sortedPages = [...filteredPages].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return a.order_index - b.order_index;
  });

  const handleStartEdit = (page: NotePage) => {
    setEditingId(page.id);
    setEditTitle(page.title);
  };

  const handleSaveEdit = (pageId: string) => {
    if (editTitle.trim()) {
      onRenamePage(pageId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="w-64 h-full flex flex-col border-r border-border bg-muted/20">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Pages</h3>
          <Button size="sm" variant="ghost" onClick={onCreatePage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pages..."
            className="pl-8 h-8"
          />
        </div>
      </div>

      {/* Pages List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {pages.length === 0 ? (
                <p>No pages yet. Click + to create one.</p>
              ) : (
                <p>No pages match your search.</p>
              )}
            </div>
          ) : (
            sortedPages.map((page) => (
              <div
                key={page.id}
                className={cn(
                  "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                  activePageId === page.id
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelectPage(page.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

                {/* Color indicator */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    getColorClass(page.color_tag)
                  )}
                />

                {/* Icon/Pin indicator */}
                {page.is_pinned ? (
                  <Pin className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                {/* Title or edit input */}
                {editingId === page.id ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(page.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 px-1 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="flex-1 truncate text-sm"
                    onDoubleClick={() => handleStartEdit(page)}
                  >
                    {page.icon && <span className="mr-1">{page.icon}</span>}
                    {page.title}
                  </span>
                )}

                {/* Actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStartEdit(page)}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTogglePin(page.id)}>
                      {page.is_pinned ? (
                        <>
                          <PinOff className="h-4 w-4 mr-2" />
                          Unpin
                        </>
                      ) : (
                        <>
                          <Pin className="h-4 w-4 mr-2" />
                          Pin
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-muted cursor-pointer">
                        <Palette className="h-4 w-4 mr-2" />
                        Color tag
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {COLOR_OPTIONS.map((color) => (
                          <DropdownMenuItem
                            key={color.value || "none"}
                            onClick={() => onSetColorTag(page.id, color.value)}
                          >
                            <div className={cn("w-3 h-3 rounded-full mr-2", color.class)} />
                            {color.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenuItem
                      onClick={() => onDeletePage(page.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
