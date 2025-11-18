import { Dumbbell } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Dumbbell className="h-7 w-7" />
      <span className="font-bold text-xl text-foreground font-headline">
        FitTrack
      </span>
    </div>
  );
}
