# Blog Editor

## Overview
The blog editor provides a comprehensive interface for editing AI-generated blog content. It includes a markdown editor, live preview, SEO optimization tools, and export capabilities.

## Features

### 1. Content Editing
- **Markdown Editor**: Write and edit blog content using Markdown syntax
- **Formatting Toolbar**: Quick access buttons for common formatting:
  - Bold, Italic text
  - Headers (H1, H2, H3)
  - Lists (bullet and numbered)
  - Quotes
  - Links
- **Auto-save**: Content automatically saves every 5 seconds while editing
- **Word Count**: Real-time word count and reading time calculation

### 2. View Modes
Three different views available via tabs:
- **Edit**: Main editing interface with markdown
- **Preview**: Live preview of the formatted content
- **HTML**: View the generated HTML code

### 3. SEO Optimization
- **SEO Title**: Separate field for search-optimized title (60 char limit)
- **Meta Description**: SEO description field (160 char limit)
- **Tags Management**: Add and manage content tags
- **Character Counters**: Visual indicators for SEO field limits

### 4. Blog Metadata
- **Title**: Main blog post title
- **Excerpt**: Brief summary of the blog post
- **Status**: Draft or Published status indicator
- **Statistics**:
  - Word count
  - Reading time (calculated at 200 words/minute)
  - Last updated timestamp

### 5. Export Options
Multiple export formats available:
- **Markdown**: Export as .md file
- **HTML**: Export as formatted HTML
- **PDF**: Export as PDF document
- **Copy to Clipboard**: Quick copy of content

## User Interface

### Layout
- **Header**: Navigation, status badges, and action buttons
- **Main Editor**: 2/3 width on desktop, full width on mobile
- **Sidebar**: 1/3 width containing SEO settings, tags, stats, and export options

### Status Indicators
- **Draft Badge**: Gray badge indicating unpublished content
- **Published Badge**: Green badge for published content
- **Editing Badge**: Orange badge that appears when changes are made

### Action Buttons
- **Save**: Manually save changes (also auto-saves)
- **Publish**: Change status from draft to published

## Mock Data
Currently uses mock blog data about video content creation tips. In production, this would be populated with actual AI-generated content from the video processing pipeline.

## Technical Implementation

### State Management
- Uses React hooks for local state management
- Blog content stored in component state
- Auto-save implemented with useEffect and setTimeout

### Markdown Processing
Basic markdown to HTML conversion for preview:
- Headers: `#`, `##`, `###` → `<h1>`, `<h2>`, `<h3>`
- Bold: `**text**` → `<strong>text</strong>`
- Italic: `*text*` → `<em>text</em>`
- Lists: `- item` → `<li>item</li>`

### Responsive Design
- Mobile-first approach
- Sidebar moves below editor on small screens
- All buttons and inputs are touch-friendly

## Future Enhancements

1. **Rich Text Editor**: Add WYSIWYG editing option
2. **Version History**: Track and restore previous versions
3. **Collaboration**: Real-time collaborative editing
4. **AI Suggestions**: Content improvement suggestions
5. **Image Management**: Upload and manage blog images
6. **Preview Templates**: Different blog layout templates
7. **Publishing Integration**: Direct publishing to various platforms
8. **Analytics**: View performance metrics for published posts

## Usage

Access the blog editor at `/blog/editor` when logged into the dashboard. The editor will load with the generated blog content, which can then be edited, optimized for SEO, and published. 