import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ComboboxItemDto, CustomerServiceProxy, PlantWarehouseSelectListDto, SupplierServiceProxy, VirtualStockEntryDto, VirtualStockEntryInput, VirtualStockOutputDto, VirtualStocksServiceProxy, VirtualStockType } from '@shared/service-proxies/service-proxies';
import { VirtualStockEntryComponent } from './virtual-stocks-entry/virtual-stock-entry.component';
import moment from 'moment';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { LazyLoadEvent } from "primeng/api";
import { debounceTime, distinctUntilChanged, finalize, map } from "rxjs/operators";
import { firstValueFrom, Observable } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-virtual-stocks',
  standalone: false,
  templateUrl: './virtual-stocks.component.html',
  animations: [appModuleAnimation()],
})
export class VirtualStocksComponent extends PagedListingComponentBase<VirtualStockOutputDto> implements OnInit {
  pdfMake: any;
  endDate = new Date();
  startDate = (moment().subtract(31, 'days')).toDate();
  maxDate = this.endDate;

  customerId: string = "";
  warehouseName: string = "";
  customers: ComboboxItemDto[];
  plantWarehouseId: number;
  suppliers: PlantWarehouseSelectListDto[];
  invalidParam: boolean = true;
  isClient: boolean;
  warehouseObj: any;

  constructor(
    injector: Injector,
    cd: ChangeDetectorRef,
    private readonly _modalService: BsModalService,
    private readonly _customerService: CustomerServiceProxy,
    private readonly _supplierService: SupplierServiceProxy,
    private readonly _virtualStocksService: VirtualStocksServiceProxy,
    private readonly _activatedRoute: ActivatedRoute,
  ) {
    super(injector, cd);
  }

  async ngOnInit() {
    this.isClient = this._activatedRoute.snapshot.routeConfig.path === 'client';
    if (this.isClient) {
      this._customerService.getCustomersSelectList().subscribe(res => {
        this.customers = res;
        this.cd.detectChanges();
      });
    } else {
      this._virtualStocksService.getPlantWarehouse().subscribe(res => {
        this.suppliers = res;
        this.cd.detectChanges();
      });
    }
    this.pdfMake = await this.loadAndPrintPDF();
  }

  search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term === '' ? [] : this.customers.filter(v => v.displayText.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );


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

  startDateChanged() {
    this.endDate = new Date(this.startDate);
    this.endDate.setDate(this.endDate.getDate() + 31);
    this.maxDate = this.endDate;
    this.cd.detectChanges();
  }

  list(event?: LazyLoadEvent): void {
    if (this.customerId || this.plantWarehouseId) {
      this.showLoading();

      let warehouseId: number;
      let stockType: VirtualStockType;
      if (this.isClient) {
        warehouseId = parseInt(this.customerId);
        stockType = VirtualStockType._1;
      } else {
        const plantWarehouse = this.suppliers.find(f => f.uid == this.plantWarehouseId);
        warehouseId = plantWarehouse.id;
        stockType = plantWarehouse.virtualStockType;

        //warehouseId = parseInt(this.supplierId);
        //stockType = VirtualStockType._2;
      }

      this._virtualStocksService.getVirtualStocks(warehouseId, moment(this.startDate), moment(this.endDate), stockType)
        .pipe(finalize(() => {
          this.hideLoading();
        }))
        .subscribe((result) => {
          this.primengTableHelper.records = result;
          this.primengTableHelper.totalRecordsCount = result.length;
          this.cd.detectChanges();
        });
    }
  }

  delete(stock: VirtualStockOutputDto) {
    abp.message.confirm(`This inventory will be deleted`,
      undefined,
      (result: boolean) => {
        if (result) {
          this.showLoading();
          this._virtualStocksService.virtualStockRemove(stock.id, stock.virtualStockType).subscribe(() => {
            abp.notify.success(this.l("SuccessfullyDeleted"));
            this.refresh();
          });
        }
      }
    );
  }

  onCustomerChanged() {
    this.customerId = this.warehouseObj.value;
    if (this.customerId) {
      this.warehouseName = this.customers.find(f => f.value == this.customerId).displayText;
      this.invalidParam = false;
    } else {
      this.invalidParam = true;
      this.warehouseName = "";
    }
  }

  onSupplierChanged() {
    if (this.plantWarehouseId) {
      const plantWarehouse = this.suppliers.find(f => f.uid == this.plantWarehouseId);
      this.warehouseName = plantWarehouse.displayText;
      this.invalidParam = false;
    } else {
      this.invalidParam = true;
      this.warehouseName = "";
    }
  }

  create() {
    const model = {
      stock: new VirtualStockEntryDto(),
      stockDetails: []
    } as VirtualStockEntryInput;
    this.showEntryDialog(model);
  }

  private showEntryDialog(model: VirtualStockEntryInput): void {
    if (this.isClient)
      model.stock.virtualStockType = VirtualStockType._1;
    else
      model.stock.virtualStockType = VirtualStockType._2;

    let entryDialog: BsModalRef;
    entryDialog = this._modalService.show(
      VirtualStockEntryComponent,
      {
        class: "modal-xl",
        initialState: {
          model: model,
        },
      }
    );
    entryDialog.content.onSave.subscribe(() => {
      this.refresh();
    });
  }

  async print() {
    this.showLoading();
    let warehouseId: number;
    let stockType: VirtualStockType;
    if (this.isClient) {
      warehouseId = parseInt(this.customerId);
      stockType = VirtualStockType._1;
    } else {
      const plantWarehouse = this.suppliers.find(f => f.uid == this.plantWarehouseId);
      warehouseId = plantWarehouse.id;
      stockType = plantWarehouse.virtualStockType;
      // warehouseId = parseInt(this.supplierId);
      // stockType = VirtualStockType._2;
    }
    const items = await firstValueFrom(this._virtualStocksService.getVirtualStocks(warehouseId, moment(this.startDate), moment(this.endDate), stockType));
    if (!items || items.length == 0) {
      abp.message.info("No record(s) found", "Sorry!");
      this.hideLoading();
      return;
    }

    // let count = items.length + 1;
    // for (let i = count; i < 120 + count; i++) {
    //   items.push({} as VirtualStockOutputDto);
    // }

    const logo = await Utils.getImageDataUrl('assets/img/logo.png');
    var dd = {
      pageSize: 'A4',
      pageMargins: [30, 20, 30, 20],
      content: this.getContent(items, logo),
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
        subHeader: {
          bold: true,
          fontSize: 10,
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

  private getContent(data: VirtualStockOutputDto[], logo: any) {
    const totalRows = data.length;

    let hasNextpage = false;
    const metaData: VirtualStockOutputDto[][] = [];
    let slicedData: VirtualStockOutputDto[] = [];
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

    if (!hasNextpage) {
      return [
        Utils.getReportHeaders(logo),
        {
          table: {
            widths: ['*'],
            body: [
              [{ text: `INVENTORIES of ${this.warehouseName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
            widths: [50, '*', 21, 21, 24, 21, 21, 24, 21, 21, 24, 21, 21, 24],
            body: this.getData(data)
          }
        }
      ];
    } else {
      const content = [];
      metaData.forEach((items, index) => {
        const lastItem = metaData.length === index + 1;
        if (!lastItem) {
          content.push(
            Utils.getReportHeaders(logo),
            {
              table: {
                widths: ['*'],
                body: [
                  [{ text: `INVENTORIES of ${this.warehouseName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                widths: [50, '*', 21, 21, 24, 21, 21, 24, 21, 21, 24, 21, 21, 24],
                body: this.getData(items)
              }
            },
            { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
            { text: '', pageBreak: 'after' }
          );
        } else {
          content.push(
            Utils.getReportHeaders(logo),
            {
              table: {
                widths: ['*'],
                body: [
                  [{ text: `INVENTORIES of ${this.warehouseName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
                widths: [50, '*', 21, 21, 24, 21, 21, 24, 21, 21, 24, 21, 21, 24],
                body: this.getData(items)
              }
            },
            { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 }
          );
        }
        // const lastItem = metaData.length === index + 1;

        // if (lastItem && items.length <= 41) {
        //   content.push(
        //     Utils.getReportHeaders(logo),
        //     {
        //       table: {
        //         widths: ['*'],
        //         body: [
        //           [{ text: `LEDGER of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
        //         ]
        //       }
        //     },
        //     { text: ' ', fontSize: 5 },
        //     {
        //       layout: {
        //         hLineColor: () => 'lightgrey',
        //         vLineColor: () => 'lightgrey',
        //         hLineWidth: () => 1,
        //         vLineWidth: () => 1,
        //       },
        //       table: {
        //         widths: [60, '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
        //         body: this.getData(items)
        //       }
        //     },
        //     { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 }
        //   );
        // } else if (lastItem && items.length > 41) {
        //   content.push(
        //     Utils.getReportHeaders(logo),
        //     {
        //       table: {
        //         widths: ['*'],
        //         body: [
        //           [{ text: `LEDGER of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
        //         ]
        //       }
        //     },
        //     { text: ' ', fontSize: 5 },
        //     {
        //       layout: {
        //         hLineColor: () => 'lightgrey',
        //         vLineColor: () => 'lightgrey',
        //         hLineWidth: () => 1,
        //         vLineWidth: () => 1,
        //       },
        //       table: {
        //         widths: [60, '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
        //         body: this.getData(items)
        //       }
        //     },
        //     { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
        //     { text: '', pageBreak: 'after' }
        //   );
        // } else {
        //   content.push(
        //     Utils.getReportHeaders(logo),
        //     {
        //       table: {
        //         widths: ['*'],
        //         body: [
        //           [{ text: `LEDGER of ${this.customerName}`, bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
        //         ]
        //       }
        //     },
        //     { text: ' ', fontSize: 5 },
        //     {
        //       layout: {
        //         hLineColor: () => 'lightgrey',
        //         vLineColor: () => 'lightgrey',
        //         hLineWidth: () => 1,
        //         vLineWidth: () => 1,
        //       },
        //       table: {
        //         widths: [50, '*', 21, 21, 24, 21, 21, 24, 21, 21, 24, 21, 21, 24],
        //         body: this.getData(items)
        //       }
        //     },
        //     { text: `Page: ${index + 1}`, fontSize: 7, alignment: 'right', marginTop: 3 },
        //     { text: '', pageBreak: 'after' }
        //   );
        // }
      });
      return content;
    }
  }

  private getData(data: VirtualStockOutputDto[]) {
    const body = [
      [{ text: 'Date', rowSpan: 2, style: ['headerStyle'], marginTop: 10 }, { text: 'Vehicle', rowSpan: 2, style: ['headerStyle'], marginTop: 10 }, { text: '1.36 Oxygen', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: '9.80 Oxygen', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: 'Medical Air', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }, { text: 'Nitrous Oxide', colSpan: 3, style: ['headerStyle'] }, { text: '' }, { text: '' }] as any,
      [{ text: '' }, { text: '' }, { text: 'In', style: ['subHeader'] }, { text: 'Out', style: ['subHeader'] }, { text: 'Stock', style: ['subHeader'] }, { text: 'In', style: ['subHeader'] }, { text: 'Out', style: ['subHeader'] }, { text: 'Stock', style: ['subHeader'] }, { text: 'In', style: ['subHeader'] }, { text: 'Out', style: ['subHeader'] }, { text: 'Stock', style: ['subHeader'] }, { text: 'In', style: ['subHeader'] }, { text: 'Out', style: ['subHeader'] }, { text: 'Stock', style: ['subHeader'] }],
    ];
    data.forEach(item => {
      body.push(
        [
          { text: moment(item.date).format('D-MMM-YY').toString(), style: ['cell_style'] },
          { text: item.stockPoint, style: ['cell_style'] },
          { text: item.oxygen136In, style: ['cell_style'] },
          { text: item.oxygen136Out, style: ['cell_style'] },
          { text: item.oxygen136Stock, style: ['cell_style'] },

          { text: item.oxygen98In, style: ['cell_style'] },
          { text: item.oxygen98Out, style: ['cell_style'] },
          { text: item.oxygen98Stock, style: ['cell_style'] },

          { text: item.medicalAirIn, style: ['cell_style'] },
          { text: item.medicalAirOut, style: ['cell_style'] },
          { text: item.medicalAirStock, style: ['cell_style'] },

          { text: item.nitrousIn, style: ['cell_style'] },
          { text: item.nitrousOut, style: ['cell_style'] },
          { text: item.nitrousStock, style: ['cell_style'] },
        ]
      );
    });

    return body;
  }

}
