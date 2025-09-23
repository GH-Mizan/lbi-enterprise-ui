import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoriesRoutingModule } from './inventories-routing.module';
import { InventoriesComponent } from './inventories.component';
import { SharedModule } from '@shared/shared.module';
import { ProductTransferComponent } from './product-transfer/product-transfer.component';
import { ProductTransferHistoriesComponent } from './transfer-histories/product-transfer-history.component';
import { InventoriesBreakpointComponent } from './breakpoints/inventories-breakpoint.component';

@NgModule({
  declarations: [
    InventoriesComponent,
    ProductTransferComponent,
    ProductTransferHistoriesComponent,
    InventoriesBreakpointComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    InventoriesRoutingModule
  ]
})
export class InventoriesModule { }
