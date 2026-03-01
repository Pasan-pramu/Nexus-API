import arcjet, { shield, detectBot } from '@arcjet/node';

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ['ip.src'],
  rules: [
    shield({ mode: 'LIVE' }),
    detectBot({
      mode: 'LIVE',
      allow: [
        'CATEGORY:SEARCH_ENGINE',
        'CATEGORY:PREVIEW',
        'CATEGORY:MONITOR',
        'CATEGORY:TOOL',
        'CATEGORY:PROGRAMMATIC',
      ],
    }),
  ],
});

export default aj;
