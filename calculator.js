// Simple calculator script
const display = document.getElementById('display');
const keys = document.querySelector('.keys');

let expression = '';     // current expression string
let parenOpen = 0;       // track parentheses balance

// Allowed characters for safety
const ALLOWED = /^[0-9+\-*/().\s]+$/;

function updateDisplay() {
  display.textContent = expression === '' ? '0' : expression;
}

function safeEvaluate(expr) {
  // Basic safety: only allow digits, operators, parentheses and dot
  if (!ALLOWED.test(expr)) throw new Error('Invalid characters');
  // Prevent expressions like "*/" at front
  // Use Function to safely evaluate in strict mode (we still try/catch)
  // strip leading zeros? let JS handle numeric parsing
  // Evaluate and limit to reasonable precision
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expr})`)();
  if (typeof result === 'number' && !Number.isFinite(result)) throw new Error('Math error');
  // Round to 12 significant digits to avoid floating noise
  return Math.round((result + Number.EPSILON) * 1e12) / 1e12;
}

function appendValue(value) {
  // Prevent two operators in a row (except minus for negative)
  const last = expression.slice(-1);
  const isOperator = /[+\-*/]/.test(value);
  const lastIsOperator = /[+\-*/]/.test(last);

  if (value === '.') {
    // Prevent multiple decimals in the same number
    // Find substring after last operator
    const after = expression.split(/[+\-*/]/).pop();
    if (after.includes('.')) return;
    if (after === '') expression += '0'; // . => 0.
  }

  if (isOperator) {
    if (expression === '' && value !== '-') {
      // don't start with +,*,/ ; allow starting with -
      return;
    }
    if (lastIsOperator) {
      // replace last operator with new one (except allow 2-char minus like *-? we keep simple)
      expression = expression.slice(0, -1) + value;
      updateDisplay();
      return;
    }
  }

  expression += value;
  updateDisplay();
}

function handleClear() {
  expression = '';
  parenOpen = 0;
  updateDisplay();
}

function handleBackspace() {
  const last = expression.slice(-1);
  expression = expression.slice(0, -1);
  if (last === '(') parenOpen = Math.max(parenOpen - 1, 0);
  if (last === ')') parenOpen++;
  updateDisplay();
}

function handleParen() {
  // Toggle insert '(' or ')': if more open than close, add ')', else add '('
  if (expression === '' || /[+\-*/(]$/.test(expression)) {
    expression += '(';
    parenOpen++;
  } else if (parenOpen > 0) {
    expression += ')';
    parenOpen--;
  } else {
    // nothing open -> open a new one
    expression += '(';
    parenOpen++;
  }
  updateDisplay();
}

// Event delegation for button clicks
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const value = btn.dataset.value;
  const action = btn.dataset.action;

  if (action === 'clear') return handleClear();
  if (action === 'back') return handleBackspace();
  if (action === 'paren') return handleParen();
  if (action === 'equals') {
    try {
      const result = safeEvaluate(expression || '0');
      expression = String(result);
    } catch (err) {
      expression = 'Error';
      setTimeout(() => { expression = ''; updateDisplay(); }, 1200);
    }
    updateDisplay();
    return;
  }

  // Normal value (digit, ., operator)
  appendValue(value);
});

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    appendValue(e.key);
    return;
  }

  if (e.key === '.') {
    appendValue('.');
    return;
  }

  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    try {
      const result = safeEvaluate(expression || '0');
      expression = String(result);
    } catch (err) {
      expression = 'Error';
      setTimeout(() => { expression = ''; updateDisplay(); }, 1200);
    }
    updateDisplay();
    return;
  }

  if (e.key === 'Backspace') {
    handleBackspace();
    return;
  }

  if (e.key === 'Escape') {
    handleClear();
    return;
  }

  if (['+', '-', '*', '/'].includes(e.key)) {
    appendValue(e.key);
    return;
  }

  if (e.key === '(' || e.key === ')') {
    appendValue(e.key);
    return;
  }
});

// initialize
updateDisplay();
