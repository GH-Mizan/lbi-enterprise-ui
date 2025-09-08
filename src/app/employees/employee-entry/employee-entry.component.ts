import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, EmployeeCreateOrUpdateDto, EmployeeServiceProxy } from "@shared/service-proxies/service-proxies";
import { firstValueFrom } from "rxjs";
import moment from "moment";

@Component({
    selector: 'app-employee-entry',
    standalone: false,
    templateUrl: './employee-entry.component.html'
})

export class EmployeeEntryComponent extends AppComponentBase implements OnInit {

    @Output() onSave = new EventEmitter<any>();

    employee: EmployeeCreateOrUpdateDto;
    departments: ComboboxItemDto[] = [];
    designations: ComboboxItemDto[] = [];
    joiningDate: Date = null;
    birthDate: Date = null;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _employeeService: EmployeeServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    async ngOnInit() {
        if(this.employee.id) {
            this.joiningDate = this.employee.joiningDate.toDate();
            this.birthDate = this.employee.birthDate.toDate();
        }
        Promise.all(
            [
                this.loadDepartments(),
                this.loadDesignations()
            ]
        ).then(()=> {
            this.cd.detectChanges();
        });
    }

    private async loadDepartments() {
        this.departments = await firstValueFrom(this._employeeService.getDepartments()); 
    }

    private async loadDesignations() {
        this.designations = await firstValueFrom(this._employeeService.getDesignations()); 
    }
   
    save() {
        this.saving = true;
        this.employee.birthDate = moment(this.birthDate);
        this.employee.joiningDate = moment(this.joiningDate);
        this._employeeService.createOrUpdate(this.employee).subscribe(() => {
            this.notify.info(this.employee.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}