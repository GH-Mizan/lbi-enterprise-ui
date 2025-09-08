import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { SalesCollectionDueReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

@Component({
  selector: 'app-sales-collection-due-report',
  standalone: false,
  templateUrl: './sales-collection-due.component.html',
  animations: [appModuleAnimation()],
  styles: [
    `
     :host ::ng-deep .p-inputtext {
          min-width: 185px !important;
        }
    `
  ]
})
export class SalesColllectionDueReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  endDate = new Date();
  startDate = (moment().subtract(30, 'days')).toDate();
  rangeDates = [this.startDate, this.endDate];


  constructor(
    injector: Injector,
    cd: ChangeDetectorRef,
    private _salesService: SalesServiceProxy
  ) {
    super(injector, cd);

  }

  list(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();
    this._salesService.getSalesCollectionDueReport(
      moment(this.rangeDates[0]), moment(this.rangeDates[1])
    ).pipe(
      finalize(() => {
        this.primengTableHelper.hideLoadingIndicator();
      })
    )
      .subscribe((result) => {
        this.primengTableHelper.records = result;
        this.primengTableHelper.totalRecordsCount = result.length;
        this.primengTableHelper.hideLoadingIndicator();
        this.cd.detectChanges();
      });
  }

  delete() {

  }

  print() {
    alert('Under Construction')
  }
}
