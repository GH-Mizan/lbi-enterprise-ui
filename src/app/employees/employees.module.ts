import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EmployeesRoutingModule } from './employees-routing.module';
import { EmployeesComponent } from './employees.component';
import { EmployeeEntryComponent } from './employee-entry/employee-entry.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    EmployeesComponent,
    EmployeeEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    EmployeesRoutingModule
  ]
})
export class EmployeesModule { }
