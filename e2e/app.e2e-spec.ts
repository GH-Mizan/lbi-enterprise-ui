import { LbITemplatePage } from './app.po';

describe('LbI App', function () {
    let page: LbITemplatePage;

    beforeEach(() => {
        page = new LbITemplatePage();
    });

    it('should display message saying app works', () => {
        page.navigateTo();
        expect(page.getParagraphText()).toEqual('app works!');
    });
});
