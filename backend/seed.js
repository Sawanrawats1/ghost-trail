// seed.js — Populates the ghosttrail database with 15 realistic sample trails.
// Run from the backend/ folder:
//   node seed.js
//
// NOTE: This assumes your .env has a MongoDB connection string variable.
// If your server.js uses a different variable name than MONGO_URI
// (e.g. MONGODB_URI, DB_URI, ATLAS_URI), update the process.env line below
// to match before running.

require('dotenv').config();
const mongoose = require('mongoose');
const Trail = require('./models/Trail');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;

if (!MONGO_URI) {
  console.error('❌ Could not find a Mongo connection string in .env (checked MONGO_URI, MONGODB_URI, DB_URI).');
  console.error('   Open server.js, find your mongoose.connect(...) call, and set the matching env var name at the top of this file.');
  process.exit(1);
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const trails = [
  {
    name: 'Hidden Falls near Kanatal',
    location: 'Kanatal, Tehri Garhwal',
    type: 'waterfall',
    difficulty: 'moderate',
    description: 'A three-tier waterfall tucked behind a pine ridge, missed by most maps.',
    story: 'Found this by accident while looking for a shortcut back to the village. The sound gave it away before I saw it.',
    challenges: 'No signal after the pine fork. Last 200m is a steep scramble over wet rock.',
    waypoints: [
      { order: 1, title: 'Kanatal bus stand', description: 'Start from the old bus stand, take the dirt trail heading north past the apple orchard.', lat: 30.3665, lng: 78.2360 },
      { order: 2, title: 'Pine fork', description: 'Trail splits at a large pine — take the left, narrower path downhill.', lat: 30.3702, lng: 78.2318 },
      { order: 3, title: 'Waterfall base', description: 'You will hear it before you see it. Rocks are slippery near the pool.', lat: 30.3730, lng: 78.2290 }
    ],
    comments: [
      { text: 'Visited today, still accessible, beautiful clear path', author: 'Rohan Mehta', date: daysAgo(2), nlpRisk: 'clear', nlpConfidence: 0.82, hazardKeywords: [] },
      { text: 'Bit slippery near the pool but manageable', author: 'Priya Sharma', date: daysAgo(15), nlpRisk: 'caution', nlpConfidence: 0.65, hazardKeywords: ['slippery'] }
    ],
    lastConfirmedDate: daysAgo(2),
    createdBy: 'Rohan Mehta',
    totalVisitors: 34
  },
  {
    name: 'Silver Lake Above Chopta',
    location: 'Chopta, Rudraprayag',
    type: 'lake',
    difficulty: 'hard',
    description: 'A glacial lake above the tree line, only visible in late spring after snowmelt.',
    story: 'A shepherd pointed us toward it. Took two attempts — first time we turned back due to weather.',
    challenges: 'Altitude sickness risk above 3,800m. No cover from wind in the last stretch.',
    waypoints: [
      { order: 1, title: 'Chopta meadow trailhead', description: 'Begin at the forest check-post, follow the ridge trail east.', lat: 30.4988, lng: 79.1897 },
      { order: 2, title: 'Tree line marker', description: 'Last tree cover before open ridge — rest here.', lat: 30.5102, lng: 79.1955 },
      { order: 3, title: 'Silver Lake', description: 'Lake sits in a small bowl, easy to miss from above.', lat: 30.5210, lng: 79.2010 }
    ],
    comments: [
      { text: 'Amazing place, path is visible and well marked most of the way', author: 'Aditya Rawat', date: daysAgo(10), nlpRisk: 'clear', nlpConfidence: 0.78, hazardKeywords: [] },
      { text: 'Trail collapsed near waypoint 2 after the landslide last month, dangerous', author: 'Visitor', date: daysAgo(20), nlpRisk: 'needs_review', nlpConfidence: 0.92, hazardKeywords: ['collapsed', 'landslide', 'dangerous'] }
    ],
    lastConfirmedDate: daysAgo(20),
    createdBy: 'Aditya Rawat',
    totalVisitors: 12
  },
  {
    name: 'Bat Wing Cave',
    location: 'Mukteshwar, Nainital',
    type: 'cave',
    difficulty: 'moderate',
    description: 'A limestone cave system with a narrow entrance, locally known only by name.',
    story: 'Local kids showed us the entrance behind the old temple ruins.',
    challenges: 'Entrance is easy to miss — overgrown with bushes. Bring a torch, no light inside.',
    waypoints: [
      { order: 1, title: 'Old temple ruins', description: 'Start behind the ruins, follow the goat trail downhill.', lat: 29.4750, lng: 79.6480 },
      { order: 2, title: 'Cave entrance', description: 'Entrance is a narrow gap behind thick bushes, easy to walk past.', lat: 29.4771, lng: 79.6502 }
    ],
    comments: [
      { text: 'Path exists but needs clearing, some overgrowth near the entrance', author: 'Karan Bisht', date: daysAgo(45), nlpRisk: 'caution', nlpConfidence: 0.62, hazardKeywords: ['needs clearing', 'overgrowth'] },
      { text: 'Great experience, safe trail, found it easily', author: 'Visitor', date: daysAgo(5), nlpRisk: 'clear', nlpConfidence: 0.80, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(5),
    createdBy: 'Karan Bisht',
    totalVisitors: 8
  },
  {
    name: 'Whispering Meadow',
    location: 'Dayara Bugyal, Uttarkashi',
    type: 'meadow',
    difficulty: 'easy',
    description: 'A quiet alpine meadow away from the main Dayara trail, rarely crowded.',
    story: 'We wandered off the main path during a school trip and never told anyone until now.',
    challenges: 'Easy to get turned around in fog — no clear landmarks in the meadow itself.',
    waypoints: [
      { order: 1, title: 'Barsu village', description: 'Start from Barsu, take the left fork instead of the main Dayara trail.', lat: 30.7891, lng: 78.4523 },
      { order: 2, title: 'Meadow entrance', description: 'Open field appears after a short pine climb.', lat: 30.7940, lng: 78.4570 }
    ],
    comments: [
      { text: 'Perfect condition, highly recommend, easy to navigate', author: 'Simran Kaur', date: daysAgo(1), nlpRisk: 'clear', nlpConfidence: 0.85, hazardKeywords: [] },
      { text: 'Confirmed working trail, still there', author: 'Visitor', date: daysAgo(30), nlpRisk: 'clear', nlpConfidence: 0.75, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(1),
    createdBy: 'Simran Kaur',
    totalVisitors: 21
  },
  {
    name: 'Blue Pool River Crossing',
    location: 'Sangam, Devprayag outskirts',
    type: 'river',
    difficulty: 'hard',
    description: 'A deep, clear river pool with a natural rock diving point.',
    story: 'Locals use it in summer but tourists rarely find it since it is not on the main ghat road.',
    challenges: 'River crossing is waist-deep in monsoon season, avoid July-August.',
    waypoints: [
      { order: 1, title: 'Ghat road turnoff', description: 'Take the unmarked dirt path just past the last chai stall.', lat: 30.1487, lng: 78.5987 },
      { order: 2, title: 'River pool', description: 'Path opens directly onto the rocks above the pool.', lat: 30.1502, lng: 78.6010 }
    ],
    comments: [
      { text: 'Flooded river, couldn\'t cross, avoid until winter', author: 'Deepak Negi', date: daysAgo(60), nlpRisk: 'needs_review', nlpConfidence: 0.88, hazardKeywords: ['flooded'] },
      { text: 'Visited this morning, excellent condition, water was clear', author: 'Visitor', date: daysAgo(3), nlpRisk: 'clear', nlpConfidence: 0.90, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(3),
    createdBy: 'Deepak Negi',
    totalVisitors: 17
  },
  {
    name: 'Crow\'s Nest Summit',
    location: 'Nag Tibba range',
    type: 'summit',
    difficulty: 'hard',
    description: 'A minor peak beside the main Nag Tibba trail, offering a quieter 360° view.',
    story: 'We split off from the main summit trail after camp, reached this ridge instead.',
    challenges: 'Steep section near the top, loose scree underfoot.',
    waypoints: [
      { order: 1, title: 'Nag Tibba base camp', description: 'From the campsite, follow the ridge trail away from the main summit path.', lat: 30.5230, lng: 78.2775 },
      { order: 2, title: 'Steep section', description: 'Loose scree — go slow, use hands where needed.', lat: 30.5265, lng: 78.2810 },
      { order: 3, title: 'Summit point', description: 'Flat rock outcrop, room for 4-5 people.', lat: 30.5290, lng: 78.2840 }
    ],
    comments: [
      { text: 'Slightly overgrown but manageable, worth the detour', author: 'Vikram Chauhan', date: daysAgo(25), nlpRisk: 'caution', nlpConfidence: 0.60, hazardKeywords: ['overgrown'] },
      { text: 'Well marked and easy to follow, stunning waterfall view of the valley', author: 'Visitor', date: daysAgo(8), nlpRisk: 'clear', nlpConfidence: 0.79, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(8),
    createdBy: 'Vikram Chauhan',
    totalVisitors: 29
  },
  {
    name: 'Owl Rock Overhang',
    location: 'Landour outskirts, Mussoorie',
    type: 'other',
    difficulty: 'easy',
    description: 'A natural rock overhang used historically as a shelter, with old carvings.',
    story: 'A retired forest guard told us about it during a random conversation at a tea stall.',
    challenges: 'Trail forks twice — easy to take the wrong path if not paying attention.',
    waypoints: [
      { order: 1, title: 'Landour clock tower', description: 'Start near the clock tower, head down the forest service road.', lat: 30.4580, lng: 78.0805 },
      { order: 2, title: 'Second fork', description: 'Take the right path at the second fork — left leads to a dead end.', lat: 30.4605, lng: 78.0830 },
      { order: 3, title: 'Rock overhang', description: 'Overhang is set back from the trail, look for the carved markings.', lat: 30.4620, lng: 78.0850 }
    ],
    comments: [
      { text: 'Path unclear at the fork, took the wrong turn once', author: 'Anjali Bhatt', date: daysAgo(40), nlpRisk: 'caution', nlpConfidence: 0.58, hazardKeywords: ['unclear'] },
      { text: 'Visited today, good condition, easy to follow with the notes here', author: 'Visitor', date: daysAgo(4), nlpRisk: 'clear', nlpConfidence: 0.77, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(4),
    createdBy: 'Anjali Bhatt',
    totalVisitors: 11
  },
  {
    name: 'Emerald Step Falls',
    location: 'Sari village, Deoriatal route',
    type: 'waterfall',
    difficulty: 'moderate',
    description: 'A stepped waterfall cascading over moss-covered rock terraces.',
    story: 'Discovered while looking for a shortcut to Deoriatal, ended up staying here longer than planned.',
    challenges: 'One fallen branch blocks part of the path after storms — climbable but awkward with a backpack.',
    waypoints: [
      { order: 1, title: 'Sari village start', description: 'Begin near the last homestay, follow the stream uphill.', lat: 30.6210, lng: 79.2865 },
      { order: 2, title: 'Falls base', description: 'Terraced falls visible from the stream bend.', lat: 30.6235, lng: 79.2890 }
    ],
    comments: [
      { text: 'One fallen branch on trail, otherwise fine', author: 'Nikhil Rana', date: daysAgo(18), nlpRisk: 'caution', nlpConfidence: 0.63, hazardKeywords: ['fallen branch'] },
      { text: 'Great condition, path is clear and well defined', author: 'Visitor', date: daysAgo(6), nlpRisk: 'clear', nlpConfidence: 0.81, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(6),
    createdBy: 'Nikhil Rana',
    totalVisitors: 19
  },
  {
    name: 'Turquoise Tal',
    location: 'Above Sattal, Nainital',
    type: 'lake',
    difficulty: 'easy',
    description: 'A small, rarely-visited lake surrounded by oak forest above the main Sattal complex.',
    story: 'Birdwatchers use this route occasionally but it is not marked on any tourist map.',
    challenges: 'Trail can get confusing near the oak grove — multiple similar-looking paths.',
    waypoints: [
      { order: 1, title: 'Sattal boat club', description: 'Start behind the boat club, take the uphill forest trail.', lat: 29.3660, lng: 79.5310 },
      { order: 2, title: 'Oak grove', description: 'Multiple paths here — stay left, following the ridge line.', lat: 29.3690, lng: 79.5340 },
      { order: 3, title: 'Turquoise Tal', description: 'Lake appears suddenly after the last climb.', lat: 29.3715, lng: 79.5365 }
    ],
    comments: [
      { text: 'Confusing near the oak grove, got a bit lost but found it eventually', author: 'Meera Joshi', date: daysAgo(35), nlpRisk: 'caution', nlpConfidence: 0.61, hazardKeywords: ['confusing'] },
      { text: 'Stunning waterfall— sorry, lake, easy hike overall', author: 'Visitor', date: daysAgo(9), nlpRisk: 'clear', nlpConfidence: 0.74, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(9),
    createdBy: 'Meera Joshi',
    totalVisitors: 14
  },
  {
    name: 'Hollow Rock Cave',
    location: 'Binsar Wildlife Sanctuary edge',
    type: 'cave',
    difficulty: 'hard',
    description: 'A deep cave system on the sanctuary boundary, requires permission to access.',
    story: 'A forest department contact walked us there after we asked about local caves.',
    challenges: 'Road blocked by construction near the sanctuary gate as of last report — check before going.',
    waypoints: [
      { order: 1, title: 'Sanctuary boundary gate', description: 'Check in at the gate, then follow the marked boundary trail.', lat: 29.7080, lng: 79.7360 },
      { order: 2, title: 'Cave mouth', description: 'Cave entrance is behind a large boulder, easy to miss.', lat: 29.7105, lng: 79.7390 }
    ],
    comments: [
      { text: 'Road blocked by construction, avoid this route for now', author: 'Suresh Pant', date: daysAgo(70), nlpRisk: 'needs_review', nlpConfidence: 0.90, hazardKeywords: ['road blocked', 'construction', 'avoid'] },
      { text: 'Path exists but needs clearing near the boundary gate', author: 'Visitor', date: daysAgo(50), nlpRisk: 'caution', nlpConfidence: 0.60, hazardKeywords: ['needs clearing'] }
    ],
    lastConfirmedDate: daysAgo(50),
    createdBy: 'Suresh Pant',
    totalVisitors: 6
  },
  {
    name: 'Cloud Meadow Camp',
    location: 'Above Munsiyari',
    type: 'meadow',
    difficulty: 'moderate',
    description: 'A high meadow with panoramic Panchachuli peak views, used occasionally by shepherds.',
    story: 'Followed shepherd tracks uphill from the main Munsiyari viewpoint trail.',
    challenges: 'Weather changes fast at this altitude — clear skies can turn foggy within an hour.',
    waypoints: [
      { order: 1, title: 'Munsiyari viewpoint', description: 'Start from the main viewpoint, head off-trail uphill following shepherd tracks.', lat: 30.0658, lng: 80.2350 },
      { order: 2, title: 'Cloud Meadow', description: 'Open meadow appears after roughly 45 minutes of climbing.', lat: 30.0690, lng: 80.2385 }
    ],
    comments: [
      { text: 'Visited today, still accessible, clear path all the way', author: 'Tara Fartyal', date: daysAgo(0), nlpRisk: 'clear', nlpConfidence: 0.83, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(0),
    createdBy: 'Tara Fartyal',
    totalVisitors: 5
  },
  {
    name: 'Twin Rock River Bend',
    location: 'Below Auli, Chamoli',
    type: 'river',
    difficulty: 'easy',
    description: 'A calm river bend framed by two large twin boulders, popular with local families.',
    story: 'A well-known local spot but almost never mentioned to outside visitors.',
    challenges: 'Some mud on the path, bit slippery after rain.',
    waypoints: [
      { order: 1, title: 'Auli ropeway base', description: 'From the ropeway base station, walk downhill along the service road.', lat: 30.5290, lng: 79.5660 },
      { order: 2, title: 'Twin rocks', description: 'River bend marked by two large boulders side by side.', lat: 30.5310, lng: 79.5690 }
    ],
    comments: [
      { text: 'Some mud on path, bit slippery near the rocks', author: 'Ishaan Verma', date: daysAgo(12), nlpRisk: 'caution', nlpConfidence: 0.60, hazardKeywords: ['mud', 'slippery'] },
      { text: 'Visited today, fresh, good condition overall', author: 'Visitor', date: daysAgo(2), nlpRisk: 'clear', nlpConfidence: 0.76, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(2),
    createdBy: 'Ishaan Verma',
    totalVisitors: 23
  },
  {
    name: 'Ridge Point Lookout',
    location: 'Above Kausani',
    type: 'summit',
    difficulty: 'easy',
    description: 'A short ridge walk to a lookout point with an uninterrupted Himalayan skyline view.',
    story: 'Stumbled onto this while walking past the tea estate one evening.',
    challenges: 'Faint path, follow carefully near the tea estate boundary — easy to wander into private land.',
    waypoints: [
      { order: 1, title: 'Tea estate boundary', description: 'Walk along the estate fence line until it ends, then continue straight.', lat: 29.8420, lng: 79.6120 },
      { order: 2, title: 'Ridge Point', description: 'Open rock ledge with a full mountain view.', lat: 29.8445, lng: 79.6150 }
    ],
    comments: [
      { text: 'Faint path, follow carefully, easy to miss the turn', author: 'Kavya Rautela', date: daysAgo(22), nlpRisk: 'caution', nlpConfidence: 0.59, hazardKeywords: ['faint path'] },
      { text: 'Beautiful trail, clear path, well worth the short walk', author: 'Visitor', date: daysAgo(7), nlpRisk: 'clear', nlpConfidence: 0.80, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(7),
    createdBy: 'Kavya Rautela',
    totalVisitors: 16
  },
  {
    name: 'Fern Hollow',
    location: 'Below Pangot, Nainital',
    type: 'other',
    difficulty: 'easy',
    description: 'A fern-covered hollow known to local birders as a quiet resting spot.',
    story: 'A birding guide showed us this spot during a dawn walk, said very few tourists know it.',
    challenges: 'None significant — well-trodden by local birders, generally safe.',
    waypoints: [
      { order: 1, title: 'Pangot forest gate', description: 'Enter through the forest gate, take the first left trail.', lat: 29.4390, lng: 79.5210 },
      { order: 2, title: 'Fern Hollow', description: 'Hollow is just past a small stream crossing.', lat: 29.4405, lng: 79.5235 }
    ],
    comments: [
      { text: 'Great condition, safe trail, no issues at all', author: 'Ravi Kandpal', date: daysAgo(3), nlpRisk: 'clear', nlpConfidence: 0.84, hazardKeywords: [] }
    ],
    lastConfirmedDate: daysAgo(3),
    createdBy: 'Ravi Kandpal',
    totalVisitors: 9
  },
  {
    name: 'Ghost Bridge Crossing',
    location: 'Old logging trail, Almora district',
    type: 'other',
    difficulty: 'hard',
    description: 'An abandoned wooden logging bridge across a ravine, no longer officially maintained.',
    story: 'Found reference to this bridge in an old forest department map from the 1990s.',
    challenges: 'Unsafe crossing, bridge is broken in the middle section — do not attempt to cross, view from the ravine edge only.',
    waypoints: [
      { order: 1, title: 'Old logging trailhead', description: 'Follow the disused logging road from the district boundary marker.', lat: 29.5960, lng: 79.6640 },
      { order: 2, title: 'Ravine edge', description: 'Bridge is visible from here — do not cross, structurally unsound.', lat: 29.5985, lng: 79.6670 }
    ],
    comments: [
      { text: 'Unsafe crossing, bridge is broken, do not attempt', author: 'Harish Joshi', date: daysAgo(90), nlpRisk: 'needs_review', nlpConfidence: 0.91, hazardKeywords: ['unsafe', 'bridge is broken'] },
      { text: 'Fire reported near trail last season, do not enter that section', author: 'Visitor', date: daysAgo(85), nlpRisk: 'needs_review', nlpConfidence: 0.89, hazardKeywords: ['fire', 'do not enter'] }
    ],
    lastConfirmedDate: daysAgo(85),
    createdBy: 'Harish Joshi',
    totalVisitors: 3
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas (ghosttrail database)');

    const existingCount = await Trail.countDocuments();
    console.log(`ℹ️  Currently ${existingCount} trail(s) in the database.`);

    const inserted = await Trail.insertMany(trails);
    console.log(`✅ Inserted ${inserted.length} sample trails successfully.`);

    const summary = {};
    inserted.forEach(t => { summary[t.type] = (summary[t.type] || 0) + 1; });
    console.log('📊 Breakdown by type:', summary);

    await mongoose.disconnect();
    console.log('✅ Done. Disconnected from MongoDB.');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();