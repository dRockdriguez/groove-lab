import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExerciseBrowser } from './ExerciseBrowser';
import type { InstrumentExercises } from '@groovelab/types';

const testData: InstrumentExercises[] = [
  {
    instrumentType: 'electronic-drums',
    sections: [
      {
        id: 'ritmos-basicos',
        title: 'Ritmos básicos',
        exercises: [
          {
            id: 'drums-basic-1',
            title: 'Ejercicio 1',
            description: 'Patrón básico de batería para practicar ritmo.',
          },
        ],
      },
    ],
  },
  {
    instrumentType: 'bass-guitar',
    sections: [
      {
        id: 'lineas-de-bajo',
        title: 'Líneas de bajo',
        exercises: [
          {
            id: 'bass-line-1',
            title: 'Ejercicio 1',
            description: 'Línea de bajo sencilla para practicar el pulso.',
          },
        ],
      },
    ],
  },
  {
    instrumentType: 'guitar',
    sections: [
      {
        id: 'acordes-basicos',
        title: 'Acordes básicos',
        exercises: [
          {
            id: 'guitar-chords-1',
            title: 'Ejercicio 1',
            description: 'Progresión de acordes básica para principiantes.',
          },
        ],
      },
    ],
  },
];

describe('ExerciseBrowser — instrument selector', () => {
  it('renders three instrument options: Drums, Bass, Guitar', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    expect(screen.getByRole('tab', { name: 'Drums' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bass' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Guitar' })).toBeInTheDocument();
  });

  it('uses role="tablist" for the instrument selector container', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('each instrument option uses role="tab"', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('Drums is the default selected instrument on initial load', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    expect(drumsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('one instrument is always selected (unselected tabs have aria-selected="false")', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });
    expect(bassTab).toHaveAttribute('aria-selected', 'false');
    expect(guitarTab).toHaveAttribute('aria-selected', 'false');
  });

  it('clicking a different instrument updates which tab is selected', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    fireEvent.click(bassTab);
    expect(bassTab).toHaveAttribute('aria-selected', 'true');

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    expect(drumsTab).toHaveAttribute('aria-selected', 'false');
  });
});

describe('ExerciseBrowser — exercise list', () => {
  it('shows exercises only for the selected instrument (Drums by default)', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    expect(screen.getByText('Ritmos básicos')).toBeInTheDocument();
    expect(
      screen.getByText('Patrón básico de batería para practicar ritmo.')
    ).toBeInTheDocument();

    // Bass and Guitar exercises should NOT be visible
    expect(screen.queryByText('Líneas de bajo')).not.toBeInTheDocument();
    expect(screen.queryByText('Acordes básicos')).not.toBeInTheDocument();
  });

  it('exercises are grouped under named sections with visible headings', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    expect(
      screen.getByRole('heading', { name: 'Ritmos básicos' })
    ).toBeInTheDocument();
  });

  it('updates exercises immediately when instrument selection changes', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    // Switch to Bass
    fireEvent.click(screen.getByRole('tab', { name: 'Bass' }));
    expect(screen.getByText('Líneas de bajo')).toBeInTheDocument();
    expect(
      screen.getByText('Línea de bajo sencilla para practicar el pulso.')
    ).toBeInTheDocument();

    // Drums exercises should no longer be visible
    expect(screen.queryByText('Ritmos básicos')).not.toBeInTheDocument();
  });

  it('switching to Guitar shows guitar exercises', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Guitar' }));
    expect(screen.getByText('Acordes básicos')).toBeInTheDocument();
    expect(
      screen.getByText('Progresión de acordes básica para principiantes.')
    ).toBeInTheDocument();
  });

  it('sections and exercises render in data array order (no automatic sorting)', () => {
    const dataWithMultipleSections: InstrumentExercises[] = [
      {
        instrumentType: 'electronic-drums',
        sections: [
          {
            id: 'section-b',
            title: 'Section B',
            exercises: [
              { id: 'ex-2', title: 'Exercise 2', description: 'Second' },
              { id: 'ex-1', title: 'Exercise 1', description: 'First' },
            ],
          },
          {
            id: 'section-a',
            title: 'Section A',
            exercises: [
              { id: 'ex-3', title: 'Exercise 3', description: 'Third' },
            ],
          },
        ],
      },
    ];

    render(
      <ExerciseBrowser exercisesByInstrument={dataWithMultipleSections} />
    );

    const headings = screen.getAllByRole('heading');
    const sectionHeadings = headings.filter(
      (h) => h.textContent === 'Section B' || h.textContent === 'Section A'
    );
    expect(sectionHeadings[0]).toHaveTextContent('Section B');
    expect(sectionHeadings[1]).toHaveTextContent('Section A');
  });

  it('each exercise card displays a title and a description', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    expect(screen.getByText('Ejercicio 1')).toBeInTheDocument();
    expect(
      screen.getByText('Patrón básico de batería para practicar ritmo.')
    ).toBeInTheDocument();
  });
});

describe('ExerciseBrowser — tabpanel accessibility', () => {
  it('exercise list region uses role="tabpanel"', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('tabpanel is associated with the active instrument tab via aria-labelledby', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const tabpanel = screen.getByRole('tabpanel');

    expect(drumsTab).toHaveAttribute('id');
    expect(tabpanel).toHaveAttribute('aria-labelledby', drumsTab.id);
  });

  it('tabpanel aria-labelledby updates when switching instruments', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Bass' }));

    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('aria-labelledby', bassTab.id);
  });
});

describe('ExerciseBrowser — navigation', () => {
  it('clicking an exercise provides a link to the playback screen', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/practice/electronic-drums/drums-basic-1'
    );
  });

  it('exercise links follow /practice/{instrumentType}/{exerciseId} pattern', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    // Switch to Bass and check the link
    fireEvent.click(screen.getByRole('tab', { name: 'Bass' }));
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/practice/bass-guitar/bass-line-1');
  });
});

describe('ExerciseBrowser — responsive rendering', () => {
  it.todo(
    'renders correctly on viewport widths from 320px to 1440px (visual regression test)'
  );
});
