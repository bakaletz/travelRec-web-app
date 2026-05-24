import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SearchAutocompleteComponent } from '../search-autocomplete/search-autocomplete.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, SearchAutocompleteComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isAdmin: boolean = false;
  isLoggedIn = false;
  userName = '';
  avatarUrl: string | null = null;
  menuOpen = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.isLoggedIn = true;
        this.userName = user.firstName + ' ' + user.lastName;
        this.avatarUrl = user.avatarUrl;
         this.isAdmin = user.role === 'ADMIN';
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

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.menuOpen = false;
    this.authService.logout();
  }
}