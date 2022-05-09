import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe-decorator';
import { EUser } from 'picsur-shared/dist/entities/user.entity';
import { HasFailed } from 'picsur-shared/dist/types';
import { BehaviorSubject, Subject } from 'rxjs';
import { SnackBarType } from 'src/app/models/dto/snack-bar-type.dto';
import { StaticInfoService } from 'src/app/services/api/static-info.service';
import { UserAdminService } from 'src/app/services/api/user-manage.service';
import { Logger } from 'src/app/services/logger/logger.service';
import { Throttle } from 'src/app/util/throttle';
import { BootstrapService } from 'src/app/util/util-module/bootstrap.service';
import { UtilService } from 'src/app/util/util-module/util.service';

@Component({
  templateUrl: './settings-users.component.html',
  styleUrls: ['./settings-users.component.scss'],
})
export class SettingsUsersComponent implements OnInit {
  private readonly logger = new Logger('SettingsUsersComponent');

  private UndeletableUsersList: string[] = [];

  public readonly displayedColumns: string[] = ['username', 'roles', 'actions'];
  public readonly pageSizeOptions: number[] = [5, 10, 25, 100];
  public readonly startingPageSize = this.pageSizeOptions[2];
  public readonly rolesTruncate = 5;

  public dataSubject = new BehaviorSubject<EUser[]>([]);
  public updateSubject = new Subject<PageEvent>();
  public totalUsers: number = 0;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private utilService: UtilService,
    private userManageService: UserAdminService,
    private staticInfo: StaticInfoService,
    private router: Router,
    public bootstrapService: BootstrapService
  ) {}

  ngOnInit() {
    this.subscribeToUpdate();

    Promise.all([
      this.fetchUsers(this.startingPageSize, 0),
      this.initSpecialUsers(),
    ]).catch(this.logger.error);
  }

  public addUser() {
    this.router.navigate(['/settings/users/add']);
  }

  public editUser(user: EUser) {
    this.router.navigate(['/settings/users/edit', user.id]);
  }

  public async deleteUser(user: EUser) {
    const pressedButton = await this.utilService.showDialog({
      title: `Are you sure you want to delete ${user.username}?`,
      description: 'This action cannot be undone.',
      buttons: [
        {
          color: 'red',
          name: 'delete',
          text: 'Delete',
        },
        {
          color: 'primary',
          name: 'cancel',
          text: 'Cancel',
        },
      ],
    });

    if (pressedButton === 'delete') {
      const result = await this.userManageService.deleteUser(user.id ?? '');
      if (HasFailed(result)) {
        this.utilService.showSnackBar(
          'Failed to delete user',
          SnackBarType.Error
        );
      } else {
        this.utilService.showSnackBar('User deleted', SnackBarType.Success);
      }
    }

    const success = await this.fetchUsers(
      this.paginator.pageSize,
      this.paginator.pageIndex
    );
    if (!success) {
      this.paginator.firstPage();
    }
  }

  @AutoUnsubscribe()
  private subscribeToUpdate() {
    return this.updateSubject
      .pipe(Throttle(500))
      .subscribe(async (pageEvent: PageEvent) => {
        let success = await this.fetchUsers(
          pageEvent.pageSize,
          pageEvent.pageIndex
        );
        if (!success) {
          if (pageEvent.previousPageIndex === pageEvent.pageIndex - 1) {
            this.paginator.previousPage();
          } else {
            this.paginator.firstPage();
          }
        }
      });
  }

  private async fetchUsers(
    pageSize: number,
    pageIndex: number
  ): Promise<boolean> {
    const result = await this.userManageService.getUsers(pageSize, pageIndex);
    if (HasFailed(result)) {
      this.utilService.showSnackBar(
        'Failed to fetch users',
        SnackBarType.Error
      );
      return false;
    }

    if (result.users.length > 0) {
      this.dataSubject.next(result.users);
      this.totalUsers = result.total;
      return true;
    }

    return false;
  }

  private async initSpecialUsers() {
    const specialUsers = await this.staticInfo.getSpecialUsers();
    this.UndeletableUsersList = specialUsers.UndeletableUsersList;
  }

  isSystem(user: EUser): boolean {
    return this.UndeletableUsersList.includes(user.username);
  }
}
