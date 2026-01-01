import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { BuyAndSalesDifferenceDto, ComboboxItemDto, PurchaseServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Utils } from '@shared/helpers/Utils';
import moment from 'moment';

@Component({
    selector: 'app-buy-sale-diff',
    standalone: false,
    templateUrl: './buy-sale-difference.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
        :host ::ng-deep .p-inputtext {
            min-width: 110px !important;
        }
        `
    ]
})
export class BuyAndSaleDifferenceComponent extends PagedListingComponentBase<BuyAndSalesDifferenceDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    monthId: number;
    yearId: number;
    months: ComboboxItemDto[] = [];
    years: ComboboxItemDto[] = [];
    date = undefined;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _purchaseService: PurchaseServiceProxy
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this.months = Utils.getMonths();
        this.months = [...this.months, { value: '-1', displayText: 'All' } as ComboboxItemDto];
        const currentYear: number = new Date().getFullYear();
        this.years = Utils.getYears(currentYear);
        this.years = [...this.years, { value: '-1', displayText: 'All' } as ComboboxItemDto];
        this.monthId = new Date().getMonth() + 1;
        this.yearId = currentYear;
        this.cd.detectChanges();
    }

    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._purchaseService.getBuyAndSalesDifference(this.monthId, this.yearId, this.date? moment(this.date): undefined)
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
