import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Sparkles, FileJson, Info } from "lucide-react";
import { toast } from "sonner";

interface PromptBuilderSectionProps {
  studyLanguage: string;
}

const languageNames: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
};

const sampleJsonTemplate = `{
  "quizTitle": "Physics Mechanics Quiz",
  "description": "Test your understanding of Newton's Laws",
  "examLevel": "JEE Mains",
  "language": "English",
  "durationMode": "timer",
  "questions": [
    {
      "id": "q1",
      "question": "What is Newton's First Law of Motion?",
      "options": [
        "A) Every action has an equal and opposite reaction",
        "B) An object at rest stays at rest unless acted upon by a force",
        "C) Force equals mass times acceleration",
        "D) Energy cannot be created or destroyed"
      ],
      "correctAnswer": "B",
      "explanation": "Newton's First Law, also known as the Law of Inertia, states that an object will remain at rest or in uniform motion unless acted upon by an external force.",
      "difficulty": "easy",
      "keywordsEnglish": ["inertia", "motion", "force"],
      "keywordsLocal": ["जड़त्व", "गति", "बल"]
    }
  ]
}`;

export const PromptBuilderSection = ({ studyLanguage }: PromptBuilderSectionProps) => {
  const [quizTitle, setQuizTitle] = useState("");
  const [examPurpose, setExamPurpose] = useState("");
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [questionType, setQuestionType] = useState("mcq");
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const langName = languageNames[studyLanguage] || 'English';

  const generatePrompt = () => {
    const prompt = `Generate a quiz in JSON format exactly like the sample below.

Quiz Title: ${quizTitle || '[Your Quiz Title]'}
Topic/Subject: ${topic || '[Your Topic]'}
Exam Level/Purpose: ${examPurpose || 'General Practice'}
Number of Questions: ${questionCount}
Question Type: ${questionType === 'mcq' ? 'Multiple Choice (MCQ)' : 'Mixed (MCQ + Short Answer)'}
Primary Language: ${langName}

Requirements:
1. Each question must have 4 options (A, B, C, D) for MCQs
2. Include clear explanations for each answer
3. Add difficulty level (easy/medium/hard) for each question
4. Include important keywords in both English and ${langName}
5. Ensure correctAnswer contains only the letter (A, B, C, or D)

IMPORTANT: Output ONLY valid JSON. No extra text before or after.

Sample JSON Schema:
${sampleJsonTemplate}`;

    return prompt;
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatePrompt());
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(sampleJsonTemplate);
      setCopiedJson(true);
      toast.success("Sample JSON copied!");
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompt Builder */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Prompt Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                placeholder="e.g., Physics Mechanics Quiz"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam">Exam / Purpose</Label>
              <Input
                id="exam"
                placeholder="e.g., JEE Mains, NEET, CBSE Class 12"
                value={examPurpose}
                onChange={(e) => setExamPurpose(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Subject / Topic / Subtopic</Label>
            <Input
              id="topic"
              placeholder="e.g., Physics - Newton's Laws of Motion"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 25, 30].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ Only</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Study Language</Label>
              <div className="h-10 px-3 rounded-md border bg-muted/50 flex items-center">
                <Badge variant="secondary">{langName}</Badge>
                <span className="text-xs text-muted-foreground ml-2">(from profile)</span>
              </div>
            </div>
          </div>

          {/* Generated Prompt Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Prompt</Label>
              <Button 
                size="sm" 
                onClick={handleCopyPrompt}
                className="gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Prompt"}
              </Button>
            </div>
            <Textarea
              readOnly
              value={generatePrompt()}
              className="h-64 font-mono text-xs bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sample JSON Template */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              Sample JSON Template
            </CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleCopyJson}
              className="gap-2"
            >
              {copiedJson ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Sample
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap">
              {sampleJsonTemplate}
            </pre>
          </div>
          
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Important:</strong> Paste only valid JSON. The AI should output nothing except the JSON object.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
