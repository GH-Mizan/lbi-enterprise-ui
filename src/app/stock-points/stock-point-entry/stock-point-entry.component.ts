import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, StockPointCreateOrUpdateDto, StockPointServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-stock-point-entry',
    standalone: false,
    templateUrl: './stock-point-entry.component.html'
})

export class StockPointEntryComponent extends AppComponentBase implements OnInit {

    @Output() onSave = new EventEmitter<any>();

    stockPoint: StockPointCreateOrUpdateDto;
    types: ComboboxItemDto[] = [];
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _stockPointrService: StockPointServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._stockPointrService.getStockPointTypes().subscribe(res=> {
            this.types = res;
            this.cd.detectChanges();
        })
    }
   
    save() {
        this.saving = true;
        this._stockPointrService.createOrUpdate(this.stockPoint).subscribe(() => {
            this.notify.info(this.stockPoint.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}