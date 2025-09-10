import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesColllectionDueReportComponent } from './sales-collection-due.component';
import { DailySalesReportComponent } from './daily-sales/daily-sales-report.component';
import { CustomerLedgerReportComponent } from './customer-ledger/customer-ledger-report.component';
import { CustomerDueReportComponent } from './customer-dues/customer-due-report.component';

const routes: Routes = [
  { path: 'sales-collection-due', component: SalesColllectionDueReportComponent },
  { path: 'daily-sales', component: DailySalesReportComponent },
  { path: 'customer-ledger', component: CustomerLedgerReportComponent },
  { path: 'customer-dues', component: CustomerDueReportComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
