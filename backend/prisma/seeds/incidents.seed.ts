/**
 * Incident seed data
 * Following TRD.md patterns for seed data
 */
import { PrismaClient, Incident, Room } from '@prisma/client';
import {
  IncidentTypeEnum,
  IncidentClassificationEnum,
  PriorityEnum,
  GeneralStatusEnum,
  SourceEnum,
  StopActivityEnum,
  TreatmentEnum,
  AbsenceEnum,
  GenderEnum,
  LevelOfInjuryEnum,
  InjuredBodyPartEnum,
  TypeOfInjuryEnum,
  MechanismOfInjuryEnum,
} from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to generate incident code: INC-YYYYMMDD-XXXX
const generateIncidentCode = async (dateStr: string): Promise<string> => {
  const prefix = `INC-${dateStr}-`;
  const lastIncident = await prisma.incident.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: 'desc',
    },
  });

  let sequence = 1;
  if (lastIncident) {
    const lastSequence = parseInt(lastIncident.code.slice(-4), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

export const seedIncidents = async () => {
  console.log('🌱 Seeding incidents...');

  try {
    // Fetch required master data
    const users = await prisma.user.findMany({ where: { isActive: true } });
    const areas = await prisma.area.findMany({ where: { isActive: true } });
    const rooms = await prisma.room.findMany({ where: { isActive: true } });
    const riskCategories = await prisma.riskCategory.findMany({
      where: { isActive: true },
    });
    const departments = await prisma.department.findMany({
      where: { isActive: true },
    });

    if (users.length === 0) {
      throw new Error('No users found. Please seed users first.');
    }
    if (areas.length === 0) {
      throw new Error('No areas found. Please seed areas first.');
    }
    if (riskCategories.length === 0) {
      throw new Error('No risk categories found. Please seed risk categories first.');
    }
    if (departments.length === 0) {
      throw new Error('No departments found. Please seed departments first.');
    }

    // Get technicians
    const technicians = users.filter((u) =>
      u.email?.includes('technician')
    );
    const techniciansList = technicians.length > 0 ? technicians : [users[0]];

    // Helper to get random item from array
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomItems = <T>(arr: T[], count: number): T[] => {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, arr.length));
    };

    // Generate dates for incidents (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const generateDate = (daysAgo: number): Date => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date;
    };

    // Mock incident data
    const incidentsData = [
      {
        subject: 'Slip and Fall in Corridor',
        incidentDate: generateDate(5),
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.OPEN,
        description: 'Employee slipped on wet floor in main corridor. Floor was recently mopped but warning signs were not placed.',
        controlMeasure: 'Immediate: Place warning signs. Long-term: Review cleaning procedures and ensure proper signage protocol.',
        dueDate: generateDate(-10), // 10 days from now
        expectedOutcome: 'Improved cleaning procedures and mandatory warning sign placement.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Cleaning activity in the area was stopped until proper safety measures were in place.',
        treatment: TreatmentEnum.FIRST_AID,
        treatmentDescription: 'Minor bruising treated with ice pack and antiseptic.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Cleaning procedures updated. Warning signs now mandatory. Employee returned to work same day.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Chemical Spill in Laboratory',
        incidentDate: generateDate(12),
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.DONE,
        description: 'Chemical container was knocked over during experiment, causing spill of hazardous material. Proper PPE was worn but spill containment was inadequate.',
        controlMeasure: 'Evacuate area. Contain spill using appropriate materials. Review chemical storage and handling procedures.',
        dueDate: generateDate(-5),
        expectedOutcome: 'Improved chemical storage procedures and spill response training.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'All laboratory activities were stopped until area was properly decontaminated.',
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Two personnel received medical evaluation. No serious injuries.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Area decontaminated. New spill response procedures implemented. All personnel trained on new procedures.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Near Miss: Falling Object from Height',
        incidentDate: generateDate(20),
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Tool fell from scaffolding but did not hit anyone. Worker below was wearing hard hat which would have provided protection.',
        controlMeasure: 'Review tool tethering requirements. Ensure all tools are secured when working at height.',
        dueDate: generateDate(-15),
        expectedOutcome: 'All workers at height must use tool tethers. Regular safety inspections implemented.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Tool tethering policy implemented. All workers trained on new requirements.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Electrical Equipment Malfunction',
        incidentDate: generateDate(30),
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.DONE,
        description: 'Electrical panel showed signs of overheating. Equipment was immediately shut down. No fire occurred but potential for serious incident was high.',
        controlMeasure: 'Immediate shutdown. Electrical inspection required. Replace faulty components.',
        dueDate: generateDate(-20),
        expectedOutcome: 'All electrical equipment inspected and maintained. Preventive maintenance schedule updated.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Affected area power was shut down until inspection and repairs were completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Electrical panel repaired. All equipment inspected. Preventive maintenance schedule updated.',
        hasInjuredPerson: false,
        hasWitness: false,
        hasAssets: true,
      },
      {
        subject: 'Workplace Injury: Hand Laceration',
        incidentDate: generateDate(45),
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.CLOSE,
        description: 'Employee cut hand while using cutting tool. Proper gloves were provided but not worn at time of incident.',
        controlMeasure: 'Immediate first aid. Review PPE compliance. Reinforce safety training on proper tool use.',
        dueDate: generateDate(-35),
        expectedOutcome: '100% PPE compliance. Enhanced safety training completed.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Laceration required stitches. Employee received tetanus shot.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'PPE compliance improved. Safety training reinforced. Employee returned to work after medical clearance.',
        hasInjuredPerson: true,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Fire Alarm Activation - False Alarm',
        incidentDate: generateDate(60),
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Fire alarm activated due to smoke from cooking activity. No actual fire. Building was evacuated as per procedure.',
        controlMeasure: 'Review cooking policies. Ensure proper ventilation. Test fire alarm system.',
        dueDate: generateDate(-50),
        expectedOutcome: 'Cooking policies updated. Fire alarm system tested and verified.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Building was evacuated. All activities stopped until all-clear was given.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Cooking policies updated. Fire alarm system tested. All systems operational.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Vehicle Accident in Parking Area',
        incidentDate: generateDate(75),
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.DONE,
        description: 'Two vehicles collided in parking area. Low speed collision. Both vehicles sustained minor damage.',
        controlMeasure: 'Review parking area layout. Consider speed bumps or additional signage. Driver safety training.',
        dueDate: generateDate(-65),
        expectedOutcome: 'Improved parking area safety measures. Driver awareness training completed.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Both drivers received medical evaluation. No serious injuries reported.',
        absence: AbsenceEnum.RETURNED_AFTER_TREATMENT,
        resolution: 'Parking area signage improved. Driver safety training completed. Both parties returned to work.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
      {
        subject: 'Ergonomic Issue: Repetitive Strain',
        incidentDate: generateDate(90),
        incidentType: IncidentTypeEnum.ACCIDENT,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Employee reported wrist pain from repetitive computer work. Early intervention prevented more serious injury.',
        controlMeasure: 'Ergonomic assessment. Provide ergonomic equipment. Review work practices.',
        dueDate: generateDate(-80),
        expectedOutcome: 'All workstations ergonomically assessed. Employees trained on proper ergonomics.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.MEDICAL_TREATMENT,
        treatmentDescription: 'Employee received medical consultation. Ergonomic equipment provided.',
        absence: AbsenceEnum.NOT_YET_KNOWN,
        resolution: 'Ergonomic equipment installed. Work practices reviewed. Employee continues work with accommodations.',
        hasInjuredPerson: true,
        hasWitness: false,
        hasAssets: false,
      },
      {
        subject: 'Gas Leak Detection',
        incidentDate: generateDate(100),
        incidentType: IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
        incidentClassification: IncidentClassificationEnum.MAJOR,
        priority: PriorityEnum.HIGH,
        status: GeneralStatusEnum.DONE,
        description: 'Gas leak detected in kitchen area. Immediate evacuation and gas supply shut off. No ignition occurred.',
        controlMeasure: 'Immediate evacuation. Shut off gas supply. Professional inspection and repair required.',
        dueDate: generateDate(-90),
        expectedOutcome: 'All gas lines inspected. Leak repaired. Enhanced monitoring system installed.',
        needToStopActivity: StopActivityEnum.YES,
        stopActivityDescription: 'Entire building evacuated. Gas supply shut off. Area secured until repair completed.',
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: 'No injuries. All personnel accounted for after evacuation.',
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Gas leak repaired. All lines inspected. Enhanced monitoring system installed. Building reoccupied after safety clearance.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: false,
      },
      {
        subject: 'Near Miss: Forklift Collision Avoidance',
        incidentDate: generateDate(120),
        incidentType: IncidentTypeEnum.NEAR_MISS,
        incidentClassification: IncidentClassificationEnum.MINOR,
        priority: PriorityEnum.NORMAL,
        status: GeneralStatusEnum.CLOSE,
        description: 'Forklift operator avoided collision with pedestrian by emergency stop. Pedestrian was in restricted area without proper authorization.',
        controlMeasure: 'Review pedestrian access controls. Enhance forklift operator training. Improve signage.',
        dueDate: generateDate(-110),
        expectedOutcome: 'Improved access controls. Enhanced training for both operators and pedestrians.',
        needToStopActivity: StopActivityEnum.NO,
        stopActivityDescription: null,
        treatment: TreatmentEnum.NO_TREATMENT,
        treatmentDescription: null,
        absence: AbsenceEnum.NOT_SPECIFIED,
        resolution: 'Access controls improved. Training completed. No incidents since implementation.',
        hasInjuredPerson: false,
        hasWitness: true,
        hasAssets: true,
      },
    ];

    const createdIncidents: Incident[] = [];
    const usedRoomIds = new Set<string>(); // Track used rooms to avoid unique constraint violation

    for (const incidentData of incidentsData) {
      const dateStr = incidentData.incidentDate.toISOString().slice(0, 10).replace(/-/g, '');
      const code = await generateIncidentCode(dateStr);

      // Select random related entities
      const area = randomItem(areas);
      // Only assign a room if there are unused rooms available (roomId has unique constraint)
      let room: Room | null = null;
      if (rooms.length > 0) {
        const availableRooms = rooms.filter((r) => !usedRoomIds.has(r.id));
        if (availableRooms.length > 0) {
          room = randomItem(availableRooms);
          usedRoomIds.add(room.id);
        }
      }
      const riskCategory = randomItem(riskCategories);
      const requester = randomItem(users);
      const reporter = randomItem(users);
      const technician = Math.random() > 0.5 ? randomItem(techniciansList) : null;
      const assignedDepartment = randomItem(departments);
      const assignee = Math.random() > 0.7 ? randomItem(users) : null;
      const creator = randomItem(users);

      // Create injured persons if needed
      const injuredPersons = incidentData.hasInjuredPerson
        ? [
            {
              injuredPersonName: 'John Doe',
              gender: GenderEnum.MALE,
              levelOfInjury: LevelOfInjuryEnum.MINOR,
              injuredBodyPart: InjuredBodyPartEnum.HAND,
              typeOfInjury: TypeOfInjuryEnum.LACERATION,
              mechanismOfInjury: MechanismOfInjuryEnum.HAND_TOOLS,
              departmentId: randomItem(departments).id,
              order: 1,
            },
          ]
        : [];

      // Create witnesses if needed
      const witnesses = incidentData.hasWitness
        ? [
            {
              witnessName: 'Jane Smith',
              gender: GenderEnum.FEMALE,
              departmentId: randomItem(departments).id,
              order: 1,
            },
            ...(Math.random() > 0.5
              ? [
                  {
                    witnessName: 'Bob Johnson',
                    gender: GenderEnum.MALE,
                    departmentId: randomItem(departments).id,
                    order: 2,
                  },
                ]
              : []),
          ]
        : [];

      // Create assets if needed
      const assets = incidentData.hasAssets
        ? [
            {
              assetName: 'Safety Equipment',
              assetCode: 'SAFE-001',
              quantity: 1,
              order: 1,
            },
            ...(Math.random() > 0.5
              ? [
                  {
                    assetName: 'Tool Set',
                    assetCode: 'TOOL-001',
                    quantity: 1,
                    order: 2,
                  },
                ]
              : []),
          ]
        : [];

      const incident = await prisma.incident.create({
        data: {
          code,
          subject: incidentData.subject,
          incidentDate: incidentData.incidentDate,
          roomId: room?.id,
          areaId: area.id,
          incidentType: incidentData.incidentType,
          incidentClassification: incidentData.incidentClassification,
          requesterId: requester.id,
          reportedBy: reporter.id,
          technicianId: technician?.id,
          priority: incidentData.priority,
          riskCategoryId: riskCategory.id,
          description: incidentData.description,
          controlMeasure: incidentData.controlMeasure,
          dueDate: incidentData.dueDate,
          expectedOutcome: incidentData.expectedOutcome,
          needToStopActivity: incidentData.needToStopActivity,
          stopActivityDescription: incidentData.stopActivityDescription,
          treatment: incidentData.treatment,
          treatmentDescription: incidentData.treatmentDescription,
          absence: incidentData.absence,
          resolution: incidentData.resolution,
          assignedDepartmentId: assignedDepartment.id,
          assigneeId: assignee?.id,
          status: incidentData.status,
          source: SourceEnum.SYSTEM,
          isActive: true,
          createdBy: creator.id,
          injuredPersons: injuredPersons.length > 0 ? { create: injuredPersons } : undefined,
          witnesses: witnesses.length > 0 ? { create: witnesses } : undefined,
          assets: assets.length > 0 ? { create: assets } : undefined,
        },
      });

      createdIncidents.push(incident);
      console.log(`✅ Created incident: ${incident.code} - ${incident.subject}`);
    }

    console.log(`✅ Incidents seeded successfully`);
    console.log(`   - Created ${createdIncidents.length} incidents`);

    return createdIncidents;
  } catch (error) {
    console.error('❌ Error seeding incidents:', error);
    throw error;
  }
};

export default seedIncidents;
