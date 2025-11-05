import { ChangeDetectorRef, Component, EventEmitter, Injector, OnInit, Output } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AppComponentBase } from "@shared/app-component-base";
import { ComboboxItemDto, InventoryServiceProxy, MarkAsDamadgedInput, StockPointServiceProxy } from "@shared/service-proxies/service-proxies";
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-make-inventory-damadge',
    templateUrl: './damadge-inventory.component.html',
    standalone: false
})

export class MakeInventoryDamadgeComponent extends AppComponentBase implements OnInit {
    @Output() onSave = new EventEmitter<any>();

    edit: boolean = false;
    model = new MarkAsDamadgedInput();
    products: ComboboxItemDto[];
    stockPoints: ComboboxItemDto[];
    saving = false;
    currentStock: number = 0;

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
        await Promise.all([
            this.loadProducts(),
            this.loadStockPoints()
        ]);
    }

    private async loadProducts() {
        this.products = await firstValueFrom(this._inventoryService.getInventoryProducts());
        this.cd.detectChanges();
    }

    private async loadStockPoints() {
        this.stockPoints = await firstValueFrom(this._stockPointService.getStockPoints(undefined));
        this.cd.detectChanges();
    }

    async save() {
        if (this.edit) {
            await firstValueFrom(this._inventoryService.editDamadge(this.model));
            this.notify.info("Successfully Updated");
        } else {
            await firstValueFrom(this._inventoryService.markAsDamadged(this.model));
            this.notify.info("Successfully Saved");
        }
        this.bsModalRef.hide();
        this.onSave.emit();
        this.saving = false;
        this.cd.detectChanges();
    }

    getCurrentStcok() {
        this.saving = true;
        if (this.model.stockPointId && this.model.productId) {
            this._inventoryService.getProductStockQty(this.model.stockPointId, this.model.productId, this.edit).subscribe(res => {
                this.currentStock = res;
                this.saving = false;
                this.cd.detectChanges();
            })
        } else {
            this.currentStock = 0;
            this.saving = false;
            this.cd.detectChanges();
        }
    }
}