import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { SalesComponent } from './sales.component';
import { SharedModule } from '@shared/shared.module';
import { SalesEntryComponent } from './sales-entry/sales-entry.component';
import { DueReceivedEntryComponent } from './due-received-entry/due-received-entry.component';
import { DueReceivedHistoryComponent } from './due-received-histories/due-received-histories.component';


@NgModule({
  declarations: [
    SalesComponent,
    SalesEntryComponent,
    DueReceivedEntryComponent,
    DueReceivedHistoryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    SalesRoutingModule
  ]
})
export class SalesModule { }
