import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { DailySalesReportDetailsDto, DailySalesReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
    selector: 'app-daily-sales-report',
    standalone: false,
    templateUrl: './daily-sales-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
     :host ::ng-deep .p-inputtext {
        min-width: 110px !important;
      }
    `
    ]
})
export class DailySalesReportComponent extends PagedListingComponentBase<DailySalesReportDetailsDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    data: DailySalesReportDto;
    date = new Date();
    loading: boolean = false;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
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
            'LucidaGrande': {
                bold: 'LucidaGrandeBold.ttf'
            }
        });
        pdfMake.addVirtualFileSystem(pdfFonts);
        return pdfMake;
    }

    list(event?: LazyLoadEvent): void {
        this.showLoading();
        this._salesService.getDailySalesReport(moment(this.date))
            .pipe(finalize(() => {
                this.hideLoading();
            }))
            .subscribe((result) => {
                if (result && result.details) {
                    this.data = result;
                    this.primengTableHelper.records = result.details;
                    this.primengTableHelper.totalRecordsCount = result.details.length;
                    this.cd.detectChanges();
                }
            });
    }

    delete() { }

    async print(download?: boolean) {
        this.showLoading();
        const data = await firstValueFrom(this._salesService.getDailySalesReport(moment(this.date)));
        if (!data || !data.details) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }
        // let count = data.details.length + 1;
        // for (let i = count; i < 118 + count; i++) {
        //     data.details.push({ customerName: i.toString(), netAmount: 0, dueCollection: 0 } as DailySalesReportDetailsDto);
        // }
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 20, 30, 20],
            content: this.getContent(data, logo),
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
                particularHeader: {
                    fontSize: 10,
                    bold: true,
                    alignment: 'center'
                },
                cell_style: {
                    fontSize: 9,
                    alignment: 'center'
                },
                footerStyle: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'right'
                },
                footerParticular: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'center'
                },
                particularHeader136: {
                    fontSize: 8,
                    bold: true,
                    alignment: 'center'
                },
                cellAmount: {
                    fontSize: 9,
                    alignment: 'right'
                }
            }

        };

        if(download) this.pdfMake.createPdf(dd).download('DailySalesReport.pdf');
        else this.pdfMake.createPdf(dd).open();
        this.hideLoading();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getContent(data: DailySalesReportDto, logo: any) {
        const details = data.details;
        const totalRows = details.length;
        const totalValues = {
            medicalOxygen9_8TotalQty: data.medicalOxygen9_8TotalQty,
            medicalOxygen1_36TotalQty: data.medicalOxygen1_36TotalQty,
            medicalAir9_8TotalQty: data.medicalAir9_8TotalQty,
            medicalAir7TotalQty: data.medicalAir7TotalQty,
            nitros30KgTotalQty: data.nitros30KgTotalQty,
            nitros5KgTotalQty: data.nitros5KgTotalQty,
            nitros3KgTotalQty: data.nitros3KgTotalQty,
            netTotal: data.netTotal,
            cashCollection: data.cashCollection,
            dueCollection: data.dueCollection,
            due: data.due
        };

        let hasNextpage = false;
        const metaData: DailySalesReportDetailsDto[][] = [];
        let slicedData: DailySalesReportDetailsDto[] = [];

        if (totalRows > 38) {
            hasNextpage = true;
            const partition = Math.ceil(totalRows / 41);
            for (let i = 0; i < partition; i++) {
                slicedData = [];
                const itemsToTransfer = details.slice(0, 41);
                slicedData.push(...itemsToTransfer);
                details.splice(0, 41);
                metaData.push(slicedData);
            }
        }

        if (!hasNextpage) {
            return [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{ text: `DAILY SALES (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                        widths: ['*', 19, 16, 17, 17, 17, 17, 17, 40, 45, 45, 32],
                        body: this.getData(details, true, totalValues)
                    }
                }
            ];
        } else {
            const content = [];
            metaData.forEach((items, index) => {
                const lastItem = metaData.length === index + 1;
                if (lastItem && items.length <= 37) {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DAILY SALES (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 19, 16, 17, 17, 17, 17, 17, 40, 45, 45, 32],
                                body: this.getData(items, true, totalValues)
                            }
                        },
                        { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                    );
                } else if (lastItem && items.length > 37) {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DAILY SALES (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 19, 16, 17, 17, 17, 17, 17, 40, 45, 45, 32],
                                body: this.getData(items, false)
                            }
                        },
                        { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                        { text: '', pageBreak: 'after' }
                    );

                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DAILY SALES (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 19, 16, 17, 17, 17, 17, 17, 40, 45, 45, 32],
                                body: this.getTotal(totalValues)
                            }
                        },
                        { text: `Page: ${index + 2}`, fontSize: 7, alignment: 'right', marginTop: 3 }
                    );
                } else {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DAILY SALES (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 19, 16, 17, 17, 17, 17, 17, 40, 45, 45, 32],
                                body: this.getData(items, false)
                            }
                        },
                        { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                        { text: '', pageBreak: 'after' }
                    );
                }
            });
            return content;
        }

    }

    private getTotal(totalValues: any) {
        const body = [
            [{ text: 'Client', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Due Col.', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Status', rowSpan: 3, style: ['subHeader'], marginTop: 18 }] as any,
            [{ text: '' }, { text: 'MO', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'NO (KG)', colSpan: 3, style: ['subHeader'] }, { text: '' }, { text: '' }, { text: '', colSpan: 4 }, { text: '', style: ['subHeader'] }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '9.8', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader136'], marginTop: 1 }, { text: '9.8', style: ['particularHeader'] }, { text: '7.0', style: ['particularHeader'] }, { text: '30', style: ['particularHeader'] }, { text: '5', style: ['particularHeader'] }, { text: '3', style: ['particularHeader'] }, { text: '', colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }],
        ];
        body.push([
            { text: 'Total Sale', style: ['footerStyle'] },
            { text: totalValues.medicalOxygen9_8TotalQty, style: ['footerParticular'] },
            { text: totalValues.medicalOxygen1_36TotalQty, style: ['footerParticular'] },
            { text: totalValues.medicalAir9_8TotalQty, style: ['footerParticular'] },
            { text: totalValues.medicalAir7TotalQty, style: ['footerParticular'] },
            { text: totalValues.nitros30KgTotalQty, style: ['footerParticular'] },
            { text: totalValues.nitros5KgTotalQty, style: ['footerParticular'] },
            { text: totalValues.nitros3KgTotalQty, style: ['footerParticular'] },
            { text: `${Utils.thousandsSeparator(totalValues.netTotal)}/-`, colSpan: 4, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }
        ]);

        body.push([
            { text: 'Cash Collection', style: ['footerStyle'] },
            { text: `${Utils.thousandsSeparator(totalValues.cashCollection)}/-`, colSpan: 11, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
        ]);
        body.push([
            { text: 'Due Collection', style: ['footerStyle'] },
            { text: `${Utils.thousandsSeparator(totalValues.dueCollection)}/-`, colSpan: 11, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
        ]);
        body.push([
            { text: 'Due', style: ['footerStyle'] },
            { text: `${Utils.thousandsSeparator(totalValues.due)}/-`, colSpan: 11, style: ['footerStyle'] },
            { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
        ]);
        return body;

    }

    private getData(data: DailySalesReportDetailsDto[], showTotal: boolean, totalValues?: any) {
        const body = [
            [{ text: 'Client', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Due Col.', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Status', rowSpan: 3, style: ['subHeader'], marginTop: 18 }] as any,
            [{ text: '' }, { text: 'MO', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'NO (KG)', colSpan: 3, style: ['subHeader'] }, { text: '' }, { text: '' }, { text: '', colSpan: 4 }, { text: '', style: ['subHeader'] }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '9.8', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader136'], marginTop: 1 }, { text: '9.8', style: ['particularHeader'] }, { text: '7.0', style: ['particularHeader'] }, { text: '30', style: ['particularHeader'] }, { text: '5', style: ['particularHeader'] }, { text: '3', style: ['particularHeader'] }, { text: '', colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }],
        ];
        data.forEach(item => {
            body.push(
                [
                    { text: item.customerName, fontSize: 9 },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style'] },
                    { text: item.medicalAir7Qty, style: ['cell_style'] },
                    { text: item.nitros30KgQty, style: ['cell_style'] },
                    { text: item.nitros5KgQty, style: ['cell_style'] },
                    { text: item.nitros3KgQty, style: ['cell_style'] },
                    { text: item.invoiceNo, style: ['cell_style'] },
                    { text: `${Utils.thousandsSeparator(item.netAmount)}/-`, style: ['cellAmount'] },
                    { text: `${Utils.thousandsSeparator(item.dueCollection)}/-`, style: ['cellAmount'] },
                    { text: item.paymentStatusText, style: ['cell_style'] }
                ]
            );
        });

        if (showTotal) {
            body.push([
                { text: 'Total Sale', style: ['footerStyle'] },
                { text: totalValues.medicalOxygen9_8TotalQty, style: ['footerParticular'] },
                { text: totalValues.medicalOxygen1_36TotalQty, style: ['footerParticular'] },
                { text: totalValues.medicalAir9_8TotalQty, style: ['footerParticular'] },
                { text: totalValues.medicalAir7TotalQty, style: ['footerParticular'] },
                { text: totalValues.nitros30KgTotalQty, style: ['footerParticular'] },
                { text: totalValues.nitros5KgTotalQty, style: ['footerParticular'] },
                { text: totalValues.nitros3KgTotalQty, style: ['footerParticular'] },
                { text: `${Utils.thousandsSeparator(totalValues.netTotal)}/-`, colSpan: 4, style: ['footerStyle'] },
                { text: '' }, { text: '' }, { text: '' }
            ]);

            body.push([
                { text: 'Cash Collection', style: ['footerStyle'] },
                { text: `${Utils.thousandsSeparator(totalValues.cashCollection)}/-`, colSpan: 11, style: ['footerStyle'] },
                { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
            ]);
            body.push([
                { text: 'Due Collection', style: ['footerStyle'] },
                { text: `${Utils.thousandsSeparator(totalValues.dueCollection)}/-`, colSpan: 11, style: ['footerStyle'] },
                { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
            ]);
            body.push([
                { text: 'Due', style: ['footerStyle'] },
                { text: `${Utils.thousandsSeparator(totalValues.due)}/-`, colSpan: 11, style: ['footerStyle'] },
                { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }
            ]);
        }

        return body;
    }

}
