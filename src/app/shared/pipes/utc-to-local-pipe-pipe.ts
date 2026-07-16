import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utcToLocal',
  standalone: true,
})
export class UtcToLocalPipe implements PipeTransform {
  transform(
    value: string | Date | null | undefined,
    format: 'full' | 'date' | 'time' = 'full'
  ): string {
    if (!value) return '';

    const date = typeof value === 'string' ? this.parseAsUtc(value) : value;
    if (isNaN(date.getTime())) return '';

    const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const options: Intl.DateTimeFormatOptions = { timeZone: deviceTimeZone };

    if (format === 'date') {
      Object.assign(options, { year: 'numeric', month: '2-digit', day: '2-digit' });
    } else if (format === 'time') {
      Object.assign(options, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } else {
      Object.assign(options, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',  hour12: true,
      });
    }

    return new Intl.DateTimeFormat('en-CA', options).format(date);
  }

  private parseAsUtc(value: string): Date {
    const str = value.trim();
    // لو مفيش Z ولا +/-offset في الآخر، ضيف Z عشان يتفسر صح كـ UTC
    const hasTimezone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(str);
    return new Date(hasTimezone ? str : str + 'Z');
  }
}