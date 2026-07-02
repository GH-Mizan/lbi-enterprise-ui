import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdditionalPartiesComponent } from './additional-parties.component';

const routes: Routes = [{ path: '', component: AdditionalPartiesComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdditionalPartiesRoutingModule { }
