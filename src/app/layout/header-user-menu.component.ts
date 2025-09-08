import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AppAuthService } from '@shared/auth/app-auth.service';
import { BsDropdownDirective, BsDropdownToggleDirective, BsDropdownMenuDirective } from 'ngx-bootstrap/dropdown';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '@shared/pipes/localize.pipe';
import { AppSessionService } from '@shared/session/app-session.service';

@Component({
    selector: 'header-user-menu',
    templateUrl: './header-user-menu.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BsDropdownDirective, BsDropdownToggleDirective, BsDropdownMenuDirective, RouterLink, LocalizePipe],
})
export class HeaderUserMenuComponent {
    userName: string;
    constructor(private _authService: AppAuthService, private _abpSession: AppSessionService) {
        this.userName = this._abpSession.getShownLoginName();
    }

    logout(): void {
        this._authService.logout();
    }
}
