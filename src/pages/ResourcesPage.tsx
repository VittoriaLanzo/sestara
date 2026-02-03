import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useResourceGroups, 
  useRoadmapResources, 
  RoadmapResource 
} from "@/hooks/useRoadmapResources";
import { AddVideoDialog } from "@/components/resources/AddVideoDialog";
import { AddPlaylistDialog } from "@/components/resources/AddPlaylistDialog";
import { CreateGroupDialog } from "@/components/resources/CreateGroupDialog";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceGroupComponent } from "@/components/resources/ResourceGroup";
import { VideoPlayer } from "@/components/resources/VideoPlayer";
import { 
  ArrowLeft, 
  Plus, 
  Youtube, 
  ListVideo, 
  FolderPlus, 
  Search,
  Filter,
  Loader2,
  Library,
  BookOpen
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useReorderResources } from "@/hooks/useRoadmapResources";

const ResourcesPage = () => {
  const { id: roadmapId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [playingResource, setPlayingResource] = useState<RoadmapResource | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [watchedFilter, setWatchedFilter] = useState<string>("all");

  const { data: roadmap, isLoading: roadmapLoading } = useQuery({
    queryKey: ["roadmap", roadmapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", roadmapId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!roadmapId,
  });

  const { data: groups = [], isLoading: groupsLoading } = useResourceGroups(roadmapId!);
  const { data: resources = [], isLoading: resourcesLoading } = useRoadmapResources(roadmapId!);
  const reorderResources = useReorderResources();

  const isLoading = roadmapLoading || groupsLoading || resourcesLoading;

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      // Search filter
      if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Group filter
      if (groupFilter !== "all") {
        if (groupFilter === "ungrouped" && resource.group_id !== null) return false;
        if (groupFilter !== "ungrouped" && resource.group_id !== groupFilter) return false;
      }
      // Watched filter
      if (watchedFilter === "watched" && !resource.is_watched) return false;
      if (watchedFilter === "unwatched" && resource.is_watched) return false;
      if (watchedFilter === "favorites" && !resource.is_favorite) return false;
      return true;
    });
  }, [resources, searchQuery, groupFilter, watchedFilter]);

  // Count favorites
  const favoritesCount = resources.filter(r => r.is_favorite).length;

  // Group resources
  const ungroupedResources = filteredResources.filter((r) => !r.group_id);
  const groupedResources = groups.map((group) => ({
    group,
    resources: filteredResources.filter((r) => r.group_id === group.id),
  }));

  // Video player navigation
  const currentResourceIndex = playingResource
    ? filteredResources.findIndex((r) => r.id === playingResource.id)
    : -1;
  const hasNext = currentResourceIndex < filteredResources.length - 1;
  const hasPrevious = currentResourceIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setPlayingResource(filteredResources[currentResourceIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      setPlayingResource(filteredResources[currentResourceIndex - 1]);
    }
  };

  // Drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const newResources = [...filteredResources];
    const [removed] = newResources.splice(sourceIndex, 1);
    newResources.splice(destIndex, 0, removed);

    const updates = newResources.map((r, idx) => ({
      id: r.id,
      order_index: idx,
      group_id: r.group_id,
    }));

    reorderResources.mutate({ roadmapId: roadmapId!, updates });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/roadmap/${roadmapId}`)}
            className="mb-4 -ml-2 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roadmap
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Library className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-display font-bold text-foreground">Study Materials</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {roadmap?.title}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {resources.length} videos • {groups.length} groups
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowCreateGroup(true)} className="gap-2">
                <FolderPlus className="w-4 h-4" />
                New Group
              </Button>
              <Button variant="outline" onClick={() => setShowAddPlaylist(true)} className="gap-2">
                <ListVideo className="w-4 h-4" />
                Add Playlist
              </Button>
              <Button variant="gradient" onClick={() => setShowAddVideo(true)} className="gap-2">
                <Youtube className="w-4 h-4" />
                Add Video
              </Button>
            </div>
          </div>
        </div>

        {/* Video Player */}
        {playingResource && (
          <div className="mb-6 animate-scale-in">
            <VideoPlayer
              resource={playingResource}
              roadmapId={roadmapId!}
              onClose={() => setPlayingResource(null)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
            />
          </div>
        )}

        {/* Search & Filters */}
        <div className="glass-card p-4 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="ungrouped">Ungrouped</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={watchedFilter} onValueChange={setWatchedFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Videos</SelectItem>
                  <SelectItem value="favorites">
                    ⭐ Favorites {favoritesCount > 0 && `(${favoritesCount})`}
                  </SelectItem>
                  <SelectItem value="watched">Watched</SelectItem>
                  <SelectItem value="unwatched">Unwatched</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Resource Library */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          {resources.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                No resources yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start building your study library by adding YouTube videos or playlists
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setShowAddPlaylist(true)} className="gap-2">
                  <ListVideo className="w-4 h-4" />
                  Add Playlist
                </Button>
                <Button variant="gradient" onClick={() => setShowAddVideo(true)} className="gap-2">
                  <Youtube className="w-4 h-4" />
                  Add Video
                </Button>
              </div>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">No videos match your filters</p>
            </div>
          ) : (
            <>
              {/* Grouped Resources */}
              {groupedResources.map(
                ({ group, resources: groupResources }) =>
                  groupResources.length > 0 && (
                    <ResourceGroupComponent
                      key={group.id}
                      group={group}
                      resources={groupResources}
                      allGroups={groups}
                      roadmapId={roadmapId!}
                      onPlayResource={setPlayingResource}
                    />
                  )
              )}

              {/* Ungrouped Resources */}
              {ungroupedResources.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground px-2">
                    Ungrouped ({ungroupedResources.length})
                  </h3>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="ungrouped">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="space-y-2"
                        >
                          {ungroupedResources.map((resource, index) => (
                            <Draggable key={resource.id} draggableId={resource.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <ResourceCard
                                    resource={resource}
                                    roadmapId={roadmapId!}
                                    groups={groups}
                                    onPlay={setPlayingResource}
                                    isDragging={snapshot.isDragging}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Dialogs */}
      <AddVideoDialog
        open={showAddVideo}
        onOpenChange={setShowAddVideo}
        roadmapId={roadmapId!}
        groups={groups}
      />
      <AddPlaylistDialog
        open={showAddPlaylist}
        onOpenChange={setShowAddPlaylist}
        roadmapId={roadmapId!}
      />
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        roadmapId={roadmapId!}
      />
    </div>
  );
};

export default ResourcesPage;
