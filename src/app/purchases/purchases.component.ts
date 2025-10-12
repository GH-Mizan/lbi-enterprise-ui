import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { DuePaymentEntryDto, PurchaseOutputDto, PurchaseServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { Router } from '@angular/router';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { DuePaymentEntryComponent } from './due-payment-entry/due-payment-entry.component';
import { DuePaymentHistoryComponent } from './due-payment-histories/due-payment-histories.component';

@Component({
  selector: 'app-purchases',
  standalone: false,
  templateUrl: './purchases.component.html',
  animations: [appModuleAnimation()],
})
export class PurchasesComponent extends PagedListingComponentBase<PurchaseOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _purchaseService: PurchaseServiceProxy,
    private readonly _router: Router,
    private readonly _modalService: BsModalService,
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

    this.showLoading();
    this._purchaseService.getPaginatedPurchases(
      moment(new Date()), moment(new Date()),
      this.searchText,
      this.primengTableHelper.getSkipCount(this.paginator, event),
      this.primengTableHelper.getMaxResultCount(this.paginator, event)
    ).pipe(
      finalize(() => {
        this.hideLoading();
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
    this._router.navigateByUrl("app/purchases/create");
  }

  edit(id: number) {
    this._router.navigateByUrl(`app/purchases/edit/${id}`);
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

  makePayment(purchase: PurchaseOutputDto) {
    const duePaymentDto = {
      purchaseId: purchase.id,
      invoiceDate: purchase.date,
      paymentDate: moment(new Date()),
      invoiceNumber: purchase.invoiceNumber,
      paymentStatus: purchase.paymentStatus,
      paymentStatusText: purchase.paymentStatusText,
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      purchasedBy: purchase.purchaseBy,
      grandTotal: purchase.totalAmount,
      prevDiscount: purchase.discount,
      discount: 0,
      netTotal: purchase.netAmount,
      prevTotalPaid: purchase.paidAmount,
      totalPaid: 0,
      due: purchase.dueAmount,
      remarks: purchase.remarks
    } as DuePaymentEntryDto;

    let duePaymentEntryDialog: BsModalRef;
    duePaymentEntryDialog = this._modalService.show(
      DuePaymentEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          duePayment: duePaymentDto,
        },
      }
    );
    duePaymentEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  showDuePaymentHistory(id: number) {
    let duePaymentHistoryDialog: BsModalRef;
    duePaymentHistoryDialog = this._modalService.show(
      DuePaymentHistoryComponent,
      {
        class: "modal-lg",
        initialState: {
          purchaseId: id,
        },
      }
    );
    duePaymentHistoryDialog.content.onDelete.subscribe(() => {
      this.refresh();
    });
  }


}
