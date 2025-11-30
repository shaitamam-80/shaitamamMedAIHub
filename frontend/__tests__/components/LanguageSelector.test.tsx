import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '@/app/define/components/LanguageSelector';

describe('LanguageSelector', () => {
  it('renders both language options', () => {
    const mockOnSelect = jest.fn();
    render(<LanguageSelector onSelect={mockOnSelect} />);

    expect(screen.getByText(/English/i)).toBeInTheDocument();
    expect(screen.getByText(/עברית/i)).toBeInTheDocument();
  });

  it('calls onSelect with "en" when English clicked', () => {
    const mockOnSelect = jest.fn();
    render(<LanguageSelector onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText(/English/i));
    expect(mockOnSelect).toHaveBeenCalledWith('en');
  });

  it('calls onSelect with "he" when Hebrew clicked', () => {
    const mockOnSelect = jest.fn();
    render(<LanguageSelector onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByText(/עברית/i));
    expect(mockOnSelect).toHaveBeenCalledWith('he');
  });
});
