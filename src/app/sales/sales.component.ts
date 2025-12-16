import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ComboboxItemDto, DueReceivedEntryDto, SalesOutputDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { DueReceivedHistoryComponent } from './due-received-histories/due-received-histories.component';
import { DueReceivedEntryComponent } from './due-received-entry/due-received-entry.component';
import { SalesReceiptReport } from '@shared/reports/sales-receipt-report';
import { SaleDetailsComponent } from './details/sale-details.component';
import { Utils } from '@shared/helpers/Utils';

@Component({
  selector: 'app-sales',
  standalone: false,
  templateUrl: './sales.component.html',
  animations: [appModuleAnimation()],
  styles: [
    `
      .mobile-view > td:not(:first-child) {
          padding-left: 0px !important;
          padding-right: 0px !important;
      }

      .mobile-view > th:not(:first-child) {
          padding-left: 0px !important;
          padding-right: 0px !important;
      }

      .mobile-view > td:first-child {
          padding-left: 5px !important;
      }

      .mobile-view > th:first-child {
          padding-left: 5px !important;
      }

      .fs {
          font-size: smaller !important;
      }

      
    `
  ]
})

export class SalesComponent extends PagedListingComponentBase<SalesOutputDto> implements OnInit {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";
  date = undefined;
  monthId: number;
  yearId: number;
  months: ComboboxItemDto[] = [];
  years: ComboboxItemDto[] = [];

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

  ngOnInit(): void {
    this.months = Utils.getMonths();
    this.months.push({ value: "-1", displayText: "All" } as ComboboxItemDto);
    const currentYear: number = new Date().getFullYear();
    this.years = Utils.getYears(currentYear);
    this.years.push({ value: "-1", displayText: "All" } as ComboboxItemDto)
    this.monthId = new Date().getMonth() + 1;
    this.yearId = currentYear;
    this.cd.detectChanges();
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
    this.showLoading();
    this._salesService.getPaginatedSales(
      this.date ? moment(this.date) : undefined,
      this.monthId,
      this.yearId,
      this.searchText,
      this.primengTableHelper.getSkipCount(this.paginator, event),
      this.primengTableHelper.getMaxResultCount(this.paginator, event))
      .pipe(finalize(() => {
        this.hideLoading();
      }))
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

  delete(item: SalesOutputDto): void {
    abp.message.confirm(`${item.invoiceNumber} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this.showLoading();
          this._salesService.saleRemove(item.id, item.stockPointId).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
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
    let dueReceivedHistoryDialog: BsModalRef;
    dueReceivedHistoryDialog = this._modalService.show(
      DueReceivedHistoryComponent,
      {
        class: "modal-lg",
        initialState: {
          salesId: id,
        },
      }
    );
    dueReceivedHistoryDialog.content.onDelete.subscribe(() => {
      this.refresh();
    });
  }

  showSaleDetails(sale: SalesOutputDto) {
    this._modalService.show(
      SaleDetailsComponent,
      {
        class: "modal-md",
        initialState: {
          sale: sale,
        },
      }
    );
  }

  async generateReceipt(id: number) {
    this.showLoading();
    await this.salesReceiptReport.generateSalesReceipt(id);
    this.hideLoading();
  }


}
