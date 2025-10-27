import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, ProductServiceProxy, VirtualItemEntryInput, VirtualItemServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-virtual-item-entry',
    standalone: false,
    templateUrl: './virtual-item-entry.component.html'
})

export class VirtualItemEntryComponent extends AppComponentBase implements OnInit{

    @Output() onSave = new EventEmitter<any>();

    virtualItem: VirtualItemEntryInput;
    types: ComboboxItemDto[] = [];
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _productrService: ProductServiceProxy,
        private readonly _virtualItemService: VirtualItemServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._productrService.getProductTypeSelectList().subscribe(res=> {
            this.types = res;
            this.cd.detectChanges();
        });
    }
   
    save() {
        this.saving = true;
        this._virtualItemService.createOrUpdate(this.virtualItem).subscribe(() => {
            this.notify.info(this.virtualItem.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}