import { ChangeDetectorRef, Component, Injector, OnInit, ViewChild } from '@angular/core';
import { PagedListingComponentBase } from '@shared/paged-listing-component-base';
import { ComboboxItemDto, SalesCollectionDueDetailsDto, SalesCollectionDueReportDto, SalesServiceProxy } from '@shared/service-proxies/service-proxies';
import { Table } from 'primeng/table';
import { LazyLoadEvent } from "primeng/api";
import { finalize } from "rxjs/operators";
import moment from 'moment';
import { appModuleAnimation } from '@shared/animations/routerTransition';

import { firstValueFrom } from 'rxjs';
import { Utils } from '@shared/helpers/Utils';

@Component({
  selector: 'app-sales-collection-due-report',
  standalone: false,
  templateUrl: './sales-collection-due.component.html',
  animations: [appModuleAnimation()]
})

export class SalesColllectionDueReportComponent extends PagedListingComponentBase<SalesCollectionDueReportDto> implements OnInit {
  @ViewChild('dataTable', { static: true }) dataTable: Table;

  pdfMake: any;
  monthId: number;
  yearId: number;
  months: ComboboxItemDto[] = [];
  years: ComboboxItemDto[] = [];
  dueBalance: number;
  prevBalance: number;
  lastDate = null;

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
    this._salesService.getSalesCollectionDueReport(this.monthId, this.yearId).pipe(
      finalize(() => {
        this.hideLoading();
      })
    )
      .subscribe((result) => {
        const items = result.details;
        this.primengTableHelper.records = items;
        this.primengTableHelper.totalRecordsCount = items.length;
        this.dueBalance = result.dueBalance;
        this.prevBalance = result.prevBalance;
        this.lastDate = result.lastDate;
        this.cd.detectChanges();
      });
  }

  delete() { }

  async print(download?: boolean) {
    this.showLoading();
    const data = await firstValueFrom(this._salesService.getSalesCollectionDueReport(this.monthId, this.yearId));
    const items = data.details;
    if (!items || items.length == 0) {
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
              [{ text: 'SALE, COLLECTION & DUE', bold: true, fontSize: 13, alignment: 'center', borderColor: ['grey', 'grey', 'grey', 'grey'], fillColor: 'lightgrey' }],
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
            widths: [46, '*', '*', '*', 39, '*', '*', '*', '*', '*'],
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
        cell_style: {
          fontSize: 10,
          alignment: 'right'
        },
        subHeader: {
          fontSize: 10,
          alignment: 'center'
        }
      }

    };

    if (download) this.pdfMake.createPdf(dd).download('SalesCollectionDue.pdf');
    else this.pdfMake.createPdf(dd).open();
    this.hideLoading();
  }

  private getData(data: SalesCollectionDueReportDto) {
    const body = [
      [{ text: 'Date', style: ['headerStyle'], rowSpan: 2, marginTop: 11 }, { text: "Sale", style: ['headerStyle'], colSpan: 2 }, { text: '' }, { text: 'Collection', style: ['headerStyle'], colSpan: 4 }, { text: '' }, { text: '' }, { text: '' }, { text: 'Due', style: ['headerStyle'], colSpan: 3 }, { text: '' }, { text: '' }] as any,
      [{ text: '' }, { text: 'Today', style: ['subHeader'] }, { text: "Balance", style: ['subHeader'] }, { text: "Cash", style: ['subHeader'] }, { text: 'Due', style: ['subHeader'] }, { text: "Total", style: ['subHeader'] }, { text: "Balance", style: ['subHeader'] }, { text: 'Today', style: ['subHeader'] }, { text: "Collection", style: ['subHeader'] }, { text: "Balance", style: ['subHeader'] }]
    ];

    data.details.forEach(item => {
      body.push(
        [{ text: moment(item.date).format('DD-MMM-YY').toString(), style: ['subHeader'] },
        { text: Utils.thousandsSeparator(item.totalSales, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.currentBalance, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.cashCollection, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.dueCollection, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.totalCollection, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.collectedBalance, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.currenctDue, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.detuctedDue, true), style: ['cell_style'] },
        { text: Utils.thousandsSeparator(item.dueBalance, true), style: ['cell_style'] }]
      );
    });

    body.push(
        [{ text: `Previous Due (${moment(data.lastDate).format('DD-MMM-YY').toString()}): ${Utils.thousandsSeparator(data.prevBalance)}`, colSpan: 5, style: ['cell_style'], bold: true },
        { text: '' }, { text: '' }, { text: '' }, { text: '' }, 
        { text: `Total Due : ${Utils.thousandsSeparator(data.prevBalance + data.dueBalance)}`, colSpan: 5, style: ['cell_style'], bold: true },
        { text: '' }, { text: '' }, { text: '' }, { text: '' }]
      );

    return body;
  }

}
