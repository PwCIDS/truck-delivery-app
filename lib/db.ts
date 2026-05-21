import { neon } from '@neondatabase/serverless';

export function getDbClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

export async function initDatabase() {
  const sql = getDbClient();

  // Create trucks table
  await sql`
    CREATE TABLE IF NOT EXISTS trucks (
      id SERIAL PRIMARY KEY,
      number VARCHAR(50) NOT NULL,
      plate VARCHAR(50) NOT NULL,
      capacity INTEGER NOT NULL,
      purchase_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create customers table
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(200) NOT NULL,
      address TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL,
      contact VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create deliveries table
  await sql`
    CREATE TABLE IF NOT EXISTS deliveries (
      id SERIAL PRIMARY KEY,
      truck_id INTEGER REFERENCES trucks(id) ON DELETE RESTRICT,
      customer_id INTEGER REFERENCES customers(id) ON DELETE RESTRICT,
      start_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_date DATE NOT NULL,
      end_time TIME NOT NULL,
      destinations TEXT[] NOT NULL,
      cargo TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'scheduled',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log('Database tables initialized successfully');
}

export async function seedDatabase() {
  const sql = getDbClient();

  // Check if data already exists
  const existingTrucks = await sql`SELECT COUNT(*) FROM trucks`;
  if (existingTrucks[0].count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Insert sample trucks
  await sql`
    INSERT INTO trucks (number, plate, capacity, purchase_date, status)
    VALUES
      ('T-001', '品川 500 あ 1234', 2000, '2023-01-15', 'available'),
      ('T-002', '品川 500 あ 5678', 3000, '2023-03-20', 'available'),
      ('T-003', '品川 500 い 9012', 4000, '2023-06-10', 'available')
  `;

  // Insert sample customers
  await sql`
    INSERT INTO customers (code, name, address, phone, contact)
    VALUES
      ('C-001', '株式会社サンプル商事', '東京都千代田区丸の内1-1-1', '03-1234-5678', '山田太郎'),
      ('C-002', '有限会社テスト物産', '神奈川県横浜市西区みなとみらい2-2-2', '045-9876-5432', '佐藤花子'),
      ('C-003', 'デモ株式会社', '大阪府大阪市北区梅田3-3-3', '06-5555-1111', '鈴木一郎')
  `;

  // Insert sample deliveries
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  await sql`
    INSERT INTO deliveries (truck_id, customer_id, start_date, start_time, end_date, end_time, destinations, cargo, status)
    VALUES
      (1, 1, ${today}, '09:00', ${today}, '17:00', ARRAY['東京都千代田区'], '電化製品 500kg', 'inprogress'),
      (2, 2, ${tomorrowStr}, '08:00', ${dayAfterStr}, '18:00', ARRAY['神奈川県横浜市', '静岡県静岡市'], '食品 800kg', 'scheduled')
  `;

  console.log('Database seeded successfully');
}
