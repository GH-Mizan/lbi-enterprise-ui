import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VirtualStocksComponent } from './virtual-stocks.component';
import { VirtualItemsComponent } from './virtual-items/virtual-items.component';
import { GeneralStocksComponent } from './general/general-stocks.component';
import { VirtualInventoriesComponent } from './virtual-inventories/virtual-inventories.component';

const routes: Routes = [
  
  {path: '', component: VirtualInventoriesComponent},
  { path: 'client', component: VirtualStocksComponent },
  { path: 'plant', component: VirtualStocksComponent },
  { path: 'items', component: VirtualItemsComponent },
  { path: 'general', component: GeneralStocksComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VirtualStocksRoutingModule { }
