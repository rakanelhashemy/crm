import { Component, computed, inject, signal } from '@angular/core';
import { Googlecalendar } from '../../../core/models/googlecalendar';
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  kind: 'default' | 'success';
}
@Component({
  selector: 'component-calendar',
  imports: [],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {
    private readonly googleAuth = inject(Googlecalendar);
 connected =signal(false)
 connect()
 {
  this.googleAuth.authgoogle().subscribe({

  next:(res)=>{
    console.log(res);
       window.location.href = res.data;
  }
  })
 }


 disconnect(){
  this.googleAuth.revoke().subscribe({
    next:(res)=>{
      console.log(res);
      
    }
  })
 }
}
