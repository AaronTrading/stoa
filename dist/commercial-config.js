export const coachingOffer={
  name:'Coaching',
  durationMonths:3,
  regularPrice:600,
  launchPrice:300,
  currency:'EUR',
  checkoutUrl:window.__STOA_ENV__?.COACHING_CHECKOUT_URL||'',
  includesAcademie:true,
  welcomeGift:'Huile d’olive extra vierge biologique STOA, 1 L',
};

export const academyOffer={
  name:'Académie',
  regularPrice:29.99,
  launchPrice:14.99,
  currency:'EUR',
  interval:'mois',
};

export const formatCommercialPrice=value=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:coachingOffer.currency,maximumFractionDigits:0}).format(value);
export const formatAcademyPrice=value=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:academyOffer.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
