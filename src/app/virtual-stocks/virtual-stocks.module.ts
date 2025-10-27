import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VirtualStocksRoutingModule } from './virtual-stocks-routing.module';
import { VirtualStocksComponent } from './virtual-stocks.component';
import { VirtualStockEntryComponent } from './virtual-stocks-entry/virtual-stock-entry.component';
import { VirtualItemsComponent } from './virtual-items/virtual-items.component';
import { SharedModule } from '@shared/shared.module';
import { VirtualItemEntryComponent } from './virtual-item-entry/virtual-item-entry.component';
import { GeneralStocksComponent } from './general/general-stocks.component';
import { VirtualInventoriesComponent } from './virtual-inventories/virtual-inventories.component';


@NgModule({
  declarations: [
    VirtualStocksComponent,
    VirtualStockEntryComponent,
    VirtualItemsComponent,
    VirtualItemEntryComponent,
    GeneralStocksComponent,
    VirtualInventoriesComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    VirtualStocksRoutingModule
  ]
})

export class VirtualStocksModule { }
