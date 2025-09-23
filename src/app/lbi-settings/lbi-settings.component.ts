import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NotifyService } from 'abp-ng2-module';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { LbiSettingsOutputDto, LbiSettingsServiceProxy, LbiSettingsUpdateDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'app-lbi-settings',
    standalone: false,
    templateUrl: './lbi-settings.component.html',
    animations: [appModuleAnimation()]
})
export class LbiSettingsComponent implements OnInit {

    data: LbiSettingsOutputDto[] = [];
    loading = true;

    constructor(
        private cd: ChangeDetectorRef,
        private readonly _lbiSettingsService: LbiSettingsServiceProxy,
        private readonly _notifyService: NotifyService
    ) {

    }
    ngOnInit(): void {
        this._lbiSettingsService.getAll().subscribe(res=> {
          this.data = res;
            this.loading = false;
            this.cd.detectChanges();
        })
    }

    update(item: LbiSettingsOutputDto) {
        this._lbiSettingsService.update({key: item.key, value: item.value} as LbiSettingsUpdateDto).subscribe(()=> {
          this._notifyService.info("Successfully Updated");
        })
    }

  }
