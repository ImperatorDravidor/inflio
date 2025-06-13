"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import {
  IconArticle,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconBrandInstagram,
  IconSearch,
  IconStar,
  IconCopy,
  IconEdit,
  IconSparkles,
  IconFileText,
  IconX
} from "@tabler/icons-react"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  preview: string
  premium?: boolean
  uses: number
}

const templates: Template[] = [
  // Blog Templates
  {
    id: "blog-1",
    name: "Tutorial Blog Post",
    description: "Perfect for step-by-step guides and how-to content",
    category: "blog",
    tags: ["tutorial", "educational", "guide"],
    preview: "# {Title}\n\n## Introduction\n{Brief introduction to the topic}\n\n## Prerequisites\n- {Prerequisite 1}\n- {Prerequisite 2}\n\n## Step 1: {Step Title}\n{Step description}\n\n## Step 2: {Step Title}\n{Step description}\n\n## Conclusion\n{Wrap up and next steps}",
    uses: 245
  },
  {
    id: "blog-2",
    name: "Product Review",
    description: "Structured template for product reviews and comparisons",
    category: "blog",
    tags: ["review", "product", "comparison"],
    preview: "# {Product Name} Review\n\n## Overview\n{Brief product introduction}\n\n## Key Features\n- {Feature 1}\n- {Feature 2}\n- {Feature 3}\n\n## Pros\n✅ {Pro 1}\n✅ {Pro 2}\n\n## Cons\n❌ {Con 1}\n❌ {Con 2}\n\n## Verdict\n{Final thoughts and rating}",
    uses: 189
  },
  {
    id: "blog-3",
    name: "Case Study",
    description: "Professional case study format for business content",
    category: "blog",
    tags: ["business", "case study", "professional"],
    preview: "# {Company/Project} Case Study\n\n## Challenge\n{Describe the problem}\n\n## Solution\n{Explain the approach}\n\n## Implementation\n{Detail the process}\n\n## Results\n- {Result 1}: {Metric}\n- {Result 2}: {Metric}\n\n## Key Takeaways\n{Lessons learned}",
    premium: true,
    uses: 78
  },
  
  // Twitter Templates
  {
    id: "twitter-1",
    name: "Thread Starter",
    description: "Engaging thread format for Twitter/X",
    category: "twitter",
    tags: ["thread", "engagement", "viral"],
    preview: "🧵 {Hook/Question that grabs attention}\n\nHere's what I learned about {topic}:\n\n1/ {First key point}\n\n2/ {Second key point}\n\n3/ {Third key point}\n\n{CTA - Like, RT, Follow}",
    uses: 567
  },
  {
    id: "twitter-2",
    name: "Announcement",
    description: "Product or news announcement template",
    category: "twitter",
    tags: ["announcement", "launch", "news"],
    preview: "🚀 Exciting news!\n\n{Announcement}\n\n✨ {Benefit 1}\n✨ {Benefit 2}\n✨ {Benefit 3}\n\n{Link/CTA}\n\n#hashtag1 #hashtag2",
    uses: 423
  },
  
  // LinkedIn Templates
  {
    id: "linkedin-1",
    name: "Professional Update",
    description: "Share career updates and achievements",
    category: "linkedin",
    tags: ["career", "professional", "update"],
    preview: "I'm thrilled to share {announcement}!\n\n{Story/Context - 2-3 sentences}\n\nKey highlights:\n• {Achievement 1}\n• {Achievement 2}\n• {Achievement 3}\n\n{Gratitude/Future outlook}\n\n{Relevant hashtags}",
    uses: 312
  },
  {
    id: "linkedin-2",
    name: "Industry Insights",
    description: "Share thought leadership content",
    category: "linkedin",
    tags: ["thought leadership", "insights", "industry"],
    preview: "{Bold statement or question}\n\nAfter {experience/research}, I've noticed {trend/insight}.\n\nHere's what this means for {industry}:\n\n1. {Implication 1}\n2. {Implication 2}\n3. {Implication 3}\n\n{Question to audience}\n\nWhat's your take?",
    premium: true,
    uses: 234
  },
  
  // Instagram Templates
  {
    id: "instagram-1",
    name: "Carousel Post",
    description: "Multi-slide educational content",
    category: "instagram",
    tags: ["carousel", "educational", "visual"],
    preview: "Slide 1: {Hook/Title}\nSlide 2: {Problem statement}\nSlide 3: {Solution/Tip 1}\nSlide 4: {Solution/Tip 2}\nSlide 5: {Solution/Tip 3}\nSlide 6: {CTA/Summary}\n\nCaption: {Engaging question} {Story} {CTA} {Hashtags}",
    uses: 445
  }
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const categories = [
    { id: "all", label: "All Templates", icon: IconFileText },
    { id: "blog", label: "Blog Posts", icon: IconArticle },
    { id: "twitter", label: "Twitter/X", icon: IconBrandTwitter },
    { id: "linkedin", label: "LinkedIn", icon: IconBrandLinkedin },
    { id: "instagram", label: "Instagram", icon: IconBrandInstagram }
  ]

  const handleUseTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.preview)
    toast.success(`${template.name} copied to clipboard!`)
    
    // TODO: Update usage count in a real app
    // This would typically involve an API call to update the usage count
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Content Templates</h1>
        <p className="text-muted-foreground">
          Pre-built templates to transform your video content faster
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search templates..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-5 w-full max-w-[600px]">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {template.premium && (
                            <Badge variant="secondary" className="gap-1">
                              <IconStar className="h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used {template.uses} times
                    </p>
                  </CardContent>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTemplate(template)
                        }}
                      >
                        <IconEdit className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseTemplate(template)
                        }}
                      >
                        <IconCopy className="h-4 w-4 mr-1" />
                        Use
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconFileText className="h-12 w-12" />}
              title="No templates found"
              description="Try adjusting your search or category filter"
              className="min-h-[400px]"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTemplate(null)}
        >
          <Card 
            className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <CardDescription>{selectedTemplate.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedTemplate(null)}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[50vh]">
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                {selectedTemplate.preview}
              </pre>
            </CardContent>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedTemplate.preview)
                    toast.success("Template copied to clipboard!")
                  }}
                >
                  <IconCopy className="h-4 w-4 mr-2" />
                  Copy Template
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    handleUseTemplate(selectedTemplate)
                    setSelectedTemplate(null)
                  }}
                >
                  <IconSparkles className="h-4 w-4 mr-2" />
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 