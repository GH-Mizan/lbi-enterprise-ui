import { ChangeDetectorRef, Component, Injector, ViewChild } from "@angular/core";
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { SalaryOutputDto, SalaryServiceProxy } from "@shared/service-proxies/service-proxies";
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { Router } from "@angular/router";


@Component({
    selector: 'app-salary',
    templateUrl: './salary.component.html',
    standalone: false,
    animations: [appModuleAnimation()],
    styles: [
        `
        `
    ]
})

export class SalaryComponent extends PagedListingComponentBase<SalaryOutputDto> {
    @ViewChild('dataTable', { static: true }) dataTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;

    employeeId: number;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salaryService: SalaryServiceProxy,
        private _router: Router
    ) {
        super(injector, cd);
    }

    list(event?: LazyLoadEvent): void {
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);

            if (
                this.primengTableHelper.records &&
                this.primengTableHelper.records.length > 0
            ) {
                return;
            }
        }

        this.primengTableHelper.showLoadingIndicator();
        this._salaryService.getPaginatedSalaryList(
            this.employeeId,
            "",
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getMaxResultCount(this.paginator, event)
        ).pipe(
            finalize(() => {
                this.primengTableHelper.hideLoadingIndicator();
            })
        )
            .subscribe((result) => {
                this.primengTableHelper.records = result.items;
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.hideLoadingIndicator();
                this.cd.detectChanges();
            });
    }

    delete() { }

    create() {
        this._router.navigateByUrl("app/salaries/salary-entry");
    }
}