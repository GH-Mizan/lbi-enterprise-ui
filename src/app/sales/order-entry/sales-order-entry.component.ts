import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, CustomerServiceProxy, SalesOrderCreateUpdateDto, SalesOrderServiceProxy } from "@shared/service-proxies/service-proxies";
import moment from "moment";
import { debounceTime, distinctUntilChanged, firstValueFrom, map, Observable } from "rxjs";

@Component({
    selector: 'app-sales-order-entry',
    standalone: false,
    templateUrl: './sales-order-entry.component.html'
})

export class SalesOrderEntryComponent extends AppComponentBase implements OnInit {

    @Output() onSave = new EventEmitter<any>();
    model: SalesOrderCreateUpdateDto;
    customers: ComboboxItemDto[] = [];
    date = new Date();
    clientObj: any;
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _customerService: CustomerServiceProxy,
        private readonly _salesOrderService: SalesOrderServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit() {
        this._customerService.getCustomersSelectList().subscribe(res => {
            this.customers = res;
            this.cd.detectChanges();
        })
    }

    search = (text$: Observable<string>) =>
        text$.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            map(term => term === '' ? [] : this.customers.filter(v => v.displayText.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
        );

    onClientChanged() {
        this.model.customerId = this.clientObj.value;
    }

    save() {
        this.saving = true;
        this.model.date = moment(this.date);
        this._salesOrderService.createOrUpdate(this.model).subscribe(() => {
            this.notify.info(this.model.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}