import cliSpinners from 'cli-spinners';
import ora from 'ora';

export const logSpinner = (message?: string) =>
  ora({ text: message, ...cliSpinners.dots });
