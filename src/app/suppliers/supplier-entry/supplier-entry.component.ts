import { ChangeDetectorRef, Component, EventEmitter, Injector, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { SupplierCreateOrUpdateDto, SupplierServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-supplier-entry',
    standalone: false,
    templateUrl: './supplier-entry.component.html'
})

export class SupplierEntryComponent extends AppComponentBase {

    @Output() onSave = new EventEmitter<any>();

    supplier: SupplierCreateOrUpdateDto;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _supplierrService: SupplierServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }
   
    save() {
        this.saving = true;
        this._supplierrService.createOrUpdate(this.supplier).subscribe(() => {
            this.notify.info(this.supplier.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}