import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Supadmin } from './supadmin';

describe('Supadmin', () => {
  let component: Supadmin;
  let fixture: ComponentFixture<Supadmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Supadmin],
    }).compileComponents();

    fixture = TestBed.createComponent(Supadmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
