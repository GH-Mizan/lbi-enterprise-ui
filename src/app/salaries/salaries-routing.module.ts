import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalaryAdvanceComponent } from './salary-advances/salary-advance.component';
import { SalaryComponent } from './salary/salary.component';
import { SalaryEntryComponent } from './salary/salary-entry/salary-entry.component';

const routes: Routes = [
  { path: 'salary', component: SalaryComponent },
  { path: 'salary-entry', component: SalaryEntryComponent },
  { path: 'salary-advance', component: SalaryAdvanceComponent },
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class SalariesRoutingModule { }
