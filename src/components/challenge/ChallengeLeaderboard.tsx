 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useChallengeLeaderboard, type ChallengeAttempt } from "@/hooks/useChallenges";
 import { useAuth } from "@/hooks/useAuth";
 import { Trophy, Medal, Clock, Target, Loader2, Users } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface ChallengeLeaderboardProps {
   challengeId: string;
   className?: string;
 }
 
 export const ChallengeLeaderboard = ({ challengeId, className }: ChallengeLeaderboardProps) => {
   const { user } = useAuth();
   const { data: leaderboard = [], isLoading } = useChallengeLeaderboard(challengeId);
 
   const formatTime = (seconds: number) => {
     const mins = Math.floor(seconds / 60);
     const secs = seconds % 60;
     return `${mins}m ${secs}s`;
   };
 
   const getRankIcon = (rank: number) => {
     if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
     if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
     if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
     return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
   };
 
   if (isLoading) {
     return (
       <Card className={className}>
         <CardContent className="py-12 flex items-center justify-center">
           <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className={className}>
       <CardHeader className="pb-3">
         <CardTitle className="flex items-center gap-2 text-lg">
           <Trophy className="w-5 h-5 text-primary" />
           Leaderboard
           <Badge variant="secondary" className="ml-auto">
             {leaderboard.length} {leaderboard.length === 1 ? 'player' : 'players'}
           </Badge>
         </CardTitle>
       </CardHeader>
       <CardContent>
         {leaderboard.length === 0 ? (
           <div className="py-8 text-center text-muted-foreground">
             <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
             <p>No attempts yet</p>
             <p className="text-sm">Be the first to complete this challenge!</p>
           </div>
         ) : (
           <ScrollArea className="h-[300px]">
             <div className="space-y-2">
               {leaderboard.map((attempt, index) => {
                 const rank = index + 1;
                 const isCurrentUser = attempt.userId === user?.id;
 
                 return (
                   <div
                     key={attempt.id}
                     className={cn(
                       "flex items-center gap-3 p-3 rounded-lg transition-colors",
                       isCurrentUser 
                         ? "bg-primary/10 ring-1 ring-primary/30" 
                         : "bg-muted/30 hover:bg-muted/50",
                       rank <= 3 && "bg-gradient-to-r from-muted/50 to-transparent"
                     )}
                   >
                     {/* Rank */}
                     <div className="w-8 flex items-center justify-center">
                       {getRankIcon(rank)}
                     </div>
 
                     {/* User info */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className={cn(
                           "font-medium truncate",
                           isCurrentUser && "text-primary"
                         )}>
                           {attempt.userName}
                         </p>
                         {isCurrentUser && (
                           <Badge variant="outline" className="text-xs">You</Badge>
                         )}
                       </div>
                       <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                         <span className="flex items-center gap-1">
                           <Clock className="w-3 h-3" />
                           {formatTime(attempt.timeTakenSeconds)}
                         </span>
                         <span className="flex items-center gap-1">
                           <Target className="w-3 h-3" />
                           {attempt.accuracy.toFixed(0)}%
                         </span>
                       </div>
                     </div>
 
                     {/* Score */}
                     <div className="text-right">
                       <p className="font-bold text-lg">
                         {attempt.score}/{attempt.maxScore}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
           </ScrollArea>
         )}
       </CardContent>
     </Card>
   );
 };