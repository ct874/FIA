import { TOURS } from './schoolRecords.schema'

function reach(count) {
  return { studentsReached: count, uniqueStudentCount: count }
}

function studentFeedback({ total, rate, csat, itp, completion, date }) {
  const responded = Math.round(total * rate)
  return {
    totalStudents: total,
    respondedCount: responded,
    responseRatePercentage: Number(((responded / total) * 100).toFixed(2)),
    csatAvg: csat,
    itpAvg: itp,
    videoCompletionRate: completion,
    submittedAt: date,
  }
}

function teacherFeedback({ name, nps, benefit, improvement, date, enjoyment = 4, overall = 4, itp = 4, satisfaction = 4, ease = 4 }) {
  return {
    submittedBy: name,
    enjoyment,
    overallExperience: overall,
    itp,
    wantExploreCareer: true,
    wantMoreTours: true,
    satisfactionResources: satisfaction,
    easeIntegration: ease,
    biggestBenefit: benefit,
    improvements: improvement,
    nps,
    submittedAt: date,
  }
}

function tourEntry({ tour, grade, month, language = 'Hindi', reachData = null, student = null, teacher = null }) {
  return { tourId: tour.id, tourName: tour.name, grade, month, language, reach: reachData, studentFeedback: student, teacherFeedback: teacher }
}

// One class = one grade taking one tour. A school can have several.
function oneClassSchool({ udise, schoolName, district, teacherContact, lastActivityLabel, tour }) {
  return {
    udise,
    schoolName,
    district,
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact,
    lastActivityLabel,
    classes: [{ grade: tour.grade, section: '', tours: [tourEntry(tour)] }],
  }
}

/**
 * Reference school built directly from the sample exports provided by the
 * partner (Form 1, Form 2, AFE session export) — UDISE 08180701101,
 * MAHATMA GANDHI GOVT. SCHOOL DHANSA BLOCK BHINMAL, district JALOR.
 * Grades 6 and 7 each completed all three Career Tour videos (Amazon Music,
 * AWS, Robotics Fulfillment Center) in July. Student/teacher feedback figures
 * reuse the worked examples from the PARTNER_DATA_COLLECTION_GUIDE metric
 * calculations (CSAT 4.42, ITP 4.67, NPS 62.50 / 26.67).
 */
const referenceSchool = {
  udise: '08180701101',
  schoolName: 'MAHATMA GANDHI GOVT. SCHOOL DHANSA BLOCK BHINMAL (213759)',
  district: 'JALOR',
  state: 'Rajasthan',
  schoolType: 'Government',
  teacherContact: { name: 'Pragya Sharma', phone: '9829012345', email: 'mail@fia.foundation' },
  lastActivityLabel: 'Today',
  classes: [
    {
      grade: '6',
      section: '',
      tours: [
        tourEntry({
          tour: TOURS.AM,
          grade: '6',
          month: 'July',
          reachData: reach(10),
          student: studentFeedback({ total: 28, rate: 24 / 28, csat: 4.42, itp: 4.67, completion: 75, date: '2026-07-29T10:00:00Z' }),
          teacher: teacherFeedback({ name: 'Pragya Sharma', nps: 62.5, benefit: 'Students became curious about music-tech careers.', improvement: 'Add a Hindi subtitle option.', date: '2026-07-29T11:00:00Z' }),
        }),
        tourEntry({
          tour: TOURS.AWS,
          grade: '6',
          month: 'July',
          reachData: reach(10),
          student: studentFeedback({ total: 28, rate: 24 / 28, csat: 4.42, itp: 4.67, completion: 75, date: '2026-07-29T10:00:00Z' }),
          teacher: teacherFeedback({ name: 'Pragya Sharma', nps: 62.5, benefit: 'Good introduction to cloud computing basics.', improvement: 'Shorter session length.', date: '2026-07-29T11:00:00Z' }),
        }),
        tourEntry({
          tour: TOURS.FC,
          grade: '6',
          month: 'July',
          reachData: reach(10),
          student: studentFeedback({ total: 28, rate: 24 / 28, csat: 4.42, itp: 4.67, completion: 75, date: '2026-07-29T10:00:00Z' }),
          teacher: teacherFeedback({ name: 'Pragya Sharma', nps: 62.5, benefit: 'Sparked interest in robotics and automation.', improvement: 'More hands-on activity ideas.', date: '2026-07-29T11:00:00Z' }),
        }),
      ],
    },
    {
      grade: '7',
      section: '',
      tours: [
        tourEntry({
          tour: TOURS.AM,
          grade: '7',
          month: 'July',
          reachData: reach(10),
          student: studentFeedback({ total: 28, rate: 24 / 28, csat: 4.3, itp: 4.5, completion: 70, date: '2026-07-29T10:00:00Z' }),
          teacher: teacherFeedback({ name: 'Pragya Sharma', nps: 26.67, benefit: 'Students enjoyed the music production angle.', improvement: 'Add a quiz recap at the end.', date: '2026-07-29T11:00:00Z' }),
        }),
        tourEntry({
          tour: TOURS.AWS,
          grade: '7',
          month: 'July',
          reachData: reach(10),
          student: studentFeedback({ total: 28, rate: 24 / 28, csat: 4.3, itp: 4.5, completion: 70, date: '2026-07-29T10:00:00Z' }),
          teacher: teacherFeedback({ name: 'Pragya Sharma', nps: 26.67, benefit: 'Useful real-world data center visuals.', improvement: 'Simplify technical vocabulary.', date: '2026-07-29T11:00:00Z' }),
        }),
        tourEntry({
          tour: TOURS.FC,
          grade: '7',
          month: 'July',
          reachData: reach(10),
          student: studentFeedback({ total: 28, rate: 24 / 28, csat: 4.3, itp: 4.5, completion: 70, date: '2026-07-29T10:00:00Z' }),
          teacher: teacherFeedback({ name: 'Pragya Sharma', nps: 26.67, benefit: 'Clear explanation of warehouse robotics.', improvement: 'Longer Q&A time.', date: '2026-07-29T11:00:00Z' }),
        }),
      ],
    },
  ],
}

export const schoolRecordsData = [
  referenceSchool,

  oneClassSchool({
    udise: '08010102301',
    schoolName: 'Govt. Senior Secondary School Churu',
    district: 'Churu',
    teacherContact: { name: 'Ramesh Kumawat', phone: '9414012301' },
    lastActivityLabel: 'Today',
    tour: {
      tour: TOURS.AM, grade: '8', month: 'July',
      reachData: reach(42),
      student: studentFeedback({ total: 42, rate: 0.86, csat: 4.6, itp: 4.7, completion: 88, date: '2026-07-28T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Ramesh Kumawat', nps: 74, benefit: 'Strong enthusiasm for STEM careers.', improvement: 'More regional examples.', date: '2026-07-28T10:00:00Z' }),
    },
  }),

  oneClassSchool({
    udise: '08020204512',
    schoolName: 'Govt. Sr. Sec. School Jhunjhunu',
    district: 'Jhunjhunu',
    teacherContact: { name: 'Suman Devi', phone: '9414112512' },
    lastActivityLabel: 'Yesterday',
    tour: {
      tour: TOURS.AWS, grade: '7', month: 'July',
      reachData: reach(38),
      student: studentFeedback({ total: 38, rate: 0.82, csat: 4.45, itp: 4.6, completion: 84, date: '2026-07-27T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Suman Devi', nps: 68, benefit: 'Better understanding of cloud infrastructure.', improvement: 'Add a short glossary handout.', date: '2026-07-27T10:00:00Z' }),
    },
  }),

  {
    udise: '08030309876',
    schoolName: 'Govt. Girls Sr. Sec. School Sikar',
    district: 'Sikar',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Kavita Sharma', phone: '9414309876' },
    lastActivityLabel: 'Today',
    classes: [{
      grade: '6', section: '',
      tours: [tourEntry({
        tour: TOURS.FC, grade: '6', month: 'June',
        reachData: reach(36),
        teacher: teacherFeedback({ name: 'Kavita Sharma', nps: 61, benefit: 'Good exposure to automation careers.', improvement: 'More visuals for younger grades.', date: '2026-06-20T10:00:00Z' }),
      })],
    }],
  },

  oneClassSchool({
    udise: '08040411234',
    schoolName: 'Govt. Sr. Sec. School Nagaur',
    district: 'Nagaur',
    teacherContact: { name: 'Vikram Singh', phone: '9414411234' },
    lastActivityLabel: '2 Days Ago',
    tour: {
      tour: TOURS.AM, grade: '6', month: 'June',
      reachData: reach(46),
      student: studentFeedback({ total: 46, rate: 0.9, csat: 4.75, itp: 4.8, completion: 92, date: '2026-06-18T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Vikram Singh', nps: 79, benefit: 'Excellent engagement across the class.', improvement: 'None noted.', date: '2026-06-18T10:00:00Z' }),
    },
  }),

  {
    udise: '08050512987',
    schoolName: 'Rajkiya Uchch Madhyamik Vidyalaya Bikaner',
    district: 'Bikaner',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Anita Rathore', phone: '9414512987' },
    lastActivityLabel: 'Yesterday',
    classes: [{
      grade: '7', section: '',
      tours: [tourEntry({
        tour: TOURS.AWS, grade: '7', month: 'June',
        teacher: teacherFeedback({ name: 'Anita Rathore', nps: 55, benefit: 'Sparked interest in engineering.', improvement: 'Shorter runtime.', date: '2026-06-15T10:00:00Z' }),
      })],
    }],
  },

  {
    udise: '08060613456',
    schoolName: 'Govt. Sr. Sec. School Barmer',
    district: 'Barmer',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Om Prakash', phone: '9414613456' },
    lastActivityLabel: 'Last Week',
    classes: [{
      grade: '8', section: '',
      tours: [tourEntry({ tour: TOURS.FC, grade: '8', month: 'May' })],
    }],
  },

  oneClassSchool({
    udise: '08070714567',
    schoolName: 'Govt. Girls Sr. Sec. School Pali',
    district: 'Pali',
    teacherContact: { name: 'Meena Choudhary', phone: '9414714567' },
    lastActivityLabel: '2 Days Ago',
    tour: {
      tour: TOURS.AM, grade: '6', month: 'May',
      reachData: reach(40),
      student: studentFeedback({ total: 40, rate: 0.85, csat: 4.5, itp: 4.55, completion: 82, date: '2026-05-25T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Meena Choudhary', nps: 71, benefit: 'Great discussion afterwards.', improvement: 'Add a follow-up worksheet.', date: '2026-05-25T10:00:00Z' }),
    },
  }),

  {
    udise: '08080815678',
    schoolName: 'Govt. Sr. Sec. School Tonk',
    district: 'Tonk',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Deepak Jain', phone: '9414815678' },
    lastActivityLabel: 'Today',
    classes: [{
      grade: '7', section: '',
      tours: [tourEntry({
        tour: TOURS.AWS, grade: '7', month: 'May',
        reachData: reach(33),
        teacher: teacherFeedback({ name: 'Deepak Jain', nps: 59, benefit: 'Useful for career-week planning.', improvement: 'More interactivity.', date: '2026-05-20T10:00:00Z' }),
      })],
    }],
  },

  {
    udise: '08090916789',
    schoolName: 'Govt. Sr. Sec. School Dungarpur',
    district: 'Dungarpur',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Sunita Meena', phone: '9414916789' },
    lastActivityLabel: 'Last Week',
    classes: [{
      grade: '6', section: '',
      tours: [tourEntry({ tour: TOURS.FC, grade: '6', month: 'April' })],
    }],
  },

  oneClassSchool({
    udise: '08101017890',
    schoolName: 'Govt. Sr. Sec. School Banswara',
    district: 'Banswara',
    teacherContact: { name: 'Rajesh Panwar', phone: '9415017890' },
    lastActivityLabel: 'Yesterday',
    tour: {
      tour: TOURS.AM, grade: '8', month: 'April',
      reachData: reach(45),
      student: studentFeedback({ total: 45, rate: 0.88, csat: 4.65, itp: 4.7, completion: 89, date: '2026-04-22T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Rajesh Panwar', nps: 77, benefit: 'Very high student engagement.', improvement: 'None noted.', date: '2026-04-22T10:00:00Z' }),
    },
  }),

  {
    udise: '08111118901',
    schoolName: 'Govt. Girls Sr. Sec. School Sirohi',
    district: 'Sirohi',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Poonam Rawat', phone: '9415118901' },
    lastActivityLabel: '2 Days Ago',
    classes: [{
      grade: '7', section: '',
      tours: [tourEntry({
        tour: TOURS.AWS, grade: '7', month: 'April',
        reachData: reach(30),
      })],
    }],
  },

  oneClassSchool({
    udise: '08121219012',
    schoolName: 'Govt. Sr. Sec. School Chittorgarh',
    district: 'Chittorgarh',
    teacherContact: { name: 'Naresh Sharma', phone: '9415219012' },
    lastActivityLabel: 'Today',
    tour: {
      tour: TOURS.FC, grade: '6', month: 'March',
      reachData: reach(41),
      student: studentFeedback({ total: 41, rate: 0.83, csat: 4.4, itp: 4.5, completion: 80, date: '2026-03-18T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Naresh Sharma', nps: 66, benefit: 'Solid overview of automation careers.', improvement: 'Add a teacher discussion guide.', date: '2026-03-18T10:00:00Z' }),
    },
  }),

  {
    udise: '08131320123',
    schoolName: 'Govt. Sr. Sec. School Bhilwara',
    district: 'Bhilwara',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Sanjay Vyas', phone: '9415320123' },
    lastActivityLabel: 'Last Week',
    classes: [{
      grade: '8', section: '',
      tours: [tourEntry({
        tour: TOURS.AM, grade: '8', month: 'March',
        teacher: teacherFeedback({ name: 'Sanjay Vyas', nps: 58, benefit: 'Good class discussion afterward.', improvement: 'Shorter video length.', date: '2026-03-10T10:00:00Z' }),
      })],
    }],
  },

  oneClassSchool({
    udise: '08141421234',
    schoolName: 'Rajkiya Uchch Madhyamik Vidyalaya Alwar',
    district: 'Alwar',
    teacherContact: { name: 'Priya Agarwal', phone: '9415421234' },
    lastActivityLabel: 'Yesterday',
    tour: {
      tour: TOURS.AWS, grade: '7', month: 'March',
      reachData: reach(44),
      student: studentFeedback({ total: 44, rate: 0.87, csat: 4.55, itp: 4.6, completion: 86, date: '2026-03-05T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Priya Agarwal', nps: 73, benefit: 'Students asked great follow-up questions.', improvement: 'None noted.', date: '2026-03-05T10:00:00Z' }),
    },
  }),

  {
    udise: '08151522345',
    schoolName: 'Govt. Sr. Sec. School Bharatpur',
    district: 'Bharatpur',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Mohit Gupta', phone: '9415522345' },
    lastActivityLabel: 'Last Week',
    classes: [{
      grade: '6', section: '',
      tours: [tourEntry({ tour: TOURS.FC, grade: '6', month: 'February' })],
    }],
  },

  {
    udise: '08161623456',
    schoolName: 'Govt. Girls Sr. Sec. School Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Rekha Saini', phone: '9415623456' },
    lastActivityLabel: 'Today',
    classes: [{
      grade: '7', section: '',
      tours: [tourEntry({
        tour: TOURS.AM, grade: '7', month: 'February',
        reachData: reach(39),
        teacher: teacherFeedback({ name: 'Rekha Saini', nps: 64, benefit: 'Increased curiosity about tech roles.', improvement: 'More career pathway detail.', date: '2026-02-20T10:00:00Z' }),
      })],
    }],
  },

  oneClassSchool({
    udise: '08171724567',
    schoolName: 'Govt. Sr. Sec. School Jodhpur',
    district: 'Jodhpur',
    teacherContact: { name: 'Ashok Bishnoi', phone: '9415724567' },
    lastActivityLabel: '2 Days Ago',
    tour: {
      tour: TOURS.AWS, grade: '8', month: 'February',
      reachData: reach(48),
      student: studentFeedback({ total: 48, rate: 0.9, csat: 4.8, itp: 4.85, completion: 93, date: '2026-02-14T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Ashok Bishnoi', nps: 81, benefit: 'One of the strongest sessions this term.', improvement: 'None noted.', date: '2026-02-14T10:00:00Z' }),
    },
  }),

  {
    udise: '08181825678',
    schoolName: 'Govt. Sr. Sec. School Udaipur',
    district: 'Udaipur',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Geeta Mehta', phone: '9415825678' },
    lastActivityLabel: 'Last Week',
    classes: [{
      grade: '6', section: '',
      tours: [tourEntry({ tour: TOURS.AM, grade: '6', month: 'January' })],
    }],
  },

  {
    udise: '08191926789',
    schoolName: 'Govt. Sr. Sec. School Kota',
    district: 'Kota',
    state: 'Rajasthan',
    schoolType: 'Government',
    teacherContact: { name: 'Manoj Bairwa', phone: '9415926789' },
    lastActivityLabel: 'Yesterday',
    classes: [{
      grade: '7', section: '',
      tours: [tourEntry({
        tour: TOURS.FC, grade: '7', month: 'January',
        teacher: teacherFeedback({ name: 'Manoj Bairwa', nps: 52, benefit: 'Useful career-week addition.', improvement: 'Add a printable summary.', date: '2026-01-22T10:00:00Z' }),
      })],
    }],
  },

  oneClassSchool({
    udise: '08202027890',
    schoolName: 'Govt. Sr. Sec. School Ajmer',
    district: 'Ajmer',
    teacherContact: { name: 'Nisha Vaishnav', phone: '9415027890' },
    lastActivityLabel: 'Today',
    tour: {
      tour: TOURS.AM, grade: '8', month: 'January',
      reachData: reach(43),
      student: studentFeedback({ total: 43, rate: 0.86, csat: 4.6, itp: 4.65, completion: 87, date: '2026-01-18T09:00:00Z' }),
      teacher: teacherFeedback({ name: 'Nisha Vaishnav', nps: 70, benefit: 'Strong discussion on future careers.', improvement: 'None noted.', date: '2026-01-18T10:00:00Z' }),
    },
  }),
]
