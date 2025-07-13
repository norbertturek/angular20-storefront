import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@ui/button/button.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink, ButtonComponent],
  template: `
    <section class="hero">
      <div class="hero-image">
        <img src="/images/content/living-room-gray-armchair-two-seater-sofa.png" alt="Living room with gray armchair and two-seater sofa" />
      </div>
      <div class="hero-content">
        <div class="container">
          <h1>Elevate Your Living Space with Unmatched Comfort & Style</h1>
          <p>Discover Your Perfect Sofa Today</p>
          <app-button routerLink="/products" label="Explore now!" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      height: 80vh;
      min-height: 600px;
      display: flex;
      align-items: center;
      overflow: hidden;
    }

    .hero-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .hero-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      width: 100%;
      color: white;
      text-align: center;
    }

    .hero-content h1 {
      font-size: 3.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    .hero-content p {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    @media (max-width: 768px) {
      .hero {
        height: 60vh;
        min-height: 400px;
      }

      .hero-content h1 {
        font-size: 2.5rem;
      }

      .hero-content p {
        font-size: 1rem;
      }
    }
  `]
})
export class HeroComponent {} 