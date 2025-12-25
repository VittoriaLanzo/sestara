import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'explain' | 'summarize' | 'quiz' | 'flashcards';
  topicTitle: string;
  topicDescription?: string;
  userNotes?: string;
  quizType?: 'mcq' | 'short' | 'mixed';
  questionCount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, topicTitle, topicDescription, userNotes, quizType = 'mixed', questionCount = 5 }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';
    let tools: any[] = [];
    let toolChoice: any = undefined;

    const context = `Topic: ${topicTitle}${topicDescription ? `\nDescription: ${topicDescription}` : ''}${userNotes ? `\nUser Notes: ${userNotes}` : ''}`;

    switch (action) {
      case 'explain':
        systemPrompt = 'You are a friendly, patient tutor who explains concepts in simple terms. Use analogies, examples, and break down complex ideas into digestible parts. Be encouraging and supportive.';
        userPrompt = `Please explain this topic in simple, easy-to-understand terms:\n\n${context}\n\nUse analogies and real-world examples where possible. Break it down step by step.`;
        break;

      case 'summarize':
        systemPrompt = 'You are an expert at creating concise, memorable summaries. Focus on key points and essential information.';
        userPrompt = `Create a short, memorable summary of this topic:\n\n${context}\n\nInclude:\n- Key concepts (3-5 bullet points)\n- One memorable takeaway\n- Any important formulas or rules if applicable`;
        break;

      case 'quiz':
        systemPrompt = 'You are an educational quiz creator. Create engaging, fair questions that test understanding, not just memorization. Be encouraging in your feedback.';
        userPrompt = `Create a ${quizType === 'mcq' ? 'multiple choice' : quizType === 'short' ? 'short answer' : 'mixed format'} quiz with ${questionCount} questions about:\n\n${context}`;
        tools = [{
          type: 'function',
          function: {
            name: 'create_quiz',
            description: 'Create a quiz with questions',
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
                      options: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Only for MCQ questions, 4 options'
                      },
                      correctAnswer: { type: 'string' },
                      explanation: { type: 'string' },
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
        systemPrompt = 'You are an expert at creating effective flashcards for learning. Create cards that are clear, concise, and test understanding.';
        userPrompt = `Create 8-10 flashcards for studying:\n\n${context}`;
        tools = [{
          type: 'function',
          function: {
            name: 'create_flashcards',
            description: 'Create a set of flashcards',
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
                      hint: { type: 'string', description: 'Optional hint' }
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

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const body: any = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    };

    if (tools.length > 0) {
      body.tools = tools;
      body.tool_choice = toolChoice;
    }

    console.log(`Processing ${action} request for topic: ${topicTitle}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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

    if (action === 'quiz' || action === 'flashcards') {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error('Failed to get structured response from AI');
      }
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
