"use client";

import React from "react";
import ExpandableCardDemo, { type ExpandableCard } from "@/components/ui/expandable-card";
import { SocialPost, Platform } from "@/lib/social/types";
import { format } from "date-fns";
import { 
  IconBrandTwitter, 
  IconBrandLinkedin,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconBrandFacebook,
  IconEye,
  IconTrendingUp,
  IconClock,
  IconExternalLink
} from "@tabler/icons-react";

const platformIcons = {
  twitter: IconBrandTwitter,
  linkedin: IconBrandLinkedin,
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  'youtube-short': IconBrandYoutube,
  facebook: IconBrandFacebook
};

const platformColors = {
  twitter: '#1DA1F2',
  linkedin: '#0077B5',
  instagram: '#E1306C',
  tiktok: '#000000',
  youtube: '#FF0000',
  'youtube-short': '#FF0000',
  facebook: '#1877F2'
};

const platformNames = {
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  'youtube-short': 'YouTube Shorts',
  facebook: 'Facebook'
};

interface SocialPostsExpandableProps {
  posts: SocialPost[];
  projectTitle?: string;
}

export default function SocialPostsExpandable({ posts, projectTitle }: SocialPostsExpandableProps) {
  // Transform social posts into expandable cards format
  const cards: ExpandableCard[] = posts.map((post) => {
    // Get platform from integration or use a default
    const platform: Platform = post.integration?.platform || 'x';
    const PlatformIcon = platformIcons[platform as keyof typeof platformIcons];
    const platformColor = platformColors[platform as keyof typeof platformColors];
    const platformName = platformNames[platform as keyof typeof platformNames];
    
    // Generate a preview image based on platform
    // Using a gradient placeholder for now - in production, this could be an OG image generator
    const platformGradients = {
      twitter: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400&h=400&fit=crop',
      linkedin: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=400&h=400&fit=crop',
      instagram: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=400&fit=crop',
      tiktok: 'https://images.unsplash.com/photo-1611605698323-b1e99cfd37ea?w=400&h=400&fit=crop',
      youtube: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=400&fit=crop',
      'youtube-short': 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=400&fit=crop',
      facebook: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&h=400&fit=crop'
    };
    const previewImage = platformGradients[platform as keyof typeof platformGradients] || platformGradients.twitter;
    
    return {
      title: `${platformName} Post`,
      description: post.publish_date 
        ? `Scheduled for ${format(new Date(post.publish_date), 'MMM d, yyyy')}`
        : format(new Date(post.created_at), 'MMM d, yyyy'),
      src: previewImage,
      ctaText: post.state === 'published' ? 'View Post' : 'Edit Post',
      ctaLink: `/social/compose?postId=${post.id}`,
      content: () => (
        <div className="space-y-4">
          {/* Post Content */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <PlatformIcon className="h-4 w-4" style={{ color: platformColor }} />
              Post Content
            </h4>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Hashtags</h4>
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground"
                  >
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Post Status */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Status</h4>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                post.state === 'published' 
                  ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                  : post.state === 'scheduled'
                  ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {post.state}
              </span>
              {post.publish_date && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  {format(new Date(post.publish_date), 'h:mm a')}
                </span>
              )}
            </div>
          </div>

          {/* Analytics (if published) */}
          {post.state === 'published' && post.analytics && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Analytics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <IconEye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{post.analytics.views || 0}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">{post.analytics.likes || 0}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Project Reference */}
          {projectTitle && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                From project: <span className="font-medium">{projectTitle}</span>
              </p>
            </div>
          )}

          {/* View on Platform Link */}
          {post.state === 'published' && (
            <div className="pt-4">
              <button
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                onClick={() => {
                  // Could open in platform app or copy link
                  window.open(`/social/compose?postId=${post.id}`, '_blank');
                }}
              >
                <IconExternalLink className="h-4 w-4" />
                View Post Details
              </button>
            </div>
          )}
        </div>
      )
    };
  });

  return <ExpandableCardDemo cards={cards} />;
} 