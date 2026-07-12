import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NgClass } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [RouterLink, ReactiveFormsModule, NgClass]
})
export class LoginComponent {
 private readonly  fb = inject(FormBuilder);
 private readonly  router = inject(Router);
 private readonly  authService = inject(AuthService);
 private readonly  toastrService = inject(ToastrService);

 show = false;
    loginsub= new Subscription();

passwordPattern = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%&*]).{6,}$/;
loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6) ,Validators.pattern(this.passwordPattern)]],
  },{ updateOn: 'blur' });

  onSubmit(): void {
   if(this.loginForm.valid)
{
this.loginsub.unsubscribe()


 this.loginsub= this.authService.signIn(this.loginForm.value).subscribe({

 next: (res)=>{

 this.router.navigate(["/dashboard"])
  this.toastrService.success("Login Successfully", "Success", {progressBar:true ,closeButton:true});
 },

 
 error:(err)=>{
 console.log(err);
  this.toastrService.error(err.error.message, "Failed", {progressBar:true ,closeButton:true});
 },
  })
}
else{
  this.loginForm.markAllAsTouched();
}
}

isShow(ref: HTMLInputElement): void {
  this.show = !this.show;
  ref.type = this.show ? 'text' : 'password';
}

  }


