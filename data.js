/* ScoutLink OC — sample data
   Everything here is fictional demo content. Troop numbers, names and
   events are invented for illustration. Dates are stored as day offsets
   from "today" so the demo never goes stale. */

window.SL_DATA = (function () {
  const LEVELS = [
    { id: "daisy", name: "Daisy", grades: "K–1", color: "var(--lv-daisy)", hex: "#2f7fc1" },
    { id: "brownie", name: "Brownie", grades: "2–3", color: "var(--lv-brownie)", hex: "#8a5a3b" },
    { id: "junior", name: "Junior", grades: "4–5", color: "var(--lv-junior)", hex: "#6a3fa0" },
    { id: "cadette", name: "Cadette", grades: "6–8", color: "var(--lv-cadette)", hex: "#8c2a43" },
    { id: "senior", name: "Senior", grades: "9–10", color: "var(--lv-senior)", hex: "#b4570c" },
    { id: "ambassador", name: "Ambassador", grades: "11–12", color: "var(--lv-ambassador)", hex: "#24365f" }
  ];

  const SERVICE_UNITS = [
    { id: "north", name: "North OC Service Unit", short: "North OC", coordinator: "Jen L.", area: "Fullerton, Brea, La Habra, Placentia" },
    { id: "central", name: "Central OC Service Unit", short: "Central OC", coordinator: "Monica S.", area: "Santa Ana, Tustin, Orange, Irvine" },
    { id: "coastal", name: "Coastal OC Service Unit", short: "Coastal OC", coordinator: "Teresa V.", area: "Huntington Beach, Costa Mesa, Newport Beach" },
    { id: "south", name: "South OC Service Unit", short: "South OC", coordinator: "Grace H.", area: "Mission Viejo, Laguna Hills, San Clemente" }
  ];

  const TROOPS = [
    {
      id: "101", su: "north", levels: ["senior", "ambassador"], girls: 14, years: 8,
      interests: ["STEM", "Community service"], leader: "Dana R.",
      blurb: "High schoolers who like big, practical projects. This year we're running a free community wellness day and looking for partner troops to help staff stations.",
      map: [132, 112]
    },
    {
      id: "202", su: "central", levels: ["junior", "cadette"], girls: 18, years: 5,
      interests: ["Outdoors", "Leadership"], leader: "Marisol G.",
      blurb: "We hike once a month and are planning a trail restoration day. Happy to pair up with older girls who can mentor our Cadettes on their Silver Award.",
      map: [205, 192]
    },
    {
      id: "303", su: "south", levels: ["brownie"], girls: 12, years: 3,
      interests: ["Arts", "Nature"], leader: "Kim N.",
      blurb: "Brownies who love painting, bugs and anything with glitter. We're collecting handmade cards for local senior centers this winter.",
      map: [425, 332]
    },
    {
      id: "404", su: "north", levels: ["cadette", "senior"], girls: 22, years: 10,
      interests: ["Travel", "Service"], leader: "Carla T.",
      blurb: "A large, long-running troop. We plan one big trip a year and fund it through cookie season and service-based fundraising. We have camping gear to lend.",
      map: [232, 92]
    },
    {
      id: "515", su: "coastal", levels: ["daisy"], girls: 9, years: 1,
      interests: ["Nature", "Animals"], leader: "Beth O.",
      blurb: "Our first year as a troop. Daisies who want to learn about the ocean, animals and how to be good friends.",
      map: [128, 214]
    },
    {
      id: "626", su: "central", levels: ["ambassador"], girls: 7, years: 12,
      interests: ["Leadership", "Advocacy"], leader: "Yvonne A.",
      blurb: "Seniors in high school, most working on Gold Award projects. We offer peer mentoring to Seniors who are just starting theirs.",
      map: [285, 214]
    },
    {
      id: "737", su: "south", levels: ["junior"], girls: 15, years: 4,
      interests: ["STEM", "Robotics"], leader: "Hannah L.",
      blurb: "Juniors who build robots out of whatever we can find. We host a beginner robotics workshop every fall.",
      map: [402, 248]
    },
    {
      id: "848", su: "coastal", levels: ["senior"], girls: 11, years: 6,
      interests: ["Ocean conservation", "Outdoors"], leader: "Rosa M.",
      blurb: "Beach cleanups, tide pool surveys and a Gold Award project training tide pool docents. We always need extra chaperones.",
      map: [238, 284]
    },
    {
      id: "959", su: "north", levels: ["daisy", "brownie"], girls: 20, years: 2,
      interests: ["Arts", "Community service"], leader: "Tamara J.",
      blurb: "A multi-level troop of Daisies and Brownies. We're painting kindness rocks for a community garden and love doing activities with other young troops.",
      map: [305, 134]
    },
    {
      id: "1062", su: "central", levels: ["cadette"], girls: 13, years: 7,
      interests: ["Entrepreneurship", "Cookies"], leader: "Nicole F.",
      blurb: "Our Cadettes treat cookie season like a small business. We run a booth strategy night for other troops every January.",
      map: [345, 250]
    },
    {
      id: "1175", su: "south", levels: ["brownie", "junior"], girls: 16, years: 5,
      interests: ["Outdoors", "Camping"], leader: "Joanne P.",
      blurb: "Campers at heart. Our camp skills day covers knots, fire safety and reading trail maps, and is open to Brownies through Cadettes.",
      map: [452, 402]
    },
    {
      id: "1288", su: "coastal", levels: ["cadette", "senior", "ambassador"], girls: 19, years: 9,
      interests: ["STEM", "Travel"], leader: "Leah C.",
      blurb: "A mixed-level troop that pairs older girls with younger ones on every project. Currently planning an astronomy night with a local observatory.",
      map: [322, 352]
    }
  ];

  // Collaborations drawn as trails on the landing map
  const TRAILS = [
    ["101", "404"], ["404", "202"], ["202", "1175"], ["626", "848"],
    ["848", "1288"], ["515", "848"], ["737", "1062"], ["959", "303"],
    ["101", "626"], ["1288", "737"]
  ];

  const EVENT_TYPES = ["Service project", "Workshop", "Outdoor activity", "Fundraiser", "Meeting"];

  const EVENTS = [
    {
      id: "e1", title: "Beach cleanup and tide pool walk", type: "Service project", host: "848",
      offset: 9, time: "8:30 AM", capacity: 40, registered: 31, waitlist: 0,
      levels: ["junior", "cadette", "senior", "ambassador"], visibility: "Council-wide",
      area: "Huntington Beach area", caregiver: true,
      desc: "Two hours of beach cleanup followed by a guided tide pool walk. Gloves, bags and water provided. Wear closed-toe shoes that can get wet."
    },
    {
      id: "e2", title: "Intro to robotics workshop", type: "Workshop", host: "737",
      offset: 14, time: "10:00 AM", capacity: 24, registered: 24, waitlist: 3,
      levels: ["junior", "cadette"], visibility: "Council-wide",
      area: "Mission Viejo area", caregiver: true,
      desc: "Build and program a simple robot in teams of three. No experience needed. Our Juniors will be teaching alongside adult volunteers."
    },
    {
      id: "e3", title: "Community Wellness Day", type: "Service project", host: "101",
      offset: 38, time: "9:00 AM", capacity: 120, registered: 46, waitlist: 0,
      levels: ["daisy", "brownie", "junior", "cadette", "senior", "ambassador"], visibility: "Council-wide",
      area: "Fullerton area", caregiver: true, girlLed: true,
      desc: "A free, girl-led wellness fair for families: movement stations, healthy snack demos and a mindfulness corner. Troops can register to attend or to staff a station."
    },
    {
      id: "e4", title: "Cookie booth strategy night", type: "Workshop", host: "1062",
      offset: 20, time: "6:30 PM", capacity: 30, registered: 12, waitlist: 0,
      levels: ["cadette", "senior", "ambassador"], visibility: "Council-wide",
      area: "Tustin area", caregiver: false,
      desc: "Our Cadettes share what worked last season: booth layout, pitch practice and tracking sales. Bring your troop's goals."
    },
    {
      id: "e5", title: "Daisy and Brownie nature scavenger hunt", type: "Outdoor activity", host: "959",
      offset: 6, time: "10:00 AM", capacity: 50, registered: 22, waitlist: 0,
      levels: ["daisy", "brownie"], visibility: "Council-wide",
      area: "Brea area", caregiver: true,
      desc: "A gentle, stroller-friendly scavenger hunt through a local park. Each girl gets a picture checklist. Caregivers are welcome to walk along."
    },
    {
      id: "e6", title: "Gold Award info session and mentor panel", type: "Workshop", host: "626",
      offset: 25, time: "4:00 PM", capacity: 60, registered: 18, waitlist: 0,
      levels: ["senior", "ambassador"], visibility: "Council-wide",
      area: "Irvine area", caregiver: false,
      desc: "Ambassadors who completed or are finishing their Gold Award projects answer questions. Meet a peer mentor and leave with a planning worksheet."
    },
    {
      id: "e7", title: "Leader roundtable: cross-troop events", type: "Meeting", host: "su:central",
      offset: 11, time: "7:00 PM", capacity: 35, registered: 20, waitlist: 0,
      levels: [], adultsOnly: true, visibility: "Service unit",
      area: "Online", caregiver: false,
      desc: "For troop leaders and volunteers. We'll share what's coming up this spring and match troops who want to co-host."
    },
    {
      id: "e8", title: "Camp skills day: knots, fire safety and trail maps", type: "Outdoor activity", host: "1175",
      offset: 31, time: "9:30 AM", capacity: 36, registered: 9, waitlist: 0,
      levels: ["brownie", "junior", "cadette"], visibility: "Council-wide",
      area: "San Clemente area", caregiver: true,
      desc: "Rotate through three skill stations led by our Juniors and adult volunteers. Pack a lunch and a refillable water bottle."
    },
    {
      id: "e9", title: "Holiday card drive for senior centers", type: "Service project", host: "303",
      offset: 17, time: "3:30 PM", capacity: 80, registered: 40, waitlist: 0,
      levels: ["daisy", "brownie", "junior", "cadette", "senior", "ambassador"], visibility: "Council-wide",
      area: "Laguna Hills area", caregiver: false,
      desc: "Drop in and make cards. We'll deliver them to three local senior centers. All supplies provided."
    }
  ];

  // Troop-only meetings (private calendar) — never shown in the public directory
  const PRIVATE_MEETINGS = {
    "101": [
      { title: "Troop meeting", offset: 2, time: "6:30 PM", note: "Wellness Day station planning" },
      { title: "Troop meeting", offset: 16, time: "6:30 PM", note: "Flyer review and volunteer schedule" }
    ],
    "959": [
      { title: "Troop meeting", offset: 4, time: "3:45 PM", note: "Paint kindness rocks, bring an old shirt" },
      { title: "Troop meeting", offset: 18, time: "3:45 PM", note: "Garden planting day" }
    ]
  };

  const TROOP_MEMBERS = {
    "101": [
      ["Maya K.", "senior"], ["Priya S.", "senior"], ["Ava T.", "ambassador"], ["Jordan B.", "senior"],
      ["Chloe N.", "ambassador"], ["Isabel R.", "senior"], ["Hana Y.", "senior"], ["Grace O.", "ambassador"],
      ["Nadia F.", "senior"], ["Zoe P.", "senior"], ["Leilani K.", "ambassador"], ["Rina M.", "senior"],
      ["Camila D.", "senior"], ["Tessa W.", "ambassador"]
    ]
  };

  const TROOP_RESOURCES = {
    "101": [
      { title: "Fall cookie order tracker", kind: "Sheet", by: "Dana R." },
      { title: "Troop budget, current year", kind: "Sheet", by: "Dana R." },
      { title: "Permission slip template", kind: "PDF", by: "Council" },
      { title: "Safety Activity Checkpoints: Day trips", kind: "Link", by: "Council" }
    ],
    "959": [
      { title: "Kindness rock painting guide", kind: "PDF", by: "Tamara J." },
      { title: "Daisy petal checklist", kind: "PDF", by: "Council" },
      { title: "Permission slip template", kind: "PDF", by: "Council" }
    ]
  };

  const PROJECTS = [
    {
      id: "wellness-day", title: "Community Wellness Day", troop: "101", track: "Troop initiative",
      lead: "Maya K.", adviser: "Dana R.", eventId: "e3",
      summary: "A free wellness fair for families in North OC, planned and run by Troop 101 with help from Troop 404.",
      people: [
        { name: "Maya K.", troop: "101", role: "Project lead" },
        { name: "Priya S.", troop: "101", role: "Volunteers and outreach" },
        { name: "Elena V.", troop: "404", role: "Promotion (partner troop)" },
        { name: "Dana R.", troop: "101", role: "Adult adviser", adult: true }
      ],
      tasks: [
        { id: "t1", title: "Create event proposal", status: "done", who: "Maya K.", due: -12 },
        { id: "t2", title: "Recruit volunteers", status: "doing", who: "Priya S.", due: 5 },
        { id: "t3", title: "Confirm location", status: "done", who: "Dana R.", due: -4 },
        { id: "t4", title: "Design promotional flyer", status: "doing", who: "Elena V.", due: 3 },
        { id: "t5", title: "Open registration", status: "todo", who: "Maya K.", due: 8 },
        { id: "t6", title: "Collect feedback", status: "todo", who: "Priya S.", due: 45 }
      ],
      budget: {
        goal: 500, raised: 310,
        lines: [
          { id: "b1", item: "Community center room (donated)", planned: 0, actual: 0 },
          { id: "b2", item: "Flyer printing", planned: 60, actual: 48 },
          { id: "b3", item: "Wellness station supplies", planned: 220, actual: 95 },
          { id: "b4", item: "Healthy snacks and water", planned: 150, actual: 0 },
          { id: "b5", item: "First aid kits", planned: 70, actual: 0 }
        ]
      },
      milestones: [
        { id: "m1", title: "Proposal approved by troop leader", offset: -10, done: true },
        { id: "m2", title: "Location confirmed", offset: -4, done: true },
        { id: "m3", title: "Registration opens", offset: 8, done: false },
        { id: "m4", title: "Event day", offset: 38, done: false },
        { id: "m5", title: "Feedback and wrap-up", offset: 45, done: false }
      ],
      files: [
        { title: "Event proposal", kind: "PDF", by: "Maya K.", offset: -12 },
        { title: "Flyer draft v2", kind: "Image", by: "Elena V.", offset: -1 },
        { title: "Volunteer sign-up sheet", kind: "Sheet", by: "Priya S.", offset: -3 },
        { title: "Day-of agenda", kind: "Doc", by: "Maya K.", offset: -2 }
      ]
    },
    {
      id: "tide-pool", title: "Tide Pool Guardians", troop: "848", track: "Gold Award",
      lead: "Sofia M.", adviser: "Rosa M.",
      summary: "Training teen docents to teach beachgoers how to explore tide pools without damaging them.",
      people: [
        { name: "Sofia M.", troop: "848", role: "Project lead" },
        { name: "Ava T.", troop: "101", role: "Docent trainer (partner troop)" },
        { name: "Rosa M.", troop: "848", role: "Adult adviser", adult: true }
      ],
      tasks: [
        { id: "t1", title: "Survey tide pool damage at two beaches", status: "done", who: "Sofia M.", due: -40 },
        { id: "t2", title: "Meet with marine science center", status: "done", who: "Sofia M.", due: -25 },
        { id: "t3", title: "Write docent training guide", status: "doing", who: "Sofia M.", due: 10 },
        { id: "t4", title: "Recruit 10 teen docents", status: "doing", who: "Ava T.", due: 21 },
        { id: "t5", title: "Host docent training day", status: "todo", who: "Sofia M.", due: 35 },
        { id: "t6", title: "Measure impact after three months", status: "todo", who: "Sofia M.", due: 120 }
      ],
      budget: {
        goal: 300, raised: 120,
        lines: [
          { id: "b1", item: "Printed field guides", planned: 180, actual: 0 },
          { id: "b2", item: "Docent vests", planned: 90, actual: 0 },
          { id: "b3", item: "Signage materials", planned: 30, actual: 22 }
        ]
      },
      milestones: [
        { id: "m1", title: "Project proposal submitted to council", offset: -30, done: true },
        { id: "m2", title: "Training guide finished", offset: 10, done: false },
        { id: "m3", title: "Docent training day", offset: 35, done: false },
        { id: "m4", title: "Final report", offset: 130, done: false }
      ],
      files: [
        { title: "Tide pool survey results", kind: "Sheet", by: "Sofia M.", offset: -38 },
        { title: "Training guide draft", kind: "Doc", by: "Sofia M.", offset: -2 }
      ]
    },
    {
      id: "kindness-garden", title: "Kindness rock garden", troop: "959", track: "Troop project",
      lead: "Whole troop", adviser: "Tamara J.", youngTroop: true,
      summary: "Daisies and Brownies paint rocks with kind messages for a community garden path.",
      people: [
        { name: "Troop 959 Daisies and Brownies", troop: "959", role: "Painters and planters" },
        { name: "Tamara J.", troop: "959", role: "Troop leader", adult: true }
      ],
      tasks: [
        { id: "t1", title: "Collect smooth rocks", status: "done", who: "Whole troop", due: -6 },
        { id: "t2", title: "Paint kindness rocks", status: "doing", who: "Whole troop", due: 4 },
        { id: "t3", title: "Seal rocks so the paint lasts", status: "todo", who: "Tamara J.", due: 10 },
        { id: "t4", title: "Plant the garden path", status: "todo", who: "Whole troop", due: 18 }
      ],
      budget: {
        goal: 80, raised: 80,
        lines: [
          { id: "b1", item: "Outdoor paint pens", planned: 45, actual: 41 },
          { id: "b2", item: "Clear sealant", planned: 20, actual: 0 },
          { id: "b3", item: "Garden gloves", planned: 15, actual: 15 }
        ]
      },
      milestones: [
        { id: "m1", title: "Garden partner says yes", offset: -14, done: true },
        { id: "m2", title: "Rocks painted", offset: 4, done: false },
        { id: "m3", title: "Planting day", offset: 18, done: false }
      ],
      files: [
        { title: "Rock painting guide", kind: "PDF", by: "Tamara J.", offset: -10 }
      ]
    }
  ];

  const THREADS = [
    {
      id: "th1", kind: "leader", with: "Carla T.", troop: "404", subject: "Wellness Day volunteers",
      messages: [
        { from: "Carla T.", offset: -3, text: "Hi Dana! Our Seniors would love to staff the movement station at Wellness Day. Elena is already helping Maya with the flyer." },
        { from: "Dana R.", offset: -3, text: "That's wonderful, thank you. Could you bring two adults to help supervise? I'll add your troop to the project so you can see the volunteer schedule." },
        { from: "Carla T.", offset: -2, text: "Yes, two adults confirmed. We can also lend pop-up tents if you need shade." }
      ]
    },
    {
      id: "th2", kind: "leader", with: "Monica S.", troop: "su:central", subject: "Roundtable agenda",
      messages: [
        { from: "Monica S.", offset: -6, text: "Would you share how Troop 101 is using project boards for Wellness Day at next week's roundtable? Five minutes is plenty." },
        { from: "Dana R.", offset: -5, text: "Happy to. I'll ask Maya if she wants to present it herself with me there." }
      ]
    },
    {
      id: "th3", kind: "leader", with: "Rosa M.", troop: "848", subject: "Beach cleanup chaperones",
      messages: [
        { from: "Rosa M.", offset: -1, text: "We're short on chaperones for the beach cleanup. Any adults in your troop who are already verified could help, even for an hour." }
      ]
    },
    {
      id: "sp1", kind: "space", project: "wellness-day", subject: "Wellness Day planning",
      moderators: ["Dana R.", "Carla T."],
      messages: [
        { from: "Maya K.", offset: -2, text: "Flyer v2 is in Files. Can everyone vote on the color by Friday?" },
        { from: "Elena V.", offset: -2, text: "I like the green one. I can make a version for Instagram too if the leaders say it's okay." },
        { from: "Dana R.", offset: -1, text: "Green looks great. Please run any social posts by Carla or me before they go up." },
        { from: "Priya S.", offset: -1, text: "Volunteer sheet has 9 names so far. Goal is 15." }
      ]
    },
    {
      id: "sp2", kind: "space", project: "tide-pool", subject: "Gold Award mentors circle",
      moderators: ["Yvonne A.", "Rosa M."],
      messages: [
        { from: "Sofia M.", offset: -4, text: "Has anyone written a project timeline the council liked? Mine keeps getting too long." },
        { from: "Ava T.", offset: -3, text: "I split mine into phases with one goal each. Happy to share it at the info session." }
      ]
    }
  ];

  const OPPORTUNITIES = [
    { id: "o1", cat: "Volunteers needed", troop: "848", title: "Six adult chaperones for the beach cleanup", body: "Verified adults only. Even one hour helps. Shifts start at 8:30 and 9:30 AM.", offset: -1, interested: 4 },
    { id: "o2", cat: "Joint project", troop: "202", title: "Partner troop for a trail restoration day", body: "Our Juniors and Cadettes want to team up with an older troop. Cadettes could count it toward Silver Award planning.", offset: -3, interested: 2 },
    { id: "o3", cat: "Event participants", troop: "737", title: "Cadette teams for a spring robotics showcase", body: "Teams of three to five. We'll share kits and run two practice nights first.", offset: -5, interested: 6 },
    { id: "o4", cat: "Mentorship", troop: "626", title: "Gold Award peer mentors for Seniors", body: "Our Ambassadors will meet with Seniors twice a month, always in a moderated group space with adult advisers.", offset: -2, interested: 9 },
    { id: "o5", cat: "Resource share", troop: "404", title: "Six tents and two camp stoves to lend", body: "Available most weekends. Pick up and drop off with our troop leader.", offset: -7, interested: 3 },
    { id: "o6", cat: "Announcement", troop: "su:coastal", title: "New leader training dates posted", body: "Two evening sessions and one Saturday morning. New and returning leaders welcome.", offset: -4, interested: 11 }
  ];

  const VERIFICATION_QUEUE = [
    { id: "v1", name: "Michelle B.", role: "Troop co-leader", troop: "202", check: "Cleared", submitted: -2 },
    { id: "v2", name: "Robert K.", role: "Event chaperone", troop: "848", check: "In progress", submitted: -1 },
    { id: "v3", name: "Sun-Hee P.", role: "Troop leader (new troop)", troop: "Pending troop", check: "Cleared", submitted: -4 }
  ];

  const FLAGS = [
    { id: "f1", where: "Opportunity board", text: "A post included a personal phone number in the description.", offset: -1 }
  ];

  const ROLES = [
    {
      id: "leader", label: "Troop leader / volunteer", name: "Dana R.", first: "Dana",
      detail: "Troop 101 leader", troop: "101",
      caps: ["directory", "contact", "createEvent", "register", "messages", "projects", "editProjects", "approve", "troop", "members", "post", "opps"]
    },
    {
      id: "girl13", label: "Girl Scout (13+)", name: "Maya K.", first: "Maya",
      detail: "Senior, Troop 101", troop: "101", level: "senior",
      caps: ["directory", "proposeEvent", "signup", "space", "projects", "editProjects", "troop", "members", "proposePost", "opps"]
    },
    {
      id: "parent", label: "Parent / guardian", name: "Aaron W.", first: "Aaron",
      detail: "Caregiver of Lily, Troop 959", troop: "959", childName: "Lily", childLevel: "brownie",
      caps: ["directory", "registerChild", "permissions", "projects", "troop", "opps"]
    },
    {
      id: "girl12", label: "Girl Scout (under 13)", name: "Lily W.", first: "Lily",
      detail: "Brownie, Troop 959", troop: "959", level: "brownie",
      caps: ["directoryLite", "askCaregiver", "projects", "troop", "opps"]
    },
    {
      id: "coordinator", label: "Service unit coordinator", name: "Jen L.", first: "Jen",
      detail: "North OC Service Unit", su: "north",
      caps: ["directory", "contact", "createEvent", "messages", "projects", "post", "attendees", "opps", "suManage"]
    },
    {
      id: "admin", label: "GSOC administrator", name: "Renee P.", first: "Renee",
      detail: "Council administrator (sample)",
      caps: ["directory", "contact", "createEvent", "messages", "projects", "post", "attendees", "opps", "admin"]
    }
  ];

  return { LEVELS, SERVICE_UNITS, TROOPS, TRAILS, EVENT_TYPES, EVENTS, PRIVATE_MEETINGS, TROOP_MEMBERS, TROOP_RESOURCES, PROJECTS, THREADS, OPPORTUNITIES, VERIFICATION_QUEUE, FLAGS, ROLES };
})();
