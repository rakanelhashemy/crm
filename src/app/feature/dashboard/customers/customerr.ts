interface Customerr {
id: string;
  fullName: string;
  phone: string;
  customerTag: number;
  customerTagLabel: string;
  notes: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string | null;
  createdByName: string;
  updatedByName: string | null;
  deals: Deal[];
  totalDeals: number;
  pendingTasks: TaskItem[];
  totalPendingTasks: number;

}

interface Deal {
  id: string;
  propertyName: string;
  stage: string;
  dealValue: number;
}
interface TaskItem {
 id: string;
  title: string;
  dueDate: string;
}