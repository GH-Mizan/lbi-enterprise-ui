import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { LayoutStoreService } from '@shared/layout/layout-store.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
    selector: 'header-left-navbar',
    templateUrl: './header-left-navbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [],
})
export class HeaderLeftNavbarComponent implements OnInit {
    sidebarExpanded: boolean;

    constructor(
        private _layoutStore: LayoutStoreService,
        private breakpointObserver: BreakpointObserver
    ) { }

    ngOnInit(): void {
        this.sidebarExpanded = true;
        this._layoutStore.setSidebarExpanded(this.sidebarExpanded);
        
        this._layoutStore.sidebarExpanded.subscribe((value) => {
            this.sidebarExpanded = value;
        });
    }

    toggleSidebar(): void {
        this._layoutStore.setSidebarExpanded(!this.sidebarExpanded);
    }
}
