import { ChangeDetectorRef, Component, EventEmitter, Injector, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { CustomerCreateOrUpdateDto, CustomerServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-customer-entry',
    standalone: false,
    templateUrl: './customer-entry.component.html'
})

export class CustomerEntryComponent extends AppComponentBase {

    @Output() onSave = new EventEmitter<any>();

    customer: CustomerCreateOrUpdateDto;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _customerrService: CustomerServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }
   
    save() {
        this.saving = true;
        this._customerrService.createOrUpdate(this.customer).subscribe(() => {
            this.notify.info(this.customer.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}