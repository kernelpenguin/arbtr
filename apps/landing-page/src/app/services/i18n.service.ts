import { Injectable, signal, computed, effect } from '@angular/core';

export type Language = 'pt-BR' | 'en' | 'es';

interface Translations {
  [key: string]: {
    'pt-BR': string;
    'en': string;
    'es': string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly LANG_KEY = 'arbeiters-lang';
  
  // Signal for current language
  language = signal<Language>(this.getInitialLanguage());

  // Computed signal for language name
  languageName = computed(() => {
    const lang = this.language();
    return {
      'pt-BR': 'Português',
      'en': 'English',
      'es': 'Español'
    }[lang];
  });

  private translations: Translations = {
    // Navigation
    'nav.simulator': {
      'pt-BR': 'Simulador',
      'en': 'Simulator',
      'es': 'Simulador'
    },
    'nav.manifesto': {
      'pt-BR': 'Manifesto',
      'en': 'Manifesto',
      'es': 'Manifiesto'
    },
    'nav.architecture': {
      'pt-BR': 'Arquitetura',
      'en': 'Architecture',
      'es': 'Arquitectura'
    },
    'nav.accessPanel': {
      'pt-BR': 'Acessar Painel',
      'en': 'Access Panel',
      'es': 'Acceder al Panel'
    },

    // Hero Section
    'hero.chip': {
      'pt-BR': 'HISTÓRICO_SISTEMA: { 1886 // 1917 // 2026 }',
      'en': 'SYSTEM_HISTORY: { 1886 // 1917 // 2026 }',
      'es': 'HISTORIAL_SISTEMA: { 1886 // 1917 // 2026 }'
    },
    'hero.title': {
      'pt-BR': 'A Máquina<br>Não Controla Você.',
      'en': 'The Machine<br>Doesn\'t Control You.',
      'es': 'La Máquina<br>No Te Controla.'
    },
    'hero.subtitle': {
      'pt-BR': 'Nossa história é forjada em vitórias contra a exploração. Hoje, na linha de montagem da Inteligência Artificial, Arbeiters é a sua ferramenta de retomada. Um sistema de extração direta de oportunidades. Sem atravessadores ou algoritmos opacos ditando o seu valor.',
      'en': 'Our history is forged in victories against exploitation. Today, on the AI assembly line, Arbeiters is your tool for reclaiming power. A direct opportunity extraction system. No middlemen or opaque algorithms dictating your worth.',
      'es': 'Nuestra historia está forjada en victorias contra la explotación. Hoy, en la línea de montaje de la Inteligencia Artificial, Arbeiters es tu herramienta de recuperación. Un sistema de extracción directa de oportunidades. Sin intermediarios ni algoritmos opacos dictando tu valor.'
    },
    'hero.testSimulator': {
      'pt-BR': 'Testar Simulador',
      'en': 'Test Simulator',
      'es': 'Probar Simulador'
    },
    'hero.viewFeatures': {
      'pt-BR': 'Ver Recursos',
      'en': 'View Features',
      'es': 'Ver Recursos'
    },

    // Simulator Section
    'simulator.title': {
      'pt-BR': 'Painel de Triagem Simulado',
      'en': 'Simulated Triage Panel',
      'es': 'Panel de Triaje Simulado'
    },
    'simulator.description': {
      'pt-BR': 'Experimente em tempo real a reatividade das regras de Acesso Total e Match Score alimentadas por sinais do Angular 22.',
      'en': 'Experience real-time reactivity of Total Access and Match Score rules powered by Angular 22 signals.',
      'es': 'Experimenta en tiempo real la reactividad de las reglas de Acceso Total y Puntuación de Coincidencia impulsadas por señales de Angular 22.'
    },
    'simulator.profileConfig': {
      'pt-BR': '01 // CONFIGURAÇÃO_PERFIL',
      'en': '01 // PROFILE_CONFIG',
      'es': '01 // CONFIGURACIÓN_PERFIL'
    },
    'simulator.mySkills': {
      'pt-BR': 'Minhas Habilidades (Tire/Adicione)',
      'en': 'My Skills (Add/Remove)',
      'es': 'Mis Habilidades (Agregar/Quitar)'
    },
    'simulator.platform': {
      'pt-BR': 'Plataforma / Canal de Busca',
      'en': 'Platform / Search Channel',
      'es': 'Plataforma / Canal de Búsqueda'
    },
    'simulator.minWage': {
      'pt-BR': 'Retorno Mínimo Desejável',
      'en': 'Minimum Desired Return',
      'es': 'Retorno Mínimo Deseado'
    },
    'simulator.opportunities': {
      'pt-BR': '02 // OPORTUNIDADES_PRODUTIVAS',
      'en': '02 // PRODUCTIVE_OPPORTUNITIES',
      'es': '02 // OPORTUNIDADES_PRODUCTIVAS'
    },
    'simulator.jobs': {
      'pt-BR': 'VAGAS',
      'en': 'JOBS',
      'es': 'VACANTES'
    },
    'simulator.categoryAvg': {
      'pt-BR': 'Média da Categoria',
      'en': 'Category Average',
      'es': 'Promedio de Categoría'
    },
    'simulator.strongMatches': {
      'pt-BR': 'Matches Fortes (≥80%)',
      'en': 'Strong Matches (≥80%)',
      'es': 'Coincidencias Fuertes (≥80%)'
    },
    'simulator.loading': {
      'pt-BR': 'CONECTANDO À FROTA DE SCRAPERS...',
      'en': 'CONNECTING TO SCRAPER FLEET...',
      'es': 'CONECTANDO A LA FLOTA DE SCRAPERS...'
    },
    'simulator.noJobs': {
      'pt-BR': 'NENHUMA VAGA ENCONTRADA PARA ESTA COMBINAÇÃO DE FILTROS',
      'en': 'NO JOBS FOUND FOR THIS FILTER COMBINATION',
      'es': 'NO SE ENCONTRARON VACANTES PARA ESTA COMBINACIÓN DE FILTROS'
    },
    'simulator.autoAdjusted': {
      'pt-BR': '* Default auto-ajustado por linkedSignal para categoria',
      'en': '* Default auto-adjusted by linkedSignal for category',
      'es': '* Predeterminado auto-ajustado por linkedSignal para categoría'
    },

    // Features Section
    'features.title': {
      'pt-BR': 'Infraestrutura Descentralizada',
      'en': 'Decentralized Infrastructure',
      'es': 'Infraestructura Descentralizada'
    },
    'features.subtitle': {
      'pt-BR': 'Projetado para autonomia e sobrevivência no mercado gig.',
      'en': 'Designed for autonomy and survival in the gig market.',
      'es': 'Diseñado para autonomía y supervivencia en el mercado gig.'
    },
    'features.fleet.title': {
      'pt-BR': 'Scraper Fleet Descentralizada',
      'en': 'Decentralized Scraper Fleet',
      'es': 'Flota de Scrapers Descentralizada'
    },
    'features.fleet.description': {
      'pt-BR': 'Workers concorrentes rodam em infraestrutura global paralela. Os trabalhos são indexados antes de chegarem à superfície, garantindo acesso prioritário para a classe sem intermediários.',
      'en': 'Concurrent workers run on parallel global infrastructure. Jobs are indexed before reaching the surface, ensuring priority access for the working class without intermediaries.',
      'es': 'Workers concurrentes se ejecutan en infraestructura global paralela. Los trabajos se indexan antes de llegar a la superficie, garantizando acceso prioritario para la clase trabajadora sin intermediarios.'
    },
    'features.fee.title': {
      'pt-BR': 'Taxa de Atravessador',
      'en': 'Middleman Fee',
      'es': 'Tarifa de Intermediario'
    },
    'features.fee.description': {
      'pt-BR': '100% do valor do seu trabalho direto para você. A máquina não cobra pedágio sobre o tempo de vida do trabalhador.',
      'en': '100% of your work value goes directly to you. The machine doesn\'t charge a toll on the worker\'s lifetime.',
      'es': '100% del valor de tu trabajo va directamente a ti. La máquina no cobra peaje sobre el tiempo de vida del trabajador.'
    },
    'features.session.title': {
      'pt-BR': 'Gerenciamento de Sessão',
      'en': 'Session Management',
      'es': 'Gestión de Sesión'
    },
    'features.session.description': {
      'pt-BR': 'Sistemas de Anti-Banimento e roteamento de Dummy Accounts. Sua identidade produtiva está protegida.',
      'en': 'Anti-Ban systems and Dummy Account routing. Your productive identity is protected.',
      'es': 'Sistemas Anti-Baneo y enrutamiento de Cuentas Dummy. Tu identidad productiva está protegida.'
    },
    'features.optimization.title': {
      'pt-BR': 'Otimização de Oportunidades',
      'en': 'Opportunity Optimization',
      'es': 'Optimización de Oportunidades'
    },
    'features.optimization.description': {
      'pt-BR': 'O algoritmo trabalha para você, não contra você. Filtros automatizados por wage/hr e carga cognitiva evitam o desgaste em tarefas de baixo valor.',
      'en': 'The algorithm works for you, not against you. Automated filters by wage/hr and cognitive load prevent burnout on low-value tasks.',
      'es': 'El algoritmo trabaja para ti, no contra ti. Filtros automatizados por wage/hr y carga cognitiva evitan el desgaste en tareas de bajo valor.'
    },

    // Footer
    'footer.tagline': {
      'pt-BR': 'Trabalhadores de todo o mundo digital, uni-vos.',
      'en': 'Digital workers of the world, unite.',
      'es': 'Trabajadores del mundo digital, uníos.'
    },
    'footer.license': {
      'pt-BR': '© 2026 ARBEITERS. LICENÇA MIT.',
      'en': '© 2026 ARBEITERS. MIT LICENSE.',
      'es': '© 2026 ARBEITERS. LICENCIA MIT.'
    },
    'footer.forged': {
      'pt-BR': 'FORJADO PARA O TRABALHADOR.',
      'en': 'FORGED FOR THE WORKER.',
      'es': 'FORJADO PARA EL TRABAJADOR.'
    }
  };

  constructor() {
    // Effect to save language changes to localStorage
    effect(() => {
      const lang = this.language();
      localStorage.setItem(this.LANG_KEY, lang);
    });
  }

  private getInitialLanguage(): Language {
    // Check localStorage first
    const stored = localStorage.getItem(this.LANG_KEY) as Language;
    if (stored && ['pt-BR', 'en', 'es'].includes(stored)) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) return 'pt-BR';
    if (browserLang.startsWith('es')) return 'es';
    return 'en';
  }

  setLanguage(lang: Language): void {
    this.language.set(lang);
  }

  t(key: string): string {
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[this.language()];
  }

  // Helper for HTML binding
  tHtml(key: string): string {
    return this.t(key);
  }
}

// Made with Bob
