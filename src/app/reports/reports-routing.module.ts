import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesColllectionDueReportComponent } from './sales-collection-due.component';
import { DailySalesReportComponent } from './daily-sales/daily-sales-report.component';

const routes: Routes = [
  { path: 'sales-collection-due', component: SalesColllectionDueReportComponent },
  { path: 'daily-sales', component: DailySalesReportComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
