import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ComboboxItemDto, MonthlySalesRankingReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
    selector: 'app-monthly-sales-ranking-report',
    standalone: false,
    templateUrl: './monthly-sales-ranking.component.html',
    animations: [appModuleAnimation()]
})
export class MonthlySalesRankingReportComponent extends PagedListingComponentBase<MonthlySalesRankingReportDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    monthId: number;
    yearId: number;
    loading: boolean = true;
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
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        months.forEach((m, index) => {
            this.months = [...this.months, { value: (index + 1).toString(), displayText: m } as ComboboxItemDto];
        });

        const currentYear: number = new Date().getFullYear();
        for (let i = currentYear - 5; i <= currentYear; i++) {
            this.years = [...this.years, { value: i.toString(), displayText: i.toString() } as ComboboxItemDto];
        }
        this.monthId = new Date().getMonth() + 1;
        this.yearId = currentYear;

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
        this._salesService.getMonthlySalesRankingReport(this.monthId, this.yearId)
            .pipe(finalize(() => {
                this.hideLoading();
            }))
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;
                this.cd.detectChanges();
            });
    }

    delete() { }

    async print(download?: boolean) {
        this.showLoading();
        const data = await firstValueFrom(this._salesService.getMonthlySalesRankingReport(this.monthId, this.yearId));
        if (!data || data.length == 0) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }
        const logo = await Utils.getImageDataUrl('assets/img/logo.png');
        // let count = data.length + 1;
        // for (let i = count; i < 11 + count; i++) {
        //     data.push({ rank: i } as MonthlySalesRankingReportDto);
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
                    fontSize: 9,
                    alignment: 'center'
                },
                particularHeader: {
                    fontSize: 10,
                    bold: true,
                    alignment: 'center'
                },
                particularHeader136: {
                    marginTop: 1,
                    fontSize: 9,
                    bold: true,
                    alignment: 'center'
                },
                cellAmount: {
                    fontSize: 9,
                    alignment: 'right'
                },
                footerCell: {
                    fontSize: 9,
                    alignment: 'center',
                    bold: true,
                    fillColor: '#F2F2F2'
                },
                footerText: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'right',
                    fillColor: '#F2F2F2'
                },
                footerAmount: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'right',
                    fillColor: '#F2F2F2'
                }
            }

        };

        if (download) this.pdfMake.createPdf(dd).download('Monthly Sales Report.pdf');
        else this.pdfMake.createPdf(dd).open();
        this.hideLoading();
    }

    private getContent(data: MonthlySalesRankingReportDto[], logo: any) {
        const totalRows = data.length;

        const totalValues = data.reduce((accumulator, item) => {
            accumulator.medicalOxygen9_8Qty += item.medicalOxygen9_8Qty;
            accumulator.medicalOxygen1_36Qty += item.medicalOxygen1_36Qty;
            accumulator.medicalAir9_8Qty += item.medicalAir9_8Qty;
            accumulator.medicalAir7Qty += item.medicalAir7Qty;
            accumulator.nitros30KgQty += item.nitros30KgQty;
            accumulator.nitros5KgQty += item.nitros5KgQty;
            accumulator.nitros3KgQty += item.nitros3KgQty;
            accumulator.amount += item.amount ?? 0;
            accumulator.revenue += item.revenue ?? 0;
            return accumulator;
        }, { medicalOxygen9_8Qty: 0, medicalOxygen1_36Qty: 0, medicalAir9_8Qty: 0, medicalAir7Qty: 0, nitros30KgQty: 0, nitros5KgQty: 0, nitros3KgQty: 0, amount: 0, revenue: 0 });

        let hasNextpage = false;
        const metaData: MonthlySalesRankingReportDto[][] = [];
        let slicedData: MonthlySalesRankingReportDto[] = [];
        if (totalRows > 42) {
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
        const selectedMonth = this.months.find(f => f.value == this.monthId.toString()).displayText;
        const selectedYear = this.years.find(f => f.value == this.yearId.toString()).displayText;

        if (!hasNextpage) {
            return [
                Utils.getReportHeaders(logo),
                {
                    table: {
                        widths: ['*'], // Two columns, equal width
                        body: [
                            [{ text: `MONTHLY SALES (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                        widths: [15, '*', 25, 21, 24, 24, 24, 24, 21, 55, 55],
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
                                    [{ text: `MONTHLY SALES RANKING (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [15, '*', 25, 21, 24, 24, 24, 24, 21, 55, 55],
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
                                    [{ text: `MONTHLY SALES RANKING (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [10, '*', 25, 21, 24, 24, 24, 24, 21, 55, 55],
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
                                    [{ text: `MONTHLY SALES RANKING (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [15, '*', 25, 21, 24, 24, 24, 24, 21, 55, 55],
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
                                    [{ text: `MONTHLY SALES RANKING (${selectedMonth}-${selectedYear})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [15, '*', 25, 21, 24, 24, 24, 24, 21, 55, 55],
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

    private getData(data: MonthlySalesRankingReportDto[], showTotal: boolean, totalValues?: any) {
        const body = [
            [{ text: '#', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Client', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Revenue', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }] as any,
            [{ text: '' }, { text: '' }, { text: 'MO', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'NO', colSpan: 3, style: ['subHeader'] }, { text: '' }, { text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '' }, { text: '9.80', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader136'] }, { text: '9.80', style: ['particularHeader'] }, { text: '7.00', style: ['particularHeader'] }, { text: '30kg', style: ['particularHeader'] }, { text: '5kg', style: ['particularHeader'] }, { text: '3kg', style: ['particularHeader'] }, { text: '' }, { text: '' }],
        ];
        data.forEach(item => {
            body.push(
                [
                    { text: item.rank, style: ['cell_style'] },
                    { text: item.customerName, fontSize: 9 },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style'] },
                    { text: item.medicalAir7Qty, style: ['cell_style'] },
                    { text: item.nitros30KgQty, style: ['cell_style'] },
                    { text: item.nitros5KgQty, style: ['cell_style'] },
                    { text: item.nitros3KgQty, style: ['cell_style'] },
                    { text: !item.amount ? 0 + "/-" : `${Utils.thousandsSeparator(item.amount)}/-`, style: ['cellAmount'] },
                    { text: !item.revenue ? 0 + "/-" : `${Utils.thousandsSeparator(item.revenue)}/-`, style: ['cellAmount'] }
                ]
            );
        });

        if (showTotal) {
            body.push(
                [
                    { text: "Total", style: ['footerText'], colSpan: 2 },
                    { text: '' },
                    { text: totalValues.medicalOxygen9_8Qty, style: ['footerCell'] },
                    { text: totalValues.medicalOxygen1_36Qty, style: ['footerCell'] },
                    { text: totalValues.medicalAir9_8Qty, style: ['footerCell'] },
                    { text: totalValues.medicalAir7Qty, style: ['footerCell'] },
                    { text: totalValues.nitros30KgQty, style: ['footerCell'] },
                    { text: totalValues.nitros5KgQty, style: ['footerCell'] },
                    { text: totalValues.nitros3KgQty, style: ['footerCell'] },
                    { text: Utils.thousandsSeparator(totalValues.amount) + "/-", style: ['footerAmount'], bold: true },
                    { text: Utils.thousandsSeparator(totalValues.revenue) + "/-", style: ['footerAmount'], bold: true }
                ]
            );
        }

        return body;

    }

    private getTotal(totalValues?: any) {
        const body = [
            [{ text: '#', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Client', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Revenue', rowSpan: 3, style: ['headerStyle'], marginTop: 18 }] as any,
            [{ text: '' }, { text: '' }, { text: 'MO', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['subHeader'] }, { text: '' }, { text: 'NO', colSpan: 3, style: ['subHeader'] }, { text: '' }, { text: '' }, { text: '' }],
            [{ text: '' }, { text: '' }, { text: '9.80', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader136'] }, { text: '9.80', style: ['particularHeader'] }, { text: '7.00', style: ['particularHeader'] }, { text: '30kg', style: ['particularHeader'] }, { text: '5kg', style: ['particularHeader'] }, { text: '3kg', style: ['particularHeader'] }, { text: '' }],
        ];
        body.push([
            { text: "Total", style: ['footerText'], colSpan: 2 },
            { text: '' },
            { text: totalValues.medicalOxygen9_8Qty, style: ['footerCell'] },
            { text: totalValues.medicalOxygen1_36Qty, style: ['footerCell'] },
            { text: totalValues.medicalAir9_8Qty, style: ['footerCell'] },
            { text: totalValues.medicalAir7Qty, style: ['footerCell'] },
            { text: totalValues.nitros30KgQty, style: ['footerCell'] },
            { text: totalValues.nitros5KgQty, style: ['footerCell'] },
            { text: totalValues.nitros3KgQty, style: ['footerCell'] },
            { text: Utils.thousandsSeparator(totalValues.revenue) + "/-", style: ['footerAmount'], bold: true }
        ]);
        return body;
    }
}
