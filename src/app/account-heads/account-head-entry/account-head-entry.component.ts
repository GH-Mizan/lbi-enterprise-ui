import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { AccountHeadEntryDto, AccountHeadServiceProxy, ComboboxItemDto } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-account-head-entry',
    standalone: false,
    templateUrl: './account-head-entry.component.html'
})

export class AccountHeadEntryComponent extends AppComponentBase implements OnInit {

    @Output() onSave = new EventEmitter<any>();

    model: AccountHeadEntryDto;
    types: ComboboxItemDto[] = [];
    parentHeads: ComboboxItemDto[] = [];
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _accountHeadService: AccountHeadServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._accountHeadService.getAccountHeadTypeSelectList().subscribe(res=> {
            this.types = res;
            this.cd.detectChanges();
        });

        this._accountHeadService.getParentAccountHeadsSelectList().subscribe(res=> {
            this.parentHeads = res;
            this.cd.detectChanges();
        });
    }
   
    save() {
        this.saving = true;
        this._accountHeadService.createOrUpdate(this.model).subscribe(() => {
            this.notify.info(this.model.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}