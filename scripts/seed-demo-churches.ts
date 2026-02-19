/**
 * Seed Demo Churches for Promotional Materials
 * Run with: npx tsx scripts/seed-demo-churches.ts
 * Delete with: npx tsx scripts/seed-demo-churches.ts --delete
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

// Demo churches data - realistic looking for promo materials
const demoChurches = [
  // Protestant - Baptist
  {
    name: 'Grace Baptist Church',
    slug: 'demo-grace-baptist-sf',
    description: 'A warm and welcoming Baptist community dedicated to sharing the love of Christ through authentic worship, biblical teaching, and meaningful fellowship.',
    denomination: 'Baptist',
    city: 'San Francisco',
    state: 'CA',
    address: '1234 Mission Street',
    zipCode: '94110',
    congregationSize: 450,
    mission: 'To glorify God by making disciples who love God, love people, and serve the world.',
    serviceTimes: 'Sunday: 9:00 AM, 11:00 AM | Wednesday: 7:00 PM',
    showPhone: true,
    showAddress: true,
  },
  {
    name: 'First Baptist Church of Oakland',
    slug: 'demo-first-baptist-oakland',
    description: 'Serving the Oakland community for over 100 years with the unchanging message of God\'s grace and love.',
    denomination: 'First Baptist',
    city: 'Oakland',
    state: 'CA',
    address: '567 Broadway',
    zipCode: '94607',
    congregationSize: 800,
    mission: 'Reaching Oakland with the hope of Jesus Christ.',
    serviceTimes: 'Sunday: 8:30 AM, 10:30 AM, 6:00 PM',
    showPhone: true,
    showAddress: true,
  },
  // Protestant - Non-Denominational
  {
    name: 'The Gathering Church',
    slug: 'demo-gathering-church-sf',
    description: 'A contemporary, multi-generational church focused on creating an environment where people can encounter God and grow in their faith journey.',
    denomination: 'Non-Denominational',
    city: 'San Francisco',
    state: 'CA',
    address: '890 Market Street',
    zipCode: '94102',
    congregationSize: 1200,
    mission: 'Helping people find and follow Jesus.',
    serviceTimes: 'Sunday: 9:00 AM, 11:00 AM, 5:00 PM',
    showPhone: true,
    showAddress: true,
  },
  {
    name: 'New Life Community Church',
    slug: 'demo-new-life-berkeley',
    description: 'A diverse community of believers passionate about worship, discipleship, and community outreach in the Berkeley area.',
    denomination: 'Non-Denominational',
    city: 'Berkeley',
    state: 'CA',
    address: '234 University Ave',
    zipCode: '94704',
    congregationSize: 350,
    mission: 'Transforming lives through the power of the Gospel.',
    serviceTimes: 'Sunday: 10:00 AM | Thursday: 7:00 PM',
    showPhone: true,
    showAddress: true,
  },
  // Protestant - Evangelical
  {
    name: 'Cornerstone Evangelical Church',
    slug: 'demo-cornerstone-evangelical',
    description: 'Rooted in Scripture, focused on Jesus, and committed to equipping believers for ministry and mission.',
    denomination: 'Evangelical',
    city: 'San Jose',
    state: 'CA',
    address: '456 Santa Clara Street',
    zipCode: '95113',
    congregationSize: 600,
    mission: 'Building lives on the solid foundation of God\'s Word.',
    serviceTimes: 'Sunday: 9:30 AM, 11:15 AM',
    showPhone: true,
    showAddress: true,
  },
  // Protestant - Presbyterian
  {
    name: 'Westminster Presbyterian Church',
    slug: 'demo-westminster-pres',
    description: 'A Reformed congregation committed to the historic Christian faith, thoughtful preaching, and Christ-centered community.',
    denomination: 'Presbyterian',
    city: 'Palo Alto',
    state: 'CA',
    address: '789 El Camino Real',
    zipCode: '94301',
    congregationSize: 280,
    mission: 'Glorifying God and enjoying Him forever.',
    serviceTimes: 'Sunday: 10:30 AM | Wednesday: 6:30 PM',
    showPhone: true,
    showAddress: true,
  },
  // Protestant - Lutheran
  {
    name: 'Christ Lutheran Church',
    slug: 'demo-christ-lutheran',
    description: 'A liturgical community celebrating God\'s grace through Word and Sacrament in the Lutheran tradition.',
    denomination: 'Lutheran',
    city: 'San Mateo',
    state: 'CA',
    address: '321 B Street',
    zipCode: '94401',
    congregationSize: 180,
    mission: 'Proclaiming Christ crucified and risen for the forgiveness of sins.',
    serviceTimes: 'Sunday: 8:00 AM (Traditional), 10:30 AM (Contemporary)',
    showPhone: true,
    showAddress: true,
  },
  // Protestant - Pentecostal
  {
    name: 'Living Water Assembly of God',
    slug: 'demo-living-water-ag',
    description: 'A Spirit-filled community experiencing God\'s presence through dynamic worship, powerful prayer, and supernatural ministry.',
    denomination: 'Assembly of God',
    city: 'Fremont',
    state: 'CA',
    address: '555 Mowry Ave',
    zipCode: '94538',
    congregationSize: 520,
    mission: 'Empowering believers to live Spirit-led lives.',
    serviceTimes: 'Sunday: 10:00 AM, 6:00 PM | Friday: 7:30 PM (Prayer)',
    showPhone: true,
    showAddress: true,
  },
  // Catholic
  {
    name: 'St. Patrick\'s Catholic Church',
    slug: 'demo-st-patricks-catholic',
    description: 'A vibrant Catholic parish offering daily Mass, confession, and a rich sacramental life in the heart of San Francisco.',
    denomination: 'Roman Catholic',
    city: 'San Francisco',
    state: 'CA',
    address: '756 Mission Street',
    zipCode: '94103',
    congregationSize: 2500,
    mission: 'Bringing souls to Christ through the sacraments of the Catholic Church.',
    serviceTimes: 'Daily Mass: 7:30 AM, 12:10 PM | Sunday: 7:30 AM, 9:00 AM, 10:30 AM, 12:00 PM, 5:30 PM',
    showPhone: true,
    showAddress: true,
  },
  {
    name: 'Our Lady of Guadalupe Parish',
    slug: 'demo-our-lady-guadalupe',
    description: 'A welcoming bilingual Catholic community celebrating our faith through traditional devotions and contemporary outreach.',
    denomination: 'Catholic',
    city: 'San Jose',
    state: 'CA',
    address: '2020 E San Antonio Street',
    zipCode: '95116',
    congregationSize: 1800,
    mission: 'United in faith, serving our community with love.',
    serviceTimes: 'Sunday: 8:00 AM (English), 10:00 AM (Spanish), 12:00 PM (Bilingual)',
    showPhone: true,
    showAddress: true,
  },
  // Orthodox
  {
    name: 'Holy Trinity Greek Orthodox Cathedral',
    slug: 'demo-holy-trinity-orthodox',
    description: 'The Greek Orthodox Cathedral of San Francisco, preserving the ancient Christian faith through beautiful liturgy and sacred tradition.',
    denomination: 'Greek Orthodox',
    city: 'San Francisco',
    state: 'CA',
    address: '999 Brotherhood Way',
    zipCode: '94132',
    congregationSize: 650,
    mission: 'Preserving and sharing the Orthodox Christian faith.',
    serviceTimes: 'Sunday: Divine Liturgy 10:00 AM | Saturday: Vespers 5:00 PM',
    showPhone: true,
    showAddress: true,
  },
  {
    name: 'St. Nicholas Antiochian Orthodox Church',
    slug: 'demo-st-nicholas-antiochian',
    description: 'An English-speaking Orthodox parish rooted in the ancient Antiochian tradition, welcoming seekers and believers alike.',
    denomination: 'Antiochian Orthodox',
    city: 'San Jose',
    state: 'CA',
    address: '1234 Jackson Street',
    zipCode: '95112',
    congregationSize: 220,
    mission: 'Bringing the ancient faith to the modern world.',
    serviceTimes: 'Sunday: Matins 9:00 AM, Divine Liturgy 10:00 AM',
    showPhone: true,
    showAddress: true,
  },
  // More Protestant varieties
  {
    name: 'Vineyard Church of the Bay',
    slug: 'demo-vineyard-bay',
    description: 'A charismatic community pursuing the presence of God through intimate worship, healing prayer, and compassionate ministry.',
    denomination: 'Vineyard',
    city: 'Daly City',
    state: 'CA',
    address: '678 Westlake Ave',
    zipCode: '94015',
    congregationSize: 380,
    mission: 'Pursuing God\'s presence and practicing His kingdom.',
    serviceTimes: 'Sunday: 10:30 AM | Wednesday: 7:00 PM (Worship Night)',
    showPhone: true,
    showAddress: true,
  },
  {
    name: 'Redeemer Anglican Church',
    slug: 'demo-redeemer-anglican',
    description: 'A liturgical Anglican congregation blending ancient worship with contemporary mission in the Reformed Episcopal tradition.',
    denomination: 'Anglican',
    city: 'Walnut Creek',
    state: 'CA',
    address: '1500 Main Street',
    zipCode: '94596',
    congregationSize: 290,
    mission: 'Ancient faith, modern mission.',
    serviceTimes: 'Sunday: 8:00 AM (Rite I), 10:30 AM (Rite II)',
    showPhone: true,
    showAddress: true,
  },
  {
    name: 'Bay Area Bible Church',
    slug: 'demo-bay-area-bible',
    description: 'A verse-by-verse teaching church committed to expository preaching and building mature disciples of Jesus Christ.',
    denomination: 'Bible Church',
    city: 'Concord',
    state: 'CA',
    address: '2345 Clayton Road',
    zipCode: '94521',
    congregationSize: 410,
    mission: 'Teaching the whole counsel of God.',
    serviceTimes: 'Sunday: 9:00 AM (Sunday School), 10:30 AM (Worship)',
    showPhone: true,
    showAddress: true,
  },
];

async function seedDemoChurches() {
  console.info('Seeding demo churches...\n');

  // Use admin user ID 19 (from logs)
  const adminUserId = 19;

  for (const church of demoChurches) {
    try {
      await sql`
        INSERT INTO organizations (
          name, slug, description, admin_user_id, denomination,
          city, state, address, zip_code, congregation_size,
          mission, service_times, show_phone, show_address, created_at
        ) VALUES (
          ${church.name},
          ${church.slug},
          ${church.description},
          ${adminUserId},
          ${church.denomination},
          ${church.city},
          ${church.state},
          ${church.address},
          ${church.zipCode},
          ${church.congregationSize},
          ${church.mission},
          ${church.serviceTimes},
          ${church.showPhone},
          ${church.showAddress},
          NOW()
        )
        ON CONFLICT (slug) DO NOTHING
      `;
      console.info(`  ✓ Created: ${church.name}`);
    } catch (error: any) {
      console.error(`  ✗ Failed to create ${church.name}:`, error.message);
    }
  }

  console.info('\nDemo churches seeded successfully!');
  console.info('To delete them later, run: npx tsx scripts/seed-demo-churches.ts --delete');
}

async function deleteDemoChurches() {
  console.info('Deleting demo churches...\n');

  const slugs = demoChurches.map(c => c.slug);

  try {
    const result = await sql`
      DELETE FROM organizations
      WHERE slug = ANY(${slugs})
      RETURNING name
    `;

    for (const row of result) {
      console.info(`  ✓ Deleted: ${row.name}`);
    }

    console.info(`\nDeleted ${result.length} demo churches.`);
  } catch (error: any) {
    console.error('Error deleting demo churches:', error.message);
  }
}

// Main
const args = process.argv.slice(2);
if (args.includes('--delete')) {
  deleteDemoChurches();
} else {
  seedDemoChurches();
}
