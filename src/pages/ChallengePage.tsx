 import { useState, useEffect } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { Navbar } from "@/components/Navbar";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  useChallengeByCode, 
  useChallengeLeaderboard,
  useSubmitChallengeAttempt 
} from "@/hooks/useChallenges";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ChallengeLeaderboard } from "@/components/challenge/ChallengeLeaderboard";
import { CustomQuizViewer } from "@/components/custom-quiz/CustomQuizViewer";
import { 
  Users, Play, Loader2, AlertCircle, Trophy, 
  Clock, Target, ArrowLeft, Share2, Copy, Check, RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
 
 const ChallengePage = () => {
   const { code } = useParams<{ code: string }>();
   const navigate = useNavigate();
   const { user } = useAuth();
   const { profile } = useProfile();
   
   const { data: challenge, isLoading, isError } = useChallengeByCode(code || null);
   const { data: leaderboard = [] } = useChallengeLeaderboard(challenge?.id || null);
   const submitAttempt = useSubmitChallengeAttempt();
 
   const [isPlaying, setIsPlaying] = useState(false);
   const [showResults, setShowResults] = useState(false);
   const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
   const [quizScore, setQuizScore] = useState(0);
   const [quizTime, setQuizTime] = useState(0);
   const [copied, setCopied] = useState(false);
 
   // Get user's best attempt
   const userBestAttempt = leaderboard.find(a => a.userId === user?.id);
   const userRank = leaderboard.findIndex(a => a.userId === user?.id) + 1;
 
   const handleStartQuiz = () => {
     if (!user) {
       toast.error("Please log in to participate");
       navigate('/auth');
       return;
     }
     setIsPlaying(true);
     setShowResults(false);
   };
 
   const handleQuizComplete = async (answers: Record<string, string>, score: number, timeTaken: number) => {
     setQuizAnswers(answers);
     setQuizScore(score);
     setQuizTime(timeTaken);
     setIsPlaying(false);
     setShowResults(true);
 
     // Submit the attempt
     if (challenge && user) {
       const userName = profile?.display_name || user.email?.split('@')[0] || 'Anonymous';
       await submitAttempt.mutateAsync({
         challengeId: challenge.id,
         userName,
         score,
         maxScore: challenge.quizData.questions.length,
         timeTakenSeconds: timeTaken,
         answers,
       });
     }
   };
 
   const handleRetake = () => {
     setQuizAnswers({});
     setShowResults(false);
     setIsPlaying(true);
   };
 
   const handleBack = () => {
     setShowResults(false);
   };
 
   const handleCopyLink = () => {
     navigator.clipboard.writeText(window.location.href);
     setCopied(true);
     toast.success("Link copied!");
     setTimeout(() => setCopied(false), 2000);
   };
 
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}m ${secs}s`;
   };
 
   // Show quiz viewer when playing
   if (isPlaying && challenge) {
     return (
       <CustomQuizViewer
         quiz={challenge.quizData}
         mode="track"
         timerMinutes={30}
         onComplete={handleQuizComplete}
         onCancel={() => setIsPlaying(false)}
       />
     );
   }
 
   // Show results after completing
   if (showResults && challenge) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <main className="container mx-auto px-4 pt-24 pb-12">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-4xl mx-auto space-y-6"
           >
             {/* Back button */}
             <Button
               variant="ghost"
               className="gap-2"
               onClick={handleBack}
             >
               <ArrowLeft className="w-4 h-4" />
               Back to Challenge
             </Button>
 
             {/* Your Result Card */}
             <Card className="glass-card overflow-hidden">
               <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 p-6 text-center">
                 <motion.div
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 0.2, type: "spring" }}
                   className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-xl mb-3"
                 >
                   <Trophy className={cn(
                     "w-8 h-8",
                     quizScore >= challenge.quizData.questions.length * 0.8 ? "text-yellow-500" : 
                     quizScore >= challenge.quizData.questions.length * 0.6 ? "text-green-500" : 
                     "text-muted-foreground"
                   )} />
                 </motion.div>
                 
                 <h2 className="text-3xl font-bold mb-1">
                   {quizScore}/{challenge.quizData.questions.length}
                 </h2>
                 <p className="text-muted-foreground">
                   {Math.round((quizScore / challenge.quizData.questions.length) * 100)}% accuracy in {formatTime(quizTime)}
                 </p>
               </div>
 
               <CardContent className="p-4">
                 <div className="flex flex-wrap gap-3 justify-center">
                   <Button onClick={handleRetake} variant="outline" className="gap-2">
                     <Play className="w-4 h-4" />
                     Try Again
                   </Button>
                   <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                     {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                     Share Challenge
                   </Button>
                 </div>
               </CardContent>
             </Card>
 
             {/* Leaderboard */}
             <ChallengeLeaderboard challengeId={challenge.id} />
           </motion.div>
         </main>
       </div>
     );
   }
 
   // Loading state
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <main className="container mx-auto px-4 pt-24 pb-12">
           <div className="flex items-center justify-center py-20">
             <Loader2 className="w-8 h-8 animate-spin text-primary" />
           </div>
         </main>
       </div>
     );
   }
 
   // Not found
   if (!challenge || isError) {
     return (
       <div className="min-h-screen bg-background">
         <Navbar />
         <main className="container mx-auto px-4 pt-24 pb-12">
           <Card className="max-w-md mx-auto">
             <CardContent className="py-12 text-center">
               <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
               <h2 className="text-xl font-semibold mb-2">Challenge Not Found</h2>
               <p className="text-muted-foreground mb-6">
                 This challenge doesn't exist or has expired.
               </p>
               <Button onClick={() => navigate('/custom-quiz')} className="gap-2">
                 <ArrowLeft className="w-4 h-4" />
                 Go to Practice
               </Button>
             </CardContent>
           </Card>
         </main>
       </div>
     );
   }
 
   // Main challenge page
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       <main className="container mx-auto px-4 pt-24 pb-12">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="max-w-4xl mx-auto space-y-6"
         >
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Challenge</span>
                {leaderboard.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {leaderboard.length} player{leaderboard.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{challenge.title}</h1>
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <Badge variant="secondary" className="font-mono">{code}</Badge>
                <span>{challenge.quizData.questions.length} questions</span>
              </div>
            </div>
 
           {/* Your Status */}
           {userBestAttempt && (
             <Card className="glass-card bg-primary/5 border-primary/20">
               <CardContent className="py-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                       <Trophy className="w-6 h-6 text-primary" />
                     </div>
                     <div>
                       <p className="font-medium">Your Best Score</p>
                       <div className="flex items-center gap-3 text-sm text-muted-foreground">
                         <span>Rank #{userRank}</span>
                         <span>•</span>
                         <span className="flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {formatTime(userBestAttempt.timeTakenSeconds)}
                         </span>
                         <span>•</span>
                         <span className="flex items-center gap-1">
                           <Target className="w-3 h-3" />
                           {userBestAttempt.accuracy.toFixed(0)}%
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-3xl font-bold text-primary">
                       {userBestAttempt.score}/{userBestAttempt.maxScore}
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}
 
           {/* Actions */}
           <div className="flex flex-wrap gap-3 justify-center">
             <Button size="lg" className="gap-2" onClick={handleStartQuiz}>
               <Play className="w-5 h-5" />
               {userBestAttempt ? 'Try Again' : 'Start Challenge'}
             </Button>
             <Button size="lg" variant="outline" className="gap-2" onClick={handleCopyLink}>
               {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               Copy Link
             </Button>
           </div>
 
           {/* Leaderboard */}
           <ChallengeLeaderboard challengeId={challenge.id} />
         </motion.div>
       </main>
     </div>
   );
 };
 
 export default ChallengePage;