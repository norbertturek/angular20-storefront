import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>SofaSocietyCo.</h3>
            <p>Elevate Your Living Space with Unmatched Comfort & Style</p>
          </div>
          
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a routerLink="/">Home</a></li>
              <li><a routerLink="/store">Shop</a></li>
              <li><a routerLink="/about">About</a></li>
              <li><a routerLink="/contact">Contact</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Customer Service</h4>
            <ul>
              <li><a routerLink="/help">Help Center</a></li>
              <li><a routerLink="/shipping">Shipping Info</a></li>
              <li><a routerLink="/returns">Returns</a></li>
              <li><a routerLink="/warranty">Warranty</a></li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a routerLink="/privacy-policy">Privacy Policy</a></li>
              <li><a routerLink="/terms-of-use">Terms of Use</a></li>
              <li><a routerLink="/cookie-policy">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2024 SofaSocietyCo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {} 