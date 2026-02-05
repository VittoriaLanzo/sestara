 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { ExternalLink } from "lucide-react";
 
 interface OpenInBrowserDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   url: string;
   title: string;
 }
 
 export const OpenInBrowserDialog = ({
   open,
   onOpenChange,
   url,
   title,
 }: OpenInBrowserDialogProps) => {
   const handleOpenExternal = () => {
     // Create an anchor element for reliable external navigation
     const link = document.createElement("a");
     link.href = url;
     link.target = "_blank";
     link.rel = "noopener noreferrer";
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     onOpenChange(false);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <ExternalLink className="w-5 h-5" />
             Open in Browser
           </DialogTitle>
           <DialogDescription className="text-left space-y-2">
             <p className="font-medium text-foreground">{title}</p>
             <p>
               This will open the video in your preferred browser or app 
               (YouTube, Brave, Chrome, etc.).
             </p>
             <p className="text-xs text-muted-foreground">
               Tip: Use your preferred browser for ad-blocking or VPN support.
             </p>
           </DialogDescription>
         </DialogHeader>
         <DialogFooter className="flex-col sm:flex-row gap-2">
           <Button variant="outline" onClick={() => onOpenChange(false)}>
             Cancel
           </Button>
           <Button onClick={handleOpenExternal} className="gap-2">
             <ExternalLink className="w-4 h-4" />
             Open Video
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   );
 };