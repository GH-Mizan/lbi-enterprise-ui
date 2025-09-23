import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { SalesColllectionDueReportComponent } from './sales-collection-due.component';
import { SharedModule } from '@shared/shared.module';
import { DailySalesReportComponent } from './daily-sales/daily-sales-report.component';
import { CustomerLedgerReportComponent } from './customer-ledger/customer-ledger-report.component';
import { CustomerDueReportComponent } from './customer-dues/customer-due-report.component';
import { CustomerOverallDuesReportComponent } from './customer-overall-dues/customer-overall-dues-report.component';
import { MonthlySalesRankingReportComponent } from './monthly-sales-ranking/monthly-sales-ranking.component';
import { DailyPurchaseReportComponent } from './daily-purchase/daily-purchase-report.component';
import { MonthlySalesInvoiceReportComponent } from './monthly-sales-invoices/monthly-sales-invoices.component';

@NgModule({
  declarations: [
    SalesColllectionDueReportComponent,
    DailySalesReportComponent,
    CustomerLedgerReportComponent,
    CustomerDueReportComponent,
    CustomerOverallDuesReportComponent,
    MonthlySalesRankingReportComponent,
    DailyPurchaseReportComponent,
    MonthlySalesInvoiceReportComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    ReportsRoutingModule
  ]
})

export class ReportsModule { }
