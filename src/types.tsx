
export interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

export interface WgerExercise {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  category?: { id: number; name: string };
  images?: { id: number; image: string }[];
  videos?: { id: number; video: string }[];
  muscles?: WgerMuscle[];
  muscles_secondary?: WgerMuscle[];
  equipment?: { id: number; name: string }[];
}

export interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
}

export interface PlannedExercise {
  uniqueId: string;
  wgerData: WgerExercise;
  sets: WorkoutSet[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: PlannedExercise[];
  dateCreated: string;
}

export interface CompletedWorkout {
  id: string;            
  planId: string;        
  planName: string;      
  dateCompleted: string; 
  exercises: PlannedExercise[];
}