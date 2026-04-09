export interface Topic {
  id: number;
  text: string;
}

export interface SubjectHomework {
  date: string;
  topics: Topic[];
  hours?: string;
  minutes?: string;
}

export interface HomeworkData {
  [subject: string]: SubjectHomework;
}

export interface ScheduleEntry {
  id: string;
  pairNumber: number;
  subjectName: string;
  type: string;
  number: string;
  room: string;
  teacher: string;
}

export interface DailySchedule {
  [dateKey: string]: ScheduleEntry[];
}
