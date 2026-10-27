// Written by hand to match supabase/schema.sql; change both files together.
// `npx supabase gen types typescript --project-id <id>` can generate it instead.

export type ContentStatus = 'a_estudar' | 'estudando' | 'revisado';
export type EventType = 'prova' | 'trabalho' | 'atividade' | 'outro';

// Insert demands the `Required` columns and leaves `Generated` ones (ids,
// defaults, timestamps) optional, since the database fills them in.
type Table<Row, Required extends keyof Row, Generated extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required | Generated>> & Partial<Pick<Row, Generated>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  exam_reminder_enabled: boolean;
  exam_reminder_days_before: number;
  exam_reminder_time: string;
  assignment_reminder_enabled: boolean;
  assignment_reminder_days_before: number;
  assignment_reminder_time: string;
  high_priority_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  user_id: string;
  name: string;
  teacher: string | null;
  color: string;
  created_at: string;
};

export type Content = {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  due_date: string;
  done: boolean;
  created_at: string;
};

export type StudyEvent = {
  id: string;
  user_id: string;
  subject_id: string | null;
  type: EventType;
  title: string;
  starts_at: string;
  reminder_enabled: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, 'id', 'created_at' | 'updated_at'>;
      subjects: Table<Subject, 'name', 'id' | 'user_id' | 'created_at'>;
      contents: Table<Content, 'subject_id' | 'title', 'id' | 'user_id' | 'created_at' | 'updated_at'>;
      tasks: Table<Task, 'title' | 'due_date', 'id' | 'user_id' | 'created_at'>;
      events: Table<StudyEvent, 'type' | 'title' | 'starts_at', 'id' | 'user_id' | 'created_at'>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      content_status: ContentStatus;
      event_type: EventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
