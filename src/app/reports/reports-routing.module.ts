import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesColllectionDueReportComponent } from './sales-collection-due.component';

const routes: Routes = [{ path: 'sales-collection-due', component: SalesColllectionDueReportComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
