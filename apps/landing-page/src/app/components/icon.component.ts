import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { 
  Moon, 
  Sun, 
  Contrast, 
  Globe, 
  ChevronDown,
  Server,
  Shield,
  BarChart3
} from 'lucide-static';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: '<span #iconContainer class="icon-container"></span>',
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .icon-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1em;
    }
    .icon-container :deep(svg) {
      width: 100%;
      height: 100%;
      stroke: currentColor;
      fill: none;
    }
  `]
})
export class IconComponent implements AfterViewInit {
  @Input() name: string = '';
  @Input() size: number = 24;
  @ViewChild('iconContainer', { static: true }) iconContainer!: ElementRef;

  private icons: { [key: string]: any } = {
    'moon': Moon,
    'sun': Sun,
    'contrast': Contrast,
    'globe': Globe,
    'chevron-down': ChevronDown,
    'server': Server,
    'shield': Shield,
    'bar-chart': BarChart3
  };

  ngAfterViewInit() {
    this.renderIcon();
  }

  ngOnChanges() {
    if (this.iconContainer) {
      this.renderIcon();
    }
  }

  private renderIcon() {
    const iconData = this.icons[this.name];
    if (!iconData) {
      console.warn(`Icon "${this.name}" not found`);
      return;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', this.size.toString());
    svg.setAttribute('height', this.size.toString());
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    
    // Parse the icon path data
    if (Array.isArray(iconData)) {
      iconData.forEach((pathData: string | [string, any]) => {
        if (typeof pathData === 'string') {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', pathData);
          svg.appendChild(path);
        } else if (Array.isArray(pathData)) {
          const [tag, attrs] = pathData;
          const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
          Object.entries(attrs).forEach(([key, value]) => {
            element.setAttribute(key, String(value));
          });
          svg.appendChild(element);
        }
      });
    }

    this.iconContainer.nativeElement.innerHTML = '';
    this.iconContainer.nativeElement.appendChild(svg);
  }
}

// Made with Bob
