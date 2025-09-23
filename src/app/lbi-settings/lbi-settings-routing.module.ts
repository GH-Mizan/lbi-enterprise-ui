import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LbiSettingsComponent } from './lbi-settings.component';

const routes: Routes = [{ path: '', component: LbiSettingsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LbiSettingsRoutingModule { }
