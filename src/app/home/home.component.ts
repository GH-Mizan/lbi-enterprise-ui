import { Component, Injector, ChangeDetectionStrategy } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { LocalizePipe } from '@shared/pipes/localize.pipe';

@Component({
    templateUrl: './home.component.html',
    animations: [appModuleAnimation()],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    styles: [
        `
            #bg {
                background-image: url("assets/img/home-img.png");
                background-position: center; /* Center the image */
                background-repeat: no-repeat; /* Prevent image repetition */
                background-size: cover; /* Scale image to cover the entire area */
                height: 110vh; /* Set height to 100% of viewport height */
                width: 85vw; /* Set width to 100% of viewport width */
            }
        `
    ]
})

export class HomeComponent extends AppComponentBase {
    constructor(injector: Injector) {
        super(injector);
    }
}
