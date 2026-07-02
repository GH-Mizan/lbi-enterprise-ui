import { ChangeDetectorRef, Component, EventEmitter, Injector, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { AdditionalPartiesServiceProxy, AdditionalPartyEntryDto } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-additional-party-entry',
    standalone: false,
    templateUrl: './additional-party-entry.component.html'
})

export class AdditionalPartyEntryComponent extends AppComponentBase {

    @Output() onSave = new EventEmitter<any>();

    model: AdditionalPartyEntryDto;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _additionalPartiesService: AdditionalPartiesServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }
   
    save() {
        this.saving = true;
        this._additionalPartiesService.createOrUpdate(this.model).subscribe(() => {
            this.notify.info(this.model.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}