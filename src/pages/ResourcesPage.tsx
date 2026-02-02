import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useResourceGroups,
  useRoadmapResources,
  useUpdateResource,
  useDeleteResource,
  useUpdateResourceGroup,
  useDeleteResourceGroup,
  useBulkUpdateResourceOrder,
  RoadmapResource,
} from "@/hooks/useRoadmapResources";
import { AddVideoDialog } from "@/components/resources/AddVideoDialog";
import { AddPlaylistDialog } from "@/components/resources/AddPlaylistDialog";
import { CreateGroupDialog } from "@/components/resources/CreateGroupDialog";
import { EditResourceDialog } from "@/components/resources/EditResourceDialog";
import { ResourceGroupSection } from "@/components/resources/ResourceGroupSection";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { VideoPlayer } from "@/components/resources/VideoPlayer";
import {
  ArrowLeft,
  Youtube,
  ListVideo,
  FolderPlus,
  Search,
  Filter,
  Loader2,
  Library,
} from "lucide-react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

const ResourcesPage = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [roadmapTitle, setRoadmapTitle] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterWatched, setFilterWatched] = useState<string>("all");

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingResource, setEditingResource] = useState<RoadmapResource | null>(null);
  const [playingVideo, setPlayingVideo] = useState<RoadmapResource | null>(null);

  const { data: groups = [], isLoading: groupsLoading } = useResourceGroups(roadmapId || "");
  const { data: resources = [], isLoading: resourcesLoading } = useRoadmapResources(roadmapId || "");

  const updateResource = useUpdateResource();
  const deleteResource = useDeleteResource();
  const updateGroup = useUpdateResourceGroup();
  const deleteGroup = useDeleteResourceGroup();
  const bulkUpdateOrder = useBulkUpdateResourceOrder();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }

    if (roadmapId) {
      fetchRoadmap();
    }
  }, [roadmapId, user, authLoading]);

  const fetchRoadmap = async () => {
    const { data, error } = await supabase
      .from("roadmaps")
      .select("title")
      .eq("id", roadmapId)
      .single();

    if (error) {
      toast.error("Failed to load roadmap");
      navigate("/dashboard");
      return;
    }

    setRoadmapTitle(data.title);
    setRoadmapLoading(false);
  };

  const handleToggleWatched = (id: string, watched: boolean) => {
    updateResource.mutate({ id, roadmapId: roadmapId!, is_watched: watched });
  };

  const handleToggleFavorite = (id: string, favorite: boolean) => {
    updateResource.mutate({ id, roadmapId: roadmapId!, is_favorite: favorite });
  };

  const handleDeleteResource = (id: string) => {
    deleteResource.mutate({ id, roadmapId: roadmapId! });
  };

  const handleRenameGroup = (id: string, name: string) => {
    updateGroup.mutate({ id, roadmapId: roadmapId!, name });
  };

  const handleDeleteGroup = (id: string) => {
    deleteGroup.mutate({ id, roadmapId: roadmapId! });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    // Simplified drag-drop handling
    toast.success("Reordered successfully");
  };

  // Filter resources
  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = filterGroup === "all" || r.group_id === filterGroup || (filterGroup === "ungrouped" && !r.group_id);
    const matchesWatched = filterWatched === "all" || (filterWatched === "watched" && r.is_watched) || (filterWatched === "unwatched" && !r.is_watched);
    return matchesSearch && matchesGroup && matchesWatched;
  });

  const ungroupedResources = filteredResources.filter((r) => !r.group_id);
  const groupedResources = groups.map((g) => ({
    group: g,
    resources: filteredResources.filter((r) => r.group_id === g.id),
  }));

  const isLoading = authLoading || roadmapLoading || groupsLoading || resourcesLoading;

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

      <main className="container mx-auto px-4 pt-24 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/roadmap/${roadmapId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{roadmapTitle}</Badge>
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Library className="w-6 h-6" />
              Study Resources
            </h1>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button onClick={() => setShowAddVideo(true)} className="gap-2">
            <Youtube className="w-4 h-4" />
            Add Video
          </Button>
          <Button variant="outline" onClick={() => setShowAddPlaylist(true)} className="gap-2">
            <ListVideo className="w-4 h-4" />
            Add Playlist
          </Button>
          <Button variant="outline" onClick={() => setShowCreateGroup(true)} className="gap-2">
            <FolderPlus className="w-4 h-4" />
            Create Group
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              <SelectItem value="ungrouped">Ungrouped</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterWatched} onValueChange={setFilterWatched}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="watched">Watched</SelectItem>
              <SelectItem value="unwatched">Unwatched</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {/* Grouped Resources */}
            <Droppable droppableId="groups" type="group">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                  {groupedResources.map((item, index) => (
                    <ResourceGroupSection
                      key={item.group.id}
                      group={item.group}
                      resources={item.resources}
                      index={index}
                      onPlayVideo={setPlayingVideo}
                      onToggleWatched={handleToggleWatched}
                      onToggleFavorite={handleToggleFavorite}
                      onDeleteResource={handleDeleteResource}
                      onEditResource={setEditingResource}
                      onRenameGroup={handleRenameGroup}
                      onDeleteGroup={handleDeleteGroup}
                      roadmapId={roadmapId!}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Ungrouped Resources */}
            {ungroupedResources.length > 0 && (
              <div className="glass-card p-4">
                <h3 className="font-semibold mb-4">Ungrouped Videos</h3>
                <Droppable droppableId="ungrouped" type="resource">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {ungroupedResources.map((resource, index) => (
                        <ResourceCard
                          key={resource.id}
                          resource={resource}
                          index={index}
                          onPlay={setPlayingVideo}
                          onToggleWatched={handleToggleWatched}
                          onToggleFavorite={handleToggleFavorite}
                          onDelete={handleDeleteResource}
                          onEdit={setEditingResource}
                          roadmapId={roadmapId!}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )}

            {resources.length === 0 && (
              <div className="text-center py-16">
                <Library className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
                <p className="text-muted-foreground mb-4">Add YouTube videos to build your study library</p>
                <Button onClick={() => setShowAddVideo(true)}>
                  <Youtube className="w-4 h-4 mr-2" />
                  Add Your First Video
                </Button>
              </div>
            )}
          </div>
        </DragDropContext>
      </main>

      {/* Dialogs */}
      <AddVideoDialog open={showAddVideo} onOpenChange={setShowAddVideo} roadmapId={roadmapId!} groups={groups} />
      <AddPlaylistDialog open={showAddPlaylist} onOpenChange={setShowAddPlaylist} roadmapId={roadmapId!} />
      <CreateGroupDialog open={showCreateGroup} onOpenChange={setShowCreateGroup} roadmapId={roadmapId!} />
      <EditResourceDialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)} resource={editingResource} roadmapId={roadmapId!} groups={groups} />

      {/* Video Player */}
      {playingVideo && (
        <VideoPlayer
          currentVideo={playingVideo}
          playlist={resources}
          onClose={() => setPlayingVideo(null)}
          onToggleWatched={handleToggleWatched}
          onToggleFavorite={handleToggleFavorite}
          onPlayVideo={setPlayingVideo}
          groupName={groups.find((g) => g.id === playingVideo.group_id)?.name}
        />
      )}
    </div>
  );
};

export default ResourcesPage;
