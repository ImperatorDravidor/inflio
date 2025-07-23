import { IconVideoOff } from "@tabler/icons-react"

interface VideoErrorStateProps {
  message?: string
  className?: string
}

export function VideoErrorState({ 
  message = "Video unavailable", 
  className = "" 
}: VideoErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center h-full text-gray-400 ${className}`}>
      <IconVideoOff className="h-12 w-12 mb-2" />
      <span className="text-sm">{message}</span>
    </div>
  )
}