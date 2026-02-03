import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Extract playlist ID from YouTube URL
function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Fetch video metadata using oEmbed API
async function fetchVideoMetadata(videoId: string): Promise<{
  title: string;
  thumbnail_url: string;
  author_name?: string;
} | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      console.error("oEmbed API error:", response.status);
      return null;
    }
    
    const data = await response.json();
    return {
      title: data.title || "Untitled Video",
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      author_name: data.author_name,
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    return null;
  }
}

// Fetch playlist videos using YouTube's public playlist page
async function fetchPlaylistVideos(playlistId: string): Promise<Array<{
  video_id: string;
  title: string;
  thumbnail_url: string;
  index: number;
}>> {
  try {
    // Try using YouTube's oEmbed for playlist info first
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    if (!response.ok) {
      console.error("Playlist fetch error:", response.status);
      return [];
    }
    
    const html = await response.text();
    
    // Extract video data from the page
    const videos: Array<{
      video_id: string;
      title: string;
      thumbnail_url: string;
      index: number;
    }> = [];
    
    // Look for video IDs and titles in the HTML
    // YouTube embeds video data in various JSON structures in the page
    const videoIdPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const titlePattern = /"title":\s*\{"runs":\s*\[\{"text":\s*"([^"]+)"\}\]/g;
    
    // Extract unique video IDs
    const videoIds = new Set<string>();
    let match;
    while ((match = videoIdPattern.exec(html)) !== null) {
      videoIds.add(match[1]);
    }
    
    // For each unique video, fetch metadata
    let index = 0;
    for (const videoId of videoIds) {
      if (index >= 50) break; // Limit to 50 videos
      
      const metadata = await fetchVideoMetadata(videoId);
      if (metadata) {
        videos.push({
          video_id: videoId,
          title: metadata.title,
          thumbnail_url: metadata.thumbnail_url,
          index: index++,
        });
      } else {
        videos.push({
          video_id: videoId,
          title: `Video ${index + 1}`,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          index: index++,
        });
      }
      
      // Small delay to avoid rate limiting
      if (index < videoIds.size - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return videos;
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, type } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "video") {
      const videoId = extractVideoId(url);
      if (!videoId) {
        return new Response(
          JSON.stringify({ error: "Invalid YouTube video URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const metadata = await fetchVideoMetadata(videoId);
      if (!metadata) {
        return new Response(
          JSON.stringify({ 
            success: true,
            video_id: videoId,
            title: "Title unavailable",
            thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          video_id: videoId,
          ...metadata,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "playlist") {
      const playlistId = extractPlaylistId(url);
      if (!playlistId) {
        return new Response(
          JSON.stringify({ error: "Invalid YouTube playlist URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const videos = await fetchPlaylistVideos(playlistId);
      
      if (videos.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: "Could not fetch playlist videos. The playlist may be private or unavailable." 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          playlist_id: playlistId,
          videos,
          total: videos.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Use 'video' or 'playlist'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});