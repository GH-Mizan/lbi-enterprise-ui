import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppRouteGuard } from '@shared/auth/auth-route-guard';
import { AppComponent } from './app.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: AppComponent,
                children: [
                    {
                        path: 'home',
                        loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'users',
                        loadChildren: () => import('./users/users.module').then((m) => m.UsersModule),
                        data: { permission: 'Pages.Users' },
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'roles',
                        loadChildren: () => import('./roles/roles.module').then((m) => m.RolesModule),
                        data: { permission: 'Pages.Roles' },
                        canActivate: [AppRouteGuard],
                    },
                    {
                        path: 'tenants',
                        loadChildren: () => import('./tenants/tenants.module').then((m) => m.TenantsModule),
                        data: { permission: 'Pages.Tenants' },
                        canActivate: [AppRouteGuard],
                    },
                    { path: 'update-password', loadChildren: () => import('./users/users.module').then((m) => m.UsersModule), canActivate: [AppRouteGuard]},
                    { path: 'clients', loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule), canActivate: [AppRouteGuard] },
                    { path: 'suppliers', loadChildren: () => import('./suppliers/suppliers.module').then(m => m.SuppliersModule) },
                    { path: 'stock-points', loadChildren: () => import('./stock-points/stock-points.module').then(m => m.StockPointsModule) },
                    { path: 'items', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },
                    { path: 'daily-cash', loadChildren: () => import('./daily-cash/daily-cash.module').then(m => m.DailyCashModule) },
                    { path: 'purchases', loadChildren: () => import('./purchases/purchases.module').then(m => m.PurchasesModule) },
                    { path: 'sales', loadChildren: () => import('./sales/sales.module').then(m => m.SalesModule) },
                    { path: 'departments', loadChildren: () => import('./departments/departments.module').then(m => m.DepartmentsModule) },
                    { path: 'designations', loadChildren: () => import('./designations/designations.module').then(m => m.DesignationsModule) },
                    { path: 'employees', loadChildren: () => import('./employees/employees.module').then(m => m.EmployeesModule) },
                    { path: 'inventories', loadChildren: () => import('./inventories/inventories.module').then(m => m.InventoriesModule) },
                    { path: 'reports', loadChildren: () => import('./reports/reports.module').then(m => m.ReportsModule) },
                    { path: 'lbi-settings', loadChildren: () => import('./lbi-settings/lbi-settings.module').then(m => m.LbiSettingsModule) },
                    { path: 'virtual-stocks', loadChildren: () => import('./virtual-stocks/virtual-stocks.module').then(m => m.VirtualStocksModule) },
                    { path: 'salaries', loadChildren: () => import('./salaries/salaries.module').then(m => m.SalariesModule) },
                    { path: 'account-heads', loadChildren: () => import('./account-heads/account-heads.module').then(m => m.AccountHeadsModule) },
                    { path: 'additional-parties', loadChildren: () => import('./additional-parties/additional-parties.module').then(m => m.AdditionalPartiesModule) },
                ],
            },
            
            
            
            
            
           
            
            
            
            
            
            
            
            
            
        ]),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
