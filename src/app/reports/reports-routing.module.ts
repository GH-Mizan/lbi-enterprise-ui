import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesColllectionDueReportComponent } from './sales-collection-due.component';
import { DailySalesReportComponent } from './daily-sales/daily-sales-report.component';
import { CustomerLedgerReportComponent } from './customer-ledger/customer-ledger-report.component';
import { CustomerDueReportComponent } from './customer-dues/customer-due-report.component';
import { CustomerOverallDuesReportComponent } from './customer-overall-dues/customer-overall-dues-report.component';
import { MonthlySalesRankingReportComponent } from './monthly-sales-ranking/monthly-sales-ranking.component';
import { DailyPurchaseReportComponent } from './daily-purchase/daily-purchase-report.component';
import { MonthlySalesInvoiceReportComponent } from './monthly-sales-invoices/monthly-sales-invoices.component';
import { MonthlyPurchaseReportComponent } from './monthly-purchases/monthly-purchase-report.component';
import { BuyAndSaleDifferenceComponent } from './buy-sale-diff/buy-sale-difference.component';

const routes: Routes = [
  { path: 'sales-collection-due', component: SalesColllectionDueReportComponent },
  { path: 'daily-sales', component: DailySalesReportComponent },
  { path: 'daily-purchase', component: DailyPurchaseReportComponent },
  { path: 'monthly-purchase', component: MonthlyPurchaseReportComponent },
  { path: 'customer-ledger', component: CustomerLedgerReportComponent },
  { path: 'customer-dues', component: CustomerDueReportComponent },
  { path: 'customer-overall-dues', component: CustomerOverallDuesReportComponent },
  { path: 'monthly-sales-ranking', component: MonthlySalesRankingReportComponent },
  { path: 'monthly-sales-invoices', component: MonthlySalesInvoiceReportComponent },
  { path: 'purchase-sale-diff', component: BuyAndSaleDifferenceComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
