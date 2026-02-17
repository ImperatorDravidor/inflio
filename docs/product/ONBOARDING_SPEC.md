# Inflio Onboarding System - Complete Specification

## Executive Summary

The Inflio onboarding system is a premium, production-ready flow designed to gather comprehensive user information, train AI avatars, and establish detailed brand identity for AI-powered content creation. The system emphasizes meaningful data collection that directly enhances content generation quality, with sophisticated AI analysis and interactive editing capabilities.

## ⚡ PRIORITY IMPLEMENTATION TASKS

### 🔴 Critical Issues to Fix
1. **Camera functionality in AI Avatar Training** - WebRTC not initializing properly
2. **Step 2 data collection** - Current fields too basic and not saved to profile
3. **Brand analysis** - Single file limitation and no interactive editing
4. **Platform connections** - Needs better UX and actual integration

### 🟡 Major Enhancements Required
1. **Step 2: Creator Profile** - Complete redesign with comprehensive questionnaire
2. **Step 3: Brand Identity** - Live AI analysis with interactive editing sheet
3. **Step 4: AI Avatar** - Add clear guidance and fix camera issues
4. **Step 5: Platforms** - Enhanced connection flow with OAuth
5. **Remove Step 6** - AI Preferences (unnecessary)

### 🟢 Data Integration
- All onboarding data must sync with Profile page tabs
- Brand data saved to dedicated Brand tab
- Creator info saved to Profile tab
- Platform connections visible in Integrations tab

## System Architecture

### Frontend Components

#### 1. Main Onboarding Component (`premium-onboarding.tsx`)
- **Purpose**: Orchestrates the entire onboarding flow
- **Key Features**:
  - 6-step progressive flow (AI Preferences removed)
  - Auto-save to profile with real-time sync
  - Keyboard navigation support
  - Smart validation per section
  - Live AI processing feedback
  - Real-time progress tracking
  - Celebration animation on completion
- **Required Changes**:
  - Remove Step 6 (AI Preferences)
  - Enhance Step 2 with comprehensive questionnaire
  - Integrate brand analysis results editor
  - Fix camera initialization in Step 4

#### 2. AI Avatar Training Component (`ai-avatar-training.tsx`)
- **Purpose**: Capture/upload photos for AI persona training
- **Key Features**:
  - WebRTC camera capture with multiple camera support
  - Bulk photo upload (drag & drop)
  - Photo quality analysis (lighting, clarity, angle scoring)
  - Real-time photo count tracking
  - Guidelines and tips display
  - Photo gallery management with delete/download options
  - Minimum 5 photos, recommended 10, maximum 20

#### 3. Supporting Components
- `onboarding-check.tsx`: Route guard that ensures users complete onboarding
- Various step-specific components for modular organization

### Backend Services

#### 1. OnboardingService (`onboarding-service.ts`)
- **Methods**:
  - `saveProgress()`: Auto-saves form data to database
  - `loadProgress()`: Retrieves saved progress for returning users
  - `validateStep()`: Validates data per step requirements
  - `calculateCompletion()`: Tracks overall progress percentage
  - `getRecommendations()`: Provides personalized suggestions
  - `needsOnboarding()`: Checks if user requires onboarding
  - `completeOnboarding()`: Finalizes onboarding and creates user profile

#### 2. PersonaService (`persona-service.ts`)
- **Methods**:
  - `createPersona()`: Creates AI avatar record
  - `uploadPersonaImages()`: Handles image storage
  - `startTraining()`: Initiates LoRA model training
  - `getTrainingStatus()`: Monitors training progress
  - `monitorTrainingProgress()`: Real-time status updates

#### 3. API Endpoints
- **POST /api/onboarding**: Main endpoint for saving complete onboarding data
- **GET /api/onboarding**: Retrieves user profile and onboarding status
- **POST /api/analyze-brand**: Analyzes uploaded brand materials using GPT-5
- **POST /api/personas/prepare-training-images**: Prepares training data for LoRA
- **POST /api/personas/train-lora**: Initiates FAL.ai LoRA training

### Database Schema

#### Tables

##### user_profiles
```sql
- id: uuid (PK)
- clerk_user_id: text (unique)
- email: text
- full_name: text
- company_name: text
- industry: text
- onboarding_completed: boolean
- onboarding_step: integer
- onboarding_progress: jsonb
- onboarding_completed_at: timestamp
- brand_colors: jsonb
- brand_fonts: jsonb
- brand_voice: text
- content_types: text[]
- primary_platforms: text[]
- default_persona_id: uuid (FK to personas)
```

##### personas
```sql
- id: uuid (PK)
- user_id: text
- name: text
- description: text
- status: text ('pending_upload'|'preparing'|'training'|'trained'|'failed')
- model_ref: text
- training_job_id: text
- lora_model_url: text
- lora_config_url: text
- lora_trigger_phrase: text
- metadata: jsonb
```

##### persona_images
```sql
- id: uuid (PK)
- persona_id: uuid (FK)
- user_id: text
- image_url: text
- file_size: integer
- quality_score: float
- metadata: jsonb
```

## Onboarding Flow Details

### Step 1: Welcome
- **Purpose**: Introduction and expectations setting
- **Content**:
  - Hero animation with branding
  - Value propositions (5-minute setup, AI-powered, unlimited content)
  - Social proof (user count)
- **Validation**: None (informational only)
- **Data Collected**: None

### Step 2: Creator Profile (ENHANCED)
- **Purpose**: Comprehensive creator information for AI personalization
- **Implementation**: Multi-section guided questionnaire

#### Section 1: Personal Information
- **Full Name*** (required)
- **Professional Title/Role*** (required)
- **Company/Brand Name** (optional)
- **Years of Experience** (dropdown: <1, 1-3, 3-5, 5-10, 10+)
- **Profile Photo** (upload for dashboard display)

#### Section 2: Content Creator Details
- **Content Niche*** (multi-select with "Other" option):
  - Technology & Innovation
  - Business & Entrepreneurship
  - Health & Wellness
  - Education & Learning
  - Entertainment & Gaming
  - Lifestyle & Fashion
  - Food & Cooking
  - Travel & Adventure
  - Finance & Investment
  - Arts & Creative
  - Sports & Fitness
  - Parenting & Family
- **Content Experience Level**:
  - Beginner (just starting)
  - Intermediate (1-2 years)
  - Advanced (3-5 years)
  - Expert (5+ years)
- **Current Audience Size**:
  - Just starting (0-100)
  - Growing (100-1K)
  - Established (1K-10K)
  - Influencer (10K-100K)
  - Authority (100K+)

#### Section 3: Goals & Objectives
- **Primary Goal*** (required, single select):
  - Build audience from scratch
  - Accelerate growth
  - Monetize existing audience
  - Establish thought leadership
  - Generate leads for business
  - Build personal brand
- **Secondary Goals** (multi-select):
  - Increase engagement rates
  - Save time on content creation
  - Maintain consistency
  - Expand to new platforms
  - Create viral content
  - Build email list
- **Success Metrics** (what matters most):
  - Follower growth
  - Engagement rate
  - Revenue generated
  - Lead quality
  - Brand partnerships
  - Community building

#### Section 4: Content Strategy
- **Content Pillars*** (3-5 main topics, tag input):
  - Dynamic input with suggestions based on niche
  - Example: "AI Tools", "Productivity Tips", "Tech Reviews"
- **Unique Value Proposition** (textarea):
  - "What makes your content unique?"
- **Target Audience Description** (guided inputs):
  - Age range (multi-select)
  - Geographic focus (countries/regions)
  - Interests (tag input)
  - Pain points you solve (textarea)
  - Audience psychographics

#### Section 5: Current Workflow
- **Content Creation Frequency**:
  - Daily
  - 3-5 times per week
  - 1-2 times per week
  - Bi-weekly
  - Monthly
- **Time per Content Piece**:
  - <1 hour
  - 1-3 hours
  - 3-5 hours
  - 5-10 hours
  - 10+ hours
- **Biggest Challenges** (multi-select):
  - Coming up with ideas
  - Creating engaging hooks
  - Writing captions
  - Designing visuals
  - Editing videos
  - Staying consistent
  - Growing audience
  - Time management

#### Features:
- **Progress Indicator**: Shows section completion
- **Smart Suggestions**: Based on inputs, suggest relevant options
- **Profile Preview**: Live preview of how this appears in profile
- **Auto-save**: Every field saves to profile immediately
- **Skip Options**: Can skip non-required fields but shows completion %

#### Validation:
- Required fields must be completed
- Minimum 3 content pillars
- All data syncs to Profile page automatically

### Step 3: Brand Identity (COMPLETELY REDESIGNED)
- **Purpose**: Comprehensive brand analysis and configuration
- **Implementation**: AI-powered analysis with interactive editing

#### Path 1: AI Brand Analysis (Primary)
##### Upload Interface:
- **Multi-file Upload Support**:
  - Drag & drop zone for multiple files
  - Supported formats: PDF, PPT, PPTX, PNG, JPG, JPEG, SVG, AI, PSD
  - File preview grid showing all uploaded items
  - Individual file removal option
  - Total size limit: 50MB
- **Process Button**: "Analyze Brand Materials with AI"

##### Live AI Analysis Process:
```
1. Upload Detection → Show processing overlay
2. File Processing → Extract text, images, colors
3. GPT-5 Analysis → Real-time progress updates:
   - "Analyzing color palettes..." (10%)
   - "Extracting typography..." (25%)
   - "Understanding brand voice..." (40%)
   - "Identifying visual patterns..." (60%)
   - "Analyzing target audience..." (75%)
   - "Generating brand summary..." (90%)
   - "Finalizing analysis..." (100%)
```

##### AI Analysis Output - Interactive Brand Sheet:
###### 1. Brand Summary Card
- **AI-Generated Overview** (editable):
  - Brand essence statement
  - Core values identified
  - Market positioning
  - Competitive advantages
- **Edit Mode**: Click to modify any field

###### 2. Color Palette Editor
- **Primary Colors** (extracted hex codes):
  - Main brand color with hex/RGB
  - Color picker to adjust
  - Usage guidelines (AI-generated)
- **Secondary Colors**:
  - Supporting palette (3-5 colors)
  - Drag to reorder priority
- **Accent Colors**:
  - Highlight colors for CTAs
- **Color Harmony Analysis**:
  - Accessibility scores
  - Contrast ratios
  - Suggested improvements
- **Add Custom Color** button

###### 3. Typography System
- **Primary Font**:
  - Font family name
  - Font preview with alphabet
  - Weight variations found
  - Usage: Headlines, titles
- **Secondary Font**:
  - Body text font
  - Readability score
- **Font Pairing Suggestions**:
  - AI-recommended alternatives
  - Web font availability
- **Custom Font Upload** option

###### 4. Brand Voice & Tone
- **Voice Attributes** (sliders):
  - Formal ↔ Casual
  - Serious ↔ Playful
  - Respectful ↔ Irreverent
  - Matter-of-fact ↔ Enthusiastic
- **Tone Keywords** (tag cloud):
  - Extracted keywords
  - Click to remove/add
- **Writing Examples**:
  - Sample headlines
  - Caption styles
  - CTA phrases
- **Do's and Don'ts**:
  - Language to use
  - Language to avoid

###### 5. Visual Style Guide
- **Design Principles**:
  - Minimalist/Maximalist
  - Modern/Classic
  - Bold/Subtle
- **Image Style**:
  - Photography style
  - Illustration preferences
  - Icon style
- **Layout Patterns**:
  - Grid systems identified
  - Spacing rules
  - Composition preferences

###### 6. Target Audience Profile
- **Demographics**:
  - Age ranges
  - Gender distribution
  - Location focus
  - Income levels
- **Psychographics**:
  - Values and beliefs
  - Lifestyle choices
  - Pain points
  - Aspirations
- **Behavioral Patterns**:
  - Content consumption habits
  - Platform preferences
  - Engagement patterns

###### 7. Competitive Landscape
- **Identified Competitors**:
  - Direct competitors
  - Indirect competitors
  - Aspirational brands
- **Differentiation Points**:
  - Unique value props
  - Market gaps to fill

##### Interactive Editing Features:
- **Edit Mode Toggle**: Switch between view and edit
- **Undo/Redo**: Track all changes
- **Reset Section**: Revert to AI suggestions
- **Export Options**: Download as PDF/JSON
- **Save as Template**: For future projects

#### Path 2: Guided Manual Setup (On Same Page)
##### Implementation: Step-by-step questionnaire
###### Step 1: Brand Foundation
- **Brand Name**
- **Tagline/Slogan**
- **Mission Statement** (textarea)
- **Core Values** (3-5 values)
- **Brand Story** (guided prompts):
  - Why did you start?
  - What problem do you solve?
  - What's your vision?

###### Step 2: Visual Identity
- **Color Selection**:
  - Color wheel picker
  - Preset palettes by industry
  - Color psychology guidance
- **Typography Choice**:
  - Font pairing tool
  - Preview in context
- **Logo Upload**:
  - Multiple format support
  - Auto background removal

###### Step 3: Brand Personality
- **Personality Traits** (select 5):
  - Innovative, Trustworthy, Fun, Professional, etc.
- **Brand Archetype**:
  - Hero, Sage, Explorer, etc.
  - With explanations
- **Communication Style**:
  - Sentence structure preferences
  - Vocabulary level
  - Emoji usage guidelines

###### Step 4: Audience Definition
- **Ideal Customer Avatar**:
  - Name your ideal customer
  - Day in their life
  - Problems they face
  - Solutions they seek
- **Audience Segments**:
  - Primary audience
  - Secondary audiences
  - Audience to avoid

##### Features for Both Paths:
- **Save to Brand Tab**: All data syncs to profile
- **Version History**: Track brand evolution
- **Collaboration Notes**: Add team comments
- **Brand Consistency Score**: AI evaluates completeness
- **Next Steps Suggestions**: Based on gaps

#### Validation:
- Minimum requirements:
  - At least 3 brand colors
  - Primary and secondary fonts
  - Brand voice attributes
  - Target audience definition
- All data must save to Brand tab in profile

### Step 4: AI Avatar Training (ENHANCED WITH FIXES)
- **Purpose**: Create personalized AI model for thumbnails/graphics
- **Critical Fix**: Camera initialization issue

#### Implementation Requirements:

##### Camera Setup Fix:
```javascript
// Current issue: Camera stream not properly initializing
// Solution: Add proper error handling and fallbacks

1. Check browser compatibility first
2. Request permissions explicitly
3. Handle all error states:
   - Permission denied
   - No camera available
   - Camera in use
   - Browser incompatibility
4. Add loading state during initialization
5. Implement retry mechanism
```

##### Enhanced UI/UX:

###### Welcome Screen (Before Camera):
- **Title**: "Create Your AI Avatar"
- **Explanation Card**:
  ```
  Your AI avatar will be used to:
  ✓ Generate professional thumbnails
  ✓ Create social media graphics
  ✓ Maintain consistent brand presence
  ✓ Save hours on photo shoots
  ```
- **Requirements Checklist**:
  □ Good lighting (near window or bright room)
  □ Plain or consistent background
  □ 5-20 photos for best results
  □ Different angles and expressions
- **Privacy Notice**:
  "Your photos are encrypted and used only for AI training"
- **Two Start Options**:
  - "Use Camera" (primary button)
  - "Upload Photos" (secondary button)

###### Camera Interface Improvements:
- **Guided Overlay**:
  - Face position guide (oval outline)
  - Grid for composition
  - Lighting indicator (green/yellow/red)
  - Angle suggestion ("Turn slightly left")
- **Photo Counter**:
  - Large, visible progress (3/10 photos)
  - Quality score per photo
  - "Great shot!" feedback
- **Instructions Panel**:
  - Current: "Look straight ahead"
  - Next: "Turn to your left (3/4 profile)"
  - Tips updating based on photos taken
- **Controls**:
  - Capture button with countdown option
  - Retake last photo
  - Switch camera (front/back)
  - Toggle flash (if available)
  - Grid toggle
  - Timer (3s, 10s)

###### Photo Review Gallery:
- **Quality Indicators**:
  - ⭐⭐⭐ Excellent
  - ⭐⭐ Good
  - ⭐ Needs improvement
- **Suggestions per photo**:
  - "Lighting is perfect"
  - "Try moving closer to light source"
  - "Great angle variety"
- **Bulk Actions**:
  - Select multiple to delete
  - Download all as backup
  - Auto-remove low quality

###### Upload Interface:
- **Drag & Drop Zone**:
  - Accept multiple files at once
  - Show upload progress per file
  - Auto-orient images
  - Compress if needed
- **Smart Detection**:
  - Face detection validation
  - Auto-reject group photos
  - Blur detection
  - Duplicate detection

##### Training Process Visualization:
- **Pre-Training**:
  - "Analyzing photo quality..."
  - "Optimizing for AI training..."
  - "Preparing training data..."
- **During Training** (if user waits):
  - Animated progress bar
  - Estimated time remaining
  - "What happens next" explanation
  - Option to continue in background
- **Post-Training**:
  - Email notification when ready
  - Dashboard notification
  - Sample generations preview

##### Help & Guidance:
- **Tutorial Video**: "How to take perfect avatar photos"
- **Common Issues**:
  - Camera not working? → Troubleshooting steps
  - Photos rejected? → Quality guidelines
  - Training failed? → Support contact
- **FAQ Dropdown**:
  - Why do you need multiple photos?
  - How is my data protected?
  - Can I retrain later?
  - What is LoRA training?

#### Validation:
- Minimum 5 photos required
- Option to skip (but explain limitations)
- Quality threshold for training
- All photos must contain single person

### Step 5: Platform Connections (IMPROVED)
- **Purpose**: Configure content distribution channels

#### Enhanced Platform Cards:
Each platform displayed as interactive card with:

##### Card Layout:
- **Platform Header**:
  - Logo (larger, 48x48px)
  - Name and verification badge
  - "Connect" toggle switch
- **Engagement Stats**:
  - Active users (with growth indicator)
  - Average engagement rate
  - Best posting times
  - Content format support icons
- **Your Fit Score**: AI-calculated based on:
  - Your niche alignment
  - Audience demographics
  - Content type match
  - Show as percentage with color coding
- **Quick Stats When Connected**:
  - Current followers (if available)
  - Growth rate
  - Top performing content type

##### Connection Flow:
###### Option 1: OAuth Integration (Preferred)
```
User clicks "Connect" → 
OAuth popup → 
Authorize access → 
Fetch basic stats → 
Show "Connected ✓"
```

###### Option 2: Manual Username
- Input field for username/handle
- Validate format per platform
- Attempt to fetch public stats
- Save for future reference

##### Platform-Specific Features:

###### YouTube:
- **Content Types**: Long-form, Shorts, Live
- **Monetization**: AdSense, Memberships, Super Thanks
- **Analytics Preview**: Views, Watch time, Subscribers
- **AI Features**: Auto-chapters, Thumbnail generation

###### Instagram:
- **Content Types**: Posts, Reels, Stories, IGTV
- **Monetization**: Shopping, Branded content, Subscriptions
- **Analytics Preview**: Reach, Engagement, Demographics
- **AI Features**: Hashtag optimization, Best times

###### TikTok:
- **Content Types**: Short videos, Live, Stories
- **Monetization**: Creator Fund, Live gifts, Shop
- **Analytics Preview**: Views, Completion rate, Shares
- **AI Features**: Trend detection, Sound selection

###### LinkedIn:
- **Content Types**: Articles, Posts, Videos, Events
- **Monetization**: Creator Accelerator, Newsletter
- **Analytics Preview**: Impressions, Engagement, Followers
- **AI Features**: Professional tone, B2B optimization

###### X (Twitter):
- **Content Types**: Posts, Threads, Spaces
- **Monetization**: Super Follows, Ticketed Spaces
- **Analytics Preview**: Impressions, Engagement rate
- **AI Features**: Thread optimization, Trend hijacking

###### Facebook:
- **Content Types**: Posts, Videos, Stories, Reels
- **Monetization**: Creator Bonus, Stars, Subscriptions
- **Analytics Preview**: Reach, Engagement, Demographics
- **AI Features**: Group targeting, Event promotion

##### Smart Recommendations:
- **Suggested Platforms** (based on profile):
  - "Based on your tech niche, we recommend LinkedIn and Twitter"
  - "Your visual content style is perfect for Instagram and TikTok"
- **Platform Synergy Score**:
  - Show how platforms work together
  - Cross-posting opportunities
  - Audience overlap analysis

##### Post-Connection Features:
- **Content Calendar Preview**:
  - Optimal posting schedule
  - Platform-specific timing
- **Quick Settings**:
  - Auto-post enabled/disabled
  - Notification preferences
  - Content approval required
- **Integration Status**:
  - Green: Fully connected
  - Yellow: Limited access
  - Red: Connection failed

#### Validation:
- At least one platform required
- Show warning if no platforms connected
- Explain limitations without connections

### Step 6: Launch (Previously Step 7)
- **Purpose**: Completion celebration and dashboard redirect
- **Features**:
  - Success animation with brand colors
  - Personalized summary:
    ```
    ✓ Profile: 100% complete
    ✓ Brand: Fully configured
    ✓ AI Avatar: Training in progress
    ✓ Platforms: X connected
    ```
  - Next steps checklist:
    - Upload your first video
    - Review AI-generated content
    - Schedule your posts
    - Explore templates
  - Confetti celebration
  - "Go to Dashboard" primary CTA
  - "Take a Tour" secondary option
- **Actions**:
  - All data saved to respective profile tabs
  - Persona training initiated if photos provided
  - Platform tokens stored securely
  - Welcome email triggered
  - Dashboard redirect with onboarding=complete flag

## Implementation Requirements

### Database Schema Updates

#### user_profiles table (enhanced):
```sql
-- Additional columns needed:
- professional_title: text
- years_experience: text
- content_niche: text[]
- audience_size: text
- content_pillars: jsonb
- unique_value_prop: text
- target_audience_details: jsonb
- content_frequency: text
- creation_time_per_piece: text
- biggest_challenges: text[]
- success_metrics: text[]
```

#### brand_profiles table (new):
```sql
- id: uuid (PK)
- user_id: text (FK)
- brand_summary: jsonb
- color_palette: jsonb
- typography_system: jsonb
- brand_voice: jsonb
- visual_style: jsonb
- target_audience: jsonb
- competitive_landscape: jsonb
- ai_analysis_raw: jsonb
- manual_overrides: jsonb
- version: integer
- created_at: timestamp
- updated_at: timestamp
```

#### platform_connections table (enhanced):
```sql
- id: uuid (PK)
- user_id: text (FK)
- platform: text
- handle: text
- oauth_token: text (encrypted)
- refresh_token: text (encrypted)
- connection_status: text
- follower_count: integer
- engagement_rate: float
- last_synced: timestamp
- settings: jsonb
```

### API Endpoints Required

#### Brand Analysis:
- **POST /api/brand/analyze-multiple**:
  - Accept multiple files
  - Stream progress updates via SSE
  - Return comprehensive analysis
- **POST /api/brand/save**:
  - Save edited brand sheet
  - Version control
- **GET /api/brand/templates**:
  - Industry-specific templates

#### Profile Management:
- **POST /api/profile/creator**:
  - Save creator profile data
  - Validate required fields
- **GET /api/profile/completeness**:
  - Calculate profile completion
  - Return missing fields

#### Platform Integration:
- **POST /api/platforms/oauth/[platform]**:
  - Handle OAuth flow
  - Store tokens securely
- **GET /api/platforms/stats/[platform]**:
  - Fetch platform statistics
  - Cache for performance

### Frontend Components to Create/Update

#### Step 2 - Creator Profile:
```tsx
// components/onboarding/creator-profile-step.tsx
- MultiSectionForm component
- ProgressIndicator component
- SmartSuggestions component
- ProfilePreview component
- AutoSaveIndicator component
```

#### Step 3 - Brand Identity:
```tsx
// components/onboarding/brand-identity-step.tsx
- MultiFileUploader component
- AIAnalysisProgress component
- InteractiveBrandSheet component
- ColorPaletteEditor component
- TypographyEditor component
- BrandVoiceEditor component
- ManualBrandSetup component
```

#### Step 4 - AI Avatar:
```tsx
// components/onboarding/ai-avatar-training.tsx (fix)
- CameraPermissionHandler component
- GuidedCameraInterface component
- PhotoQualityAnalyzer component
- TrainingProgressVisualizer component
```

#### Step 5 - Platforms:
```tsx
// components/onboarding/platform-connections.tsx
- EnhancedPlatformCard component
- OAuthHandler component
- PlatformStatsDisplay component
- ConnectionStatus component
```

### Critical Fixes

#### Camera Initialization Fix:
```javascript
const initializeCamera = async () => {
  try {
    // 1. Check if getUserMedia is supported
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera API not supported in this browser');
    }
    
    // 2. Request permissions explicitly
    const permissions = await navigator.permissions.query({ name: 'camera' });
    
    if (permissions.state === 'denied') {
      throw new Error('Camera permission denied. Please enable in browser settings.');
    }
    
    // 3. Get media stream with proper constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        facingMode: 'user',
        frameRate: { ideal: 30, min: 15 }
      },
      audio: false
    });
    
    // 4. Attach to video element and play
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      setCameraStream(stream);
    }
  } catch (error) {
    console.error('Camera initialization failed:', error);
    handleCameraError(error);
  }
};
```

#### Profile Data Sync:
```javascript
// Ensure all onboarding data syncs to profile tabs
const syncToProfile = async (data: OnboardingData) => {
  const updates = {
    // Creator tab
    creator_info: {
      full_name: data.fullName,
      title: data.professionalTitle,
      company: data.companyName,
      niche: data.contentNiche,
      pillars: data.contentPillars,
      // ... rest of creator data
    },
    // Brand tab
    brand_info: {
      colors: data.brandColors,
      fonts: data.typography,
      voice: data.brandVoice,
      // ... rest of brand data
    },
    // Integrations tab
    platforms: data.platformConnections
  };
  
  await updateUserProfile(userId, updates);
};
```

## Technical Implementation Details

### State Management
- Uses React hooks (useState, useEffect, useCallback)
- Form data stored in single state object
- Auto-save triggered on data changes (1-second debounce)
- Progress tracked separately from form data

### Animation System
- Framer Motion for all animations
- Consistent animation presets from design system
- Page transitions, micro-interactions, loading states
- Celebration confetti on completion

### Validation System
- Per-step validation before progression
- Real-time field validation with visual feedback
- Errors prevent forward navigation
- Warnings shown but don't block progression

### Data Persistence
- Auto-save to Supabase every 1 second after changes
- Progress restored on page refresh
- Completed data saved via API endpoint
- Profile creation atomic with all related data

### Error Handling
- Camera access errors handled gracefully
- Upload failures with retry options
- Training failures logged but don't block completion
- Network errors with offline capability

## AI Integration Points

### 1. Brand Analysis (GPT-5)
- **Endpoint**: `/api/analyze-brand`
- **Input**: Brand book file (PDF/PPT/images)
- **Output**: Extracted brand elements
  - Colors (primary, secondary, accent)
  - Typography (fonts)
  - Voice (tone, personality)
  - Audience demographics
  - Visual style

### 2. LoRA Training (FAL.ai)
- **Endpoint**: `/api/personas/train-lora`
- **Input**: 5-20 photos + trigger phrase
- **Configuration**:
  - Learning rate: 0.00009
  - Steps: 2500
  - Multiresolution training: enabled
  - Subject crop: enabled
- **Output**: Trained LoRA model URL

### 3. Image Generation (Stable Diffusion)
- **Model**: Uses trained LoRA for personalized generation
- **Integration**: Post-onboarding content creation
- **Trigger phrase**: Custom per user (e.g., "photo of [name]")

## User Experience Optimizations

### Progressive Disclosure
- Information collected only when needed
- Complex settings hidden initially
- Smart defaults reduce decision fatigue
- Skip options for non-critical steps

### Visual Feedback
- Real-time progress bar
- Step indicators
- Success states for completed sections
- Quality indicators for photos
- Loading states for async operations

### Accessibility Features
- Keyboard navigation
- ARIA labels
- Focus management
- High contrast support
- Screen reader compatibility

### Mobile Responsiveness
- Touch-optimized controls
- Camera switching for mobile devices
- Responsive grid layouts
- Bottom sheet patterns for mobile

## Performance Considerations

### Optimization Strategies
- Image compression for uploads
- Lazy loading for heavy components
- Debounced auto-save
- Optimistic UI updates
- Background processing for training

### Caching
- LocalStorage for temporary data
- Supabase caching for API responses
- Image caching for uploaded photos
- Progress state persistence

## Security & Privacy

### Data Protection
- Clerk authentication required
- Row-level security in Supabase
- Secure file uploads
- GDPR-compliant data handling

### Consent Management
- Media release agreement
- Content repurposing consent
- Privacy policy acceptance
- Data usage transparency

## Areas for Enhancement

### 1. User Experience Improvements
- **Progress Recovery**: Better handling of interrupted sessions
- **Bulk Operations**: Multiple photo selection/deletion
- **Templates**: More industry-specific templates
- **Previews**: Live preview of AI capabilities
- **Tutorials**: Interactive tutorials per step

### 2. Technical Improvements
- **Performance**: Code splitting for faster initial load
- **Offline Support**: Complete offline capability with sync
- **Error Recovery**: More robust error handling and recovery
- **Analytics**: Detailed funnel analytics for optimization

### 3. Feature Additions
- **Social Login**: Import data from social platforms
- **Team Onboarding**: Multi-user/agency support
- **Migration Tools**: Import from competitors
- **A/B Testing**: Test different onboarding flows
- **Personalization**: ML-based flow optimization

### 4. AI Enhancements
- **Better Photo Analysis**: ML-based quality scoring
- **Auto-Cropping**: Smart photo preparation
- **Style Transfer**: Apply brand style to photos
- **Voice Cloning**: Audio persona training
- **Multi-Modal**: Video persona training

### 5. Integration Expansions
- **More Platforms**: Pinterest, Threads, etc.
- **CRM Integration**: HubSpot, Salesforce sync
- **Analytics Tools**: Google Analytics, Mixpanel
- **Design Tools**: Figma, Canva integration
- **Calendar Integration**: Content scheduling

## Metrics & Success Criteria

### Key Metrics
- **Completion Rate**: Target >85%
- **Time to Complete**: Target 10-15 minutes (quality over speed)
- **Creator Profile Completion**: Target >90%
- **Brand Analysis Usage**: Target >70%
- **Photo Upload Rate**: Target >60%
- **Platform Connection Rate**: Target >90%
- **Profile Tab Population**: 100% sync rate

### Quality Metrics
- **Photo Quality Score**: Average >0.75
- **Training Success Rate**: Target >95%
- **Profile Completeness**: Target >85%
- **Template Usage**: Target >70%

## Technical Dependencies

### External Services
- **Clerk**: Authentication and user management
- **Supabase**: Database and file storage
- **FAL.ai**: LoRA model training
- **OpenAI GPT-5**: Brand analysis and content generation
- **Stable Diffusion**: Image generation
- **Vercel**: Hosting and edge functions

### NPM Packages
- **framer-motion**: Animations
- **react-hook-form**: Form management
- **zod**: Schema validation
- **canvas-confetti**: Celebration effects
- **sonner**: Toast notifications

## Migration Considerations

### Database Migrations Required
1. `fix-onboarding-errors.sql`: Adds onboarding progress columns
2. `setup-persona-storage.sql`: Creates persona tables
3. `add-persona-lora-storage.sql`: Adds LoRA model fields

### Breaking Changes
- None currently (backward compatible)

## Support & Documentation

### User Documentation Needed
- Step-by-step guide with screenshots
- Photo guidelines document
- Brand book preparation guide
- Platform connection tutorials
- FAQ section

### Developer Documentation
- API endpoint documentation
- Component prop documentation
- Service method documentation
- Database schema documentation
- Deployment guide

## Implementation Timeline

### Phase 1: Critical Fixes (Week 1)
- [ ] Fix camera initialization in AI Avatar step
- [ ] Remove AI Preferences step from flow
- [ ] Update step numbering and navigation
- [ ] Fix profile data sync issues

### Phase 2: Creator Profile Enhancement (Week 2)
- [ ] Implement comprehensive questionnaire
- [ ] Add smart suggestions based on inputs
- [ ] Create profile preview component
- [ ] Ensure data saves to Profile tab

### Phase 3: Brand Identity Overhaul (Week 3-4)
- [ ] Build multi-file upload interface
- [ ] Implement GPT-5 live analysis with progress
- [ ] Create interactive brand sheet editor
- [ ] Build manual questionnaire flow
- [ ] Add save to Brand tab functionality

### Phase 4: Platform & Avatar Polish (Week 5)
- [ ] Enhance platform connection cards
- [ ] Add OAuth integration where possible
- [ ] Improve avatar training guidance
- [ ] Add help documentation

### Phase 5: Testing & Launch (Week 6)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Deploy to production

## Success Criteria

### Must Have:
- ✅ Camera works reliably across browsers
- ✅ All data saves to appropriate profile tabs
- ✅ Brand analysis produces actionable results
- ✅ Creator profile captures meaningful data
- ✅ Platform connections functional

### Should Have:
- ✅ Live progress updates during AI analysis
- ✅ Interactive editing of brand elements
- ✅ Smart suggestions throughout flow
- ✅ Comprehensive help documentation

### Nice to Have:
- ✅ OAuth for all platforms
- ✅ Advanced photo quality analysis
- ✅ A/B testing framework
- ✅ Analytics integration

## Conclusion

This enhanced specification transforms the Inflio onboarding from a basic prototype into a production-ready, premium experience. The focus shifts from quick completion to meaningful data collection that directly improves AI content generation quality. By implementing comprehensive questionnaires, live AI analysis, and proper data persistence to profile tabs, users will have a solid foundation for their content creation journey.

## ✅ SPECIFICATION COMPLETE

This document now contains:
1. **Detailed requirements** for each onboarding step
2. **Technical implementation** specifications
3. **Database schema** updates needed
4. **API endpoints** to build
5. **Frontend components** to create
6. **Critical fixes** with code examples
7. **Implementation timeline** with phases
8. **Success criteria** for launch

Ready for development team to begin implementation.
