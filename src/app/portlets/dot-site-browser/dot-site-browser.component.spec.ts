import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DotSiteBrowserComponent } from './dot-site-browser.component';

describe('DotSiteBrowserComponent', () => {
    let component: DotSiteBrowserComponent;
    let fixture: ComponentFixture<DotSiteBrowserComponent>;

    beforeEach(
        async(() => {
            TestBed.configureTestingModule({
                declarations: [DotSiteBrowserComponent]
            });
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(DotSiteBrowserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
