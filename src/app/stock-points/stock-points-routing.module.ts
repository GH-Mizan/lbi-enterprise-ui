import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockPointsComponent } from './stock-points.component';

const routes: Routes = [{ path: '', component: StockPointsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StockPointsRoutingModule { }
