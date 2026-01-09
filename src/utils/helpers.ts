import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const calculateDiscount = (
  amount: number,
  discount: number,
  type: 'percentage' | 'fixed'
): number => {
  if (type === 'percentage') {
    return (amount * discount) / 100;
  }
  return Math.min(discount, amount);
};

export const calculateProgress = (
  totalLessons: number,
  completedLessons: number
): number => {
  if (totalLessons === 0) return 0;
  return Math.round((completedLessons / totalLessons) * 100);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};
