import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Map, BookOpen, FileText, Calendar, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  type: 'roadmap' | 'subject' | 'topic' | 'reminder';
  parentTitle?: string;
  url: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const q = searchQuery.toLowerCase().trim();
      const searchResults: SearchResult[] = [];

      // Search roadmaps
      const { data: roadmaps } = await supabase
        .from("roadmaps")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${q}%`)
        .limit(5);

      roadmaps?.forEach(r => {
        searchResults.push({
          id: r.id,
          title: r.title,
          type: 'roadmap',
          url: `/roadmap/${r.id}`,
        });
      });

      // Search subjects with roadmap info
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, title, roadmap_id, roadmaps!inner(title, user_id)")
        .ilike("title", `%${q}%`)
        .limit(5);

      subjects?.forEach((s: any) => {
        if (s.roadmaps?.user_id === user.id) {
          searchResults.push({
            id: s.id,
            title: s.title,
            type: 'subject',
            parentTitle: s.roadmaps?.title,
            url: `/roadmap/${s.roadmap_id}`,
          });
        }
      });

      // Search topics with subject info
      const { data: topics } = await supabase
        .from("topics")
        .select("id, title, subject_id, subjects!inner(title, roadmap_id, roadmaps!inner(user_id))")
        .ilike("title", `%${q}%`)
        .limit(5);

      topics?.forEach((t: any) => {
        if (t.subjects?.roadmaps?.user_id === user.id) {
          searchResults.push({
            id: t.id,
            title: t.title,
            type: 'topic',
            parentTitle: t.subjects?.title,
            url: `/topic/${t.id}`,
          });
        }
      });

      // Search reminders
      const { data: reminders } = await supabase
        .from("reminders")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${q}%`)
        .limit(5);

      reminders?.forEach(r => {
        searchResults.push({
          id: r.id,
          title: r.title,
          type: 'reminder',
          url: `/important-dates`,
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      search(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query, search]);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    setResults([]);
    navigate(url);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'roadmap': return <Map className="w-4 h-4 text-primary" />;
      case 'subject': return <BookOpen className="w-4 h-4 text-blue-400" />;
      case 'topic': return <FileText className="w-4 h-4 text-green-400" />;
      case 'reminder': return <Calendar className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'roadmap': return 'Roadmap';
      case 'subject': return 'Subject';
      case 'topic': return 'Topic';
      case 'reminder': return 'Reminder';
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search roadmaps, subjects, topics, reminders..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && query && results.length === 0 && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}
        {!loading && !query && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Start typing to search...
          </div>
        )}
        {!loading && Object.entries(groupedResults).map(([type, items]) => (
          <CommandGroup key={type} heading={getTypeLabel(type as SearchResult['type']) + 's'}>
            {items.map((result) => (
              <CommandItem
                key={`${result.type}-${result.id}`}
                value={`${result.type}-${result.id}-${result.title}`}
                onSelect={() => handleSelect(result.url)}
                className="flex items-center gap-3 cursor-pointer"
              >
                {getIcon(result.type)}
                <div className="flex flex-col">
                  <span className="font-medium">{result.title}</span>
                  {result.parentTitle && (
                    <span className="text-xs text-muted-foreground">
                      in {result.parentTitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
