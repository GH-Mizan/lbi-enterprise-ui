
import { Component, OnInit, ChangeDetectorRef, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotifyService } from 'abp-ng2-module';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { CreateOrUpdateDailyCashInput, DailyCashEntryDto, DailyCashServiceProxy } from '@shared/service-proxies/service-proxies';
import moment from 'moment';
import { AppComponentBase } from '@shared/app-component-base';


@Component({
    selector: 'app-daily-cash-create',
    standalone: false,
    templateUrl: './daily-cash-create.component.html',
    animations: [appModuleAnimation()],
})


export class DailyCashCreateComponent extends AppComponentBase implements OnInit {
    /**
     *
     */
    constructor(
        injector: Injector,
        private readonly _dailyCashService: DailyCashServiceProxy,
        private readonly _router: Router,
        private cd: ChangeDetectorRef
    ) {

        super(injector);
    }

    ngOnInit(): void {
        
    }
}