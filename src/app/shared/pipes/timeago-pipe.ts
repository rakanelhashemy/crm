import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeago',
})
export class TimeagoPipe implements PipeTransform {
transform(value: any): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 29) return 'Just now';
    
    // Time intervals in seconds
    const intervals: { [key: string]: number } = {
      'y': 31536000,
      'mo': 2592000,
      'w': 604800,
      'd': 86400,
      'h': 3600,
      'm': 60,
      's': 1
    };

    for (const key in intervals) {
      const counter = Math.floor(seconds / intervals[key]);
      if (counter > 0) {
        return `${counter}${key} ago`; 
      }
    }
    return '';
  }
}
