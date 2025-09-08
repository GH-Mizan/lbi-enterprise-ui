import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StockPointsRoutingModule } from './stock-points-routing.module';
import { StockPointsComponent } from './stock-points.component';
import { StockPointEntryComponent } from'./stock-point-entry/stock-point-entry.component';
import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    StockPointsComponent,
    StockPointEntryComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    StockPointsRoutingModule
  ]
})
export class StockPointsModule { }
