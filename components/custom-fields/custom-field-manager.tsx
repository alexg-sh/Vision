"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, GripVertical, Save } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

type FieldType = "text" | "number" | "select" | "checkbox" | "date"

interface CustomField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: string[] // For select fields
  defaultValue?: string | number | boolean
}

export default function CustomFieldManager() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [newField, setNewField] = useState<Partial<CustomField>>({
    type: "text",
    required: false,
  })

  const handleAddField = () => {
    if (!newField.label) return

    const field: CustomField = {
      id: `field-${Date.now()}`,
      label: newField.label || "Untitled Field",
      type: (newField.type as FieldType) || "text",
      required: newField.required || false,
      placeholder: newField.placeholder,
      options: newField.type === "select" ? newField.options || ["Option 1"] : undefined,
      defaultValue: newField.defaultValue,
    }

    setFields([...fields, field])
    setNewField({
      type: "text",
      required: false,
    })
  }

  const handleUpdateField = (id: string, updates: Partial<CustomField>) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return { ...field, ...updates }
        }
        return field
      }),
    )
  }

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFields(items)
  }

  const handleAddOption = (fieldId: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId) {
          const options = field.options || []
          return {
            ...field,
            options: [...options, `Option ${options.length + 1}`],
          }
        }
        return field
      }),
    )
  }

  const handleUpdateOption = (fieldId: string, optionIndex: number, value: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          newOptions[optionIndex] = value
          return {
            ...field,
            options: newOptions,
          }
        }
        return field
      }),
    )
  }

  const handleDeleteOption = (fieldId: string, optionIndex: number) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          newOptions.splice(optionIndex, 1)
          return {
            ...field,
            options: newOptions,
          }
        }
        return field
      }),
    )
  }

  const handleSaveFields = () => {
    // In a real app, this would save to your backend
    console.log("Saving fields:", fields)
    alert("Custom fields saved successfully!")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
          <CardDescription>
            Add custom fields to collect specific information when users submit feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-label">Field Label</Label>
                <Input
                  id="field-label"
                  value={newField.label || ""}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="e.g., Priority Level"
                />
              </div>
              <div>
                <Label htmlFor="field-type">Field Type</Label>
                <Select
                  value={newField.type || "text"}
                  onValueChange={(value) => setNewField({ ...newField, type: value as FieldType })}
                >
                  <SelectTrigger id="field-type">
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="field-placeholder">Placeholder (optional)</Label>
                <Input
                  id="field-placeholder"
                  value={newField.placeholder || ""}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  placeholder="e.g., Enter priority level"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="field-required"
                  checked={newField.required || false}
                  onCheckedChange={(checked) => setNewField({ ...newField, required: checked })}
                />
                <Label htmlFor="field-required">Required field</Label>
              </div>
            </div>

            {newField.type === "select" && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {(newField.options || ["Option 1"]).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={option}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            options: (newField.options || []).map((opt, i) => (i === index ? e.target.value : opt)),
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOptions = [...(newField.options || [])]
                          newOptions.splice(index, 1)
                          setNewField({ ...newField, options: newOptions })
                        }}
                        disabled={(newField.options || []).length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNewField({
                        ...newField,
                        options: [...(newField.options || []), `Option ${(newField.options || []).length + 1}`],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={handleAddField} disabled={!newField.label}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Field Order</h3>
            {fields.length === 0 ? (
              <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground">
                No custom fields added yet. Add your first field above.
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className="border rounded-md p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{field.label}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {field.type.charAt(0).toUpperCase() + field.type.slice(1)}
                                      {field.required ? " • Required" : ""}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditing(isEditing === field.id ? null : field.id)}
                                  >
                                    {isEditing === field.id ? "Done" : "Edit"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteField(field.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {isEditing === field.id && (
                                <div className="mt-4 space-y-4 pt-4 border-t">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`edit-label-${field.id}`}>Field Label</Label>
                                      <Input
                                        id={`edit-label-${field.id}`}
                                        value={field.label}
                                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor={`edit-type-${field.id}`}>Field Type</Label>
                                      <Select
                                        value={field.type}
                                        onValueChange={(value) =>
                                          handleUpdateField(field.id, { type: value as FieldType })
                                        }
                                      >
                                        <SelectTrigger id={`edit-type-${field.id}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text">Text</SelectItem>
                                          <SelectItem value="number">Number</SelectItem>
                                          <SelectItem value="select">Dropdown</SelectItem>
                                          <SelectItem value="checkbox">Checkbox</SelectItem>
                                          <SelectItem value="date">Date</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor={`edit-placeholder-${field.id}`}>Placeholder</Label>
                                      <Input
                                        id={`edit-placeholder-${field.id}`}
                                        value={field.placeholder || ""}
                                        onChange={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2 pt-6">
                                      <Switch
                                        id={`edit-required-${field.id}`}
                                        checked={field.required}
                                        onCheckedChange={(checked) =>
                                          handleUpdateField(field.id, { required: checked })
                                        }
                                      />
                                      <Label htmlFor={`edit-required-${field.id}`}>Required field</Label>
                                    </div>
                                  </div>

                                  {field.type === "select" && (
                                    <div>
                                      <Label>Options</Label>
                                      <div className="space-y-2 mt-2">
                                        {(field.options || []).map((option, optionIndex) => (
                                          <div key={optionIndex} className="flex items-center space-x-2">
                                            <Input
                                              value={option}
                                              onChange={(e) =>
                                                handleUpdateOption(field.id, optionIndex, e.target.value)
                                              }
                                            />
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleDeleteOption(field.id, optionIndex)}
                                              disabled={(field.options || []).length <= 1}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                        <Button variant="outline" size="sm" onClick={() => handleAddOption(field.id)}>
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Option
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSaveFields} disabled={fields.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save Custom Fields
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
