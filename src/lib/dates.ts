const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function formatLongDate(date: Date = new Date()) {
  return capitalize(
    date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
  );
}

export function formatMonthYear(date: Date = new Date()) {
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${capitalize(month)} ${date.getFullYear()}`;
}
