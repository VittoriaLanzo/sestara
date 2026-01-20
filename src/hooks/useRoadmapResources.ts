import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ResourceGroup {
  id: string;
  roadmap_id: string;
  user_id: string;
  name: string;
  color: string;
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

export const useCreateResourceGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      name,
      color = "blue",
      isPlaylist = false,
      playlistUrl = null,
    }: {
      roadmapId: string;
      name: string;
      color?: string;
      isPlaylist?: boolean;
      playlistUrl?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("resource_groups")
        .select("order_index")
        .eq("roadmap_id", roadmapId)
        .order("order_index", { ascending: false })
        .limit(1);

      const orderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

      const { data, error } = await supabase
        .from("resource_groups")
        .insert({
          roadmap_id: roadmapId,
          user_id: user.id,
          name,
          color,
          order_index: orderIndex,
          is_playlist: isPlaylist,
          playlist_url: playlistUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", variables.roadmapId] });
      toast.success("Group created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create group: " + error.message);
    },
  });
};

export const useUpdateResourceGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      roadmapId,
      ...updates
    }: Partial<ResourceGroup> & { id: string; roadmapId: string }) => {
      const { data, error } = await supabase
        .from("resource_groups")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", variables.roadmapId] });
    },
  });
};

export const useDeleteResourceGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roadmapId }: { id: string; roadmapId: string }) => {
      const { error } = await supabase.from("resource_groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", variables.roadmapId] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", variables.roadmapId] });
      toast.success("Group deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete group: " + error.message);
    },
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      groupId,
      title,
      url,
      resourceType = "video",
      thumbnailUrl,
      duration,
      notes,
    }: {
      roadmapId: string;
      groupId?: string | null;
      title: string;
      url: string;
      resourceType?: string;
      thumbnailUrl?: string | null;
      duration?: string | null;
      notes?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("roadmap_resources")
        .select("order_index")
        .eq("roadmap_id", roadmapId)
        .order("order_index", { ascending: false })
        .limit(1);

      const orderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

      const { data, error } = await supabase
        .from("roadmap_resources")
        .insert({
          roadmap_id: roadmapId,
          group_id: groupId || null,
          user_id: user.id,
          title,
          url,
          resource_type: resourceType,
          thumbnail_url: thumbnailUrl || null,
          duration: duration || null,
          notes: notes || null,
          order_index: orderIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", variables.roadmapId] });
      toast.success("Resource added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add resource: " + error.message);
    },
  });
};

export const useUpdateResource = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      roadmapId,
      ...updates
    }: Partial<RoadmapResource> & { id: string; roadmapId: string }) => {
      const { data, error } = await supabase
        .from("roadmap_resources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", variables.roadmapId] });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", variables.roadmapId] });
      toast.success("Resource deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete resource: " + error.message);
    },
  });
};

export const useBulkUpdateResourceOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      updates,
    }: {
      roadmapId: string;
      updates: { id: string; order_index: number; group_id?: string | null }[];
    }) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("roadmap_resources")
          .update({ order_index: update.order_index, group_id: update.group_id })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-resources", variables.roadmapId] });
    },
  });
};

export const useBulkUpdateGroupOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roadmapId,
      updates,
    }: {
      roadmapId: string;
      updates: { id: string; order_index: number }[];
    }) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("resource_groups")
          .update({ order_index: update.order_index })
          .eq("id", update.id);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["resource-groups", variables.roadmapId] });
    },
  });
};
