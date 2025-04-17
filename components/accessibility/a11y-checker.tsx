"use client"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Eye, Keyboard, Paintbrush, X } from "lucide-react"

interface A11yIssue {
  id: string
  type: "error" | "warning" | "info"
  message: string
  element: string
  impact: "critical" | "serious" | "moderate" | "minor"
  rule: string
  help: string
  helpUrl?: string
}

export default function AccessibilityChecker() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [issues, setIssues] = useState<A11yIssue[]>([])
  const [activeTab, setActiveTab] = useState<"issues" | "contrast" | "keyboard">("issues")

  const runAccessibilityScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    setIssues([])

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsScanning(false)
          // Generate mock issues after scan completes
          generateMockIssues()
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const generateMockIssues = () => {
    // In a real app, this would be the result of an actual accessibility scan
    const mockIssues: A11yIssue[] = [
      {
        id: "1",
        type: "error",
        message: "Images must have alternate text",
        element: '<img src="/logo.png">',
        impact: "critical",
        rule: "image-alt",
        help: "Add alt attribute to image",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/image-alt",
      },
      {
        id: "2",
        type: "error",
        message: "Button has no accessible name",
        element: '<button class="close-btn"></button>',
        impact: "serious",
        rule: "button-name",
        help: "Add text content to button or aria-label attribute",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/button-name",
      },
      {
        id: "3",
        type: "warning",
        message: "Color contrast is insufficient",
        element: '<p class="text-gray-400">Low contrast text</p>',
        impact: "serious",
        rule: "color-contrast",
        help: "Increase contrast between text and background",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/color-contrast",
      },
      {
        id: "4",
        type: "warning",
        message: "Heading levels should only increase by one",
        element: "<h1>Title</h1> <h3>Subtitle</h3>",
        impact: "moderate",
        rule: "heading-order",
        help: "Use h2 instead of h3 after h1",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/heading-order",
      },
      {
        id: "5",
        type: "info",
        message: "ARIA attributes must conform to valid values",
        element: '<div aria-labeledby="label">Content</div>',
        impact: "moderate",
        rule: "aria-valid-attr",
        help: "Use aria-labelledby instead of aria-labeledby",
        helpUrl: "https://dequeuniversity.com/rules/axe/4.4/aria-valid-attr",
      },
    ]

    setIssues(mockIssues)
  }

  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "info":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getIssueTypeBadge = (type: string) => {
    switch (type) {
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "warning":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Info</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>
      case "serious":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Serious</Badge>
      case "moderate":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Moderate</Badge>
      case "minor":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Minor</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 gap-2"
      >
        <AlertCircle className="h-4 w-4" />
        Accessibility Checker
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Accessibility Checker</CardTitle>
                <CardDescription>Check your page for accessibility issues</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1">
              <div className="px-6">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="issues" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Issues</span>
                    {issues.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {issues.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="contrast" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Contrast</span>
                  </TabsTrigger>
                  <TabsTrigger value="keyboard" className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    <span>Keyboard</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-auto px-6">
                <TabsContent value="issues" className="h-full">
                  {isScanning ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-full max-w-md space-y-4">
                        <p className="text-center">Scanning page for accessibility issues...</p>
                        <Progress value={scanProgress} className="w-full" />
                        <p className="text-center text-sm text-muted-foreground">{scanProgress}% complete</p>
                      </div>
                    </div>
                  ) : issues.length > 0 ? (
                    <div className="space-y-4">
                      {issues.map((issue) => (
                        <div key={issue.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getIssueTypeIcon(issue.type)}
                              <span className="font-medium">{issue.message}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {getIssueTypeBadge(issue.type)}
                              {getImpactBadge(issue.impact)}
                            </div>
                          </div>
                          <div className="bg-muted p-2 rounded-md mb-2 overflow-x-auto">
                            <code className="text-sm">{issue.element}</code>
                          </div>
                          <p className="text-sm mb-2">{issue.help}</p>
                          {issue.helpUrl && (
                            <a
                              href={issue.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Learn more about {issue.rule}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-center space-y-2">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <h3 className="text-lg font-medium">No issues detected</h3>
                        <p className="text-muted-foreground">
                          Click "Run Scan" to check your page for accessibility issues.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contrast" className="h-full">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Color Contrast Checker</h3>
                      <p className="text-muted-foreground mb-4">
                        Check if your text colors meet WCAG 2.1 contrast requirements.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Foreground Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded border bg-[#000000]"></div>
                            <Input defaultValue="#000000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded border bg-[#FFFFFF]"></div>
                            <Input defaultValue="#FFFFFF" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Contrast Ratio: 21:1</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              AAA Pass
                            </Badge>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              AA Pass
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Normal Text (AA): 4.5:1</span>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Normal Text (AAA): 7:1</span>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Large Text (AA): 3:1</span>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Large Text (AAA): 4.5:1</span>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Color Blindness Simulator</h3>
                      <p className="text-muted-foreground mb-4">
                        Preview how your page appears to users with different types of color blindness.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-2 border-b font-medium text-center">Normal Vision</div>
                          <div className="h-32 bg-gradient-to-r from-red-500 via-green-500 to-blue-500"></div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-2 border-b font-medium text-center">Protanopia</div>
                          <div className="h-32 bg-gradient-to-r from-yellow-500 via-yellow-500 to-blue-500 opacity-80"></div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-2 border-b font-medium text-center">Deuteranopia</div>
                          <div className="h-32 bg-gradient-to-r from-yellow-500 via-yellow-500 to-blue-500 opacity-90"></div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-2 border-b font-medium text-center">Tritanopia</div>
                          <div className="h-32 bg-gradient-to-r from-red-500 via-gray-500 to-red-500"></div>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="p-2 border-b font-medium text-center">Achromatopsia</div>
                          <div className="h-32 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="keyboard" className="h-full">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Keyboard Navigation</h3>
                      <p className="text-muted-foreground mb-4">
                        Test keyboard navigation and focus management on your page.
                      </p>

                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Focus Order</span>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Passed
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Focus order follows a logical sequence based on content layout.
                          </p>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Focus Visibility</span>
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                              Warning
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Some elements have insufficient focus indicators. Focus should be clearly visible.
                          </p>
                          <Button variant="outline" size="sm">
                            Show Elements
                          </Button>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Keyboard Traps</span>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Passed
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            No keyboard traps detected. Users can navigate through and away from all components.
                          </p>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Skip Links</span>
                            <Badge className="bg-destructive">Failed</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            No skip links found. Add a skip link to bypass navigation and go directly to main content.
                          </p>
                          <a href="#" className="text-sm text-primary hover:underline">
                            Learn how to add skip links
                          </a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Keyboard Shortcuts Test</h3>
                      <p className="text-muted-foreground mb-4">
                        Test if your keyboard shortcuts work correctly and don't conflict with browser or screen reader
                        shortcuts.
                      </p>

                      <div className="border rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Navigation shortcuts</span>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Action shortcuts</span>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Single-key shortcuts</span>
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Screen reader compatibility</span>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <CardFooter className="border-t px-6 py-4">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                    Close
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Paintbrush className="h-4 w-4" />
                    Fix Automatically
                  </Button>
                </div>
                <Button onClick={runAccessibilityScan} disabled={isScanning}>
                  {isScanning ? "Scanning..." : "Run Scan"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  )
}
