import { ChangeDetectorRef, Component, Injector, OnInit } from "@angular/core";
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { PagedListingComponentBase } from "@shared/paged-listing-component-base";
import { SalesOrderCreateUpdateDto, SalesOrderOutputDto, SalesOrderServiceProxy } from "@shared/service-proxies/service-proxies";
import { appModuleAnimation } from "@shared/animations/routerTransition";
import { LazyLoadEvent } from "primeng/api";
import moment from 'moment';
import { debounceTime, distinctUntilChanged, finalize, map } from "rxjs/operators";
import { firstValueFrom, Observable } from 'rxjs';
import { SalesOrderEntryComponent } from "../order-entry/sales-order-entry.component";
import { Utils } from "@shared/helpers/Utils";


@Component({
    selector: 'app-sales-order',
    standalone: false,
    templateUrl: './sales-order.component.html',
    animations: [appModuleAnimation()],
})

export class SalesOrderComponent extends PagedListingComponentBase<SalesOrderOutputDto> implements OnInit {
    pdfMake: any;
    date = new Date();
    totalValues: any;

    constructor(
        injector: Injector,
        cd: ChangeDetectorRef,
        private readonly _modalService: BsModalService,
        private readonly _salesOrderService: SalesOrderServiceProxy
    ) {
        super(injector, cd);
    }

    async ngOnInit() {
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

        this._salesOrderService.getOrders(moment(this.date))
            .pipe(finalize(() => {
                this.hideLoading();
            }))
            .subscribe((result) => {
                this.primengTableHelper.records = result;
                this.primengTableHelper.totalRecordsCount = result.length;
                this.totalValues = result.reduce((accumulator, item) => {
                    accumulator.nitrousQty += item.nitrousQty;
                    accumulator.airQty += item.airQty;
                    accumulator.oxygen136Qty += item.oxygen136Qty;
                    accumulator.oxygen980Qty += item.oxygen980Qty;
                    return accumulator;
                }, { nitrousQty: 0, airQty: 0, oxygen136Qty: 0, oxygen980Qty: 0 });
                this.cd.detectChanges();
            });
    }

    delete(item: SalesOrderOutputDto) {
        abp.message.confirm(`${item.customerName}'s order will be deleted`,
            undefined,
            (result: boolean) => {
                if (result) {
                    this.showLoading();
                    this._salesOrderService.salesOrderRemove(item.id).subscribe(() => {
                        abp.notify.success(this.l("SuccessfullyDeleted"));
                        this.refresh();
                    });
                }
            }
        );
    }

    create() {
        const model = new SalesOrderCreateUpdateDto();
        this.showOrderEntryDialog(model);
    }

    edit(id: number) {
        this._salesOrderService.get(id).subscribe(res => {
            this.showOrderEntryDialog(res);
        });
    }

    private showOrderEntryDialog(order: SalesOrderCreateUpdateDto): void {
        let entryDialog: BsModalRef;
        entryDialog = this._modalService.show(
            SalesOrderEntryComponent,
            {
                class: "modal-lg",
                initialState: {
                    model: order,
                },
            }
        );
        entryDialog.content.onSave.subscribe(() => {
            this.refresh();
        });
    }

    async print(download: boolean) {
        this.showLoading();
        const data = await firstValueFrom(this._salesOrderService.getOrders(moment(this.date)));
        if (!data || data.length == 0) {
            abp.message.info("No record(s) found", "Sorry!");
            this.hideLoading();
            return;
        }

        // let count = data.length + 1;
        // for (let i = count; i < 25 + count; i++) {
        //     data.push({ customerName: i.toString() } as SalesOrderOutputDto);
        // }

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
                            [{ text: `SALES ORDERS (${moment(this.date).format('D-MMM-YY').toString()})`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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

                        fillColor: function (rowIndex: number) {
                            // Apply different background color to even rows (after the header)
                            let fc = null;
                            if (rowIndex > 0 && rowIndex % 2 === 0) {
                                fc = '#EEEEEE'; // Light gray for even rows
                            }

                            if(data.length + 3 == rowIndex || data.length + 2 == rowIndex) {
                                fc = 'white'
                            }

                            return fc; // Default background (transparent) for odd rows and header
                        },
                    },
                    table: {
                        widths: [30, '*', 53, 53, 53, 53],
                        body: this.getData(data)
                    },

                }
            ],
            defaultStyle: {
                font: 'TimesNewRoman'
            },
            styles: {
                headerStyle: {
                    fontSize: 16,
                    bold: true,
                    alignment: 'center'
                },
                subHeader: {
                    fontSize: 16,
                    alignment: 'center'
                },
                cell_style: {
                    fontSize: 16,
                    alignment: 'center'
                },
                footerStyle: {
                    fontSize: 16,
                    bold: true,
                    alignment: 'center'
                },
                textCenter: {
                    alignment: 'center'
                }
            }
        };

        if (download) {
            this.pdfMake.createPdf(dd).download('SalesOrders.pdf');
        } else {
            this.pdfMake.createPdf(dd).open();
        }
        this.hideLoading();
    }

    private getData(data: SalesOrderOutputDto[]) {
        const body = [
            [{ text: '#', rowSpan: 2, style: ['headerStyle'], marginTop: 11 }, { text: 'Client', rowSpan: 2, style: ['headerStyle'], marginTop: 11 }, { text: 'Products', colSpan: 4, style: ['headerStyle'] }, { text: '' }, { text: '', }, { text: '' }] as any,
            [{ text: '' }, { text: '' }, { text: '9.80', style: ['subHeader'] }, { text: 'MCA', style: ['subHeader'] }, { text: '1.36', style: ['subHeader'] }, { text: 'NO', style: ['subHeader'] } ],
        ];
        data.forEach((item, index) => {
            body.push(
                [
                    { text: index + 1, style: ['cell_style'] },
                    { text: item.customerName, style: ['cell_style'], alignment: 'left', noWrap: true, },
                    { text: item.oxygen980Qty, style: ['cell_style'] },
                    { text: item.airQty, style: ['cell_style'] },
                    { text: item.oxygen136Qty, style: ['cell_style'] },
                    { text: item.nitrousQty, style: ['cell_style'] },
                ]
            );
        });

        const totalValues = data.reduce((accumulator, item) => {
            accumulator.nitrousQty += item.nitrousQty;
            accumulator.airQty += item.airQty;
            accumulator.oxygen136Qty += item.oxygen136Qty;
            accumulator.oxygen980Qty += item.oxygen980Qty;
            return accumulator;
        }, { nitrousQty: 0, airQty: 0, oxygen136Qty: 0, oxygen980Qty: 0 });

        body.push([
            { text: 'Total', rowSpan: 2, colSpan: 2, style: ['footerStyle'], marginTop: 11 },
            { text: '' },
            { text: totalValues.oxygen980Qty, style: ['footerStyle'] },
            { text: totalValues.airQty, style: ['footerStyle'] },
            { text: totalValues.oxygen136Qty, style: ['footerStyle'] },
            { text: totalValues.nitrousQty, style: ['footerStyle'] },
        ]);

        body.push([
            { text: '' },
            { text: '' },
            { text: totalValues.nitrousQty + totalValues.airQty + totalValues.oxygen136Qty + totalValues.oxygen980Qty, colSpan: 4, style: ['footerStyle'] },
            { text: '' },
            { text: '' },
            { text: '' },
        ]);

        return body;
    }
}