import type { Team, Session, AttendanceRecord } from '../types';

const TECH_PREFIXES = [
  "Cyber", "Quantum", "Nexus", "Web", "Code", "Apex", "Byte", "Pixel", "Neural", "Hyper",
  "Vector", "Data", "Matrix", "Synapse", "Binary", "Pulse", "Logic", "Vortex", "Starlight", "Zero"
];

const TECH_SUFFIXES = [
  "Knights", "Wizards", "Hackers", "Innovators", "Devs", "Architects", "Forge", "Squad", "Guild", "Craft",
  "Titans", "Pioneers", "Syndicate", "Spiders", "Network", "Vanguard", "Lab", "Glitch", "Pulse", "Engineers"
];

const FIRST_NAMES = [
  "Aarav", "Ananya", "Rohan", "Priya", "Aditya", "Sneha", "Vikram", "Neha", "Rahul", "Kavya",
  "Siddharth", "Pooja", "Arjun", "Divya", "Karan", "Ishita", "Varun", "Meera", "Yash", "Riya",
  "Tanmay", "Shruti", "Dev", "Anushka", "Manish", "Simran", "Amit", "Tanya", "Harsh", "Deepika"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Kumar", "Singh", "Patel", "Gupta", "Reddy", "Joshi", "Mehta", "Rao",
  "Nair", "Iyer", "Chopra", "Malhotra", "Kapoor", "Bhat", "Deshmukh", "Agarwal", "Saxena", "Choudhury"
];

export const generate70DemoTeams = (): Team[] => {
  const teams: Team[] = [];
  const usedTeamNames = new Set<string>();

  for (let i = 1; i <= 70; i++) {
    const numStr = i.toString().padStart(3, '0');
    const teamNumber = `TEAM${numStr}`;

    let teamName = "";
    do {
      const p = TECH_PREFIXES[Math.floor(Math.random() * TECH_PREFIXES.length)];
      const s = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
      teamName = `${p} ${s}`;
    } while (usedTeamNames.has(teamName));
    usedTeamNames.add(teamName);

    const leadFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const leadLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const leadName = `${leadFirst} ${leadLast}`;
    const leadRegNo = `22CSE${(1000 + (i - 1) * 4 + 1).toString()}`;
    const qrToken = `WEBX_TOK_${teamNumber}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const members: Team['members'] = [
      { name: leadName, regNo: leadRegNo, role: 'Team Lead' }
    ];

    for (let m = 2; m <= 4; m++) {
      const mFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const mLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const mRegNo = `22CSE${(1000 + (i - 1) * 4 + m).toString()}`;
      members.push({
        name: `${mFirst} ${mLast}`,
        regNo: mRegNo,
        role: 'Member'
      });
    }

    teams.push({
      teamNumber,
      teamName,
      teamLeadRegNo: leadRegNo,
      teamLeadName: leadName,
      qrToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members
    });
  }

  return teams;
};

export const generateDefaultSessions = (): Session[] => {
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      sessionId: 'SESSION001',
      sessionName: 'Session 01 - Inauguration & Rules',
      date: today,
      startTime: '09:00',
      endTime: '10:30',
      description: 'Grand opening ceremony, dataset release, and hackathon guidelines.',
      status: 'closed',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      assistantKey: 'WEBX-INAU-01'
    },
    {
      sessionId: 'SESSION002',
      sessionName: 'Session 02 - Mid-Hack Review',
      date: today,
      startTime: '14:00',
      endTime: '16:00',
      description: 'First milestone evaluation and attendance audit.',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      assistantKey: 'WEBXDAY1'
    },
    {
      sessionId: 'SESSION003',
      sessionName: 'Session 03 - Midnight Checkpoint',
      date: today,
      startTime: '23:00',
      endTime: '01:00',
      description: 'Night coding round mandatory attendance check.',
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      assistantKey: 'WEBX-NIGHT-03'
    },
    {
      sessionId: 'SESSION004',
      sessionName: 'Session 04 - Final Project Demo',
      date: today,
      startTime: '09:00',
      endTime: '12:00',
      description: 'Jury presentation and final hackathon evaluation.',
      status: 'draft',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin',
      assistantKey: 'WEBX-FINAL-04'
    }
  ];
};

export const generateSampleAttendance = (teams: Team[], sessions: Session[]): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const closedOrActiveSessions = sessions.filter(s => s.status === 'closed' || s.status === 'active');

  closedOrActiveSessions.forEach(session => {
    teams.slice(0, 40).forEach(team => {
      const members = team.members.map(m => {
        const isPresent = Math.random() > 0.15;
        return {
          name: m.name,
          regNo: m.regNo,
          status: (isPresent ? 'present' : 'absent') as 'present' | 'absent'
        };
      });

      records.push({
        id: `${session.sessionId}_${team.teamNumber}`,
        sessionId: session.sessionId,
        teamNumber: team.teamNumber,
        markedAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
        markedBy: 'Assistant_Scanner_01',
        members
      });
    });
  });

  return records;
};
