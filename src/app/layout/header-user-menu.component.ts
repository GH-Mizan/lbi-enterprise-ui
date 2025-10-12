import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AppAuthService } from '@shared/auth/app-auth.service';
import { BsDropdownDirective, BsDropdownToggleDirective, BsDropdownMenuDirective } from 'ngx-bootstrap/dropdown';
import { Router, RouterLink } from '@angular/router';
import { LocalizePipe } from '@shared/pipes/localize.pipe';
import { AppSessionService } from '@shared/session/app-session.service';
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { ChangePasswordComponent } from './change-password/change-password.component';
import { AbpModalHeaderComponent } from '@shared/components/modal/abp-modal-header.component';
import { AbpModalFooterComponent } from '@shared/components/modal/abp-modal-footer.component';

@Component({
    selector: 'header-user-menu',
    templateUrl: './header-user-menu.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [BsDropdownDirective, BsDropdownToggleDirective, BsDropdownMenuDirective, RouterLink, LocalizePipe],
})
export class HeaderUserMenuComponent {
    userName: string;
    constructor(
        private _authService: AppAuthService,
        private _abpSession: AppSessionService,
        private router: Router,
        private _modalService: BsModalService

    ) {
        this.userName = this._abpSession.getShownLoginName();
    }

    logout(): void {
        this._authService.logout();
    }

    changePassword() {
        this.showChangePasswordDialog();
    }

    private showChangePasswordDialog(): void {
        let changePasswordDialog: BsModalRef;
        changePasswordDialog = this._modalService.show(
            ChangePasswordComponent,
            {
                class: "modal-lg"
            }
        );
        changePasswordDialog.content.onSave.subscribe(() => {
            changePasswordDialog.hide();
        });
    }
}
