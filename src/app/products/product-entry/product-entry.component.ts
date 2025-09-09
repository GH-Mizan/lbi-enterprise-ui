import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, ProductCreateOrUpdateDto, ProductServiceProxy } from "@shared/service-proxies/service-proxies";

@Component({
    selector: 'app-product-entry',
    standalone: false,
    templateUrl: './product-entry.component.html'
})

export class ProductEntryComponent extends AppComponentBase implements OnInit{

    @Output() onSave = new EventEmitter<any>();

    product: ProductCreateOrUpdateDto;
    types: ComboboxItemDto[] = [];
    sizes: ComboboxItemDto[] = [];
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _productrService: ProductServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this._productrService.getProductTypeSelectList().subscribe(res=> {
            this.types = res;
            this.cd.detectChanges();
        });

        this._productrService.getProductSizeSelectList().subscribe(res=> {
            this.sizes = res;
            this.cd.detectChanges();
        });
    }
   
    save() {
        this.saving = true;
        this._productrService.createOrUpdate(this.product).subscribe(() => {
            this.notify.info(this.product.id ? "Successfully Updated" : "Successfully Saved");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}