import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { ComboboxItemDto, CustomerDueDetailsDto, CustomerDueReportDto, CustomerServiceProxy, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";

@Component({
    selector: 'app-customer-due-report',
    standalone: false,
    templateUrl: './customer-due-report.component.html',
    animations: [appModuleAnimation()],
    styles: [
        `
     :host ::ng-deep .p-inputtext {
        min-width: 110px !important;
      }
    `
    ]
})
export class CustomerDueReportComponent extends PagedListingComponentBase<CustomerDueDetailsDto> implements OnInit {
    @ViewChild('dataTable', { static: true }) dataTable: Table;

    pdfMake: any;
    data: CustomerDueReportDto;
    endDate = new Date();
    startDate = (moment().subtract(31, 'days')).toDate();
    loading: boolean = true;
    customerId: string = "";
    customerName: string = "";
    customers: ComboboxItemDto[] = [];
    invalidParam: boolean = true;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private _salesService: SalesServiceProxy,
        private readonly _customerService: CustomerServiceProxy,
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
        this._customerService.getCustomersSelectList().subscribe(res => {
            this.customers = res;
            this.cd.detectChanges();
        });
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
        if (this.customerId) {
            this.showLoading();
            this._salesService.getCustomerDueReport(parseInt(this.customerId), moment(this.startDate), moment(this.endDate))
                .pipe(finalize(() => {
                    this.hideLoading();
                }))
                .subscribe((result) => {
                    this.data = result;
                    this.primengTableHelper.records = result.details;
                    this.primengTableHelper.totalRecordsCount = result.details.length;
                    this.cd.detectChanges();
                });
        }
    }

    delete() { }

    onCustomerChanged() {
        if (this.customerId) {
            this.customerName = this.customers.find(f => f.value == this.customerId).displayText;
            this.invalidParam = false;
        } else {
            this.invalidParam = true;
            this.customerName = "";
        }
    }

    async print() {
        this.showLoading();
        const data = await firstValueFrom(this._salesService.getCustomerDueReport(parseInt(this.customerId), moment(this.startDate), moment(this.endDate)));
        if (!data || !data.details || data.details.length == 0) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }
        // let count = data.details.length + 1;
        // for (let i = count; i < 123 + count; i++) {
        //     data.details.push({ invoiceNo: i.toString(), totalDue: 0, balance: 0 } as CustomerDueDetailsDto);
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
                cell_style: {
                    fontSize: 9,
                    alignment: 'center'
                },
                footerParticular: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'center'
                },
                particularHeader: {
                    bold: true,
                    fontSize: 11,
                    alignment: 'center'
                },
                cellAmount: {
                    fontSize: 9,
                    alignment: 'right'
                }
            }
        };
        this.hideLoading();
        // pdfMake.createPdf(dd).download('Customerledge.pdf');
        this.pdfMake.createPdf(dd).open();
        // //pdfMake.createPdf(docDefinition).print();
    }

    private getContent(data: CustomerDueReportDto, logo: any) {
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
            overallDue: data.overallDue,
            overallBalance: data.overallBalance,
            actualDue: data.actualDue,
            initialDue: data.initialDue
        };

        let hasNextpage = false;
        const metaData: CustomerDueDetailsDto[][] = [];
        let slicedData: CustomerDueDetailsDto[] = [];
        if (totalRows > 40) {
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
                            [{ text: `DUE BILLS of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                        widths: [60, '*', '*', '*', '*', '*', '*', '*', 55, 55, 55],
                        body: this.getData(details, true, totalValues)
                    }
                }
            ];
        } else {
            const content = [];
            metaData.forEach((items, index) => {
                const lastItem = metaData.length === index + 1;

                if (lastItem && items.length <= 39) {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DUE BILLS of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [60, '*', '*', '*', '*', '*', '*', '*', 55, 55, 55],
                                body: this.getData(items, true, totalValues)
                            }
                        },
                        { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 }
                    );
                } else if (lastItem && items.length > 39) {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DUE BILLS of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [60, '*', '*', '*', '*', '*', '*', '*', 55, 55, 55],
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
                                    [{ text: `DUE BILLS of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [60, '*', '*', '*', '*', '*', '*', '*', 55, 55, 55],
                                body: this.getTotal(totalValues)
                            }
                        },
                        { text: `Page: ${index + 2}`, fontSize: 7, alignment: 'right', marginTop: 3 },
                    );
                } else {
                    content.push(
                        Utils.getReportHeaders(logo),
                        {
                            table: {
                                widths: ['*'],
                                body: [
                                    [{ text: `DUE BILLS of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                                widths: [60, '*', '*', '*', '*', '*', '*', '*', 55, 55, 55],
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

    private getTotal(totalValues?: any) {
        const body = [
            [{ text: 'Date', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Balance', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }] as any,
            [{ text: '' }, { text: 'MO', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'NO', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '', colSpan: 3 }, { text: '', style: ['headerStyle'] }, { text: '' }],
            [{ text: '' }, { text: '9.80', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader'] }, { text: '9.80', style: ['particularHeader'] }, { text: '7.00', style: ['particularHeader'] }, { text: '30kg', style: ['particularHeader'] }, { text: '5kg', style: ['particularHeader'] }, { text: '3kg', style: ['particularHeader'] }, { text: '', colSpan: 3 }, { text: '' }, { text: '' }],
        ];
        body.push([
            { text: 'Total', bold: true, alignment: 'right' },
            { text: totalValues.medicalOxygen9_8TotalQty, style: ['footerParticular'] },
            { text: totalValues.medicalOxygen1_36TotalQty, style: ['footerParticular'] },
            { text: totalValues.medicalAir9_8TotalQty, style: ['footerParticular'] },
            { text: totalValues.medicalAir7TotalQty, style: ['footerParticular'] },
            { text: totalValues.nitros30KgTotalQty, style: ['footerParticular'] },
            { text: totalValues.nitros5KgTotalQty, style: ['footerParticular'] },
            { text: totalValues.nitros3KgTotalQty, style: ['footerParticular'] },
            { text: '' },
            { text: `${Utils.thousandsSeparator(totalValues.overallDue)}/-`, style: ['cellAmount'], bold: true },
            { text: '' }
        ]);
        body.push([
            { text: 'Actual Due', bold: true, alignment: 'right', fontSize: 9 },
            { text: `${totalValues.initialDue ? 'Initial Due: ' + Utils.thousandsSeparator(totalValues.initialDue) + '/-' : ''}`, colSpan: 8, style: ['cellAmount'] }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' },
            { text: `${Utils.thousandsSeparator(totalValues.actualDue)}/-`, style: ['cellAmount'], bold: true },
            { text: '' }
        ]);
        return body;
    }

    private getData(data: CustomerDueDetailsDto[], showTotal: boolean, totalValues?: any) {
        const body = [
            [{ text: 'Date', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Particular', colSpan: 7, style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: '', style: ['headerStyle'] }, { text: 'Bill No.', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Amount', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }, { text: 'Balance', rowSpan: 3, style: ['headerStyle'], marginTop: 20 }] as any,
            [{ text: '' }, { text: 'MO', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'MCA', colSpan: 2, style: ['headerStyle'] }, { text: '' }, { text: 'NO', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '', colSpan: 3 }, { text: '', style: ['headerStyle'] }, { text: '' }],
            [{ text: '' }, { text: '9.80', style: ['particularHeader'] }, { text: '1.36', style: ['particularHeader'] }, { text: '9.80', style: ['particularHeader'] }, { text: '7.00', style: ['particularHeader'] }, { text: '30kg', style: ['particularHeader'] }, { text: '5kg', style: ['particularHeader'] }, { text: '3kg', style: ['particularHeader'] }, { text: '', colSpan: 3 }, { text: '' }, { text: '' }],
        ];
        data.forEach(item => {
            body.push(
                [
                    { text: moment(item.date).format('D-MMM-YY').toString(), style: ['cell_style'] },
                    { text: item.medicalOxygen9_8Qty, style: ['cell_style'] },
                    { text: item.medicalOxygen1_36Qty, style: ['cell_style'] },
                    { text: item.medicalAir9_8Qty, style: ['cell_style'] },
                    { text: item.medicalAir7Qty, style: ['cell_style'] },
                    { text: item.nitros30KgQty, style: ['cell_style'] },
                    { text: item.nitros5KgQty, style: ['cell_style'] },
                    { text: item.nitros3KgQty, style: ['cell_style'] },
                    { text: item.invoiceNo, style: ['cell_style'] },
                    { text: `${Utils.thousandsSeparator(item.totalDue)}/-`, style: ['cellAmount'] },
                    { text: `${Utils.thousandsSeparator(item.balance)}/-`, style: ['cellAmount'] }
                ]
            );
        });
        if (showTotal) {
            body.push([
                { text: 'Total', bold: true, alignment: 'right', fontSize: 9 },
                { text: totalValues.medicalOxygen9_8TotalQty, style: ['footerParticular'] },
                { text: totalValues.medicalOxygen1_36TotalQty, style: ['footerParticular'] },
                { text: totalValues.medicalAir9_8TotalQty, style: ['footerParticular'] },
                { text: totalValues.medicalAir7TotalQty, style: ['footerParticular'] },
                { text: totalValues.nitros30KgTotalQty, style: ['footerParticular'] },
                { text: totalValues.nitros5KgTotalQty, style: ['footerParticular'] },
                { text: totalValues.nitros3KgTotalQty, style: ['footerParticular'] },
                { text: '' },
                { text: `${Utils.thousandsSeparator(totalValues.overallDue)}/-`, style: ['cellAmount'], bold: true },
                { text: '' }
            ]);
            body.push([
                { text: 'Actual Due', bold: true, alignment: 'right', fontSize: 9 },
                { text: `${totalValues.initialDue ? 'Initial Due: ' + Utils.thousandsSeparator(totalValues.initialDue) + '/-' : ''}`, colSpan: 8, style: ['cellAmount'] }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' }, { text: '' },
                { text: `${Utils.thousandsSeparator(totalValues.actualDue)}/-`, style: ['cellAmount'], bold: true },
                { text: '' }
            ]);
        }

        return body;
    }
}
