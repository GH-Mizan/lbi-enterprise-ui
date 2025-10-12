import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { firstValueFrom } from 'rxjs';
import { DailyPurchaseReportDetailsDto, DailyPurchaseReportDto, PurchaseServiceProxy } from '../../../shared/service-proxies/service-proxies';
import { Utils } from '@shared/helpers/Utils';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";

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
export class DailyPurchaseReportComponent extends PagedListingComponentBase<DailyPurchaseReportDetailsDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    data: any;
    date = new Date();
    loading: boolean = false;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _purchaseService: PurchaseServiceProxy
    ) {
        super(injector, cd);
    }
    async ngOnInit() {
        this.loading = true;
        this.pdfMake = await this.loadAndPrintPDF();
    }

    async loadAndPrintPDF() {
        const { default: pdfMake } = await import('pdfmake/build/pdfmake');
        const { default: pdfFonts } = await import('assets/vfs_fonts');
        pdfMake.addFonts({
            'TimesNewRoman': {
                normal: 'times-Regular.ttf',
                bold: 'Times New Roman Bold.ttf'
            },
            'CourierBold': {
                normal: 'Courier BOLD.ttf',
                bold: 'Courier BOLD.ttf'
            },
            'LucidaGrande': {
                bold: 'LucidaGrandeBold.ttf'
            }
        });

        pdfMake.addVirtualFileSystem(pdfFonts);
        return pdfMake;
    }

    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._purchaseService.getDailyPurchaseReport(moment(this.date))
            .pipe(finalize(() => {
                this.hideLoading();
            }))
            .subscribe((result) => {
                if (result && result.details) {
                    this.data = this.getTotal(result);
                    this.primengTableHelper.records = result.details;
                    this.primengTableHelper.totalRecordsCount = result.details.length;
                    this.cd.detectChanges();
                }
            });
    }

    delete() { }

    getTotal(data: DailyPurchaseReportDto) {
        return {
            medicalOxygen9_8TotalQty: data.medicalOxygen9_8TotalQty,
            medicalOxygen1_36TotalQty: data.medicalOxygen1_36TotalQty,
            medicalAir9_8TotalQty: data.medicalAir9_8TotalQty,
            medicalAir7TotalQty: data.medicalAir7TotalQty,
            nitros30KgTotalQty: data.nitros30KgTotalQty,
            nitros5KgTotalQty: data.nitros5KgTotalQty,
            nitros3KgTotalQty: data.nitros3KgTotalQty,
            netTotal: data.netTotal,
            cashPayment: data.cashPayment,
            duePayment: data.duePayment,
            due: data.due
        };
    }

    async print() {
        this.showLoading();
        const data = await firstValueFrom(this._purchaseService.getDailyPurchaseReport(moment(this.date)));
        if (!data || !data.details) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 20, 30, 20],
            content: [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: `DAILY PURCHASE (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
                        ]
                    }
                },
                { text: ' ', fontSize: 5 },
                {
                    layout: {
                        hLineColor: () => 'lightgrey',
                        vLineColor: () => 'lightgrey',
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                    },
                    table: {
                        widths: [100, '*', '*', '*', '*', '*', '*', '*', 42, 52, 52, 16],
                        body: this.getData(data)
                    }
                }
            ],
            defaultStyle: {
                font: 'TimesNewRoman'
            },
            styles: {
                headerStyle: {
                    fontSize: 12,
                    bold: true,
                    alignment: 'center'
                },
                subHeader: {
                    fontSize: 10,
                    bold: true,
                    alignment: 'center'
                },
                cell_style: {
                    fontSize: 10,
                    alignment: 'center'
                },
                footerStyle: {
                    fontSize: 11,
                    bold: true,
                    alignment: 'right'
                },
                footerParticular: {
                    fontSize: 10,
                    bold: true,
                    alignment: 'center'
                },
                textCenter: {
                    alignment: 'center'
                },
                cellAmount: {
                    fontSize: 10,
                    alignment: 'right'
                }
            }
        };
        // pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
        this.hideLoading();
        this.pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getData(data: any) {
        const body = [
            [{ text: 'Supplier', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Due Pay.', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'ST', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }] as any,
            [{ text: '' }, { text: 'MO', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'NO (KG)', colSpan: 3, style: ['subHeader'] }, { text: '' }, { text: '' }, { text: '', colSpan: 4 }, { text: '', style: ['headerStyle'] }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '9.8', style: ['textCenter'] }, { text: '1.36', style: ['textCenter'] }, { text: '9.8', style: ['textCenter'] }, { text: '7.0', style: ['textCenter'] }, { text: '30', style: ['textCenter'] }, { text: '5', style: ['textCenter'] }, { text: '3', style: ['textCenter'] }, { text: '', colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }],
        ];
        data.details.forEach(item => {
            body.push(
                [
                    { text: item.supplierName, fontSize: 10 },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style'] },
                    { text: item.medicalAir7Qty, style: ['cell_style'] },
                    { text: item.nitros30KgQty, style: ['cell_style'] },
                    { text: item.nitros5KgQty, style: ['cell_style'] },
                    { text: item.nitros3KgQty, style: ['cell_style'] },
                    { text: item.invoiceNo, style: ['cell_style'] },
                    { text: `${Utils.thousandsSeparator(item.netAmount)}/-`, style: ['cellAmount'] },
                    { text: `${Utils.thousandsSeparator(item.duePayment)}/-`, style: ['cellAmount'] },
                    { text: item.paymentStatusText == 'Paid' ? 'P' : item.paymentStatusText == 'Due' ? 'D' : 'PP', style: ['cell_style'] }
                ]
            );
        });

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
