import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isLoggedIn = false;
  userName = '';
  avatarUrl: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.isLoggedIn = true;
        this.userName = user.firstName + ' ' + user.lastName;
        this.avatarUrl = user.avatarUrl;
      } else {
        this.isLoggedIn = false;
        this.userName = '';
        this.avatarUrl = null;
      }
      this.cdr.detectChanges();
    });
  }

  getInitials(): string {
    if (!this.userName) return '?';
    return this.userName
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    // TODO: dropdown menu with profile/settings/logout
  }
}