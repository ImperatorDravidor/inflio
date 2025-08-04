"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImprovedCampaignStudio } from "./improved-campaign-studio"
import { SocialGraphicsGenerator } from "./social-graphics-generator"
import {
  IconPhoto,
  IconRocket,
  IconAlertCircle
} from "@tabler/icons-react"

interface SimplifiedGraphicsTabProps {
  project: any
  selectedPersona?: any
  contentAnalysis?: any
  onUpdate: () => void
}

export function SimplifiedGraphicsTab({
  project,
  selectedPersona,
  contentAnalysis,
  onUpdate
}: SimplifiedGraphicsTabProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "ai-campaign">("manual")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Social Media Studio</h2>
        <p className="text-muted-foreground">
          Transform your video into social media content
        </p>
      </div>

      {/* Mode Selection */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="gap-2">
            <IconPhoto className="h-4 w-4" />
            Manual Graphics
          </TabsTrigger>
          <TabsTrigger value="ai-campaign" className="gap-2">
            <IconRocket className="h-4 w-4" />
            AI Campaign
          </TabsTrigger>
        </TabsList>

        {/* Mode Description */}
        <Alert className="mt-4">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            {activeTab === "manual" ? (
              <>
                <strong>Manual Mode:</strong> Create custom graphics one at a time with full control over design and text.
              </>
            ) : (
              <>
                <strong>AI Campaign Mode:</strong> Let AI analyze your video and generate a complete social media campaign with 6-9 posts using GPT-4.1.
              </>
            )}
          </AlertDescription>
        </Alert>

        {/* Manual Mode */}
        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Graphics</CardTitle>
            </CardHeader>
            <CardContent>
              <SocialGraphicsGenerator
                projectId={project.id}
                projectTitle={project.title}
                contentAnalysis={contentAnalysis}
                selectedPersona={selectedPersona}
                onGraphicsGenerated={(graphics) => {
                  onUpdate()
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Campaign Mode */}
        <TabsContent value="ai-campaign" className="mt-6">
          <ImprovedCampaignStudio
            project={project}
            transcription={project.transcription}
            onUpdate={onUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 