const pool = require('../src/db/index');
const logger = require('../src/utils/logger');

const WARDS = [
  { id: 1, name: 'Connaught Place' },
  { id: 2, name: 'Karol Bagh' },
  { id: 3, name: 'Lajpat Nagar' },
  { id: 4, name: 'Dwarka' },
  { id: 5, name: 'Rohini' },
  { id: 6, name: 'Janakpuri' },
  { id: 7, name: 'Saket' },
  { id: 8, name: 'Mayur Vihar' },
  { id: 9, name: 'Pitampura' },
  { id: 10, name: 'Nehru Place' }
];

const DEMO_TICKETS = [
  // --- OPEN (10) ---
  { ref: 'JS-A1B2C3', category: 'water', ward_id: 1, severity: 'High', status: 'open', phone: '+91XXXXX1201', summary: 'Major pipeline burst near Connaught Place inner circle causing flooding on footpath', hoursAgo: 6 },
  { ref: 'JS-D4E5F6', category: 'road', ward_id: 3, severity: 'High', status: 'open', phone: '+91XXXXX1202', summary: 'Large pothole on Lajpat Nagar main road causing vehicle accidents daily', hoursAgo: 14 },
  { ref: 'JS-G7H8I9', category: 'electricity', ward_id: 5, severity: 'High', status: 'open', phone: '+91XXXXX1203', summary: 'Transformer fault in Rohini Sector 7 causing complete power outage for 200 homes', hoursAgo: 4 },
  { ref: 'JS-J1K2L3', category: 'sanitation', ward_id: 2, severity: 'High', status: 'open', phone: '+91XXXXX1204', summary: 'Garbage pileup outside Karol Bagh metro station attracting stray dogs and rats', hoursAgo: 18 },
  { ref: 'JS-M4N5O6', category: 'water', ward_id: 8, severity: 'Medium', status: 'open', phone: '+91XXXXX1205', summary: 'Low water pressure in Mayur Vihar Phase 2 for the past three days', hoursAgo: 30 },
  { ref: 'JS-P7Q8R9', category: 'road', ward_id: 4, severity: 'Medium', status: 'open', phone: '+91XXXXX1206', summary: 'Road surface cracked near Dwarka Sector 12 school — children at risk', hoursAgo: 22 },
  { ref: 'JS-S1T2U3', category: 'electricity', ward_id: 6, severity: 'Medium', status: 'open', phone: '+91XXXXX1207', summary: 'Three street lights not working on Janakpuri C-Block main road since one week', hoursAgo: 50 },
  { ref: 'JS-V4W5X6', category: 'sanitation', ward_id: 9, severity: 'Low', status: 'open', phone: '+91XXXXX1208', summary: 'Overflowing community dustbin near Pitampura D-Block park needs larger bin', hoursAgo: 40 },
  { ref: 'JS-Y7Z8A9', category: 'other', ward_id: 10, severity: 'Low', status: 'open', phone: '+91XXXXX1209', summary: 'Stray cattle blocking Nehru Place service lane every morning during rush hour', hoursAgo: 28 },
  { ref: 'JS-B1C2D3', category: 'water', ward_id: 7, severity: 'Medium', status: 'open', phone: '+91XXXXX1210', summary: 'Continuous water leakage from overhead tank valve in Saket J-Block colony', hoursAgo: 12 },

  // --- CLOSED (15) ---
  { ref: 'JS-E4F5G6', category: 'road', ward_id: 1, severity: 'High', status: 'closed', phone: '+91XXXXX1211', summary: 'Pothole near Connaught Place Rajiv Chowk underpass patched by PWD team', hoursAgo: 72, resolutionHours: 4 },
  { ref: 'JS-H7I8J9', category: 'water', ward_id: 2, severity: 'Medium', status: 'closed', phone: '+91XXXXX1212', summary: 'Water supply restored in Karol Bagh after valve repair by Jal Board', hoursAgo: 96, resolutionHours: 6 },
  { ref: 'JS-K1L2M3', category: 'electricity', ward_id: 3, severity: 'High', status: 'closed', phone: '+91XXXXX1213', summary: 'Power restored in Lajpat Nagar Block H after transformer replacement', hoursAgo: 60, resolutionHours: 3 },
  { ref: 'JS-N4O5P6', category: 'sanitation', ward_id: 4, severity: 'Medium', status: 'closed', phone: '+91XXXXX1214', summary: 'Garbage cleared from Dwarka Sector 6 market lane by MCD sanitation crew', hoursAgo: 80, resolutionHours: 5 },
  { ref: 'JS-Q7R8S9', category: 'road', ward_id: 5, severity: 'Low', status: 'closed', phone: '+91XXXXX1215', summary: 'Speed breaker painted and marked properly near Rohini Sector 3 school', hoursAgo: 120, resolutionHours: 2 },
  { ref: 'JS-T1U2V3', category: 'water', ward_id: 6, severity: 'High', status: 'closed', phone: '+91XXXXX1216', summary: 'Emergency pipeline repair completed in Janakpuri A-Block within SLA', hoursAgo: 48, resolutionHours: 4 },
  { ref: 'JS-W4X5Y6', category: 'electricity', ward_id: 7, severity: 'Medium', status: 'closed', phone: '+91XXXXX1217', summary: 'Street light controller replaced in Saket G-Block restoring night lighting', hoursAgo: 88, resolutionHours: 6 },
  { ref: 'JS-Z7A8B9', category: 'sanitation', ward_id: 8, severity: 'High', status: 'closed', phone: '+91XXXXX1218', summary: 'Drain desilting completed in Mayur Vihar Phase 1 preventing monsoon flooding', hoursAgo: 55, resolutionHours: 5 },
  { ref: 'JS-C1D2E3', category: 'other', ward_id: 9, severity: 'Low', status: 'closed', phone: '+91XXXXX1219', summary: 'Broken park bench repaired in Pitampura community park after resident complaint', hoursAgo: 100, resolutionHours: 3 },
  { ref: 'JS-F4G5H6', category: 'road', ward_id: 10, severity: 'Medium', status: 'closed', phone: '+91XXXXX1220', summary: 'Road resurfacing completed on Nehru Place to Kalkaji connecting road', hoursAgo: 110, resolutionHours: 5 },
  { ref: 'JS-I7J8K9', category: 'water', ward_id: 1, severity: 'High', status: 'closed', phone: '+91XXXXX1221', summary: 'Water tanker dispatched to Connaught Place area during supply disruption', hoursAgo: 36, resolutionHours: 2 },
  { ref: 'JS-L1M2N3', category: 'electricity', ward_id: 4, severity: 'Medium', status: 'closed', phone: '+91XXXXX1222', summary: 'Faulty meter replaced in Dwarka Sector 10 resolving billing dispute', hoursAgo: 65, resolutionHours: 4 },
  { ref: 'JS-O4P5Q6', category: 'sanitation', ward_id: 3, severity: 'High', status: 'closed', phone: '+91XXXXX1223', summary: 'Sewage overflow in Lajpat Nagar Lane 3 fixed by emergency plumbing team', hoursAgo: 42, resolutionHours: 3 },
  { ref: 'JS-R7S8T9', category: 'other', ward_id: 5, severity: 'Low', status: 'closed', phone: '+91XXXXX1224', summary: 'Noise complaint addressed — late night construction in Rohini halted by authorities', hoursAgo: 130, resolutionHours: 6 },
  { ref: 'JS-U1V2W3', category: 'road', ward_id: 8, severity: 'Medium', status: 'closed', phone: '+91XXXXX1225', summary: 'Waterlogged stretch on Mayur Vihar main road drained after heavy rainfall', hoursAgo: 70, resolutionHours: 4 }
];

async function seedDemoData() {
  const client = await pool.connect();
  try {
    logger.info('Starting Demo Database Seed...');

    // 1. Insert wards
    for (const ward of WARDS) {
      await client.query(
        `INSERT INTO wards (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [ward.id, ward.name]
      );
    }
    logger.info('✅ 10 Delhi wards seeded successfully.');

    // 2. Insert demo tickets
    let inserted = 0;
    for (const t of DEMO_TICKETS) {
      const createdAt = new Date(Date.now() - t.hoursAgo * 3600000);
      const closedAt = t.status === 'closed' && t.resolutionHours
        ? new Date(createdAt.getTime() + t.resolutionHours * 3600000)
        : null;
      const slaHours = t.severity === 'High' ? 12 : t.severity === 'Medium' ? 24 : 48;
      const slaDeadline = new Date(createdAt.getTime() + slaHours * 3600000);

      // Upsert contact
      const contactRes = await client.query(
        `INSERT INTO contacts (phone, consent, dnd)
         VALUES ($1, true, false)
         ON CONFLICT (phone) DO UPDATE SET consent = true
         RETURNING id`,
        [t.phone]
      );
      const contactId = contactRes.rows[0].id;

      // Insert ticket (skip if ref already exists)
      const existing = await client.query('SELECT id FROM tickets WHERE ref = $1', [t.ref]);
      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO tickets (contact_id, ref, category, ward_id, severity, status, sla_deadline, created_at, closed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [contactId, t.ref, t.category, t.ward_id, t.severity, t.status, slaDeadline, createdAt, closedAt]
        );
        inserted++;
      }
    }
    logger.info(`✅ ${inserted} demo tickets seeded (${DEMO_TICKETS.length - inserted} already existed).`);

    // 3. Report final count
    const countRes = await client.query('SELECT COUNT(*)::int AS total FROM tickets');
    logger.info(`📊 Total tickets in database: ${countRes.rows[0].total}`);

    logger.info('🎉 Demo Setup Complete!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Demo seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedDemoData();
