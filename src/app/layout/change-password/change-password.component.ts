import { ChangeDetectorRef, Component, EventEmitter, Injector, Output } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/app-component-base';
import { ChangePasswordDto, UserServiceProxy } from '@shared/service-proxies/service-proxies';
import { AbpValidationError } from '@shared/components/validation/abp-validation.api';
import { FormsModule } from '@angular/forms';
import { AbpValidationSummaryComponent } from '../../../shared/components/validation/abp-validation.summary.component';
import { EqualValidator } from '../../../shared/directives/equal-validator.directive';
import { LocalizePipe } from '@shared/pipes/localize.pipe';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    templateUrl: './change-password.component.html',
    animations: [appModuleAnimation()],
    standalone: true,
    imports: [FormsModule, AbpValidationSummaryComponent, EqualValidator, LocalizePipe],
})
export class ChangePasswordComponent extends AppComponentBase {
    @Output() onSave = new EventEmitter<any>();
    saving = false;
    changePasswordDto = new ChangePasswordDto();
    newPasswordValidationErrors: Partial<AbpValidationError>[] = [
        {
            name: 'pattern',
            localizationKey: 'PasswordsMustBeAtLeast8CharactersContainLowercaseUppercaseNumber',
        },
    ];
    confirmNewPasswordValidationErrors: Partial<AbpValidationError>[] = [
        {
            name: 'validateEqual',
            localizationKey: 'PasswordsDoNotMatch',
        },
    ];

    constructor(
        injector: Injector,
        private userServiceProxy: UserServiceProxy,
        private cd: ChangeDetectorRef,
        public bsModalRef: BsModalRef
    ) {
        super(injector);
    }

    changePassword() {
        this.saving = true;

        this.userServiceProxy
            .changePassword(this.changePasswordDto)
            .pipe(
                finalize(() => {
                    this.saving = false;
                    this.cd.detectChanges();
                })
            )
            .subscribe((success) => {
                if (success) {
                    abp.message.success('Password changed successfully', 'Success');
                    this.bsModalRef.hide();
                }
            });
    }
}
