import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AfterViewInit, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, pairwise, throttleTime } from 'rxjs/operators';
import { timer } from 'rxjs';
import { DialogComponent } from './dialog/dialog.component';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('scroller') scroller!: CdkVirtualScrollViewport;

  loading: boolean = false;
  userData: any;
  userCounter: number = 20;

  constructor(
    private dialog: MatDialog,
    private api: ApiService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.getAllUsers();
  }

  ngAfterViewInit(): void {
    this.scroller.elementScrolled().pipe(
      map(() => this.scroller.measureScrollOffset('bottom')),
      pairwise(),
      filter(([y1, y2]) => (y2 < y1 && y2 < 80)),
      throttleTime(500)
    ).subscribe(() => {
      this.ngZone.run(() => {
        this.getMoreUsers();
      });
    });
  }

  openDialog() {
    this.dialog.open(DialogComponent, {
      panelClass: ['dialog-responsive']
    }).afterClosed().subscribe(value => {
      if (value === 'save') {
        this.getAllUsers();
      }
    });
  }

  getAllUsers() {
    this.api.getUser()
      .subscribe({
        next: (res) => {
          this.userData = res.slice(0, this.userCounter);
        },
        error: () => {
          alert('Что-то пошло не так!');
        }
      });
  }

  getMoreUsers() {
    this.loading = true;

    timer(1000).subscribe(() => {
      this.loading = false;

      this.api.getUser()
      .subscribe({
        next: (res) => {
          this.userData = this.userData.concat(res.slice(this.userCounter, this.userCounter + 20));
          this.userCounter = this.userData.length;
        },
        error: () => {
          alert('Что-то пошло не так!');
        }
      });
    });
  }

  editUser(user: any) {
    this.dialog.open(DialogComponent, {
      panelClass: ['dialog-responsive'],
      data: user
    }).afterClosed().subscribe(value => {
      if (value === 'update') {
        this.getAllUsers();
      }
    });
  }

  deleteUser(id: number) {
    this.api.deleteUser(id)
      .subscribe({
        next: (res) => {
          alert('Пользователь успешно удалён!');
          this.getAllUsers();
        },
        error: () => {
          alert('Что-то пошло не так!');
        }
      });
  }
}
