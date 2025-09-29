import { ChangeDetectorRef, Component, Injector, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { CustomerOverallDueReportDto, SalesCollectionDueReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';
pdfMake.addVirtualFileSystem(pdfFonts);

@Component({
    selector: 'app-customer-overall-dues-report',
    standalone: false,
    templateUrl: './customer-overall-dues-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
        :host ::ng-deep .p-inputtext {
            min-width: 110px !important;
        }
        `
    ]
})
export class CustomerOverallDuesReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    endDate = new Date();
    startDate = (moment().subtract(31, 'days')).toDate();
    maxDate = this.endDate;

    previousDue: number;
    currentSales: number;
    currentPaymnet: number;
    currentDue: number;


    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
    ) {
        super(injector, cd);
    }

    list(event?: LazyLoadEvent): void {
        this.primengTableHelper.showLoadingIndicator();
        this._salesService.getCustomersOverallDueReport(moment(this.startDate), moment(this.endDate))
            .pipe(
                finalize(() => {
                    this.primengTableHelper.hideLoadingIndicator();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;

                const values = result.reduce((accumulator, item) => {
                    accumulator.previousDue += item.previousDue;
                    accumulator.currentSales += item.currentSales;
                    accumulator.currentPaymnet += item.currentPaymnet;
                    accumulator.currentDue += item.currentDue;
                    return accumulator;
                }, { previousDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 });

                this.previousDue = values.previousDue;
                this.currentSales = values.currentSales;
                this.currentPaymnet = values.currentPaymnet;
                this.currentDue = values.currentDue;

                this.primengTableHelper.hideLoadingIndicator();
                this.cd.detectChanges();
            });
    }

    startDateChanged() {
        this.endDate = new Date(this.startDate);
        this.endDate.setDate(this.endDate.getDate() + 31);
        this.maxDate = this.endDate;
        this.cd.detectChanges();
    }

    delete() {

    }

    async print() {
        const items = await firstValueFrom(this._salesService.getCustomersOverallDueReport(
            moment(this.startDate), moment(this.endDate)
        ));
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        // let count = items.length + 1;
        // for (let i = count; i < 123 + count; i++) {
        //     items.push({ serial: i.toString(), previousDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 } as CustomerOverallDueReportDto);
        // }

        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 20, 30, 20],
            content: this.getContent(items, logo),
            styles: {
                headerStyle: {
                    fontSize: 11,
                    bold: true,
                    alignment: 'center'
                },
                textCenter: {
                    alignment: 'center'
                },
                cellLightGrey: {
                    fillColor: '#F2F2F2'
                },
                cellTotal: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'right'
                },
                cellAmount: {
                    fontSize: 9,
                    alignment: 'right'
                }
            }

        };
        //pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
        pdfMake.createPdf(dd).open();
        //pdfMake.createPdf(docDefinition).print();
    }

    private getContent(data: CustomerOverallDueReportDto[], logo: any) {
        const totalRows = data.length;
        const totalValues = data.reduce((accumulator, item) => {
            accumulator.previousDue += item.previousDue;
            accumulator.currentSales += item.currentSales;
            accumulator.currentPaymnet += item.currentPaymnet;
            accumulator.currentDue += item.currentDue;
            return accumulator;
        }, { previousDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 });

        let hasNextpage = false;
        const metaData: CustomerOverallDueReportDto[][] = [];
        let slicedData: CustomerOverallDueReportDto[] = [];
        if (totalRows > 43) {
            hasNextpage = true;
            const partition = Math.ceil(totalRows / 42);
            for (let i = 0; i < partition; i++) {
                slicedData = [];
                const itemsToTransfer = data.slice(0, 42);
                slicedData.push(...itemsToTransfer);
                data.splice(0, 42);
                metaData.push(slicedData);
            }
        }

        if (!hasNextpage) {
            return [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        body: [
                            [{ text: `Clients' Balance (${moment(this.startDate).format('DD-MMM-YY')} to ${moment(this.endDate).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
                        ]
                    }
                },
                { text: ' ', fontSize: 5 },
                {
                    layout: {
                        hLineColor: () => 'grey',
                        vLineColor: () => 'grey',
                        hLineWidth: () => 1,
                        vLineWidth: () => 1,
                    },
                    table: {
                        widths: [20, '*', 68, 65, 65, 65],
                        body: this.getData(data, true, totalValues)
                    }
                }
            ]
        } else {
            const content = [];
            metaData.forEach((items, index) => {
                const lastItem = metaData.length === index + 1;
                if (lastItem && items.length === 42) {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'], // Two columns, equal width
                                body: [
                                    [{ text: `Clients' Balance (${moment(this.startDate).format('DD-MMM-YY')} to ${moment(this.endDate).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
                                ]
                            }
                        },
                        { text: ' ', fontSize: 5 },
                        {
                            layout: {
                                hLineColor: () => 'grey',
                                vLineColor: () => 'grey',
                                hLineWidth: () => 1,
                                vLineWidth: () => 1,
                            },
                            table: {
                                widths: [20, '*', 68, 65, 65, 65],
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
                                widths: ['*'], // Two columns, equal width
                                body: [
                                    [{ text: `Clients' Balance (${moment(this.startDate).format('DD-MMM-YY')} to ${moment(this.endDate).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
                                ]
                            }
                        },
                        { text: ' ', fontSize: 5 },
                        {
                            layout: {
                                hLineColor: () => 'grey',
                                vLineColor: () => 'grey',
                                hLineWidth: () => 1,
                                vLineWidth: () => 1,
                            },
                            table: {
                                widths: [20, '*', 68, 65, 65, 65],
                                body: this.getTotal(totalValues)
                            }
                        },
                        { text: `Page: ${index + 2}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                    );
                } else if (lastItem && items.length < 42) {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'], // Two columns, equal width
                                body: [
                                    [{ text: `Clients' Balance (${moment(this.startDate).format('DD-MMM-YY')} to ${moment(this.endDate).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
                                ]
                            }
                        },
                        { text: ' ', fontSize: 5 },
                        {
                            layout: {
                                hLineColor: () => 'grey',
                                vLineColor: () => 'grey',
                                hLineWidth: () => 1,
                                vLineWidth: () => 1,
                            },
                            table: {
                                widths: [20, '*', 68, 65, 65, 65],
                                body: this.getData(items, true, totalValues)
                            }
                        },
                        { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 }
                    )
                } else {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'], // Two columns, equal width
                                body: [
                                    [{ text: `Clients' Balance (${moment(this.startDate).format('DD-MMM-YY')} to ${moment(this.endDate).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', border: [false, true, false, true], borderColor: ['', 'grey', '', 'grey'], fillColor: '#C4C4C4' }],
                                ]
                            }
                        },
                        { text: ' ', fontSize: 5 },
                        {
                            layout: {
                                hLineColor: () => 'grey',
                                vLineColor: () => 'grey',
                                hLineWidth: () => 1,
                                vLineWidth: () => 1,
                            },
                            table: {
                                widths: [20, '*', 68, 65, 65, 65],
                                body: this.getData(items, false)
                            }
                        },
                        { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                        { text: '', pageBreak: 'after' }
                    )
                }
            });
            return content;
        }
    }

    private getTotal(totalValues?: any) {
        const body = [
            [{ text: '#', style: ['headerStyle'] }, { text: "Client", style: ['headerStyle'] }, { text: "Previous Due", style: ['headerStyle', 'textCenter'] }, { text: "Sales", style: ['headerStyle', 'textCenter'] }, { text: "Payment", style: ['headerStyle', 'textCenter'] }, { text: "Current Due", style: ['headerStyle', 'textCenter'] }] as any,
        ];
        body.push([
            { text: "Total", style: ['cellTotal', 'cellLightGrey'], colSpan: 2 },
            { text: '' },
            { text: Utils.thousandsSeparator(totalValues.previousDue), style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: Utils.thousandsSeparator(totalValues.currentSales), style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: Utils.thousandsSeparator(totalValues.currentPaymnet), style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: Utils.thousandsSeparator(totalValues.currentDue), style: ['cellAmount', 'cellLightGrey'], bold: true }
        ]);
        return body;
    }

    private getData(items: CustomerOverallDueReportDto[], showTotal: boolean, totalValues?: any) {
        const body = [
            [{ text: '#', style: ['headerStyle'] }, { text: "Client", style: ['headerStyle'] }, { text: "Previous Due", style: ['headerStyle', 'textCenter'] }, { text: "Sales", style: ['headerStyle', 'textCenter'] }, { text: "Payment", style: ['headerStyle', 'textCenter'] }, { text: "Current Due", style: ['headerStyle', 'textCenter'] }] as any,
        ];
        items.forEach(item => {
            body.push(
                [
                    { text: item.serial, fontSize: 9, alignment: 'center' },
                    { text: item.customerName },
                    { text: Utils.thousandsSeparator(item.previousDue), style: ['cellAmount'] },
                    { text: Utils.thousandsSeparator(item.currentSales), style: ['cellAmount'] },
                    { text: Utils.thousandsSeparator(item.currentPaymnet), style: ['cellAmount'] },
                    { text: Utils.thousandsSeparator(item.currentDue), style: ['cellAmount'] }
                ]
            );
        });

        if (showTotal) {
            body.push(
                [
                    { text: "Total", style: ['cellTotal', 'cellLightGrey'], colSpan: 2 },
                    { text: '' },
                    { text: Utils.thousandsSeparator(totalValues.previousDue), style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.currentSales), style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.currentPaymnet), style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.currentDue), style: ['cellAmount', 'cellLightGrey'], bold: true }
                ]
            );
        }
        return body;
    }

}
