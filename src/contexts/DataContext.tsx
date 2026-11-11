import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Content,
  ContentStatus,
  EventType,
  StudyEvent,
  Subject,
  Task,
} from '../lib/database.types';
import { syncReminders } from '../lib/notifications';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type SubjectInput = { name: string; teacher: string | null; color: string };
export type TaskInput = { title: string; due_date: string; subject_id: string | null };
export type EventInput = {
  type: EventType;
  title: string;
  starts_at: string;
  subject_id: string | null;
  reminder_enabled: boolean;
};

type DataContextValue = {
  /** True until the first load after sign in finishes. */
  loading: boolean;
  error: string | null;
  subjects: Subject[];
  contents: Content[];
  tasks: Task[];
  events: StudyEvent[];
  reload: () => Promise<void>;
  addSubject: (input: SubjectInput) => Promise<Subject>;
  updateSubject: (id: string, changes: Partial<SubjectInput>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addContent: (subjectId: string, title: string) => Promise<void>;
  setContentStatus: (id: string, status: ContentStatus) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  addTask: (input: TaskInput) => Promise<void>;
  setTaskDone: (id: string, done: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addEvent: (input: EventInput) => Promise<StudyEvent>;
  updateEvent: (id: string, changes: Partial<EventInput>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

const LOAD_ERROR = 'Não foi possível carregar seus dados. Verifique a conexão e tente de novo.';

type Lists = { subjects: Subject[]; contents: Content[]; tasks: Task[]; events: StudyEvent[] };

/** Lists are tagged with their owner, so a new sign in never shows the previous user's data. */
type Snapshot = Lists & { userId: string };

const EMPTY: Lists = { subjects: [], contents: [], tasks: [], events: [] };

const byStart = (a: StudyEvent, b: StudyEvent) => a.starts_at.localeCompare(b.starts_at);
const byDue = (a: Task, b: Task) =>
  a.due_date.localeCompare(b.due_date) || a.created_at.localeCompare(b.created_at);

/**
 * Holds the signed-in user's subjects, contents, tasks and events in memory.
 * Volumes are small (one student's semester), so everything is loaded once and
 * screens derive what they need; writes go to Supabase first and then update
 * the local lists, except toggles, which are optimistic and roll back on error.
 * Row level security scopes every query to the current user.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Derived instead of reset in an effect: `loading` is already true on the first
  // render after sign in, so the tabs never flash their empty states.
  const current = snapshot && snapshot.userId === userId ? snapshot : null;
  const { subjects, contents, tasks, events } = current ?? EMPTY;
  const loading = Boolean(userId) && ((!current && failedFor !== userId) || refreshing);
  const error = userId && failedFor === userId ? LOAD_ERROR : null;

  const fetchAll = useCallback(async (): Promise<Lists> => {
    const [s, c, t, e] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at'),
      supabase.from('contents').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('due_date').order('created_at'),
      supabase.from('events').select('*').order('starts_at'),
    ]);
    const failed = s.error ?? c.error ?? t.error ?? e.error;
    if (failed) throw failed;
    return { subjects: s.data ?? [], contents: c.data ?? [], tasks: t.data ?? [], events: e.data ?? [] };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    fetchAll()
      .then((lists) => {
        if (!active) return;
        setSnapshot({ userId, ...lists });
        setFailedFor(null);
      })
      .catch(() => {
        if (active) setFailedFor(userId);
      });
    return () => {
      active = false;
    };
  }, [userId, fetchAll]);

  /** Applies a change to one list; ignored when nobody is signed in. */
  const update = useCallback(
    <K extends keyof Lists>(key: K, change: (list: Lists[K]) => Lists[K]) => {
      setSnapshot((previous) =>
        previous ? ({ ...previous, [key]: change(previous[key]) } as Snapshot) : previous,
      );
    },
    [],
  );

  // Keeps the device's scheduled notifications in line with the events and the
  // reminder preferences. Runs on sign out too (empty lists), which cancels them.
  useEffect(() => {
    if (loading) return;
    syncReminders(events, subjects, profile).catch(() => {});
  }, [loading, events, subjects, profile]);

  const reload = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      setSnapshot({ userId, ...(await fetchAll()) });
      setFailedFor(null);
    } catch {
      setFailedFor(userId);
    } finally {
      setRefreshing(false);
    }
  }, [userId, fetchAll]);

  // Subjects

  const addSubject = useCallback(async (input: SubjectInput) => {
    const { data, error: failure } = await supabase.from('subjects').insert(input).select().single();
    if (failure) throw failure;
    update('subjects', (current) => [...current, data]);
    return data;
  }, [update]);

  const updateSubject = useCallback(async (id: string, changes: Partial<SubjectInput>) => {
    const { data, error: failure } = await supabase
      .from('subjects')
      .update(changes)
      .eq('id', id)
      .select()
      .single();
    if (failure) throw failure;
    update('subjects', (current) => current.map((item) => (item.id === id ? data : item)));
  }, [update]);

  const deleteSubject = useCallback(async (id: string) => {
    const { error: failure } = await supabase.from('subjects').delete().eq('id', id);
    if (failure) throw failure;
    update('subjects', (current) => current.filter((item) => item.id !== id));
    // The database cascades to contents and nulls subject_id on tasks and events.
    update('contents', (current) => current.filter((item) => item.subject_id !== id));
    update('tasks', (current) =>
      current.map((item) => (item.subject_id === id ? { ...item, subject_id: null } : item)),
    );
    update('events', (current) =>
      current.map((item) => (item.subject_id === id ? { ...item, subject_id: null } : item)),
    );
  }, [update]);

  // Contents

  const addContent = useCallback(async (subjectId: string, title: string) => {
    const { data, error: failure } = await supabase
      .from('contents')
      .insert({ subject_id: subjectId, title })
      .select()
      .single();
    if (failure) throw failure;
    update('contents', (current) => [...current, data]);
  }, [update]);

  const setContentStatus = useCallback(async (id: string, status: ContentStatus) => {
    let previous: ContentStatus | undefined;
    update('contents', (current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        previous = item.status;
        return { ...item, status };
      }),
    );
    const { error: failure } = await supabase.from('contents').update({ status }).eq('id', id);
    if (failure) {
      const rollback = previous;
      if (rollback) {
        update('contents', (current) =>
          current.map((item) => (item.id === id ? { ...item, status: rollback } : item)),
        );
      }
      throw failure;
    }
  }, [update]);

  const deleteContent = useCallback(async (id: string) => {
    const { error: failure } = await supabase.from('contents').delete().eq('id', id);
    if (failure) throw failure;
    update('contents', (current) => current.filter((item) => item.id !== id));
  }, [update]);

  // Tasks

  const addTask = useCallback(async (input: TaskInput) => {
    const { data, error: failure } = await supabase.from('tasks').insert(input).select().single();
    if (failure) throw failure;
    update('tasks', (current) => [...current, data].sort(byDue));
  }, [update]);

  const setTaskDone = useCallback(async (id: string, done: boolean) => {
    update('tasks', (current) => current.map((item) => (item.id === id ? { ...item, done } : item)));
    const { error: failure } = await supabase.from('tasks').update({ done }).eq('id', id);
    if (failure) {
      update('tasks', (current) =>
        current.map((item) => (item.id === id ? { ...item, done: !done } : item)),
      );
      throw failure;
    }
  }, [update]);

  const deleteTask = useCallback(async (id: string) => {
    const { error: failure } = await supabase.from('tasks').delete().eq('id', id);
    if (failure) throw failure;
    update('tasks', (current) => current.filter((item) => item.id !== id));
  }, [update]);

  // Events

  const addEvent = useCallback(async (input: EventInput) => {
    const { data, error: failure } = await supabase.from('events').insert(input).select().single();
    if (failure) throw failure;
    update('events', (current) => [...current, data].sort(byStart));
    return data;
  }, [update]);

  const updateEvent = useCallback(async (id: string, changes: Partial<EventInput>) => {
    const { data, error: failure } = await supabase
      .from('events')
      .update(changes)
      .eq('id', id)
      .select()
      .single();
    if (failure) throw failure;
    update('events', (current) => current.map((item) => (item.id === id ? data : item)).sort(byStart));
  }, [update]);

  const deleteEvent = useCallback(async (id: string) => {
    const { error: failure } = await supabase.from('events').delete().eq('id', id);
    if (failure) throw failure;
    update('events', (current) => current.filter((item) => item.id !== id));
  }, [update]);

  const value = useMemo(
    () => ({
      loading,
      error,
      subjects,
      contents,
      tasks,
      events,
      reload,
      addSubject,
      updateSubject,
      deleteSubject,
      addContent,
      setContentStatus,
      deleteContent,
      addTask,
      setTaskDone,
      deleteTask,
      addEvent,
      updateEvent,
      deleteEvent,
    }),
    [
      loading,
      error,
      subjects,
      contents,
      tasks,
      events,
      reload,
      addSubject,
      updateSubject,
      deleteSubject,
      addContent,
      setContentStatus,
      deleteContent,
      addTask,
      setTaskDone,
      deleteTask,
      addEvent,
      updateEvent,
      deleteEvent,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider.');
  }
  return context;
}
