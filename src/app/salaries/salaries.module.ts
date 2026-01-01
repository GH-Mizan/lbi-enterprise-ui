import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { SharedModule } from '@shared/shared.module';
import { SalariesRoutingModule } from "./salaries-routing.module";
import { SalaryAdvanceComponent } from "./salary-advances/salary-advance.component";
import { SalaryComponent } from "./salary/salary.component";
import { SalaryEntryComponent } from "./salary/salary-entry/salary-entry.component";

@NgModule({
  declarations: [
    SalaryAdvanceComponent,
    SalaryComponent,
    SalaryEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    SalariesRoutingModule
  ]
})

export class SalariesModule { }
