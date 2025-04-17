"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { MessageSquare, ArrowRight, Building2, Users, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const totalSteps = 5

  // User data state
  const [userData, setUserData] = useState({
    name: "",
    jobTitle: "",
    companyName: "",
    companySize: "",
    teamSize: "",
    useCase: "",
    boardName: "",
    boardDescription: "",
    boardPrivate: false,
    interests: [] as string[],
  })

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleComplete = () => {
    setLoading(true)
    // In a real app, you would send this data to your API
    setTimeout(() => {
      setLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  const updateUserData = (field: string, value: any) => {
    setUserData({
      ...userData,
      [field]: value,
    })
  }

  const toggleInterest = (interest: string) => {
    if (userData.interests.includes(interest)) {
      updateUserData(
        "interests",
        userData.interests.filter((i) => i !== interest),
      )
    } else {
      updateUserData("interests", [...userData.interests, interest])
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-2 mb-8">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Project Vision</h1>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round((step / totalSteps) * 100)}% Complete</span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-2" />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Project Vision!</CardTitle>
              <CardDescription>Let's get to know you better to personalize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={userData.name}
                  onChange={(e) => updateUserData("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Product Manager"
                  value={userData.jobTitle}
                  onChange={(e) => updateUserData("jobTitle", e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleSkip}>
                Skip Onboarding
              </Button>
              <Button onClick={handleNext} disabled={!userData.name}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your company</CardTitle>
              <CardDescription>This helps us tailor your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc."
                  value={userData.companyName}
                  onChange={(e) => updateUserData("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Size</Label>
                <RadioGroup
                  value={userData.companySize}
                  onValueChange={(value) => updateUserData("companySize", value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1-10" id="company-1-10" />
                    <Label htmlFor="company-1-10">1-10 employees</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="11-50" id="company-11-50" />
                    <Label htmlFor="company-11-50">11-50 employees</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="51-200" id="company-51-200" />
                    <Label htmlFor="company-51-200">51-200 employees</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="201+" id="company-201" />
                    <Label htmlFor="company-201">201+ employees</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Team Size</Label>
                <RadioGroup value={userData.teamSize} onValueChange={(value) => updateUserData("teamSize", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="just-me" id="team-just-me" />
                    <Label htmlFor="team-just-me">Just me</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2-5" id="team-2-5" />
                    <Label htmlFor="team-2-5">2-5 people</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="6-10" id="team-6-10" />
                    <Label htmlFor="team-6-10">6-10 people</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="11+" id="team-11" />
                    <Label htmlFor="team-11">11+ people</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Back
              </Button>
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>What are you using Project Vision for?</CardTitle>
              <CardDescription>This helps us recommend features relevant to your needs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Use Case</Label>
                <RadioGroup value={userData.useCase} onValueChange={(value) => updateUserData("useCase", value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="product-feedback" id="use-product-feedback" />
                    <Label htmlFor="use-product-feedback">Collecting product feedback</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feature-requests" id="use-feature-requests" />
                    <Label htmlFor="use-feature-requests">Managing feature requests</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bug-tracking" id="use-bug-tracking" />
                    <Label htmlFor="use-bug-tracking">Bug tracking and reporting</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer-feedback" id="use-customer-feedback" />
                    <Label htmlFor="use-customer-feedback">Customer feedback portal</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="internal-ideas" id="use-internal-ideas" />
                    <Label htmlFor="use-internal-ideas">Internal idea management</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="use-other" />
                    <Label htmlFor="use-other">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>What features are you interested in?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Feedback collection",
                    "Voting system",
                    "GitHub integration",
                    "Roadmap planning",
                    "User management",
                    "Analytics",
                    "Custom fields",
                    "Polls and surveys",
                    "Notifications",
                    "Mobile app",
                  ].map((interest) => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={`interest-${interest}`}
                        checked={userData.interests.includes(interest)}
                        onCheckedChange={() => toggleInterest(interest)}
                      />
                      <label
                        htmlFor={`interest-${interest}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {interest}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!userData.useCase}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Create your first board</CardTitle>
              <CardDescription>
                Boards are where you collect and organize feedback. Let's create your first one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="boardName">Board Name</Label>
                <Input
                  id="boardName"
                  placeholder="e.g., Feature Requests"
                  value={userData.boardName}
                  onChange={(e) => updateUserData("boardName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="boardDescription">Description (optional)</Label>
                <Textarea
                  id="boardDescription"
                  placeholder="What kind of feedback will you collect here?"
                  value={userData.boardDescription}
                  onChange={(e) => updateUserData("boardDescription", e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="boardPrivate"
                  checked={userData.boardPrivate}
                  onCheckedChange={(checked) => updateUserData("boardPrivate", checked)}
                />
                <Label htmlFor="boardPrivate">Make this board private</Label>
              </div>
              {userData.boardPrivate && (
                <p className="text-sm text-muted-foreground">
                  Private boards are only visible to people you invite. Public boards can be discovered by anyone.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!userData.boardName}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>You're all set!</CardTitle>
              <CardDescription>Here's a summary of what we've set up for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-medium">Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  {userData.name} • {userData.jobTitle}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-medium">Your Organization</h3>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {userData.companyName} • {userData.companySize} employees
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Team size: {userData.teamSize}</p>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-medium">Your First Board</h3>
                <p className="text-sm font-medium">{userData.boardName}</p>
                <p className="text-sm text-muted-foreground">{userData.boardDescription}</p>
                <p className="text-sm text-muted-foreground">
                  {userData.boardPrivate ? "Private board" : "Public board"}
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">What's next?</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span>Invite team members to collaborate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span>Create your first post to collect feedback</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span>Explore the roadmap feature to plan your work</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    <span>Set up GitHub integration for development tracking</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious}>
                Back
              </Button>
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? "Setting up your account..." : "Get Started"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
