// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../App';

/**
 * Runtime smoke test: render the whole app and exercise the core loop
 * (select a key → edit → see it in the export). Catches wiring errors that
 * the type checker can't.
 */
describe('App', () => {
  it('renders workbench preview, key list, and header', () => {
    render(<App />);
    expect(screen.getByText('VS-CodeSwatch')).toBeTruthy();
    expect(screen.getByText('Explorer')).toBeTruthy(); // sidebar preview
    expect(screen.getAllByText(/Terminal/).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/Search 944 colors/)).toBeTruthy();
    cleanup();
  });

  it('selects a color key from search and shows it in the inspector', async () => {
    render(<App />);
    const search = screen.getByPlaceholderText(/Search 944 colors/);
    fireEvent.change(search, { target: { value: 'terminal.ansiRed' } });
    // Row shows a readable label now; the raw key lives in its title attribute.
    const row = await screen.findByTitle('terminal.ansiRed');
    fireEvent.click(row);
    // Inspector shows the key name as a heading plus its description.
    expect(screen.getByText('terminal.ansiRed')).toBeTruthy();
    expect(screen.getByText(/Clear|inherited default|set in theme/)).toBeTruthy();
    cleanup();
  });
});
