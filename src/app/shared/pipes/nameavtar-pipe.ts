import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nameavtar',
})
export class NameavtarPipe implements PipeTransform {
transform(value: string | null | undefined): string {
if (!value) return '-';

    return value
      .trim()                          // إزالة المسافات الزائدة في الأول والآخر
      .split(/\s+/)                   // تقسيم الكلمة بناءً على المسافات
      .map(word => word[0])           // أخذ أول حرف من كل كلمة
      .join('')                       // دمج الحروف مباشرة بدون مسافات (علشان تطلع SA)
      .toUpperCase()                  // تحويل الحروف لكابيتال
      .slice(0, 2);                   // أمان إضافي: لو الاسم 3 كلمات يأخذ أول حرفين بس (مثل Super Admin Manager -> SM)
  }
}
