import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {QuestionBankDevApp} from './modules/question-bank/QuestionBankDevApp.tsx';
import './index.css';

const questionBankEnabled = import.meta.env.VITE_QUESTION_BANK_DEV === 'true';
const isQuestionBankRoute = window.location.pathname === '/dev/question-bank';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {questionBankEnabled && isQuestionBankRoute ? <QuestionBankDevApp /> : <App />}
  </StrictMode>,
);
