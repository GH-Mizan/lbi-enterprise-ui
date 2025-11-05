import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { InventoryCrossCheckDto, InventoryServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
    selector: 'app-general-stocks-report',
    standalone: false,
    templateUrl: './iventories-cross-check.component.html',
    animations: [appModuleAnimation()]
})
export class InventoriesCrossCheckComponent extends PagedListingComponentBase<InventoryCrossCheckDto> {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _virtualStocksService: InventoryServiceProxy
    ) {
        super(injector, cd);
    }

    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._virtualStocksService.getInventoriesDifference()
            .pipe(
                finalize(() => {
                    this.hideLoading();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;
                this.cd.detectChanges();
            });
    }

    delete() { }

}
