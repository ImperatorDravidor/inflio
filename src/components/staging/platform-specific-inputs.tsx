import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  IconHash, 
  IconAt, 
  IconLink, 
  IconClock,
  IconEye,
  IconMusic,
  IconMapPin,
  IconUsers,
  IconTag,
  IconPlus,
  IconX
} from '@tabler/icons-react'

interface PlatformSpecificInputsProps {
  platform: string
  contentType: string
  data: any
  onChange: (field: string, value: any) => void
}

export function PlatformSpecificInputs({ 
  platform, 
  contentType, 
  data, 
  onChange 
}: PlatformSpecificInputsProps) {
  const [tags, setTags] = React.useState<string[]>(data.tags || [])
  const [mentions, setMentions] = React.useState<string[]>(data.mentions || [])
  const [newTag, setNewTag] = React.useState('')
  const [newMention, setNewMention] = React.useState('')

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      const updated = [...tags, newTag]
      setTags(updated)
      onChange('tags', updated)
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    const updated = tags.filter(t => t !== tag)
    setTags(updated)
    onChange('tags', updated)
  }

  const addMention = () => {
    if (newMention && !mentions.includes(newMention)) {
      const updated = [...mentions, newMention]
      setMentions(updated)
      onChange('mentions', updated)
      setNewMention('')
    }
  }

  const removeMention = (mention: string) => {
    const updated = mentions.filter(m => m !== mention)
    setMentions(updated)
    onChange('mentions', updated)
  }

  // Instagram-specific inputs
  if (platform === 'instagram') {
    if (contentType === 'clip') {
      return (
        <div className="space-y-4">
          {/* Reel-specific options */}
          <div className="space-y-2">
            <Label>Reel Settings</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Share to Feed</Label>
                <Switch 
                  checked={data.shareToFeed || false}
                  onCheckedChange={(checked) => onChange('shareToFeed', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Enable Remix</Label>
                <Switch 
                  checked={data.enableRemix || false}
                  onCheckedChange={(checked) => onChange('enableRemix', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-normal">Add to Profile Grid</Label>
                <Switch 
                  checked={data.addToProfile || true}
                  onCheckedChange={(checked) => onChange('addToProfile', checked)}
                />
              </div>
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconMusic className="h-4 w-4" />
              Audio Track
            </Label>
            <Input 
              placeholder="Original audio or music track name"
              value={data.audioTrack || ''}
              onChange={(e) => onChange('audioTrack', e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconMapPin className="h-4 w-4" />
              Location Tag
            </Label>
            <Input 
              placeholder="Add location..."
              value={data.location || ''}
              onChange={(e) => onChange('location', e.target.value)}
            />
          </div>

          {/* Mentions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconAt className="h-4 w-4" />
              Tag People
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="@username"
                value={newMention}
                onChange={(e) => setNewMention(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMention()}
              />
              <Button size="sm" onClick={addMention}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {mentions.map(mention => (
                <Badge key={mention} variant="secondary" className="gap-1">
                  @{mention}
                  <IconX 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeMention(mention)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (contentType === 'image' || contentType === 'carousel') {
      return (
        <div className="space-y-4">
          {/* Image Alt Text */}
          <div className="space-y-2">
            <Label>Alt Text (Accessibility)</Label>
            <Textarea 
              placeholder="Describe your image for visually impaired users..."
              value={data.altText || ''}
              onChange={(e) => onChange('altText', e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Product Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconTag className="h-4 w-4" />
              Product Tags
            </Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Add product tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button size="sm" onClick={addTag}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="outline" className="gap-1">
                  {tag}
                  <IconX 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Carousel specific */}
          {contentType === 'carousel' && (
            <div className="space-y-2">
              <Label>Carousel Order</Label>
              <Select 
                value={data.carouselOrder || 'custom'}
                onValueChange={(value) => onChange('carouselOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Order</SelectItem>
                  <SelectItem value="chronological">Chronological</SelectItem>
                  <SelectItem value="engagement">By Engagement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )
    }
  }

  // X/Twitter-specific inputs
  if (platform === 'x') {
    return (
      <div className="space-y-4">
        {/* Thread Options */}
        {data.characterCount > 280 && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Convert to Thread?</p>
                  <p className="text-xs text-muted-foreground">
                    Your content exceeds 280 characters
                  </p>
                </div>
                <Switch 
                  checked={data.isThread || false}
                  onCheckedChange={(checked) => onChange('isThread', checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reply Settings */}
        <div className="space-y-2">
          <Label>Who can reply?</Label>
          <Select 
            value={data.replySettings || 'everyone'}
            onValueChange={(value) => onChange('replySettings', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="following">People you follow</SelectItem>
              <SelectItem value="mentioned">Only mentioned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quote Tweet */}
        {contentType === 'clip' && (
          <div className="space-y-2">
            <Label>Quote Tweet URL (optional)</Label>
            <Input 
              placeholder="https://twitter.com/..."
              value={data.quoteTweetUrl || ''}
              onChange={(e) => onChange('quoteTweetUrl', e.target.value)}
            />
          </div>
        )}

        {/* Poll Option */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-normal">Add Poll</Label>
          <Switch 
            checked={data.hasPoll || false}
            onCheckedChange={(checked) => onChange('hasPoll', checked)}
          />
        </div>

        {data.hasPoll && (
          <div className="space-y-2 ml-4">
            <Input 
              placeholder="Option 1"
              value={data.pollOption1 || ''}
              onChange={(e) => onChange('pollOption1', e.target.value)}
            />
            <Input 
              placeholder="Option 2"
              value={data.pollOption2 || ''}
              onChange={(e) => onChange('pollOption2', e.target.value)}
            />
            <Input 
              placeholder="Option 3 (optional)"
              value={data.pollOption3 || ''}
              onChange={(e) => onChange('pollOption3', e.target.value)}
            />
            <Input 
              placeholder="Option 4 (optional)"
              value={data.pollOption4 || ''}
              onChange={(e) => onChange('pollOption4', e.target.value)}
            />
          </div>
        )}
      </div>
    )
  }

  // LinkedIn-specific inputs
  if (platform === 'linkedin') {
    if (contentType === 'blog') {
      return (
        <div className="space-y-4">
          {/* Article Link */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconLink className="h-4 w-4" />
              Article Link
            </Label>
            <Input 
              placeholder="Link to full article..."
              value={data.articleLink || ''}
              onChange={(e) => onChange('articleLink', e.target.value)}
            />
          </div>

          {/* Post Type */}
          <div className="space-y-2">
            <Label>Post Format</Label>
            <Select 
              value={data.postFormat || 'standard'}
              onValueChange={(value) => onChange('postFormat', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Post</SelectItem>
                <SelectItem value="article">LinkedIn Article</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="event">Event Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <IconUsers className="h-4 w-4" />
              Target Audience
            </Label>
            <Select 
              value={data.targetAudience || 'public'}
              onValueChange={(value) => onChange('targetAudience', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="connections">Connections Only</SelectItem>
                <SelectItem value="group">Specific Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    // Default LinkedIn inputs
    return (
      <div className="space-y-4">
        {/* Professional Tags */}
        <div className="space-y-2">
          <Label>Industry Tags</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="Add industry tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button size="sm" onClick={addTag}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                #{tag}
                <IconX 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label>Professional CTA</Label>
          <Select 
            value={data.ctaType || 'none'}
            onValueChange={(value) => onChange('ctaType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No CTA</SelectItem>
              <SelectItem value="learn-more">Learn More</SelectItem>
              <SelectItem value="contact">Contact Me</SelectItem>
              <SelectItem value="apply">Apply Now</SelectItem>
              <SelectItem value="register">Register</SelectItem>
              <SelectItem value="download">Download</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  // Facebook-specific inputs
  if (platform === 'facebook') {
    return (
      <div className="space-y-4">
        {/* Post Type */}
        <div className="space-y-2">
          <Label>Post Type</Label>
          <Select 
            value={data.postType || 'feed'}
            onValueChange={(value) => onChange('postType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feed">Feed Post</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="reel">Reel</SelectItem>
              {contentType === 'clip' && <SelectItem value="watch">Facebook Watch</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Feeling/Activity */}
        <div className="space-y-2">
          <Label>Feeling/Activity</Label>
          <Select 
            value={data.feeling || 'none'}
            onValueChange={(value) => onChange('feeling', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="excited">😊 Feeling Excited</SelectItem>
              <SelectItem value="grateful">🙏 Feeling Grateful</SelectItem>
              <SelectItem value="celebrating">🎉 Celebrating</SelectItem>
              <SelectItem value="announcing">📢 Announcing</SelectItem>
              <SelectItem value="watching">📺 Watching</SelectItem>
              <SelectItem value="reading">📚 Reading</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audience */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <IconEye className="h-4 w-4" />
            Audience
          </Label>
          <Select 
            value={data.audience || 'public'}
            onValueChange={(value) => onChange('audience', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="friends">Friends</SelectItem>
              <SelectItem value="friends-except">Friends except...</SelectItem>
              <SelectItem value="specific">Specific friends</SelectItem>
              <SelectItem value="only-me">Only me</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Call to Action Button */}
        {(contentType === 'clip' || contentType === 'blog') && (
          <div className="space-y-2">
            <Label>Action Button</Label>
            <Select 
              value={data.actionButton || 'none'}
              onValueChange={(value) => onChange('actionButton', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Button</SelectItem>
                <SelectItem value="watch-more">Watch More</SelectItem>
                <SelectItem value="learn-more">Learn More</SelectItem>
                <SelectItem value="shop-now">Shop Now</SelectItem>
                <SelectItem value="sign-up">Sign Up</SelectItem>
                <SelectItem value="contact-us">Contact Us</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Schedule Options */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-normal">Schedule Post</Label>
            <Switch 
              checked={data.isScheduled || false}
              onCheckedChange={(checked) => onChange('isScheduled', checked)}
            />
          </div>
          {data.isScheduled && (
            <div className="ml-4 space-y-2">
              <Input 
                type="datetime-local"
                value={data.scheduledTime || ''}
                onChange={(e) => onChange('scheduledTime', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="text-sm text-muted-foreground">
      No platform-specific options available
    </div>
  )
} 