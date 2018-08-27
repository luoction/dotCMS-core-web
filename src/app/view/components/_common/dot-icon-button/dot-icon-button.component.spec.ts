import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { DotIconModule } from '../dot-icon/dot-icon.module';
import { DOTTestBed } from '../../../../test/dot-test-bed';
import { DotIconButtonComponent } from './dot-icon-button.component';
import { By } from '@angular/platform-browser';
import createSpy = jasmine.createSpy;

describe('DotIconButtonComponent', () => {
    let comp: DotIconButtonComponent;
    let fixture: ComponentFixture<DotIconButtonComponent>;
    let de: DebugElement;

    beforeEach(() => {
        DOTTestBed.configureTestingModule({
            declarations: [DotIconButtonComponent],
            imports: [DotIconModule]
        });

        fixture = TestBed.createComponent(DotIconButtonComponent);
        de = fixture.debugElement;
        comp = fixture.componentInstance;
    });

    it('should render component with dot-icon component and css classes', () => {
        comp.icon = 'test';
        fixture.detectChanges();

        const icon = fixture.debugElement.query(By.css('dot-icon'));
        expect(icon.componentInstance.name).toBe('test');
    });

    it('should call buttonOnClick on button click', () => {
        spyOn(comp, 'buttonOnClick').and.callThrough();
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button'));
        button.nativeElement.click();

        expect(comp.buttonOnClick).toHaveBeenCalled();
    });

    it('should stop propagation if disabled', () => {
        comp.disabled = true;
        comp.icon = 'test';
        const event = {
            stopPropagation: jasmine.createSpy('stopPropagation')
        }

        comp.buttonOnClick(event);
        expect(event.stopPropagation).toHaveBeenCalled();
    });
});