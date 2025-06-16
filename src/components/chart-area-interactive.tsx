"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive area chart"

interface ChartData {
  day: string
  projects: number
  clips: number
  blogs: number
}

interface ChartAreaInteractiveProps {
  data?: ChartData[]
}

const chartConfig = {
  projects: {
    label: "Projects",
    color: "hsl(var(--primary))",
  },
  clips: {
    label: "Clips",
    color: "hsl(var(--chart-1))",
  },
  blogs: {
    label: "Blogs",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  // Generate default data for the current week if no data provided
  const defaultData = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date().getDay()
    
    return days.map((day, index) => ({
      day,
      projects: index <= today ? Math.floor(Math.random() * 3) + 1 : 0,
      clips: index <= today ? Math.floor(Math.random() * 10) + 2 : 0,
      blogs: index <= today ? Math.floor(Math.random() * 5) + 1 : 0,
    }))
  }, [])

  const chartData = data || defaultData

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[250px] w-full"
    >
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillProjects" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-projects)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-projects)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillClips" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-clips)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-clips)"
              stopOpacity={0.1}
            />
          </linearGradient>
          <linearGradient id="fillBlogs" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-blogs)"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="var(--color-blogs)"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="blogs"
          type="natural"
          fill="url(#fillBlogs)"
          stroke="var(--color-blogs)"
          stackId="a"
        />
        <Area
          dataKey="clips"
          type="natural"
          fill="url(#fillClips)"
          stroke="var(--color-clips)"
          stackId="a"
        />
        <Area
          dataKey="projects"
          type="natural"
          fill="url(#fillProjects)"
          stroke="var(--color-projects)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
