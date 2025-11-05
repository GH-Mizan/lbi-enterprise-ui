import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ComboboxItemDto, CustomerOverallDueReportDto, GeneralStockDetailsDto, GeneralStockOutputDto, VirtualStocksServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';

@Component({
    selector: 'app-general-stocks-report',
    standalone: false,
    templateUrl: './general-stocks.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
        :host ::ng-deep .p-inputtext {
            min-width: 110px !important;
        }
        `
    ]
})
export class GeneralStocksComponent extends PagedListingComponentBase<GeneralStockDetailsDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    date = new Date();

    oxygen136Total: number;
    oxygen98Total: number;
    medicalAirTotal: number;
    nitrousOxideTotal: number;
    grandTotal: number;

    typeId: number;
    warehouseTypes: ComboboxItemDto[];

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _virtualStocksService: VirtualStocksServiceProxy
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this.pdfMake = await this.loadAndPrintPDF();
        this.warehouseTypes = await firstValueFrom(this._virtualStocksService.getStockTypesSelectList());
         this.cd.detectChanges();
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
        this._virtualStocksService.getGeneralStocksReport(moment(this.date), this.typeId)
            .pipe(
                finalize(() => {
                    this.hideLoading();
                })
            )
            .subscribe((result) => {
                this.primengTableHelper.records = result.details;
                this.primengTableHelper.totalRecordsCount = result.details.length;

                this.oxygen136Total = result.oxygen136Total;
                this.oxygen98Total = result.oxygen98Total;
                this.medicalAirTotal = result.medicalAirTotal;
                this.nitrousOxideTotal = result.nitrousOxideTotal;
                this.grandTotal = result.grandTotal;
                this.cd.detectChanges();
            });
    }

    delete() { }

    async print() {
        this.showLoading();
        const data = await firstValueFrom(this._virtualStocksService.getGeneralStocksReport(moment(this.date), this.typeId));
        if (!data || !data.details || data.details.length == 0) {
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
            content: this.getContent(data, logo),
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
                    alignment: 'center'
                }
            }

        };
        this.hideLoading();
        //pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
        this.pdfMake.createPdf(dd).open();
        //pdfMake.createPdf(docDefinition).print();
    }

    private getContent(data: GeneralStockOutputDto, logo: any) {
        const details = data.details;
        const totalRows = details.length;
        const totalValues = {
            oxygen136Total: data.oxygen136Total,
            oxygen98Total: data.oxygen98Total,
            medicalAirTotal: data.medicalAirTotal,
            nitrousOxideTotal: data.nitrousOxideTotal,
            grandTotal: data.grandTotal
        };

        let hasNextpage = false;
        const metaData: GeneralStockDetailsDto[][] = [];
        let slicedData: GeneralStockDetailsDto[] = [];
        if (totalRows > 43) {
            hasNextpage = true;
            const partition = Math.ceil(totalRows / 42);
            for (let i = 0; i < partition; i++) {
                slicedData = [];
                const itemsToTransfer = details.slice(0, 42);
                slicedData.push(...itemsToTransfer);
                details.splice(0, 42);
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
                            [{ text: `General Stocks (${moment(this.date).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                        widths: ['*', 65, 65, 65, 70, 40],
                        body: this.getData(details, true, totalValues)
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
                                    [{ text: `General Stocks (${moment(this.date).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 65, 65, 65, 70, 40],
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
                                    [{ text: `General Stocks (${moment(this.date).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 65, 65, 65, 70, 40],
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
                                    [{ text: `General Stocks (${moment(this.date).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 65, 65, 65, 70, 40],
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
                                    [{ text: `General Stocks (${moment(this.date).format('DD-MMM-YY')})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: ['*', 65, 65, 65, 70, 40],
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
            [{ text: 'Name', style: ['headerStyle'] }, { text: "1.36 Oxygen", style: ['headerStyle'] }, { text: "9.80 Oxygen", style: ['headerStyle', 'textCenter'] }, { text: "Medical Air", style: ['headerStyle', 'textCenter'] }, { text: "Nitrous Oxide", style: ['headerStyle', 'textCenter'] }, { text: "Total", style: ['headerStyle', 'textCenter'] }] as any,
        ];
        body.push([
            { text: "Total", style: ['cellTotal', 'cellLightGrey'] },
            { text: totalValues.oxygen136Total, style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: totalValues.oxygen98Total, style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: totalValues.medicalAirTotal, style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: totalValues.nitrousOxideTotal, style: ['cellAmount', 'cellLightGrey'], bold: true },
            { text: totalValues.grandTotal, style: ['cellAmount', 'cellLightGrey'], bold: true }
        ]);
        return body;
    }

    private getData(items: GeneralStockDetailsDto[], showTotal: boolean, totalValues?: any) {
        const body = [
            [{ text: 'Name', style: ['headerStyle'] }, { text: "1.36 Oxygen", style: ['headerStyle'] }, { text: "9.80 Oxygen", style: ['headerStyle', 'textCenter'] }, { text: "Medical Air", style: ['headerStyle', 'textCenter'] }, { text: "Nitrous Oxide", style: ['headerStyle', 'textCenter'] }, { text: "Total", style: ['headerStyle', 'textCenter'] }] as any,
        ];
        items.forEach(item => {
            body.push(
                [
                    { text: item.warehouseName, fontSize: 9 },
                    { text: item.oxygen136, style: ['cellAmount'] },
                    { text: item.oxygen98, style: ['cellAmount'] },
                    { text: item.medicalAir, style: ['cellAmount'] },
                    { text: item.nitrousOxide, style: ['cellAmount'] },
                    { text: item.total, style: ['cellAmount'] }
                ]
            );
        });

        if (showTotal) {
            body.push(
                [
                    { text: "Total", style: ['cellTotal', 'cellLightGrey'] },
                    { text: totalValues.oxygen136Total, style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: totalValues.oxygen98Total, style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: totalValues.medicalAirTotal, style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: totalValues.nitrousOxideTotal, style: ['cellAmount', 'cellLightGrey'], bold: true },
                    { text: totalValues.grandTotal, style: ['cellAmount', 'cellLightGrey'], bold: true }
                ]
            );
        }
        return body;
    }

}
