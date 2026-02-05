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
 import { useChallengeByCode } from "@/hooks/useChallenges";
 import { useNavigate } from "react-router-dom";
 import { Users, Loader2, AlertCircle } from "lucide-react";
 
 interface JoinChallengeDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 export const JoinChallengeDialog = ({
   open,
   onOpenChange,
 }: JoinChallengeDialogProps) => {
   const [code, setCode] = useState("");
   const [searchCode, setSearchCode] = useState<string | null>(null);
   const navigate = useNavigate();
   
   const { data: challenge, isLoading, isError } = useChallengeByCode(searchCode);
 
   const handleSearch = () => {
     if (code.trim().length >= 4) {
       setSearchCode(code.trim().toUpperCase());
     }
   };
 
   const handleJoin = () => {
     if (challenge) {
       onOpenChange(false);
       navigate(`/challenge/${challenge.challengeCode}`);
     }
   };
 
   const handleClose = () => {
     setCode("");
     setSearchCode(null);
     onOpenChange(false);
   };
 
   const showNotFound = searchCode && !isLoading && !challenge;
 
   return (
     <Dialog open={open} onOpenChange={handleClose}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <Users className="w-5 h-5 text-primary" />
             Join Challenge
           </DialogTitle>
           <DialogDescription>
             Enter a challenge code to compete with friends.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label htmlFor="code">Challenge Code</Label>
             <div className="flex gap-2">
               <Input
                 id="code"
                 value={code}
                 onChange={(e) => {
                   setCode(e.target.value.toUpperCase());
                   setSearchCode(null);
                 }}
                 placeholder="Enter 6-character code"
                 className="font-mono text-lg tracking-widest uppercase"
                 maxLength={6}
               />
               <Button
                 onClick={handleSearch}
                 disabled={code.length < 4 || isLoading}
               >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
               </Button>
             </div>
           </div>
 
           {showNotFound && (
             <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
               <AlertCircle className="w-4 h-4 flex-shrink-0" />
               <p>Challenge not found or has expired. Please check the code.</p>
             </div>
           )}
 
           {challenge && (
             <div className="p-4 rounded-lg bg-muted/50 space-y-2">
               <p className="font-medium">{challenge.title}</p>
               <p className="text-sm text-muted-foreground">
                 {challenge.quizData.questions.length} questions
               </p>
               <Button onClick={handleJoin} className="w-full mt-2 gap-2">
                 <Users className="w-4 h-4" />
                 Join Challenge
               </Button>
             </div>
           )}
         </div>
       </DialogContent>
     </Dialog>
   );
 };