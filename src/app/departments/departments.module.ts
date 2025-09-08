import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DepartmentsRoutingModule } from './departments-routing.module';
import { DepartmentsComponent } from './departments.component';
import { DepartmentEntryComponent } from './department-entry/department-entry.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    DepartmentsComponent,
    DepartmentEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    DepartmentsRoutingModule
  ]
})
export class DepartmentsModule { }
