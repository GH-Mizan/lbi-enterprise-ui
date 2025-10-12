import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { Table } from 'primeng/table';
import { Paginator } from "primeng/paginator";
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { SupplierCreateOrUpdateDto, SupplierOutputDto, SupplierServiceProxy } from '@shared/service-proxies/service-proxies';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import { SupplierEntryComponent } from './supplier-entry/supplier-entry.component';

@Component({
  selector: 'app-suppliers',
  standalone: false,
  templateUrl: './suppliers.component.html',
  animations: [appModuleAnimation()],
})
export class SuppliersComponent extends PagedListingComponentBase<SupplierOutputDto> {
  @ViewChild('dataTable', { static: true }) dataTable: Table;
  @ViewChild('paginator', { static: true }) paginator: Paginator;

  searchText: string = "";

  constructor(
    injector: Injector,
    private readonly _supplierService: SupplierServiceProxy,
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
    this._supplierService.getPaginatedSupplierss(
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
    const supplier = new SupplierCreateOrUpdateDto();
    supplier.activeStatus = true;
    this.showSupplierEntryDialog(supplier);
  }

  edit(id: number) {
    this._supplierService.get(id).subscribe(res => {
      this.showSupplierEntryDialog(res);
    });
  }

  delete(supplier: SupplierOutputDto): void {
    abp.message.confirm(`${supplier.name} will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this._supplierService.supplierRemove(supplier.id).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  private showSupplierEntryDialog(supplier: SupplierOutputDto): void {
    let supplierEntryDialog: BsModalRef;
    supplierEntryDialog = this._modalService.show(
      SupplierEntryComponent,
      {
        class: "modal-lg",
        initialState: {
          supplier: supplier,
        },
      }
    );
    supplierEntryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

}
