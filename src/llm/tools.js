export const functionDeclarations = [
  {
    name: 'profile_set',
    description: 'Define ou atualiza nome e email do usuário.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING' },
        email: { type: 'STRING' }
      }
    }
  },
  {
    name: 'profile_show',
    description: 'Mostra o perfil atual (nome, email) e status da conta Google.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'google_link_start',
    description: 'Gera link para iniciar o OAuth do Google.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'google_unlink',
    description: 'Desvincula a conta Google atual.',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'calendar_create_event',
    description: 'Cria um evento no Google Calendar.',
    parameters: {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        description: { type: 'STRING' },
        startISO: { type: 'STRING' },
        endISO: { type: 'STRING' },
        location: { type: 'STRING' },
        attendees: { type: 'ARRAY', items: { type: 'STRING' } }
      },
      required: ['summary', 'startISO', 'endISO']
    }
  }
];
