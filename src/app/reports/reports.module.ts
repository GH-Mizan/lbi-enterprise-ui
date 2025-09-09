import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { SalesColllectionDueReportComponent } from './sales-collection-due.component';
import { SharedModule } from '@shared/shared.module';
import { DailySalesReportComponent } from './daily-sales/daily-sales-report.component';


@NgModule({
  declarations: [
    SalesColllectionDueReportComponent,
    DailySalesReportComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    ReportsRoutingModule
  ]
})
export class ReportsModule { }
