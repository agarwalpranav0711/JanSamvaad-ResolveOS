process.env.NODE_ENV = 'test';
process.env.ENABLE_SLA_CRON = 'false';

const request = require('supertest');
const { app } = require('../server');

// Mock components
jest.mock('../src/services/llm', () => ({
  extractIntent: jest.fn()
}));

// Mock authenticateToken middleware
jest.mock('../src/middleware/authenticateToken', () => {
  return (req, res, next) => next();
});

const mockQuery = jest.fn();
const mockConnect = jest.fn();
const mockRelease = jest.fn();
const mockDbClient = {
  query: mockQuery,
  release: mockRelease
};
mockConnect.mockResolvedValue(mockDbClient);

jest.mock('../src/db', () => ({
  query: (...args) => mockQuery(...args),
  connect: (...args) => mockConnect(...args)
}));

jest.mock('twilio', () => {
  const twilioMock = function() {
    return {
      messages: {
        create: jest.fn().mockRejectedValue(new Error('Twilio API key expired for demo'))
      }
    };
  };
  twilioMock.twiml = {
    VoiceResponse: class {
      say() {}
      gather() { return { say: () => {} } }
      redirect() {}
      hangup() {}
      record() {}
      toString() { return '<xml></xml>' }
    }
  };
  twilioMock.validateExpressRequest = jest.fn().mockReturnValue(true);
  return twilioMock;
});
const twilio = require('twilio');

const { extractIntent } = require('../src/services/llm');

describe('🚀 QA SYSTEM VERIFICATION', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockResolvedValue({ rows: [] });
  });

  describe('PHASE 1: STARTUP', () => {
    it('should start backend and respond to health check', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('PHASE 2: CORE FLOWS', () => {
    it('1. NORMAL FLOW - Valid transcript creates ticket safely', async () => {
      extractIntent.mockResolvedValueOnce({
        category: 'water',
        ward: '4',
        urgency: 'high'
      });
      // Mock contacts query (no contact exists)
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // Mock insert contact
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }] });
      // Mock insert ticket
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 100, ref: 'JS-WTR123', status: 'open' }]
      });

      const res = await request(app)
        .post('/transcribe')
        .send({
          TranscriptionText: 'There is a huge water leak in my area',
          From: '+919999999999'
        });

      expect(res.status).toBe(200);
      expect(extractIntent).toHaveBeenCalledWith('There is a huge water leak in my area');
      
      const insertTicketCall = mockQuery.mock.calls.find(c => c[0].includes('INSERT INTO tickets'));
      expect(insertTicketCall).toBeDefined();
    });

    it('2. EMPTY / SILENT INPUT - Should not create ticket', async () => {
      const res = await request(app)
        .post('/transcribe')
        .send({
          TranscriptionText: '   ',
          From: '+919999999999'
        });

      expect(res.status).toBe(200);
      expect(extractIntent).not.toHaveBeenCalled();
      
      const insertTicketCall = mockQuery.mock.calls.find(c => c[0].includes('INSERT INTO tickets'));
      expect(insertTicketCall).toBeUndefined();
    });

    it('3. RANDOM / INVALID INPUT - AI failure handled safely', async () => {
      extractIntent.mockRejectedValueOnce(new Error('Gemini API Hallucination'));
      
      // Fallback intent creates a ticket anyway. Provide mock queries:
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Contacts check
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 50 }] }); // Insert contact
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 500, ref: 'JS-RND999', status: 'open' }] // Insert ticket
      });

      const res = await request(app)
        .post('/transcribe')
        .send({
          TranscriptionText: 'ajhdsfkbj',
          From: '+919999999999'
        });

      expect(res.status).toBe(200);
      const insertTicketCall = mockQuery.mock.calls.find(c => c[0].includes('INSERT INTO tickets'));
      // Wait, voice.js catches extractIntent error and gracefully skips creation without crashing
      expect(insertTicketCall).toBeUndefined();
    });

    it('4. WARD INPUT TEST - Nullifies Ward ID to prevent FK crash', async () => {
      extractIntent.mockResolvedValueOnce({
        category: 'road',
        ward: '99',
        urgency: 'low'
      });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Contact exists
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 101, ref: 'JS-RD456', status: 'open' }]
      });

      const res = await request(app)
        .post('/transcribe')
        .send({
          TranscriptionText: 'Road is broken in ward 99',
          From: '+919999999999'
        });

      const insertTicketCall = mockQuery.mock.calls.find(c => c[0].includes('INSERT INTO tickets'));
      expect(insertTicketCall).toBeDefined();
      
      // The 4th argument to the query is ward_id. We expect it to be null, preventing crash.
      const wardIdParam = insertTicketCall[1][3];
      expect(wardIdParam).toBeNull();
    });

    it('5. RESOLUTION FLOW - Twilio failure does not block DB commit', async () => {
      // Mock ticket existing
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, ref: 'JS-123', status: 'open', phone: '+919999999999' }]
      });
      // Mock ticket update
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'closed', evidence_url: 'http://foo' }]
      });

      const res = await request(app).post('/api/tickets/1/resolve');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('closed');
      
      const commitCall = mockQuery.mock.calls.find(c => c[0] === 'COMMIT');
      expect(commitCall).toBeDefined();
    });
  });
});
