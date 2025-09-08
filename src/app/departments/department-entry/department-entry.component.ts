import { ChangeDetectorRef, Component, EventEmitter, Injector, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpClient } from "@angular/common/http";
import { AppComponentBase } from "@shared/app-component-base";
import { DepartmentCreateOrUpdateDto, DepartmentServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-department-entry',
    standalone: false,
    templateUrl: './department-entry.component.html'
})

export class DepartmentEntryComponent extends AppComponentBase {

    @Output() onSave = new EventEmitter<any>();

    department: DepartmentCreateOrUpdateDto;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _departmentrService: DepartmentServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }
   
    save() {
        this.saving = true;
        this._departmentrService.createOrUpdate(this.department).subscribe(() => {
            this.notify.info(this.department.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}