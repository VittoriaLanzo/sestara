import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Settings2, Copy, ExternalLink, FileJson, Play, 
  Sparkles, CheckCircle2, Lightbulb 
} from "lucide-react";

interface HowItWorksSectionProps {
  studyLanguage: string;
}

const translations: Record<string, {
  title: string;
  subtitle: string;
  steps: { title: string; desc: string }[];
  tips: string[];
}> = {
  en: {
    title: "How It Works",
    subtitle: "Create custom quizzes in 5 simple steps",
    steps: [
      { title: "Configure Your Quiz", desc: "Set your topic, exam level, and number of questions" },
      { title: "Copy the Prompt", desc: "Get a ready-to-use prompt with JSON schema" },
      { title: "Ask Any AI", desc: "Paste the prompt in ChatGPT, Gemini, Claude, or any AI" },
      { title: "Get JSON Response", desc: "The AI generates a structured quiz in JSON format" },
      { title: "Paste & Play", desc: "Paste the JSON here and start practicing instantly" },
    ],
    tips: [
      "Works with any AI chatbot - free or premium",
      "Questions are generated based on your exact requirements",
      "Save quizzes to your library for future practice",
    ],
  },
  hi: {
    title: "यह कैसे काम करता है",
    subtitle: "5 सरल चरणों में कस्टम क्विज़ बनाएं",
    steps: [
      { title: "अपना क्विज़ कॉन्फ़िगर करें", desc: "अपना विषय, परीक्षा स्तर और प्रश्नों की संख्या सेट करें" },
      { title: "प्रॉम्प्ट कॉपी करें", desc: "JSON स्कीमा के साथ तैयार प्रॉम्प्ट प्राप्त करें" },
      { title: "किसी भी AI से पूछें", desc: "ChatGPT, Gemini, Claude या किसी AI में प्रॉम्प्ट पेस्ट करें" },
      { title: "JSON प्रतिक्रिया प्राप्त करें", desc: "AI JSON प्रारूप में संरचित क्विज़ बनाता है" },
      { title: "पेस्ट करें और खेलें", desc: "यहां JSON पेस्ट करें और तुरंत अभ्यास शुरू करें" },
    ],
    tips: [
      "किसी भी AI चैटबॉट के साथ काम करता है - मुफ्त या प्रीमियम",
      "आपकी सटीक आवश्यकताओं के आधार पर प्रश्न तैयार किए जाते हैं",
      "भविष्य के अभ्यास के लिए क्विज़ को अपनी लाइब्रेरी में सेव करें",
    ],
  },
  es: {
    title: "Cómo Funciona",
    subtitle: "Crea cuestionarios personalizados en 5 simples pasos",
    steps: [
      { title: "Configura Tu Cuestionario", desc: "Establece tu tema, nivel de examen y número de preguntas" },
      { title: "Copia el Prompt", desc: "Obtén un prompt listo para usar con esquema JSON" },
      { title: "Pregunta a Cualquier IA", desc: "Pega el prompt en ChatGPT, Gemini, Claude o cualquier IA" },
      { title: "Obtén Respuesta JSON", desc: "La IA genera un cuestionario estructurado en formato JSON" },
      { title: "Pega y Juega", desc: "Pega el JSON aquí y comienza a practicar al instante" },
    ],
    tips: [
      "Funciona con cualquier chatbot de IA - gratis o premium",
      "Las preguntas se generan según tus requisitos exactos",
      "Guarda cuestionarios en tu biblioteca para práctica futura",
    ],
  },
};

const getTranslation = (lang: string) => translations[lang] || translations.en;

const stepIcons = [Settings2, Copy, ExternalLink, FileJson, Play];

export const HowItWorksSection = ({ studyLanguage }: HowItWorksSectionProps) => {
  const t = getTranslation(studyLanguage);
  const tEn = translations.en;

  return (
    <div className="space-y-8">
      {/* Steps */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t.title}</h2>
              {studyLanguage !== 'en' && (
                <p className="text-sm text-muted-foreground">{tEn.title}</p>
              )}
            </div>
          </div>

          <p className="text-muted-foreground mb-8">
            {t.subtitle}
            {studyLanguage !== 'en' && (
              <span className="block text-sm mt-1">{tEn.subtitle}</span>
            )}
          </p>

          <div className="grid gap-4 md:gap-6">
            {t.steps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <div 
                  key={index}
                  className="flex gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-primary" />
                      <h3 className="font-medium">{step.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                    {studyLanguage !== 'en' && (
                      <p className="text-xs text-muted-foreground/70 mt-1 italic">
                        {tEn.steps[index].title}: {tEn.steps[index].desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="glass-card border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-medium">Pro Tips</h3>
          </div>
          <div className="space-y-3">
            {t.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm">{tip}</p>
                  {studyLanguage !== 'en' && (
                    <p className="text-xs text-muted-foreground">{tEn.tips[index]}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supported AIs */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-3">Works with popular AI assistants</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['ChatGPT', 'Gemini', 'Claude', 'Copilot', 'Perplexity', 'Llama'].map((ai) => (
            <Badge key={ai} variant="secondary" className="px-3 py-1">
              {ai}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
