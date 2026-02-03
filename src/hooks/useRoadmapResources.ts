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

// Fetch video metadata from edge function
const fetchVideoMetadata = async (url: string): Promise<{
  title: string;
  thumbnail_url: string;
  video_id: string;
} | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("youtube-metadata", {
      body: { url, type: "video" },
    });

    if (error || !data.success) {
      console.error("Error fetching video metadata:", error || data.error);
      return null;
    }

    return {
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      video_id: data.video_id,
    };
  } catch (error) {
    console.error("Error calling youtube-metadata function:", error);
    return null;
  }
};

// Fetch playlist videos from edge function
const fetchPlaylistVideos = async (url: string): Promise<{
  playlist_id: string;
  videos: Array<{
    video_id: string;
    title: string;
    thumbnail_url: string;
    index: number;
  }>;
} | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("youtube-metadata", {
      body: { url, type: "playlist" },
    });

    if (error || !data.success) {
      console.error("Error fetching playlist:", error || data.error);
      throw new Error(data?.error || "Failed to fetch playlist videos");
    }

    return {
      playlist_id: data.playlist_id,
      videos: data.videos,
    };
  } catch (error) {
    console.error("Error calling youtube-metadata function:", error);
    throw error;
  }
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

      // Fetch video metadata if no title provided
      let finalTitle = title;
      let thumbnailUrl = getThumbnailUrl(videoId);

      if (!title) {
        const metadata = await fetchVideoMetadata(url);
        if (metadata) {
          finalTitle = metadata.title;
          thumbnailUrl = metadata.thumbnail_url;
        } else {
          finalTitle = "Title unavailable";
        }
      }

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

      // Fetch playlist videos from edge function
      const playlistData = await fetchPlaylistVideos(playlistUrl);
      
      if (!playlistData || playlistData.videos.length === 0) {
        throw new Error("Could not fetch playlist videos. The playlist may be private or unavailable.");
      }

      // Create a group for this playlist
      const { data: group, error: groupError } = await supabase
        .from("resource_groups")
        .insert({
          roadmap_id: roadmapId,
          user_id: user!.id,
          name: groupName || `Playlist (${playlistData.videos.length} videos)`,
          is_playlist: true,
          playlist_url: playlistUrl,
          color: "purple",
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add all videos from the playlist
      const videosToInsert = playlistData.videos.map((video, index) => ({
        roadmap_id: roadmapId,
        user_id: user!.id,
        url: `https://www.youtube.com/watch?v=${video.video_id}`,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        group_id: group.id,
        order_index: index,
        resource_type: "video",
      }));

      const { error: resourcesError } = await supabase
        .from("roadmap_resources")
        .insert(videosToInsert);

      if (resourcesError) {
        // Cleanup: delete the group if resources insertion failed
        await supabase.from("resource_groups").delete().eq("id", group.id);
        throw resourcesError;
      }

      return { group, videosCount: playlistData.videos.length };
    },
    onSuccess: (result, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", roadmapId] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", roadmapId] });
      toast.success(`Playlist added with ${result.videosCount} videos!`);
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
      toast.success("Group updated!");
    },
    onError: () => {
      toast.error("Failed to update group");
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
      toast.success("Group deleted. Videos moved to ungrouped.");
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