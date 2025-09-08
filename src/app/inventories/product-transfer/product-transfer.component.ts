import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, InventoryServiceProxy, ProductTransferDto, StockPointServiceProxy } from "@shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-product-transfer',
    templateUrl: './product-transfer.component.html',
    standalone: false
})

export class ProductTransferComponent extends AppComponentBase implements OnInit {
    @Output() onSave = new EventEmitter<any>();

    model = new ProductTransferDto();
    products: ComboboxItemDto[] = [];
    fromStockPoints: ComboboxItemDto[] = [];
    toStockPoints: ComboboxItemDto[] = [];
    saving = false;

    constructor(
        injector: Injector,
        public bsModalRef: BsModalRef,
        private readonly _inventoryService: InventoryServiceProxy,
        private readonly _stockPointService: StockPointServiceProxy,
        private cd: ChangeDetectorRef
    ) {
        super(injector);
    }

    async ngOnInit() {
        Promise.all([
            this.loadProducts(),
            this.loadStockPoints()
        ]).then(() => {
            this.cd.detectChanges();
        });
    }

    private async loadProducts() {
        this.products = await firstValueFrom(this._inventoryService.getInventoryProducts());
    }

    private async loadStockPoints() {
        this.fromStockPoints = this.toStockPoints = await firstValueFrom(this._stockPointService.getStockPoints(undefined));
    }

    transfer() {
        this.model.productName = this.products.find(f=> f.value == this.model.productId.toString()).displayText;
        this._inventoryService.transferProducts(this.model).subscribe(res => {
            this.notify.info("Successfully Transfered");
            this.bsModalRef.hide();
            this.onSave.emit();
            this.saving = false;
            this.cd.detectChanges();
        });
    }
}