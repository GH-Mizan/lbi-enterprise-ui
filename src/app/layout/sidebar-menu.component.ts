import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/app-component-base';
import { Router, RouterEvent, NavigationEnd, PRIMARY_OUTLET, RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuItem } from '@shared/layout/menu-item';
import { NgTemplateOutlet } from '@angular/common';
import { CollapseDirective } from 'ngx-bootstrap/collapse';
import { LayoutStoreService } from '@shared/layout/layout-store.service';

@Component({
    selector: 'sidebar-menu',
    templateUrl: './sidebar-menu.component.html',
    standalone: true,
    imports: [NgTemplateOutlet, RouterLink, CollapseDirective],
})
export class SidebarMenuComponent extends AppComponentBase implements OnInit {
    menuItems: MenuItem[];
    menuItemsMap: { [key: number]: MenuItem } = {};
    activatedMenuItems: MenuItem[] = [];
    routerEvents: BehaviorSubject<RouterEvent> = new BehaviorSubject(undefined);
    homeRoute = '/app/home';

    constructor(
        injector: Injector,
        private router: Router,
        private _layoutStore: LayoutStoreService,
    ) {
        super(injector);
    }

    ngOnInit(): void {
        this.menuItems = this.getMenuItems();
        this.patchMenuItems(this.menuItems);

        this.router.events.subscribe((event: NavigationEnd) => {
            const currentUrl = event.url !== '/' ? event.url : this.homeRoute;
            const primaryUrlSegmentGroup = this.router.parseUrl(currentUrl).root.children[PRIMARY_OUTLET];
            if (primaryUrlSegmentGroup) {
                this.activateMenuItems('/' + primaryUrlSegmentGroup.toString());
            }
        });
    }

    getMenuItems(): MenuItem[] {
        return [
            new MenuItem(this.l('HomePage'), '/app/home', 'fas fa-home', '', false),
            new MenuItem('Purchases', '/app/purchases', 'fa-solid fa-cart-shopping', '', false),
            new MenuItem('Sales', '/app/sales', 'fab fa-sellcast', '', false),
            new MenuItem('Inventories', '/app/inventories', 'fas fa-store', '', false),

            new MenuItem('Daily Cash', '/app/daily-cash', 'fas fa-dollar-sign', 'Pages.DailyCash', false),
            new MenuItem('Organization', '', 'fas fa-building', '', true, [
                new MenuItem('Items', '/app/items', 'fa-brands fa-product-hunt', '', false),
                new MenuItem('Clients', '/app/clients', 'fa-solid fa-user', '', false),
                new MenuItem('Suppliers', '/app/suppliers', 'fa-solid fa-shop', '', false),
                new MenuItem('Employees', '/app/employees', 'fas fa-users', '', false),
                new MenuItem('Departments', '/app/departments', 'fas fa-house-user', '', false),
                new MenuItem('Designations', '/app/designations', 'fas fa-id-badge', '', false),
                new MenuItem('Stock Points', '/app/stock-points', 'fas fa-warehouse', '', false),
                new MenuItem('Settings', '/app/lbi-settings', 'fas fa-wrench', '', false),
            ]),
            new MenuItem('Virtual Stocks', '', 'fas fa-store-alt', '', true, [
                new MenuItem('Items', '/app/virtual-stocks/items', 'fa-brands fa-product-hunt', '', false),
                new MenuItem('Inventories', '/app/virtual-stocks/', 'fas fa-home', '', false),
                new MenuItem('Client Inventories', '/app/virtual-stocks/client', 'fas fa-store', '', false),
                new MenuItem('Plant Inventories', '/app/virtual-stocks/plant', 'fas fa-store-slash', '', false),
                new MenuItem('General Stoccks', '/app/virtual-stocks/general', 'fas fa-warehouse', '', false),
                new MenuItem('Inventory Cross Check', '/app/virtual-stocks/differences', 'fas fa-check-double', '', false),
            ]),
            new MenuItem('Reports', '', 'far fa-file-alt', '', true, [
                new MenuItem('Daily Purchase', '/app/reports/daily-purchase', 'fas fa-toilet-paper', 'Reports.DailyPurchase', false),
                new MenuItem('Daily Sales', '/app/reports/daily-sales', 'fas fa-toilet-paper', 'Reports.DailySales', false),
                new MenuItem('Monthly Purchase', '/app/reports/monthly-purchase', 'fas fa-toilet-paper', '', false),
                new MenuItem('Monthly Sales', '/app/reports/monthly-sales-ranking', 'fas fa-toilet-paper', 'Reports.MonthlySalesRanking', false),
                new MenuItem('Sale, Collection & Due', '/app/reports/sales-collection-due', 'fas fa-toilet-paper', 'Reports.SaleCollectionDue', false),
                new MenuItem("Client's Ledger", '/app/reports/customer-ledger', 'fas fa-toilet-paper', 'Reports.ClientsLedger', false),
                new MenuItem("Client's Dues", '/app/reports/customer-dues', 'fas fa-toilet-paper', 'Reports.ClientsDue', false),
                new MenuItem("Clients' Balance", '/app/reports/customer-overall-dues', 'fas fa-toilet-paper', 'Reports.ClientsBalance', false),
                new MenuItem('Sales Invoice (Monthly)', '/app/reports/monthly-sales-invoices', 'fas fa-toilet-paper', 'Reports.SalesInvoice', false),
            ]),
            new MenuItem('Administrations', '', 'fas fa-user-shield', '', true, [
                new MenuItem(this.l('Roles'), '/app/roles', 'fas fa-theater-masks', 'Pages.Roles', false),
                new MenuItem(this.l('Users'), '/app/users', 'fas fa-users', 'Pages.Users', false)
            ]),


        ];
    }

    patchMenuItems(items: MenuItem[], parentId?: number): void {
        items.forEach((item: MenuItem, index: number) => {
            item.id = parentId ? Number(parentId + '' + (index + 1)) : index + 1;
            if (parentId) {
                item.parentId = parentId;
            }
            if (parentId || item.children) {
                this.menuItemsMap[item.id] = item;
            }
            if (item.children) {
                this.patchMenuItems(item.children, item.id);
            }
        });
    }

    activateMenuItems(url: string): void {
        this.deactivateMenuItems(this.menuItems);
        this.activatedMenuItems = [];
        const foundedItems = this.findMenuItemsByUrl(url, this.menuItems);
        foundedItems.forEach((item) => {
            this.activateMenuItem(item);
        });
    }

    deactivateMenuItems(items: MenuItem[]): void {
        items.forEach((item: MenuItem) => {
            item.isActive = false;
            item.isCollapsed = true;
            if (item.children) {
                this.deactivateMenuItems(item.children);
            }
        });
    }

    findMenuItemsByUrl(url: string, items: MenuItem[], foundedItems: MenuItem[] = []): MenuItem[] {
        items.forEach((item: MenuItem) => {
            if (item.route === url) {
                foundedItems.push(item);
            } else if (item.children) {
                this.findMenuItemsByUrl(url, item.children, foundedItems);
            }
        });
        return foundedItems;
    }

    activateMenuItem(item: MenuItem): void {
        item.isActive = true;
        if (item.children) {
            item.isCollapsed = false;
        }
        this.activatedMenuItems.push(item);
        if (item.parentId) {
            this.activateMenuItem(this.menuItemsMap[item.parentId]);
        }
    }

    isMenuItemVisible(item: MenuItem): boolean {
        if (!item.permissionName) {
            return true;
        }
        return this.permission.isGranted(item.permissionName);
    }

    onMenuItemClicked() {
        this._layoutStore.mobileView$.subscribe((value) => {
            if(value) this._layoutStore.setSidebarExpanded(true);
        });
    }
}
