export type TaskStatus = 'Todo' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  subtitle?: string | null;
  priority: number;             // رقم (مثلاً: 0، 1، 2)
  priorityLabel?: TaskPriority; // نص ('Low' | 'Medium' | 'High')
  dueDate: string;
  isOverdue?: boolean;
  status: number;               // رقم من الـ API (مثلاً: 0، 1، 2)
  statusLabel: TaskStatus;      // النص المطابق للحالة ('Todo' | 'Completed' | 'Cancelled')
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeInitials?: string;
  createdByName?: string;
  updatedByName?: string | null;
  leadId?: string | null;
  leadName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface KanbanColumn {
  statusNumber: number;       
  status: TaskStatus;
  label: string;
  colorVar: string;
}