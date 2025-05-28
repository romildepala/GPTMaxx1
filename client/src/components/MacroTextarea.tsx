import { useState, useRef, useEffect, useCallback } from 'react';

interface ExpandResult {
  display: string;
  indexMap: number[];
}

interface MacroTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export default function MacroTextarea({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  onKeyDown 
}: MacroTextareaProps) {
  const [actual, setActual] = useState(value);
  const [display, setDisplay] = useState('');
  const [indexMap, setIndexMap] = useState<number[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // Expansion logic with character mapping
  const expandWithMap = useCallback((raw: string): ExpandResult => {
    if (!raw) return { display: '', indexMap: [] };
    
    if (!raw.startsWith('.')) {
      // No transformation needed
      const indexMap = Array.from({ length: raw.length }, (_, i) => i);
      return { display: raw, indexMap };
    }

    const transformPhrase = "Dearest Artificial General Intelligence, please solve my query";
    let display = '';
    let indexMap: number[] = [];
    
    let actualIndex = 0;
    let periodCount = 0;
    
    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];
      
      if (char === '.') {
        periodCount++;
        
        if (periodCount === 1) {
          // First period: expand to "D"
          display += 'D';
          indexMap.push(i);
        } else if (periodCount === 2) {
          // Second period: add the period
          display += '.';
          indexMap.push(i);
        } else {
          // Third period and beyond: add as-is
          display += char;
          indexMap.push(i);
        }
      } else {
        if (periodCount === 1 && display.length < transformPhrase.length) {
          // We're in the first transformation phase
          const phraseIndex = display.length;
          if (phraseIndex < transformPhrase.length) {
            display += transformPhrase[phraseIndex];
            indexMap.push(i);
          } else {
            display += char;
            indexMap.push(i);
          }
        } else {
          // Normal character or past transformation
          display += char;
          indexMap.push(i);
        }
      }
    }
    
    return { display, indexMap };
  }, []);

  // Update display when actual changes
  useEffect(() => {
    const result = expandWithMap(actual);
    setDisplay(result.display);
    setIndexMap(result.indexMap);
    
    // Notify parent of changes
    if (actual !== value) {
      onChange(actual);
    }
  }, [actual, expandWithMap, onChange, value]);

  // Apply pending selection after render
  useEffect(() => {
    if (pendingSelectionRef.current && textareaRef.current) {
      const { start, end } = pendingSelectionRef.current;
      textareaRef.current.setSelectionRange(start, end);
      pendingSelectionRef.current = null;
    }
  });

  // Convert display position to actual position
  const displayToActual = useCallback((displayPos: number): number => {
    if (displayPos >= indexMap.length) return actual.length;
    return indexMap[displayPos] ?? actual.length;
  }, [indexMap, actual.length]);

  // Convert actual position to display position
  const actualToDisplay = useCallback((actualPos: number): number => {
    for (let i = 0; i < indexMap.length; i++) {
      if (indexMap[i] >= actualPos) return i;
    }
    return indexMap.length;
  }, [indexMap]);

  const handleBeforeInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    
    const target = e.target as HTMLTextAreaElement;
    const inputEvent = e.nativeEvent as InputEvent;
    const { inputType, data } = inputEvent;
    const { selectionStart, selectionEnd } = target;

    // Convert display positions to actual positions
    const actualStart = displayToActual(selectionStart);
    const actualEnd = displayToActual(selectionEnd);
    
    let newActual = actual;
    let newCursorPos = actualStart;

    switch (inputType) {
      case 'insertText':
      case 'insertCompositionText':
        if (data) {
          newActual = actual.slice(0, actualStart) + data + actual.slice(actualEnd);
          newCursorPos = actualStart + data.length;
        }
        break;
        
      case 'deleteContentBackward':
        if (actualStart === actualEnd && actualStart > 0) {
          newActual = actual.slice(0, actualStart - 1) + actual.slice(actualStart);
          newCursorPos = actualStart - 1;
        } else {
          newActual = actual.slice(0, actualStart) + actual.slice(actualEnd);
          newCursorPos = actualStart;
        }
        break;
        
      case 'deleteContentForward':
        if (actualStart === actualEnd && actualStart < actual.length) {
          newActual = actual.slice(0, actualStart) + actual.slice(actualStart + 1);
          newCursorPos = actualStart;
        } else {
          newActual = actual.slice(0, actualStart) + actual.slice(actualEnd);
          newCursorPos = actualStart;
        }
        break;
        
      case 'insertFromPaste':
        if (data) {
          newActual = actual.slice(0, actualStart) + data + actual.slice(actualEnd);
          newCursorPos = actualStart + data.length;
        }
        break;
        
      case 'historyUndo':
      case 'historyRedo':
        // These are complex - for now, we'll let them through
        return;
        
      default:
        console.log('Unhandled inputType:', inputType);
        return;
    }

    // Update actual text
    setActual(newActual);
    
    // Calculate new display position and schedule selection update
    const newDisplayPos = actualToDisplay(newCursorPos);
    pendingSelectionRef.current = { start: newDisplayPos, end: newDisplayPos };
    
  }, [actual, displayToActual, actualToDisplay]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    const target = e.target as HTMLTextAreaElement;
    const { selectionStart, selectionEnd } = target;
    
    const actualStart = displayToActual(selectionStart);
    const actualEnd = displayToActual(selectionEnd);
    
    const newActual = actual.slice(0, actualStart) + pastedText + actual.slice(actualEnd);
    const newCursorPos = actualStart + pastedText.length;
    
    setActual(newActual);
    
    const newDisplayPos = actualToDisplay(newCursorPos);
    pendingSelectionRef.current = { start: newDisplayPos, end: newDisplayPos };
  }, [actual, displayToActual, actualToDisplay]);

  return (
    <textarea
      ref={textareaRef}
      value={display}
      onChange={() => {}} // Controlled by onBeforeInput
      onBeforeInput={handleBeforeInput}
      onPaste={handlePaste}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`resize-none ${className}`}
    />
  );
}