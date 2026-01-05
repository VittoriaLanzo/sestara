import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'explain' | 'summarize' | 'quiz' | 'flashcards' | 'write-assist' | 'math-convert' | 'explain-wrong' | 'youtube-extract';
  topicTitle?: string;
  topicDescription?: string;
  subjectTitle?: string;
  userNotes?: string;
  quizType?: 'mcq' | 'short' | 'mixed';
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  assistType?: string;
  text?: string;
  question?: string;
  correctAnswer?: string;
  userAnswer?: string;
  cardCount?: number;
  sourceUrl?: string;
  sourceType?: string;
  // Exam context
  examName?: string;
  examType?: string;
  goalType?: string;
  // Language
  studyLanguage?: string;
  // External content
  extractedContent?: string;
}

// Language mapping for prompts
const languageNames: Record<string, string> = {
  'en': 'English',
  'hi': 'Hindi',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'pt': 'Portuguese',
  'zh': 'Chinese (Simplified)',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'ru': 'Russian',
  'it': 'Italian',
  'nl': 'Dutch',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi',
  'ur': 'Urdu',
};

// Exam type detection and difficulty mapping
function getExamContext(examName?: string, examType?: string, goalType?: string): { 
  examLevel: string; 
  questionStyle: string; 
  conceptDepth: string;
  examPatternHint: string;
} {
  const name = (examName || goalType || '').toLowerCase();
  
  // Competitive exams (high difficulty)
  if (name.includes('jee') || name.includes('neet') || name.includes('gate') || 
      name.includes('upsc') || name.includes('cat') || name.includes('gre') ||
      name.includes('gmat') || name.includes('ias') || name.includes('civil services')) {
    return {
      examLevel: 'competitive-advanced',
      questionStyle: 'conceptual, application-based, multi-step problem solving, analytical',
      conceptDepth: 'deep understanding required with connections between concepts',
      examPatternHint: 'Focus on tricky questions, negative marking awareness, time-pressure scenarios, previous year patterns'
    };
  }
  
  // Board exams (medium difficulty)
  if (name.includes('cbse') || name.includes('icse') || name.includes('board') ||
      name.includes('ssc') || name.includes('hsc') || name.includes('state board') ||
      name.includes('10th') || name.includes('12th') || name.includes('class')) {
    return {
      examLevel: 'board-standard',
      questionStyle: 'direct recall, understanding-based, NCERT-aligned, application oriented',
      conceptDepth: 'thorough coverage of syllabus with focus on fundamentals',
      examPatternHint: 'Include HOTS questions, value-based questions, diagram-based questions as per exam pattern'
    };
  }
  
  // Certification/professional exams
  if (name.includes('certification') || name.includes('aws') || name.includes('azure') ||
      name.includes('cisco') || name.includes('pmp') || name.includes('professional')) {
    return {
      examLevel: 'professional-certification',
      questionStyle: 'scenario-based, real-world application, best practices focused',
      conceptDepth: 'practical understanding with industry standards',
      examPatternHint: 'Focus on situational questions, troubleshooting scenarios, and industry best practices'
    };
  }
  
  // Language/skill exams
  if (name.includes('ielts') || name.includes('toefl') || name.includes('language')) {
    return {
      examLevel: 'language-proficiency',
      questionStyle: 'comprehension, grammar, vocabulary, contextual usage',
      conceptDepth: 'practical language skills with cultural context',
      examPatternHint: 'Include reading comprehension, word usage in context, and grammar patterns'
    };
  }
  
  // Default for general learning
  return {
    examLevel: 'general-learning',
    questionStyle: 'balanced mix of recall, understanding, and application',
    conceptDepth: 'clear explanations with practical examples',
    examPatternHint: 'Focus on building strong foundational understanding'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { 
      action, 
      topicTitle, 
      topicDescription,
      subjectTitle,
      userNotes, 
      quizType = 'mixed', 
      questionCount = 5, 
      difficulty = 'mixed', 
      assistType, 
      text, 
      question, 
      correctAnswer, 
      userAnswer, 
      cardCount = 10,
      sourceUrl,
      sourceType,
      examName,
      examType,
      goalType,
      studyLanguage = 'en',
      extractedContent
    } = body;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const langName = languageNames[studyLanguage] || 'English';
    const examContext = getExamContext(examName, examType, goalType);

    let systemPrompt = '';
    let userPrompt = '';
    let tools: any[] = [];
    let toolChoice: any = undefined;

    // Build comprehensive content context
    const contentParts: string[] = [];
    if (topicTitle) contentParts.push(`Topic: ${topicTitle}`);
    if (subjectTitle) contentParts.push(`Subject: ${subjectTitle}`);
    if (topicDescription) contentParts.push(`Description: ${topicDescription}`);
    if (extractedContent) contentParts.push(`Extracted Content:\n${extractedContent}`);
    if (userNotes) contentParts.push(`User Notes:\n${userNotes}`);
    
    const context = contentParts.join('\n\n');

    // Base language instruction for content generation
    const languageInstruction = studyLanguage !== 'en' 
      ? `Generate all content in ${langName}. For technical terms and keywords, show them in BOTH English AND ${langName} format.`
      : '';

    // Exam-awareness instruction
    const examInstruction = `
EXAM CONTEXT:
- Exam Level: ${examContext.examLevel}
- Question Style Required: ${examContext.questionStyle}
- Concept Depth: ${examContext.conceptDepth}
- Exam Pattern Guidance: ${examContext.examPatternHint}
${examName ? `- Target Exam: ${examName}` : ''}

QUALITY REQUIREMENTS:
- Questions must match real exam difficulty and patterns
- Include variety: direct questions, conceptual questions, scenario-based questions
- For wrong answers, explain WHY each option is incorrect (not just what's correct)
- Reference common exam patterns and frequently asked concepts
- Avoid overly generic or shallow questions`;

    switch (action) {
      case 'youtube-extract': {
        // Extract content from YouTube video for quiz/flashcard generation
        if (!sourceUrl) {
          throw new Error('YouTube URL is required');
        }
        
        systemPrompt = `You are an expert content extractor. Extract the key educational concepts, facts, and information from the given YouTube video URL. Focus on extractable learning content that can be used to generate quizzes and flashcards.`;
        userPrompt = `Extract the main educational content and key concepts from this YouTube video: ${sourceUrl}

Based on the video URL and topic context, provide:
1. Main concepts covered
2. Key facts and definitions
3. Important relationships between concepts
4. Any formulas, dates, or specific data mentioned

Note: Since you cannot directly access the video, use the video title/URL context along with your knowledge to provide relevant educational content for this topic.`;
        break;
      }

      case 'explain':
        systemPrompt = `You are a friendly, patient tutor who explains concepts in simple terms. Use analogies, examples, and break down complex ideas into digestible parts. Be encouraging and supportive.
${languageInstruction}
${examInstruction}`;
        userPrompt = `Please explain this topic in simple, easy-to-understand terms:\n\n${context}\n\nUse analogies and real-world examples where possible. Break it down step by step. Consider the exam level and explain accordingly.`;
        break;

      case 'summarize':
        systemPrompt = `You are an expert at extracting key terms and concepts from educational content. Extract the most important keywords and phrases that students should know for their exams.
${studyLanguage !== 'en' ? `Provide keywords in BOTH English AND ${langName} format like: "English Term (${langName} Translation)"` : ''}`;
        userPrompt = `Extract 8-12 important keywords or key phrases from this topic that are essential for understanding and exam preparation:\n\n${context}\n\nFocus on:
- Core concepts and terminology
- Important names, formulas, or principles
- Key vocabulary students must know for exams
- Technical terms that frequently appear in ${examContext.examLevel} level exams`;
        tools = [{
          type: 'function',
          function: {
            name: 'extract_keywords',
            description: 'Extract important keywords from the topic',
            parameters: {
              type: 'object',
              properties: {
                keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of 8-12 important keywords or key phrases'
                }
              },
              required: ['keywords']
            }
          }
        }];
        toolChoice = { type: 'function', function: { name: 'extract_keywords' } };
        break;

      case 'quiz':
        systemPrompt = `You are an expert exam question creator specializing in ${examContext.examLevel} level assessments. Create questions that:
1. Match real exam difficulty and patterns
2. Test understanding, not just memorization
3. Include variety (direct, conceptual, scenario-based)
4. Have clear, unambiguous answers
5. Provide detailed explanations that help learning

${languageInstruction}
${examInstruction}

INTERNET-AWARE GENERATION:
- Consider commonly asked questions in this topic for ${examName || 'similar exams'}
- Include questions based on frequently tested concepts
- Reference patterns from previous year questions
- Cover high-weightage areas and commonly examined concepts`;

        userPrompt = `Create a ${quizType === 'mcq' ? 'multiple choice' : quizType === 'short' ? 'short answer' : 'mixed format'} quiz with ${questionCount} questions about:\n\n${context}\n\n
Difficulty: ${difficulty === 'mixed' ? 'Mix of easy, medium, and hard questions matching exam pattern' : `All ${difficulty} difficulty`}

IMPORTANT GUIDELINES:
- Generate exam-realistic questions (not generic or shallow)
- For MCQs: Create plausible distractors that test common misconceptions
- Include at least 30% application/scenario-based questions
- Each explanation should teach the concept, not just state the answer
- Consider what's commonly asked in ${examName || 'similar exams'}`;

        tools = [{
          type: 'function',
          function: {
            name: 'create_quiz',
            description: 'Create a quiz with exam-quality questions',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string', enum: ['mcq', 'short'] },
                      question: { type: 'string' },
                      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                      options: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Only for MCQ questions, 4 options with plausible distractors'
                      },
                      correctAnswer: { type: 'string' },
                      explanation: { type: 'string', description: 'Detailed explanation teaching the concept' },
                      wrongAnswerExplanations: {
                        type: 'object',
                        description: 'For MCQs: explanations for why each wrong option is incorrect',
                        additionalProperties: { type: 'string' }
                      },
                      examRelevance: { type: 'string', description: 'Why this question is important for exam preparation' },
                      encouragement: { type: 'string', description: 'Positive feedback for getting this right' }
                    },
                    required: ['id', 'type', 'question', 'correctAnswer', 'explanation', 'encouragement']
                  }
                }
              },
              required: ['questions']
            }
          }
        }];
        toolChoice = { type: 'function', function: { name: 'create_quiz' } };
        break;

      case 'flashcards':
        systemPrompt = `You are an expert at creating effective flashcards for ${examContext.examLevel} level exam preparation. Create cards that:
1. Are clear, concise, and test understanding
2. Cover key concepts likely to appear in exams
3. Include important formulas, definitions, and facts
4. Help with quick revision before exams

${languageInstruction}
${examInstruction}`;
        userPrompt = `Create ${cardCount} flashcards for studying:\n\n${context}\n\n
IMPORTANT:
- Focus on exam-relevant content
- Include a mix of definition cards, concept cards, and application cards
- For formulas/facts, make them easy to memorize
- Add helpful hints for difficult concepts
${studyLanguage !== 'en' ? `- Show key terms in both English and ${langName}` : ''}`;
        tools = [{
          type: 'function',
          function: {
            name: 'create_flashcards',
            description: 'Create a set of exam-focused flashcards',
            parameters: {
              type: 'object',
              properties: {
                cards: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      front: { type: 'string', description: 'Question or prompt' },
                      back: { type: 'string', description: 'Answer or explanation' },
                      hint: { type: 'string', description: 'Optional hint for difficult concepts' },
                      category: { type: 'string', description: 'Type: definition, concept, formula, fact, application' }
                    },
                    required: ['id', 'front', 'back']
                  }
                }
              },
              required: ['cards']
            }
          }
        }];
        toolChoice = { type: 'function', function: { name: 'create_flashcards' } };
        break;

      case 'write-assist':
        const assistPrompts: Record<string, string> = {
          improve: 'Improve the clarity and readability of this text while keeping the same meaning:',
          simplify: 'Simplify this text to make it easier to understand:',
          expand: 'Expand on this text with more details and examples:',
          bulletize: 'Convert this text into clear bullet points:',
          exam: 'Reformat this text into an exam-ready format with key points highlighted:'
        };
        systemPrompt = `You are a helpful writing assistant. Output only the improved text, nothing else.
${languageInstruction}`;
        userPrompt = `${assistPrompts[assistType || 'improve']}\n\n${text}`;
        break;

      case 'math-convert':
        systemPrompt = 'You are a LaTeX expert. Convert plain text math expressions to LaTeX. Output ONLY the LaTeX code, nothing else.';
        userPrompt = `Convert to LaTeX: ${text}`;
        break;

      case 'explain-wrong':
        systemPrompt = `You are a patient, encouraging tutor specializing in ${examContext.examLevel} level preparation. Explain why an answer is incorrect and help the student understand the concept. Be supportive, not critical. Connect the explanation to exam relevance.
${languageInstruction}`;
        userPrompt = `Topic: ${topicTitle}\n\nQuestion: ${question}\nStudent's answer: ${userAnswer}\nCorrect answer: ${correctAnswer}\n\nExplain:
1. Why the student's answer is incorrect
2. The correct concept they should understand
3. How to avoid this mistake in exams
4. Related concepts they should review

Be encouraging and exam-focused.`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const requestBody: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    if (tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = toolChoice;
    }

    console.log(`Processing ${action} request for topic: ${topicTitle}, exam: ${examName || 'general'}, language: ${langName}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI request failed: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received successfully');

    let result: any;

    if (action === 'quiz' || action === 'flashcards' || action === 'summarize') {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error('Failed to get structured response from AI');
      }
    } else if (action === 'write-assist') {
      result = { result: data.choices?.[0]?.message?.content || '' };
    } else if (action === 'math-convert') {
      result = { latex: data.choices?.[0]?.message?.content?.replace(/```latex?\n?/g, '').replace(/```/g, '').trim() || '' };
    } else if (action === 'youtube-extract') {
      result = { content: data.choices?.[0]?.message?.content || '' };
    } else {
      result = { content: data.choices?.[0]?.message?.content || '' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in topic-ai function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
