import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketDetalleComponent } from './ticket-detalle.component';

describe('TicketDetalleComponent', () => {
  let component: TicketDetalleComponent;
  let fixture: ComponentFixture<TicketDetalleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketDetalleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketDetalleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
