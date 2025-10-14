import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, pluck } from 'rxjs/operators';
import { LayoutConfig } from './layout-config';

@Injectable()
export class LayoutStoreService {
    public readonly config$: Observable<LayoutConfig>;
    public readonly mobileView$: Observable<boolean>;
    private readonly initialLayoutConfig: LayoutConfig = {
        sidebarExpanded: true,
    };
    private configSource: BehaviorSubject<LayoutConfig>;
    private mobileViewSource: BehaviorSubject<boolean>;

    constructor() {
        this.configSource = new BehaviorSubject(this.initialLayoutConfig);
        this.config$ = this.configSource.asObservable();

        this.mobileViewSource = new BehaviorSubject(false);
        this.mobileView$ = this.mobileViewSource.asObservable();
    }

    get sidebarExpanded(): Observable<boolean> {
        return this.config$.pipe(pluck('sidebarExpanded'), distinctUntilChanged()) as Observable<boolean>;
    }

    get isMobileView(): Observable<boolean> {
        return this.mobileView$ as Observable<boolean>;
    }

    public setSidebarExpanded(value: boolean): void {
        this.configSource.next(Object.assign(this.configSource.value, { sidebarExpanded: value }));
    }

    public setIsMobileView(value: boolean): void {
        this.mobileViewSource.next(value);
    }
}
