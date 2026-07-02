import { ChangeDetectorRef, Component, Injector, ViewChild } from "@angular/core";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PagedListingComponentBase } from "@shared/paged-listing-component-base";
import { SalaryAdvanceDto, SalaryServiceProxy } from "@shared/service-proxies/service-proxies";
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";


@Component({
    selector: 'app-salary-advance',
    templateUrl: './salary-advance.component.html',
    standalone: false,
    animations: [appModuleAnimation()],
    styles: [
        `
            .w-160 {
                width: 160px
            }
        `
    ]
})

export class SalaryAdvanceComponent extends PagedListingComponentBase<SalaryAdvanceDto> {
    @ViewChild('dataTable', { static: true }) dataTable: Table;
    saving: boolean = false;

    totalAdvance: number;
    totalLoan: number;
    totalBorrowing: number;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salaryService: SalaryServiceProxy,
    ) {
        super(injector, cd);
    }

    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._salaryService.getSalaryAdvanceList()
            .pipe(
                finalize(() => {
                    this.hideLoading();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result.advances;
                this.primengTableHelper.totalRecordsCount = result.advances.length;
                this.totalAdvance = result.totalAdvance;
                this.totalLoan = result.totalLoan;
                this.totalBorrowing = result.totalBorrowing;
                this.cd.detectChanges();
            });
    }

    delete() { }

    save(item: SalaryAdvanceDto) {
        this.saving = true;
        this.showLoading();
        this._salaryService.createOrUpdateSalaryAdvance(item).subscribe(res=> {
            this.refresh();
            this.notify.info("Successfully Saved");
            this.hideLoading();
            this.saving = false;
        })
    }

    bulkSave() {
        this.saving = true;
        this.showLoading();
        this._salaryService.createOrUpdateBulkSalaryAdvance(this.primengTableHelper.records).subscribe(res=> {
            this.notify.info("Successfully Saved");
            this.refresh();
            this.hideLoading();
            this.saving = false;
        })
    }

}