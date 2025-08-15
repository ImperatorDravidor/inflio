# Unified Ecosystem Implementation Guide

## Quick Start

This guide shows how to integrate the unified design system into your existing pages.

## 1. Update Project Views

### Using UnifiedProjectView Component

Replace existing project views with the unified component:

```tsx
// src/app/(dashboard)/projects/[id]/page.tsx
import { UnifiedProjectView } from '@/components/project/unified-project-view'

export default function ProjectPage() {
  const project = // ... fetch project data
  const user = // ... get user data
  
  return (
    <UnifiedProjectView 
      project={project}
      user={user}
      onUpdate={handleProjectUpdate}
    />
  )
}
```

## 2. Using Unified Portal for Features

### Example: Thumbnail Generator

```tsx
import { UnifiedPortal } from '@/components/ui/unified-portal'
import { Image } from 'lucide-react'

function ThumbnailFeature() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Generate Thumbnail
      </Button>
      
      <UnifiedPortal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="AI Thumbnail Generator"
        subtitle="Create stunning thumbnails"
        icon={<Image />}
        badge={{ text: 'Beta' }}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Generate</Button>
          </div>
        }
      >
        {/* Your feature content */}
      </UnifiedPortal>
    </>
  )
}
```

## 3. Using Feature Cards

### Grid Layout Example

```tsx
import { FeatureCard } from '@/components/ui/feature-card'
import { Sparkles, Video, Share2, Calendar } from 'lucide-react'

function FeatureGrid() {
  const features = [
    {
      title: "AI Thumbnails",
      description: "Generate eye-catching thumbnails",
      icon: <Sparkles />,
      gradient: "purple",
      stats: [
        { label: "Generated", value: 12, trend: "up" },
        { label: "Quality", value: "95%", trend: "up" }
      ],
      onClick: () => openThumbnailGenerator()
    },
    // ... more features
  ]
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature, i) => (
        <FeatureCard
          key={feature.title}
          {...feature}
          delay={i * 0.1}
        />
      ))}
    </div>
  )
}
```

## 4. Using Skeleton Loaders

### Data Loading States

```tsx
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton-loader'

function ProjectList() {
  const { data, isLoading } = useProjects()
  
  if (isLoading) {
    return <SkeletonList count={5} />
  }
  
  return (
    <div className="space-y-4">
      {data.map(project => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </div>
  )
}
```

## 5. Navigation Integration

### Using Unified Sidebar

```tsx
// src/app/(dashboard)/layout.tsx
import { UnifiedSidebar } from '@/components/navigation/unified-sidebar'

export default function DashboardLayout({ children }) {
  const user = useUser()
  
  return (
    <div className="flex h-screen">
      <UnifiedSidebar 
        user={user}
        credits={100}
        notifications={3}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
```

## 6. Theme System

### Initialize Theme

```tsx
// src/app/layout.tsx
import { initializeTheme } from '@/lib/theme-config'

export default function RootLayout({ children }) {
  useEffect(() => {
    initializeTheme()
  }, [])
  
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### Theme Switcher

```tsx
import { useTheme } from '@/lib/theme-config'

function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  
  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {themes.map(t => (
          <SelectItem key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

## 7. Animation Provider

### Page Transitions

```tsx
// src/app/layout.tsx
import { AnimationProvider } from '@/components/providers/animation-provider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnimationProvider>
          {children}
        </AnimationProvider>
      </body>
    </html>
  )
}
```

## 8. Design System Usage

### Animation Utilities

```tsx
import { designSystem } from '@/lib/design-system'
import { motion } from 'framer-motion'

function AnimatedCard() {
  return (
    <motion.div
      {...designSystem.animations.card}
      whileHover={designSystem.animations.card.hover}
      whileTap={designSystem.animations.card.tap}
      className="p-6 rounded-xl border"
    >
      Content
    </motion.div>
  )
}
```

### Spacing & Colors

```tsx
import { designSystem } from '@/lib/design-system'

function StyledComponent() {
  return (
    <div 
      style={{
        padding: designSystem.spacing.lg,
        borderRadius: designSystem.radii.lg,
        background: designSystem.colors.gradients.premium
      }}
    >
      Premium Content
    </div>
  )
}
```

## 9. Common Patterns

### Loading State with Portal

```tsx
<UnifiedPortal
  isOpen={isOpen}
  onClose={handleClose}
  title="Processing"
  loading={true}
  loadingMessage="Generating your content..."
>
  {/* Content shown after loading */}
</UnifiedPortal>
```

### Feature Card with Actions

```tsx
<FeatureCard
  title="Social Scheduler"
  description="Schedule posts across platforms"
  icon={<Calendar />}
  gradient="success"
  actions={[
    {
      label: "Schedule",
      onClick: handleSchedule,
      variant: "default",
      icon: <Clock />
    },
    {
      label: "View Calendar",
      onClick: handleViewCalendar,
      variant: "outline"
    }
  ]}
  isPremium
/>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05 }}
    >
      <FeatureCard {...item} />
    </motion.div>
  ))}
</div>
```

## 10. Best Practices

### 1. Consistent Spacing
- Use `designSystem.spacing` values
- Follow 8px grid system
- Use responsive spacing utilities

### 2. Animation Performance
- Use `transform` and `opacity` for animations
- Avoid animating layout properties
- Use `will-change` sparingly

### 3. Accessibility
- Ensure keyboard navigation works
- Add proper ARIA labels
- Test with screen readers

### 4. Mobile First
- Design for mobile screens first
- Use responsive utilities
- Test touch interactions

### 5. Loading States
- Always show loading skeletons
- Provide feedback for user actions
- Handle error states gracefully

## Migration Checklist

- [ ] Replace modals with UnifiedPortal
- [ ] Update cards to use FeatureCard
- [ ] Add skeleton loaders for data fetching
- [ ] Integrate UnifiedSidebar
- [ ] Initialize theme system
- [ ] Add AnimationProvider
- [ ] Update spacing to design system
- [ ] Test animations performance
- [ ] Verify mobile responsiveness
- [ ] Check accessibility

## Support

For questions about the unified ecosystem:
1. Check the design system documentation
2. Review component examples
3. Test in different themes
4. Verify cross-browser compatibility