import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDots, IconEdit, IconEye, IconPlayerPlay, IconTrash } from "@tabler/icons-react"
import Image from "next/image"

// Mock data for user's videos
const userVideos = [
  {
    id: 1,
    title: "Getting Started with Next.js 14",
    thumbnail: "https://picsum.photos/seed/1/320/180",
    views: "1.2K",
    likes: 89,
    comments: 12,
    duration: "12:34",
    uploadedAt: "2 days ago",
    status: "published",
    visibility: "public"
  },
  {
    id: 2,
    title: "Building Modern Web Apps with React",
    thumbnail: "https://picsum.photos/seed/2/320/180",
    views: "3.4K",
    likes: 234,
    comments: 45,
    duration: "24:15",
    uploadedAt: "1 week ago",
    status: "published",
    visibility: "public"
  },
  {
    id: 3,
    title: "TypeScript Best Practices in 2024",
    thumbnail: "https://picsum.photos/seed/3/320/180",
    views: "987",
    likes: 67,
    comments: 8,
    duration: "18:42",
    uploadedAt: "3 days ago",
    status: "processing",
    visibility: "unlisted"
  },
  {
    id: 4,
    title: "Mastering Tailwind CSS",
    thumbnail: "https://picsum.photos/seed/4/320/180",
    views: "5.6K",
    likes: 456,
    comments: 78,
    duration: "31:22",
    uploadedAt: "2 weeks ago",
    status: "published",
    visibility: "private"
  }
]

export default function StudioVideosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Videos</h1>
          <p className="text-muted-foreground">Manage your uploaded content</p>
        </div>
        <Button>
          <IconPlayerPlay className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>

      <div className="grid gap-4">
        {userVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              {/* Thumbnail */}
              <div className="relative w-full sm:w-48 aspect-video">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  width={192}
                  height={108}
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                  {video.duration}
                </div>
              </div>

              {/* Video Info */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-1">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={video.status === "published" ? "default" : "secondary"}>
                        {video.status}
                      </Badge>
                      <Badge variant="outline">{video.visibility}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconEye className="h-3.5 w-3.5" />
                        {video.views} views
                      </span>
                      <span>{video.likes} likes</span>
                      <span>{video.comments} comments</span>
                      <span>•</span>
                      <span>{video.uploadedAt}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <IconDots className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <IconEdit className="h-4 w-4 mr-2" />
                        Edit video details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <IconEye className="h-4 w-4 mr-2" />
                        View analytics
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <IconTrash className="h-4 w-4 mr-2" />
                        Delete video
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 