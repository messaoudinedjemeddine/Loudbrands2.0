// Validation utilities for form inputs

export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if phone starts with 06, 05, or 07
  if (!cleanPhone.match(/^(06|05|07)/)) {
    return {
      isValid: false,
      error: 'Le numéro de téléphone doit commencer par 06, 05 ou 07'
    };
  }
  
  // Check if phone is exactly 10 digits
  if (cleanPhone.length !== 10) {
    return {
      isValid: false,
      error: 'Le numéro de téléphone doit contenir exactement 10 chiffres'
    };
  }
  
  return { isValid: true };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: true }; // Email is optional
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Veuillez entrer une adresse email valide'
    };
  }
  
  return { isValid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If it starts with 06, 05, or 07 and is 10 digits, format it
  if (cleanPhone.match(/^(06|05|07)/) && cleanPhone.length === 10) {
    return cleanPhone;
  }
  
  return phone; // Return original if not valid format
};
