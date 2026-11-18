export const coachingOffer={
  name:'Coaching',
  durationMonths:3,
  billingIntervalMonths:3,
  price:299.99,
  currency:'EUR',
  includesAcademie:true,
  welcomeGift:'Huile d’olive extra vierge biologique STOA, 1 L',
};

export const academyOffer={
  name:'Académie',
  firstMonthPrice:14.99,
  recurringPrice:24.99,
  currency:'EUR',
  interval:'mois',
};

export const oliveOffer={
  name:'Huile d’olive bio extra vierge STOA',
  format:'1 L',
  price:29.99,
  currency:'EUR',
  paymentLink:'https://buy.stripe.com/7sYcN44Uw34S4Jh5gF2kw00',
};

export const formatCommercialPrice=value=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:coachingOffer.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
export const formatAcademyPrice=value=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:academyOffer.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
