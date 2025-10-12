import { ComboboxItemDto } from "@shared/service-proxies/service-proxies";

export class Utils {
    /**
     * The URL requested, before initial routing.
     */
    static thousandsSeparator(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    static inWords(num: number) {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

        if ((num.toString()).length > 9) return 'overflow';
        const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/) as any;
        if (!n) return; var str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'only ' : '';
        return str;
    }

    static capitalizeFirstLetter(value: string) {
        if (typeof value !== 'string' || !value) {
            return value; // Return original value if not a string or empty/null/undefined
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    static getMonths() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const months: ComboboxItemDto[] = [];
        monthNames.forEach((m, index) => {
            months.push({ value: (index + 1).toString(), displayText: m } as ComboboxItemDto);
        });
        return months;
    }

    static getYears(currentYear: number) {
        const years: ComboboxItemDto[] = [];
        for (let i = currentYear - 5; i <= currentYear; i++) {
            years.push({ value: i.toString(), displayText: i.toString() } as ComboboxItemDto);
        }
        return years;
    }

    static async getImageDataUrl(imgUrl) {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    static getReportHeaders(logo: any) {
        const header = {
            layout: "noBorders",
            table: {
                widths: [65, '*'],
                body: [
                    [
                        {
                            image: logo,
                            rowSpan: 3,
                            width: 60,
                            height: 60,
                            alignment: 'center'
                        },
                        { text: 'LBI Enterprise', bold: true, font: 'LucidaGrande', fontSize: 18, marginTop: 5 },
                    ],
                    [{ text: '' }, { text: '3/2 Ishwar Chandraghosh Street, Babu Bazar, Dhaka-1100', fontSize: 10 }],
                    [{ text: '' }, { text: 'Contact: 01912776389, 01401212419    E-mail: lbienterprise6@gmail.com', fontSize: 10 }]
                ]
            }
        };
        return header;
    }

    static nextLetter(s) {
        return s.replace(/([a-zA-Z])[^a-zA-Z]*$/, function (a) {
            var c = a.charCodeAt(0);
            switch (c) {
                case 90: return 'A';
                case 122: return 'a';
                default: return String.fromCharCode(++c);
            }
        });
    }
}
