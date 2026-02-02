import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ResourceGroup {
  id: string;
  roadmap_id: string;
  user_id: string;
  name: string;
  color: string | null;
  order_index: number;
  is_playlist: boolean;
  playlist_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapResource {
  id: string;
  roadmap_id: string;
  group_id: string | null;
  user_id: string;
  title: string;
  url: string;
  resource_type: string;
  thumbnail_url: string | null;
  duration: string | null;
  notes: string | null;
  is_watched: boolean;
  is_favorite: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// YouTube API helpers
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractPlaylistId = (url: string): string | null => {
  const match = url.match(/[?&]list=([^&\n?#]+)/);
  return match ? match[1] : null;
};

const getThumbnailUrl = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

export const useResourceGroups = (roadmapId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["resource-groups", roadmapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_groups")
        .select("*")
        .eq("roadmap_id", roadmapId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as ResourceGroup[];
    },
    enabled: !!user && !!roadmapId,
  });
};

export const useRoadmapResources = (roadmapId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["roadmap-resources", roadmapId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_resources")
        .select("*")
        .eq("roadmap_id", roadmapId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as RoadmapResource[];
    },
    enabled: !!user && !!roadmapId,
  });
};

export const useAddResource = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      url,
      title,
      notes,
      groupId,
    }: {
      roadmapId: string;
      url: string;
      title?: string;
      notes?: string;
      groupId?: string | null;
    }) => {
      const videoId = extractVideoId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      const thumbnailUrl = getThumbnailUrl(videoId);
      const finalTitle = title || `Video ${videoId}`;

      const { data, error } = await supabase
        .from("roadmap_resources")
        .insert({
          roadmap_id: roadmapId,
          user_id: user!.id,
          url,
          title: finalTitle,
          notes: notes || null,
          group_id: groupId || null,
          thumbnail_url: thumbnailUrl,
          resource_type: "video",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
      toast.success("Video added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add video");
    },
  });
};

export const useAddPlaylist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      playlistUrl,
      groupName,
    }: {
      roadmapId: string;
      playlistUrl: string;
      groupName?: string;
    }) => {
      const playlistId = extractPlaylistId(playlistUrl);
      if (!playlistId) throw new Error("Invalid YouTube playlist URL");

      // Create a group for this playlist
      const { data: group, error: groupError } = await supabase
        .from("resource_groups")
        .insert({
          roadmap_id: roadmapId,
          user_id: user!.id,
          name: groupName || `Playlist ${playlistId.slice(0, 8)}`,
          is_playlist: true,
          playlist_url: playlistUrl,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Note: In a production app, you'd use YouTube Data API to fetch all videos
      // For now, we'll add a placeholder that the user can expand
      return group;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", roadmapId] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
      toast.success("Playlist added successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add playlist");
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      name,
      color,
    }: {
      roadmapId: string;
      name: string;
      color?: string;
    }) => {
      const { data, error } = await supabase
        .from("resource_groups")
        .insert({
          roadmap_id: roadmapId,
          user_id: user!.id,
          name,
          color: color || "blue",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", roadmapId] });
      toast.success("Group created!");
    },
    onError: () => {
      toast.error("Failed to create group");
    },
  });
};

export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      roadmapId,
      updates,
    }: {
      id: string;
      roadmapId: string;
      updates: Partial<RoadmapResource>;
    }) => {
      const { data, error } = await supabase
        .from("roadmap_resources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
    },
  });
};

export const useDeleteResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roadmapId }: { id: string; roadmapId: string }) => {
      const { error } = await supabase.from("roadmap_resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
      toast.success("Resource deleted");
    },
    onError: () => {
      toast.error("Failed to delete resource");
    },
  });
};

export const useUpdateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      roadmapId,
      updates,
    }: {
      id: string;
      roadmapId: string;
      updates: Partial<ResourceGroup>;
    }) => {
      const { data, error } = await supabase
        .from("resource_groups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", roadmapId] });
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roadmapId }: { id: string; roadmapId: string }) => {
      // First, unassign all resources from this group
      await supabase
        .from("roadmap_resources")
        .update({ group_id: null })
        .eq("group_id", id);

      const { error } = await supabase.from("resource_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", roadmapId] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
      toast.success("Group deleted");
    },
    onError: () => {
      toast.error("Failed to delete group");
    },
  });
};

export const useReorderResources = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      updates,
    }: {
      roadmapId: string;
      updates: { id: string; order_index: number; group_id: string | null }[];
    }) => {
      for (const update of updates) {
        await supabase
          .from("roadmap_resources")
          .update({ order_index: update.order_index, group_id: update.group_id })
          .eq("id", update.id);
      }
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
    },
  });
};
