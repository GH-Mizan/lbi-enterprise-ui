import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ComboboxItemDto, CustomerOverallDueReportDto, SalesCollectionDueReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';

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
export class CustomerOverallDuesReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    //endDate = new Date();
    //startDate = (moment().subtract(31, 'days')).toDate();
    //maxDate = this.endDate;

    initialDue: number;
    currentSales: number;
    currentPaymnet: number;
    currentDue: number;

    monthId: number;
    yearId: number;
    months: ComboboxItemDto[] = [];
    years: ComboboxItemDto[] = [];

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this.months = Utils.getMonths();
        const currentYear: number = new Date().getFullYear();
        this.years = Utils.getYears(currentYear);
        this.monthId = new Date().getMonth() + 1;
        this.yearId = currentYear;
        this.cd.detectChanges();
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
        this._salesService.getCustomersOverallDueReport(this.monthId, this.yearId)
            .pipe(
                finalize(() => {
                    this.hideLoading();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;

                const values = result.reduce((accumulator, item) => {
                    accumulator.initialDue += item.initialDue;
                    accumulator.currentSales += item.currentSales;
                    accumulator.currentPaymnet += item.currentPaymnet;
                    accumulator.currentDue += item.currentDue;
                    return accumulator;
                }, { initialDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 });

                this.initialDue = values.initialDue;
                this.currentSales = values.currentSales;
                this.currentPaymnet = values.currentPaymnet;
                this.currentDue = values.currentDue;
                this.cd.detectChanges();
            });
    }

    delete() {

    }

    async print(download?: boolean) {
        this.showLoading();
        const items = await firstValueFrom(this._salesService.getCustomersOverallDueReport(this.monthId, this.yearId));
        if (!items || items.length == 0) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        // let count = items.length + 1;
        // for (let i = count; i < 123 + count; i++) {
        //     items.push({ serial: i.toString(), previousDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 } as CustomerOverallDueReportDto);
        // }

        var dd = {
            pageSize: 'A4',
            pageMargins: [30, 20, 30, 20],
            content: this.getContent(items, logo),
            defaultStyle: {
                font: 'TimesNewRoman'
            },
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
        if (download) this.pdfMake.createPdf(dd).download('Client Balance.pdf');
        else this.pdfMake.createPdf(dd).open();
        this.hideLoading();
    }

    private getContent(data: CustomerOverallDueReportDto[], logo: any) {
        const totalRows = data.length;
        const totalValues = data.reduce((accumulator, item) => {
            accumulator.initialDue += item.initialDue;
            accumulator.currentSales += item.currentSales;
            accumulator.currentPaymnet += item.currentPaymnet;
            accumulator.currentDue += item.currentDue;
            return accumulator;
        }, { initialDue: 0, currentSales: 0, currentPaymnet: 0, currentDue: 0 });

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

        var monthText = this.months.find(f => f.value === this.monthId.toString()).displayText;
        var headerText = `Clients' Balance (${monthText}, ${this.yearId})`

        if (!hasNextpage) {
            return [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        body: [
                            [{ text: headerText, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                    [{ text: headerText, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                    [{ text: headerText, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                    [{ text: headerText, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                    [{ text: headerText, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
            { text: Utils.thousandsSeparator(totalValues.initialDue), style: ['cellAmount', 'cellLightGrey'], bold: true },
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
                    { text: Utils.thousandsSeparator(item.initialDue), style: ['cellAmount'] },
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
                    { text: Utils.thousandsSeparator(totalValues.initialDue), style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.currentSales), style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.currentPaymnet), style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.currentDue), style: ['cellAmount', 'cellLightGrey'], bold: true }
                ]
            );
        }
        return body;
    }

}
