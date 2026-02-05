 import { useState } from "react";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useUserChallenges, useDeactivateChallenge } from "@/hooks/useChallenges";
 import { useNavigate } from "react-router-dom";
 import { 
   Trophy, Users, Copy, ExternalLink, XCircle, 
   Loader2, FolderOpen, Plus, Check 
 } from "lucide-react";
 import { toast } from "sonner";
 import { cn } from "@/lib/utils";
 import { format } from "date-fns";
 
 interface MyChallengesSectionProps {
   onJoinChallenge: () => void;
 }
 
 export const MyChallengesSection = ({ onJoinChallenge }: MyChallengesSectionProps) => {
   const { data, isLoading } = useUserChallenges();
   const deactivateChallenge = useDeactivateChallenge();
   const navigate = useNavigate();
   const [copiedId, setCopiedId] = useState<string | null>(null);
 
   const handleCopyCode = (code: string, id: string) => {
     navigator.clipboard.writeText(code);
     setCopiedId(id);
     toast.success("Code copied!");
     setTimeout(() => setCopiedId(null), 2000);
   };
 
   const handleViewChallenge = (code: string) => {
     navigate(`/challenge/${code}`);
   };
 
   if (isLoading) {
     return (
       <Card className="glass-card">
         <CardContent className="py-12 flex items-center justify-center">
           <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
         </CardContent>
       </Card>
     );
   }
 
   const created = data?.created || [];
   const joined = data?.joined || [];
   const hasAny = created.length > 0 || joined.length > 0;
 
   return (
     <Card className="glass-card">
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Trophy className="w-5 h-5 text-primary" />
           My Challenges
         </CardTitle>
       </CardHeader>
       <CardContent>
         {!hasAny ? (
           <div className="py-8 text-center">
             <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
             <p className="text-muted-foreground mb-4">No challenges yet</p>
             <Button onClick={onJoinChallenge} variant="outline" className="gap-2">
               <Plus className="w-4 h-4" />
               Join a Challenge
             </Button>
           </div>
         ) : (
           <Tabs defaultValue="created">
             <TabsList className="w-full mb-4">
               <TabsTrigger value="created" className="flex-1 gap-2">
                 <Users className="w-4 h-4" />
                 Created ({created.length})
               </TabsTrigger>
               <TabsTrigger value="joined" className="flex-1 gap-2">
                 <Trophy className="w-4 h-4" />
                 Joined ({joined.length})
               </TabsTrigger>
             </TabsList>
 
             <TabsContent value="created" className="space-y-3 mt-0">
               {created.length === 0 ? (
                 <p className="text-center text-muted-foreground py-4">
                   No challenges created yet
                 </p>
               ) : (
                 created.map((challenge) => (
                   <div
                     key={challenge.id}
                     className={cn(
                       "flex items-center gap-3 p-3 rounded-lg border",
                       challenge.isActive ? "bg-muted/30" : "bg-muted/10 opacity-60"
                     )}
                   >
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="font-medium truncate">{challenge.title}</p>
                         {!challenge.isActive && (
                           <Badge variant="secondary" className="text-xs">Inactive</Badge>
                         )}
                       </div>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                         <span className="font-mono">{challenge.challengeCode}</span>
                         <span>•</span>
                         <span>{challenge.quizData.questions.length} questions</span>
                         <span>•</span>
                         <span>{format(new Date(challenge.createdAt), 'MMM d')}</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-1">
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => handleCopyCode(challenge.challengeCode, challenge.id)}
                       >
                         {copiedId === challenge.id ? (
                           <Check className="w-4 h-4 text-green-500" />
                         ) : (
                           <Copy className="w-4 h-4" />
                         )}
                       </Button>
                       <Button
                         variant="ghost"
                         size="icon"
                         className="h-8 w-8"
                         onClick={() => handleViewChallenge(challenge.challengeCode)}
                       >
                         <ExternalLink className="w-4 h-4" />
                       </Button>
                       {challenge.isActive && (
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-destructive hover:text-destructive"
                           onClick={() => deactivateChallenge.mutate(challenge.id)}
                           disabled={deactivateChallenge.isPending}
                         >
                           <XCircle className="w-4 h-4" />
                         </Button>
                       )}
                     </div>
                   </div>
                 ))
               )}
             </TabsContent>
 
             <TabsContent value="joined" className="space-y-3 mt-0">
               {joined.length === 0 ? (
                 <p className="text-center text-muted-foreground py-4">
                   No challenges joined yet
                 </p>
               ) : (
                 joined.map((challenge) => (
                   <div
                     key={challenge.id}
                     className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                   >
                     <div className="flex-1 min-w-0">
                       <p className="font-medium truncate">{challenge.title}</p>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                         <span>{challenge.quizData.questions.length} questions</span>
                       </div>
                     </div>
                     <Button
                       variant="outline"
                       size="sm"
                       className="gap-2"
                       onClick={() => handleViewChallenge(challenge.challengeCode)}
                     >
                       <Trophy className="w-4 h-4" />
                       View
                     </Button>
                   </div>
                 ))
               )}
             </TabsContent>
           </Tabs>
         )}
       </CardContent>
     </Card>
   );
 };