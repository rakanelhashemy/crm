import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Googlecalendar } from '../../../core/models/googlecalendar';
import { Users } from '../../../core/models/users';
import { NameavtarPipe } from '../../../shared/pipes/nameavtar-pipe';
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  kind: 'default' | 'success';
}
@Component({
  selector: 'component-calendar',
  imports: [NameavtarPipe],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit{
  private readonly googleAuth = inject(Googlecalendar);
  private readonly usersService = inject(Users);

  connected = signal(false);

  ngOnInit(): void {

    this.getMyusersService()
    this.getstatus()
  }

  connect() {
    this.googleAuth.authgoogle().subscribe({
      next: (res) => {
        window.location.href = res.data;
      }
    });
  }

  disconnect() {
    this.connected.set(false);
    this.googleAuth.revoke().subscribe({
      next: (res) => {
      }
    });
  }

   name= signal<string|null>(null)
   email= signal<string|null>(null)
  getMyusersService(){
    this.usersService.getMyprofile().subscribe({
      next:(res)=>{
        console.log(res);
        this.email.set(res.data.email)
        
        this.name.set(res.data.fullName)
      }
    })
  }

    getstatus() {
    this.googleAuth.getStatus().subscribe({
      next: (res) => {
 
this.connected.set(res.data)
      }
    });
  }
}
