import { Component, Injector, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    templateUrl: './home.component.html',
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    styles: [
        `
            #bg {
                background-position: center; /* Center the image */
                background-repeat: no-repeat; /* Prevent image repetition */
                background-size: cover; /* Scale image to cover the entire area */
                height: 110vh; /* Set height to 100% of viewport height */
                width: 91vw; /* Set width to 100% of viewport width */
            }
        `
    ]
})

export class HomeComponent extends AppComponentBase implements OnInit {

    imgUrl: string = "assets/img/home-img.png";

    constructor(injector: Injector, private readonly cd: ChangeDetectorRef) {
        super(injector);
    }

    async ngOnInit() {
        if(this.mobileView) {
            this.imgUrl = "assets/img/home-img-mobile.png";
            this.cd.detectChanges();
        }
       
    }
}
