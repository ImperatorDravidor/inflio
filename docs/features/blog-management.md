# Blog Management Features

## Overview

The blog management system allows users to create, edit, duplicate, and delete AI-generated blog posts. These features provide full content control while maintaining a clean, intuitive interface.

## Key Features

### 1. Blog Generation
- **Custom Style Selection**: Choose between Professional, Casual, Technical, or Storytelling writing styles
- **Adjustable Length**: Generate posts from 500 to 3000 words
- **SEO Optimization**: Toggle SEO features including meta tags and keyword integration
- **FAQ Section**: Optionally include a frequently asked questions section
- **Image Suggestions**: Get AI-powered image ideas for your blog
- **Custom Instructions**: Add specific requirements or topics to cover

### 2. Blog Management Menu
Each blog post has a dropdown menu (⋮) with the following options:

#### Edit Post
- Navigate to the blog editor to modify content
- Preserves all metadata and settings
- Full markdown editing capabilities

#### Duplicate
- Creates a copy of the blog post with "(Copy)" appended to the title
- Generates a new unique ID
- Sets status to "draft" for the duplicate
- Useful for creating variations or templates

#### Copy Content
- Copies the entire blog content to clipboard
- Shows confirmation with green checkmark
- Useful for sharing or using in other platforms

#### Export as Markdown
- Downloads the blog post as a `.md` file
- Includes frontmatter with metadata:
  - Title, date, tags
  - SEO title and description
  - Reading time
- Perfect for static site generators or backup

#### Delete Post
- Permanently removes the blog post
- Shows confirmation dialog to prevent accidents
- Cannot be undone

### 3. Blog Display Features
- **Expandable Preview**: Show preview with "View Full Post" toggle
- **Tag Display**: Visual badges for all content tags
- **Reading Stats**: Shows reading time and word count
- **Markdown Rendering**: Full support for markdown formatting

## User Interface

### Blog Generation Dialog
```
┌─────────────────────────────────────┐
│ Generate Blog Post                  │
├─────────────────────────────────────┤
│ Writing Style:                      │
│ [Professional] [Casual]             │
│ [Technical] [Storytelling]          │
│                                     │
│ Article Length: ━━━━━━━━━━ 2000     │
│                                     │
│ ✅ SEO Optimization                 │
│ ✅ AI Image Suggestions             │
│ ✅ FAQ Section                      │
│                                     │
│ Custom Instructions:                │
│ [____________________________]      │
│                                     │
│ [Cancel]        [Generate Blog]     │
└─────────────────────────────────────┘
```

### Blog Card with Management
```
┌─────────────────────────────────────┐
│ Blog Title                    [⋮]   │
│ Blog excerpt preview text...        │
│ 5 min read • 1,234 words           │
│                                     │
│ [tag1] [tag2] [tag3]               │
│                                     │
│ Blog content preview...             │
│                                     │
│ [View Full Post]                    │
└─────────────────────────────────────┘
```

## Technical Implementation

### Database Updates
Blog posts are stored in the project's `folders.blog` array:
```javascript
{
  id: "unique-id",
  title: "Blog Title",
  content: "Full markdown content",
  excerpt: "Preview text",
  tags: ["tag1", "tag2"],
  seoTitle: "SEO optimized title",
  seoDescription: "Meta description",
  readingTime: 5,
  createdAt: "2024-01-01T00:00:00Z",
  status: "draft" | "published"
}
```

### API Integration
- **Generate**: `/api/generate-blog` with style and length options
- **Update**: Uses `ProjectService.updateProject()` to save changes
- **Delete**: Filters out the blog from folders array
- **Duplicate**: Creates new entry with updated metadata

## Best Practices

1. **Always confirm destructive actions** like deletion
2. **Auto-save drafts** when editing (future enhancement)
3. **Maintain SEO metadata** for better search visibility
4. **Use descriptive titles** for easy management
5. **Export regularly** for backup purposes

## Future Enhancements

- Revision history tracking
- Collaborative editing
- Schedule publishing
- Custom templates
- Import from external sources 