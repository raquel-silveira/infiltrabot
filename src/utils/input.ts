import readline from 'node:readline';

const rl = readline.createInterface({
  output: process.stdout,
  input: process.stdin,
});

export const input = (message: string): Promise<string> => {
  return new Promise((resolve) =>
    rl.question(message, (name) => {
      rl.close();
      resolve(name);
    }),
  );
};
