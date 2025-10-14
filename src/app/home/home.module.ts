import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { NgOptimizedImage } from '@angular/common';

@NgModule({
    imports: [SharedModule, HomeRoutingModule, HomeComponent, NgOptimizedImage],
})
export class HomeModule {}
