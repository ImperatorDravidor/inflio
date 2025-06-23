"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconDownload, 
  IconCopy,
  IconCheck,
  IconMaximize,
  IconX
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface CarouselImage {
  id: string
  url: string
  prompt: string
  slideNumber: number
  totalSlides: number
  style: string
  size: string
  quality: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  carouselId: string
  onDownload?: (image: CarouselImage) => void
  onCopy?: (url: string, id: string) => void
  copiedId?: string | null
  className?: string
}

export function ImageCarousel({
  images,
  carouselId,
  onDownload,
  onCopy,
  copiedId,
  className
}: ImageCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const sortedImages = [...images].sort((a, b) => a.slideNumber - b.slideNumber)
  const currentImage = sortedImages[currentSlide]
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % sortedImages.length)
  }
  
  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }
  
  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }
  
  const handleDownload = () => {
    if (onDownload && currentImage) {
      onDownload(currentImage)
    } else if (currentImage) {
      const link = document.createElement('a')
      link.href = currentImage.url
      link.download = `carousel-${carouselId}-slide-${currentImage.slideNumber}.png`
      link.click()
    }
  }
  
  const handleCopy = () => {
    if (onCopy && currentImage) {
      onCopy(currentImage.url, currentImage.id)
    }
  }
  
  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <div className="relative">
          {/* Main Image Display */}
          <div className="relative aspect-square bg-muted">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage?.id}
                src={currentImage?.url}
                alt={`Slide ${currentImage?.slideNumber}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={previousSlide}
            >
              <IconChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={nextSlide}
            >
              <IconChevronRight className="h-5 w-5" />
            </Button>
            
            {/* Slide Counter */}
            <div className="absolute top-4 left-4">
              <Badge className="bg-black/70 text-white">
                {currentSlide + 1} / {sortedImages.length}
              </Badge>
            </div>
            
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setIsFullscreen(true)}
              >
                <IconMaximize className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handleDownload}
              >
                <IconDownload className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={handleCopy}
              >
                {copiedId === currentImage?.id ? (
                  <IconCheck className="h-4 w-4 text-green-400" />
                ) : (
                  <IconCopy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Thumbnail Strip */}
          <div className="bg-muted/50 p-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-all",
                    currentSlide === index
                      ? "ring-2 ring-primary ring-offset-2"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={image.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <p className="text-sm font-medium line-clamp-2 mb-2">
            {currentImage?.prompt}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{currentImage?.style}</Badge>
            <span>•</span>
            <span>{currentImage?.size}</span>
            <span>•</span>
            <span>{currentImage?.quality}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Fullscreen Modal */}
      {isFullscreen && currentImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              setIsFullscreen(false)
            }}
          >
            <IconX className="h-6 w-6" />
          </Button>
          
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage.id}
                src={currentImage.url}
                alt={`Slide ${currentImage.slideNumber}`}
                className="w-full h-auto max-h-[90vh] object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>
            
            {/* Navigation in fullscreen */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={previousSlide}
            >
              <IconChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={nextSlide}
            >
              <IconChevronRight className="h-6 w-6" />
            </Button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentSlide === index
                      ? "bg-white w-8"
                      : "bg-white/50 hover:bg-white/75"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
} 