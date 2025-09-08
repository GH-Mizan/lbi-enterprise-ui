import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { CustomerCreateOrUpdateDto, CustomerOutputDto, CustomerPriceDto, CustomerServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { CustomerEntryComponent } from './customer-entry/customer-entry.component';
import { CustomerPricesComponent } from './customer-prices/customer-prices.component';

@Component({
  selector: 'app-customers',
  standalone: false,
  templateUrl: './customers.component.html',
  animations: [appModuleAnimation()],
})
export class CustomersComponent extends PagedListingComponentBase<CustomerOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _customerService: CustomerServiceProxy,
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

    this.primengTableHelper.showLoadingIndicator();
    this._customerService.getPaginatedCustomers(
      this.searchText,
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

  create() {
    const customer = new CustomerCreateOrUpdateDto();
    customer.activeStatus = true;
    this.showCustomerEntryDialog(customer);
  }

  edit(id: number) {
    this._customerService.get(id).subscribe(res => {
      this.showCustomerEntryDialog(res);
    });
  }

  openCustomerPriceModal(customer: CustomerOutputDto) {
    this._customerService.getCustomerPrices(customer.id).subscribe(res => {
      this.showCustomerPriceDialog(customer.name, res);
    });
  }

  delete(customer: CustomerOutputDto): void {
    abp.message.confirm(`${customer.name} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._customerService.delete(customer.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showCustomerEntryDialog(customer: CustomerOutputDto): void {
    let customerEntryDialog: BsModalRef;
    customerEntryDialog = this._modalService.show(
      CustomerEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          customer: customer,
        },
      }
    );
    customerEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  private showCustomerPriceDialog(customerName: string, customerPrices: CustomerPriceDto[]): void {
    this._modalService.show(
      CustomerPricesComponent,
      {
        class: "modal-md",
        initialState: {
          customerName: customerName,
          customerPrices: customerPrices,
        },
      }
    );
  }

}
