"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomField {
  id: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "date"
  required: boolean
  placeholder?: string
  options?: string[]
  defaultValue?: string | number | boolean
}

interface CustomFieldRendererProps {
  fields: CustomField[]
  values: Record<string, any>
  onChange: (id: string, value: any) => void
}

export default function CustomFieldRenderer({ fields, values, onChange }: CustomFieldRendererProps) {
  if (!fields || fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.id}
              placeholder={field.placeholder}
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.required}
            />
          )}

          {field.type === "number" && (
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={values[field.id] || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.required}
            />
          )}

          {field.type === "select" && field.options && (
            <Select
              value={values[field.id] || ""}
              onValueChange={(value) => onChange(field.id, value)}
              required={field.required}
            >
              <SelectTrigger id={field.id}>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.type === "checkbox" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={values[field.id] || false}
                onCheckedChange={(checked) => onChange(field.id, checked)}
                required={field.required}
              />
              <label
                htmlFor={field.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.placeholder || "Yes"}
              </label>
            </div>
          )}

          {field.type === "date" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !values[field.id] && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {values[field.id] ? format(new Date(values[field.id]), "PPP") : field.placeholder || "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={values[field.id] ? new Date(values[field.id]) : undefined}
                  onSelect={(date) => onChange(field.id, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      ))}
    </div>
  )
}
