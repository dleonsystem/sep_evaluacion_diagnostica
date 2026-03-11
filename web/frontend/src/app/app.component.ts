import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavComponent } from './shared/nav/nav.component';
import { SessionTimerService } from './services/session-timer.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'frontend';

  constructor(private readonly sessionTimer: SessionTimerService) {}

  ngOnInit() {
    this.sessionTimer.startMonitoring();
  }
}
