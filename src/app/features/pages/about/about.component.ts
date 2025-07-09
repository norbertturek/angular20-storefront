import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="about">
      <div class="container">
        <h1>About SofaSocietyCo.</h1>
        <p>At Sofa Society, we believe that a sofa is the heart of every home. We are dedicated to delivering high-quality, thoughtfully designed sofas that merge comfort and style effortlessly.</p>
        <p>Our mission is to transform your living space into a sanctuary of relaxation and beauty, with products built to last.</p>
      </div>
    </div>
  `,
  styles: [`
    .about {
      padding: 4rem 0;
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      h1 {
        font-size: 2.5rem;
        font-weight: 600;
        margin: 0 0 2rem 0;
        color: #000;
      }
      
      p {
        font-size: 1.125rem;
        line-height: 1.6;
        color: #666;
        margin: 0 0 1.5rem 0;
      }
    }
  `]
})
export class AboutComponent {} 