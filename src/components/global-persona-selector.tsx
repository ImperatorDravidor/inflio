"use client"

import { usePersonas } from "@/contexts/persona-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { IconUser, IconPlus, IconCheck, IconChevronDown } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export function GlobalPersonaSelector() {
  const { personas, activePersona, setActivePersona } = usePersonas()
  const router = useRouter()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 px-2 h-auto py-2"
        >
          {activePersona ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={activePersona.photos[0]?.url} />
                <AvatarFallback>{getInitials(activePersona.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{activePersona.name}</p>
                <p className="text-xs text-muted-foreground">
                  {activePersona.photos.length} photos
                </p>
              </div>
              <IconChevronDown className="h-4 w-4 text-muted-foreground" />
            </>
          ) : (
            <>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <IconUser className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">No Persona</p>
                <p className="text-xs text-muted-foreground">Select or create</p>
              </div>
              <IconChevronDown className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>AI Personas</DropdownMenuLabel>
        
        {personas.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {personas.map(persona => (
              <DropdownMenuItem
                key={persona.id}
                onClick={() => setActivePersona(persona)}
                className="gap-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={persona.photos[0]?.url} />
                  <AvatarFallback className="text-xs">
                    {getInitials(persona.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{persona.name}</span>
                {persona.isDefault && (
                  <Badge variant="secondary" className="text-xs h-5">
                    Default
                  </Badge>
                )}
                {activePersona?.id === persona.id && (
                  <IconCheck className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => setActivePersona(null)}>
              <IconUser className="h-4 w-4 mr-2 text-muted-foreground" />
              Clear Selection
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => router.push('/projects?tab=personas')}
          className="text-primary"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Manage Personas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 