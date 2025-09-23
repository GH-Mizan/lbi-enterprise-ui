import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { DueReceivedEntryDto, SalesOutputDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { DueReceivedHistoryComponent } from './due-received-histories/due-received-histories.component';
import { DueReceivedEntryComponent } from './due-received-entry/due-received-entry.component';
import { SalesReceiptReport } from '@shared/reports/sales-receipt-report';

@Component({
  selector: 'app-sales',
  standalone: false,
  templateUrl: './sales.component.html',
  animations: [appModuleAnimation()],
})
export class SalesComponent extends PagedListingComponentBase<SalesOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _salesService: SalesServiceProxy,
    private readonly _router: Router,
    private readonly _modalService: BsModalService,
    private readonly salesReceiptReport: SalesReceiptReport,
    
    cd: ChangeDetectorRef
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

    //this.primengTableHelper.showLoadingIndicator();
    this.primengTableHelper.isLoading = true;
    this._salesService.getPaginatedSales(
      moment(new Date()), moment(new Date()),
      this.searchText,
      this.primengTableHelper.getSkipCount(this.paginator, event),
      this.primengTableHelper.getMaxResultCount(this.paginator, event)
    ).pipe(
      finalize(() => {
        //this.primengTableHelper.hideLoadingIndicator();
        this.primengTableHelper.isLoading = false;
        this.cd.detectChanges();
      })
    )
      .subscribe((result) => {
        this.primengTableHelper.records = result.items;
        this.primengTableHelper.totalRecordsCount = result.totalCount;
        this.primengTableHelper.hideLoadingIndicator();
        this.cd.detectChanges();
      });
  }

  create() {
    this._router.navigateByUrl("app/sales/create");
  }

  edit(id: number) {
    this._router.navigateByUrl(`app/sales/edit/${id}`);
  }

  view(id: number) {
    this._router.navigateByUrl(`app/sales/view/${id}`);
  }

  delete(): void {
    // abp.message.confirm(`${customer.name} will be deleted`,
    //   undefined,
    //   (result: boolean) => {
    //     if (result) {
    //       this._customerService.delete(customer.id).subscribe(() => {
    //         abp.notify.success(this.l("SuccessfullyDeleted"));
    //         this.refresh();
    //       });
    //     }
    //   }
    // );
  }

  makePaymentReceive(sales: SalesOutputDto) {
    const dueReceived = {
      salesId: sales.id,
      invoiceDate: sales.date,
      receiveDate: moment(new Date()),
      invoiceNumber: sales.invoiceNumber,
      paymentStatus: sales.paymentStatus,
      paymentStatusText: sales.paymentStatusText,
      customerId: sales.customerId,
      customerName: sales.customerName,
      salesBy: sales.salesBy,
      grandTotal: sales.totalAmount,
      prevDiscount: sales.discount,
      discount: 0,
      netTotal: sales.netAmount,
      prevTotalPaid: sales.paidAmount,
      totalPaid: 0,
      due: sales.dueAmount,
      remarks: sales.remarks,
      //paymentReceiveHistory: sales.paymentReceiveHistory
    } as DueReceivedEntryDto;

    let paymentReceiveEntryDialog: BsModalRef;
    paymentReceiveEntryDialog = this._modalService.show(
      DueReceivedEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          dueReceived: dueReceived,
        },
      }
    );
    paymentReceiveEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  showPaymentHistory(id: number) {
    this._modalService.show(
      DueReceivedHistoryComponent,
      {
        class: "modal-lg",
        initialState: {
          salesId: id,
        },
      }
    );
  }

  async generateReceipt(id: number) {
     await this.salesReceiptReport.generateSalesReceipt(id);
  }


}
