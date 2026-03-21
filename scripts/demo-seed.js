const pool = require('../src/db/index');
const logger = require('../src/utils/logger');

async function seedDemoData() {
  try {
    logger.info('Starting Demo Database Seed...');

    // 1. Insert 10 wards to prevent Foreign Key crashes when AI extracts a ward
    for (let i = 1; i <= 10; i++) {
      await pool.query(`
        INSERT INTO wards (id, name) 
        VALUES ($1, $2)
        ON CONFLICT (id) DO NOTHING;
      `, [i, `Ward ${i}`]);
      
      await pool.query(`
        INSERT INTO wards (name) 
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING;
      `, [`Zone ${i}`]);
    }
    logger.info('✅ Wards seeded successfully.');

    // 2. Insert one real-looking legacy ticket to populate dashboard
    const existingTicket = await pool.query('SELECT id FROM tickets LIMIT 1');
    if (existingTicket.rows.length === 0) {
      const contactRes = await pool.query(`
        INSERT INTO contacts (phone, consent, dnd) 
        VALUES ('+919876543210', true, false) 
        RETURNING id
      `);
      const contactId = contactRes.rows[0].id;
      
      await pool.query(`
        INSERT INTO tickets (contact_id, ref, category, ward_id, severity, status, sla_deadline)
        VALUES ($1, 'JS-DEMO01', 'water', 1, 'High', 'open', NOW() + INTERVAL '12 hours')
      `, [contactId]);
      logger.info('✅ Demo Ticket created successfully.');
    } else {
      logger.info('✅ Ticket data already exists. Skipping dummy ticket.');
    }

    logger.info('🎉 Demo Setup Complete!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Demo seeding failed:', error);
    process.exit(1);
  }
}

seedDemoData();
