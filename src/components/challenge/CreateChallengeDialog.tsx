 import { useState } from "react";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { useCreateChallenge } from "@/hooks/useChallenges";
 import type { CustomQuiz } from "@/hooks/useCustomQuizzes";
 import { Copy, Link, Users, Check, Loader2 } from "lucide-react";
 import { toast } from "sonner";
 
 interface CreateChallengeDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   quiz: CustomQuiz;
   sourceQuizId?: string;
 }
 
 export const CreateChallengeDialog = ({
   open,
   onOpenChange,
   quiz,
   sourceQuizId,
 }: CreateChallengeDialogProps) => {
   const [title, setTitle] = useState(quiz.quizTitle);
   const [challengeCode, setChallengeCode] = useState<string | null>(null);
   const [copiedCode, setCopiedCode] = useState(false);
   const [copiedLink, setCopiedLink] = useState(false);
   
   const createChallenge = useCreateChallenge();
 
   const handleCreate = async () => {
     const result = await createChallenge.mutateAsync({
       quiz,
       title,
       sourceQuizId,
     });
     setChallengeCode(result.challenge_code);
   };
 
   const getChallengeUrl = () => {
     return `${window.location.origin}/challenge/${challengeCode}`;
   };
 
   const handleCopyCode = () => {
     navigator.clipboard.writeText(challengeCode || '');
     setCopiedCode(true);
     toast.success("Code copied!");
     setTimeout(() => setCopiedCode(false), 2000);
   };
 
   const handleCopyLink = () => {
     navigator.clipboard.writeText(getChallengeUrl());
     setCopiedLink(true);
     toast.success("Link copied!");
     setTimeout(() => setCopiedLink(false), 2000);
   };
 
   const handleClose = () => {
     setChallengeCode(null);
     setCopiedCode(false);
     setCopiedLink(false);
     setTitle(quiz.quizTitle);
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Users className="w-5 h-5 text-primary" />
             Challenge Friends
           </DialogTitle>
           <DialogDescription>
             {challengeCode 
               ? "Share this code or link with friends to compete!"
               : "Create a challenge and share it with friends to compete."}
           </DialogDescription>
         </DialogHeader>
 
         {!challengeCode ? (
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label htmlFor="title">Challenge Title</Label>
               <Input
                 id="title"
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 placeholder="Enter challenge title"
               />
             </div>
             
             <div className="text-sm text-muted-foreground space-y-1">
               <p>• {quiz.questions.length} questions</p>
               <p>• Same quiz for all participants</p>
               <p>• Leaderboard based on score & time</p>
             </div>
 
             <Button 
               onClick={handleCreate} 
               className="w-full gap-2"
               disabled={createChallenge.isPending}
             >
               {createChallenge.isPending ? (
                 <>
                   <Loader2 className="w-4 h-4 animate-spin" />
                   Creating...
                 </>
               ) : (
                 <>
                   <Users className="w-4 h-4" />
                   Create Challenge
                 </>
               )}
             </Button>
           </div>
         ) : (
           <div className="space-y-4 py-4">
             {/* Challenge Code */}
             <div className="space-y-2">
               <Label>Challenge Code</Label>
               <div className="flex gap-2">
                 <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-xl text-center tracking-widest">
                   {challengeCode}
                 </div>
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={handleCopyCode}
                   className="flex-shrink-0"
                 >
                   {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                 </Button>
               </div>
             </div>
 
             {/* Challenge Link */}
             <div className="space-y-2">
               <Label>Share Link</Label>
               <div className="flex gap-2">
                 <Input
                   value={getChallengeUrl()}
                   readOnly
                   className="font-mono text-xs"
                 />
                 <Button
                   variant="outline"
                   size="icon"
                   onClick={handleCopyLink}
                   className="flex-shrink-0"
                 >
                   {copiedLink ? <Check className="w-4 h-4 text-green-500" /> : <Link className="w-4 h-4" />}
                 </Button>
               </div>
             </div>
 
             <div className="p-3 bg-primary/5 rounded-lg text-sm text-muted-foreground">
               <p className="font-medium text-foreground mb-1">How to share:</p>
               <p>Friends can enter the code on the Practice page, or open the link directly.</p>
             </div>
 
             <Button onClick={handleClose} variant="outline" className="w-full">
               Done
             </Button>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 };