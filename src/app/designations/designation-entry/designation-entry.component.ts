import { ChangeDetectorRef, Component, EventEmitter, Injector, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { DesignationCreateOrUpdateDto, DesignationServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-designation-entry',
    standalone: false,
    templateUrl: './designation-entry.component.html'
})

export class DesignationEntryComponent extends AppComponentBase {

    @Output() onSave = new EventEmitter<any>();

    designation: DesignationCreateOrUpdateDto;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _designationrService: DesignationServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }
   
    save() {
        this.saving = true;
        this._designationrService.createOrUpdate(this.designation).subscribe(() => {
            this.notify.info(this.designation.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}