"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { month: "Jan", consultations: 45, "lastYear": 30 },
  { month: "Feb", consultations: 52, "lastYear": 42 },
  { month: "Mar", consultations: 68, "lastYear": 55 },
  { month: "Apr", consultations: 60, "lastYear": 58 },
  { month: "May", consultations: 75, "lastYear": 65 },
  { month: "Jun", consultations: 82, "lastYear": 70 },
]

export function ConsultationsChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
           <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Line
            type="monotone"
            dataKey="consultations"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="This Year"
          />
           <Line
            type="monotone"
            dataKey="lastYear"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Last Year"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
