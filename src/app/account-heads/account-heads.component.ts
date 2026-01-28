import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { AccountHeadEntryDto, AccountHeadOutputDto, AccountHeadServiceProxy, AccountHeadType, ComboboxItemDto } from '@shared/service-proxies/service-proxies';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { LazyLoadEvent } from 'primeng/api';
import { finalize } from "rxjs/operators";
import { AccountHeadEntryComponent } from './account-head-entry/account-head-entry.component';

@Component({
  selector: 'app-account-heads',
  standalone: false,
  templateUrl: './account-heads.component.html',
  animations: [appModuleAnimation()],
})
export class AccountHeadsComponent extends PagedListingComponentBase<AccountHeadOutputDto> implements OnInit {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  type: number;
  types: ComboboxItemDto[] = [];

  constructor(
    injector: Injector,
    private readonly _accountHeadService: AccountHeadServiceProxy,
    private readonly _modalService: BsModalService,
    cd: ChangeDetectorRef
  ) {
    super(injector, cd);
  }

  ngOnInit(): void {
        this._accountHeadService.getAccountHeadTypeSelectList().subscribe(res=> {
            this.types = res;
            this.cd.detectChanges();
        })
    }

  list(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();
    this._accountHeadService.getAccountHeads(this.type).pipe(
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

  create() {
      const ah = new AccountHeadEntryDto();
      ah.type = AccountHeadType._2;
      this.showHeadEntryDialog(ah);
    }
  
    edit(id: number) {
      this._accountHeadService.get(id).subscribe(res => {
        this.showHeadEntryDialog(res);
      });
    }
  
    delete(ah: AccountHeadOutputDto): void {
      abp.message.confirm(`${ah.name} will be deleted`,
        undefined,
        (result: boolean) => {
          if (result) {
            this._accountHeadService.accountHeadRemove(ah.id).subscribe(() => {
              abp.notify.success(this.l("SuccessfullyDeleted"));
              this.refresh();
            });
          }
        }
      );
    }

    private showHeadEntryDialog(ah: AccountHeadEntryDto): void {
        let entryDialog: BsModalRef;
        entryDialog = this._modalService.show(
          AccountHeadEntryComponent,
          {
            class: "modal-lg",
            initialState: {
              model: ah,
            },
          }
        );
        entryDialog.content.onSave.subscribe(() => {
          this.refresh();
        });
      }
}
