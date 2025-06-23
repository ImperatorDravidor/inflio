# AI Carousel Generation

## Overview

The AI Carousel Generation feature allows users to create multi-slide carousels for social media platforms. Unlike generating multiple independent images, carousels are grouped together and can be navigated as a cohesive unit.

## How It Works

### 1. Carousel Selection
When choosing a carousel suggestion, users can select the number of slides:
- 3 slides (default)
- 5 slides
- 7 slides
- 10 slides

### 2. Generation Process
When generating a carousel:
1. The system creates unique prompts for each slide
2. Each slide is generated with consistent styling but varied content
3. All slides are grouped together with a unique `carouselId`
4. Slides are numbered for proper ordering

### 3. Carousel Display
Generated carousels include:
- **Navigation arrows** to move between slides
- **Thumbnail strip** for quick navigation
- **Slide counter** showing current position
- **Fullscreen mode** for detailed viewing
- **Individual slide downloads**

## Technical Implementation

### Backend Structure
```javascript
// Carousel image structure
{
  id: "unique-image-id",
  prompt: "Slide-specific prompt",
  carouselId: "carousel-group-id",
  slideNumber: 1,
  totalSlides: 5,
  type: "carousel-slide",
  // ... other image properties
}
```

### Frontend Components
- `ImageCarousel` component handles display and navigation
- Grouped rendering separates carousels from single images
- Smooth animations between slides
- Responsive design for all screen sizes

## User Benefits

1. **Coherent Storytelling**: Create narrative sequences across multiple slides
2. **Better Engagement**: Carousels typically have higher engagement rates
3. **Platform Optimization**: Perfect for Instagram, LinkedIn, and Twitter carousels
4. **Easy Management**: All slides grouped together, not scattered as individual images

## Best Practices

1. **Consistent Style**: All slides use the same visual style for cohesion
2. **Progressive Content**: Each slide builds on the previous one
3. **Clear Navigation**: Users can easily move between slides
4. **Optimal Slide Count**: 
   - 3-5 slides for quick tips
   - 7-10 slides for detailed tutorials

## Example Use Cases

- **Educational Content**: Step-by-step tutorials
- **Product Features**: Highlight different aspects
- **Before/After**: Show transformations
- **Listicles**: "Top 5 Tips" style content
- **Story Arcs**: Beginning, middle, and end narratives 