/**
 * Extract video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Extract playlist ID from YouTube playlist URL
 */
export const extractYouTubePlaylistId = (url: string): string | null => {
  const pattern = /[?&]list=([^&\n?#]+)/;
  const match = url.match(pattern);
  return match ? match[1] : null;
};

/**
 * Get YouTube thumbnail URL from video ID
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: "default" | "medium" | "high" | "maxres" = "medium"
): string => {
  const qualityMap = {
    default: "default",
    medium: "mqdefault",
    high: "hqdefault",
    maxres: "maxresdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

/**
 * Get YouTube embed URL from video ID
 */
export const getYouTubeEmbedUrl = (videoId: string, autoplay = false): string => {
  return `https://www.youtube.com/embed/${videoId}${autoplay ? "?autoplay=1" : ""}`;
};

/**
 * Check if a URL is a YouTube playlist
 */
export const isYouTubePlaylistUrl = (url: string): boolean => {
  return extractYouTubePlaylistId(url) !== null;
};

/**
 * Check if a URL is a valid YouTube URL (video or playlist)
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null || isYouTubePlaylistUrl(url);
};

/**
 * Format duration from ISO 8601 format (PT1H2M3S) to human readable
 */
export const formatDuration = (isoDuration: string): string => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Get watch URL for a video
 */
export const getYouTubeWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};
