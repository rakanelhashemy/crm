import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { KanbanColumn, Task, TaskStatus } from './taskssinter';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeadFilter } from '../leads/leadfilter';
import { Taskss } from '../../../core/models/tasks';
import { Lookup } from '../../../core/models/lookup';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';
import { TasksModal } from "./tasks-modal/tasks-modal";

interface TaskCard {
  id: string;
  title: string;
  leadName?: string;
  priority: TaskStatus;
  dueDate: string;
  assigneeInitials: string;
  assigneeName: string;
  createdBy: string;
  updatedBy?: string;
}

@Component({
  selector: 'component-tasks',
  imports: [FormsModule, CommonModule, NameavtarPipe, TasksModal],
  providers: [],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks implements OnInit {
  private readonly taskService = inject(Taskss);
  private readonly LookupService = inject(Lookup);

  // تحويل الفلاتر لـ Signal لسهولة التحديث وإعادة جلب البيانات تلقائياً
  queryFilters = signal<LeadFilter>({
    pageNumber: 1,
    pageSize: 10,
    search: '',
  });

  columns = signal<KanbanColumn[]>([]);
  tasks = signal<Task[]>([]);

  constructor() {
    effect(() => {
      const filters = this.queryFilters();
      if (this.columns().length > 0) {
        this.loadTasks(filters);
      }
    });
  }

  ngOnInit(): void {
    this.loadStatusesAndTasks();
  }

  loadStatusesAndTasks(): void {
    this.LookupService.gettasksStatuses().subscribe({
      next: (res: any) => {
        if (res?.succeeded && Array.isArray(res.data)) {
          const dynamicColumns = res.data.map((item: any) => ({
            statusNumber: item.value, 
            status: item.name,        
            label: item.label,        
            colorVar: this.getColorForStatus(item.name) 
          }));
          this.columns.set(dynamicColumns);
          this.loadTasks(this.queryFilters());
        }
      },
      error: (err) => {
        console.error('Error fetching statuses:', err);
        this.setFallbackColumns();
        this.loadTasks(this.queryFilters());
      }
    });
  }

  // تمرير الفلاتر للـ Service ليتم إرسالها للباك-إند
  loadTasks(filters: LeadFilter): void {
    // تأكد أن الـ الـ getTasks في الـ Service عندك بتقبل الـ filters كـ Parameter
    this.taskService.getTasks(filters).subscribe({
      next: (res: any) => {
        console.log(res);
        
       this.totalCount.set(res?.data?.totalCount ?? 0);
        this.totalPages.set(
          res?.data?.totalPages ??
          Math.ceil((res?.data?.totalCount ?? 0) / (this.queryFilters().pageSize || 10))
        );
        
        const extractedTasks = res?.data?.data || res?.data; 
        if (Array.isArray(extractedTasks)) {
          this.tasks.set(extractedTasks);
        } else {
          this.tasks.set([]);
        }
      },
      error: (err) => {
        console.error('Error fetching tasks:', err);
        this.tasks.set([]);
      }
    });
  }

  // دالة لتحديث كلمة البحث من الـ HTML (مثال: عند كتابة مستخدم في الـ Input)
  onSearchChange(searchTerm: string): void {
    this.queryFilters.update(prev => ({
      ...prev,
      search: searchTerm,
      pageNumber: 1 // إعادة الترقيم للصفحة الأولى عند البحث الجديد
    }));
  }

  // الفلترة المحلية الآن بناءً على الـ statusNumber فقط لأن البحث تم في السيرفر
  getFilteredTasks(statusNumber: number): Task[] {
    const currentTasks = this.tasks();
    if (!Array.isArray(currentTasks)) return [];

    return currentTasks.filter(task => task.status === statusNumber);
  }

  // حساب عدد المهام لكل عمود
  getTaskCount(statusNumber: number): number {
    const currentTasks = this.tasks();
    if (!Array.isArray(currentTasks)) return 0;
    
    return currentTasks.filter(task => task.status === statusNumber).length;
  }

  // --- السحب والإفلات ---
  onDragStart(event: DragEvent, taskId: string): void {
    event.dataTransfer?.setData('text/plain', taskId);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, newStatusNumber: number): void {
    event.preventDefault();
    const taskId = event.dataTransfer?.getData('text/plain');
    if (!taskId) return;

    this.taskService.updateTaskStatus(taskId, newStatusNumber).subscribe({
      next: (res) => {
        console.log('Status updated successfully:', res);
        
        this.tasks.update(allTasks => 
          allTasks.map(t => t.id === taskId ? { ...t, status: newStatusNumber } : t)
        );
      },
      error: (err) => {
        console.error('Error updating task status:', err);
      }
    });
  }

  private getColorForStatus(statusName: string): string {
    switch (statusName) {
      case 'Todo': return 'var(--info-600)';
      case 'Completed': return 'var(--success-600)';
      case 'Cancelled': return 'var(--danger-600)';
      default: return 'var(--warning-600)'; 
    }
  }

  private setFallbackColumns(): void {
    this.columns.set([
      { statusNumber: 1, status: 'Todo', label: 'Todo', colorVar: 'var(--info-600)' },
      { statusNumber: 2, status: 'Completed', label: 'Completed', colorVar: 'var(--success-600)' },
      { statusNumber: 3, status: 'Cancelled', label: 'Cancelled', colorVar: 'var(--danger-600)' }
    ]);
  }

   totalCount = signal(0);
  totalPages = signal(0);
  pagesArray = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );


goToPage(page: number) {
  if (page < 1 || page > this.totalPages() || page === this.queryFilters().pageNumber) return; // هنا تحاول قراءتها كخاصية
  this.queryFilters().pageNumber = page; // وهنا تحاول تعديلها مباشرة كأنها كائن عادي
  this.loadTasks(this.queryFilters()); // وهنا تمرر الـ Signal نفسه بدلاً من قيمته
}

  nextPage() {
    this.goToPage((this.queryFilters().pageNumber || 1) + 1);
  }

  prevPage() {
    this.goToPage((this.queryFilters().pageNumber || 1) - 1);
  }

  onPageSizeChange() {
    this.queryFilters().pageNumber = 1;
    this.loadTasks(this.queryFilters());
  }






   isDeleteModalOpen = signal(false);
deleteTasksID = signal<string | null>(null);

isDeleting = signal(false);

opendeleteModal(leadId: string) {
  this.deleteTasksID.set(leadId);
  this.isDeleteModalOpen.set(true);
}

closeDeleteModal() {
  this.isDeleteModalOpen.set(false);
  this.deleteTasksID.set(null);
}

confirmDelete() {
  this.deleteTasks(this.deleteTasksID()!);
}

deleteTasks(leadId: string) {
  this.isDeleting.set(true);
  this.taskService.deleteTask(leadId).subscribe({
    next: () => {
      this.isDeleting.set(false);
      this.loadTasks(this.queryFilters());
      this.closeDeleteModal();
    },
    error: (err) => {
      this.isDeleting.set(false);
      console.error('Error deleting lead:', err);
    },
  });
}







  isModalOpen=signal (false)
editingTasksId =signal<string|null>(null)
  closeModal() {
    this.isModalOpen.set(false);
    this.editingTasksId.set(null);
      this.loadTasks(this.queryFilters());
  }

   openAddModal() {
    this.editingTasksId.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(tasksid: string) {
    this.editingTasksId.set(tasksid);
    this.isModalOpen.set(true);
 
  }
}