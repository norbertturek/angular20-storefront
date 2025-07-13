import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-preview',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="about-preview">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <h2>About Sofa Society</h2>
            <p>At Sofa Society, we believe that a sofa is the heart of every home. We are dedicated to delivering high-quality, thoughtfully designed sofas that merge comfort and style effortlessly.</p>
            <a routerLink="/about" class="learn-more">Learn More</a>
          </div>
          <div class="about-image">
            <img src="/images/content/gray-sofa-against-concrete-wall.png" alt="Gray sofa against concrete wall" />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .about-preview {
      padding: 4rem 0;
      background-color: #f8f9fa;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .about-text h2 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1.5rem 0;
      color: #1a1a1a;
    }

    .about-text p {
      font-size: 1.125rem;
      line-height: 1.7;
      color: #666;
      margin: 0 0 2rem 0;
    }

    .learn-more {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: #1a1a1a;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: background-color 0.3s ease;
    }

    .learn-more:hover {
      background-color: #333;
    }

    .about-image {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .about-image img {
      width: 100%;
      height: 400px;
      object-fit: cover;
    }

    @media (max-width: 768px) {
      .about-preview {
        padding: 2rem 0;
      }

      .about-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .about-text h2 {
        font-size: 2rem;
      }

      .about-text p {
        font-size: 1rem;
      }

      .about-image img {
        height: 300px;
      }
    }
  `]
})
export class AboutPreviewComponent {} 