import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
import { DailyPurchaseReportDto, PurchaseServiceProxy } from '../../../shared/service-proxies/service-proxies';
import { Utils } from '@shared/helpers/Utils';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
    selector: 'app-daily-purchase-report',
    standalone: false,
    templateUrl: './daily-purchase-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
     :host ::ng-deep .p-inputtext {
        min-width: 185px !important;
      }
    `
    ]
})
export class DailyPurchaseReportComponent implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    data: DailyPurchaseReportDto;
    date = new Date();
    loading: boolean = false;

    constructor(
        private cd: ChangeDetectorRef,
        private _purchaseService: PurchaseServiceProxy
    ) {

    }
    ngOnInit(): void {
        this.loading = true;
        this.getReportData();
    }

    getReportData() {
        this._purchaseService.getDailyPurchaseReport(moment(this.date))
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cd.detectChanges();
                })
            )
            .subscribe((result) => {
                this.data = result;
                this.cd.detectChanges();
            });
    }

    async print() {
        const data = await firstValueFrom(this._purchaseService.getDailyPurchaseReport(moment(this.date)));
        const logo = await Utils.getImageDataUrl('../../assets/img/logo.png');
        var dd = {
            pageSize: 'A4',
            pageMargins: [20, 40, 20, 30],
            content: [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: `Daily Purchase (${moment(this.date).format('D MMM, YYYY').toString()})`, bold: true, fontSize: 20, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'] }],
                        ]
                    }
                },
                { text: ' ', fontSize: 10 },
                {
                    table: {
                        widths: ['*', 17, 25, 17, 17, 17, 17, 17, 40, 45, 45, 32],
                        body: this.getData(data)
                    }
                }
            ],
            styles: {
                headerStyle: {
                    fontSize: 11,
                    bold: true,
                    alignment: 'center'
                },
                text_green: {
                    color: 'green'
                },
                cell_style: {
                    fontSize: 10,
                    alignment: 'center'
                },
                margin_1: {
                    marginTop: 1,
                    marginBottom: 1
                },
                footerStyle: {
                    fontSize: 11,
                    bold: true,
                    alignment: 'right'
                },
                footerParticular: {
                    bold: true,
                    alignment: 'center'
                },
                textCenter: {
                    alignment: 'center'
                }
            }
        };
        // pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
        pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getData(data: any) {
        const body = [
            [{ text: 'Supplier', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Due Pay.', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Status', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }],
            [{ text: '' }, { text: 'Oxygen', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Air', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'Nitros (KG)', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '', colSpan: 4 }, { text: '', style: ['headerStyle'] }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '9.8', style: ['textCenter'] }, { text: '1.36', style: ['textCenter'] }, { text: '9.8', style: ['textCenter'] }, { text: '7.0', style: ['textCenter'] }, { text: '30', style: ['textCenter'] }, { text: '5', style: ['textCenter'] }, { text: '3', style: ['textCenter'] }, { text: '', colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }],
        ];
        data.details.forEach(item => {
            body.push(
                [
                    { text: item.supplierName, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.medicalAir7Qty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros30KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros5KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.nitros3KgQty, style: ['cell_style', 'margin_1'] },
                    { text: item.invoiceNo, style: ['cell_style', 'margin_1'] },
                    { text: Utils.thousandsSeparator(item.netAmount), style: ['cell_style', 'margin_1'] },
                    { text: Utils.thousandsSeparator(item.duePayment), style: ['cell_style', 'margin_1'] },
                    { text: item.paymentStatusText, style: ['cell_style', 'margin_1'] }
                ]
            );
        });

        body.push([{ text: ' ', colSpan: 12 }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }]);

        body.push([
            { text: 'Total Purchase', style: ['footerStyle'] },
            { text: data.medicalOxygen9_8TotalQty, style: ['footerParticular'] },
            { text: data.medicalOxygen1_36TotalQty, style: ['footerParticular'] },
            { text: data.medicalAir9_8TotalQty, style: ['footerParticular'] },
            { text: data.medicalAir7TotalQty, style: ['footerParticular'] },
            { text: data.nitros30KgTotalQty, style: ['footerParticular'] },
            { text: data.nitros5KgTotalQty, style: ['footerParticular'] },
            { text: data.nitros3KgTotalQty, style: ['footerParticular'] },
            { text: `${Utils.thousandsSeparator(data.netTotal)}/-`, colSpan: 4, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }
        ]);

        body.push([
            { text: 'Cash Payment', style: ['footerStyle'] },
            { text: `${Utils.thousandsSeparator(data.cashPayment)}/-`, colSpan: 11, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
        ]);
        body.push([
            { text: 'Due Payment', style: ['footerStyle'] },
            { text: `${Utils.thousandsSeparator(data.duePayment)}/-`, colSpan: 11, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
        ]);
        body.push([
            { text: 'Due', style: ['footerStyle'] },
            { text: `${Utils.thousandsSeparator(data.due)}/-`, colSpan: 11, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
        ]);

        return body;
    }
}
